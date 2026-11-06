// Video utilities for handling various video platform URLs

// Extract video ID from different platforms
export function getVideoId(url) {
  if (!url) return null;

  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      platform: 'youtube',
      id: youtubeMatch[1]
    };
  }

  // Vimeo patterns
  const vimeoRegex = /(?:vimeo\.com\/)(?:.*#|.*\/)*([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      platform: 'vimeo',
      id: vimeoMatch[1]
    };
  }

  // Daily Motion patterns
  const dailyMotionRegex = /(?:dailymotion\.com\/video\/)([^_\?]+)/;
  const dailyMotionMatch = url.match(dailyMotionRegex);
  if (dailyMotionMatch) {
    return {
      platform: 'dailymotion',
      id: dailyMotionMatch[1]
    };
  }

  // Direct video file patterns
  const directVideoRegex = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i;
  if (directVideoRegex.test(url)) {
    return {
      platform: 'direct',
      id: url
    };
  }

  return null;
}

// Generate embed URL for different platforms
export function getEmbedUrl(url) {
  const videoInfo = getVideoId(url);
  if (!videoInfo) return null;

  switch (videoInfo.platform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${videoInfo.id}?rel=0&modestbranding=1`;
    
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoInfo.id}?color=ffffff&title=0&byline=0&portrait=0`;
    
    case 'dailymotion':
      return `https://www.dailymotion.com/embed/video/${videoInfo.id}`;
    
    case 'direct':
      return videoInfo.id;
    
    default:
      return null;
  }
}

// Generate thumbnail URL for different platforms
export function getThumbnailUrl(url) {
  const videoInfo = getVideoId(url);
  if (!videoInfo) return null;

  switch (videoInfo.platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${videoInfo.id}/maxresdefault.jpg`;
    
    case 'vimeo':
      // Vimeo thumbnails require API call, return placeholder for now
      return `https://vumbnail.com/${videoInfo.id}.jpg`;
    
    case 'dailymotion':
      return `https://www.dailymotion.com/thumbnail/video/${videoInfo.id}`;
    
    case 'direct':
      return null; // No thumbnail for direct videos
    
    default:
      return null;
  }
}

// Validate if URL is a supported video platform
export function isValidVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const videoInfo = getVideoId(url);
  return videoInfo !== null;
}

// Get platform name for display
export function getPlatformName(url) {
  const videoInfo = getVideoId(url);
  if (!videoInfo) return 'Unknown';

  switch (videoInfo.platform) {
    case 'youtube':
      return 'YouTube';
    case 'vimeo':
      return 'Vimeo';
    case 'dailymotion':
      return 'Dailymotion';
    case 'direct':
      return 'Direct Video';
    default:
      return 'Unknown';
  }
}

// Create video player component props
export function getVideoPlayerProps(url) {
  const embedUrl = getEmbedUrl(url);
  const videoInfo = getVideoId(url);
  
  if (!embedUrl || !videoInfo) return null;

  const baseProps = {
    src: embedUrl,
    title: 'Property Video',
    allowFullScreen: true,
    loading: 'lazy'
  };

  // Platform-specific props
  switch (videoInfo.platform) {
    case 'youtube':
    case 'vimeo':
    case 'dailymotion':
      return {
        ...baseProps,
        frameBorder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      };
    
    case 'direct':
      return {
        src: videoInfo.id,
        controls: true,
        preload: 'metadata'
      };
    
    default:
      return baseProps;
  }
}