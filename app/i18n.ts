export default {
    // This is the list of languages your application supports
    fallbackLng: "el",
    supportedLngs: ["el", "en"],
    // This is the language you want to use in case
    // if the user language is not in the supportedLngs
    lng: "el",
    // The default namespace of i18next is "translation", but you can customize it here
    defaultNS: "common",
    whitelist: ["el", "en"],
    // Disabling suspense is recommended
    react: { useSuspense: false },
    debug: process.env.NODE_ENV !== 'production',
   // preload: ["el"],
  };