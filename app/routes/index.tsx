import chat from "../assets/chat.png";
import { useRef, useEffect, useState, useTransition } from "react";
import AboutUsHoc from "components/aboutUs/aboutUs";
import Intro from "components/intro/intro";
import Box from "components/box/box";
import NewsLetter from "components/newsletter/newsletter";
import { ActionFunction, json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { validateEmail } from "utils/utils";
import { useTranslation } from "react-i18next";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
 const email = form.get("email") as string;
  if (!email || !validateEmail(email)) {
    return json(
      {
        error: "Παρακαλώ εισάγετε ένα έγκυρο email"
      },
    );
  }
  const convertApiKit =  process.env.CONVERTKIT_API_KEY;
  const converFormId =  process.env.CONVERT_API_TEMPLATE_ID;
  const res= await fetch(`https://api.convertkit.com/v3/forms/${converFormId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({
      api_key: convertApiKit,
      email:email,
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  return await res.json();
};

export default function Index() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const fetcher = useFetcher();
  const {t} = useTranslation();


  const getFadeLeftStyles = (isfadeLeftInViewPort: any) => ({
    transition: "all 1s ease-in",
    opacity: isfadeLeftInViewPort ? "1" : "0",
    transform: isfadeLeftInViewPort ? "" : "translateX(-100%)",
  });

  const getFadeRightStyles = (isfadeRightInViewPort: any) => ({
    transition: "all 1s ease-in",
    opacity: isfadeRightInViewPort ? "1" : "0",
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

  const subscribe = (email:string) => {
    setNewsletterEmail(email);
  };
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement | any> | any
  ) => {
    event.preventDefault();
    fetcher.submit({ email:newsletterEmail}, { method: "post" });
  };


  return (
    <>
      <section className="container mx-auto px-6 text-center pb-8 flex justify-center align-center">
        <Intro />
      </section>
      <section className="my-22 flex items-start flex-col  bg-gray-50  mx-8">
        <div className="w-94 pl-10 pt-10">
        </div>
        <div
          className="px-6 pb-32 pt-24 flex items-start xs:flex-col sm:flex-col md:flex-col lg:flex-row xl:flex-row 2xl:flex-row"
          ref={refThree}
           style={getFadeLeftStyles(animatedView.section3)}
        >
          <div className="h-8 relative px-2">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-orange-800" />
          </div>
          <Box
              title={t("mathsExersice")}
              content={t("mathsExerciseContent")}
            >
              <a
                href="/exercises"
                className="mb-6 inline-flex items-center font-medium  hover:underline text-gray-800"
              >
               {t("mathsLink")}
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 ml-1"
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
          </Box>
            <div className="h-8 relative px-2">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-500 to-teal-700" />
          </div>
          <Box
             title={t("mathsTopic")}
             content={t("mathsTopicContent")}
            >
              <a
                href="/testYourself"
                className="mb-6 inline-flex items-center font-medium  hover:underline text-gray-800"
              >
                {t("mathsTopicLink")}
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 ml-1"
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
            </Box>
            <div className="h-8 relative px-2">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-pink-500 to-pink-800" />
          </div>
          <Box
              title={t("mathsTraining")}    
              content={t("mathsTrainingContent")}   
            >
              <a
                href="/tutorial"
                className="mb-6 inline-flex items-center font-medium  hover:underline text-gray-800"
              > 
               {t("mathsTrainingLink")}
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 ml-1"
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
            </Box>
          </div>
      </section>
      <section className="w-10/12 mx-8 px-6  rounded-t-md my-30">
        <div className="absolute z-[-1]">
          <div className="relative  top-0 right-0 bg-gradient-to-br from-orange-600 to-white rounded-full h-96 w-96" />
        </div>
        <div
          ref={anotherRef}
          style={getFadeRightStyles(animatedView.section2)}
          className="flex  justify-start items-center flex-wrap"
        >
          <div>
            <h1 className="text-4xl text-center mt-10 font-black">
              Online chat
            </h1>
            <p className="text-xl font-black text-center">
             {t("onlineChat")}
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
      <section className="bg-white my-22">
        <NewsLetter subscribe={subscribe} newsletterEmail={newsletterEmail} handleSubmit={handleSubmit} fetcher={fetcher}/>
      </section>
    </>
  );
}
