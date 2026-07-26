import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import i18n from "./i18n";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { getInitialNamespaces } from "remix-i18next/client";

async function hydrate() {
  // Don't pin a fixed `lng` on the client: the server (RemixI18Next) renders in
  // the cookie-detected language and sets <html lang>. The client must detect
  // that same language via htmlTag — otherwise client-only UI (e.g. the Greg AI
  // widget) renders in Greek while the server rendered English, producing a
  // hydration mismatch. Drop i18n.ts's `lng` so LanguageDetector runs.
  const { lng: _defaultLng, ...i18nConfig } = i18n;
  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(Backend)
    .init({
      ...i18nConfig,
      ns: getInitialNamespaces(),
      // Wait for the initial namespaces to finish loading before hydrating.
      // Client-only components (e.g. the Greg AI widget) mount after hydration
      // via useEffect; with the default (initImmediate: true), init resolves
      // before the async fetch completes, so the widget can render raw keys and
      // never recover. Awaiting the load guarantees translations are present.
      initImmediate: false,
      backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
      detection: {
        order: ["htmlTag"],
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
