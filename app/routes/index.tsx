import chat from "../assets/chat.png";
import { useRef, useEffect, useState } from "react";
import {
  ViewBoardsIcon,
  BookOpenIcon,
  DocumentAddIcon,
} from "@heroicons/react/outline";
import AboutUsHoc from "components/aboutUs/aboutUs";
import Intro from "components/intro/intro";
import Box from "components/box/box";

export default function Index() {
  const getFadeLeftStyles = (isfadeLeftInViewPort: any) => ({
    transition: "all 1s ease-in",
    opacity: isfadeLeftInViewPort ? "1" : "0",
    transform: isfadeLeftInViewPort ? "" : "translateX(-100%)",
  });

  const getFadeRightStyles = (isfadeRightInViewPort: any) => ({
    transition: "all 1s ease-in",
    opacity: isfadeRightInViewPort ? "1" : "0",
    // transform: isfadeRightInViewPort ? 'translateXY(50%)': 'translateXY(-100%)'
  });
  const [animatedView, setAnimatedView] = useState({
    section1: false,
    section2: false,
    section3: false,
  });
  const ourRef = useRef(null),
    anotherRef = useRef(null),
    refThree = useRef(null);

  useEffect(() => {
    const topPos = (element: any) => element?.getBoundingClientRect()?.top;
    const div1Pos = topPos(ourRef.current),
      div2Pos = topPos(anotherRef.current),
      div3Pos = topPos(refThree.current);

    const onScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      if (div1Pos < scrollPos) {
        setAnimatedView((state) => ({ ...state, section1: true }));
      } else if (div2Pos < scrollPos) {
        setAnimatedView((state) => ({ ...state, section2: true }));
      } else if (div3Pos < scrollPos) {
        setAnimatedView((state) => ({ ...state, section3: true }));
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <section className="container mx-auto px-6 text-center pb-48 flex justify-center align-center">
        <Intro />
      </section>
      <section className="w-full flex items-start  xs:flex-col md:flex-row bg-gray-50">
      <div  className="w-94 pl-10 pt-10" >
          <p className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-5xl font-black">
            {" "}
            Εδώ θα βρεις...
          </p>
        </div>
        <div
          className="px-6 pb-32 pt-24"
          ref={refThree}
          style={getFadeLeftStyles(animatedView.section3)}
        >
          <Box
            title="Ασκήσεις Μαθηματικών"
            link="/exercises"
            content="Άλυτες και λυμένες ασκήσεις και πολλαπλής επιλογής για τάξεις γυμνασίου, λυκείου και πανεπιστήμιου."
            additionStyle=" flex items-center justify-center mb-6 h-40 md:w-[36rem] bg-gradient-to-r from-orange-300	to-orange-600  rounded-3xl shadow-md"
          >
            <DocumentAddIcon className="w-20" />
          </Box>
          <Box
            title="Διδακτικό υλικό"
            link="/tutorial"
            content="Οπτικό ακουστικό υλικό με καθοδήγηση και επεξήγηση μαθηματικών."
            additionStyle="ml-10 flex items-center justify-center mb-6 h-40 md:w-[36rem]	 bg-gradient-to-r from-rose-200	 to-rose-300  rounded-3xl shadow-md"
          >
            <ViewBoardsIcon className="w-20" />
          </Box>
          <Box
            title="Ασκήσεις Εμπέδωσης"
            link="/testYourself"
            content="Ασκήσεις πολλαπλής επιλογής για εμπέδωση με επεξεγηματική λύση."
            additionStyle="ml-24 flex items-center justify-center  mb-6 h-40 md:w-[36rem]	 bg-gradient-to-r from-teal-200	 to-teal-500  rounded-3xl shadow-md"
          >
            <BookOpenIcon className="w-20" />
          </Box>
        </div>  
      </section>
      <section className="w-10/12 mx-auto px-6 pb-32 rounded-t-md mb-6">
        <div
          ref={anotherRef}
          style={getFadeRightStyles(animatedView.section2)}
          className="flex  justify-start items-center flex-wrap"
        >
          <div>
            <h1 className="text-4xl text-center mt-10 font-black">
              Online chat 
            </h1>
             <p className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-xl font-black">
               Για απορίες και συζήτηση επί των ασκήσεων και των θεμάτων  
          </p>
          </div>
          <div className="relative top-[9rem] left-[12rem] z-50">
            <a
              href="/chat"
              className="inline-flex mt-5 h-3 items-center justify-center p-5 bg-orange-200 text-base font-medium text-black-500 rounded-lg hover:text-gray-900 hover:bg-orange-100"
            >
              <span className="w-full">Chat</span>
              <svg
                aria-hidden="true"
                className="w-6 h-6 ml-3"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </a>
          </div>
          <img
            src={chat}
            className="w-72 animate-[wiggle_3s_ease-in-out_infinite]"
          />
        </div>
      </section>
      <section>
        <AboutUsHoc />
      </section>
    </>
  );
}
