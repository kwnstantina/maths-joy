import SocialIcons from "./socialIcons";
import { Link } from "@remix-run/react";
import { PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-700 text-white">
      <div className="container mx-auto pt-12 pb-10 flex flex-col md:flex-row md:grid md:grid-cols-3 md:gap-8">
        {/* Contact Section */}
        <div className="flex flex-col items-baseline sm:pl-0 xs:pl-0 md:pl-8 mb-8 md:mb-0">
          <p className="mb-8 font-light text-gray-300 md:mb-12 sm:text-xl">
            {t('footer.contact')}
          </p>
          <div className="flex flex-row justify-start items-baseline gap-5 mb-3">
            {/* <PhoneIcon
              className="ml-2 -mr-1 h-5 w-5 text-white hover:text-orange-300"
              aria-hidden="true"
            />
            <div></div> */}
          </div>

          <div className="flex flex-row justify-start items-baseline gap-5 mb-3">
            <EnvelopeIcon
              className="ml-2 -mr-1 h-5 w-5 text-white hover:text-orange-300"
              aria-hidden="true"
            />
            <div>gregkirmaths@gmail.com</div>
          </div>

          <Link
            to="/contact"
            className="mt-4 text-orange-300 hover:text-orange-400 transition-colors"
          >
            {t('contact.title')} →
          </Link>
        </div>

        {/* Services Section */}
        <div className="flex flex-col justify-start items-baseline gap-8 mb-8 md:mb-0">
          <nav className="flex flex-col justify-start space-y-3 items-baseline">
            <p className="mb-8 font-light text-gray-300 md:mb-12 sm:text-xl">
              {t('footer.services')}
            </p>
            <Link to="/exercises" className="hover:text-orange-300 transition-colors">
              {t('footer.exercises')}
            </Link>
            <Link to="/videos" className="hover:text-orange-300 transition-colors">
              {t('footer.tutorials')}
            </Link>
            <Link to="/books" className="hover:text-orange-300 transition-colors">
              {t('footer.books')}
            </Link>
            <Link to="/testYourself" className="hover:text-orange-300 transition-colors">
              {t('footer.training')}
            </Link>
            <Link to="/qa" className="hover:text-orange-300 transition-colors">
              {t('footer.chat')}
            </Link>
          </nav>
        </div>

        {/* Legal Section */}
        <div className="flex flex-col justify-start items-baseline">
          <nav className="flex flex-col space-y-3">
            <p className="mb-8 font-light text-gray-300 md:mb-12 sm:text-xl">
              {t('footer.legal')}
            </p>
            <Link to="/useOfTerms" className="hover:text-orange-300 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/privacyPolicy" className="hover:text-orange-300 transition-colors">
              {t('footer.privacy')}
            </Link>
          </nav>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-6">
        <div className="mt-8 border-t-2 border-gray-600 flex flex-col items-center">
          <div className="sm:w-2/3 text-center py-6">
            <p className="text-sm text-gray-300 mb-2">
              © {currentYear} GregKyrMaths. {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
