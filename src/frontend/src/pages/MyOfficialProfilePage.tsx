import React from 'react';
import { ArrowLeft, Building2, CheckCircle2, Star, MessageSquare, Reply, Globe, Calendar, HelpCircle, X, TrendingUp, BarChart3, FileText, Edit } from 'lucide-react';
import { useGetCallerOfficialProfileRequest, useGetCompanies, useGetReviewsForCompany, useGetOfficialResponsesForCompany, useGetRatingHistory, useGetSubscriptionStatus, useGetSubscriptionExpirationDate, useActivateOfficialProfile, useDeactivateOfficialProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimePeriod, SubscriptionStatus } from '../backend';
import { toast } from 'sonner';
import SubscriptionModal from '../components/SubscriptionModal';
import RatingDisplay from '../components/RatingDisplay';
import OfficialProfileRequestModal from '../components/OfficialProfileRequestModal';
import CompanyEditForm from '../components/CompanyEditForm';

type Page = 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy' | 'admin' | 'my-official-profile';

interface MyOfficialProfilePageProps {
  onNavigate: (page: Page, companyEik?: string) => void;
}

export default function MyOfficialProfilePage({ onNavigate }: MyOfficialProfilePageProps) {
  const { identity } = useInternetIdentity();
  const { data: officialProfileRequest, isLoading: requestLoading } = useGetCallerOfficialProfileRequest();
  const { data: companies, isLoading: companiesLoading } = useGetCompanies();
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);
  const [showOfficialProfileRequestModal, setShowOfficialProfileRequestModal] = React.useState(false);
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>(TimePeriod.months);
  
  // Find the company using the registration number from the approved request
  const company = React.useMemo(() => {
    if (!officialProfileRequest || !companies) return null;
    return companies.find(c => c.registrationNumber === officialProfileRequest.registrationNumber);
  }, [officialProfileRequest, companies]);

  const { data: reviews, isLoading: reviewsLoading } = useGetReviewsForCompany(company?.registrationNumber || '');
  const { data: officialResponses, isLoading: responsesLoading } = useGetOfficialResponsesForCompany(company?.registrationNumber || '');
  const { data: ratingHistory, isLoading: ratingHistoryLoading } = useGetRatingHistory(company?.registrationNumber || '', selectedPeriod);
  
  // Centralized subscription status and expiration date queries - LOGIC KEPT INTACT BUT NOT USED FOR ACCESS CONTROL
  const { data: subscriptionStatus, isLoading: subscriptionLoading, refetch: refetchSubscriptionStatus } = useGetSubscriptionStatus(company?.registrationNumber || '');
  const { data: expirationDate, isLoading: expirationLoading, refetch: refetchExpirationDate } = useGetSubscriptionExpirationDate(company?.registrationNumber || '');
  const activateMutation = useActivateOfficialProfile();
  const deactivateMutation = useDeactivateOfficialProfile();

  const isLoading = requestLoading || companiesLoading || reviewsLoading || responsesLoading;
  const isAuthenticated = !!identity;

  // Calculate metrics - always show real data from current reviews and responses
  const totalReviews = reviews?.length || 0;
  const averageRating = company?.overallRating || 0;
  const answeredReviews = officialResponses?.length || 0;

  // Compute category ratings directly from reviews with proper filtering and rounding
  const categoryRatings = React.useMemo(() => {
    // Wait for reviews to be fully loaded
    if (reviewsLoading || !reviews || reviews.length === 0) {
      return {
        payRating: { average: 0, count: 0 },
        workConditionsRating: { average: 0, count: 0 },
        managementRating: { average: 0, count: 0 },
        jobSecurityRating: { average: 0, count: 0 },
        otherRating: { average: 0, count: 0 },
      };
    }

    // Helper function to compute average for a specific category
    const computeCategoryAverage = (categoryKey: 'payRating' | 'workConditionsRating' | 'managementRating' | 'jobSecurityRating' | 'otherRating') => {
      // Filter reviews that have a valid rating (> 0) for this category
      const validReviews = reviews.filter(r => r[categoryKey] > 0);
      
      if (validReviews.length === 0) {
        return { average: 0, count: 0 };
      }
      
      // Sum all valid ratings for this category
      const sum = validReviews.reduce((acc, r) => acc + r[categoryKey], 0);
      
      // Calculate average and round to 1 decimal place
      const average = sum / validReviews.length;
      
      return { 
        average: Math.round(average * 10) / 10, // Round to 1 decimal place
        count: validReviews.length 
      };
    };

    return {
      payRating: computeCategoryAverage('payRating'),
      workConditionsRating: computeCategoryAverage('workConditionsRating'),
      managementRating: computeCategoryAverage('managementRating'),
      jobSecurityRating: computeCategoryAverage('jobSecurityRating'),
      otherRating: computeCategoryAverage('otherRating'),
    };
  }, [reviews, reviewsLoading]);

  // Transform rating history data for chart
  const chartData = React.useMemo(() => {
    if (!ratingHistory || ratingHistory.length === 0) return [];
    
    return ratingHistory.map(([timestamp, values]) => {
      const date = new Date(Number(timestamp) / 1000000);
      return {
        date: date.toLocaleDateString('bg-BG', { 
          year: 'numeric', 
          month: 'short',
          day: 'numeric'
        }),
        'Общ рейтинг': Number(values.overallRating.toFixed(2)),
        timestamp: Number(timestamp)
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [ratingHistory]);

  // Get approval date from the official profile request's approvalTimestamp
  const approvalDate = React.useMemo(() => {
    if (!officialProfileRequest?.approvalTimestamp) return null;
    return new Date(Number(officialProfileRequest.approvalTimestamp) / 1000000);
  }, [officialProfileRequest]);

  // ACCESS CONTROL BASED ONLY ON APPROVAL STATUS - SUBSCRIPTION CHECKS DISABLED
  const isOfficialProfileApproved = officialProfileRequest?.status === 'approved';
  const employerRequestStatus = officialProfileRequest?.status || 'none';

  // Handler for navigating to the latest review
  const handleNavigateToLatestReview = () => {
    if (company && totalReviews > 0) {
      onNavigate('company', company.registrationNumber);
    }
  };

  // Handlers for subscription status toggle using correct backend functions - LOGIC KEPT INTACT
  const handleActivateSubscription = async () => {
    if (!company?.registrationNumber) {
      toast.error('Няма налична фирма');
      return;
    }
    
    try {
      await activateMutation.mutateAsync(company.registrationNumber);
      // Manually refetch to ensure UI updates
      await refetchSubscriptionStatus();
      await refetchExpirationDate();
      toast.success('Абонаментът е активиран успешно');
    } catch (error: any) {
      console.error('Activation error:', error);
      toast.error(error.message || 'Грешка при активиране на абонамента');
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!company?.registrationNumber) {
      toast.error('Няма налична фирма');
      return;
    }
    
    try {
      await deactivateMutation.mutateAsync(company.registrationNumber);
      // Manually refetch to ensure UI updates
      await refetchSubscriptionStatus();
      await refetchExpirationDate();
      toast.success('Абонаментът е деактивиран успешно');
    } catch (error: any) {
      console.error('Deactivation error:', error);
      toast.error(error.message || 'Грешка при деактивиране на абонамента');
    }
  };

  // Handler to open subscription modal - LOGIC KEPT INTACT
  const handleOpenSubscriptionModal = () => {
    setShowSubscriptionModal(true);
  };

  // Handler to open official profile request modal
  const handleOpenOfficialProfileRequestModal = () => {
    setShowOfficialProfileRequestModal(true);
  };

  // Handler to open edit form
  const handleOpenEditForm = () => {
    setShowEditForm(true);
  };

  // Handler for successful edit
  const handleEditSuccess = () => {
    toast.success('Данните са актуализирани успешно');
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 mb-1">{payload[0].payload.date}</p>
          <p className="text-base font-semibold text-gray-900">
            Рейтинг: {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center text-blue-900 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад към начало
        </button>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Моят официален профил</h1>
              <p className="text-gray-600">
                Вашата заявка за официален профил е одобрена. Тук можете да управлявате вашия официален профил и да отговаряте на мнения за вашата фирма.
              </p>
            </div>
            {/* Rating Improvement Button */}
            <button
              onClick={() => setShowRatingModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4" />
              Как да подобрим рейтинга си?
            </button>
          </div>
        </div>

        {/* SUBSCRIPTION SECTION COMPLETELY HIDDEN - All visual elements removed */}
        {/* Subscription logic and handlers remain intact above for backend functionality */}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : company && officialProfileRequest?.status === 'approved' ? (
          <>
            {/* Company Data Section - NOW FIRST with Edit Button */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Данни за фирмата</h3>
                </div>
                {/* Edit Button - Only visible for approved employers */}
                <button
                  onClick={handleOpenEditForm}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <Edit className="w-4 h-4" />
                  Редактирай
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Company Name */}
                <div className="flex items-start border-b border-gray-200 pb-4">
                  <Building2 className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500 mb-1">Име на фирмата</div>
                    <div className="text-base text-gray-900">{company.name}</div>
                  </div>
                </div>

                {/* Registration Number (ЕИК) */}
                <div className="flex items-start border-b border-gray-200 pb-4">
                  <div className="w-5 h-5 flex items-center justify-center text-gray-500 mr-3 mt-1">
                    <span className="text-xs font-bold">ЕИК</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500 mb-1">ЕИК</div>
                    <div className="text-base text-gray-900">{company.registrationNumber}</div>
                  </div>
                </div>

                {/* Website (only if available) */}
                {company.website && (
                  <div className="flex items-start border-b border-gray-200 pb-4">
                    <Globe className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500 mb-1">Уебсайт</div>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}

                {/* Approval Date */}
                {approvalDate && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500 mb-1">Дата на одобрение на официалния профил</div>
                      <div className="text-base text-gray-900">
                        {approvalDate.toLocaleDateString('bg-BG', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Panel - NOW SECOND */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center mb-6">
                <Building2 className="w-8 h-8 text-amber-500 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Статистика</h2>
                  <div className="flex items-center mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-600 text-sm font-medium">Официален профил – активен</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Total Reviews - Clickable */}
                <button
                  onClick={handleNavigateToLatestReview}
                  disabled={totalReviews === 0}
                  className={`bg-gray-50 rounded-lg p-4 border border-gray-200 text-left transition-all ${
                    totalReviews > 0 
                      ? 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer' 
                      : 'cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{totalReviews}</div>
                  <div className="text-sm text-gray-600">Общо мнения</div>
                </button>

                {/* Average Rating - Always shows numeric value */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Средна оценка</div>
                </div>

                {/* Answered Reviews Count */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Reply className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{answeredReviews}</div>
                  <div className="text-sm text-gray-600">Отговорени мнения</div>
                </div>

                {/* Response Rate */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {totalReviews > 0 ? `${answeredReviews} / ${totalReviews}` : '0 / 0'}
                  </div>
                  <div className="text-sm text-gray-600">Брой отговорени / общ брой</div>
                </div>
              </div>
            </div>

            {/* Rating History Section - ACCESS BASED ONLY ON APPROVED STATUS */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Рейтинг във времето</h3>
              </div>
              
              {!isOfficialProfileApproved ? (
                // Locked State - Show when official profile is not approved
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="bg-gray-100 rounded-full p-6 mb-6">
                    <CheckCircle2 className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-700 text-center mb-6">
                    Функцията е достъпна с одобрен официален профил.
                  </p>
                  <button
                    onClick={handleOpenOfficialProfileRequestModal}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Заявка за официален профил
                  </button>
                </div>
              ) : (
                // Active State - Show chart and filters when official profile is approved
                <>
                  {/* Period Selection */}
                  <div className="flex justify-end gap-2 mb-6">
                    <button
                      onClick={() => setSelectedPeriod(TimePeriod.days)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedPeriod === TimePeriod.days
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Дни
                    </button>
                    <button
                      onClick={() => setSelectedPeriod(TimePeriod.months)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedPeriod === TimePeriod.months
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Месеци
                    </button>
                    <button
                      onClick={() => setSelectedPeriod(TimePeriod.years)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        selectedPeriod === TimePeriod.years
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Години
                    </button>
                  </div>

                  {ratingHistoryLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <div className="animate-pulse text-gray-500">Зареждане на данни...</div>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Все още няма достатъчно данни за показване на тенденция.</p>
                        <p className="text-sm text-gray-400 mt-2">Данните ще се появят след като получите повече мнения.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#9ca3af"
                          />
                          <YAxis 
                            domain={[0, 5]}
                            ticks={[0, 1, 2, 3, 4, 5]}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            stroke="#9ca3af"
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Общ рейтинг" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Trend Indicators */}
                  {chartData.length >= 2 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(() => {
                          const firstRating = chartData[0]['Общ рейтинг'];
                          const lastRating = chartData[chartData.length - 1]['Общ рейтинг'];
                          const change = lastRating - firstRating;
                          const percentChange = firstRating > 0 ? ((change / firstRating) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Начална стойност</div>
                                <div className="text-2xl font-bold text-gray-900">{firstRating.toFixed(2)}</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Текуща стойност</div>
                                <div className="text-2xl font-bold text-gray-900">{lastRating.toFixed(2)}</div>
                              </div>
                              <div className={`rounded-lg p-4 border ${
                                change > 0 
                                  ? 'bg-green-50 border-green-200' 
                                  : change < 0 
                                  ? 'bg-red-50 border-red-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="text-sm text-gray-600 mb-1">Промяна</div>
                                <div className={`text-2xl font-bold ${
                                  change > 0 
                                    ? 'text-green-600' 
                                    : change < 0 
                                    ? 'text-red-600' 
                                    : 'text-gray-900'
                                }`}>
                                  {change > 0 ? '+' : ''}{change.toFixed(2)} ({change > 0 ? '+' : ''}{percentChange}%)
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Category Ratings Section - Computed directly from reviews with proper loading state */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Средни оценки по категории</h3>
              </div>
              
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-gray-500">Зареждане на данни...</div>
                </div>
              ) : totalReviews === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Все още няма мнения за показване на оценки по категории.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <RatingDisplay 
                    rating={categoryRatings.payRating.average} 
                    label="Заплащане"
                    size="sm"
                    className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    reviewCount={categoryRatings.payRating.count}
                  />
                  <RatingDisplay 
                    rating={categoryRatings.workConditionsRating.average} 
                    label="Работни условия"
                    size="sm"
                    className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    reviewCount={categoryRatings.workConditionsRating.count}
                  />
                  <RatingDisplay 
                    rating={categoryRatings.managementRating.average} 
                    label="Отношение на ръководството"
                    size="sm"
                    className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    reviewCount={categoryRatings.managementRating.count}
                  />
                  <RatingDisplay 
                    rating={categoryRatings.jobSecurityRating.average} 
                    label="Сигурност на работното място"
                    size="sm"
                    className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    reviewCount={categoryRatings.jobSecurityRating.count}
                  />
                  <RatingDisplay 
                    rating={categoryRatings.otherRating.average} 
                    label="Други"
                    size="sm"
                    className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    reviewCount={categoryRatings.otherRating.count}
                  />
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Rating Improvement Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Как да подобрим рейтинга си?</h2>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Section 1: How rating is formed */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <Star className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-semibold text-gray-900">Как се формира рейтингът на фирмата</h3>
                </div>
                <p className="text-gray-700 leading-relaxed ml-9">
                  Рейтингът се изчислява като средна стойност от оценките по пет категории: Заплащане, Работни условия, Отношение на ръководството, Сигурност на работното място и Други. Всяко ново мнение влияе директно върху общия резултат.
                </p>
              </div>

              {/* Section 2: Role of official responses */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <Reply className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-semibold text-gray-900">Каква е ролята на официалните отговори</h3>
                </div>
                <p className="text-gray-700 leading-relaxed ml-9">
                  Официалните отговори демонстрират активно управление на репутацията. Компанията изгражда доверие, когато реагира публично и конструктивно. Макар отговорите да не променят числовия рейтинг, те подсилват възприятието на кандидати и клиенти за отговорност и прозрачност.
                </p>
              </div>

              {/* Section 3: Why timely and reasoned responses improve perception */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-semibold text-gray-900">Защо навременният и аргументиран отговор подобрява възприятието</h3>
                </div>
                <p className="text-gray-700 leading-relaxed ml-9">
                  Бързата и конструктивна реакция демонстрира професионализъм. Компанията изгражда доверие, когато признава проблемите и предлага решения. Навременните отговори подсилват впечатлението за зряло управление и влияят пряко върху решенията на кандидати и клиенти.
                </p>
              </div>

              {/* Section 4: How active participation increases trust and reputation */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <Building2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-semibold text-gray-900">Как активното участие увеличава доверието и репутацията</h3>
                </div>
                <p className="text-gray-700 leading-relaxed ml-9">
                  Редовните и качествени отговори изграждат положителна репутация. Компанията демонстрира прозрачност и отвореност към диалог. Кандидатите виждат, че организацията не избягва критиката, а я използва за растеж. Това увеличава доверието и прави фирмата по-привлекателна за таланти.
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900 leading-relaxed">
                  <strong>Съвет:</strong> Отговаряйте на всички мнения - положителни и отрицателни. Благодарете за добрите отзиви и адресирайте конструктивно критиките. Активната комуникация изгражда доверие и демонстрира ангажираност към подобрение.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowRatingModal(false)}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Разбрах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal - KEPT INTACT */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Official Profile Request Modal */}
      <OfficialProfileRequestModal
        isOpen={showOfficialProfileRequestModal}
        onClose={() => setShowOfficialProfileRequestModal(false)}
        isAuthenticated={isAuthenticated}
        employerRequestStatus={employerRequestStatus}
      />

      {/* Company Edit Form Modal */}
      {showEditForm && company && (
        <CompanyEditForm
          company={company}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
