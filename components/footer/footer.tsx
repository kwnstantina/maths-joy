import React from "react";
import ItemsContainer from "./itemsContainer";
import SocialIcons from "./socialIcons";
import { Icons } from "./menu";

const Footer = () => {
  return (
    <footer className="bg-blue-600 h-100  text-white absolute bottom-0 right-0 left-0 ">
      {/* <div className="md:flex md:justify-between md:items-center sm:px-12 px-4 py-7">
        <h3
          className="lg:text-2xl text-3xl md:mb-0 mb-6 lg:leading-normal font-semibold  md:w-2/5">
         Maths & Joy με τον Γρηγόρη Κυρτσιά
        </h3>
      </div> */}
      {/* <ItemsContainer /> */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10
      text-center pt-2 text-gray-400 text-sm pb-8"
      >
        <span>© 2023 Appy. All rights reserved Konstantina Kirtsia.</span>
        <span>Terms · Privacy Policy</span>
        <SocialIcons />
      </div>
    </footer>
  );
};

export default Footer;