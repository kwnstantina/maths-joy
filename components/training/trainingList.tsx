import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  id: string;
  contentImage: string;
  solutionImage: string;
  label: string;
};

const TrainingList = ({ id, contentImage, solutionImage, label }: Props) => {
  const { t } = useTranslation();
  const [showSolution, setShowSolution] = useState(false);
  const solutionId = `solution-${id}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("trainingPage.statement")}
      </div>
      <div className="p-4 sm:p-6">
        <img
          src={contentImage}
          alt={t("trainingPage.statementAlt", { label })}
          className="mx-auto w-full max-w-3xl"
        />
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setShowSolution((shown) => !shown)}
          aria-expanded={showSolution}
          aria-controls={solutionId}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {showSolution ? t("trainingPage.hideSolution") : t("trainingPage.showSolution")}
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${showSolution ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {showSolution && (
        <div id={solutionId} className="border-t border-gray-100 p-4 sm:p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-green-700">
            {t("trainingPage.solution")}
          </p>
          <img
            src={solutionImage}
            alt={t("trainingPage.solutionAlt", { label })}
            className="mx-auto w-full max-w-3xl"
          />
        </div>
      )}
    </section>
  );
};

export default TrainingList;
