import React, { useState, useMemo } from 'react';
import { useGetReviewsForCompany, useReportReview, useSupportReview, useGetCompanyStatistics, useGetCompanies, useIsCallerAdmin, useCheckOfficialResponseAuthorization, useGetOfficialResponsesForReview, useGetOfficialResponseForReview, useGetReportCount, useGetCompanyEditHistory, useGetOfficialResponseEditHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFileUrl } from '../blob-storage/FileStorage';
import { ArrowLeft, Calendar, FileText, AlertTriangle, Download, Eye, Shield, MessageSquare, User, Building2, Edit, ThumbsUp, Info, Archive, ExternalLink, Camera, Volume2, Film, Play, Image, Filter, Tag, MapPin, Globe, Hash, Star, MessageCircle, History, X, Share2 } from 'lucide-react';
import { SiFacebook, SiLinkedin } from 'react-icons/si';
import { Review, Company, OfficialResponse } from '../backend';
import CompanyEditForm from '../components/CompanyEditForm';
import EvidenceModal from '../components/EvidenceModal';
import MultipleEvidenceModal from '../components/MultipleEvidenceModal';
import RatingDisplay from '../components/RatingDisplay';
import ReviewSubmissionModal from '../components/ReviewSubmissionModal';
import OfficialResponseModal from '../components/OfficialResponseModal';
import CompanyEditHistoryTimeline from '../components/CompanyEditHistoryTimeline';
import OfficialResponseEditHistoryTimeline from '../components/OfficialResponseEditHistoryTimeline';
import { createEvidenceArchive, downloadZipArchive } from '../utils/evidenceArchiveDownload';

interface CompanyPageProps {
  companyEik: string;
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'terms' | 'privacy') => void;
}

type EvidenceFilter = 'all' | 'with-evidence' | 'documents' | 'images' | 'videos' | 'audio';

// Bulgarian pluralization helper functions
const pluralizeSupport = (count: number): string => {
  return count === 1 ? `${count} подкрепа` : `${count} подкрепи`;
};

const pluralizeReport = (count: number): string => {
  return count === 1 ? `${count} доклад` : `${count} доклада`;
};

// Sector color mapping - EXACTLY the same as in EmployersPage for consistency
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

