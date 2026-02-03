import React, { useState } from 'react';
import { OfficialResponseEdit } from '../backend';
import { Calendar, User, FileText, X } from 'lucide-react';

interface OfficialResponseEditHistoryTimelineProps {
  companyId: string;
  reviewId: string;
  editHistory: OfficialResponseEdit[];
}

export default function OfficialResponseEditHistoryTimeline({ companyId, reviewId, editHistory }: OfficialResponseEditHistoryTimelineProps) {
  const [showDetailModal, setShowDetailModal] = useState<number | null>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('bg-BG');
  };

  const formatPrincipal = (principal: any) => {
    const principalStr = principal.toString();
    return principalStr.slice(0, 8) + '...' + principalStr.slice(-8);
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      content: 'Съдържание',
      evidencePaths: 'Доказателства'
    };
    return labels[fieldName] || fieldName;
  };

  if (!editHistory || editHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Няма история на редакции за този отговор.</p>
      </div>
    );
  }

  // Sort by timestamp descending (newest first)
  const sortedHistory = [...editHistory].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-4">
      {sortedHistory.map((edit, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(edit.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="font-mono text-xs">{formatPrincipal(edit.editor)}</span>
              </div>
              <div className="text-sm text-gray-700">
                <strong>Причина:</strong> {edit.reason}
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(index)}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
              Преглед
            </button>
          </div>

          {/* Changes Summary */}
          {edit.changes && edit.changes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Промени:</h4>
              <div className="space-y-1">
                {edit.changes.map((change, changeIndex) => (
                  <div key={changeIndex} className="text-sm text-gray-600">
                    <span className="font-medium">{getFieldLabel(change.fieldName)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {showDetailModal === index && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Детайли на промяната</h3>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(edit.timestamp)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        <span className="font-mono text-xs">{formatPrincipal(edit.editor)}</span>
                      </div>
                      <div className="text-sm">
                        <strong>Причина:</strong> {edit.reason}
                      </div>
                    </div>

                    {edit.changes && edit.changes.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Променени полета:</h4>
                        {edit.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="bg-gray-50 rounded-lg p-4">
                            <div className="font-medium text-gray-900 mb-2">
                              {getFieldLabel(change.fieldName)}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Преди:</div>
                                <div className="text-sm text-gray-700 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
                                  {change.oldValue || '(празно)'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Сега:</div>
                                <div className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded p-2 whitespace-pre-wrap break-words">
                                  {change.newValue || '(празно)'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
