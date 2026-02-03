import React, { useState, useMemo } from 'react';
import { useGetCompanies, useGetCompanyStatistics, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Plus, Building2, Calendar, MessageSquare, Search, AlertTriangle, User, FileText, Edit, Info, ArrowUpDown, Filter, Tag, MapPin, Globe, Hash, Star } from 'lucide-react';
import { Company } from '../backend';
import CompanyEditForm from '../components/CompanyEditForm';
import CompanyCreationModal from '../components/CompanyCreationModal';
import RatingDisplay from '../components/RatingDisplay';

interface EmployersPageProps {
  onNavigateToCompany: (companyEik: string) => void;
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'terms' | 'privacy') => void;
}

type SortOption = 'name' | 'date' | 'reviews' | 'rating';

const COMPANY_CATEGORIES = [
  'Всички сектори',
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

// Sector color mapping
const getSectorColor = (sector: string): string => {
  const colorMap: { [key: string]: string } = {
    'Информационни технологии': 'bg-blue-100 text-blue-800 border-blue-200',
    'Финанси и банкиране': 'bg-green-100 text-green-800 border-green-200',
    'Здравеопазване': 'bg-red-100 text-red-800 border-red-200',
    'Образование': 'bg-purple-100 text-purple-800 border-purple-200',
    'Производство': 'bg-orange-100 text-orange-800 border-orange-200',
    'Строителство': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Търговия на дребно': 'bg-pink-100 text-pink-800 border-pink-200',
    'Търговия на едро': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Транспорт и логистика': 'bg-teal-100 text-teal-800 border-teal-200',
    'Туризъм и хотелиерство': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Недвижими имоти': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Енергетика': 'bg-amber-100 text-amber-800 border-amber-200',
    'Телекомуникации': 'bg-violet-100 text-violet-800 border-violet-200',
    'Медии и реклама': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'Консултантски услуги': 'bg-rose-100 text-rose-800 border-rose-200',
    'Правни услуги': 'bg-slate-100 text-slate-800 border-slate-200',
    'Счетоводство и одит': 'bg-zinc-100 text-zinc-800 border-zinc-200',
    'Човешки ресурси': 'bg-stone-100 text-stone-800 border-stone-200',
    'Маркетинг и продажби': 'bg-lime-100 text-lime-800 border-lime-200',
    'Дизайн и креативни услуги': 'bg-sky-100 text-sky-800 border-sky-200',
    'Храни и напитки': 'bg-orange-100 text-orange-800 border-orange-200',
    'Мода и текстил': 'bg-pink-100 text-pink-800 border-pink-200',
    'Автомобилна индустрия': 'bg-gray-100 text-gray-800 border-gray-200',
    'Химическа индустрия': 'bg-green-100 text-green-800 border-green-200',
    'Фармацевтична индустрия': 'bg-blue-100 text-blue-800 border-blue-200',
    'Селско стопанство': 'bg-green-100 text-green-800 border-green-200',
    'Горско стопанство': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Рибарство': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Минно дело': 'bg-stone-100 text-stone-800 border-stone-200',
    'Металургия': 'bg-zinc-100 text-zinc-800 border-zinc-200',
    'Машиностроене': 'bg-slate-100 text-slate-800 border-slate-200',
    'Електроника': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Софтуер и разработка': 'bg-violet-100 text-violet-800 border-violet-200',
    'Кибер сигурност': 'bg-red-100 text-red-800 border-red-200',
    'Изкуствен интелект': 'bg-purple-100 text-purple-800 border-purple-200',
    'Биотехнологии': 'bg-teal-100 text-teal-800 border-teal-200',
    'Възобновяема енергия': 'bg-lime-100 text-lime-800 border-lime-200',
    'Околна среда': 'bg-green-100 text-green-800 border-green-200',
    'Социални услуги': 'bg-rose-100 text-rose-800 border-rose-200',
    'Държавна администрация': 'bg-blue-100 text-blue-800 border-blue-200',
    'Неправителствени организации': 'bg-purple-100 text-purple-800 border-purple-200',
    'Спорт и фитнес': 'bg-orange-100 text-orange-800 border-orange-200',
    'Красота и козметика': 'bg-pink-100 text-pink-800 border-pink-200',
    'Ветеринарни услуги': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Сигурност': 'bg-red-100 text-red-800 border-red-200',
    'Почистване': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Други': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return colorMap[sector] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function EmployersPage({ onNavigateToCompany, onNavigate }: EmployersPageProps) {
  const { identity } = useInternetIdentity();
  const { data: companies, isLoading } = useGetCompanies();
  const { data: isAdmin } = useIsCallerAdmin();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Всички сектори');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const isAuthenticated = !!identity;

  // Filter and sort companies based on search term, category filter, and sort option
  const filteredAndSortedCompanies = useMemo(() => {
    if (!companies) return [];
    
    // First filter by search term
    let filtered = companies;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = companies.filter(company => 
        company.name.toLowerCase().includes(term) ||
        company.description.toLowerCase().includes(term) ||
        company.ownerName.toLowerCase().includes(term) ||
        company.registrationNumber.toLowerCase().includes(term)
      );
    }

    // Then filter by category
    if (categoryFilter !== 'Всички сектори') {
      filtered = filtered.filter(company => 
        company.sector === categoryFilter || 
        (!company.sector && categoryFilter === 'Други')
      );
    }

    // Then sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return Number(b.createdAt - a.createdAt); // Newest first
        case 'reviews':
          // We'll need to get review counts for sorting
          // For now, sort by name as fallback
          return a.name.localeCompare(b.name, 'bg');
        case 'rating':
          // Sort by overall rating (highest first), then by name
          if (b.overallRating !== a.overallRating) {
            return b.overallRating - a.overallRating;
          }
          return a.name.localeCompare(b.name, 'bg');
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'bg');
      }
    });
  }, [companies, searchTerm, categoryFilter, sortBy]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('bg-BG');
  };

  const formatBlockchainHash = (hash: string) => {
    return hash.slice(0, 8) + '...' + hash.slice(-8);
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'name': return 'Име';
      case 'date': return 'Дата на добавяне';
      case 'reviews': return 'Брой мнения';
      case 'rating': return 'Обща оценка';
      default: return 'Име';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mobile-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-900 mx-auto mb-4 mobile-icon-lg"></div>
          <p className="text-gray-600 mobile-text-sm">Зареждане на работодатели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 mobile-header">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 mobile-long-text">Работодатели</h1>
          <p className="text-sm md:text-base text-gray-600 mobile-truncate-multiline">
            Изберете работодател, за да видите мнения и споделите своето преживяване
          </p>
        </div>

        {/* Search, Filter and Sort Controls - Desktop Optimized */}
        <div className="mb-6 md:mb-8">
          <div className="desktop-search-controls">
            {/* Search Bar */}
            <div className="search-input">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mobile-icon-md" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base mobile-form-input mobile-long-text"
                  placeholder="Търсете работодател..."
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-dropdown">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400 pointer-events-none mobile-icon-sm" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full pl-8 md:pl-10 pr-8 md:pr-10 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none text-sm md:text-base mobile-form-input mobile-truncate"
                >
                  {COMPANY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ArrowUpDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400 mobile-icon-sm" />
                </div>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="sort-dropdown">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="block w-full pl-3 pr-8 md:pr-10 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none text-sm md:text-base mobile-form-input mobile-truncate"
                >
                  <option value="name">Сортиране по име</option>
                  <option value="date">Сортиране по дата</option>
                  <option value="reviews">Сортиране по мнения</option>
                  <option value="rating">Сортиране по оценка</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ArrowUpDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400 mobile-icon-sm" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Search hint */}
          <div className="flex items-start space-x-2 text-xs md:text-sm text-gray-500 mt-3">
            <Info className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0 mobile-icon-sm" />
            <p className="mobile-truncate-multiline mobile-long-text">
              Можете да търсите по име на фирмата, име на управителя или ЕИК
            </p>
          </div>

          {(searchTerm || categoryFilter !== 'Всички сектори') && (
            <p className="text-xs md:text-sm text-gray-600 mobile-truncate-multiline mobile-long-text mt-2">
              Намерени {filteredAndSortedCompanies.length} резултата
              {searchTerm && ` за "${searchTerm}"`}
              {categoryFilter !== 'Всички сектори' && ` в категория "${categoryFilter}"`}
              {sortBy !== 'name' && ` • Сортирани по ${getSortLabel(sortBy).toLowerCase()}`}
            </p>
          )}

          {!searchTerm && categoryFilter === 'Всички сектори' && sortBy !== 'name' && (
            <p className="text-xs md:text-sm text-gray-600 mobile-long-text mt-2">
              Сортирани по {getSortLabel(sortBy).toLowerCase()}
            </p>
          )}
        </div>

        {/* Create Company Button */}
        {isAuthenticated && (
          <div className="mb-6 md:mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 text-sm md:text-base mobile-touch-target mobile-btn"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mobile-icon-md" />
              <span className="mobile-truncate">Добавете нов работодател</span>
            </button>
          </div>
        )}

        {/* Companies Grid */}
        {filteredAndSortedCompanies && filteredAndSortedCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mobile-grid-1">
            {filteredAndSortedCompanies.map((company: Company) => (
              <CompanyCard
                key={company.registrationNumber}
                company={company}
                onNavigateToCompany={onNavigateToCompany}
                onEditCompany={setEditingCompany}
                formatDate={formatDate}
                formatBlockchainHash={formatBlockchainHash}
                isAdmin={isAdmin || false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 mobile-empty-state">
            <Building2 className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4 mobile-icon-xl icon" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 mobile-long-text">
              {searchTerm || categoryFilter !== 'Всички сектори' ? 'Няма намерени резултати' : 'Няма добавени работодатели'}
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 mobile-truncate-multiline mobile-long-text">
              {searchTerm || categoryFilter !== 'Всички сектори'
                ? `Не са намерени работодатели за зададените критерии`
                : 'Бъдете първият, който добавя работодател в платформата'
              }
            </p>
            {!isAuthenticated && !searchTerm && categoryFilter === 'Всички сектори' && (
              <p className="text-xs md:text-sm text-gray-500 mobile-long-text">
                Влезте в профила си, за да добавите работодател
              </p>
            )}
          </div>
        )}

        {/* Company Creation Modal */}
        <CompanyCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Refresh will happen automatically via React Query
          }}
          onNavigateToCompany={onNavigateToCompany}
        />

        {/* Edit Company Modal */}
        {editingCompany && (
          <CompanyEditForm
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
            onSuccess={() => {
              // Refresh will happen automatically via React Query
            }}
          />
        )}
      </div>
    </div>
  );
}

interface CompanyCardProps {
  company: Company;
  onNavigateToCompany: (companyEik: string) => void;
  onEditCompany: (company: Company) => void;
  formatDate: (timestamp: bigint) => string;
  formatBlockchainHash: (hash: string) => string;
  isAdmin: boolean;
}

function CompanyCard({ company, onNavigateToCompany, onEditCompany, formatDate, formatBlockchainHash, isAdmin }: CompanyCardProps) {
  const { data: stats } = useGetCompanyStatistics(company.registrationNumber);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on edit button
    if ((e.target as HTMLElement).closest('.edit-button')) {
      return;
    }
    onNavigateToCompany(company.registrationNumber);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCompany(company);
  };

  const companySector = company.sector || 'Други';
  const companyCity = company.city;
  const companyWebsite = company.website;

  // Get review count for dynamic link text
  const reviewCount = stats?.totalReviews || 0;
  const getReviewLinkText = () => {
    if (reviewCount === 0) {
      return 'Бъдете първият, който ще остави мнение';
    }
    return `Вижте всички мнения (${reviewCount})`;
  };

  const getReviewStatusText = () => {
    if (reviewCount === 0) {
      return 'Все още няма мнения за тази фирма. Споделете първи своето преживяване.';
    }
    return `${reviewCount} мнения`;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative mobile-company-card mobile-card"
      onClick={handleCardClick}
    >
      <div className="p-4 md:p-6 mobile-p-4">
        <div className="flex items-start justify-between mb-4 mobile-company-header">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-900 mobile-icon-md" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mobile-truncate mobile-long-text">{company.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded border mobile-truncate mobile-text-xs ${getSectorColor(companySector)}`}>
                  {companySector}
                </span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="mobile-company-actions">
              <button
                onClick={handleEditClick}
                className="edit-button p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mobile-touch-target"
                title="Редактиране на компанията"
              >
                <Edit className="w-3 h-3 md:w-4 md:h-4 mobile-icon-sm" />
              </button>
            </div>
          )}
        </div>

        {/* Overall Rating Display */}
        {company.overallRating > 0 && (
          <div className="mb-4 mobile-rating-section">
            <RatingDisplay 
              rating={company.overallRating} 
              label="Обща оценка"
              size="md"
              className="mobile-rating"
            />
          </div>
        )}
        
        <p className="text-sm md:text-base text-gray-600 mb-4 mobile-truncate-multiline mobile-long-text mobile-text-sm">{company.description}</p>
        
        {/* Company Details */}
        <div className="mb-4 space-y-2 mobile-space-y-2 mobile-company-details">
          {company.ownerName && (
            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
              <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mobile-icon-sm" />
              <span className="mobile-truncate mobile-long-text mobile-text-xs">Управител: {company.ownerName}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
            <FileText className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mobile-icon-sm" />
            <span className="mobile-truncate mobile-text-xs">ЕИК: {company.registrationNumber}</span>
          </div>
          {companyCity && (
            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mobile-icon-sm" />
              <span className="mobile-truncate mobile-long-text mobile-text-xs">Град: {companyCity}</span>
            </div>
          )}
          {companyWebsite && (
            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
              <Globe className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mobile-icon-sm" />
              <a 
                href={companyWebsite} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline mobile-truncate mobile-long-text mobile-text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Уебсайт
              </a>
            </div>
          )}
        </div>
        
        {/* Statistics */}
        {stats && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md mobile-p-3">
            <div className="flex items-center justify-between text-xs md:text-sm mobile-text-xs">
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-blue-600 mobile-icon-sm" />
                <span className="text-gray-700">{getReviewStatusText()}</span>
              </div>
              {stats.reportedPercentage > 0 && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-amber-600 mobile-icon-sm" />
                  <span className="text-gray-700">{stats.reportedPercentage}% докладвани</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-2 mobile-text-xs">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mobile-icon-sm" />
            <span className="mobile-truncate mobile-long-text">Добавен {formatDate(company.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Hash className="w-3 h-3 md:w-4 md:h-4 mobile-icon-sm" />
            <span className="font-mono text-xs mobile-text-xs" title="Блокчейн хеш за автентичност">
              {formatBlockchainHash(company.registrationNumber + company.createdAt.toString())}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1 text-xs md:text-sm text-gray-500 mobile-text-xs">
            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mobile-icon-sm" />
            <span>{getReviewLinkText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
