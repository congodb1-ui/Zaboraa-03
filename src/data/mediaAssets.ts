// Centralized Google Drive & Media Assets Configuration
// Allows hosting images, videos, and PDFs on Google Drive with fallback to bundled local assets.

export const GOOGLE_DRIVE_CONFIG = {
  folderId: '1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io',
  folderUrl: 'https://drive.google.com/drive/folders/1sFG8NLUcajo8DuCs7jq9ChYK-rksx7Io?usp=sharing',
  shareBaseUrl: 'https://drive.google.com/file/d/',
  previewBaseUrl: 'https://drive.google.com/file/d/{id}/preview',
  thumbnailBaseUrl: 'https://lh3.googleusercontent.com/d/',
};

/**
 * Resolves a media URL.
 * If given a Google Drive file ID (e.g. "gdrive:1abcXYZ..."), returns direct Google Drive URL.
 * If given an existing local path or URL, returns that URL, or falls back to local assets if unavailable.
 */
export function resolveMediaUrl(pathOrId: string | undefined, fallbackLocalPath: string = '/assets/images/hero_cloud_datacenter_1791450064361.jpg'): string {
  if (!pathOrId) return fallbackLocalPath;

  // Google Drive file ID prefix
  if (pathOrId.startsWith('gdrive:')) {
    const fileId = pathOrId.replace('gdrive:', '').trim();
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Already a full external URL
  if (pathOrId.startsWith('http://') || pathOrId.startsWith('https://')) {
    return pathOrId;
  }

  // Local assets normalization
  if (pathOrId.startsWith('/src/assets/images/')) {
    return pathOrId.replace('/src/assets/images/', '/assets/images/');
  }

  return pathOrId;
}

/**
 * Converts a Google Drive link or file ID to an embeddable preview URL
 */
export function getDrivePreviewUrl(fileIdOrUrl: string): string {
  if (fileIdOrUrl.includes('/file/d/')) {
    const match = fileIdOrUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  if (fileIdOrUrl.startsWith('gdrive:')) {
    const id = fileIdOrUrl.replace('gdrive:', '').trim();
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return fileIdOrUrl;
}
