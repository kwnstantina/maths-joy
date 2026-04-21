import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { Prisma } from "@prisma/client";
import { useTranslation } from "react-i18next";
import { getUser, requireUserId } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import {
  getPaginatedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "~/utils/video.prisma";
import { validateVideoFields } from "~/utils/validators.server";
import { createTranslation } from "~/utils/i18n.server";
import { logAuditEvent, getClientInfo } from "~/utils/audit.server";
import VideoUploadForm from "components/admin/VideoUploadForm";
import VideoCard from "components/admin/VideoCard";
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
    Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10))
  );

  const { videos, total, totalPages } = await getPaginatedVideos(page, limit);
  const { token, headers } = await getCSRFToken(request);

  return data(
    { videos, total, page, totalPages, csrfToken: token, user },
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

  // --- deleteVideo ---
  if (actionType === "deleteVideo") {
    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" }, _action: "deleteVideo" },
        { status: 403 }
      );
    }

    const videoId = formData.get("videoId") as string;
    if (!videoId) {
      return data(
        { errors: { general: "Video ID required" }, _action: "deleteVideo" },
        { status: 400 }
      );
    }

    try {
      await deleteVideo(videoId);

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "delete",
        resource: "video",
        resourceId: videoId,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "deleteVideo" });
    } catch (_error) {
      return data(
        {
          errors: { general: "Failed to delete video" },
          _action: "deleteVideo",
        },
        { status: 500 }
      );
    }
  }

  // --- createVideo ---
  if (actionType === "createVideo") {
    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" }, _action: "createVideo" },
        { status: 403 }
      );
    }

    const title_el = (formData.get("title_el") as string) || "";
    const title_en = (formData.get("title_en") as string) || "";
    const description_el = (formData.get("description_el") as string) || "";
    const description_en = (formData.get("description_en") as string) || "";
    const url = (formData.get("url") as string) || "";
    const creatorName = (formData.get("creatorName") as string) || "";
    const category = (formData.get("category") as string) || "";
    const tags = (formData.get("tags") as string) || "";

    const fieldErrors = validateVideoFields({
      title: title_el,
      url,
      creatorName,
    });
    if (fieldErrors) {
      return data(
        { errors: fieldErrors, _action: "createVideo" },
        { status: 400 }
      );
    }

    const translation = createTranslation(
      { title: title_el, description: description_el },
      title_en || description_en
        ? {
            title: title_en || title_el,
            description: description_en || description_el,
          }
        : undefined
    );

    try {
      const video = await createVideo({
        title: title_el,
        url,
        description: description_el || "",
        creatorName,
        category: category || undefined,
        tags: tags ? [tags] : [],
        translation: translation as Prisma.InputJsonValue,
      });

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "upload",
        resource: "video",
        resourceId: video.id,
        metadata: { title: title_el } as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "createVideo" });
    } catch (_error) {
      console.error("Error creating video:", _error);
      return data(
        {
          errors: { general: "Failed to create video" },
          _action: "createVideo",
        },
        { status: 500 }
      );
    }
  }

  // --- updateVideo ---
  if (actionType === "updateVideo") {
    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data(
        { errors: { general: "Invalid CSRF token" }, _action: "updateVideo" },
        { status: 403 }
      );
    }

    const videoId = (formData.get("videoId") as string) || "";
    if (!videoId) {
      return data(
        { errors: { general: "Video ID required" }, _action: "updateVideo" },
        { status: 400 }
      );
    }

    const title_el = formData.get("title_el") as string;
    const title_en = formData.get("title_en") as string;
    const description_el = formData.get("description_el") as string;
    const description_en = formData.get("description_en") as string;
    const url = formData.get("url") as string;
    const creatorName = formData.get("creatorName") as string;
    const tags = formData.get("tags") as string;
    const category = formData.get("category") as string;

    const updateData: Record<string, unknown> = {};
    if (title_el) updateData.title = title_el;
    if (description_el) updateData.description = description_el;
    if (url) updateData.url = url;
    if (creatorName) updateData.creatorName = creatorName;
    if (category) updateData.category = category;
    if (tags) updateData.tags = [tags];

    // Build translation if text changed
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
      await updateVideo(videoId, updateData);

      const { ipAddress, userAgent } = getClientInfo(request);
      await logAuditEvent({
        userId,
        action: "update",
        resource: "video",
        resourceId: videoId,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      return data({ success: true, _action: "updateVideo" });
    } catch (_error) {
      console.error("Error updating video:", _error);
      return data(
        {
          errors: { general: "Failed to update video" },
          _action: "updateVideo",
        },
        { status: 500 }
      );
    }
  }

  return data({ errors: { general: "Unknown action" } }, { status: 400 });
};

export default function AdminVideos() {
  const { videos, total, page, totalPages, csrfToken } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminPageHeader titleKey="admin.videos.pageTitle" count={total} />

      <VideoUploadForm
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
        {videos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("admin.videos.noVideos")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={{
                  id: video.id,
                  title: video.title,
                  description: video.description || "",
                  url: video.url,
                  creatorName: video.creatorName,
                  category: video.category || "",
                  tags: video.tags,
                  translation: video.translation,
                  createdAt: String(video.createdAt),
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
