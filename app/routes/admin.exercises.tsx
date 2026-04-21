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
import BulkExerciseUploadForm from "components/admin/BulkExerciseUploadForm";
import ExerciseCard from "components/admin/ExerciseCard";
import AdminPageHeader from "components/admin/AdminPageHeader";
import Pagination from "components/shared/Pagination";

export const handle = { i18n: ["common"] };

/**
 * Split a comma-separated tags string into a trimmed, deduplicated non-empty array.
 * Used both on single-create (form field "tags") and bulk-create (shared "tags" field).
 */
const parseTagsField = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(",")) {
    const trimmed = piece.trim();
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
};

/** Result record for one file in a bulk upload request (order-preserving). */
interface BulkUploadRecord {
  index: number;
  fileName: string;
  public_id: string | null;
  secure_url: string | null;
  bytes: number;
  error: string | null;
}

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

  // Multipart requests (create / updateExercise / createExerciseBulk)
  // Security chain: rate limit BEFORE parsing (cheap early-reject), then CSRF
  // validation AFTER parsing (CSRF token lives in formData for multipart POSTs).
  const rateLimitResponse = applyRateLimit(request, "upload", userId);
  if (rateLimitResponse) return rateLimitResponse;

  // Single-upload result (createExercise / updateExercise)
  let pdfResult: CloudinaryUploadResult | null = null;

  // Bulk-upload results (createExerciseBulk). The upload handler pushes one
  // record per `pdfFiles` entry, preserving DOM/form order so we can zip the
  // parallel `title_el[]` / `title_en[]` arrays by index later.
  const bulkUploads: BulkUploadRecord[] = [];
  let bulkIndex = 0;

  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, filename, data: fileData, contentType: fieldContentType }) => {
      // Single-upload (unchanged) — used by createExercise + updateExercise.
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

      // Bulk-upload — each file goes through its own streaming upload. We push
      // an ordered record (success or failure) BEFORE returning so the post-
      // parse code can walk results in DOM order.
      if (name === "pdfFiles") {
        const idx = bulkIndex++;
        const fname = filename || `file-${idx}.pdf`;

        // Reject non-PDF files individually (don't fail the whole batch).
        if (fieldContentType && fieldContentType !== "application/pdf") {
          bulkUploads.push({
            index: idx,
            fileName: fname,
            public_id: null,
            secure_url: null,
            bytes: 0,
            error: "Not a PDF file",
          });
          // Drain the stream so the parser can continue to the next field.
          for await (const _ of fileData) { /* discard */ }
          return undefined;
        }

        const chunks: Uint8Array[] = [];
        try {
          for await (const chunk of fileData) {
            chunks.push(chunk);
          }
        } catch (err) {
          bulkUploads.push({
            index: idx,
            fileName: fname,
            public_id: null,
            secure_url: null,
            bytes: 0,
            error: err instanceof Error ? err.message : "Stream error",
          });
          return undefined;
        }

        // Empty file (browser "no file selected" can still produce an empty entry).
        if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length === 0)) {
          bulkUploads.push({
            index: idx,
            fileName: fname,
            public_id: null,
            secure_url: null,
            bytes: 0,
            error: "Empty file",
          });
          return undefined;
        }

        async function* replayChunks() {
          for (const c of chunks) {
            yield c;
          }
        }

        try {
          const result = await uploadStreamToCloudinary(replayChunks(), {
            folder: "maths-joy/exercises",
            resource_type: "raw",
          });
          bulkUploads.push({
            index: idx,
            fileName: fname,
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            error: null,
          });
          return result.public_id;
        } catch (err) {
          bulkUploads.push({
            index: idx,
            fileName: fname,
            public_id: null,
            secure_url: null,
            bytes: 0,
            error: err instanceof Error ? err.message : "Upload failed",
          });
          return undefined;
        }
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
    // Best-effort rollback of any Cloudinary uploads that succeeded before the
    // parser threw (bulk path — single-upload will also be caught below).
    if (pdfResult) {
      await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
    }
    for (const rec of bulkUploads) {
      if (rec.public_id) {
        await deleteFromCloudinary(rec.public_id, "raw").catch(() => {});
      }
    }
    return data(
      { errors: { general: "Failed to process upload" }, _action: "createExercise" },
      { status: 500 }
    );
  }

  const actionType = formData.get("_action") as string;

  const csrfToken = formData.get("_csrf") as string;
  const isValid = await validateCSRFToken(request, csrfToken);
  if (!isValid) {
    // Rollback: delete EVERY Cloudinary asset that succeeded before CSRF was
    // checked. For bulk uploads this can be many — the alternative (validating
    // CSRF pre-parse) isn't possible because the token lives inside the
    // multipart body.
    if (pdfResult) {
      await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
    }
    for (const rec of bulkUploads) {
      if (rec.public_id) {
        await deleteFromCloudinary(rec.public_id, "raw").catch(() => {});
      }
    }
    return data({ errors: { general: "Invalid CSRF token" }, _action: actionType }, { status: 403 });
  }

  if (actionType === "createExercise") {
    const title_el = (formData.get("title_el") as string) || "";
    const title_en = (formData.get("title_en") as string) || "";
    const description_el = (formData.get("description_el") as string) || "";
    const description_en = (formData.get("description_en") as string) || "";
    const category = (formData.get("category") as string) || "";
    const level = (formData.get("level") as string) || "";
    const typeVal = (formData.get("type") as string) || "";
    const tagsRaw = (formData.get("tags") as string) || "";
    const tagsArr = parseTagsField(tagsRaw);
    const exerciseImgUrl = (formData.get("exerciseImgUrl") as string) || "";

    const fieldErrors = validateExerciseFields({
      title: title_el,
      category,
      level,
      type: typeVal,
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
        tags: tagsArr,
        level: level || null,
        type: typeVal || null,
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

  if (actionType === "createExerciseBulk") {
    // Shared metadata applies to every file in the batch.
    const description_el = (formData.get("description_el") as string) || "";
    const description_en = (formData.get("description_en") as string) || "";
    const category = (formData.get("category") as string) || "";
    const level = (formData.get("level") as string) || "";
    const typeVal = (formData.get("type") as string) || "";
    const tagsArr = parseTagsField((formData.get("tags") as string) || "");

    // Whole-batch validation (shared category/level/type). Title is validated
    // per-file below because each file gets its own (possibly fallback) title.
    const sharedErrors = validateExerciseFields({
      title: "_", // placeholder — we validate per-file titles separately
      category,
      level,
      type: typeVal,
    });
    if (sharedErrors) {
      // Roll back every successful Cloudinary upload — the whole batch is rejected.
      for (const rec of bulkUploads) {
        if (rec.public_id) {
          await deleteFromCloudinary(rec.public_id, "raw").catch(() => {});
        }
      }
      return data(
        { errors: sharedErrors, _action: "createExerciseBulk" },
        { status: 400 }
      );
    }

    // Per-file title overrides (parallel arrays in DOM/form order).
    const titleEls = (formData.getAll("title_el") as string[]) || [];
    const titleEns = (formData.getAll("title_en") as string[]) || [];

    interface BulkResult {
      index: number;
      title: string;
      success: boolean;
      exerciseId?: string;
      error?: string;
    }
    const results: BulkResult[] = [];

    const { ipAddress, userAgent } = getClientInfo(request);

    for (let i = 0; i < bulkUploads.length; i++) {
      const rec = bulkUploads[i];

      // Upload-failed or dropped file: record failure and move on.
      if (!rec.public_id) {
        results.push({
          index: rec.index,
          title: rec.fileName || "(unnamed)",
          success: false,
          error: rec.error ?? "Upload failed",
        });
        continue;
      }

      // Derive per-file title: explicit override → filename (minus .pdf) → error.
      const overrideEl = (titleEls[i] ?? "").trim();
      const overrideEn = (titleEns[i] ?? "").trim();
      const fallbackTitle = rec.fileName.replace(/\.pdf$/i, "").trim();
      const titleEl = overrideEl || fallbackTitle;

      if (!titleEl) {
        // Title is required — roll back THIS file's Cloudinary asset only.
        await deleteFromCloudinary(rec.public_id, "raw").catch(() => {});
        results.push({
          index: rec.index,
          title: rec.fileName || "(unnamed)",
          success: false,
          error: "Title required",
        });
        continue;
      }

      const translation = createTranslation(
        { title: titleEl, description: description_el },
        overrideEn || description_en
          ? {
              title: overrideEn || titleEl,
              description: description_en || description_el,
            }
          : undefined
      );

      try {
        const exercise = await createExerciseFromStream({
          title: titleEl,
          category,
          tags: tagsArr,
          level: level || null,
          type: typeVal || null,
          description: description_el,
          fileName: rec.fileName,
          cloudinaryPublicId: rec.public_id,
          cloudinaryUrl: rec.secure_url ?? undefined,
          fileSize: rec.bytes,
          translation: translation as unknown as Prisma.InputJsonValue,
        });

        await logAuditEvent({
          userId,
          action: "upload",
          resource: "exercise",
          resourceId: exercise.id,
          metadata: { title: titleEl, bulk: true },
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        results.push({
          index: rec.index,
          title: titleEl,
          success: true,
          exerciseId: exercise.id,
        });
      } catch (err) {
        console.error("Bulk: DB create failed for", rec.fileName, err);
        // Per-file rollback — the other successes in this batch must persist.
        await deleteFromCloudinary(rec.public_id, "raw").catch(() => {});
        results.push({
          index: rec.index,
          title: titleEl,
          success: false,
          error: "Database error",
        });
      }
    }

    const totalSucceeded = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    return data(
      {
        bulk: { results, totalSucceeded, totalFailed },
        _action: "createExerciseBulk",
      },
      { status: totalSucceeded > 0 ? 200 : 400 }
    );
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
    const level = formData.get("level") as string | null;
    const typeVal = formData.get("type") as string | null;
    const tagsRaw = formData.get("tags") as string | null;
    const exerciseImgUrl = formData.get("exerciseImgUrl") as string;

    const updateData: Parameters<typeof updateExercise>[1] = {};
    if (title_el) updateData.title = title_el;
    if (description_el) updateData.description = description_el;
    if (category) updateData.category = category;
    // Tags: a present (even empty) field replaces the array; absent means leave untouched.
    if (tagsRaw !== null) updateData.tags = parseTagsField(tagsRaw);
    // Level/type: explicit empty string means "clear it" (null); absent means untouched.
    if (level !== null) updateData.level = level.trim() ? level : null;
    if (typeVal !== null) updateData.type = typeVal.trim() ? typeVal : null;
    if (exerciseImgUrl !== null && exerciseImgUrl !== undefined) {
      updateData.exerciseImgUrl = exerciseImgUrl || undefined;
    }

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

      <BulkExerciseUploadForm
        csrfToken={csrfToken}
        actionData={
          actionData as {
            bulk?: {
              results: Array<{
                index: number;
                title: string;
                success: boolean;
                exerciseId?: string;
                error?: string;
              }>;
              totalSucceeded: number;
              totalFailed: number;
            };
            errors?: Record<string, string>;
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
                  tags: Array.isArray(exercise.tags)
                    ? exercise.tags.join(", ")
                    : (exercise.tags ?? ""),
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
