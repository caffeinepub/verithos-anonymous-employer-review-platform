import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { useFileUrl } from '../blob-storage/FileStorage';
import { usePdfObjectUrl } from '../hooks/usePdfObjectUrl';

interface EvidenceModalProps {
  evidencePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EvidenceModal({ evidencePath, isOpen, onClose }: EvidenceModalProps) {
  const { data: fileUrl, isLoading } = useFileUrl(evidencePath);

  const isPdf = evidencePath.match(/\.pdf$/i);
  const isImage = evidencePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isAudio = evidencePath.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
  const isVideo = evidencePath.match(/\.(mp4|webm|mov|avi|mkv)$/i);

  // For PDFs, fetch as blob to prevent auto-download
  const { blobUrl: pdfBlobUrl, isLoading: pdfBlobLoading } = usePdfObjectUrl(
    isPdf ? fileUrl : undefined
  );

  if (!isOpen) return null;

  const handleDownload = async () => {
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

  const handleOpenInNewTab = () => {
    if (!fileUrl) return;
    
    // For PDFs, use blob URL to prevent auto-download in new tab
    if (isPdf && pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isContentLoading = isLoading || (isPdf && pdfBlobLoading);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {evidencePath.split('/').pop()}
          </h3>
          <div className="flex items-center space-x-2">
            {fileUrl && (
              <>
                <button
                  onClick={handleOpenInNewTab}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Отвори в нов раздел"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Изтегли"
                >
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Затвори"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {isContentLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
          ) : fileUrl ? (
            <div className="flex items-center justify-center h-full">
              {isPdf ? (
                pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#view=FitH`}
                    className="w-full h-full min-h-[600px] border-0 rounded"
                    title={evidencePath.split('/').pop()}
                    style={{ backgroundColor: '#525659' }}
                  />
                ) : (
                  <div className="text-center text-gray-600">
                    <p className="mb-4">Грешка при зареждане на PDF файла</p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Изтегли файла
                    </button>
                  </div>
                )
              ) : isImage ? (
                <img
                  src={fileUrl}
                  alt={evidencePath.split('/').pop()}
                  className="max-w-full max-h-full object-contain"
                />
              ) : isAudio ? (
                <audio controls className="w-full max-w-2xl">
                  <source src={fileUrl} />
                  Вашият браузър не поддържа аудио елемента.
                </audio>
              ) : isVideo ? (
                <video controls className="max-w-full max-h-full">
                  <source src={fileUrl} />
                  Вашият браузър не поддържа видео елемента.
                </video>
              ) : (
                <div className="text-center text-gray-600">
                  <p className="mb-4">Преглед не е наличен за този тип файл</p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Изтегли файла
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">Файлът не може да бъде зареден</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
