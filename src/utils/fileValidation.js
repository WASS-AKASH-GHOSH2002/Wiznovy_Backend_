// utils/fileValidation.js

/**
 * Validates file size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validates file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Gets human readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validates PDF file for study material upload
 * @param {File} file - The PDF file to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validatePDFFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }

  if (!validateFileSize(file, 10)) {
    return { 
      isValid: false, 
      error: `File size (${formatFileSize(file.size)}) exceeds 10MB limit` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates image file for thumbnails/course images
 * @param {File} file - The image file to validate
 * @param {number} maxSizeMB - Maximum size in MB (default 5MB)
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validateFileType(file, allowedTypes)) {
    return { isValid: false, error: 'Only JPG, PNG, and WebP images are allowed' };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return { 
      isValid: false, 
      error: `File size (${formatFileSize(file.size)}) exceeds ${maxSizeMB}MB limit` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates video file for video lectures (no size limit)
 * @param {File} file - The video file to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateVideoFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
  if (!validateFileType(file, allowedTypes)) {
    return { isValid: false, error: 'Only MP4, AVI, MOV, WMV, FLV, and WebM video files are allowed' };
  }

  return { isValid: true, error: null };
};