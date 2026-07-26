export default {
    // This is the list of languages your application supports
    fallbackLng: "el",
    supportedLngs: ["el", "en"],
    // This is the language you want to use in case
    // if the user language is not in the supportedLngs
    lng: "el",
    // The default namespace of i18next is "translation", but you can customize it here
    defaultNS: "common",
    // Translation keys are stored flat with literal dots (e.g. "gregAi.title",
    // "nav.login"). Disable key nesting so i18next resolves the whole dotted
    // string as one key instead of walking a non-existent nested object.
    keySeparator: false as const,
    whitelist: ["el", "en"],
    // Disabling suspense is recommended
    react: { useSuspense: false },
    debug: process.env.NODE_ENV !== 'production',
   // preload: ["el"],
  };