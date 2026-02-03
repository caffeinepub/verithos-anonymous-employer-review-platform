import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'terms' | 'privacy') => void;
}

export default function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-2 text-blue-900 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад към началото</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика за поверителност</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Обща информация</h2>
            <p className="mb-6 text-gray-700">
              Verithos е проектиран да защитава вашата поверителност и анонимност. 
              Тази политика обяснява как обработваме информацията на нашата платформа.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Информация, която НЕ събираме</h2>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Имена, фамилии или псевдоними</li>
              <li>Имейл адреси</li>
              <li>Телефонни номера</li>
              <li>Физически адреси</li>
              <li>Данни за кредитни карти или банкови сметки</li>
              <li>IP адреси (не се съхраняват)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Как работи анонимността</h2>
            <p className="mb-6 text-gray-700">
              Платформата използва Internet Identity на Internet Computer blockchain за автентикация. 
              Всеки потребител получава уникален криптографски идентификатор, който по никакъв начин не може да бъде директно свързан с лични данни или реална самоличност.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Данни, които съхраняваме</h2>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Текстовото съдържание на мненията</li>
              <li>Прикачени файлове (доказателства)</li>
              <li>Времеви печати на публикациите</li>
              <li>Криптографски хешове за проверка на целостта</li>
              <li>Анонимни идентификатори от Internet Identity</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Всички данни се съхраняват в децентрализираната инфраструктура на ICP и не могат да бъдат редактирани или изтрити от платформата.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Blockchain технология</h2>
            <p className="mb-6 text-gray-700">
              Всички данни се съхраняват на Internet Computer blockchain, което осигурява:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Децентрализирано съхранение</li>
              <li>Неизменност на записите</li>
              <li>Прозрачност на операциите</li>
              <li>Устойчивост срещу цензура</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Обработка на доказателства</h2>
            <p className="mb-6 text-gray-700">
              Прикачените файлове (доказателства) се обработват с цел публикуване към конкретно мнение. Потребителите носят пълна отговорност за съдържанието на качените файлове и за това в тях да не присъстват лични данни, които не желаят да бъдат публично достъпни. Verithos не извършва редактиране на файловете и не може да гарантира автоматично премахване или замъгляване на лични данни в тях. Веднъж публикувани, файловете стават част от публичния запис и не могат да бъдат изтрити или променени.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Ограничения на анонимността</h2>
            <p className="mb-6 text-gray-700">
              Анонимността в Verithos означава, че платформата не събира и не съхранява лични идентифициращи данни. Въпреки това, потребителите следва да имат предвид, че информацията, която сами публикуват, може индиректно да разкрие самоличността им. Verithos не носи отговорност за доброволно разкриване на лична информация от страна на потребителите.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Споделяне с трети страни</h2>
            <p className="mb-6 text-gray-700">
              Verithos не продава, не предоставя и не споделя никакви данни с трети страни.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Права на потребителите</h2>
            <p className="mb-4 text-gray-700">Поради анонимната природа на платформата:</p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Не можем да идентифицираме конкретни потребители.</li>
              <li>Не можем да изтриваме или редактираме конкретни публикации.</li>
              <li>Всички данни са публични и постоянни на блокчейн.</li>
            </ul>
            <p className="mb-6 text-gray-700">
              Поради децентрализирания и анонимен характер на платформата, Verithos не може да изпълнява заявки за достъп, корекция или изтриване на конкретни публикации, когато това е технически невъзможно.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Сигурност</h2>
            <p className="mb-6 text-gray-700">
              Blockchain технологията осигурява най-високо ниво на сигурност чрез криптографска защита 
              и децентрализирана архитектура.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Промени в политиката</h2>
            <p className="mb-6 text-gray-700">
              Промени в тази политика ще бъдат публикувани на платформата. 
              Продължавайки да използвате Verithos, вие се съгласявате с актуалната версия.
            </p>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Гаранция за поверителност:</strong> Вашата анонимност е абсолютен приоритет. Платформата не събира и не съхранява лична информация. Всичко, което публикувате, остава изцяло под ваш контрол.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
