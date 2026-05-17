import type { LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getUser } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import AdminSidebar from "components/admin/AdminSidebar";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");
  return data({ user });
};

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {t("admin.error.title")}
        </h1>
        <p className="text-gray-600 mb-4">{t("admin.error.unauthorized")}</p>
        <a
          href="/progress"
          className="inline-block rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600"
        >
          {t("admin.error.goBack")}
        </a>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 bg-gray-50">
      <AdminSidebar user={user} />
      <main className="flex-1 p-4 lg:p-8 lg:ml-0 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
