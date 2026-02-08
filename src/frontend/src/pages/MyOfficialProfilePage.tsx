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

            {/* Rating History Section - ACCESS BASED ONLY ON APPROVED STATUS */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">История на рейтинга</h3>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSelectedPeriod(TimePeriod.days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === TimePeriod.days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30 дни
                </button>
                <button
                  onClick={() => setSelectedPeriod(TimePeriod.months)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === TimePeriod.months
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  12 месеца
                </button>
                <button
                  onClick={() => setSelectedPeriod(TimePeriod.years)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === TimePeriod.years
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  5 години
                </button>
              </div>

              {/* Chart */}
              {ratingHistoryLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        domain={[0, 5]} 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
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
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Няма налични данни за избрания период
                </div>
              )}
            </div>

            {/* Category Ratings Section */}
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Оценки по категории</h3>
              </div>

              <div className="space-y-6">
                {/* Pay Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Заплащане</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {categoryRatings.payRating.average.toFixed(1)} / 5.0
                      <span className="text-xs text-gray-500 ml-2">
                        ({categoryRatings.payRating.count} {categoryRatings.payRating.count === 1 ? 'оценка' : 'оценки'})
                      </span>
                    </span>
                  </div>
                  <RatingDisplay rating={categoryRatings.payRating.average} />
                </div>

                {/* Work Conditions Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Условия на труд</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {categoryRatings.workConditionsRating.average.toFixed(1)} / 5.0
                      <span className="text-xs text-gray-500 ml-2">
                        ({categoryRatings.workConditionsRating.count} {categoryRatings.workConditionsRating.count === 1 ? 'оценка' : 'оценки'})
                      </span>
                    </span>
                  </div>
                  <RatingDisplay rating={categoryRatings.workConditionsRating.average} />
                </div>

                {/* Management Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Управление</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {categoryRatings.managementRating.average.toFixed(1)} / 5.0
                      <span className="text-xs text-gray-500 ml-2">
                        ({categoryRatings.managementRating.count} {categoryRatings.managementRating.count === 1 ? 'оценка' : 'оценки'})
                      </span>
                    </span>
                  </div>
                  <RatingDisplay rating={categoryRatings.managementRating.average} />
                </div>

                {/* Job Security Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Сигурност на работното място</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {categoryRatings.jobSecurityRating.average.toFixed(1)} / 5.0
                      <span className="text-xs text-gray-500 ml-2">
                        ({categoryRatings.jobSecurityRating.count} {categoryRatings.jobSecurityRating.count === 1 ? 'оценка' : 'оценки'})
                      </span>
                    </span>
                  </div>
                  <RatingDisplay rating={categoryRatings.jobSecurityRating.average} />
                </div>

                {/* Other Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Друго</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {categoryRatings.otherRating.average.toFixed(1)} / 5.0
                      <span className="text-xs text-gray-500 ml-2">
                        ({categoryRatings.otherRating.count} {categoryRatings.otherRating.count === 1 ? 'оценка' : 'оценки'})
                      </span>
                    </span>
                  </div>
                  <RatingDisplay rating={categoryRatings.otherRating.average} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Няма одобрен официален профил
              </h3>
              <p className="text-gray-600 mb-6">
                За да видите тази страница, трябва да имате одобрен официален профил.
              </p>
              <button
                onClick={handleOpenOfficialProfileRequestModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Подай заявка за официален профил
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rating Improvement Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Как да подобрим рейтинга си?</h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Отговаряйте на всички мнения</h4>
                  <p className="text-gray-600">
                    Активното участие в диалога с вашите служители показва, че цените тяхното мнение и сте готови да работите за подобрения.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Бъдете конструктивни</h4>
                  <p className="text-gray-600">
                    При отговор на негативни мнения, избягвайте защитна позиция. Вместо това, признайте проблемите и обяснете какви стъпки предприемате за подобрение.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Предоставяйте доказателства</h4>
                  <p className="text-gray-600">
                    Когато отговаряте на мнения, можете да прикачите документи, които подкрепят вашата позиция - например политики, сертификати или други релевантни материали.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">4. Работете за реални подобрения</h4>
                  <p className="text-gray-600">
                    Най-добрият начин да подобрите рейтинга си е да работите за реални подобрения в условията на труд, заплащането и управлението. Това ще доведе до по-позитивни мнения от вашите служители.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">5. Насърчавайте обратна връзка</h4>
                  <p className="text-gray-600">
                    Създайте култура на открита комуникация във вашата организация. Насърчавайте служителите да споделят своите мнения и предложения директно с вас.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Разбрах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal - LOGIC KEPT INTACT */}
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
