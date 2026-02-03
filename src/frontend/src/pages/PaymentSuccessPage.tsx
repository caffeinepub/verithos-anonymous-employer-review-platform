import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

type Page = 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy' | 'admin' | 'my-official-profile';

interface PaymentSuccessPageProps {
  onNavigate: (page: Page) => void;
}

export default function PaymentSuccessPage({ onNavigate }: PaymentSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Плащането е успешно
          </h1>
          <p className="text-gray-600 mb-8">
            Абонаментът ще се активира след потвърждение. Ще получите достъп до всички премиум функции в рамките на няколко минути.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('my-official-profile')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Към моя профил
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
