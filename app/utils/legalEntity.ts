/**
 * Who runs the site — shown in the Terms of Use and Privacy Policy
 * (Π.Δ. 131/2003 art. 4, GDPR art. 13). Empty fields are simply not shown,
 * so fill them all before relying on the pages legally.
 */
export const LEGAL_ENTITY = {
  name: { el: "Γρηγόρης Κυρίτσης", en: "Grigoris Kyritsis" },
  /** Business address (street, number, postcode, city). */
  address: { el: "", en: "" },
  /** City whose courts are competent (Terms §12). */
  city: { el: "", en: "" },
  /** ΑΦΜ */
  vatNumber: "",
  /** ΔΟΥ */
  taxOffice: { el: "", en: "" },
  /** ΓΕΜΗ number, only if registered */
  gemi: "",
  email: "gregkirmaths@gmail.com",
  phone: "+30 6987495775",
};
