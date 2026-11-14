// Ported from the web app's src/utils/videoUtils.js — same platforms, same
// regexes, so a video URL that plays on the site also plays in the app.

export function getVideoId(url) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  if (youtubeMatch) return { platform: "youtube", id: youtubeMatch[1] };

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:.*#|.*\/)*([0-9]+)/);
  if (vimeoMatch) return { platform: "vimeo", id: vimeoMatch[1] };

  const dailyMotionMatch = url.match(/(?:dailymotion\.com\/video\/)([^_?]+)/);
  if (dailyMotionMatch) return { platform: "dailymotion", id: dailyMotionMatch[1] };

  if (/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i.test(url)) {
    return { platform: "direct", id: url };
  }

  return null;
}

export function getEmbedUrl(url) {
  const info = getVideoId(url);
  if (!info) return null;

  switch (info.platform) {
    case "youtube":
      return `https://www.youtube.com/embed/${info.id}?rel=0&modestbranding=1&playsinline=1`;
    case "vimeo":
      return `https://player.vimeo.com/video/${info.id}?color=ffffff&title=0&byline=0&portrait=0`;
    case "dailymotion":
      return `https://www.dailymotion.com/embed/video/${info.id}`;
    case "direct":
      return info.id;
    default:
      return null;
  }
}

export function getThumbnailUrl(url) {
  const info = getVideoId(url);
  if (!info) return null;

  switch (info.platform) {
    case "youtube":
      return `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`;
    case "vimeo":
      return `https://vumbnail.com/${info.id}.jpg`;
    case "dailymotion":
      return `https://www.dailymotion.com/thumbnail/video/${info.id}`;
    default:
      return null;
  }
}

// A direct .mp4 needs a <video> tag wrapper inside the WebView; an embed URL
// is already a full player page and can be loaded as-is.
export function isDirectVideo(url) {
  return getVideoId(url)?.platform === "direct";
}
