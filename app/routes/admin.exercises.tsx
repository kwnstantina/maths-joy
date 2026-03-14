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
import {
  uploadStreamToCloudinary,
  deleteFromCloudinary,
} from "~/utils/cloudinary.server";
import type { CloudinaryUploadResult } from "~/utils/cloudinary.server";
import {
  getPaginatedExercises,
  createExerciseFromStream,
  updateExercise,
  deleteExercise,
} from "~/utils/exersices.prisma";
import { validateExerciseFields } from "~/utils/validators.server";
import { createTranslation } from "~/utils/i18n.server";
import { logAuditEvent, getClientInfo } from "~/utils/audit.server";
import ExerciseUploadForm from "components/admin/ExerciseUploadForm";
import ExerciseCard from "components/admin/ExerciseCard";
import AdminPageHeader from "components/admin/AdminPageHeader";
import Pagination from "components/admin/Pagination";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10));

  const { exercises, total, totalPages } = await getPaginatedExercises(page, limit);
  const { token, headers } = await getCSRFToken(request);

  return data({ exercises, total, page, totalPages, csrfToken: token, user }, { headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!isAdmin(user)) {
    return data({ errors: { general: "Unauthorized" } }, { status: 403 });
  }

  const contentType = request.headers.get("Content-Type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Non-multipart requests (e.g. delete) — parse as regular form data
  if (!isMultipart) {
    const formData = await request.formData();
    const actionType = formData.get("_action") as string;

    if (actionType === "deleteExercise") {
      const csrfToken = formData.get("_csrf") as string;
      const isValid = await validateCSRFToken(request, csrfToken);
      if (!isValid) {
        return data({ errors: { general: "Invalid CSRF token" } }, { status: 403 });
      }
      const exerciseId = formData.get("exerciseId") as string;
      if (!exerciseId) {
        return data({ errors: { general: "Exercise ID required" }, _action: "deleteExercise" }, { status: 400 });
      }
      try {
        const exercise = await deleteExercise(exerciseId);

        if (exercise.cloudinaryPublicId) {
          await deleteFromCloudinary(exercise.cloudinaryPublicId, "raw");
        }

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId,
          action: "delete",
          resource: "exercise",
          resourceId: exerciseId,
          metadata: { title: exercise.title },
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return data({ success: true, _action: "deleteExercise" });
      } catch (_error) {
        return data(
          { errors: { general: "Failed to delete exercise" }, _action: "deleteExercise" },
          { status: 500 }
        );
      }
    }

    return data({ errors: { general: "Unknown action" } }, { status: 400 });
  }

  // Multipart requests (create/update) — parse with streaming upload handler
  const rateLimitResponse = applyRateLimit(request, "upload", userId);
  if (rateLimitResponse) return rateLimitResponse;

  let pdfResult: CloudinaryUploadResult | null = null;

  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data: fileData, contentType: fieldContentType }) => {
      if (name === "pdfFile" && fieldContentType === "application/pdf") {
        const chunks: Uint8Array[] = [];
        for await (const chunk of fileData) {
          chunks.push(chunk);
        }
        if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length === 0)) {
          return undefined;
        }
        async function* replayChunks() {
          for (const c of chunks) {
            yield c;
          }
        }
        const result = await uploadStreamToCloudinary(replayChunks(), {
          folder: "maths-joy/exercises",
          resource_type: "raw",
        });
        pdfResult = result;
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
      { errors: { general: "Failed to process upload" }, _action: "createExercise" },
      { status: 500 }
    );
  }

  const actionType = formData.get("_action") as string;

  const csrfToken = formData.get("_csrf") as string;
  const isValid = await validateCSRFToken(request, csrfToken);
  if (!isValid) {
    if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
    return data({ errors: { general: "Invalid CSRF token" }, _action: actionType }, { status: 403 });
  }

  if (actionType === "createExercise") {
    const title_el = (formData.get("title_el") as string) || "";
    const title_en = (formData.get("title_en") as string) || "";
    const description_el = (formData.get("description_el") as string) || "";
    const description_en = (formData.get("description_en") as string) || "";
    const category = (formData.get("category") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const exerciseImgUrl = (formData.get("exerciseImgUrl") as string) || "";

    const fieldErrors = validateExerciseFields({
      title: title_el,
      category,
    });
    if (fieldErrors) {
      if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
      return data({ errors: fieldErrors, _action: "createExercise" }, { status: 400 });
    }

    if (!pdfResult) {
      return data(
        { errors: { pdfFile: "PDF file is required" }, _action: "createExercise" },
        { status: 400 }
      );
    }

    const pdfUpload = pdfResult as CloudinaryUploadResult;

    const translation = createTranslation(
      { title: title_el, description: description_el },
      title_en || description_en
        ? { title: title_en || title_el, description: description_en || description_el }
        : undefined
    );

    try {
      const exercise = await createExerciseFromStream({
        title: title_el,
        category,
        tags: tags || "",
        description: description_el,
        exerciseImgUrl: exerciseImgUrl || undefined,
        fileName: "exercise.pdf",
        cloudinaryPublicId: pdfUpload.public_id,
        cloudinaryUrl: pdfUpload.secure_url,
        fileSize: pdfUpload.bytes,
        translation: translation as unknown as Prisma.InputJsonValue,
      });

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "upload",
        resource: "exercise",
        resourceId: exercise.id,
        metadata: { title: title_el },
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "createExercise" });
    } catch (_error) {
      console.error("Error creating exercise:", _error);
      if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
      return data(
        { errors: { general: "Failed to create exercise" }, _action: "createExercise" },
        { status: 500 }
      );
    }
  }

  if (actionType === "updateExercise") {
    const exerciseId = (formData.get("exerciseId") as string) || "";
    if (!exerciseId) {
      return data(
        { errors: { general: "Exercise ID required" }, _action: "updateExercise" },
        { status: 400 }
      );
    }

    const title_el = formData.get("title_el") as string;
    const title_en = formData.get("title_en") as string;
    const description_el = formData.get("description_el") as string;
    const description_en = formData.get("description_en") as string;
    const category = formData.get("category") as string;
    const tags = formData.get("tags") as string;
    const exerciseImgUrl = formData.get("exerciseImgUrl") as string;

    const updateData: Record<string, unknown> = {};
    if (title_el) updateData.title = title_el;
    if (description_el) updateData.description = description_el;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (exerciseImgUrl !== null) updateData.exerciseImgUrl = exerciseImgUrl || undefined;

    if (pdfResult) {
      const pdfUpload = pdfResult as CloudinaryUploadResult;
      updateData.cloudinaryPublicId = pdfUpload.public_id;
      updateData.cloudinaryUrl = pdfUpload.secure_url;
      updateData.fileSize = pdfUpload.bytes;
    }

    if (title_el || description_el || title_en || description_en) {
      const translation = createTranslation(
        {
          title: title_el || "",
          description: description_el || "",
        },
        title_en || description_en
          ? {
              title: title_en || "",
              description: description_en || "",
            }
          : undefined
      );
      updateData.translation = translation as unknown as Prisma.InputJsonValue;
    }

    try {
      await updateExercise(exerciseId, updateData);

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "update",
        resource: "exercise",
        resourceId: exerciseId,
        metadata: { title: title_el },
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "updateExercise" });
    } catch (_error) {
      console.error("Error updating exercise:", _error);
      return data(
        { errors: { general: "Failed to update exercise" }, _action: "updateExercise" },
        { status: 500 }
      );
    }
  }

  return data({ errors: { general: "Unknown action" } }, { status: 400 });
};

export default function AdminExercises() {
  const { exercises, total, page, totalPages, csrfToken } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminPageHeader
        titleKey="admin.exercises.pageTitle"
        count={total}
      />

      <ExerciseUploadForm
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
        {exercises.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("admin.exercises.noExercises")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={{
                  id: exercise.id,
                  title: exercise.title,
                  description: exercise.description ?? "",
                  category: exercise.category,
                  tags: exercise.tags,
                  exerciseImgUrl: exercise.exerciseImgUrl ?? undefined,
                  cloudinaryUrl: exercise.cloudinaryUrl ?? undefined,
                  translation: exercise.translation,
                  createdAt: String(exercise.createdAt),
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
