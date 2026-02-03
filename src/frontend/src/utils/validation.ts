export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFileSize(files: File[]): FileValidationResult {
  const maxFileSize = 100 * 1024 * 1024; // 100 MB
  const maxTotalSize = 300 * 1024 * 1024; // 300 MB

  // Check individual file sizes
  for (const file of files) {
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `Файлът "${file.name}" е твърде голям (${(file.size / 1024 / 1024).toFixed(1)} MB). Максималният размер е 100 MB на файл.`
      };
    }
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      error: `Общият размер на файловете е твърде голям (${(totalSize / 1024 / 1024).toFixed(1)} MB). Максималният общ размер е 300 MB.`
    };
  }

  return { isValid: true };
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // PDF
    'application/pdf',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ];

  return allowedTypes.includes(file.type) || 
         file.name.match(/\.(jpg|jpeg|png|gif|webp|pdf|mp3|wav|ogg|m4a|aac|mp4|webm|mov|avi|mkv)$/i) !== null;
}

export function validateRatings(ratings: { [key: string]: number }): boolean {
  const requiredRatings = ['payRating', 'workConditionsRating', 'managementRating', 'jobSecurityRating', 'otherRating'];
  
  return requiredRatings.every(rating => 
    ratings[rating] && ratings[rating] >= 1 && ratings[rating] <= 5
  );
}

export function validateCompanyData(data: {
  name: string;
  description: string;
  managerName: string;
  registrationNumber: string;
  sector: string;
  city: string;
}): string[] {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('Името на фирмата е задължително');
  }

  if (!data.description.trim()) {
    errors.push('Описанието е задължително');
  }

  if (!data.managerName.trim()) {
    errors.push('Името на управителя е задължително');
  }

  if (!data.registrationNumber.trim()) {
    errors.push('ЕИК е задължителен');
  } else if (!/^\d+$/.test(data.registrationNumber)) {
    errors.push('ЕИК трябва да съдържа само цифри');
  }

  if (!data.sector) {
    errors.push('Секторът е задължителен');
  }

  if (!data.city.trim()) {
    errors.push('Градът е задължителен');
  }

  return errors;
}
