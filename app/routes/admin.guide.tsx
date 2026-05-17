import type { LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { getUser } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import AdminGuide from "components/admin/AdminGuide";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  return data({});
};

export default function AdminGuidePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t("admin.guide.pageTitle")}
      </h1>
      <AdminGuide />
    </div>
  );
}
