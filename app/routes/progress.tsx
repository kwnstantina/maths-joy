import { useLoaderData } from "@remix-run/react";
import { data, LoaderFunction, redirect } from "@remix-run/node";
import { getUser } from "~/utils/auth.prisma";
import { getUserProgressSummary, getUserDetailedProgress } from "~/utils/progress.server";
import { useTranslation } from "react-i18next";

interface LoaderData {
  user: {
    id: string;
    email: string;
    role: string;
    profile: { firstName: string; lastName: string } | null;
  };
  summary: {
    exercisesViewed: number;
    trainingCompleted: number;
    totalScore: number;
    averageScore: number | null;
    totalTimeSpent: number;
  };
  recentExercises: Array<{
    id: string;
    exerciseId: string | null;
    completedAt: Date;
    exercise?: { id: string; title: string; category: string };
  }>;
  recentTrainings: Array<{
    id: string;
    trainingId: string | null;
    score: number | null;
    completedAt: Date;
    training?: { id: string; title: string; category: string };
  }>;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    return redirect("/login?redirectTo=/progress");
  }

  const [summary, detailed] = await Promise.all([
    getUserProgressSummary(user.id),
    getUserDetailedProgress(user.id),
  ]);

  return data({
    user,
    summary: {
      exercisesViewed: summary.exercisesViewed,
      trainingCompleted: summary.trainingCompleted,
      totalScore: summary.totalScore,
      averageScore: summary.averageScore,
      totalTimeSpent: summary.totalTimeSpent,
    },
    recentExercises: detailed.exercises.slice(0, 5),
    recentTrainings: detailed.trainings.slice(0, 5),
  });
};

export default function Progress() {
  const { user, summary, recentExercises, recentTrainings } = useLoaderData<LoaderData>();
  const { t } = useTranslation();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("el-GR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {t("progress.title", "Η πρόοδός σας")}
            {user?.profile?.firstName && `, ${user.profile.firstName}`}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("progress.subtitle", "Παρακολουθήστε την πρόοδό σας στα μαθηματικά")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Exercises Viewed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{t("progress.exercisesViewed", "Ασκήσεις")}</p>
                <p className="text-2xl font-bold text-gray-900">{summary.exercisesViewed}</p>
              </div>
            </div>
          </div>

          {/* Training Completed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{t("progress.trainingCompleted", "Εξασκήσεις")}</p>
                <p className="text-2xl font-bold text-gray-900">{summary.trainingCompleted}</p>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{t("progress.averageScore", "Μέσος Όρος")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.averageScore ? `${Math.round(summary.averageScore)}%` : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{t("progress.timeSpent", "Χρόνος")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalTimeSpent > 0
                    ? `${Math.round(summary.totalTimeSpent / 60)} λεπτά`
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Exercises */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("progress.recentExercises", "Πρόσφατες Ασκήσεις")}
            </h2>
            {recentExercises.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentExercises.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.exercise?.title || t("progress.unknownExercise", "Άγνωστη άσκηση")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.exercise?.category}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.completedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t("progress.noExercises", "Δεν έχετε δει ακόμα ασκήσεις")}
              </p>
            )}
          </div>

          {/* Recent Training */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("progress.recentTraining", "Πρόσφατη Εξάσκηση")}
            </h2>
            {recentTrainings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentTrainings.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.training?.title || t("progress.unknownTraining", "Άγνωστη εξάσκηση")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.training?.category}
                          {item.score !== null && ` • ${item.score}%`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.completedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t("progress.noTraining", "Δεν έχετε ολοκληρώσει ακόμα εξασκήσεις")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
