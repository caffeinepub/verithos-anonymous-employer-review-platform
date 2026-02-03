import React from 'react';
import { X, Calendar, User, MessageSquare, ArrowRight, Building2, FileText, Tag, MapPin, Globe, Hash } from 'lucide-react';

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

interface EditDetailsModalProps {
  editEntry: EditHistoryEntry;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditDetailsModal({ editEntry, isOpen, onClose }: EditDetailsModalProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('bg-BG');
  };

  const formatEditor = (editor: string) => {
    return `Админ (${editor.slice(0, 8)}...)`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasChanges = Object.keys(editEntry.changes).some(key => 
    editEntry.changes[key as keyof typeof editEntry.changes] !== undefined
  );

  const getFieldIcon = (fieldKey: string) => {
    switch (fieldKey) {
      case 'description': return <FileText className="w-5 h-5 text-gray-600" />;
      case 'ownerName': return <User className="w-5 h-5 text-gray-600" />;
      case 'registrationNumber': return <Hash className="w-5 h-5 text-gray-600" />;
      case 'sector': return <Tag className="w-5 h-5 text-gray-600" />;
      case 'city': return <MapPin className="w-5 h-5 text-gray-600" />;
      case 'website': return <Globe className="w-5 h-5 text-gray-600" />;
      default: return <Building2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFieldLabel = (fieldKey: string) => {
    const labels: { [key: string]: string } = {
      description: 'Описание',
      ownerName: 'Управител',
      registrationNumber: 'ЕИК номер',
      sector: 'Сектор на дейност',
      city: 'Град',
      website: 'Уебсайт'
    };
    return labels[fieldKey] || fieldKey;
  };

  const formatValue = (value: string, fieldKey: string) => {
    if (fieldKey === 'website' && !value) {
      return '(не е посочен)';
    }
    return value || '(празно)';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Детайли за редактирането</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Edit Information */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Дата:</span>
                <span>{formatDate(editEntry.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <User className="w-4 h-4" />
                <span className="font-medium">Редактор:</span>
                <span>{formatEditor(editEntry.editor)}</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Причина за редактирането:</p>
                <p className="text-sm text-blue-700">{editEntry.reason}</p>
              </div>
            </div>
          </div>

          {/* Changes Details */}
          {hasChanges ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Направени промени</h4>
              
              {Object.entries(editEntry.changes).map(([fieldKey, change]) => {
                if (!change) return null;
                
                return (
                  <ChangeItem
                    key={fieldKey}
                    icon={getFieldIcon(fieldKey)}
                    label={getFieldLabel(fieldKey)}
                    oldValue={formatValue(change.old, fieldKey)}
                    newValue={formatValue(change.new, fieldKey)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Няма записани промени</h4>
              <p className="text-gray-600">
                Детайлите за промените не са налични за това редактиране.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChangeItemProps {
  icon: React.ReactNode;
  label: string;
  oldValue: string;
  newValue: string;
}

function ChangeItem({ icon, label, oldValue, newValue }: ChangeItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h5 className="font-medium text-gray-900">{label}</h5>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 items-center">
        {/* Old Value */}
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs font-medium text-red-800 mb-1">Преди</p>
          <p className="text-sm text-red-700 break-words">{oldValue}</p>
        </div>
        
        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* New Value */}
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-xs font-medium text-green-800 mb-1">След</p>
          <p className="text-sm text-green-700 break-words">{newValue}</p>
        </div>
      </div>
    </div>
  );
}
