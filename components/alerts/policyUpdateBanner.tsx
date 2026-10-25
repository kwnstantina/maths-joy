import { Link, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Bump with CONSENT_VERSION (app/utils/consent.server.ts) when the policy changes materially.
const POLICY_VERSION = "2026-10-25";
const STORAGE_KEY = "policyNoticeDismissed";
// Stop announcing the change after this date.
const SHOW_UNTIL = new Date("2026-12-31T23:59:59Z");

/** Announces a privacy-policy / terms update, plus the "account deleted" confirmation. */
export default function PolicyUpdateBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const [showPolicy, setShowPolicy] = useState(false);
  const accountDeleted = new URLSearchParams(location.search).has("accountDeleted");

  useEffect(() => {
    if (Date.now() > SHOW_UNTIL.getTime()) return;
    try {
      setShowPolicy(localStorage.getItem(STORAGE_KEY) !== POLICY_VERSION);
    } catch {
      setShowPolicy(true);
    }
  }, []);

  const dismiss = () => {
    setShowPolicy(false);
    try {
      localStorage.setItem(STORAGE_KEY, POLICY_VERSION);
    } catch {
      // storage blocked — banner just comes back next visit
    }
  };

  if (accountDeleted) {
    return (
      <div role="status" className="bg-green-50 px-4 py-2 text-center text-sm text-green-800">
        {t("account.deleted")}
      </div>
    );
  }
  if (!showPolicy) return null;

  return (
    <div role="status" className="flex items-center justify-center gap-3 bg-orange-50 px-4 py-2 text-sm text-gray-800">
      <span>
        {t("policyBanner.text")}{" "}
        <Link to="/privacyPolicy" className="font-medium text-orange-700 underline">
          {t("policyBanner.privacy")}
        </Link>{" "}
        {t("consent.and")}{" "}
        <Link to="/useOfTerms" className="font-medium text-orange-700 underline">
          {t("policyBanner.terms")}
        </Link>
        .
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("policyBanner.dismiss")}
        className="rounded px-2 text-gray-500 hover:text-gray-800"
      >
        ✕
      </button>
    </div>
  );
}
