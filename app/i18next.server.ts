import { resolve } from "node:path";
import Backend from "i18next-fs-backend";
import { RemixI18Next } from "remix-i18next/server";
import i18n from "~/i18n";
import { i18nCookie } from "../services/cookies/cookies";

const i18next = new RemixI18Next({
  detection: {
    cookie: i18nCookie,
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath:
        process.env.NODE_ENV === "development"
          ? resolve("./public/locales/{{lng}}/{{ns}}.json")
          : resolve("./locales/{{lng}}/{{ns}}.json"),
    },
  },
  plugins: [Backend],
});

export default i18next;
