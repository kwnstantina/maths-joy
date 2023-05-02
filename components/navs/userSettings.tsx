import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon,ViewListIcon,UserIcon,LoginIcon,LogoutIcon,InboxIcon } from '@heroicons/react/solid';
import {Link} from "@remix-run/react";

const  UserSettings=()=> {  
  return (
    <div className="z-50">
      <Menu as="div" className="ml-2 relative inline-block text-left z-50">
        <div>
          <Menu.Button className="z-50 inline-flex justify-center rounded-md bg-orange-600  px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            <ViewListIcon className="h-5 w-5" />
            <ChevronDownIcon
              className="ml-2 -mr-1 h-5 w-5 text-orange-200 hover:text-orange-300"
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
          <Menu.Items className="z-50 absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <Link
                  to='uploadEx'
                    className={`${
                      active ? 'bg-orange-500 text-white' : 'text-gray-900'
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
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                   disabled
                    className={`${
                      active ? 'bg-orange-500 text-white' : 'text-gray-900'
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
                    className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`} 
                    to={'login'}                  >
                    {active ? (
                      <LoginIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <LoginIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"                 
                      />
                    )}
                    Log in
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                  className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`} 
                  to={'logout'}                  >
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
                </Link>
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