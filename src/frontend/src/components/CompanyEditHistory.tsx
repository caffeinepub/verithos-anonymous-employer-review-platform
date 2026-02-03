import React, { useState } from 'react';
import { Calendar, User, MessageSquare, ChevronDown, ChevronUp, History, Eye } from 'lucide-react';
import EditDetailsModal from './EditDetailsModal';

interface FieldChange {
  old: string;
  new: string;
}

interface EditHistoryEntry {
  timestamp: bigint;
  editor: string;
  reason: string;
  changes: {
    description?: FieldChange;
    ownerName?: FieldChange;
    registrationNumber?: FieldChange;
    sector?: FieldChange;
    city?: FieldChange;
    website?: FieldChange;
  };
}

interface CompanyEditHistoryProps {
  editHistory: EditHistoryEntry[];
  className?: string;
}

export default function CompanyEditHistory({ editHistory, className = '' }: CompanyEditHistoryProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<EditHistoryEntry | null>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('bg-BG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatEditor = (editor: string) => {
    // Show first 8 characters of principal ID for admin identification
    return `Админ (${editor.slice(0, 8)}...)`;
  };

  const getChangedFieldsCount = (changes: EditHistoryEntry['changes']): number => {
    return Object.keys(changes).filter(key => changes[key as keyof typeof changes] !== undefined).length;
  };

  const getChangedFieldsList = (changes: EditHistoryEntry['changes']): string[] => {
    const fieldNames: { [key: string]: string } = {
      description: 'Описание',
      ownerName: 'Управител',
      registrationNumber: 'ЕИК',
      sector: 'Сектор',
      city: 'Град',
      website: 'Уебсайт'
    };

    return Object.keys(changes)
      .filter(key => changes[key as keyof typeof changes] !== undefined)
      .map(key => fieldNames[key] || key);
  };

  if (!editHistory || editHistory.length === 0) {
    return null;
  }

  const visibleHistory = showFullHistory ? editHistory : editHistory.slice(0, 3);
  const hasMoreHistory = editHistory.length > 3;

  return (
    <>
      <div className={`bg-amber-50 border border-amber-200 rounded-md p-4 ${className} edit-history-permanent`}>
        <div className="flex items-center space-x-2 mb-3">
          <History className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-medium text-amber-800">История на редактиранията</h4>
        </div>

        <div className="space-y-3">
          {visibleHistory.map((entry, index) => {
            const changedFieldsCount = getChangedFieldsCount(entry.changes);
            const changedFieldsList = getChangedFieldsList(entry.changes);

            return (
              <div key={index} className="bg-white border border-amber-200 rounded-md p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 text-xs text-amber-700">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(entry.timestamp)}</span>
                    <span>•</span>
                    <User className="w-3 h-3" />
                    <span>{formatEditor(entry.editor)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedEdit(entry)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    title="Преглед на детайлите за редактирането"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Преглед</span>
                  </button>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">Причина:</p>
                      <p className="text-xs text-amber-700">{entry.reason}</p>
                    </div>
                  </div>
                </div>

                {changedFieldsCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">
                      Променени полета ({changedFieldsCount}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {changedFieldsList.map((fieldName, fieldIndex) => (
                        <span
                          key={fieldIndex}
                          className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
                        >
                          {fieldName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasMoreHistory && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <button
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-800 transition-colors"
            >
              {showFullHistory ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Покажи по-малко</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Покажи всички ({editHistory.length} редактирания)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      {selectedEdit && (
        <EditDetailsModal
          editEntry={selectedEdit}
          isOpen={true}
          onClose={() => setSelectedEdit(null)}
        />
      )}
    </>
  );
}
