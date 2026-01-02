import { LoaderFunction } from '@remix-run/node';
import { verifyDownloadToken } from '~/utils/stripe.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { token } = params;

  if (!token) {
    throw new Response('Download token required', { status: 400 });
  }

  // Verify token and get book info
  const result = await verifyDownloadToken(token);

  if (!result) {
    throw new Response('Invalid or expired download token', { status: 403 });
  }

  try {
    // Fetch the PDF from Cloudinary
    const response = await fetch(result.cloudinaryUrl);

    if (!response.ok) {
      throw new Response('Failed to fetch file', { status: 502 });
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();

    // Sanitize filename for Content-Disposition header
    const safeFilename = result.title
      .replace(/[^a-zA-Z0-9\u0370-\u03FF\s\-_]/g, '') // Allow Greek chars
      .trim()
      .replace(/\s+/g, '_');

    // Return the file with proper headers for download
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(result.title)}.pdf`,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    throw new Response('Download failed', { status: 500 });
  }
};

// No component needed - this route just handles the download
export default function Download() {
  return null;
}
