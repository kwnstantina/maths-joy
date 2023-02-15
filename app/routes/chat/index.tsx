import { useLoaderData } from "@remix-run/react";
import supabase from "../../../utils/supabase";
import { LoaderFunction, redirect,json } from "@remix-run/node";
import { Key } from "react";
import { chatAuthorization} from "~/utils/auth.prisma";
import { Form } from "@remix-run/react";


export const loader: LoaderFunction = async ({ request }) => {
  let user =await chatAuthorization(request);
  if(!user){
     return redirect("/login");
  }
  const messages = await supabase.from("messages").select();
  const users= await supabase.from("users").select();
  return json({messages,users});
};

const Chat = () => {
  const data: any = useLoaderData();

  return (
    <div className="container mx-auto my-10 border border-slate-400	 rounded z-[-1]">
      <div className="min-w-full border rounded lg:grid lg:grid-cols-3">
        <div className="border-r border-gray-300 lg:col-span-1">
          <ul className="overflow-auto h-[32rem]">
            <h2 className="my-2 mb-2 ml-2 text-lg text-gray-600">
              Χρήστες
            </h2>
            {data.users.data.map((item:any)=>{
              return(
                <li>
                <a className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
                  <img
                    className="object-cover w-10 h-10 rounded-full"
                    src="https://cdn.pixabay.com/photo/2018/09/12/12/14/man-3672010__340.jpg"
                    alt="username"
                  />
                  <div className="w-full pb-2">
                    <div className="flex justify-between">
                      <span className="block ml-2 font-semibold text-gray-600">
                       {item.firstName}
                      </span>
                    </div>
                  </div>
                </a>
                </li>
              )
            })}
          </ul>
        </div>
        <Form method="post" action="/messages">
        <div className="sm:none lg:col-span-2 lg:block">
          <div className="w-full">
            <div className="relative w-full p-6 overflow-y-auto h-[40rem] bg-gray-200	">
              {data.messages.data.map(
                (message: {
                  id: Key | null | undefined;
                  userId: string;
                  content: any;
                }) => {
                  return (
                    <ul className="space-y-2" key={message.id}>
                      {message.userId === "kostas" && (
                        <li className="flex justify-start">
                          <div className="relative max-w-xl px-4 py-2 text-gray-700 rounded shadow">
                            <span className="block">{message.content}</span>
                          </div>
                        </li>
                      )}
                      <li className="flex justify-end mb-2">
                        <div className="relative max-w-xl px-4 py-2 text-black bg-orange-300 rounded shadow">
                          <span className="block">{message.content}</span>
                        </div>
                        <a className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
                          <img
                            className="object-cover w-10 h-10 rounded-full"
                            src="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg"
                            alt="username"
                          />
                          <div className="w-full pb-2">
                            <div className="flex justify-between"></div>
                          </div>
                        </a>
                      </li>
                    </ul>
                  );
                }
              )}
              {/* <div className="inline-flex items-center justify-center w-full">
             <hr className="w-64 h-px my-8 bg-orange-200 border-0 dark:bg-gray-700"/>
           <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2  left-1/2 dark:text-white dark:bg-gray-900">{"10:09"}</span>
           </div> */}
            </div>

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
        </Form>
      </div>
    </div>
  );
};

export default Chat;
