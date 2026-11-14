import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  EXTENSIONS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  isImage,
  isVideo,
} from './uploadTypes';

// Where the bytes land. Default keeps everything inside the app so dev works
// with no setup; on the VPS set UPLOAD_DIR to a folder outside the repo (or
// symlink public/uploads to one) so a redeploy cannot wipe customer uploads.
//
// The path is assembled from runtime values on purpose. Written literally as
// `path.join(process.cwd(), 'public', 'uploads')`, Turbopack folds it into a
// directory asset reference and walks the whole folder during `next build`.
// Where public/uploads is a symlink to storage outside the repo, that walk
// aborts the build with "Symlink ... points out of the filesystem root".
const UPLOAD_SEGMENTS = ['public', 'uploads'];
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.resolve(process.cwd(), UPLOAD_SEGMENTS.join(path.sep));

// Public URL prefix. Files are always served from /uploads/... regardless of
// where UPLOAD_DIR points.
const PUBLIC_PREFIX = '/uploads';

/**
 * Validates and writes one uploaded file to disk.
 * Returns { url, fileName, size, type } or throws an Error whose message is
 * safe to show a non-technical user.
 *
 * ponytail: the whole file is buffered in memory (Next parses formData for us).
 * Fine at a 50MB video cap; switch to a streaming parser if limits go higher.
 */
export async function saveUpload(file, { allowVideo = false } = {}) {
  if (!file || typeof file === 'string') {
    throw new Error('Please choose a file to upload.');
  }

  if (file.size === 0) {
    throw new Error('That file is empty. Please pick a different file.');
  }

  const video = isVideo(file.type);

  if (!isImage(file.type) && !video) {
    throw new Error(
      'This file type is not supported. Please upload a JPG, PNG, WebP, GIF or AVIF image.'
    );
  }

  if (video && !allowVideo) {
    throw new Error('Videos cannot be uploaded here. Please choose an image.');
  }

  const limit = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(
      `This file is ${(file.size / 1024 / 1024).toFixed(1)}MB, which is over the ${
        limit / 1024 / 1024
      }MB limit. Please upload a smaller file.`
    );
  }

  // Group by year/month so one folder never holds tens of thousands of files.
  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fileName = `${randomUUID()}.${EXTENSIONS[file.type]}`;
  const destination = path.join(UPLOAD_DIR, folder);

  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, fileName), Buffer.from(await file.arrayBuffer()));

  return {
    url: `${PUBLIC_PREFIX}/${folder}/${fileName}`,
    fileName,
    size: file.size,
    type: file.type,
  };
}
