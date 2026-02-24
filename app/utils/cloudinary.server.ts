import { writeAsyncIterableToWritable } from "@remix-run/node";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Types
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  public_id?: string;
  overwrite?: boolean;
  tags?: string[];
}

/**
 * Upload a file to Cloudinary from Base64
 * @param base64Data - Base64 encoded file data (with or without data URI prefix)
 * @param options - Upload options
 * @returns CloudinaryUploadResult
 */
export async function uploadToCloudinary(
  base64Data: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'maths-joy/exercises',
    resource_type = 'raw', // 'raw' for PDFs
    public_id,
    overwrite = false,
    tags = [],
  } = options;

  // Ensure base64 data has the proper prefix for PDFs
  let dataUri = base64Data;
  if (!base64Data.startsWith('data:')) {
    dataUri = `data:application/pdf;base64,${base64Data}`;
  }

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type,
      public_id,
      overwrite,
      tags,
      // For PDFs, we want to allow direct access
      access_mode: 'public',
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param filename - Original filename
 * @param options - Upload options
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'maths-joy/exercises',
    resource_type = 'raw',
    tags = [],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        tags,
        access_mode: 'public',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload file to Cloudinary'));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (default: 'raw' for PDFs)
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Generate a signed URL for secure file access
 * @param publicId - The public ID of the file
 * @param options - URL generation options
 */
export function generateSignedUrl(
  publicId: string,
  options: {
    expiresIn?: number; // seconds
    resourceType?: 'image' | 'video' | 'raw';
  } = {}
): string {
  const { expiresIn = 3600, resourceType = 'raw' } = options;

  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    expires_at: timestamp,
  });
}

/**
 * Get the direct URL for a public file
 * @param publicId - The public ID of the file
 * @param resourceType - The resource type
 */
export function getPublicUrl(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
}

/**
 * Upload an image with transformations (for thumbnails)
 * @param base64Data - Base64 encoded image
 * @param options - Upload and transformation options
 */
export async function uploadImageWithTransform(
  base64Data: string,
  options: {
    folder?: string;
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  } = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'maths-joy/thumbnails',
    width = 400,
    height = 300,
    crop = 'fill',
    quality = 'auto',
  } = options;

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: 'image',
      transformation: [
        { width, height, crop, quality },
      ],
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload a file to Cloudinary using streaming (for large files like 100MB PDFs)
 * Uses upload_stream and writeAsyncIterableToWritable to avoid loading entire file into memory
 * @param data - AsyncIterable of file data chunks
 * @param options - Upload options (folder, resource_type, tags, public_id)
 * @returns CloudinaryUploadResult
 */
export async function uploadStreamToCloudinary(
  data: AsyncIterable<Uint8Array>,
  options: {
    folder: string;
    resource_type: "raw" | "image";
    tags?: string[];
    public_id?: string;
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type,
        tags: options.tags,
        public_id: options.public_id,
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary stream upload error:", error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
          });
        }
      }
    );
    writeAsyncIterableToWritable(data, uploadStream).catch(reject);
  });
}

// Export cloudinary instance for advanced usage
export { cloudinary };
