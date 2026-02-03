import React, { useState, useMemo } from 'react';
import { X, CheckCircle, Info, Upload, FileText } from 'lucide-react';
import { useSubmitOfficialProfileRequest, useGetCompanies } from '@/hooks/useQueries';
import { useFileUpload } from '@/blob-storage/FileStorage';

interface OfficialProfileRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  employerRequestStatus: string;
}

export default function OfficialProfileRequestModal({ 
  isOpen, 
  onClose, 
  isAuthenticated,
  employerRequestStatus
}: OfficialProfileRequestModalProps) {
  const { mutateAsync: submitRequest, isPending: isSubmitting } = useSubmitOfficialProfileRequest();
  const { data: companies } = useGetCompanies();
  const { uploadFile } = useFileUpload();
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [tradeRegisterLink, setTradeRegisterLink] = useState('');
  const [confirmationDocument, setConfirmationDocument] = useState<File | null>(null);
  const [confirmationDocumentPath, setConfirmationDocumentPath] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-suggestion logic for ЕИК - MUST be called before any conditional returns
  const suggestions = useMemo(() => {
    if (!registrationNumber.trim() || !companies) {
      return [];
    }

    const filtered = companies.filter(company => 
      company.registrationNumber.includes(registrationNumber.trim())
    );

    return filtered.slice(0, 5);
  }, [registrationNumber, companies]);

  if (!isOpen) return null;

  const handleEikInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setRegistrationNumber(value);
    
    // Clear auto-filled fields when user modifies ЕИК
    if (companyName || website) {
      setCompanyName('');
      setWebsite('');
    }
    
    if (validationError) setValidationError(null);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionSelect = (company: { name: string; registrationNumber: string; website?: string }) => {
    setRegistrationNumber(company.registrationNumber);
    setCompanyName(company.name);
    setWebsite(company.website || '');
    setShowSuggestions(false);
  };

  const normalizeWebsiteUrl = (url: string): string => {
    if (!url.trim()) return '';
    
    const trimmedUrl = url.trim();
    
    // If URL already has protocol, return as is
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // If it's just a domain, prepend https://
    return `https://${trimmedUrl}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Моля, качете само PDF или изображения (JPG, JPEG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setValidationError('Файлът е твърде голям. Максималният размер е 10MB');
      return;
    }

    setConfirmationDocument(file);
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !registrationNumber.trim() || !tradeRegisterLink.trim() || !confirmationDocument) {
      setValidationError('Моля, попълнете всички задължителни полета');
      return;
    }

    if (!isAuthenticated) {
      setValidationError('Моля, влезте в системата.');
      return;
    }

    // Client-side guard: prevent submission if status is 'pending' or 'approved'
    if (employerRequestStatus === 'pending' || employerRequestStatus === 'approved') {
      setValidationError('Не можете да подадете нова заявка в момента.');
      return;
    }

    // Check if company with this ЕИК exists
    const companyExists = companies?.some(c => c.registrationNumber === registrationNumber.trim());
    if (!companyExists) {
      setValidationError('Не е намерена фирма с въведения ЕИК. Моля, проверете данните.');
      return;
    }

    setValidationError(null);

    try {
      // Upload confirmation document first - preserve original filename
      setIsUploadingFile(true);
      const sanitizedFileName = confirmationDocument.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `official-profile-requests/${sanitizedFileName}`;
      
      await uploadFile(filePath, confirmationDocument);
      setConfirmationDocumentPath(filePath);
      setIsUploadingFile(false);

      const normalizedWebsite = website.trim() ? normalizeWebsiteUrl(website) : undefined;
      
      await submitRequest({
        companyName: companyName.trim(),
        registrationNumber: registrationNumber.trim(),
        website: normalizedWebsite,
        tradeRegisterLink: tradeRegisterLink.trim(),
        confirmationDocument: filePath
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting official profile request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Възникна грешка при изпращане на заявката.';
      setValidationError(errorMessage);
      setIsUploadingFile(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setRegistrationNumber('');
    setWebsite('');
    setTradeRegisterLink('');
    setConfirmationDocument(null);
    setConfirmationDocumentPath('');
    setIsSuccess(false);
    setValidationError(null);
    setIsUploadingFile(false);
    setShowSuggestions(false);
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

  // Show informational modal only for 'pending' and 'approved' statuses
  if ((employerRequestStatus === 'pending' || employerRequestStatus === 'approved') && !isSuccess) {
    let statusMessage = '';
    let statusTitle = '';
    
    if (employerRequestStatus === 'pending') {
      statusTitle = 'Заявката е вече изпратена';
      statusMessage = 'Вашата заявка за официален профил вече е изпратена и е в процес на преглед. Моля, изчакайте отговор преди да подавате нова заявка.';
    } else if (employerRequestStatus === 'approved') {
      statusTitle = 'Имате одобрен профил';
      statusMessage = 'Вашата заявка за официален профил е одобрена. Вече имате достъп до официалния си профил.';
    }

    return (
      <div 
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Заявка за официален профил</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Info className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                {statusTitle}
              </h3>
              <p className="text-gray-600 text-center mb-8 max-w-md">
                {statusMessage}
              </p>
              <button
                onClick={handleClose}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-md transition-colors mobile-touch-target mobile-btn"
              >
                Разбрах
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl max-h-[95vh] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Заявка за официален профил</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
                Заявката е изпратена за преглед
              </h3>
              <p className="text-gray-600 text-center mb-8 max-w-md">
                Вашата заявка за официален профил беше успешно изпратена. Ще получите отговор в най-скоро време.
              </p>
              <button
                onClick={handleClose}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-md transition-colors mobile-touch-target mobile-btn"
              >
                Затвори
              </button>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Explanatory Text */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md mobile-notification">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-blue-800 text-sm leading-relaxed mobile-long-text break-words">
                    Тази функция позволява на работодателите да публикуват официални отговори под мненията за тяхната фирма. 
                    Попълнете формата по-долу, за да подадете заявка за официален профил.
                  </p>
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm font-medium">{validationError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ЕИК - Full Width (Now First) */}
                <div className="text-center mobile-form-section relative">
                  <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    ЕИК *
                  </label>
                  <input
                    type="text"
                    id="registrationNumber"
                    value={registrationNumber}
                    onChange={handleEikInput}
                    onFocus={() => setShowSuggestions(registrationNumber.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input"
                    placeholder="Въведете ЕИК на фирмата"
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                  
                  {/* Auto-suggestion dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {suggestions.map((company) => (
                        <button
                          key={company.registrationNumber}
                          type="button"
                          onClick={() => handleSuggestionSelect(company)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-600">ЕИК: {company.registrationNumber}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Name - Full Width (Now Second) */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Име на фирмата *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="Въведете официалното име на фирмата"
                  />
                </div>

                {/* Website - Full Width */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Уебсайт (по избор)
                  </label>
                  <input
                    type="text"
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="example.com или https://example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1 mobile-long-text">
                    Можете да въведете домейн с или без протокол (напр. "example.com" или "https://example.com")
                  </p>
                </div>

                {/* Trade Register Link - Full Width */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="tradeRegisterLink" className="block text-sm font-medium text-gray-700 mb-2">
                    Линк към Търговския регистър *
                  </label>
                  <input
                    type="url"
                    id="tradeRegisterLink"
                    value={tradeRegisterLink}
                    onChange={(e) => {
                      setTradeRegisterLink(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="https://..."
                  />
                </div>

                {/* Confirmation Document - Full Width */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="confirmationDocument" className="block text-sm font-medium text-gray-700 mb-2">
                    Документ за потвърждение *
                  </label>
                  <div className="w-full max-w-md mx-auto">
                    <label 
                      htmlFor="confirmationDocument"
                      className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-amber-500 transition-colors"
                    >
                      {confirmationDocument ? (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-700 truncate max-w-xs">
                            {confirmationDocument.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Изберете файл</span>
                          <span className="text-xs text-gray-500 mt-1">PDF или изображения (JPG, PNG)</span>
                        </>
                      )}
                    </label>
                    <input
                      type="file"
                      id="confirmationDocument"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto mobile-long-text">
                    Качете скрийншот, PDF от Търговския регистър или документ, който показва връзка с фирмата. Файлът се вижда само от администратора при преглед на заявката.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer - Only show if form is visible */}
        {!isSuccess && (
          <div className="border-t border-gray-200 p-6 shrink-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingFile}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50 mobile-touch-target mobile-btn"
              >
                {isUploadingFile ? 'Качване на файл...' : isSubmitting ? 'Изпращане...' : 'Подай заявка'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-8 rounded-md transition-colors mobile-touch-target mobile-btn"
              >
                Отказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
