import React from 'react';
import { X, Check, CreditCard, AlertCircle } from 'lucide-react';
import { getSubscriptionPlan, formatPrice } from '../config/subscriptionPlans';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  // Get the official profile plan configuration dynamically
  const officialProfilePlan = getSubscriptionPlan('official_profile_monthly');

  // Fixed EUR to BGN exchange rate (official Bulgarian rate)
  const EUR_TO_BGN_RATE = 1.9558;
  const priceBgn = (officialProfilePlan.priceEur * EUR_TO_BGN_RATE).toFixed(2);

  if (!isOpen) return null;

  const handleProceedToPayment = () => {
    // Show message that real payments are not yet implemented
    alert('Плащането чрез Stripe все още не е активирано. Моля, използвайте бутона "Активирай (тест)" за тестване на функционалността.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Абонамент</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6">
          {/* Stripe Configuration Warning */}
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Забележка:</strong> Интеграцията със Stripe все още не е конфигурирана. За тестване на функционалността, моля използвайте бутона "Активирай (тест)" на страницата с официалния профил.
              </p>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="border-2 border-blue-600 rounded-lg p-6 mb-6">
            {/* Plan Name - Dynamically from configuration */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{officialProfilePlan.name}</h3>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Препоръчан
              </div>
            </div>

            {/* Price - Dynamically from configuration with BGN equivalent */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{officialProfilePlan.priceEur} € / {priceBgn} лв.</span>
                <span className="text-gray-600">/ месец</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Право на публикуване на официални отговори под мненията</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Достъп до „Рейтинг във времето"</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Активен официален профил на работодател</span>
              </div>
            </div>

            {/* Explanatory Paragraph */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                Абонаментът се таксува месечно и може да бъде отказан по всяко време. Няма скрити такси или дългосрочни ангажименти.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleProceedToPayment}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed opacity-60"
              disabled
            >
              <CreditCard className="w-5 h-5" />
              Продължи към плащане
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Отказ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
