// Constants for validation
const PASSWORD_MIN_LENGTH = 8;
const FILE_MAX_SIZE_MB = 10;

const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const validateEmail = (email: string): string | undefined => {
  const validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  const trimmedEmail = email?.trim();
  if (!trimmedEmail?.length || !validRegex.test(trimmedEmail)) {
    return 'errors.invalidEmail';
  }
};

export const validatePassword = (password: string): string | undefined => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return 'errors.passwordTooShort';
  }
};

export const validateName = (name: string): string | undefined => {
  if (!name?.trim().length) return 'errors.requiredField';
};

/**
 * Validates a file for upload
 * @param file - File object or filename string
 * @param allowedTypes - Type of files allowed ('pdf' | 'image')
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 */
export const validateFile = (
  file: File | string,
  allowedTypes: keyof typeof ALLOWED_MIME_TYPES = 'pdf',
  maxSizeMB: number = FILE_MAX_SIZE_MB
): string | undefined => {
  // If it's a File object, validate MIME type and size
  if (file instanceof File) {
    const allowedMimes = ALLOWED_MIME_TYPES[allowedTypes];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!(allowedMimes as readonly string[]).includes(file.type)) {
      return allowedTypes === 'pdf' ? 'errors.pdfOnly' : 'errors.invalidFileType';
    }

    if (file.size > maxSize) {
      return 'errors.fileTooLarge';
    }

    return undefined;
  }

  // Fallback for string filename (legacy support)
  if (typeof file === 'string') {
    const extension = file.split('.').pop()?.toLowerCase();
    if (allowedTypes === 'pdf' && extension !== 'pdf') {
      return 'errors.pdfOnly';
    }
  }

  return undefined;
};

/**
 * Validates redirect URL to prevent open redirect attacks
 */
export const validateRedirectUrl = (url: string | null): string => {
  // Only allow relative URLs starting with /
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return '/';
  }
  return url;
};