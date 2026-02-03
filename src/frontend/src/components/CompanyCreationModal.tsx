import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useCreateCompany, useGetCompanies } from '../hooks/useQueries';
import { Company } from '../backend';

interface CompanyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToCompany?: (companyEik: string) => void;
}

const COMPANY_CATEGORIES = [
  'Информационни технологии',
  'Финанси и банкиране',
  'Здравеопазване',
  'Образование',
  'Производство',
  'Строителство',
  'Търговия на дребно',
  'Търговия на едро',
  'Транспорт и логистика',
  'Туризъм и хотелиерство',
  'Недвижими имоти',
  'Енергетика',
  'Телекомуникации',
  'Медии и реклама',
  'Консултантски услуги',
  'Правни услуги',
  'Счетоводство и одит',
  'Човешки ресурси',
  'Маркетинг и продажби',
  'Дизайн и креативни услуги',
  'Храни и напитки',
  'Мода и текстил',
  'Автомобилна индустрия',
  'Химическа индустрия',
  'Фармацевтична индустрия',
  'Селско стопанство',
  'Горско стопанство',
  'Рибарство',
  'Минно дело',
  'Металургия',
  'Машиностроене',
  'Електроника',
  'Софтуер и разработка',
  'Кибер сигурност',
  'Изкуствен интелект',
  'Биотехнологии',
  'Възобновяема енергия',
  'Околна среда',
  'Социални услуги',
  'Държавна администрация',
  'Неправителствени организации',
  'Спорт и фитнес',
  'Красота и козметика',
  'Ветеринарни услуги',
  'Сигурност',
  'Почистване',
  'Други'
];

