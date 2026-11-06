// Shared browser-side image upload. Returns { url } or throws an Error whose
// message is safe to show a non-technical user.
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './uploadTypes';

export async function uploadImage(file) {
  if (!file) throw new Error('Please choose an image file to upload.');

  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('This file type is not supported. Please upload a JPG, PNG, WebP, GIF or AVIF image.');
  }

  if (file.size === 0) {
    throw new Error('That file is empty. Please pick a different image.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `This image is ${(file.size / 1024 / 1024).toFixed(1)}MB, which is too large. Please upload an image under ${
        MAX_IMAGE_BYTES / 1024 / 1024
      }MB.`
    );
  }

  const body = new FormData();
  body.append('image', file);

  let data;
  try {
    const response = await fetch('/api/upload/blog-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body,
    });
    data = await response.json();
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error('Could not reach the server. Please check your internet connection and try again.');
  }

  if (!data?.success) {
    throw new Error(data?.message || 'The image could not be uploaded. Please try again.');
  }

  return data.data;
}
