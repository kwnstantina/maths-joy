import { useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import supabase from "../../utils/supabase";
import type { LoaderFunction, ActionFunctionArgs } from "@remix-run/node";
import { redirect, data } from "@remix-run/node";
import { useEffect, useState } from "react";
import { chatAuthorization } from "~/utils/auth.prisma";
import { Form } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import ChatContent from "components/chat/chatContent/chatContent";
import UserContent from "components/chat/chatContent/userContent";
import dataEmojie from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import xss from "xss";

// Type definitions
interface ChatUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  color?: string;
  isActive?: boolean;
  provider_id?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: ChatUser;
}

interface LoaderData {
  messagesWithUserInfo: ChatMessage[];
  users: { data: ChatUser[] };
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string };
  user: ChatUser & { profile?: { firstName: string; lastName: string } };
}

interface EmojiData {
  native: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  let user = await chatAuthorization(request);
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  if (!user) {
    return redirect("/login");
  }

  // Fetch messages and users with error handling
  const { data: messagesData, error: messagesError } = await supabase.from("messages").select();
  const { data: usersData, error: usersError } = await supabase.from("users").select();

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }
  if (usersError) {
    console.error("Error fetching users:", usersError);
  }

  // Create a new object with nested user information
  const messagesWithUserInfo = (messagesData || []).map((message: ChatMessage) => {
    const userId = message.user_id;
    const messageUser = (usersData || []).find((u: ChatUser) => u.id === userId);
    return {
      ...message,
      user: messageUser,
    };
  });

  const { data: userIdData } = await supabase
    .from("users")
    .select()
    .eq("provider_id", user.id);

  user = {
    ...user,
    id: userIdData?.find((item: ChatUser) => item.id)?.id,
    isActive: true,
  };

  return data({ messagesWithUserInfo, users: { data: usersData || [] }, env, user });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const user = await chatAuthorization(request);
  const { data: userIdData } = await supabase
    .from("users")
    .select()
    .eq("provider_id", user.id);
  const { message } = Object.fromEntries(await request.formData());

  await supabase.from("messages").insert([
    {
      content: xss(String(message)),
      user_id: userIdData?.find((item: ChatUser) => item.id)?.id,
    },
  ]);

  return data(null, { headers: response.headers });
};

const Chat = () => {
  const data = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const [supabaseClient] = useState(() =>
    createClient(data.env.SUPABASE_URL, data.env.SUPABASE_ANON_KEY)
  );
  const [messages, setMessages] = useState<ChatMessage[]>(data.messagesWithUserInfo);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const isPosting = navigation.state === "submitting";

  // Fix memory leak: use functional setState and remove messages from dependencies
  useEffect(() => {
    const channel = supabaseClient
      .channel("*")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: ChatMessage }) => {
          const newMessage = payload.new;
          const senderId = newMessage.user_id;
          const messageUser = data.users.data.find(
            (u: ChatUser) => u.id === senderId
          );
          const newUserMessage: ChatMessage = { ...newMessage, user: messageUser };
          // Use functional update to avoid stale closure
          setMessages((prevMessages: ChatMessage[]) => {
            if (prevMessages.find((m) => m.id === newMessage.id)) {
              return prevMessages; // Message already exists
            }
            return [...prevMessages, newUserMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      setMessage("");
    };
  }, [supabaseClient, data.users.data]); // Removed messages from deps to fix memory leak

  const handleEmojiClick = (emoji: EmojiData) => {
    const emojiCode = emoji.native;
    setMessage((prev) => prev + emojiCode);
  };
  const onChangeHandler = (e: { target: { value: string } }) => {
    setMessage(e.target.value);
  };

  return (
    <>
      <Form method="post">
        <div className="container mx-auto my-10 border border-slate-400	 rounded z-[-1]">
          <div className="min-w-full border rounded lg:grid lg:grid-cols-3">
            <div className="border-r border-gray-300 lg:col-span-1">
              <ul className="overflow-auto h-[32rem]">
                <h2 className="my-2 mb-2 ml-2 text-lg text-gray-600">
                  Χρήστες
                </h2>
                <UserContent users={data?.users} />
              </ul>
            </div>
            <div className="sm:none lg:col-span-2 lg:block">
              <div className="w-full">
                <ChatContent
                  messages={messages}
                  data={data}
                  isPosting={isPosting}
                />
                <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Γράψε το μήνυμα σου!"
                    className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                    name="message"
                    required
                    value={message}
                    onChange={onChangeHandler}
                  />
                  <button type="submit" name="intent">
                    <svg
                      className="w-5 h-5 text-gray-500 origin-center transform rotate-90"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
                <div>
                  {showEmojiPicker && (
                    <Picker
                      onEmojiSelect={handleEmojiClick}
                      onClickOutside={() =>
                        setShowEmojiPicker(!showEmojiPicker)
                      }
                      data={dataEmojie}
                      previewPosition="top"
                      skin={3}
                      style={{
                        marginTop: "30px",
                        zIndex: 9999,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
};
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <div className="text-red-500 h-full">Κάτι πήγε στραβά</div>;
    }
    return (
      <div className="text-red-500 h-full">
        Error {error.status}: {error.statusText}
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <main className="text-center flex justify-center h-full">
        <div className="max-w-lg">
          <div className="text-black-500">
            Κάτι πήγε στραβά! Παρακαλώ επικοινωνήστε με τον διαχειριστή.
          </div>
          <Link className="text-orange-500 underline" to="/">
            Πίσω στην αρχική
          </Link>
        </div>
      </main>
    );
  }
  return <div className="text-red-500 h-full">Κάτι πήγε στραβά!</div>;
}
export default Chat;
