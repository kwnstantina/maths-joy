import { useRef, useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { NavLink } from "@remix-run/react";
import UserSettings from "./userSettings";
import logo from "../../app/assets/logoD.png";
import useDetectOutside from "hooks/useDetectOutside";
import {

  UserIcon,
  LoginIcon,
  LogoutIcon,

} from "@heroicons/react/solid";

import LanguageIndicator from "components/languageIndicator/languageIndicator";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();
  const [nav, setNav] = useState(false);
  const handleClick = () => setNav(!nav);
  const closeModal = () => setNav(false);

  const activeStyle = {
    textDecoration: "underline",
  };
  const wrapperRef = useRef(null);

  useDetectOutside(wrapperRef, closeModal);

  return (
    <div ref={wrapperRef} className="md:mx-20 mt-10  text-center h-40 md:h-20">
      <div className="px-2 flex justify-between items-center w-full h-full">
        <div>
          <NavLink to="/">
            <img className="w-32 h-20" src={logo}></img>
          </NavLink>
        </div>
        <div>
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
                to="tutorial"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("topic")}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="chat"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                Chat
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
              <UserSettings />
            </li>
          </ul>
        </div>
        <li className="list-none visible md:visible sm:invisble xs:invisible">
          <LanguageIndicator />
        </li>
        <div className="md:hidden mr-4" onClick={handleClick}>
          {!nav ? <MenuIcon className="w-8" /> : <XIcon className="w-8" />}
      
        </div>
        <div className="w-20">
        <LanguageIndicator />
        </div>
      </div>
      <ul
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
            to="chat"
            className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Chat
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
            to="uploadEx"
            className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            <span className="flex align-center justify-center">
            <UserIcon className="mr-2 h-5 w-5" aria-hidden="true" /> {t("user")}
            </span>
          
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="login"
            className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            <span className="flex align-center justify-center">
            <LoginIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Login in 
            </span>
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
            to={"logout"}
          >
            <span className="flex align-center justify-center">
            <LogoutIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Logout
            </span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
