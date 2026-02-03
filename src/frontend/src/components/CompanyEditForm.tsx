import React, { useState } from 'react';
import { useEditCompany } from '../hooks/useQueries';
import { Company } from '../backend';
import { X, AlertTriangle, Info } from 'lucide-react';

interface CompanyEditFormProps {
  company: Company;
  onClose: () => void;
  onSuccess: () => void;
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

export default function CompanyEditForm({ company, onClose, onSuccess }: CompanyEditFormProps) {
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description);
  const [managerName, setManagerName] = useState(company.ownerName);
  const [sector, setSector] = useState(company.sector || 'Други');
  const [city, setCity] = useState(company.city || '');
  const [website, setWebsite] = useState(company.website || '');
  const [reason, setReason] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState(company.city || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const editCompany = useEditCompany();

  const filteredCities = BULGARIAN_CITIES.filter(city =>
    city.toLowerCase().includes(cityInput.toLowerCase())
  ).slice(0, 10);

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    setCity(value);
    setShowCitySuggestions(value.length > 0);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCityInput(selectedCity);
    setCity(selectedCity);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !managerName.trim() || !sector || !city.trim() || !reason.trim()) return;

    setEditError(null);

    try {
      const normalizedWebsite = website.trim() ? normalizeWebsiteUrl(website) : null;
      
      await editCompany.mutateAsync({
        registrationNumber: company.registrationNumber, // Use original ЕИК as identifier
        newName: name.trim(),
        newDescription: description.trim(),
        newOwnerName: managerName.trim(),
        newSector: sector,
        newCity: city.trim(),
        newWebsite: normalizedWebsite,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error editing company:', error);
      setEditError('Възникна грешка при редактирането на фирмата');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Редактиране на фирма: {company.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Cyrillic Writing Encouragement Message */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800 text-sm leading-relaxed">
                Моля, пишете на кирилица. Така запазваме българския език и правим съдържанието четливо и разбираемо за всички. Истината е най-силна, когато е изразена ясно.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{editError}</span>
                </div>
              </div>
            )}

            {/* Company Name - Full Width */}
            <div className="text-center">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Име на фирмата *
              </label>
              <input
                type="text"
                id="companyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                placeholder="Въведете име на фирмата"
                required
              />
            </div>

            {/* Desktop: Two columns for manager and EIK */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="text-center">
                <label htmlFor="managerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Управител *
                </label>
                <input
                  type="text"
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                  placeholder="Въведете име на управителя"
                  required
                />
              </div>

              <div className="text-center">
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  ЕИК *
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  value={company.registrationNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 text-center cursor-not-allowed"
                  title="ЕИК не може да бъде променен"
                />
                <p className="text-xs text-gray-500 mt-1">ЕИК не може да бъде променен</p>
              </div>
            </div>

            {/* Desktop: Two columns for sector and city */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="text-center">
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                  Сектор на дейност *
                </label>
                <select
                  id="sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                  required
                >
                  {COMPANY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative text-center">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Град *
                </label>
                <input
                  type="text"
                  id="city"
                  value={cityInput}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  onFocus={() => setShowCitySuggestions(cityInput.length > 0)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                  placeholder="Въведете град"
                  required
                />
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                    {filteredCities.map((cityOption) => (
                      <button
                        key={cityOption}
                        type="button"
                        onClick={() => handleCitySelect(cityOption)}
                        className="w-full text-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {cityOption}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Website - Full Width */}
            <div className="text-center">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Уебсайт (по избор)
              </label>
              <input
                type="text"
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                placeholder="example.com или https://example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Можете да въведете домейн с или без протокол (напр. "example.com" или "https://example.com")
              </p>
            </div>

            {/* Description - Full Width */}
            <div className="text-center">
              <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Описание *
              </label>
              <textarea
                id="companyDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full max-w-2xl mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                placeholder="Кратко описание на фирмата"
                required
              />
            </div>

            {/* Reason for Edit - Full Width */}
            <div className="text-center">
              <label htmlFor="editReason" className="block text-sm font-medium text-gray-700 mb-2">
                Причина за редакция *
              </label>
              <textarea
                id="editReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full max-w-2xl mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                placeholder="Опишете причината за редакцията"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Причината за редакция ще бъде записана в историята на промените
              </p>
            </div>

            {/* Desktop: Horizontal button layout */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 justify-center">
              <button
                type="submit"
                disabled={editCompany.isPending}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50"
              >
                {editCompany.isPending ? 'Запазване...' : 'Запази промените'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-8 rounded-md transition-colors"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
