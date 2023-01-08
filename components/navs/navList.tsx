import { useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { NavLink } from "@remix-run/react";
import UserSettings from "./userSettings";
import logo from '../../app/assets/logoC.png';

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const handleClick = () => setNav(!nav);

  const activeStyle = {
    textDecoration: "underline",
  };

  return (
    <div className="w-full h-[80px] z-10 bg-blue-600  drop-shadow-lg">
      <div className="px-2 flex justify-between items-center w-full h-full">
        <div className="flex items-center">
          <div>
            <img className=" w-32 h-20" src={logo}></img>
          </div>
        </div>
        <div>
            <ul className="hidden md:flex">
              <li>
                <NavLink
                  to="exercises"
                  className="hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Ασκήσεις
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="tutorials"
                  className="hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Διδακτικό υλικό
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="books"
                  className="hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Βιβλία
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="aboutUs"
                  className="hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Σχετικά με εμάς
                </NavLink>
              </li>
            </ul>
          </div>
        <div className="hidden md:flex pr-4">
          <UserSettings />
        </div>
        <div className="md:hidden mr-4" onClick={handleClick}>
          {!nav ? <MenuIcon className="w-5" /> : <XIcon className="w-5" />}
        </div>
      </div>
      <ul className={!nav ? "hidden" : "absolute bg-blue-600 w-full px-8"}>
        <li className="border-b-2 border-blue-300 w-full">
          <NavLink
            to="exercises"
            className="hover:bg-blue-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Ασκήσεις
          </NavLink>
        </li>
        <li className="border-b-2 border-blue-300 w-full">
          <NavLink
            to="tutorials"
            className="hover:bg-blue-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Διδακτικό υλικό
          </NavLink>
        </li>
        <li className="border-b-2 border-blue-300 w-full">
          <NavLink
            to="books"
            className="hover:bg-blue-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Βιβλία
          </NavLink>
        </li>
        <li className="border-b-2 border-blue-300 w-full">
          <NavLink
            to="aboutUs"
            className="hover:bg-blue-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Σχετικά με εμάς
          </NavLink>
        </li>

        <div className="flex flex-col my-4">
          <UserSettings />
        </div>
      </ul>
    </div>
  );
};

export default Navbar;
