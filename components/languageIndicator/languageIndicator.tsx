import React, { useState, Fragment } from "react";
import gb from '../../app/assets/united-kingdom.png';
import gr from '../../app/assets/greece.png';
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, TranslateIcon } from '@heroicons/react/solid'
import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'el', name: 'Greek' },
  { code: 'en', name: 'English' },
];

const LanguageIndicator: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  let { i18n } = useTranslation();

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language.code);
  };

  return (
    <div className="md:fixed top-12  right-2">
    <Listbox value={selectedLanguage} onChange={handleLanguageSelect}>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
           <TranslateIcon
                  className="ml-2  h-8 w-8 text-black hover:text-orange-300"
                  aria-hidden="true"
                />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {languages.map((lang, langIdx) => (
              <Listbox.Option
                key={langIdx}
                className={({ active }) =>
                  `relative cursor-pointer	 pl-10 pr-4 w-full ${
                    active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                  }`
                }
               value={lang}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate cursor-pointer	 ${
                        selected ? 'font-medium' : 'font-normal'
                      }`}
                    >
                      {lang.code==='en'?<img src={gb} className="w-5 h-5 my-4" />:<img src={gr} className="w-5 h-5 my-4" />}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  </div>
  );
};

export default LanguageIndicator;



