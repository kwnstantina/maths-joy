import SocialIcons from "./socialIcons";
import { Link } from "@remix-run/react";
import { PhoneIcon, MailIcon } from "@heroicons/react/solid";

const Footer = () => {
  return (
    <footer className="bg-gray-700 text-white">
      <div className="container mx-auto pt-12 px-5 pb-10">
        <div className="flex flex-col justify-between space-y-24 md:flex-row md:space-y-0">
          <div className="mt-10 space-y-6">
            <div className="flex items-center space-x-3 md:-mt-10">
              <div>
                <PhoneIcon
                  className="ml-2 -mr-1 h-5 w-5 text-orange-200 hover:text-orange-300"
                  aria-hidden="true"
                />
              </div>
      
            <div>
              +30 6987495775
            </div>
       
            <div>
              <MailIcon
                className="ml-2 -mr-1 h-5 w-5 text-orange-200 hover:text-orange-300"
                aria-hidden="true"
              />
              </div>
          <div>konstantinakirtsia@gmail.com</div>
          <div className="flex flex-row gap-8">
          <nav className="flex flex-col space-y-3">
            <Link to="/exercises">Ασκησεις</Link>{" "}
            <Link to="/tutorials"> Διδακτικό υλικό</Link>{" "}
            <Link to="/books">Βιβλία</Link>
            <Link to="/learn">Εξάσκηση</Link>
          </nav>
          <nav className="flex flex-col space-y-3">
            <Link to="/#">Επικοινωνία</Link> <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
          </div>
      
          </div>
          </div>
          </div>
        {/* <div className="flex justify-center pb-10 space-x-3">
             <SocialIcons />
          </div> */}
      </div>
      <div className="flex flex-col text-center pt-2 text-gray-400 text-sm pb-8 items-start ml-4">
        <span>© 2023 Appy. All rights reserved Konstantina Kirtsia.</span>
        <span>Terms · Privacy Policy</span>
      </div>
    </footer>
  );
};

export default Footer;
