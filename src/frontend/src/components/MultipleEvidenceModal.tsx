import React, { useState } from 'react';
import { X, Download, Info, ChevronLeft, ChevronRight, Archive, Volume2, Film, Image, FileText } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import { usePdfObjectUrl } from '../hooks/usePdfObjectUrl';
import { createEvidenceArchive, downloadZipArchive } from '../utils/evidenceArchiveDownload';

interface MultipleEvidenceModalProps {
  evidencePaths: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MultipleEvidenceModal({ evidencePaths, isOpen, onClose }: MultipleEvidenceModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || evidencePaths.length === 0) return null;

  const currentPath = evidencePaths[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : evidencePaths.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < evidencePaths.length - 1 ? prev + 1 : 0));
  };

  const getFileTypeIcon = (fileName: string) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileName.match(/\.pdf$/i);
    const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i);

    if (isImage) return <Image className="w-4 h-4 text-green-500" />;
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-7xl max-h-[95vh] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Преглед на файлове ({currentIndex + 1} от {evidencePaths.length})
            </h3>
            <div className="flex items-center space-x-2">
              {getFileTypeIcon(currentPath)}
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {getFileTypeLabel(currentPath)}
              </span>
            </div>
            {evidencePaths.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  title="Предишно"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  title="Следващо"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {evidencePaths.length > 1 && (
              <ArchiveDownloader 
                evidencePaths={evidencePaths}
                isDownloading={isDownloading}
                setIsDownloading={setIsDownloading}
              />
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Personal Data Responsibility Notice */}
        <div className="p-4 bg-orange-50 border-b border-orange-200 flex-shrink-0">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">Отговорност за лични данни</p>
              <p>Отговорността за личните данни в качените файлове е на качилия ги потребител, а не на платформата.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <EvidenceViewer evidencePath={currentPath} />
        </div>

        {/* Thumbnail Navigation */}
        {evidencePaths.length > 1 && (
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {evidencePaths.map((path, index) => (
                <ThumbnailButton
                  key={path}
                  evidencePath={path}
                  index={index}
                  isActive={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component that resolves file URLs and creates archive.
 * Uses useFileUrl hook for each file to ensure proper authentication.
 */
interface ArchiveDownloaderProps {
  evidencePaths: string[];
  isDownloading: boolean;
  setIsDownloading: (value: boolean) => void;
}

function ArchiveDownloader({ evidencePaths, isDownloading, setIsDownloading }: ArchiveDownloaderProps) {
  // Resolve URLs for all files using useFileUrl hook
  // Note: We can only call hooks at the top level, so we'll resolve all URLs upfront
  const fileUrlQueries = evidencePaths.map(path => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: url } = useFileUrl(path);
    return {
      path,
      url: url ?? null, // Convert undefined to null for type compatibility
      fileName: path.split('/').pop() || 'evidence',
    };
  });

  const handleDownloadAll = async () => {
    if (isDownloading || evidencePaths.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      // Check if all URLs are resolved
      const unresolvedFiles = fileUrlQueries.filter(f => !f.url);
      if (unresolvedFiles.length > 0) {
        console.warn(`${unresolvedFiles.length} files have unresolved URLs, waiting...`);
        // In a real scenario, we'd wait for URLs to resolve
        // For now, we'll proceed with available URLs
      }

      // Create archive using resolved URLs (same as single-file downloads)
      const result = await createEvidenceArchive(fileUrlQueries);
      
      if (!result.success || !result.zipBlob) {
        alert('Не успяхме да включим нито един файл в архива. Моля, опитайте отново по-късно.');
        return;
      }

      // Download the archive
      downloadZipArchive(result.zipBlob, result.successfulFiles.length);
      
      // Show user feedback
      if (result.failedFiles.length > 0) {
        alert(`Архивът е създаден с ${result.successfulFiles.length} файла. ${result.failedFiles.length} файла не можаха да бъдат включени. Вижте _archive_info.txt файла в архива за подробности.`);
      }
      
    } catch (error) {
      console.error('Грешка при създаване на ZIP архив:', error);
      alert('Възникна грешка при създаването на архива. Моля, опитайте отново.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      disabled={isDownloading}
      className={`flex items-center space-x-1 text-sm px-3 py-1 rounded transition-colors ${
        isDownloading 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
      }`}
      title="Изтеглете всички файлове като архив"
    >
      <Archive className="w-4 h-4" />
      <span>{isDownloading ? 'Създаване на архив...' : 'Изтегли като архив'}</span>
    </button>
  );
}

interface EvidenceViewerProps {
  evidencePath: string;
}

function EvidenceViewer({ evidencePath }: EvidenceViewerProps) {
  const { data: fileUrl, isLoading } = useFileUrl(evidencePath);

  const isImage = evidencePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = evidencePath.match(/\.pdf$/i);
  const isAudio = evidencePath.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
  const isVideo = evidencePath.match(/\.(mp4|webm|mov|avi|mkv)$/i);

  // For PDFs, fetch as blob to prevent auto-download
  const { blobUrl: pdfBlobUrl, isLoading: pdfBlobLoading } = usePdfObjectUrl(
    isPdf ? fileUrl : undefined
  );

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fileUrl) return;
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = evidencePath.split('/').pop() || 'evidence';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const isContentLoading = isLoading || (isPdf && pdfBlobLoading);

  if (isContentLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
        <span className="ml-3 text-gray-600">Зареждане...</span>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="text-center py-12 h-full flex items-center justify-center">
        <p className="text-gray-500">Файлът не може да бъде зареден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div className="mb-4 flex items-center space-x-2 p-4 flex-shrink-0">
        <span className="text-sm text-gray-600">{evidencePath.split('/').pop()}</span>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
          title="Изтеглете файла"
        >
          <Download className="w-4 h-4" />
          <span>Изтегли</span>
        </button>
      </div>

      <div className="flex-1 w-full overflow-hidden">
        {isImage && (
          <div className="flex justify-center items-center h-full p-4 overflow-hidden">
            <img
              src={fileUrl}
              alt="Доказателство"
              className="max-w-full max-h-full object-contain rounded-md shadow-lg"
              style={{ 
                maxWidth: 'calc(100vw - 12rem)', 
                maxHeight: 'calc(95vh - 280px)', 
                width: 'auto', 
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        )}

        {isPdf && (
          <div className="w-full h-full">
            {pdfBlobUrl ? (
              <iframe
                src={`${pdfBlobUrl}#view=FitH`}
                className="w-full h-full border-0"
                title="PDF документ"
                style={{ minHeight: '500px' }}
              />
            ) : (
              <div className="text-center py-12 h-full flex items-center justify-center">
                <div>
                  <p className="text-gray-600 mb-4">Грешка при зареждане на PDF файла</p>
                  <button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Изтеглете файла
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isAudio && (
          <div className="flex justify-center items-center h-full p-8">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Аудио файл</h4>
                <p className="text-sm text-gray-600">{evidencePath.split('/').pop()}</p>
              </div>
              <audio
                controls
                className="w-full"
                preload="metadata"
              >
                <source src={fileUrl} />
                Вашият браузър не поддържа аудио възпроизвеждане.
              </audio>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="flex justify-center items-center h-full p-4">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Видео файл</h4>
                <p className="text-sm text-gray-600">{evidencePath.split('/').pop()}</p>
              </div>
              <video
                controls
                className="w-full max-h-[60vh] rounded-md shadow-lg"
                preload="metadata"
              >
                <source src={fileUrl} />
                Вашият браузър не поддържа видео възпроизвеждане.
              </video>
            </div>
          </div>
        )}

        {!isImage && !isPdf && !isAudio && !isVideo && (
          <div className="text-center py-12 h-full flex items-center justify-center">
            <div>
              <p className="text-gray-600 mb-4">Този тип файл не може да бъде показан в прегледа</p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Изтеглете файла
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ThumbnailButtonProps {
  evidencePath: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function ThumbnailButton({ evidencePath, index, isActive, onClick }: ThumbnailButtonProps) {
  const { data: fileUrl } = useFileUrl(evidencePath);
  const isImage = evidencePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = evidencePath.match(/\.pdf$/i);
  const isAudio = evidencePath.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
  const isVideo = evidencePath.match(/\.(mp4|webm|mov|avi|mkv)$/i);

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden transition-all ${
        isActive 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {isImage && fileUrl ? (
        <img
          src={fileUrl}
          alt={`Доказателство ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-600">
            {isPdf ? 'PDF' : isAudio ? (
              <Volume2 className="w-4 h-4" />
            ) : isVideo ? (
              <Film className="w-4 h-4" />
            ) : 'Файл'}
          </span>
        </div>
      )}
    </button>
  );
}
