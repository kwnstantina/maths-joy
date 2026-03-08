import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getUser, requireUserId } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { getQuestions, deleteQuestion } from "~/utils/qa.server";
import { logAuditEvent, getClientInfo } from "~/utils/audit.server";
import AdminPageHeader from "components/admin/AdminPageHeader";
import Pagination from "components/admin/Pagination";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10))
  );

  const { questions, total, totalPages } = await getQuestions({}, page, limit);
  const { token, headers } = await getCSRFToken(request);

  return data(
    { questions, total, page, totalPages, csrfToken: token },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!isAdmin(user)) {
    return data({ errors: { general: "Unauthorized" } }, { status: 403 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  if (actionType === "deleteQuestion") {
    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" }, _action: "deleteQuestion" },
        { status: 403 }
      );
    }

    const questionId = formData.get("questionId") as string;
    if (!questionId) {
      return data(
        { errors: { general: "Question ID required" }, _action: "deleteQuestion" },
        { status: 400 }
      );
    }

    try {
      await deleteQuestion(questionId);

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "delete",
        resource: "question",
        resourceId: questionId,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "deleteQuestion" });
    } catch (_error) {
      return data(
        { errors: { general: "Failed to delete question" }, _action: "deleteQuestion" },
        { status: 500 }
      );
    }
  }

  return data({ errors: { general: "Unknown action" } }, { status: 400 });
};

export default function AdminQA() {
  const { questions, total, page, totalPages, csrfToken } =
    useLoaderData<typeof loader>();
  const _actionData = useActionData<typeof action>();
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminPageHeader titleKey="admin.qa.pageTitle" count={total} />

      {questions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {t("admin.qa.noQuestions")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.question")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.answers")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.votes")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.views")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("admin.qa.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  csrfToken={csrfToken}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function QuestionRow({
  question,
  csrfToken,
}: {
  question: {
    id: string;
    title: string;
    answerCount: number;
    voteCount: number;
    viewCount: number;
    isResolved: boolean;
    createdAt: string | Date;
  };
  csrfToken: string;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher();

  const truncatedTitle =
    question.title.length > 60
      ? question.title.substring(0, 60) + "..."
      : question.title;

  const formattedDate = new Date(question.createdAt).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-800" title={question.title}>
        {truncatedTitle}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.answerCount}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.voteCount}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.viewCount}
      </td>
      <td className="px-4 py-3 text-sm">
        {question.isResolved ? (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            {t("admin.qa.resolved")}
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {t("admin.qa.open")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{formattedDate}</td>
      <td className="px-4 py-3 text-sm">
        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm(t("admin.qa.confirmDelete"))) e.preventDefault();
          }}
        >
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input type="hidden" name="_action" value="deleteQuestion" />
          <input type="hidden" name="questionId" value={question.id} />
          <button
            type="submit"
            disabled={fetcher.state === "submitting"}
            className="rounded bg-red-100 py-1 px-2 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            {t("admin.qa.delete")}
          </button>
        </fetcher.Form>
      </td>
    </tr>
  );
}
