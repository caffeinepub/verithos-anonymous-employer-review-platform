import React, { useEffect } from 'react';
import { Key, Building2, FileText, Link } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'terms' | 'privacy') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // Ensure page always scrolls to top when landing page loads
  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
    
    // Also set scroll restoration to manual to prevent browser from restoring scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Additional scroll to top after a brief delay to ensure it takes effect
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 10);
    
    return () => {
      clearTimeout(timeoutId);
      // Restore scroll restoration behavior when leaving the page
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img 
              src="/assets/verithos-logo-rgb-shield.png" 
              alt="Verithos Logo" 
              className="w-24 h-24 mx-auto mb-8 object-contain"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Verithos
            </h1>
            <p className="text-xl md:text-2xl text-amber-400 mb-8 font-medium">
              Смелостта да покажеш истината
            </p>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-12 leading-relaxed">
              Анонимно споделяй мнения и доказателства за работодатели - записите се хешират и запечатват върху ICP блокчейн, за да останат проверими и неизменни.
            </p>
            <button
              onClick={() => onNavigate('employers')}
              className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-lg"
            >
              Сподели анонимно
            </button>
          </div>
        </div>
      </div>

      {/* Manifesto Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Нашият манифест</h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="text-xl leading-relaxed mb-8">
              Истината има смисъл само когато е споделена. Verithos е място за онези, които дръзват - да говорят, да показват, да оставят свидетелства, които не могат да бъдат заличени.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Смелост</h3>
                <p className="text-center">
                  Защото истината изисква дръзновение.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Прозрачност</h3>
                <p className="text-center">
                  Всяко свидетелство остава видимо и проверимо.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Анонимност</h3>
                <p className="text-center">
                  Идентичността е защитена, важни са фактите.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Истина</h3>
                <p className="text-center">
                  Тя е основата на справедливост и доверие.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Origin of Name Section */}
      <div className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Произходът на името Verithos</h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="text-lg leading-relaxed mb-6">
              Името <strong>Verithos</strong> произлиза от латинската дума <strong>veritas</strong>, която означава <strong>истина</strong>. Добавката <strong>-thos</strong> идва от древногръцкия корен <strong>ethos</strong>, който се отнася до <strong>характер</strong>, <strong>морал</strong> и <strong>етични принципи</strong>.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Така <strong>Verithos</strong> символизира <strong>истината, основана на морални принципи</strong> - не просто фактите, а <strong>истината, която се ръководи от етика и справедливост</strong>. Това е <strong>истина с характер</strong>, която не се страхува да бъде изказана, дори когато е неудобна.
            </p>
            
            <p className="text-lg leading-relaxed">
              Нашата платформа носи това име, защото вярваме, че <strong>истинската промяна идва не само от споделянето на факти, а от споделянето на истини, които са морално обосновани и етично мотивирани</strong>. <strong>Verithos</strong> е мястото, където <strong>истината среща характера</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Как работи Verithos</h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Влез анонимно</h3>
              <p className="text-gray-600">
                Достъп с ICP wallet, без имейл и без регистрация
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Избери работодател</h3>
              <p className="text-gray-600">
                Намери фирма в списъка или създай нов профил
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Сподели мнение и доказателства</h3>
              <p className="text-gray-600">
                Опиши своя опит и, ако желаеш, прикачи файлове (снимки, видеа, документи и др.)
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Истината остава завинаги</h3>
              <p className="text-gray-600">
                Публикацията се запечатва върху ICP блокчейн и не може да бъде заличена
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            "Вашата истина има значение."
          </h2>
          <div className="text-xl text-blue-100 mb-8">
            <p className="mb-2">Ако сте имали опит, който трябва да бъде чут - споделете го.</p>
            <p>Анонимно. С доказателства. Завинаги.</p>
          </div>
          <button
            onClick={() => onNavigate('employers')}
            className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-lg mb-4"
          >
            Сподели анонимно
          </button>
          <div className="text-sm text-blue-200 mt-4">
            Verithos пази вашата анонимност. Единствено фактите имат значение.
          </div>
        </div>
      </div>
    </div>
  );
}
