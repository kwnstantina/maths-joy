import { useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { NavLink, useLocation } from "@remix-run/react";
import UserSettings from "./userSettings";
import logo from "../../app/assets/logoD.png";
import useDetectOutside from "hooks/useDetectOutside";
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
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

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
    isActive
      ? "bg-orange-100 text-orange-700"
      : "text-gray-800 hover:bg-orange-50 active:bg-orange-100"
  }`;

const Navbar = ({ user }: NavbarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
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

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setNav(false);
  }, [location.pathname]);

  // Close on Escape and lock background scroll while the mobile menu is open
  useEffect(() => {
    if (!nav) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNav(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [nav]);

  const mobileLinks = [
    { to: "exercises", label: t("exersice"), Icon: PencilSquareIcon },
    { to: "tutorial", label: t("topic"), Icon: AcademicCapIcon },
    // Books section temporarily hidden
    // { to: "books", label: t("nav.books"), Icon: BookOpenIcon },
    { to: "testYourself", label: t("training"), Icon: ClipboardDocumentCheckIcon },
    { to: "videos", label: t("nav.videos", "Βίντεο"), Icon: PlayCircleIcon },
    { to: "qa", label: t("nav.qa"), Icon: QuestionMarkCircleIcon },
    { to: "chat", label: t("nav.chat"), Icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div ref={wrapperRef} className="relative md:mx-12 mt-10 text-center h-20 z-50">
      <div className="relative z-50 flex justify-between items-center w-full h-full">
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

            {/* Books section temporarily hidden
            <li>
              <NavLink
                to="books"
                className="hover:bg-orange-600 text-black block px-3 py-2 rounded-md text-base font-medium"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
              >
                {t("nav.books")}
              </NavLink>
            </li>
            */}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="md:hidden p-2 rounded-full text-gray-800 hover:bg-orange-50 active:bg-orange-100 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
            onClick={handleClick}
            aria-expanded={nav}
            aria-controls="mobile-nav-menu"
            aria-label={nav ? t("nav.closeMenu", "Close menu") : t("nav.openMenu", "Open menu")}
          >
            {!nav ? <Bars3Icon className="w-7 h-7" aria-hidden="true" /> : <XMarkIcon className="w-7 h-7" aria-hidden="true" />}
          </button>
          <LanguageIndicator />
        </div>
      </div>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={closeModal}
        className={`md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          nav ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile menu panel */}
      <nav
        id="mobile-nav-menu"
        aria-label={t("nav.mainMenu", "Main menu")}
        className={`md:hidden absolute inset-x-2 top-full mt-2 z-50 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl bg-white p-2 text-left shadow-2xl ring-1 ring-black/5 origin-top transition duration-200 ease-out ${
          nav ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible pointer-events-none"
        }`}
      >
        <ul className="flex flex-col gap-1">
          {mobileLinks.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} className={mobileLinkClass} onClick={closeModal}>
                <Icon className="h-5 w-5 shrink-0 text-orange-500" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ChevronRightIcon className="h-4 w-4 text-gray-300" aria-hidden="true" />
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-2 border-t border-gray-100" />

        <ul className="flex flex-col gap-1">
          {/* Admin link - only visible to admins */}
          {userIsAdmin && (
            <li>
              <NavLink to="admin" className={mobileLinkClass} onClick={closeModal}>
                <Cog6ToothIcon className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
                <span className="flex-1">Admin</span>
              </NavLink>
            </li>
          )}

          {/* User profile link - visible to logged in users */}
          {isLoggedIn && (
            <li>
              <NavLink to="progress" className={mobileLinkClass} onClick={closeModal}>
                <UserIcon className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
                <span className="flex-1">{t("user")}</span>
              </NavLink>
            </li>
          )}

          {/* Login - only visible when not logged in */}
          {!isLoggedIn && (
            <li>
              <NavLink
                to="login"
                onClick={closeModal}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-600 text-white text-base font-semibold hover:bg-orange-700 active:bg-orange-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                {t("nav.login")}
              </NavLink>
            </li>
          )}

          {/* Logout - only visible when logged in */}
          {isLoggedIn && (
            <li>
              <NavLink
                to="logout"
                onClick={closeModal}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{t("nav.logout")}</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
