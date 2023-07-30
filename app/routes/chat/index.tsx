import { useLoaderData, useTransition, useCatch, Link } from "@remix-run/react";
import supabase from "../../../utils/supabase";
import { LoaderFunction, redirect, json, ActionArgs } from "@remix-run/node";
import { useEffect, useMemo, useState } from "react";
import { chatAuthorization } from "~/utils/auth.prisma";
import { Form } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import ChatContent from "components/chat/chatContent/chatContent";
import UserContent from "components/chat/chatContent/userContent";
import dataEmojie from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import xss from "xss";

export const loader: LoaderFunction = async ({ request }) => {
  let user = await chatAuthorization(request);
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  if (!user) {
    return redirect("/login");
  }
  const messages: any = await supabase.from("messages").select();
  const users: any = await supabase.from("users").select();


  // Create a new object with nested user information
  const messagesWithUserInfo = messages?.data?.map((message: any) => {
    const userId = message.user_id;
    const user = users.data.find((user: any) => user.id === userId);
    return {
      ...message,
      user: user,
    };
  });
  const userId = await supabase
    .from("users")
    .select()
    .eq("provider_id", user.id);

  user = {
    ...user,
    id: userId?.data?.find((item) => item.id)?.id,
    isActive: true,
  };

  return json({ messagesWithUserInfo, users, env, user });
};

export const action = async ({ request }: ActionArgs) => {
  const response = new Response();
  let user = await chatAuthorization(request);
  const userId = await supabase
    .from("users")
    .select()
    .eq("provider_id", user.id);
  const { message } = Object.fromEntries(await request.formData());
  const { messageToDom } = (await supabase.from("messages").insert([
    {
      content: xss(String(message)),
      user_id: userId.data?.find((item) => item.id)?.id,
    },
  ])) as any;

  return json(null, { headers: response.headers });
};

const Chat = () => {
  const data: any = useLoaderData();
  const transition = useTransition();
  const [supabaseClient] = useState(() =>
    createBrowserClient(data.env.SUPABASE_URL, data.env.SUPABASE_ANON_KEY)
  );
  const [messages, setMessages] = useState<any>(data.messagesWithUserInfo);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showButton, setShowButton] = useState(false);

  const isPosting = transition.state === "submitting";

  useEffect(() => {
    const channel = supabaseClient
      .channel("*")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          const senderId = newMessage.user_id;
          const user = data.users.data.find(
            (user: any) => user.id === senderId
          );
          const newUserMessage = { ...newMessage, user: user };
          if (
            !messages.find(
              (message: { id: string }) => message.id === newMessage.id
            )
          ) {
            setMessages([...messages, newUserMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      setMessage("");
    };
  }, [supabaseClient, messages, data.users]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
      setShowButton(scrollTop > clientHeight);

      if (scrollTop + clientHeight === scrollHeight) {
        // User has scrolled to the bottom
        // Add logic to display a button or perform an action
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  

  const handleEmojiClick = (emoji: any) => {
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
export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div className="text-red-500 h-full">Κάτι πήγε στραβά</div>;
  }
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (error instanceof Error) {
    return (
      <main className="text-center flex justify-center h-full ">
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
  return <div className="text-red-500 h-full ">Κάτι πήγε στραβά!</div>;
}
export default Chat;