const BULGARIAN_CITIES = [
  'Авитохол',
  'Аврен',
  'Агатово',
  'Айтос',
  'Аксаково',
  'Алботино',
  'Александрово',
  'Александрия',
  'Алфатар',
  'Антоново',
  'Априлци',
  'Ардино',
  'Арчар',
  'Асеновград',
  'Асеново',
  'Асеновец',
  'Асперухово',
  'Ахелой',
  'Ахтопол',
  'Бабево',
  'Багриново',
  'Байлово',
  'Балван',
  'Балчик',
  'Банкя',
  'Банско',
  'Баня',
  'Бараково',
  'Барзия',
  'Батак',
  'Батановци',
  'Бегово',
  'Белене',
  'Белица',
  'Белово',
  'Белоградчик',
  'Белослав',
  'Берковица',
  'Бесапарово',
  'Бетлица',
  'Бизерна',
  'Благоевград',
  'Бобов дол',
  'Бобошево',
  'Богданци',
  'Божурище',
  'Бойчиновци',
  'Болярово',
  'Борино',
  'Борован',
  'Боровец',
  'Боровица',
  'Ботевград',
  'Брацигово',
  'Брегово',
  'Брезник',
  'Брезово',
  'Брусарци',
  'Бургас',
  'Бухово',
  'Бъзовград',
  'Българево',
  'Българово',
  'Бялата',
  'Бяла',
  'Бяла Слатина',
  'Бяла черква',
  'Вакарел',
  'Валчедръм',
  'Варвара',
  'Варна',
  'Василовци',
  'Велики Преслав',
  'Велико Търново',
  'Велинград',
  'Венец',
  'Верила',
  'Ветово',
  'Ветрен',
  'Видин',
  'Винарско',
  'Вишовград',
  'Владая',
  'Владимирово',
  'Войводово',
  'Войнягово',
  'Волуяк',
  'Враца',
  'Върбица',
  'Върбовка',
  'Вършец',
  'Габрово',
  'Гара Орешец',
  'Гара Лакатник',
  'Генерал Тошево',
  'Георги Дамяново',
  'Гигинци',
  'Гоце Делчев',
  'Годеч',
  'Голяма Желязна',
  'Горна Малина',
  'Горна Оряховица',
  'Горни Дъбник',
  'Горни чифлик',
  'Грамада',
  'Граф Игнатиево',
  'Гулянци',
  'Гурково',
  'Гълъбово',
  'Дамяница',
  'Данчовци',
  'Дебелец',
  'Девин',
  'Девня',
  'Делчево',
  'Джебел',
  'Димитровград',
  'Димово',
  'Добринище',
  'Добрич',
  'Добърско',
  'Долна баня',
  'Долна Митрополия',
  'Долна Оряховица',
  'Долни Дъбник',
  'Долни чифлик',
  'Доспат',
  'Драгоман',
  'Драгичево',
  'Дряново',
  'Дулово',
  'Дунавци',
  'Дупница',
  'Дългопол',
  'Елена',
  'Елин Пелин',
  'Елхово',
  'Етрополе',
  'Завет',
  'Земен',
  'Златарица',
  'Златица',
  'Златни пясъци',
  'Златоград',
  'Знаменосец',
  'Зверино',
  'Игнатиево',
  'Икономово',
  'Исперих',
  'Ихтиман',
  'Каблешково',
  'Каварна',
  'Казанлък',
  'Калофер',
  'Камено',
  'Каменово',
  'Капинци',
  'Карлово',
  'Карнобат',
  'Каспичан',
  'Катунци',
  'Кермен',
  'Килифарево',
  'Китен',
  'Клисура',
  'Кнежа',
  'Козлодуй',
  'Койнаре',
  'Копривщица',
  'Костандово',
  'Костенец',
  'Костинброд',
  'Котел',
  'Кочериново',
  'Кранево',
  'Кресна',
  'Криводол',
  'Крумовград',
  'Крън',
  'Кубрат',
  'Кула',
  'Куклен',
  'Кърджали',
  'Кюстендил',
  'Лакатник',
  'Левски',
  'Летница',
  'Лещен',
  'Лозенец',
  'Лом',
  'Ловеч',
  'Лъки',
  'Любимец',
  'Лютиброд',
  'Мадан',
  'Маджарово',
  'Малко Търново',
  'Мамарчево',
  'Марица',
  'Мартен',
  'Мездра',
  'Мелник',
  'Меричлери',
  'Мизия',
  'Минерални бани',
  'Мирково',
  'Михайловград',
  'Мокрище',
  'Момин проход',
  'Момчилград',
  'Монтана',
  'Мост',
  'Мъглиж',
  'Неделино',
  'Несебър',
  'Нефтохимик',
  'Николаево',
  'Никопол',
  'Нова Загора',
  'Нови Искър',
  'Нови пазар',
  'Обзор',
  'Огняново',
  'Омуртаг',
  'Опака',
  'Оряхово',
  'Павел баня',
  'Павликени',
  'Пазарджик',
  'Панагюрище',
  'Панчарево',
  'Парвомай',
  'Пауталия',
  'Пещера',
  'Пирдоп',
  'Плачковци',
  'Плевен',
  'Плиска',
  'Пловдив',
  'Полски Тръмбеш',
  'Поморие',
  'Попово',
  'Правец',
  'Приморско',
  'Провадия',
  'Първомай',
  'Радомир',
  'Раднево',
  'Разград',
  'Разлог',
  'Ракитово',
  'Раковски',
  'Рила',
  'Роман',
  'Рудозем',
  'Русе',
  'Садово',
  'Самоков',
  'Сандански',
  'Сапарева баня',
  'Свети Влас',
  'Свиленград',
  'Свищов',
  'Севлиево',
  'Сеново',
  'Септември',
  'Силистра',
  'Симеоновград',
  'Симитли',
  'Синеморец',
  'Ситово',
  'Сливен',
  'Сливница',
  'Сливо поле',
  'Смолян',
  'Смядово',
  'Созопол',
  'Сопот',
  'София',
  'Средец',
  'Средногорци',
  'Стамболийски',
  'Стара Загора',
  'Стралджа',
  'Стрелча',
  'Струмяни',
  'Сунгурларе',
  'Суворово',
  'Съединение',
  'Сърница',
  'Твърдица',
  'Тервел',
  'Тетевен',
  'Тополовград',
  'Трън',
  'Трявна',
  'Тутракан',
  'Търговище',
  'Търнава',
  'Убрежище',
  'Угърчин',
  'Узана',
  'Хаджидимово',
  'Харманли',
  'Хасково',
  'Хисаря',
  'Царево',
  'Цар Калоян',
  'Червен бряг',
  'Черноморец',
  'Чепеларе',
  'Чирпан',
  'Чупрене',
  'Шабла',
  'Шивачево',
  'Шипка',
  'Шумен',
  'Ябланица',
  'Якоруда',
  'Ямбол',
  'Ясеново'
];

