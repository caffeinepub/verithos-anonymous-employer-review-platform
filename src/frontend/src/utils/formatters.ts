export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleString('bg-BG');
}

export function formatDateShort(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('bg-BG');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

export function formatBlockchainHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return hash.slice(0, 8) + '...' + hash.slice(-8);
}

export function generateReviewHash(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function normalizeWebsiteUrl(url: string): string {
  if (!url.trim()) return '';
  
  const trimmedUrl = url.trim();
  
  // If URL already has protocol, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If it's just a domain, prepend https://
  return `https://${trimmedUrl}`;
}

export function validateEIK(eik: string): boolean {
  // Basic EIK validation - should be 9 or 13 digits
  const cleanEik = eik.replace(/\D/g, '');
  return cleanEik.length === 9 || cleanEik.length === 13;
}

export function getFileTypeFromPath(path: string): 'image' | 'pdf' | 'audio' | 'video' | 'other' {
  const extension = path.split('.').pop()?.toLowerCase();
  
  if (!extension) return 'other';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'image';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) {
    return 'audio';
  }
  
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
    return 'video';
  }
  
  return 'other';
}
