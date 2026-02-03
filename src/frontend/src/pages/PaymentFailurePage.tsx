import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

type Page = 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy' | 'admin' | 'my-official-profile';

interface PaymentFailurePageProps {
  onNavigate: (page: Page) => void;
}

export default function PaymentFailurePage({ onNavigate }: PaymentFailurePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Failure Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          {/* Failure Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Плащането е отказано или прекъснато
          </h1>
          <p className="text-gray-600 mb-8">
            Вашето плащане не беше завършено. Можете да опитате отново или да се свържете с нас за помощ.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('my-official-profile')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Опитай отново
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Към начало
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