export default function CompanyCreationModal({ isOpen, onClose, onSuccess, onNavigateToCompany }: CompanyCreationModalProps) {
  const createCompany = useCreateCompany();
  const { data: companies } = useGetCompanies();
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newRegistrationNumber, setNewRegistrationNumber] = useState('');
  const [newCompanySector, setNewCompanySector] = useState('Други');
  const [newCity, setNewCity] = useState('');
  const [newCityInput, setNewCityInput] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [duplicateCompany, setDuplicateCompany] = useState<Company | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdCompanyEik, setCreatedCompanyEik] = useState<string>('');
  const [showForm, setShowForm] = useState(true);
  
  // Company name autosuggest state
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<Company[]>([]);
  const [showSimilarNameWarning, setShowSimilarNameWarning] = useState(false);

  if (!isOpen) return null;

  // Function to normalize company name for comparison
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[.,;:!?()-]/g, '') // Remove punctuation
      .replace(/\b(еоод|оод|ад|ет)\b/g, ''); // Remove organizational suffixes
  };

  // Function to get company suggestions - for informational purposes only
  const getCompanySuggestions = (inputName: string): Company[] => {
    if (!companies || inputName.trim().length < 2) return [];
    
    const normalizedInput = normalizeCompanyName(inputName);
    
    return companies
      .filter(company => {
        const normalizedCompanyName = normalizeCompanyName(company.name);
        return normalizedCompanyName.includes(normalizedInput) && 
               normalizedCompanyName !== normalizedInput;
      })
      .slice(0, 5); // Limit to 5 suggestions
  };

  // Handle company name input change
  const handleCompanyNameChange = (value: string) => {
    setNewCompanyName(value);
    setCreateError(null);
    setDuplicateCompany(null);
    setSuccessMessage(null);
    setShowSimilarNameWarning(false);
    
    if (value.trim().length >= 2) {
      const suggestions = getCompanySuggestions(value);
      setCompanySuggestions(suggestions);
      setShowCompanySuggestions(suggestions.length > 0);
    } else {
      setShowCompanySuggestions(false);
      setCompanySuggestions([]);
    }
  };

  // Handle company suggestion selection - navigate by ЕИК
  const handleCompanySuggestionSelect = (company: Company) => {
    setShowCompanySuggestions(false);
    setCompanySuggestions([]);
    
    // Navigate to the selected company's profile using ЕИК
    if (onNavigateToCompany) {
      onNavigateToCompany(company.registrationNumber);
      onClose();
    }
  };

  const filteredCities = BULGARIAN_CITIES.filter(city =>
    city.toLowerCase().includes(newCityInput.toLowerCase())
  ).slice(0, 10);

  const handleCityInputChange = (value: string) => {
    setNewCityInput(value);
    setNewCity(value);
    setShowCitySuggestions(value.length > 0);
  };

  const handleCitySelect = (selectedCity: string) => {
    setNewCityInput(selectedCity);
    setNewCity(selectedCity);
    setShowCitySuggestions(false);
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

  const resetForm = () => {
    setNewCompanyName('');
    setNewCompanyDescription('');
    setNewManagerName('');
    setNewRegistrationNumber('');
    setNewCompanySector('Други');
    setNewCity('');
    setNewCityInput('');
    setNewWebsite('');
    setCreateError(null);
    setDuplicateCompany(null);
    setSuccessMessage(null);
    setCreatedCompanyEik('');
    setShowCompanySuggestions(false);
    setCompanySuggestions([]);
    setShowSimilarNameWarning(false);
    setShowForm(true);
  };

  const performCompanyCreation = async () => {
    try {
      const normalizedWebsite = newWebsite.trim() ? normalizeWebsiteUrl(newWebsite) : undefined;
      
      await createCompany.mutateAsync({
        name: newCompanyName.trim(),
        description: newCompanyDescription.trim(),
        managerName: newManagerName.trim() || '', // Optional field
        registrationNumber: newRegistrationNumber.trim(),
        sector: newCompanySector,
        city: newCity.trim(),
        website: normalizedWebsite,
      });
      
      // Store the created company ЕИК and show success message
      setCreatedCompanyEik(newRegistrationNumber.trim());
      setSuccessMessage('Фирмата беше добавена успешно. Сега можете да оставите мнение или да прикачите доказателства за нередности.');
      
      // Hide the form after successful creation
      setShowForm(false);
      
    } catch (error: any) {
      console.error('Error creating company:', error);
      if (error.message && error.message.includes('registration number already exists')) {
        // This shouldn't happen due to our pre-check, but handle it anyway
        const existingCompany = companies?.find(company => 
          company.registrationNumber === newRegistrationNumber.trim()
        );
        if (existingCompany) {
          setDuplicateCompany(existingCompany);
        } else {
          setCreateError('Фирма с този ЕИК вече съществува');
        }
      } else {
        setCreateError('Възникна грешка при създаването на фирмата');
      }
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newCompanyName.trim() || !newCompanyDescription.trim() || !newRegistrationNumber.trim() || !newCompanySector || !newCity.trim()) {
      setCreateError('Моля, попълнете всички задължителни полета');
      return;
    }

    setCreateError(null);
    setDuplicateCompany(null);
    setSuccessMessage(null);

    // Check for duplicate ЕИК only - this is the only blocking check
    if (companies) {
      const existingCompany = companies.find(company => 
        company.registrationNumber === newRegistrationNumber.trim()
      );
      
      if (existingCompany) {
        setDuplicateCompany(existingCompany);
        return;
      }
    }

    // Check for similar names for intermediate confirmation dialog
    if (companies && companySuggestions.length > 0) {
      const hasSimilarName = companySuggestions.some(company => 
        company.registrationNumber !== newRegistrationNumber.trim()
      );
      
      if (hasSimilarName) {
        setShowSimilarNameWarning(true);
        return;
      }
    }

    // Proceed with creation directly if no similar names or EIK conflicts
    await performCompanyCreation();
  };

  const handleRegistrationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setNewRegistrationNumber(value);
    setCreateError(null);
    setDuplicateCompany(null);
    setSuccessMessage(null);
    setShowSimilarNameWarning(false);
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

  const handleNavigateToDuplicate = () => {
    if (duplicateCompany && onNavigateToCompany) {
      onNavigateToCompany(duplicateCompany.registrationNumber);
      onClose();
    }
  };

  const handleProceedWithCreation = async () => {
    setShowSimilarNameWarning(false);
    await performCompanyCreation();
  };

  const handleSelectSimilarCompany = () => {
    if (companySuggestions.length > 0 && onNavigateToCompany) {
      onNavigateToCompany(companySuggestions[0].registrationNumber);
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setSuccessMessage(null);
    setCreatedCompanyEik('');
    resetForm();
    onSuccess();
    onClose();
  };

  const handleNavigateToCreatedCompany = () => {
    if (createdCompanyEik && onNavigateToCompany) {
      onNavigateToCompany(createdCompanyEik);
      handleSuccessClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl max-h-[95vh] w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Добавете нов работодател</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message - Standalone Notification Bubble */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md mobile-notification success-notification-bubble">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium mb-2">
                      {successMessage}
                    </p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={handleNavigateToCreatedCompany}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors mobile-touch-target mobile-btn text-sm"
                      >
                        Отидете към профила на фирмата
                      </button>
                      <button
                        onClick={handleSuccessClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors mobile-touch-target mobile-btn text-sm"
                      >
                        Затворете
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSuccessClose}
                  className="text-green-400 hover:text-green-600 transition-colors p-1 ml-2 flex-shrink-0"
                  title="Затворете съобщението"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Intermediate Confirmation Dialog for Similar Names */}
          {showSimilarNameWarning && companySuggestions.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md mobile-notification">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium mb-3">
                    Възможно е вече да има фирма със сходно име. Проверете предложенията по-долу, преди да създадете нов запис.
                  </p>
                  
                  {/* Show similar companies */}
                  <div className="mb-4 space-y-2">
                    <h4 className="text-sm font-medium text-yellow-800">Намерихме съществуващи фирми със сходно име:</h4>
                    {companySuggestions.map((company) => (
                      <div key={company.registrationNumber} className="bg-white border border-yellow-200 rounded-md p-3">
                        <div className="font-medium text-gray-900 mobile-long-text mb-1">{company.name}</div>
                        <div className="text-sm text-gray-600 mobile-long-text mb-2">
                          ЕИК: {company.registrationNumber} • {company.city}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCompanySuggestionSelect(company)}
                          className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                        >
                          Отидете към профила
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleSelectSimilarCompany}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-colors mobile-touch-target mobile-btn"
                    >
                      Да, това е фирмата
                    </button>
                    <button
                      onClick={handleProceedWithCreation}
                      disabled={createCompany.isPending}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors mobile-touch-target mobile-btn disabled:opacity-50"
                    >
                      {createCompany.isPending ? 'Създаване...' : 'Не, продължи със създаване'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form - Only show if not successful and not showing confirmation dialog */}
          {showForm && !showSimilarNameWarning && (
            <>
              {/* Cyrillic Writing Encouragement Message */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md mobile-notification">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800 text-sm leading-relaxed mobile-long-text break-words">
                    Моля, пишете на кирилица. Така запазваме българския език и правим съдържанието четливо и разбираемо за всички. Истината е най-силна, когато е изразена ясно.
                  </p>
                </div>
              </div>
              
              {/* Duplicate Company Error - Only for ЕИК duplicates */}
              {duplicateCompany && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md mobile-notification">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium mb-2">
                        Фирма с този ЕИК вече съществува. Вижте профила тук:
                      </p>
                      <button
                        onClick={handleNavigateToDuplicate}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {duplicateCompany.name}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* General Error */}
              {createError && !duplicateCompany && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md mobile-notification">
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium mobile-long-text">{createError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateCompany} className="space-y-6">
                {/* Company Name - Full Width with Autosuggest */}
                <div className="text-center mobile-form-section relative">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Име на фирмата *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={newCompanyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    onFocus={() => {
                      if (companySuggestions.length > 0) {
                        setShowCompanySuggestions(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="Въведете пълното наименование на фирмата"
                    required
                  />
                  
                  {/* Company Name Suggestions */}
                  {showCompanySuggestions && companySuggestions.length > 0 && (
                    <div className="absolute z-20 w-full max-w-md mx-auto left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Намерихме съществуващи фирми със сходно име:
                        </p>
                      </div>
                      {companySuggestions.map((company) => (
                        <div key={company.registrationNumber} className="border-b border-gray-100 last:border-b-0">
                          <div className="px-4 py-3">
                            <div className="font-medium text-gray-900 mobile-long-text mb-1">{company.name}</div>
                            <div className="text-sm text-gray-600 mobile-long-text mb-2">
                              ЕИК: {company.registrationNumber} • {company.city}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCompanySuggestionSelect(company)}
                              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                            >
                              Отидете към профила
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1 mobile-long-text">
                    Пишете официалното име. Системата ще предложи съществуващи фирми, за да избегнем дублиране.
                  </p>
                </div>

                {/* Desktop: Two columns for manager and EIK */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="text-center mobile-form-section">
                    <label htmlFor="managerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Управител (по избор)
                    </label>
                    <input
                      type="text"
                      id="managerName"
                      value={newManagerName}
                      onChange={(e) => setNewManagerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                      placeholder="Въведете име на управителя"
                    />
                  </div>

                  <div className="text-center mobile-form-section">
                    <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      ЕИК *
                    </label>
                    <input
                      type="text"
                      id="registrationNumber"
                      value={newRegistrationNumber}
                      onChange={handleRegistrationNumberChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input"
                      placeholder="Въведете ЕИК (само цифри)"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ЕИК е уникален и гарантира, че няма дублирани записи.
                    </p>
                  </div>
                </div>

                {/* Desktop: Two columns for sector and city */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="text-center mobile-form-section">
                    <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                      Сектор на дейност *
                    </label>
                    <select
                      id="sector"
                      value={newCompanySector}
                      onChange={(e) => setNewCompanySector(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-truncate"
                      required
                    >
                      {COMPANY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative text-center mobile-form-section">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Град *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={newCityInput}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={() => setShowCitySuggestions(newCityInput.length > 0)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                      placeholder="Въведете град"
                      required
                    />
                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mobile-scroll-x">
                        {filteredCities.map((cityOption) => (
                          <button
                            key={cityOption}
                            type="button"
                            onClick={() => handleCitySelect(cityOption)}
                            className="w-full text-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none mobile-touch-target mobile-long-text"
                          >
                            {cityOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Website - Full Width */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Уебсайт (по избор)
                  </label>
                  <input
                    type="text"
                    id="website"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="example.com или https://example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1 mobile-long-text">
                    Можете да въведете домейн с или без протокол (напр. "example.com" или "https://example.com")
                  </p>
                </div>

                {/* Description - Full Width */}
                <div className="text-center mobile-form-section">
                  <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Описание *
                  </label>
                  <textarea
                    id="companyDescription"
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                    rows={4}
                    className="w-full max-w-2xl mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center mobile-form-input mobile-long-text"
                    placeholder="Кратко описание на фирмата"
                    required
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer - Only show if form is visible and not showing confirmation dialog */}
        {showForm && !showSimilarNameWarning && (
          <div className="border-t border-gray-200 p-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
              <button
                onClick={handleCreateCompany}
                disabled={createCompany.isPending}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50 mobile-touch-target mobile-btn"
              >
                {createCompany.isPending ? 'Създаване...' : 'Създайте'}
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
