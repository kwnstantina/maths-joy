import { LoaderFunction } from '@remix-run/node';
import { applyRateLimit } from '~/utils/ratelimit.server';
import { verifyDownloadToken } from '~/utils/stripe.server';

export const loader: LoaderFunction = async ({ params, request }) => {
  const { token } = params;

  if (!token) {
    throw new Response('Download token required', { status: 400 });
  }

  // Rate limit downloads (20/hr per IP)
  const rateLimitResponse = applyRateLimit(request, 'download');
  if (rateLimitResponse) return rateLimitResponse;

  // Verify token and get book info
  const result = await verifyDownloadToken(token);

  if (!result) {
    throw new Response(
      'Download unavailable. The token may be invalid, expired, or the download limit has been reached.',
      { status: 403 }
    );
  }

  try {
    // Fetch the PDF from Cloudinary
    const response = await fetch(result.cloudinaryUrl);

    if (!response.ok) {
      throw new Response('Failed to fetch file', { status: 502 });
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();

    // ASCII-safe filename for Content-Disposition (fallback)
    const asciiFilename = result.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'download';

    // Return the file with proper headers for download
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(result.title)}.pdf`,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    throw new Response('Download failed', { status: 500 });
  }
};

