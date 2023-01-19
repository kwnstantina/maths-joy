import { useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { NavLink } from "@remix-run/react";
import UserSettings from "./userSettings";
import logo from '../../app/assets/logoD.png';

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const handleClick = () => setNav(!nav);

  const activeStyle = {
    textDecoration: "underline",
  };

  return (
    <div className="container mx-auto mt-10 px-6 text-center h-40 md:h-20">
      <div className="px-2 flex justify-between items-center w-full h-full">
        <div>
        <NavLink
              to="/"
        >
              <img className="w-32 h-20" src={logo}></img>
        </NavLink>  
        </div>
        <div>
            <ul className="hidden md:flex">
              <li>
                <NavLink
                  to="exercises"
                  className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Ασκήσεις
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="tutorials"
                  className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Διδακτικό υλικό
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="books"
                  className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Βιβλία
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="aboutUs"
                  className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                  style={({ isActive }) => (isActive ? activeStyle : undefined)}
                >
                  Σχετικά με εμάς
                </NavLink>
              </li>
              <li>
        <UserSettings />
        </li>

            </ul>
          </div>
    
        <div className="md:hidden mr-4" onClick={handleClick}>
          {!nav ? <MenuIcon className="w-5" /> : <XIcon className="w-5" />}
        </div>
      </div>
      <ul className={!nav ? "hidden" : "absolute bg-orange-600 w-3/4 px-8 z-50"}>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="exercises"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Ασκήσεις
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="tutorials"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Διδακτικό υλικό
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="books"
            className="hover:bg-orange-300 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Βιβλία
          </NavLink>
        </li>
        <li className="border-b-2 border-orange-300 w-full">
          <NavLink
            to="aboutUs"
            className="hover:bg-orange-400 text-white block px-3 py-2 rounded-md text-base font-medium"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            onClick={handleClick}
          >
            Σχετικά με εμάς
          </NavLink>
        </li>
        <li>
        <UserSettings />
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
