import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import RejectionReasonModal from './RejectionReasonModal';

interface RejectionNotificationProps {
  rejectionReason?: string;
  onOpenModal: () => void;
}

const REJECTION_SEEN_KEY = 'verithos_rejection_seen';

export default function RejectionNotification({ rejectionReason, onOpenModal }: RejectionNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Check if rejection has been dismissed before
  useEffect(() => {
    const dismissedRejection = localStorage.getItem(REJECTION_SEEN_KEY);
    if (dismissedRejection === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    // Mark rejection as dismissed when user clicks X button
    localStorage.setItem(REJECTION_SEEN_KEY, 'true');
    setIsDismissed(true);
  };

  const handleViewReason = () => {
    setIsReasonModalOpen(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-red-900">
                  Заявката е отказана
                </h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-auto p-1 text-red-600 hover:text-red-800 transition-colors"
                  aria-label={isExpanded ? 'Скрий детайли' : 'Покажи детайли'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {isExpanded && (
                <div className="ml-9 space-y-3">
                  {rejectionReason && (
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        Вашата заявка за официален профил е отказана от администратор.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleViewReason}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md transition-colors"
                    >
                      Виж причината
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleDismiss}
              className="ml-4 p-1 text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
              aria-label="Затвори известие"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <RejectionReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        rejectionReason={rejectionReason}
      />
    </>
  );
}
