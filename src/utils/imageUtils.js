// utils/imageUtils.js

/**
 * Normalizes image URLs from the backend
 * Handles null, undefined, 'null' string values and fixes malformed URLs
 */
export const normalizeImageUrl = (url) => {
  if (!url || url === 'null' || url === null || url === undefined) {
    return '';
  }
  
  // Fix malformed URLs (http:/ instead of http://)
  if (typeof url === 'string' && url.startsWith('http:/') && !url.startsWith('http://')) {
    return url.replace('http:/', 'http://');
  }
  
  return url;
};

/**
 * Gets the display image URL with fallback
 */
export const getDisplayImageUrl = (course, fallbackUrl = '/default-course-image.jpg') => {
 
  const thumbnailUrl = normalizeImageUrl(course.thumbnailUrl);
  
  return thumbnailUrl || fallbackUrl;
};

/**
 * Validates if an image URL is valid
 */
export const isValidImageUrl = (url) => {
  if (!url || url === 'null' || url === null || url === undefined) {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formats image URLs for course objects
 */
export const formatCourseImages = (course) => {
  return {
    ...course,
    imageUrl: normalizeImageUrl(course.imageUrl),
    thumbnailUrl: normalizeImageUrl(course.thumbnailUrl),
  };
};