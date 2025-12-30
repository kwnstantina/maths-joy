// app/routes/admin/books/upload.tsx
import { Form, useActionData, } from "@remix-run/react";

import {
    ActionFunction,
    json,
    LoaderFunction,
    redirect,
  } from "@remix-run/node";

  import { getUser } from "~/utils/auth.prisma";
import { prisma } from "~/utils/db.server";
import { uploadFile } from "~/utils/upload.server"; // your existing upload utility


export const loader: LoaderFunction = async ({ request }) => {
  let user = await getUser(request);
  return user && user["role"] === 'admin' ? json(user) : redirect("/progress");
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const price = parseFloat(formData.get("price")?.toString() || "0");
  const translationEn = formData.get("translationEn")?.toString();
  const translationEl = formData.get("translationEl")?.toString();

  const bookFile = formData.get("bookFile") as File;
  const coverImage = formData.get("coverImage") as File;

  if (!title || !description || !translationEn || !translationEl || !bookFile || !coverImage) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    const bookBuffer = Buffer.from(await bookFile.arrayBuffer());
    const coverBuffer = Buffer.from(await coverImage.arrayBuffer());

    const bookBase64 = `data:${bookFile.type};base64,${bookBuffer.toString("base64")}`;
    const coverBase64 = `data:${coverImage.type};base64,${coverBuffer.toString("base64")}`;

    const bookUpload = await uploadFile(bookBase64, "books");
    const coverUpload = await uploadFile(coverBase64, "books/covers");

    // Create MediaFile for book
    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName: bookFile.name,
        contentType: bookFile.type,
        url: bookUpload.url,
      },
    });

    // Create Translation
    const translation = await prisma.translation.create({
      data: {
        en: translationEn,
        el: translationEl,
      },
    });

    // Create Book
    await prisma.book.create({
      data: {
        title,
        description,
        price,
        fileUrl: bookUpload.url,
        coverImage: coverUpload.url,
        mediaFileId: mediaFile.id,
        translationId: translation.id,
      },
    });

    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Failed to upload book" }, { status: 500 });
  }
};

export default function UploadBookPage() {
  const actionData = useActionData();

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Upload a Book</h1>
      <Form method="post" encType="multipart/form-data" className="space-y-4">
        <input name="title" type="text" placeholder="Book Title" required className="w-full p-2 border" />
        <textarea name="description" placeholder="Description" required className="w-full p-2 border" />
        <input name="price" type="number" step="0.01" placeholder="Price" required className="w-full p-2 border" />

        <input name="translationEn" type="text" placeholder="English Translation" required className="w-full p-2 border" />
        <input name="translationEl" type="text" placeholder="Greek Translation" required className="w-full p-2 border" />

        <label>Book File (PDF):</label>
        <input name="bookFile" type="file" accept="application/pdf" required className="w-full p-2 border" />

        <label>Cover Image:</label>
        <input name="coverImage" type="file" accept="image/*" required className="w-full p-2 border" />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
      </Form>

      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
      {actionData?.success && <p className="text-green-600">Book uploaded successfully!</p>}
    </div>
  );
}
