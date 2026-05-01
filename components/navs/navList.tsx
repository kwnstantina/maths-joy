import { useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { NavLink } from "@remix-run/react";
import UserSettings from "./userSettings";
import logo from "../../app/assets/logoD.png";
import useDetectOutside from "hooks/useDetectOutside";
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

import LanguageIndicator from "components/languageIndicator/languageIndicator";
import { useTranslation } from "react-i18next";
import { isAdmin } from "~/utils/roles";

interface NavbarUser {
  id: string;
  email: string;
  role: string;
  profile: { firstName: string; lastName: string } | null;
}

interface NavbarProps {
  user: NavbarUser | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const { t } = useTranslation();
  const isLoggedIn = !!user;
  const userIsAdmin = isAdmin(user);
  const [nav, setNav] = useState(false);
  const handleClick = () => setNav(!nav);
  const closeModal = () => setNav(false);

  const activeStyle = {
    textDecoration: "underline",
  };
  const wrapperRef = useRef(null);

  useDetectOutside(wrapperRef, closeModal);

  return (
    <div ref={wrapperRef} className="md:mx-12 mt-10  text-center h-40 md:h-20 z-50">
      <div className="flex justify-between items-center w-full h-full">
        <div>
          <NavLink to="/" aria-label="GregKyrMaths - Home">
            <img className="w-32 h-20" src={logo} alt="GregKyrMaths" />
          </NavLink>
        </div>
        <div className="mr-32">
          <ul className="hidden md:flex z-index-100">
            <li>
              <NavLink
                to="exercises"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("exersice")}
              </NavLink>
            </li>

            <li>
              <NavLink
                to="books"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("nav.books")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="testYourself"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("training")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="videos"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("topic")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="qa"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("nav.qa")}
              </NavLink>
            </li>
            <li>
              <UserSettings user={user} />
            </li>
          </ul>
        </div>

        <button
          type="button"
          className="md:hidden mr-4 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded"
          onClick={handleClick}
          aria-expanded={nav}
          aria-controls="mobile-nav-menu"
          aria-label={nav ? t("nav.closeMenu", "Close menu") : t("nav.openMenu", "Open menu")}
        >
          {!nav ? <Bars3Icon className="w-8" aria-hidden="true" /> : <XMarkIcon className="w-8" aria-hidden="true" />}
        </button>
        <div >
          <LanguageIndicator />
        </div>
      </div>
      <ul
        id="mobile-nav-menu"
        className={!nav ? "hidden" : "absolute bg-orange-600 w-3/4 px-8 z-100"}
      >
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="exercises"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("exersice")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="tutorial"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("topic")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="books"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("nav.books")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="testYourself"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("training")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="videos"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("nav.videos", "Βίντεο")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="qa"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("nav.qa")}
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="chat"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            {t("nav.chat")}
          </NavLink>
        </li>

        {/* Admin link - only visible to admins */}
        {userIsAdmin && (
          <li className="border-b-2 border-orange-300 w-full">
            <NavLink
              to="admin"
              className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              onClick={handleClick}
            >
              <span className="flex align-center justify-center">
                <Cog6ToothIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Admin
              </span>
            </NavLink>
          </li>
        )}

        {/* User profile link - visible to logged in users */}
        {isLoggedIn && (
          <li className="border-b-2 border-orange-300 w-full">
            <NavLink
              to="progress"
              className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              onClick={handleClick}
            >
              <span className="flex align-center justify-center">
                <UserIcon className="mr-2 h-5 w-5" aria-hidden="true" /> {t("user")}
              </span>
            </NavLink>
          </li>
        )}

        {/* Login - only visible when not logged in */}
        {!isLoggedIn && (
          <li className="border-b-2 border-orange-300 w-full">
            <NavLink
              to="login"
              className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              onClick={handleClick}
            >
              <span className="flex align-center justify-center">
                <ArrowRightIcon className="mr-2 h-5 w-5" aria-hidden="true" /> {t("nav.login")}
              </span>
            </NavLink>
          </li>
        )}

        {/* Logout - only visible when logged in */}
        {isLoggedIn && (
          <li className="border-b-2 border-orange-300 w-full">
            <NavLink
              className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              onClick={handleClick}
              to={"logout"}
            >
              <span className="flex align-center justify-center">
                <ArrowRightIcon className="mr-2 h-5 w-5" aria-hidden="true" /> {t("nav.logout")}
              </span>
            </NavLink>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Navbar;
