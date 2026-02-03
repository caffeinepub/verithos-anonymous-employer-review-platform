import React from 'react';
import { ArrowLeft, Shield, Link, Clock, Hash, Globe, Lock, Users, Database, CheckCircle, Eye, Zap, Key, Briefcase } from 'lucide-react';

interface BlockchainPageProps {
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy') => void;
}

export default function BlockchainPage({ onNavigate }: BlockchainPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-2 text-blue-900 hover:text-blue-700 mb-8 focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад към началото</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Как работи Verithos</h1>
          
          <div className="prose max-w-none">
            {/* Introduction */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-blue-600 mx-2 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 mb-3">Защо Verithos използва блокчейн технология?</h2>
                  <p className="text-blue-800 leading-relaxed">
                    Verithos е изградена върху Internet Computer Protocol (ICP) блокчейн, за да гарантира, че вашите мнения и доказателства остават постоянни, проверими и защитени от цензура. Тази страница обяснява как работят тези технологии и защо са важни за вашата анонимност и сигурност.
                  </p>
                </div>
              </div>
            </div>

            {/* What is Blockchain */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Link className="w-8 h-8 text-amber-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Какво е блокчейн и как работи?</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Блокчейн е цифров дневник, който никой не може да подправи. Всеки запис в този дневник е свързан с предишния чрез специален код, наречен "хеш", което прави невъзможно изтриването или промяната на информацията без да се забележи.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-green-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                    <h3 className="font-semibold text-gray-900 my-0">Неизменимост</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    След като информацията е записана в блокчейна, тя не може да бъде променена или изтрита. Това гарантира, че вашите мнения остават непокътнати завинаги.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                    <h3 className="font-semibold text-gray-900 my-0">Времеви печат</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Всеки запис получава точен времеви печат, който показва кога е създаден. Това доказва автентичността и хронологията на събитията.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Hash className="w-5 h-5 text-purple-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                    <h3 className="font-semibold text-gray-900 my-0">Криптографски хеш</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Всяко мнение получава уникален "пръстов отпечатък" (хеш), който служи като доказателство за неговата автентичност и целост.
                  </p>
                </div>
              </div>
            </section>

            {/* What is ICP */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Globe className="w-8 h-8 text-blue-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Какво е Internet Computer Protocol (ICP)?</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Internet Computer Protocol (ICP) е революционна блокчейн платформа, която позволява на уеб приложения да работят изцяло в децентрализирана среда. За разлика от традиционните блокчейни, ICP може да хоства пълнофункционални уеб приложения директно на блокчейна.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-amber-900 mb-3">Защо избрахме ICP за Verithos?</h3>
                <ul className="space-y-2 text-amber-800">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span><strong>Скорост:</strong> Транзакциите се обработват за секунди, не минути</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span><strong>Ниски разходи:</strong> Почти безплатни операции за потребителите</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span><strong>Мащабируемост:</strong> Може да обработва милиони заявки без забавяне</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span><strong>Устойчивост:</strong> Работи на хиляди независими възли по света</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* How to create ICP Identity */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Key className="w-8 h-8 text-indigo-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Как да създадете ICP Identity</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                За да използвате Verithos, е необходима ICP Identity - децентрализиран и анонимен начин за вход без имейл и парола. ICP Identity ви позволява да влизате сигурно чрез устройство или хардуерен ключ, без да разкривате лични данни. Можете да научите как да създадете своята ICP Identity от{' '}
                <a 
                  href="https://id.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  официалното ръководство на Internet Computer
                </a>.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <p className="text-indigo-800 leading-relaxed">
                  ICP Identity е задължителна за използване на платформата Verithos. Тя е необходима за публикуване на мнения, прикачване на доказателства, както и за заявяване и управление на официални профили на работодатели. Без ICP Identity достъпът до функционалностите на платформата не е възможен.
                </p>
              </div>
            </section>

            {/* Employers and Official Profile */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Briefcase className="w-8 h-8 text-orange-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Работодатели и официален профил</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Работодателите във Verithos имат възможност да заявят официален профил за своята фирма. След одобрение от администратор, официалният профил позволява публикуване на официални отговори под потребителски мнения и достъп до статистика за рейтинга на фирмата във времето.
              </p>

              <p className="mb-6 text-gray-700 leading-relaxed">
                Официалният профил дава възможност на работодателите да участват активно в диалога, да адресират публично обратната връзка и да изграждат доверие чрез прозрачност и отговорност. Всички официални действия са ясно обозначени и видими за потребителите.
              </p>
            </section>

            {/* Web3 vs Web2 */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-8 h-8 text-green-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Web3 срещу традиционния Web2</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Web3 представлява новото поколение интернет, където потребителите имат пълен контрол над своите данни и цифрова идентичност. Ето основните разлики:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-900 mb-4 flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>Web2 (Традиционен интернет)</span>
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>Данните се съхраняват на централни сървъри</li>
                    <li>Компаниите контролират вашата информация</li>
                    <li>Възможна цензура и изтриване на съдържание</li>
                    <li>Липса на прозрачност в обработката на данни</li>
                    <li>Зависимост от доверие към централни власти</li>
                  </ul>
                </div>

                <div className="border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Web3 (Децентрализиран интернет)</span>
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>Данните се съхраняват децентрализирано</li>
                    <li>Вие контролирате своите данни</li>
                    <li>Невъзможна цензура или изтриване</li>
                    <li>Пълна прозрачност на всички операции</li>
                    <li>Не се изисква доверие - всичко е проверимо</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 leading-relaxed">
                  При Web3 вие не зависите от администратор или посредник - контролирате данните си лично.
                </p>
              </div>
            </section>

            {/* Anonymity */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-8 h-8 text-purple-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Как се гарантира анонимността?</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Verithos използва Internet Identity - революционна система за анонимна автентикация, която ви позволява да влезете без да споделяте лична информация.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-purple-900 mb-4">Как работи Internet Identity?</h3>
                <div className="space-y-4 text-purple-800">
                  <div className="flex items-center space-x-3">
                    <div className="numbered-circle bg-purple-200 text-purple-900">
                      <span>1</span>
                    </div>
                    <p className="my-0">Създавате криптографска двойка ключове директно в браузъра си</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="numbered-circle bg-purple-200 text-purple-900">
                      <span>2</span>
                    </div>
                    <p className="my-0">Получавате уникален анонимен идентификатор</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="numbered-circle bg-purple-200 text-purple-900">
                      <span>3</span>
                    </div>
                    <p className="my-0">Никаква лична информация не се съхранява или предава</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="numbered-circle bg-purple-200 text-purple-900">
                      <span>4</span>
                    </div>
                    <p className="my-0">Verithos не знае кой сте. Вашата самоличност никога не се записва и никога не може да бъде разкрита.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Какво НЕ събираме:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Имена, фамилии или псевдоними</li>
                  <li>Имейл адреси или телефонни номера</li>
                  <li>IP адреси или местоположение</li>
                  <li>Биометрични данни</li>
                  <li>Каквато и да е лична информация</li>
                </ul>
              </div>
            </section>

            {/* Why records cannot be deleted */}
            <section className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <Eye className="w-8 h-8 text-indigo-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                <h2 className="text-2xl font-semibold text-gray-900 my-0">Защо записите не могат да бъдат изтрити?</h2>
              </div>
              
              <p className="mb-6 text-gray-700 leading-relaxed">
                Неизменимостта на записите е основна характеристика на блокчейн технологията и ключова функция на Verithos. Ето защо това е важно:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-semibold text-indigo-900 mb-4">Технически причини</h3>
                  <ul className="space-y-2 text-indigo-800 text-sm">
                    <li className="flex items-start space-x-2">
                      <Hash className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Всеки запис е криптографски свързан с предишните</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Users className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Хиляди възли съхраняват копия на данните</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Времевите печати са необратими</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4">Предимства за потребителите</h3>
                  <ul className="space-y-2 text-green-800 text-sm">
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Защита от цензура и манипулация</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Eye className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Постоянна прозрачност и отчетност</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>Гарантирана автентичност на доказателствата</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-yellow-600 mx-2 flex-shrink-0" style={{ width: '2rem', height: '2rem' }} />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2 my-0">Важно за разбиране</h3>
                    <p className="text-yellow-800 text-sm leading-relaxed my-0">
                      Неизменимостта означава, че веднъж публикувано, вашето мнение остава завинаги. Това е мощен инструмент за истината, но изисква отговорност при споделяне на информация. Уверете се, че премахвате всички лични данни преди публикуване.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 leading-relaxed">
                  Това означава, че нито администратор, нито работодател, нито институция могат да заличат публикуваното.
                </p>
              </div>
            </section>

            {/* Benefits Summary */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Как тези технологии ви помагат?</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 my-0">Анонимност - споделяйте без страх.</h3>
                        <p className="text-sm text-gray-700 my-0">Споделяйте мнения без страх от разкриване на самоличността</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 my-0">Защита от цензура - никой не може да изтрие вашият сигнал.</h3>
                        <p className="text-sm text-gray-700 my-0">Никой не може да изтрие или промени вашите доказателства</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 my-0">Истина - всеки може да провери автентичността.</h3>
                        <p className="text-sm text-gray-700 my-0">Всеки може да провери автентичността на записите</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 my-0">Постоянство - съдържанието остава достъпно завинаги.</h3>
                        <p className="text-sm text-gray-700 my-0">Вашите свидетелства остават достъпни завинаги</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <div className="py-20 bg-blue-900 text-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-6 truth-power-white">Истината има сила само когато е изречена.</h2>
              <div className="text-xl text-blue-100 mb-8">
                <p className="mb-2">Сподели своята история днес - анонимно, доказуемо и завинаги.</p>
                <p>Никой няма власт да я заличи.</p>
              </div>
              <button
                onClick={() => onNavigate('employers')}
                className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-lg"
              >
                Сподели анонимно
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
