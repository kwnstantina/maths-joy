import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  data,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { Prisma } from "@prisma/client";
import { useTranslation } from "react-i18next";
import { getUser, requireUserId } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { uploadStreamToCloudinary } from "~/utils/cloudinary.server";
import type { CloudinaryUploadResult } from "~/utils/cloudinary.server";
import {
  getPaginatedTraining,
  createTrainingFromStream,
  updateTraining,
  deleteTraining,
} from "~/utils/training.prisma";
import { validateTrainingFields } from "~/utils/validators.server";
import { createTranslation } from "~/utils/i18n.server";
import { logAuditEvent, getClientInfo } from "~/utils/audit.server";
import TrainingUploadForm from "components/admin/TrainingUploadForm";
import TrainingCard from "components/admin/TrainingCard";
import AdminPageHeader from "components/admin/AdminPageHeader";
import Pagination from "components/admin/Pagination";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10));

  const { items, total, totalPages } = await getPaginatedTraining(page, limit);
  const { token, headers } = await getCSRFToken(request);

  return data(
    { training: items, total, page, totalPages, csrfToken: token, user },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!isAdmin(user)) {
    return data({ errors: { general: "Unauthorized" } }, { status: 403 });
  }

  // Determine action type from a clone to avoid consuming the body
  const clonedRequest = request.clone();
  const peekForm = await clonedRequest.formData();
  const actionType = peekForm.get("_action") as string;

  if (actionType === "deleteTraining") {
    const csrfToken = peekForm.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" } },
        { status: 403 }
      );
    }
    const trainingId = peekForm.get("trainingId") as string;
    if (!trainingId) {
      return data(
        { errors: { general: "Training ID required" } },
        { status: 400 }
      );
    }
    try {
      await deleteTraining(trainingId);

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "delete",
        resource: "training",
        resourceId: trainingId,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "deleteTraining" });
    } catch (_error) {
      return data(
        {
          errors: { general: "Failed to delete training" },
          _action: "deleteTraining",
        },
        { status: 500 }
      );
    }
  }

  // For createTraining and updateTraining, we need multipart parsing with streaming
  if (actionType === "createTraining" || actionType === "updateTraining") {
    const rateLimitResponse = applyRateLimit(request, "upload", userId);
    if (rateLimitResponse) return rateLimitResponse;

    let contentResult: CloudinaryUploadResult | null = null;
    let solutionResult: CloudinaryUploadResult | null = null;

    const uploadHandler = unstable_composeUploadHandlers(
      async ({ name, data: fileData, contentType }) => {
        if (
          name === "contentImage" &&
          (contentType === "image/jpeg" || contentType === "image/png")
        ) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of fileData) {
            chunks.push(chunk);
          }
          if (
            chunks.length === 0 ||
            (chunks.length === 1 && chunks[0].length === 0)
          ) {
            return undefined;
          }
          async function* replayChunks() {
            for (const c of chunks) {
              yield c;
            }
          }
          const result = await uploadStreamToCloudinary(replayChunks(), {
            folder: "maths-joy/training",
            resource_type: "image",
          });
          contentResult = result;
          return result.public_id;
        }
        if (
          name === "solutionImage" &&
          (contentType === "image/jpeg" || contentType === "image/png")
        ) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of fileData) {
            chunks.push(chunk);
          }
          if (
            chunks.length === 0 ||
            (chunks.length === 1 && chunks[0].length === 0)
          ) {
            return undefined;
          }
          async function* replayChunks() {
            for (const c of chunks) {
              yield c;
            }
          }
          const result = await uploadStreamToCloudinary(replayChunks(), {
            folder: "maths-joy/training",
            resource_type: "image",
          });
          solutionResult = result;
          return result.public_id;
        }
        return undefined;
      },
      unstable_createMemoryUploadHandler()
    );

    let formData: FormData;
    try {
      formData = await unstable_parseMultipartFormData(request, uploadHandler);
    } catch (_error) {
      console.error("Failed to parse multipart form data:", _error);
      return data(
        {
          errors: { general: "Failed to process upload" },
          _action: actionType,
        },
        { status: 500 }
      );
    }

    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" }, _action: actionType },
        { status: 403 }
      );
    }

    const title_el = (formData.get("title_el") as string) || "";
    const title_en = (formData.get("title_en") as string) || "";
    const category = (formData.get("category") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const searchableTitle = (formData.get("searchableTitle") as string) || "";

    if (actionType === "createTraining") {
      // Validate required fields
      const fieldErrors = validateTrainingFields({
        title: title_el,
        category,
        searchableTitle,
      });
      if (fieldErrors) {
        return data(
          { errors: fieldErrors, _action: "createTraining" },
          { status: 400 }
        );
      }

      if (!contentResult) {
        return data(
          {
            errors: { contentImage: "Content image is required" },
            _action: "createTraining",
          },
          { status: 400 }
        );
      }

      if (!solutionResult) {
        return data(
          {
            errors: { solutionImage: "Solution image is required" },
            _action: "createTraining",
          },
          { status: 400 }
        );
      }

      const contentUpload = contentResult as CloudinaryUploadResult;
      const solutionUpload = solutionResult as CloudinaryUploadResult;

      // Build translation object
      const translation = createTranslation(
        { title: title_el },
        title_en ? { title: title_en } : undefined
      );

      try {
        const training = await createTrainingFromStream({
          title: title_el,
          category,
          tags: tags || "",
          searchableTitle,
          contentImage: contentUpload.secure_url,
          solutionImage: solutionUpload.secure_url,
          translation: translation as unknown as Prisma.InputJsonValue,
        });

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId,
          action: "upload",
          resource: "training",
          resourceId: training.id,
          metadata: { title: title_el },
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return data({ success: true, _action: "createTraining" });
      } catch (_error) {
        console.error("Error creating training:", _error);
        return data(
          {
            errors: { general: "Failed to create training" },
            _action: "createTraining",
          },
          { status: 500 }
        );
      }
    }

    if (actionType === "updateTraining") {
      const trainingId = (formData.get("trainingId") as string) || "";
      if (!trainingId) {
        return data(
          {
            errors: { general: "Training ID required" },
            _action: "updateTraining",
          },
          { status: 400 }
        );
      }

      // Build update data with only provided fields
      const updateData: Record<string, unknown> = {};
      if (title_el) updateData.title = title_el;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;
      if (searchableTitle) updateData.searchableTitle = searchableTitle;

      // Handle content image replacement
      if (contentResult) {
        const contentUpload = contentResult as CloudinaryUploadResult;
        updateData.contentImage = contentUpload.secure_url;
      }

      // Handle solution image replacement
      if (solutionResult) {
        const solutionUpload = solutionResult as CloudinaryUploadResult;
        updateData.solutionImage = solutionUpload.secure_url;
      }

      // Handle translation update
      if (title_el || title_en) {
        const translation = createTranslation(
          { title: title_el || "" },
          title_en ? { title: title_en || "" } : undefined
        );
        updateData.translation =
          translation as unknown as Prisma.InputJsonValue;
      }

      try {
        await updateTraining(trainingId, updateData);

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId,
          action: "update",
          resource: "training",
          resourceId: trainingId,
          metadata: { title: title_el },
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return data({ success: true, _action: "updateTraining" });
      } catch (_error) {
        console.error("Error updating training:", _error);
        return data(
          {
            errors: { general: "Failed to update training" },
            _action: "updateTraining",
          },
          { status: 500 }
        );
      }
    }
  }

  return data({ errors: { general: "Unknown action" } }, { status: 400 });
};

export default function AdminTraining() {
  const { training, total, page, totalPages, csrfToken } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminPageHeader
        titleKey="admin.training.pageTitle"
        count={total}
      />

      <TrainingUploadForm
        csrfToken={csrfToken}
        actionData={
          actionData as {
            errors?: Record<string, string>;
            success?: boolean;
            _action?: string;
          } | null
        }
        isSubmitting={isSubmitting}
      />

      <div className="mt-8">
        {training.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("admin.training.noTraining")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {training.map((item) => (
              <TrainingCard
                key={item.id}
                training={{
                  id: item.id,
                  title: item.title,
                  category: item.category,
                  tags: item.tags,
                  searchableTitle: item.searchableTitle,
                  contentImage: item.contentImage,
                  solutionImage: item.solutionImage,
                  translation: item.translation,
                  createdAt: String(item.createdAt),
                }}
                csrfToken={csrfToken}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