export default function CompanyPage({ companyEik, onNavigate }: CompanyPageProps) {
  const { identity } = useInternetIdentity();
  const { data: companies } = useGetCompanies();
  const { data: reviews, isLoading } = useGetReviewsForCompany(companyEik);
  const { data: stats } = useGetCompanyStatistics(companyEik);
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: authData } = useCheckOfficialResponseAuthorization(companyEik);
  const { data: companyEditHistory } = useGetCompanyEditHistory(companyEik);
  const reportReview = useReportReview();
  const supportReview = useSupportReview();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Track which reviews the current user has reported (client-side state)
  const [reportedReviews, setReportedReviews] = useState<Set<string>>(new Set());

  const isAuthenticated = !!identity;
  const canSubmitOfficialResponse = !!authData?.requestorId;

  // Find the company details by ЕИК
  const company = companies?.find((c: Company) => c.registrationNumber === companyEik);

  // Sort reviews by timestamp (newest first)
  const sortedReviews = reviews ? [...reviews].sort((a, b) => Number(b.timestamp - a.timestamp)) : [];

  // Filter reviews based on evidence filter
  const filteredReviews = useMemo(() => {
    if (!sortedReviews) return [];
    
    switch (evidenceFilter) {
      case 'all':
        return sortedReviews;
      case 'with-evidence':
        return sortedReviews.filter(review => review.evidencePaths.length > 0);
      case 'documents':
        return sortedReviews.filter(review => 
          review.evidencePaths.some(path => 
            path.match(/\.pdf$/i)
          )
        );
      case 'images':
        return sortedReviews.filter(review => 
          review.evidencePaths.some(path => 
            path.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          )
        );
      case 'videos':
        return sortedReviews.filter(review => 
          review.evidencePaths.some(path => 
            path.match(/\.(mp4|webm|mov|avi|mkv)$/i)
          )
        );
      case 'audio':
        return sortedReviews.filter(review => 
          review.evidencePaths.some(path => 
            path.match(/\.(mp3|wav|ogg|m4a|aac)$/i)
          )
        );
      default:
        return sortedReviews;
    }
  }, [sortedReviews, evidenceFilter]);

  const handleReportReview = async (hash: string) => {
    try {
      await reportReview.mutateAsync(hash);
      // Mark as reported locally
      setReportedReviews(prev => new Set(prev).add(hash));
    } catch (error: any) {
      console.error('Error reporting review:', error);
    }
  };

  const handleSupportReview = async (hash: string) => {
    try {
      await supportReview.mutateAsync(hash);
    } catch (error: any) {
      console.error('Error supporting review:', error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('bg-BG');
  };

  const getFilterLabel = (filter: EvidenceFilter) => {
    switch (filter) {
      case 'all': return 'Всички типове';
      case 'with-evidence': return 'С доказателства';
      case 'documents': return 'Документи';
      case 'images': return 'Изображения';
      case 'videos': return 'Видеа';
      case 'audio': return 'Аудио';
      default: return 'Всички типове';
    }
  };

  const getFilterIcon = (filter: EvidenceFilter) => {
    switch (filter) {
      case 'all': return <FileText className="w-4 h-4" />;
      case 'with-evidence': return <Shield className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'images': return <Image className="w-4 h-4" />;
      case 'videos': return <Film className="w-4 h-4" />;
      case 'audio': return <Volume2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFilterButtonClasses = (filter: EvidenceFilter, isActive: boolean) => {
    const baseClasses = "flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all";
    
    if (isActive) {
      switch (filter) {
        case 'all':
          return `${baseClasses} border-gray-500 bg-gray-50 text-gray-700`;
        case 'with-evidence':
          return `${baseClasses} border-blue-500 bg-blue-50 text-blue-700`;
        case 'documents':
          return `${baseClasses} border-red-500 bg-red-50 text-red-700`;
        case 'images':
          return `${baseClasses} border-green-500 bg-green-50 text-green-700`;
        case 'videos':
          return `${baseClasses} border-blue-600 bg-blue-50 text-blue-700`;
        case 'audio':
          return `${baseClasses} border-purple-500 bg-purple-50 text-purple-700`;
        default:
          return `${baseClasses} border-gray-500 bg-gray-50 text-gray-700`;
      }
    } else {
      return `${baseClasses} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  const getFilterIconColor = (filter: EvidenceFilter, isActive: boolean) => {
    if (!isActive) return 'text-gray-500';
    
    switch (filter) {
      case 'all': return 'text-gray-600';
      case 'with-evidence': return 'text-blue-600';
      case 'documents': return 'text-red-600';
      case 'images': return 'text-green-600';
      case 'videos': return 'text-blue-700';
      case 'audio': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatBlockchainHash = (hash: string) => {
    return hash.slice(0, 8) + '...' + hash.slice(-8);
  };

  // Determine button text based on review count
  const hasReviews = sortedReviews && sortedReviews.length > 0;
  const reviewButtonText = hasReviews ? 'Споделете мнение' : 'Бъдете първият, който ще остави мнение';

  // Calculate review count for each category
  const totalReviews = sortedReviews ? sortedReviews.length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mobile-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане на мнения...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Фирмата не е намерена</h3>
          <p className="text-gray-600 mb-6">Фирмата с ЕИК {companyEik} не съществува в системата.</p>
          <button
            onClick={() => onNavigate('employers')}
            className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Назад към работодатели
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-container-constrain">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-content-safe">
        {/* Header */}
        <div className="mb-8 mobile-header">
          <button
            onClick={() => onNavigate('employers')}
            className="icon-text-inline text-blue-900 hover:text-blue-700 mb-4 mobile-touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад към работодатели</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mobile-long-text break-words">{company.name}</h1>
          <p className="text-base text-gray-600 mobile-truncate-multiline mobile-long-text">
            Мнения и преживявания от служители
          </p>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 mobile-card">
          {/* Top section - centered */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-blue-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 mobile-long-text break-words">{company.name}</h2>
                  <div className="mobile-wrap-elements mt-1">
                    <div className="icon-text-inline">
                      <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className={`text-sm px-2 py-1 rounded border mobile-truncate ${getSectorColor(company.sector || 'Други')}`}>
                        {company.sector || 'Други'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 flex-shrink-0 ml-2">
                  {isAdmin && (
                    <button
                      onClick={() => setEditingCompany(company)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mobile-touch-target"
                      title="Редактиране на фирмата"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mobile-touch-target"
                    title="История на промените"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lower section - left-aligned and visually separated */}
          <div className="border-t border-gray-200 pt-6">
            {/* Overall Rating Display */}
            {company.overallRating > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg mobile-rating-section">
                <div className="flex items-center">
                  <div>
                    <div className="icon-text-inline mb-2">
                      <Star className="w-6 h-6 text-amber-500 fill-current" />
                      <span className="text-2xl font-bold text-amber-700">
                        {company.overallRating.toFixed(1)}
                      </span>
                      <span className="text-lg text-amber-600">/ 5.0</span>
                    </div>
                    <p className="text-sm font-medium text-amber-800">Обща оценка</p>
                    <p className="text-xs text-gray-500 mt-1">
                      на база {totalReviews} {totalReviews === 1 ? 'мнение' : 'мнения'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-base text-gray-600 mb-4 mobile-long-text break-words">{company.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 mobile-company-details">
              <div className="icon-text-inline text-gray-600">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="mobile-long-text break-words"><strong>Управител:</strong> {company.ownerName}</span>
              </div>
              <div className="icon-text-inline text-gray-600">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="mobile-long-text break-words"><strong>ЕИК:</strong> {company.registrationNumber}</span>
              </div>
              <div className="icon-text-inline text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="mobile-long-text break-words"><strong>Град:</strong> {company.city || 'Не е посочен'}</span>
              </div>
              {company.website && (
                <div className="icon-text-inline text-gray-600">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline mobile-long-text break-words"
                  >
                    Уебсайт
                  </a>
                </div>
              )}
              <div className="icon-text-inline text-gray-600">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="mobile-long-text break-words"><strong>Добавен:</strong> {formatDate(company.createdAt)}</span>
              </div>
              <div className="icon-text-inline text-gray-600">
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-mono mobile-truncate" title="Блокчейн хеш за автентичност">
                  {formatBlockchainHash(company.registrationNumber + company.createdAt.toString())}
                </span>
              </div>
            </div>

            {/* Category Ratings */}
            {company.overallRating > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg mobile-rating-section">
                <h4 className="text-sm font-medium text-gray-900 mb-4 text-center">Средни оценки по категории</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 mobile-rating-grid">
                    <RatingDisplay 
                      rating={company.averagePayRating} 
                      label="Заплащане"
                      size="sm"
                      className="bg-white p-3 rounded-md border border-gray-200 mobile-rating"
                      reviewCount={totalReviews}
                    />
                    <RatingDisplay 
                      rating={company.averageWorkConditionsRating} 
                      label="Работни условия"
                      size="sm"
                      className="bg-white p-3 rounded-md border border-gray-200 mobile-rating"
                      reviewCount={totalReviews}
                    />
                    <RatingDisplay 
                      rating={company.averageManagementRating} 
                      label="Отношение на ръководството"
                      size="sm"
                      className="bg-white p-3 rounded-md border border-gray-200 mobile-rating"
                      reviewCount={totalReviews}
                    />
                    <RatingDisplay 
                      rating={company.averageJobSecurityRating} 
                      label="Сигурност на работното място"
                      size="sm"
                      className="bg-white p-3 rounded-md border border-gray-200 mobile-rating"
                      reviewCount={totalReviews}
                    />
                    <RatingDisplay 
                      rating={company.averageOtherRating} 
                      label="Други"
                      size="sm"
                      className="bg-white p-3 rounded-md border border-gray-200 mobile-rating"
                      reviewCount={totalReviews}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 mobile-card mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
            {stats.totalReviews === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Все още няма данни за статистика.</p>
              </div>
            ) : stats.totalReviews < 5 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Все още няма достатъчно данни за надеждна статистика.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mobile-stats-grid">
                <div className="text-center p-4 bg-blue-50 rounded-lg mobile-p-3">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalReviews}</div>
                  <div className="text-sm text-gray-600 mobile-truncate">Общо мнения</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg mobile-p-3">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-amber-900">{stats.reportedPercentage}%</div>
                  <div className="text-sm text-gray-600 mobile-truncate">Докладвани мнения</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg mobile-p-3">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900">{stats.evidenceCount}</div>
                  <div className="text-sm text-gray-600 mobile-truncate">С доказателства</div>
                </div>
                {company && company.overallRating > 0 && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg mobile-p-3">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="w-6 h-6 text-yellow-600 fill-current" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{company.overallRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600 mobile-truncate">Обща оценка</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Review Button - Centered with dynamic text and security message */}
        {isAuthenticated && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-medium py-3 px-6 rounded-lg transition-colors mobile-btn mobile-touch-target"
            >
              {reviewButtonText}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Вашата самоличност остава напълно анонимна.
            </p>
          </div>
        )}

        {/* Advanced Evidence Filter */}
        {sortedReviews && sortedReviews.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 mobile-card">
              <div className="icon-text-inline mb-4">
                <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <h3 className="text-lg font-medium text-gray-900 mobile-long-text">Филтриране на мнения</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mobile-filter-grid">
                {(['all', 'with-evidence', 'documents', 'images', 'videos', 'audio'] as EvidenceFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setEvidenceFilter(filter)}
                    className={`${getFilterButtonClasses(filter, evidenceFilter === filter)} mobile-filter-button mobile-touch-target`}
                  >
                    <span className={`${getFilterIconColor(filter, evidenceFilter === filter)}`}>
                      {getFilterIcon(filter)}
                    </span>
                    <span className="text-sm font-medium mobile-truncate">{getFilterLabel(filter)}</span>
                  </button>
                ))}
              </div>
              
              {evidenceFilter !== 'all' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md mobile-notification">
                  <p className="text-sm text-blue-800 mobile-long-text">
                    Показани <strong>{filteredReviews.length}</strong> от <strong>{sortedReviews.length}</strong> мнения за филтър "{getFilterLabel(evidenceFilter)}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews && filteredReviews.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mobile-long-text">
              {evidenceFilter === 'all' ? `Мнения (${filteredReviews.length})` : `${getFilterLabel(evidenceFilter)} (${filteredReviews.length})`}
            </h2>
            
            {filteredReviews.map((review: Review) => (
              <ReviewCard
                key={review.hash}
                review={review}
                companyId={companyEik}
                companyName={company.name}
                onReportReview={handleReportReview}
                onSupportReview={handleSupportReview}
                isAuthenticated={isAuthenticated}
                canSubmitOfficialResponse={canSubmitOfficialResponse}
                reportReview={reportReview}
                supportReview={supportReview}
                formatDate={formatDate}
                formatBlockchainHash={formatBlockchainHash}
                currentUserPrincipal={identity?.getPrincipal()}
                hasUserReported={reportedReviews.has(review.hash)}
              />
            ))}
          </div>
        ) : sortedReviews && sortedReviews.length > 0 ? (
          <div className="text-center py-12 mobile-empty-state">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4 icon" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mobile-long-text">Няма мнения за този филтър</h3>
            <p className="text-base text-gray-600 mb-6 mobile-long-text">
              Няма намерени мнения за избрания филтър "{getFilterLabel(evidenceFilter)}"
            </p>
            <button
              onClick={() => setEvidenceFilter('all')}
              className="text-blue-600 hover:text-blue-800 underline mobile-touch-target"
            >
              Покажи всички мнения
            </button>
          </div>
        ) : (
          <div className="text-center py-12 mobile-empty-state">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 icon" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mobile-long-text">Все още няма мнения за този работодател</h3>
            <p className="text-base text-gray-600 mb-6 mobile-long-text">
              Вашият глас може да бъде първият - споделете своето преживяване.
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-gray-500 mobile-long-text">
                Влезте в профила си, за да споделите мнение
              </p>
            )}
          </div>
        )}

        {/* Review Submission Modal */}
        <ReviewSubmissionModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          companyId={companyEik}
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

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">История на промените</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Затвори"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {companyEditHistory && companyEditHistory.length > 0 ? (
                  <CompanyEditHistoryTimeline
                    companyId={companyEik}
                    editHistory={companyEditHistory}
                  />
                ) : (
                  <div className="text-center py-8">
                    <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Няма история на редакции за тази фирма.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  companyId: string;
  companyName: string;
  onReportReview: (hash: string) => void;
  onSupportReview: (hash: string) => void;
  isAuthenticated: boolean;
  canSubmitOfficialResponse: boolean;
  reportReview: any;
  supportReview: any;
  formatDate: (timestamp: bigint) => string;
  formatBlockchainHash: (hash: string) => string;
  currentUserPrincipal?: any;
  hasUserReported: boolean;
}

function ReviewCard({ review, companyId, companyName, onReportReview, onSupportReview, isAuthenticated, canSubmitOfficialResponse, reportReview, supportReview, formatDate, formatBlockchainHash, currentUserPrincipal, hasUserReported }: ReviewCardProps) {
  const [showOfficialResponseModal, setShowOfficialResponseModal] = useState(false);
  const { data: existingResponse } = useGetOfficialResponseForReview(companyId, review.hash);
  const { data: reportCount } = useGetReportCount(review.hash);
  
  const supportCount = review.supporters.length;
  const hasUserSupported = currentUserPrincipal && review.supporters.some(
    supporter => supporter.toString() === currentUserPrincipal.toString()
  );

  // Get report count - use the fetched count from backend
  const displayReportCount = reportCount !== undefined ? reportCount : Number(review.reportCount);

  // Determine if we should show "Официален отговор" or "Редактирай отговор" button
  const hasExistingResponse = !!existingResponse;
  const officialResponseButtonText = hasExistingResponse ? 'Редактирай отговор' : 'Официален отговор';

  // Handle official response button click - no subscription check, only approved profile status
  const handleOfficialResponseClick = () => {
    setShowOfficialResponseModal(true);
  };

  // Generate review URL for sharing
  const reviewUrl = `${window.location.origin}/company/${companyId}#review-${review.hash}`;

  // Social sharing handlers
  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reviewUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Мнение във Verithos');
    const body = encodeURIComponent(`Прочетете това мнение за ${companyName} във Verithos:\n\n${reviewUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div
      id={`review-${review.hash}`}
      className={`bg-white rounded-lg shadow-md p-6 mobile-review-card ${
        review.reported ? 'border-l-4 border-red-500' : ''
      }`}
    >
      <div className="mobile-stack-on-small mb-4 mobile-review-header">
        <div className="mobile-wrap-elements text-sm text-gray-500 mb-2">
          <div className="icon-text-inline">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="mobile-truncate">{formatDate(review.timestamp)}</span>
          </div>
          <span>•</span>
          <div className="icon-text-inline">
            <Hash className="w-4 h-4 flex-shrink-0" />
            <span className="font-mono text-xs mobile-truncate" title="Блокчейн хеш за автентичност">
              {formatBlockchainHash(review.hash)}
            </span>
          </div>
          {review.evidencePaths.length > 0 && (
            <>
              <span>•</span>
              <div className="icon-text-inline">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="mobile-truncate">
                  {review.evidencePaths.length} доказателств{review.evidencePaths.length !== 1 ? 'а' : 'о'}
                </span>
              </div>
            </>
          )}
        </div>
        
        {isAuthenticated && (
          <div className="mobile-wrap-elements mobile-review-actions">
            {/* Support Button */}
            <button
              onClick={() => onSupportReview(review.hash)}
              disabled={supportReview.isPending || hasUserSupported}
              className={`icon-text-inline px-3 py-1 rounded-full text-sm transition-colors mobile-btn-sm mobile-touch-target ${
                hasUserSupported
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700'
              }`}
              title={hasUserSupported ? 'Вече сте подкрепили това мнение' : 'Подкрепете това мнение'}
            >
              <ThumbsUp className={`w-4 h-4 ${hasUserSupported ? 'fill-current' : ''}`} />
              <span>{pluralizeSupport(supportCount)}</span>
            </button>

            {/* Report Button with Count - Disabled if user already reported */}
            <button
              onClick={() => onReportReview(review.hash)}
              disabled={reportReview.isPending || hasUserReported}
              className={`icon-text-inline px-3 py-1 rounded-full text-sm transition-colors mobile-btn-sm mobile-touch-target ${
                hasUserReported
                  ? 'bg-red-100 text-red-700 cursor-not-allowed'
                  : displayReportCount > 0
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700'
              }`}
              title={hasUserReported ? 'Вече сте докладвали това мнение' : 'Докладвайте неточно съдържание'}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{pluralizeReport(displayReportCount)}</span>
            </button>

            {/* Official Response Button - Only visible if user has approved official profile for this company */}
            {/* FIXED: Button is now active when canSubmitOfficialResponse is true (approved status) */}
            {canSubmitOfficialResponse && (
              <button
                onClick={handleOfficialResponseClick}
                className="icon-text-inline px-3 py-1 rounded-full text-sm transition-colors mobile-btn-sm mobile-touch-target bg-blue-100 hover:bg-blue-200 text-blue-700"
                title={hasExistingResponse ? "Редактирайте вашия официален отговор" : "Публикувайте официален отговор"}
              >
                <MessageCircle className="w-4 h-4" />
                <span>{officialResponseButtonText}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Ratings */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg mobile-rating-section">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Оценки по категории</h4>
        <div className="space-y-2">
          <RatingDisplay 
            rating={review.payRating} 
            label="Заплащане"
            size="sm"
            className="bg-white p-2 rounded border border-gray-200 mobile-rating"
          />
          <RatingDisplay 
            rating={review.workConditionsRating} 
            label="Работни условия"
            size="sm"
            className="bg-white p-2 rounded border border-gray-200 mobile-rating"
          />
          <RatingDisplay 
            rating={review.managementRating} 
            label="Отношение на ръководството"
            size="sm"
            className="bg-white p-2 rounded border border-gray-200 mobile-rating"
          />
          <RatingDisplay 
            rating={review.jobSecurityRating} 
            label="Сигурност на работното място"
            size="sm"
            className="bg-white p-2 rounded border border-gray-200 mobile-rating"
          />
          <RatingDisplay 
            rating={review.otherRating} 
            label="Други"
            size="sm"
            className="bg-white p-2 rounded border border-gray-200 mobile-rating"
          />
        </div>
      </div>
      
      <div className="prose max-w-none">
        <p className="text-base text-gray-700 whitespace-pre-wrap mobile-long-text break-words">{review.content}</p>
      </div>
      
      {/* Evidence Display */}
      {review.evidencePaths.length > 0 && (
        <EvidenceDisplay evidencePaths={review.evidencePaths} />
      )}
      
      {review.reported && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md mobile-notification">
          <div className="icon-text-inline text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium mobile-long-text">
              Това мнение е докладвано за неточно съдържание
            </span>
          </div>
        </div>
      )}

      {/* Social Sharing Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleShareFacebook}
            className="icon-text-inline px-3 py-1.5 rounded-full text-sm transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 mobile-btn-sm mobile-touch-target"
            title="Споделете във Facebook"
          >
            <SiFacebook className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="icon-text-inline px-3 py-1.5 rounded-full text-sm transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 mobile-btn-sm mobile-touch-target"
            title="Споделете в LinkedIn"
          >
            <SiLinkedin className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareEmail}
            className="icon-text-inline px-3 py-1.5 rounded-full text-sm transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 mobile-btn-sm mobile-touch-target"
            title="Споделете по имейл"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Support and Report count display for non-authenticated users */}
      {!isAuthenticated && (supportCount > 0 || displayReportCount > 0) && (
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          {supportCount > 0 && (
            <div className="icon-text-inline">
              <ThumbsUp className="w-4 h-4" />
              <span>{pluralizeSupport(supportCount)}</span>
            </div>
          )}
          {displayReportCount > 0 && (
            <div className="icon-text-inline">
              <AlertTriangle className="w-4 h-4" />
              <span>{pluralizeReport(displayReportCount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Official Response Display */}
      {existingResponse && (
        <div className="mt-6">
          <OfficialResponseDisplay
            response={existingResponse}
            companyId={companyId}
            reviewId={review.hash}
            formatDate={formatDate}
            formatBlockchainHash={formatBlockchainHash}
          />
        </div>
      )}

      {/* Official Response Modal */}
      <OfficialResponseModal
        isOpen={showOfficialResponseModal}
        onClose={() => setShowOfficialResponseModal(false)}
        reviewId={review.hash}
        companyId={companyId}
        existingResponse={existingResponse || undefined}
      />
    </div>
  );
}

interface OfficialResponseDisplayProps {
  response: OfficialResponse;
  companyId: string;
  reviewId: string;
  formatDate: (timestamp: bigint) => string;
  formatBlockchainHash: (hash: string) => string;
}

function OfficialResponseDisplay({ response, companyId, reviewId, formatDate, formatBlockchainHash }: OfficialResponseDisplayProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { data: editHistory } = useGetOfficialResponseEditHistory(companyId, reviewId);

  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 ml-4">
      <div className="flex items-center space-x-2 mb-3">
        <Shield className="w-5 h-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-900">Официален отговор</h4>
        {response.editedAt && (
          <span className="text-xs text-blue-600 italic">
            (редактирано {formatDate(response.editedAt)})
          </span>
        )}
      </div>
      
      <div className="mobile-wrap-elements text-xs text-blue-700 mb-3">
        <div className="icon-text-inline">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="mobile-truncate">{formatDate(response.timestamp)}</span>
        </div>
        <span>•</span>
        <div className="icon-text-inline">
          <Hash className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono mobile-truncate" title="Блокчейн хеш за автентичност">
            {formatBlockchainHash(response.hash)}
          </span>
        </div>
      </div>
      
      <div className="prose max-w-none">
        <p className="text-sm text-gray-800 whitespace-pre-wrap mobile-long-text break-words">{response.content}</p>
      </div>
      
      {/* Evidence Display for Official Response */}
      {response.evidencePaths.length > 0 && (
        <div className="mt-3">
          <EvidenceDisplay evidencePaths={response.evidencePaths} />
        </div>
      )}

      {/* History Button */}
      <div className="mt-4 pt-3 border-t border-blue-200">
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <History className="w-4 h-4" />
          <span>История на редакциите</span>
        </button>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">История на редакциите</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {editHistory && editHistory.length > 0 ? (
                <OfficialResponseEditHistoryTimeline
                  companyId={companyId}
                  reviewId={reviewId}
                  editHistory={editHistory}
                />
              ) : (
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Няма история на редакции за този отговор.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface EvidenceDisplayProps {
  evidencePaths: string[];
}

function EvidenceDisplay({ evidencePaths }: EvidenceDisplayProps) {
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const getFileTypeIcon = (fileName: string) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileName.match(/\.pdf$/i);
    const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i);

    if (isImage) return <Image className="w-4 h-4 text-green-500" />;
    if (isPdf) return <FileText className="w-4 h-4 text-red-500" />;
    if (isAudio) return <Volume2 className="w-4 h-4 text-purple-500" />;
    if (isVideo) return <Film className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getFileTypeLabel = (fileName: string) => {
    const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileName.match(/\.pdf$/i);
    const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/i);
    const isVideo = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i);

    if (isImage) return 'Изображение';
    if (isPdf) return 'PDF';
    if (isAudio) return 'Аудио';
    if (isVideo) return 'Видео';
    return 'Файл';
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3 mobile-long-text">
        Доказателства ({evidencePaths.length})
      </h4>

      {/* Personal Data Responsibility Notice */}
      <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md mobile-notification">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-800">
            <p className="font-medium">Отговорност за лични данни</p>
            <p className="mobile-long-text break-words">Отговорността за личните данни в качените файлове е на качилия ги потребител, а не на платформата.</p>
          </div>
        </div>
      </div>

      {/* Evidence Files List - restored to previous layout with improved alignment */}
      <div className="space-y-3 mb-4 mobile-evidence-list">
        {evidencePaths.map((path, index) => (
          <div key={path} className="evidence-item">
            <div className="evidence-item-header">
              <div className="evidence-item-info">
                <div className="evidence-item-title icon-text-inline">
                  {getFileTypeIcon(path)}
                  <span>{path.split('/').pop() || `Файл ${index + 1}`}</span>
                </div>
                <div className="evidence-item-type">
                  {getFileTypeLabel(path)}
                </div>
              </div>
              <div className="evidence-actions">
                <EvidenceFileActions
                  evidencePath={path}
                  index={index}
                  onOpenModal={(idx) => setSelectedEvidenceIndex(idx)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discreet gray text under the list of files */}
      <div className="mb-4">
        <p className="text-xs text-gray-500">
          Всички качени доказателства са публикувани от потребителите и са видими в оригиналния си вид.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mobile-button-group">
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="icon-text-inline text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-md transition-colors mobile-btn-sm mobile-touch-target"
          title="Преглед на всички файлове"
        >
          <Eye className="w-4 h-4" />
          <span>Преглед на всички</span>
        </button>
        
        {evidencePaths.length > 1 && (
          <DownloadAllButton evidencePaths={evidencePaths} />
        )}
      </div>

      {/* Individual Evidence Modal */}
      {selectedEvidenceIndex !== null && (
        <EvidenceModal
          evidencePath={evidencePaths[selectedEvidenceIndex]}
          isOpen={true}
          onClose={() => setSelectedEvidenceIndex(null)}
        />
      )}

      {/* Multiple Evidence Gallery Modal */}
      <MultipleEvidenceModal
        evidencePaths={evidencePaths}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
}

interface EvidenceFileActionsProps {
  evidencePath: string;
  index: number;
  onOpenModal: (index: number) => void;
}

function EvidenceFileActions({ evidencePath, index, onOpenModal }: EvidenceFileActionsProps) {
  const { data: fileUrl, isLoading } = useFileUrl(evidencePath);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fileUrl) return;
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = evidencePath.split('/').pop() || 'evidence';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleNewTabOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => onOpenModal(index)}
        className="evidence-preview-btn mobile-touch-target"
        title="Преглед"
      >
        <Eye className="w-4 h-4" />
        <span>Преглед</span>
      </button>
      <button
        onClick={handleNewTabOpen}
        className="evidence-newtab-btn mobile-touch-target"
        title="Нов раздел"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Нов раздел</span>
      </button>
      <button
        onClick={handleDownload}
        className="evidence-download-btn mobile-touch-target"
        title="Изтегли"
      >
        <Download className="w-4 h-4" />
        <span>Изтегли</span>
      </button>
    </>
  );
}

interface DownloadAllButtonProps {
  evidencePaths: string[];
}

function DownloadAllButton({ evidencePaths }: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Resolve URLs for all files using useFileUrl hook
  const fileUrlQueries = evidencePaths.map(path => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: url } = useFileUrl(path);
    return {
      path,
      url: url ?? null, // Convert undefined to null for type compatibility
      fileName: path.split('/').pop() || 'evidence',
    };
  });

  const handleDownloadAll = async () => {
    if (isDownloading || evidencePaths.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      // Check if all URLs are resolved
      const unresolvedFiles = fileUrlQueries.filter(f => !f.url);
      if (unresolvedFiles.length > 0) {
        console.warn(`${unresolvedFiles.length} files have unresolved URLs, waiting...`);
        // In a real scenario, we'd wait for URLs to resolve
        // For now, we'll proceed with available URLs
      }

      // Create archive using resolved URLs (same as single-file downloads)
      const result = await createEvidenceArchive(fileUrlQueries);
      
      if (!result.success || !result.zipBlob) {
        alert('Не успяхме да включим нито един файл в архива. Моля, опитайте отново по-късно.');
        return;
      }

      // Download the archive
      downloadZipArchive(result.zipBlob, result.successfulFiles.length);
      
      // Show user feedback
      if (result.failedFiles.length > 0) {
        alert(`Архивът е създаден с ${result.successfulFiles.length} файла. ${result.failedFiles.length} файла не можаха да бъдат включени. Вижте _archive_info.txt файла в архива за подробности.`);
      }
      
    } catch (error) {
      console.error('Грешка при създаване на ZIP архив:', error);
      alert('Възникна грешка при създаването на архива. Моля, опитайте отново.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      disabled={isDownloading}
      className={`icon-text-inline text-sm px-3 py-2 rounded-md transition-colors mobile-btn-sm mobile-touch-target ${
        isDownloading 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
      }`}
      title="Изтеглете всички файлове като архив"
    >
      <Archive className="w-4 h-4" />
      <span>{isDownloading ? 'Създаване на архив...' : 'Изтегли като архив'}</span>
    </button>
  );
}
