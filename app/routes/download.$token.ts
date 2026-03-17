import { LoaderFunction } from '@remix-run/node';
import { generateSignedUrl } from '~/utils/cloudinary.server';
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
    // Generate a short-lived signed URL (15 min) instead of using the permanent public URL
    const signedUrl = generateSignedUrl(result.cloudinaryPublicId, {
      expiresIn: 900,
      resourceType: 'raw',
    });

    // Fetch the PDF from Cloudinary via signed URL
    const response = await fetch(signedUrl);

    if (!response.ok) {
      throw new Response('Failed to fetch file', { status: 502 });
    }

    // ASCII-safe filename for Content-Disposition (fallback)
    const asciiFilename = result.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'download';

    // Stream the PDF directly from Cloudinary to avoid buffering in memory
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(result.title)}.pdf`,
        ...(response.headers.get('content-length')
          ? { 'Content-Length': response.headers.get('content-length')! }
          : {}),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    throw new Response('Download failed', { status: 500 });
  }
};

