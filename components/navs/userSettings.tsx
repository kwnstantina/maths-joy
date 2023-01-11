import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon,ViewListIcon,UserIcon,LoginIcon,LogoutIcon,InboxIcon } from '@heroicons/react/solid';
import { useNavigate } from "react-router-dom";
import { Link } from "@remix-run/react";
const  UserSettings=()=> {
  const navigate = useNavigate();
  return (
    <div className=" w-56 text-right">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            <ViewListIcon className="h-5 w-5" />
            <ChevronDownIcon
              className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-violet-500 text-white' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {active ? (
                      <UserIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <UserIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                    Χρήστης
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-violet-500 text-white' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {active ? (
                      <InboxIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <InboxIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                    Ειδοποιήσεις
                  </button>
                )}
              </Menu.Item>
            </div>
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`} 
                    to={'login'}                  >
                    {active ? (
                      <LoginIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                        //onClick={()=> navigate('/login', { replace: false })}
                      />
                    ) : (
                      <LoginIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                        //onClick={()=> navigate('/login', { replace: false })}
                      />
                    )}
                    Log in
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-violet-500 text-white' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {active ? (
                      <LogoutIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogoutIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                    Log out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}



export default UserSettings;