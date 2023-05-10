import SocialIcons from "./socialIcons";
import { Link } from "@remix-run/react";
import { PhoneIcon, MailIcon } from "@heroicons/react/solid";

const Footer = () => {
  return (
    <footer className="bg-gray-700 text-white">
      <div className="container mx-auto pt-12 pb-10 flex flex-col md:flex-row md:grid md:grid-cols-2 md:gap-8">
        <div className="flex flex-col items-baseline sm:pl-0 xs:pl-0  md:pl-8">
          <p className=" mb-8  font-light text-gray-500  md:mb-12 sm:text-xl">
            Επικοινωνία
          </p>
          <div className="flex flex-row justify-start items-baseline gap-5">
            <PhoneIcon
              className="ml-2 -mr-1 h-5 w-5 text-white hover:text-orange-300"
              aria-hidden="true"
            />
            <div>+30 6987495775</div>
          </div>

          <div className="flex flex-row justify-start items-baseline gap-5">
            <MailIcon
              className="ml-2 -mr-1 h-5 w-5 text-white hover:text-orange-300"
              aria-hidden="true"
            />
            <div>konstantinakirtsia@gmail.com</div>
          </div>
        </div>

        <div className="flex flex-col justify-start items-baseline gap-8">
          <nav className="flex flex-col justify-start space-y-3 items-baseline">
            <p className=" mb-8 font-light text-gray-500 md:mb-12 sm:text-xl">
              Παροχές
            </p>
            <Link to="/exercises">Ασκησεις</Link>{" "}
            <Link to="/tutorials"> Διδακτικό υλικό</Link>{" "}
            <Link to="/books">Chat</Link>
            <Link to="/learn">Εξάσκηση</Link>
          </nav>
          <nav className="flex flex-col space-y-3">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </div>
      <div className="container mx-auto px-6">
        <div className="mt-16 border-t-2 border-gray-300 flex flex-col items-center">
          <div className="sm:w-2/3 text-center py-6">
            <p className="text-sm text-white font-bold mb-2">
              © 2023 Appy. All rights reserved Konstantina Kirtsia.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
