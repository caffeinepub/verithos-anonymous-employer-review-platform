import React from 'react';
import { useGetCallerOfficialProfileRequest } from '../hooks/useQueries';

export default function ProfileSetup() {
  const { data: officialProfileRequest, isLoading } = useGetCallerOfficialProfileRequest();

  if (isLoading) {
    return null;
  }

  if (!officialProfileRequest) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Статус на профила</h2>
      
      {officialProfileRequest.status === 'pending' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-gray-900 font-medium">Официален профил: в процес на преглед</p>
          <p className="text-sm text-gray-600 mt-2">
            Вашата заявка за официален профил е изпратена и се преглежда от администратор.
          </p>
        </div>
      )}

      {officialProfileRequest.status === 'approved' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-gray-900 font-medium">Официален профил: активен</p>
          <p className="text-sm text-gray-600 mt-2">
            Вашият официален профил е одобрен и активен.
          </p>
        </div>
      )}

      {officialProfileRequest.status === 'rejected' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-gray-900 font-medium mb-2">Заявката е отказана</p>
          {officialProfileRequest.rejectionReason && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 font-medium mb-1">Причина:</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-red-200">
                {officialProfileRequest.rejectionReason}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-3">
            Можете да подадете нова заявка за официален профил.
          </p>
        </div>
      )}
    </div>
  );
}
