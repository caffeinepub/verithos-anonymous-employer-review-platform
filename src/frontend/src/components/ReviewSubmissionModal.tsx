import React, { useState } from 'react';
import { X, Upload, AlertTriangle, Info, Camera, CheckCircle, FileText, Volume2, Film } from 'lucide-react';
import { useSubmitReview } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import RatingInput from './RatingInput';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export default function ReviewSubmissionModal({ isOpen, onClose, companyId }: ReviewSubmissionModalProps) {
  const submitReview = useSubmitReview();
  const { uploadFile, isUploading } = useFileUpload();
  const { identity } = useInternetIdentity();
  
  const [reviewContent, setReviewContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  
  // Rating states
  const [payRating, setPayRating] = useState(0);
  const [workConditionsRating, setWorkConditionsRating] = useState(0);
  const [managementRating, setManagementRating] = useState(0);
  const [jobSecurityRating, setJobSecurityRating] = useState(0);
  const [otherRating, setOtherRating] = useState(0);

  if (!isOpen) return null;

  const validateFileSize = (files: File[]): { isValid: boolean; error?: string } => {
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
  };

  const getFileTypeIcon = (fileName: string) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileName.match(/\.pdf$/i);
    const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i);

    if (isImage) return <Camera className="w-4 h-4 text-green-500" />;
    if (isPdf) return <FileText className="w-4 h-4 text-red-500" />;
    if (isAudio) return <Volume2 className="w-4 h-4 text-purple-500" />;
    if (isVideo) return <Film className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getFileTypeLabel = (fileName: string) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileName.match(/\.pdf$/i);
    const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i);

    if (isImage) return 'Изображение';
    if (isPdf) return 'PDF';
    if (isAudio) return 'Аудио';
    if (isVideo) return 'Видео';
    return 'Файл';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const allFiles = [...selectedFiles, ...newFiles];
    
    const validation = validateFileSize(allFiles);
    if (!validation.isValid) {
      setFileSizeError(validation.error || 'Грешка при валидиране на файловете');
      return;
    }

    setFileSizeError(null);
    setSelectedFiles(allFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Revalidate after removal
    const validation = validateFileSize(newFiles);
    if (validation.isValid) {
      setFileSizeError(null);
    }
  };

  const resetForm = () => {
    setReviewContent('');
    setSelectedFiles([]);
    setFileSizeError(null);
    setValidationError(null);
    setPayRating(0);
    setWorkConditionsRating(0);
    setManagementRating(0);
    setJobSecurityRating(0);
    setOtherRating(0);
    setSuccessMessage(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError(null);

    // Check if user is authenticated
    if (!identity) {
      alert('Моля, влезте в профила си преди да публикувате мнение.');
      return;
    }

    // Validate mandatory fields
    if (!reviewContent.trim() || payRating === 0 || workConditionsRating === 0 || managementRating === 0 || jobSecurityRating === 0 || otherRating === 0) {
      setValidationError('Моля, попълнете всички задължителни полета');
      return;
    }

    // Final validation before submission
    if (selectedFiles.length > 0) {
      const validation = validateFileSize(selectedFiles);
      if (!validation.isValid) {
        setFileSizeError(validation.error || 'Грешка при валидиране на файловете');
        return;
      }
    }

    try {
      const evidencePaths: string[] = [];
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            // Preserve original filename - only sanitize for safe storage
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `evidence/${companyId}/${sanitizedFileName}`;
            
            // Upload file with proper authentication
            const uploadResult = await uploadFile(filePath, file);
            
            if (!uploadResult || !uploadResult.path) {
              throw new Error(`Неуспешно качване на файл: ${file.name}`);
            }
            
            evidencePaths.push(uploadResult.path);
          } catch (uploadError: any) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            // Provide more specific error message
            const errorMsg = uploadError?.message || uploadError?.toString() || 'Неизвестна грешка';
            throw new Error(`Грешка при качване на файл "${file.name}": ${errorMsg}`);
          }
        }
      }

      // Generate unique hash for the review
      const hash = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Submit review with uploaded file paths
      await submitReview.mutateAsync({
        companyId,
        content: reviewContent.trim(),
        evidencePaths,
        hash,
        payRating,
        workConditionsRating,
        managementRating,
        jobSecurityRating,
        otherRating,
      });

      // Show success message and hide form
      setSuccessMessage('Мнението беше публикувано успешно. Благодарим ви за споделения опит!');
      setShowForm(false);

    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error?.message || 'Възникна грешка при публикуването на мнението. Моля, опитайте отново.';
      alert(errorMessage);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSuccessClose = () => {
    setSuccessMessage(null);
    resetForm();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[95vh] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Споделете вашето мнение</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Validation Error Message */}
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md mobile-notification">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800 font-medium mobile-long-text break-words">
                  {validationError}
                </p>
              </div>
            </div>
          )}

          {/* Success Message - Standalone Notification Bubble */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md mobile-notification success-notification-bubble">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium mb-2">
                      {successMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSuccessClose}
                  className="text-green-400 hover:text-green-600 transition-colors p-1 ml-2 flex-shrink-0"
                  title="Затворете съобщението"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Form - Only show if not successful */}
          {showForm && !successMessage && (
            <>
              {/* Cyrillic Writing Encouragement Message */}
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md mobile-notification">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800 text-sm leading-relaxed mobile-long-text break-words">
                    Моля, пишете на кирилица. Така запазваме българския език и правим съдържанието четливо и разбираемо за всички. Истината е най-силна, когато е изразена ясно.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Categories */}
                <div className="bg-gray-50 p-6 rounded-lg mobile-p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 text-center mobile-long-text">Оценете по категории (задължително)</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 mobile-rating-grid">
                      <div className="bg-white p-4 rounded-md border border-gray-200 mobile-p-3">
                        <RatingInput
                          label="Заплащане"
                          value={payRating}
                          onChange={setPayRating}
                          required
                          hint="Справедливост на възнаграждението и навременност на плащанията"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-md border border-gray-200 mobile-p-3">
                        <RatingInput
                          label="Работни условия"
                          value={workConditionsRating}
                          onChange={setWorkConditionsRating}
                          required
                          hint="Оборудване, работна среда и баланс работа/почивка"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-md border border-gray-200 mobile-p-3">
                        <RatingInput
                          label="Отношение на ръководството"
                          value={managementRating}
                          onChange={setManagementRating}
                          required
                          hint="Уважение, комуникация и подкрепа"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-md border border-gray-200 mobile-p-3">
                        <RatingInput
                          label="Сигурност на работното място"
                          value={jobSecurityRating}
                          onChange={setJobSecurityRating}
                          required
                          hint="Трудов договор, постоянство и стабилност"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-md border border-gray-200 mobile-p-3">
                        <RatingInput
                          label="Други"
                          value={otherRating}
                          onChange={setOtherRating}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mobile-form-section">
                  <label htmlFor="reviewContent" className="block text-sm font-medium text-gray-700 mb-1">
                    Вашето мнение <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reviewContent"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent mobile-form-input mobile-long-text ${
                      validationError && !reviewContent.trim() ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Опишете конкретно вашия опит - какво беше положително и какво може да се подобри."
                    required
                  />
                </div>
                
                <div className="mobile-form-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Доказателства (по избор)
                  </label>
                  
                  {/* Evidence Upload Information */}
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md mobile-notification">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800 mobile-long-text break-words">
                        Качването на доказателства е по избор, но помага за по-голяма достоверност.
                      </p>
                    </div>
                  </div>
                  
                  {/* File Upload */}
                  <div className="mobile-wrap-elements mb-4">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition-colors icon-text-inline mobile-btn-sm mobile-touch-target">
                      <Upload className="w-4 h-4" />
                      <span>Изберете файлове</span>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,audio/*,video/*"
                        multiple
                        className="hidden"
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <span className="text-sm text-gray-600 mobile-long-text">
                        {selectedFiles.length} файл{selectedFiles.length !== 1 ? 'а' : ''} избран{selectedFiles.length !== 1 ? 'и' : ''}
                      </span>
                    )}
                  </div>

                  {/* File Size Error */}
                  {fileSizeError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md mobile-notification">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                          <p className="font-medium">Грешка при размера на файловете</p>
                          <p className="mobile-long-text break-words">{fileSizeError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Избрани файлове:</h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="mobile-wrap-elements p-2 bg-gray-50 rounded-md">
                            <div className="mobile-wrap-elements flex-1 min-w-0">
                              {getFileTypeIcon(file.name)}
                              <span className="text-sm text-gray-700 mobile-truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(file.size)})
                              </span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {getFileTypeLabel(file.name)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 p-1 mobile-touch-target flex-shrink-0"
                              title="Премахни файла"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total size display */}
                      <div className="text-xs text-gray-500 mobile-long-text">
                        Общ размер: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))} / 300 MB
                      </div>
                    </div>
                  )}

                  {/* File Type and Size Information */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md mobile-notification">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Поддържани файлове и ограничения</p>
                        <ul className="text-xs space-y-1 mobile-long-text">
                          <li>Изображения: JPG, PNG, GIF, WebP</li>
                          <li>PDF документи</li>
                          <li>Аудио файлове: MP3, WAV, OGG, M4A, AAC</li>
                          <li>Видео файлове: MP4, WebM, MOV, AVI, MKV</li>
                          <li>Максимум 100 MB на файл</li>
                          <li>Максимум 300 MB общо на мнение</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Personal Data Responsibility Warning */}
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md mobile-notification">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Важно: Отговорност за лични данни</p>
                        <p className="mobile-long-text break-words">Вие носите пълна отговорност за скриването или премахването на всички лични данни, които нарушават законите за защита на данните. Платформата не носи отговорност за съдържанието на качените файлове.</p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Warning */}
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md mobile-notification">
                    <div className="flex items-start space-x-2">
                      <Camera className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-orange-800">
                        <p className="font-medium mb-1">Внимание: Метаданни във файловете</p>
                        <p className="mobile-long-text break-words">Платформата НЕ премахва метаданни (EXIF, GPS координати, дата, час и др.) от качените файлове. Всички лични данни в метаданните ще останат във файла, освен ако не ги премахнете преди качване. Отговорността за премахването на чувствителни метаданни е изцяло ваша.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer - Only show if form is visible */}
        {showForm && !successMessage && (
          <div className="border-t border-gray-200 p-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors mobile-btn mobile-touch-target"
              >
                Отказ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitReview.isPending || isUploading || !!fileSizeError || !identity}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 mobile-btn mobile-touch-target"
              >
                {submitReview.isPending || isUploading ? 'Публикуване...' : 'Публикувайте'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
