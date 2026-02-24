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
 * Validates a required field
 * @param value - Field value
 * @param fieldName - Name of the field for error message
 */
export const validateRequiredField = (value: string | null | undefined, fieldName: string): string | undefined => {
  if (!value || !value.trim().length) {
    return `${fieldName} is required`;
  }
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

// Book-specific validation constants
const BOOK_PDF_MAX_SIZE_MB = 100;
const BOOK_THUMBNAIL_MAX_SIZE_MB = 10;

/**
 * Validates a book PDF file
 * @param file - File object to validate
 * @returns Error key string if invalid, undefined if valid
 */
export const validateBookPdf = (file: File): string | undefined => {
  if (file.type !== 'application/pdf') {
    return 'errors.pdfOnly';
  }

  const maxSize = BOOK_PDF_MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSize) {
    return 'errors.fileTooLarge';
  }
};

/**
 * Validates a book thumbnail image file
 * @param file - File object to validate
 * @returns Error key string if invalid, undefined if valid
 */
export const validateBookThumbnail = (file: File): string | undefined => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return 'errors.invalidFileType';
  }

  const maxSize = BOOK_THUMBNAIL_MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSize) {
    return 'errors.fileTooLarge';
  }
};

/**
 * Validates a book price string
 * @param price - Price string to validate
 * @returns Error key string if invalid, undefined if valid
 */
export const validateBookPrice = (price: string): string | undefined => {
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) {
    return 'errors.invalidPrice';
  }

  // Max 2 decimal places
  const parts = price.split('.');
  if (parts[1] && parts[1].length > 2) {
    return 'errors.invalidPrice';
  }
};

/**
 * Validates all required book fields are non-empty
 * @param fields - Object with title, description, price, category
 * @returns Object of field-name-to-error-key pairs if invalid, null if valid
 */
export const validateBookFields = (fields: {
  title: string;
  description: string;
  price: string;
  category: string;
}): Record<string, string> | null => {
  const errors: Record<string, string> = {};

  if (!fields.title?.trim()) {
    errors.title = 'errors.requiredField';
  }
  if (!fields.description?.trim()) {
    errors.description = 'errors.requiredField';
  }
  if (!fields.price?.trim()) {
    errors.price = 'errors.requiredField';
  }
  if (!fields.category?.trim()) {
    errors.category = 'errors.requiredField';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};