import SocialIcons from "./socialIcons";
import { Link } from "@remix-run/react";

const Footer = () => {
  return (
    <footer className="bg-gray-700 text-white">
      <div className="container mx-auto pt-12 px-5 pb-10">
        <div className="flex flex-col justify-between space-y-24 md:flex-row md:space-y-0">
          <div className="mt-10 space-y-6">
            <div className="flex items-center space-x-3 md:-mt-10">
              {/* <div className="w-6">
                <img src="images/icon-phone.svg" alt="" className="scale-10" />
              </div> */}
              <div>+30 6987495775</div>
            </div>
            <div className="flex items-center space-x-3">
              {/* <div className="w-6">
                <img src="images/icon-email.svg" alt="" className="scale-10" />
              </div> */}
              <div>konstantinakirtsia@gmail.com</div>
            </div>
          </div>
          <div className="flex flex-col space-y-10 text-xl md:text-base md:space-x-20 md:space-y-0 md:flex-row">
            <nav className="flex flex-col space-y-3">
              <Link to="/exercises">Ασκησεις</Link>{" "}
              <Link to="/tutorials"> Διδακτικό υλικό</Link>{" "}
              <Link to="/books">Βιβλία</Link>
              <Link to="/learn">Εξάσκηση</Link>
            </nav>           
              <nav className="flex flex-col space-y-3">
              <Link to="/#">Επικοινωνία</Link>{" "}
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </nav>
          </div>
          {/* <div className="flex justify-center pb-10 space-x-3">
             <SocialIcons />
          </div> */}
        </div>
       <div className="flex flex-col text-center pt-2 text-gray-400 text-sm pb-8 items-start" >
        <span>© 2023 Appy. All rights reserved Konstantina Kirtsia.</span>
        <span>Terms · Privacy Policy</span>
      </div>
      
      </div>
    </footer>
  );
};

export default Footer;
