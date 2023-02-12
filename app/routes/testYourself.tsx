import { Outlet, Link } from "@remix-run/react";
import { Disclosure,Transition } from "@headlessui/react";
import { ChevronUpIcon} from "@heroicons/react/solid";
import Input from "components/input/input";
import { ExerciseNavList } from "../../services/models/models";
import {useState,useCallback} from 'react';
import "react-cmdk/dist/cmdk.css";
import Modal from "components/modal/modal";
import Kbar from "components/kbar/kbar";



const TestYourself = () => {
  const [links] = useState(ExerciseNavList);
  const [searchValue,setSearchValue] = useState('initial');
  const [page, setPage] = useState<"root" | "projects">("root");
  const [open, setOpen] = useState<boolean>(true);
  const [search, setSearch] = useState("");

  const searchHandler=useCallback((evt:any)=>{
    if(!evt.target.value){
      setSearchValue('initial');
    }else{
      setSearchValue(evt.target.value);
    }
    
  },[])
 
  return (
    <>
    <Kbar/>
    <div className="flex">
      <div className="flex flex-col h-screen p-3 bg-white shadow-2xl ring-2 ring-gray-200 w-60">
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="mt-1">
              <Input onChangeCallback={searchHandler}/>
            </div>
          </div>
          <div className="flex-1">
            <Transition  
              show={links.length>0} 
              enter="transition-opacity duration-150"
              enterFrom="opacity-20"
              enterTo="opacity-100"
              leave="transition-opacity duration-350"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
            <div className="my-5">
              {links.filter(i=>{
                if(searchValue==='initial') return ExerciseNavList
                 return i.title.toLowerCase().includes(searchValue?.toLowerCase())
              }).map((item) => {
                return (
                  <Disclosure key={item.id}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex w-full justify-between rounded-lg  px-4 py-2 text-left text-sm font-medium text-orange-900 hover:bg-orange-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-75">
                          <span>{item.title}</span>
                          <ChevronUpIcon
                            className={`${
                              open ? "rotate-180 transform" : ""
                            } h-5 w-5 text-orange-500`}
                          />
                        </Disclosure.Button>
                        {item.subTitles.map((sub) => {
                          return (
                            <Disclosure.Panel className="px-8 p-2 text-sm text-black-500" key={sub.id}>
                              <Link
                                to={sub.link}
                                className="flex items-center space-x-3 rounded-md text-orange-800  hover:bg-orange-200"
                              >
                                <span>{sub.title}</span>
                              </Link>
                            </Disclosure.Panel>
                          );
                        })}
                      </>
                    )}
                  </Disclosure>
                );
              })}
            </div>
            </Transition>
          </div>
        </div>
      </div>
    
      <main id="content" className="flex-1 p-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  </>
  );
};

export default TestYourself;
