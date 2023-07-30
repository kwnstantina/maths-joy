import { Key } from "react";
import { dateTimeFormat,starterLetters } from "../../../utils/utils";
import {decode} from 'html-entities';
type Message = {
  user: any;
  id: Key;
  user_id: string;
  content: string;
  created_at: string;
  profilePicture:string;
};
type Props = {
  messages: Array<Message>;
  data: any;
  isPosting: boolean;
};

const ChatContent = (props: Props) => {
  const { messages, data, isPosting } = props;
  return (
    <>
    <div className="relative w-full p-6 overflow-y-auto h-[40rem] bg-gray-200	">
      {messages?.map((message: Message) => {
        return (
          <ul className="space-y-2" key={message.id}>
            <li
              className={`${
                message.user_id === data.user?.id
                  ? "flex justify-end mb-2"
                  : "flex justify-start"
              } `}
            >
              <div
                className={`${
                  message.user_id === data.user?.id
                    ? "flex justify-end mb-2"
                    : "flex flex-row-reverse	"
                } `}
              >
                <div className="relative max-w-xl px-4 py-2 text-gray-700 rounded shadow">
                  <span className="block">{decode(message.content)}</span>
                </div>
                <a  className={"flex items-center px-3 py-2 transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none"}>
                   {/* {message.user_id === data.user?.id && data.user?.profile?.profilePicture? */}
                  {message?.user?.profilePicture?
                   <img
                    className="object-cover w-10 h-10 rounded-full"
                    src={message?.user?.profilePicture}
                    alt="username"
                  /> :
                  <div  className="text-center items-center w-10 h-10 rounded-full" 
                  style={{background:`${message?.user?.color}`}}
      
                  >
                     <p className="text-lg pt-2">{starterLetters(data.user?.profile?.firstName,data.user?.profile?.lastName)}</p>
                  </div>
                }
                </a>
              </div>
            </li>
            <div className="w-full pb-2">
              <div
                className={`${
                  message.user_id === data.user?.id
                    ? "flex justify-end mb-2 text-gray-400 text-sm"
                    : "flex justify-start text-gray-400 text-sm"
                }`}
              >
                {dateTimeFormat(message.created_at)}
              </div>
            </div>
          </ul>
        );
      })}
      {isPosting && (
        <div className="flex items-center justify-end space-x-2 animate-bounce">
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-[wiggle_3s_ease-in-out_infinite]"></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-[wiggle_3s_ease-in-out_infinite]"></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-[wiggle_3s_ease-in-out_infinite]"></div>
        </div>
      )}
      {/* <div className="inline-flex items-center justify-center w-full">
       <hr className="w-64 h-px my-8 bg-orange-200 border-0 dark:bg-gray-700"/>
     <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2  left-1/2 dark:text-white dark:bg-gray-900">{"10:09"}</span>
     </div> */}
    </div>
    <div>
            <button className="fixed bottom-4 right-4 p-4 bg-blue-500 text-white rounded" onClick={()=>console.log('s')}>
          Scroll to Top
        </button>
    
    </div>
    </>
  );
};

export default ChatContent;
