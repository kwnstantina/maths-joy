import { useState } from "react";
import { useTranslation } from "react-i18next";

const SECTIONS = [
  {
    titleKey: "admin.guide.dashboard.title",
    contentKey: "admin.guide.dashboard.content",
  },
  {
    titleKey: "admin.guide.exercises.title",
    contentKey: "admin.guide.exercises.content",
  },
  {
    titleKey: "admin.guide.training.title",
    contentKey: "admin.guide.training.content",
  },
  {
    titleKey: "admin.guide.videos.title",
    contentKey: "admin.guide.videos.content",
  },
  {
    titleKey: "admin.guide.books.title",
    contentKey: "admin.guide.books.content",
  },
  {
    titleKey: "admin.guide.qa.title",
    contentKey: "admin.guide.qa.content",
  },
  {
    titleKey: "admin.guide.i18n.title",
    contentKey: "admin.guide.i18n.content",
  },
  {
    titleKey: "admin.guide.troubleshooting.title",
    contentKey: "admin.guide.troubleshooting.content",
  },
];

export default function AdminGuide() {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {SECTIONS.map((section, index) => (
        <div
          key={section.titleKey}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSection(index)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg font-medium text-gray-800">
              {t(section.titleKey)}
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                openSection === index ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {openSection === index && (
            <div className="px-6 pb-4">
              <p className="text-gray-600 leading-relaxed">
                {t(section.contentKey)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
