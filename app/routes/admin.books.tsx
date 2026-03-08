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
  createBook,
  getPaginatedBooks,
  updateBook,
  toggleBookActive,
  softDeleteBook,
} from "~/utils/books.prisma";
import { validateBookFields, validateBookPrice } from "~/utils/validators.server";
import { createTranslation } from "~/utils/i18n.server";
import { logAuditEvent, getClientInfo } from "~/utils/audit.server";
import BookUploadForm from "components/admin/BookUploadForm";
import BookCard from "components/admin/BookCard";
import AdminPageHeader from "components/admin/AdminPageHeader";
import Pagination from "components/admin/Pagination";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get("limit") || "12", 10)));

  const { token, headers } = await getCSRFToken(request);
  const { books, total, totalPages } = await getPaginatedBooks(page, limit);
  return data({ books, total, page, totalPages, csrfToken: token, user }, { headers });
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

  if (actionType === "toggleActive") {
    const csrfToken = peekForm.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data({ errors: { general: "Invalid CSRF token" } }, { status: 403 });
    }
    const bookId = peekForm.get("bookId") as string;
    if (!bookId) {
      return data({ errors: { general: "Book ID required" } }, { status: 400 });
    }
    try {
      await toggleBookActive(bookId);
      return data({ success: true, _action: "toggleActive" });
    } catch (_error) {
      return data(
        { errors: { general: "Failed to toggle book status" }, _action: "toggleActive" },
        { status: 500 }
      );
    }
  }

  if (actionType === "softDelete") {
    const csrfToken = peekForm.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      return data({ errors: { general: "Invalid CSRF token" } }, { status: 403 });
    }
    const bookId = peekForm.get("bookId") as string;
    if (!bookId) {
      return data({ errors: { general: "Book ID required" } }, { status: 400 });
    }
    try {
      await softDeleteBook(bookId);
      return data({ success: true, _action: "softDelete" });
    } catch (_error) {
      return data(
        { errors: { general: "Failed to delete book" }, _action: "softDelete" },
        { status: 500 }
      );
    }
  }

  // For createBook and updateBook, we need multipart parsing with streaming
  if (actionType === "createBook" || actionType === "updateBook") {
    const rateLimitResponse = applyRateLimit(request, "upload", userId);
    if (rateLimitResponse) return rateLimitResponse;

    let pdfResult: CloudinaryUploadResult | null = null;
    let thumbResult: CloudinaryUploadResult | null = null;

    const uploadHandler = unstable_composeUploadHandlers(
      async ({ name, data: fileData, contentType }) => {
        if (name === "pdfFile" && contentType === "application/pdf") {
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
            folder: "maths-joy/books",
            resource_type: "raw",
          });
          pdfResult = result;
          return result.public_id;
        }
        if (
          name === "thumbnailFile" &&
          (contentType === "image/jpeg" || contentType === "image/png")
        ) {
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
            folder: "maths-joy/book-thumbnails",
            resource_type: "image",
          });
          thumbResult = result;
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
        { errors: { general: "Failed to process upload" }, _action: actionType },
        { status: 500 }
      );
    }

    const csrfToken = formData.get("_csrf") as string;
    const isValid = await validateCSRFToken(request, csrfToken);
    if (!isValid) {
      // Cleanup orphaned uploads
      if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
      if (thumbResult) await deleteFromCloudinary((thumbResult as CloudinaryUploadResult).public_id, "image");
      return data({ errors: { general: "Invalid CSRF token" }, _action: actionType }, { status: 403 });
    }

    if (actionType === "createBook") {
      const title_el = (formData.get("title_el") as string) || "";
      const title_en = (formData.get("title_en") as string) || "";
      const description_el = (formData.get("description_el") as string) || "";
      const description_en = (formData.get("description_en") as string) || "";
      const price = (formData.get("price") as string) || "";
      const discountPrice = (formData.get("discountPrice") as string) || "";
      const authorName = (formData.get("authorName") as string) || "";
      const pageCount = (formData.get("pageCount") as string) || "";
      const isbn = (formData.get("isbn") as string) || "";
      const edition = (formData.get("edition") as string) || "";
      const category = (formData.get("category") as string) || "";
      const tags = (formData.get("tags") as string) || "";
      const isActive = formData.get("isActive") === "true";

      // Validate required fields
      const fieldErrors = validateBookFields({
        title: title_el,
        description: description_el,
        price,
        category,
      });
      if (fieldErrors) {
        if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
        if (thumbResult) await deleteFromCloudinary((thumbResult as CloudinaryUploadResult).public_id, "image");
        return data({ errors: fieldErrors, _action: "createBook" }, { status: 400 });
      }

      const priceError = validateBookPrice(price);
      if (priceError) {
        if (pdfResult) await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
        if (thumbResult) await deleteFromCloudinary((thumbResult as CloudinaryUploadResult).public_id, "image");
        return data(
          { errors: { price: priceError }, _action: "createBook" },
          { status: 400 }
        );
      }

      if (!pdfResult) {
        if (thumbResult) await deleteFromCloudinary((thumbResult as CloudinaryUploadResult).public_id, "image");
        return data(
          { errors: { pdfFile: "PDF file is required" }, _action: "createBook" },
          { status: 400 }
        );
      }

      if (!thumbResult) {
        await deleteFromCloudinary((pdfResult as CloudinaryUploadResult).public_id, "raw");
        return data(
          { errors: { thumbnailFile: "Thumbnail image is required" }, _action: "createBook" },
          { status: 400 }
        );
      }

      const pdfUpload = pdfResult as CloudinaryUploadResult;
      const thumbUpload = thumbResult as CloudinaryUploadResult;

      // Build translation object
      const translation = createTranslation(
        { title: title_el, description: description_el },
        title_en || description_en
          ? { title: title_en || title_el, description: description_en || description_el }
          : undefined
      );

      try {
        const book = await createBook({
          title: title_el,
          description: description_el,
          price: parseFloat(price),
          discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
          currency: "EUR",
          category,
          tags: tags ? [tags] : [],
          authorName: authorName || undefined,
          pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
          isbn: isbn || undefined,
          edition: edition || undefined,
          cloudinaryPublicId: pdfUpload.public_id,
          cloudinaryUrl: pdfUpload.secure_url,
          thumbnailUrl: thumbUpload.secure_url,
          thumbnailPublicId: thumbUpload.public_id,
          isActive,
          translation: translation as unknown as Prisma.InputJsonValue,
        });

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId,
          action: "upload",
          resource: "book",
          resourceId: book.id,
          metadata: { title: title_el },
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return data({ success: true, _action: "createBook" });
      } catch (_error) {
        console.error("Error creating book:", _error);
        return data(
          { errors: { general: "Failed to create book" }, _action: "createBook" },
          { status: 500 }
        );
      }
    }

    if (actionType === "updateBook") {
      const bookId = (formData.get("bookId") as string) || "";
      if (!bookId) {
        return data(
          { errors: { general: "Book ID required" }, _action: "updateBook" },
          { status: 400 }
        );
      }

      const title_el = formData.get("title_el") as string;
      const title_en = formData.get("title_en") as string;
      const description_el = formData.get("description_el") as string;
      const description_en = formData.get("description_en") as string;
      const price = formData.get("price") as string;
      const discountPrice = formData.get("discountPrice") as string;
      const authorName = formData.get("authorName") as string;
      const pageCount = formData.get("pageCount") as string;
      const isbn = formData.get("isbn") as string;
      const edition = formData.get("edition") as string;
      const category = formData.get("category") as string;
      const tags = formData.get("tags") as string;

      // Build update data with only provided fields
      const updateData: Record<string, unknown> = {};
      if (title_el) updateData.title = title_el;
      if (description_el) updateData.description = description_el;
      if (price) {
        const priceError = validateBookPrice(price);
        if (priceError) {
          return data(
            { errors: { price: priceError }, _action: "updateBook" },
            { status: 400 }
          );
        }
        updateData.price = parseFloat(price);
      }
      if (discountPrice) updateData.discountPrice = parseFloat(discountPrice);
      if (authorName !== null) updateData.authorName = authorName || undefined;
      if (pageCount) updateData.pageCount = parseInt(pageCount, 10);
      if (isbn !== null) updateData.isbn = isbn || undefined;
      if (edition !== null) updateData.edition = edition || undefined;
      if (category) updateData.category = category;
      if (tags) updateData.tags = [tags];

      // Handle PDF replacement
      if (pdfResult) {
        const pdfUpload = pdfResult as CloudinaryUploadResult;
        updateData.cloudinaryPublicId = pdfUpload.public_id;
        updateData.cloudinaryUrl = pdfUpload.secure_url;
      }

      // Handle thumbnail replacement
      if (thumbResult) {
        const thumbUpload = thumbResult as CloudinaryUploadResult;
        updateData.thumbnailUrl = thumbUpload.secure_url;
        updateData.thumbnailPublicId = thumbUpload.public_id;
      }

      // Handle translation update
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
        await updateBook(bookId, updateData);
        return data({ success: true, _action: "updateBook" });
      } catch (_error) {
        console.error("Error updating book:", _error);
        return data(
          { errors: { general: "Failed to update book" }, _action: "updateBook" },
          { status: 500 }
        );
      }
    }
  }

  return data({ errors: { general: "Unknown action" } }, { status: 400 });
};

export default function AdminBooks() {
  const { books, total, page, totalPages, csrfToken } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-7xl mx-auto">
      <AdminPageHeader titleKey="admin.books.pageTitle" count={total} />

      <BookUploadForm
        csrfToken={csrfToken}
        actionData={actionData as { errors?: Record<string, string>; success?: boolean; _action?: string } | null}
        isSubmitting={isSubmitting}
      />

      <div className="mt-8">
        {books.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("admin.books.noBooks")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={{
                  id: book.id,
                  title: book.title,
                  description: book.description,
                  price: book.price,
                  discountPrice: book.discountPrice,
                  currency: book.currency,
                  category: book.category,
                  tags: book.tags,
                  authorName: book.authorName,
                  pageCount: book.pageCount,
                  isbn: book.isbn,
                  edition: book.edition,
                  thumbnailUrl: book.thumbnailUrl,
                  isActive: book.isActive,
                  cloudinaryUrl: book.cloudinaryUrl,
                  translation: book.translation,
                  createdAt: String(book.createdAt),
                }}
                csrfToken={csrfToken}
              />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} />
      </div>
    </div>
  );
}
