import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next";
import i18n from "~/i18n"; // your i18n configuration file
import { i18nCookie } from "../services/cookies/cookies"

let i18next = new RemixI18Next({
  detection: {
      // persist language selection in cookie
      cookie: i18nCookie,
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  // This is the configuration for i18next used
  // when translating messages server-side only
  i18next: {
   ...i18n,
   lng: i18n.lng,
    backend: {
      loadPath: process.env.NODE_ENV === 'development'? resolve("./public/locales/{{lng}}/{{ns}}.json") :  resolve('./locales/{{lng}}/{{ns}}.json'),
    },
  },
  // The backend you want to use to load the translations
  // Tip: You could pass `resources` to the `i18next` configuration and avoid
  // a backend here
  backend: Backend,
});

export default i18next;