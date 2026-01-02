import { Menu, Transition ,MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, UserIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, InboxIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { Link } from "@remix-run/react";
import { useTranslation } from 'react-i18next';
import { isAdmin } from '~/utils/roles';

interface UserSettingsUser {
  id: string;
  email: string;
  role: string;
  profile: { firstName: string; lastName: string } | null;
}

interface UserSettingsProps {
  user: UserSettingsUser | null;
}

const UserSettings = ({ user }: UserSettingsProps) => {
  const { t } = useTranslation();
  const isLoggedIn = !!user;
  const userIsAdmin = isAdmin(user);

  return (
    <div className="z-50">
      <Menu as="div" className="ml-2 relative inline-block text-left z-50">
        <div>
          <MenuButton className="z-50 inline-flex justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            <UserCircleIcon className="h-5 w-5" />
            <ChevronDownIcon
              className="ml-2 -mr-1 h-5 w-5 text-orange-200 hover:text-orange-300"
              aria-hidden="true"
            />
          </MenuButton>
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
          <MenuItems className="z-50 absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              {/* Admin link - only visible to admins */}
              {userIsAdmin && (
                <MenuItem>
                  {({ active }) => (
                    <Link
                      to="uploadEx"
                      className={`${
                        active ? 'bg-orange-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Cog6ToothIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Admin
                    </Link>
                  )}
                </MenuItem>
              )}

              {/* User profile - visible to logged in users */}
              {isLoggedIn && (
                <MenuItem>
                  {({ active }) => (
                    <Link
                      to="progress"
                      className={`${
                        active ? 'bg-orange-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <UserIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      {t('user')}
                    </Link>
                  )}
                </MenuItem>
              )}

              {/* Notifications - visible to logged in users */}
              {isLoggedIn && (
                <MenuItem>
                  {({ active }) => (
                    <button
                      disabled
                      className={`${
                        active ? 'bg-orange-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm opacity-50`}
                    >
                      <InboxIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      {t('notifications')}
                    </button>
                  )}
                </MenuItem>
              )}
            </div>

            <div className="px-1 py-1">
              {/* Login - only visible when not logged in */}
              {!isLoggedIn && (
                <MenuItem>
                  {({ active }) => (
                    <Link
                      className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      to="login"
                    >
                      <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      {t('nav.login')}
                    </Link>
                  )}
                </MenuItem>
              )}

              {/* Logout - only visible when logged in */}
              {isLoggedIn && (
                <MenuItem>
                  {({ active }) => (
                    <Link
                      className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      to="logout"
                    >
                      <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      {t('nav.logout')}
                    </Link>
                  )}
                </MenuItem>
              )}
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
};

export default UserSettings;
