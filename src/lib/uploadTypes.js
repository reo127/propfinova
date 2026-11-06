// Shared between the browser and the API routes — keep one list, not four.
// `image/jpg` is NOT a real MIME type; browsers always report `image/jpeg`.
export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
];

export const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-m4v',
];

// File extension per MIME type. Uploads are renamed using this map, so a
// malicious filename can never decide what lands on disk.
export const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

// For <input accept="..."> — the file picker greys out everything else.
export const ACCEPT_IMAGES = IMAGE_TYPES.join(',');
export const ACCEPT_VIDEOS = VIDEO_TYPES.join(',');

export const isImage = (type) => IMAGE_TYPES.includes(type);
export const isVideo = (type) => VIDEO_TYPES.includes(type);

export function describeLimit(type) {
  return isVideo(type)
    ? `${MAX_VIDEO_BYTES / 1024 / 1024}MB`
    : `${MAX_IMAGE_BYTES / 1024 / 1024}MB`;
}
