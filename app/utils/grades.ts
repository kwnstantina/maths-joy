/**
 * School grades a student can pick in the Greg AI widget. Shared by the
 * widget (labels via i18n `gregAi.grade.<key>`) and the server (validation
 * and the tutor's prompt).
 */
export const GRADES = ["g1", "g2", "g3", "l1", "l2", "l3", "uni"] as const;

export type Grade = (typeof GRADES)[number];

export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

/** How Greg AI is told the grade. */
export const GRADE_PROMPT_LABEL: Record<Grade, { el: string; en: string }> = {
  g1: { el: "Α' Γυμνασίου", en: "7th grade (Α' Γυμνασίου)" },
  g2: { el: "Β' Γυμνασίου", en: "8th grade (Β' Γυμνασίου)" },
  g3: { el: "Γ' Γυμνασίου", en: "9th grade (Γ' Γυμνασίου)" },
  l1: { el: "Α' Λυκείου", en: "10th grade (Α' Λυκείου)" },
  l2: { el: "Β' Λυκείου", en: "11th grade (Β' Λυκείου)" },
  l3: { el: "Γ' Λυκείου", en: "12th grade (Γ' Λυκείου)" },
  uni: { el: "Πανεπιστήμιο", en: "university" },
};
