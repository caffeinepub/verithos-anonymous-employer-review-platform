import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Camera, Volume2, Film, Loader2 } from 'lucide-react';
import { useSubmitOfficialResponse } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { OfficialResponse } from '../backend';

interface OfficialResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  companyId: string;
  existingResponse?: OfficialResponse;
}

type OperationMode = 'create' | 'edit';

export default function OfficialResponseModal({ isOpen, onClose, reviewId, companyId, existingResponse }: OfficialResponseModalProps) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedOperationMode, setCompletedOperationMode] = useState<OperationMode | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Use ref to capture the initial mode when modal opens to prevent changes during operation
  const initialModeRef = useRef<OperationMode>('create');

  const submitResponse = useSubmitOfficialResponse();
  const { uploadFile } = useFileUpload();
  const { identity } = useInternetIdentity();

  // Determine operation mode based on existingResponse prop
  const mode: OperationMode = existingResponse ? 'edit' : 'create';

  // Capture initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      initialModeRef.current = existingResponse ? 'edit' : 'create';
    }
  }, [isOpen, existingResponse]);

  // Pre-populate form when editing existing response
  useEffect(() => {
    if (existingResponse && isOpen) {
      setContent(existingResponse.content);
      // Note: We don't pre-populate files as they're already uploaded
      // User can add new files if needed
    } else if (!isOpen) {
      // Reset form when modal closes
      setContent('');
      setSelectedFiles([]);
      setUploadProgress({});
      setShowSuccess(false);
      setCompletedOperationMode(null);
    }
  }, [existingResponse, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Моля, въведете текст за отговора.');
      return;
    }

    // Check if user is authenticated
    if (!identity) {
      alert('Моля, влезте в профила си преди да публикувате отговор.');
      return;
    }

    // NO SUBSCRIPTION CHECK - Access based only on approved official profile status
    // The backend will validate that the user has an approved official profile

    setIsSubmitting(true);

    try {
      // Upload new evidence files (if any)
      const evidencePaths: string[] = [];
      
      // If editing, keep existing evidence paths
      if (initialModeRef.current === 'edit' && existingResponse) {
        evidencePaths.push(...existingResponse.evidencePaths);
      }
      
      // Upload new files
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          // Preserve original filename - only sanitize for safe storage
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `official-responses/${companyId}/${sanitizedFileName}`;
          
          // Upload file with progress tracking and proper authentication
          const uploadResult = await uploadFile(
            filePath,
            file,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            }
          );
          
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

      // Generate hash for the response
      const hash = initialModeRef.current === 'edit' && existingResponse 
        ? existingResponse.hash // Keep original hash when editing
        : `response-${reviewId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Capture the initial operation mode (from when modal opened) for the success message
      const operationMode = initialModeRef.current;

      // Submit official response (create or edit)
      await submitResponse.mutateAsync({
        reviewId,
        companyId,
        content,
        evidencePaths,
        hash,
        isEdit: operationMode === 'edit',
      });

      // Record which operation was completed for the success message
      // This ensures the message reflects the actual operation performed
      setCompletedOperationMode(operationMode);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setContent('');
        setSelectedFiles([]);
        setUploadProgress({});
        setShowSuccess(false);
        setCompletedOperationMode(null);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting official response:', error);
      const errorMessage = error?.message || 'Възникна грешка при публикуването на отговора. Моля, опитайте отново.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setSelectedFiles([]);
      setUploadProgress({});
      setShowSuccess(false);
      setCompletedOperationMode(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Редактиране на официален отговор' : 'Официален отговор'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {completedOperationMode === 'edit' ? 'Отговорът е редактиран успешно!' : 'Отговорът е публикуван успешно!'}
              </h3>
              <p className="text-gray-600">
                {completedOperationMode === 'edit' ? 'Промените са запазени.' : 'Вашият официален отговор е видим под мнението.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text Content */}
              <div>
                <label htmlFor="response-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Текст на отговора <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="response-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Напишете вашия официален отговор..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Доказателства (по избор)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Можете да прикачите изображения, PDF документи, аудио или видео файлове.
                  {mode === 'edit' && existingResponse && existingResponse.evidencePaths.length > 0 && (
                    <span className="block mt-1 text-blue-600">
                      Съществуващите файлове ще бъдат запазени. Можете да добавите нови.
                    </span>
                  )}
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="evidence-upload"
                    multiple
                    accept="image/*,.pdf,audio/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Кликнете за избор на файлове
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Максимум 100 MB на файл, до 300 MB общо
                    </span>
                  </label>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Нови файлове за качване:</p>
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(file.name)}
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="flex items-center space-x-2 mr-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {uploadProgress[file.name]}%
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Files Display (when editing) */}
                {mode === 'edit' && existingResponse && existingResponse.evidencePaths.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Съществуващи файлове (ще бъдат запазени):</p>
                    {existingResponse.evidencePaths.map((path, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                      >
                        {getFileIcon(path)}
                        <span className="text-sm text-gray-700 truncate">{path.split('/').pop()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim() || !identity}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'edit' ? 'Запазване...' : 'Публикуване...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'edit' ? 'Запази промените' : 'Публикувай'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
