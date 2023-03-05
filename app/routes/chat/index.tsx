import {useLoaderData } from "@remix-run/react";
import supabase from "../../../utils/supabase";
import { LoaderFunction, redirect,json, ActionArgs } from "@remix-run/node";
import { Key, useEffect,useRef,useState } from "react";
import { chatAuthorization} from "~/utils/auth.prisma";
import { Form } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import ChatContent from "components/chat/chatContent/chatContent";
import UserContent from "components/chat/chatContent/userContent";


// user Id is the same how sent the message
// image of user
// error boundaris
export const loader: LoaderFunction = async ({ request }) => {
  let user =await chatAuthorization(request);
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  if(!user){
     return redirect("/login");
  }
  const messages = await supabase.from("messages").select();
  const users= await supabase.from("users").select();
  const userId= await supabase.from("users").select().eq('provider_id',user.id);

 user={
    ...user,
    id:userId?.data?.find(item=>item.id)?.id
  }
  return json({messages,users,env,user});
};
 
export const action = async ({request}:ActionArgs)=>{
  const response = new Response();
  let user =await chatAuthorization(request);
  const userId= await supabase.from("users").select().eq('provider_id',user.id);
  const {message} = Object.fromEntries(await request.formData());
  const {messageToDom}=await  supabase.from('messages') .insert([
    {'content': String(message), 
    'user_id': userId.data?.find(item=>item.id)?.id
  }
  ]) as any;

  return json(null,{headers:response.headers});
}

const Chat = () => {
  const data: any = useLoaderData();
  const [supabaseClient] = useState(() =>
  createBrowserClient(data.env.SUPABASE_URL, data.env.SUPABASE_ANON_KEY));
 const [messages, setMessages] = useState(data.messages.data);

 let formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const channel = supabaseClient
      .channel("*")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
  
          if (!messages.find((message: { id: string; }) => message.id === newMessage.id)) {
            setMessages([...messages, newMessage]);
          }
        }
      )
      .subscribe();
  
    return () => {
      supabaseClient.removeChannel(channel);
        formRef.current?.reset();
    };
  }, [supabaseClient, messages])

  return (
   <Form method="post"  ref={formRef} >
    <div className="container mx-auto my-10 border border-slate-400	 rounded z-[-1]">
      <div className="min-w-full border rounded lg:grid lg:grid-cols-3">
        <div className="border-r border-gray-300 lg:col-span-1">
          <ul className="overflow-auto h-[32rem]">
            <h2 className="my-2 mb-2 ml-2 text-lg text-gray-600">
              Χρήστες
            </h2>
             <UserContent users={data?.users}/>
          </ul>
        </div>
        <div className="sm:none lg:col-span-2 lg:block">
          <div className="w-full">
            <ChatContent messages={messages} data={data}/>
            <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
              <button>
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
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Message"
                className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                name="message"
                required
              
              />
              <button type="submit">
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
          </div>
        </div>       
      </div>
    </div>
    </Form> 
  );
};

export default Chat;

