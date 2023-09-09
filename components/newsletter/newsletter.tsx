import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";

type Props ={
  newsletterEmail?: string;
  subscribe: (email:string) => void;
  handleSubmit?: any;
  fetcher: any;
}
const NewsLetter = (props:Props):JSX.Element =>{
  const { newsletterEmail, subscribe,handleSubmit,fetcher} = props;
  const { t } = useTranslation();

 return(
    <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-md sm:text-center">
            <h2 className="mb-4 text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
              {t('newsletterTitle')}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl font-light text-gray-500 md:mb-12 sm:text-xl">
               {t('newletterSubTitle')}
            </p>
             <fetcher.Form onSubmit={handleSubmit}  className="space-y-6">
              <div className="items-center mx-auto mb-3 space-y-4 max-w-screen-sm sm:flex sm:space-y-0">
                <div className="relative w-full">
                  <label
                    htmlFor="email"
                    className="hidden mb-2 text-sm font-medium text-gray-900 "
                  >
                    Email address
                  </label>
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                  </div>
                  <input
                    className="block p-3 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:rounded-none sm:rounded-l-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Your email..."
                    type="email"
                    id="email"
                    required
                    value={newsletterEmail}
                    onChange= {(e)=>subscribe(e.target.value)}
                  />
                
                </div>
                <div>
                  <button
                    type="submit"
                    value="newsletter"
                    name="_newsletter"
                    disabled={fetcher.state === "submitting"}
                    className="py-3 px-5 w-full text-sm font-medium text-center text-white rounded-lg border cursor-pointer bg-orange-700 border-orange-600 sm:rounded-none sm:rounded-r-lg hover:bg-orange-800 focus:ring-4 focus:ring-orange-300"
                  >
                    Subscribe
                  </button>
                </div>
               
              </div>
              <div className="mx-auto max-w-screen-sm text-sm text-left">
               {fetcher?.data?.error && <p className="w-full text-sm text-red-600">
                      {fetcher?.data.error}
                    </p>}
                    </div>
              <div className="mx-auto max-w-screen-sm text-sm text-left text-gray-500">
                {t("newletterPlaceholder")}{" "}
                <a
                  href="#"
                  className="font-medium text-orange-600 hover:underline"
                >
                 {t("privacyPolicy")}
                </a>
                .
              </div>
            </fetcher.Form>
          </div>
        </div>
 );
}

export default NewsLetter;