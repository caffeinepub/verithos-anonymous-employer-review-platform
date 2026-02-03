import React from 'react';
import { X } from 'lucide-react';

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason?: string;
}

export default function RejectionReasonModal({ isOpen, onClose, rejectionReason }: RejectionReasonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Причина за отказ</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Затвори"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {rejectionReason ? (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {rejectionReason}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Няма посочена причина за отказ.</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
}
