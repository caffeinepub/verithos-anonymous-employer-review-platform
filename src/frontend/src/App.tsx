import React from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetUserContextState } from './hooks/useQueries';
import { UserRole } from './backend';
import LandingPage from './pages/LandingPage';
import EmployersPage from './pages/EmployersPage';
import CompanyPage from './pages/CompanyPage';
import BlockchainPage from './pages/BlockchainPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AdminPage from './pages/AdminPage';
import MyOfficialProfilePage from './pages/MyOfficialProfilePage';
import LoginButton from './components/LoginButton';
import BackToTopButton from './components/BackToTopButton';
import MobileMenu from './components/MobileMenu';
import OfficialProfileRequestModal from './components/OfficialProfileRequestModal';
import RejectionNotification from './components/RejectionNotification';
import SuggestionModal from './components/SuggestionModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';

type Page = 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy' | 'admin' | 'my-official-profile';

function App() {
  const { identity } = useInternetIdentity();
  const { data: userContextState, isLoading: isLoadingContext } = useGetUserContextState();
  const [currentPage, setCurrentPage] = React.useState<Page>('landing');
  const [selectedCompanyEik, setSelectedCompanyEik] = React.useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isOfficialProfileModalOpen, setIsOfficialProfileModalOpen] = React.useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = React.useState(false);

  const isAuthenticated = !!identity;
  
  // Single source of truth for user role and official profile status
  const currentUserRole = userContextState?.role || UserRole.guest;
  const employerRequestStatus = userContextState?.officialProfileStatus || 'none';
  const rejectedRequest = userContextState?.rejectedRequest;
  
  const isAdmin = currentUserRole === UserRole.admin;
  const isUser = currentUserRole === UserRole.user;

  const navigateToCompany = (companyEik: string) => {
    setSelectedCompanyEik(companyEik);
    setCurrentPage('company');
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (page: Page, companyEik?: string) => {
    setCurrentPage(page);
    if (companyEik) {
      setSelectedCompanyEik(companyEik);
    }
    setIsMobileMenuOpen(false);
    
    // Scroll to top when navigating to any page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const handleOpenOfficialProfileModal = () => {
    // Client-side guard: prevent opening modal if status is 'pending'
    if (employerRequestStatus === 'pending') {
      return;
    }
    setIsOfficialProfileModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleProfileButtonClick = () => {
    if (employerRequestStatus === 'approved') {
      handleNavigate('my-official-profile');
    } else if (employerRequestStatus === 'none' || employerRequestStatus === 'rejected') {
      // Allow opening modal for both 'none' and 'rejected' statuses
      handleOpenOfficialProfileModal();
    }
    // Do nothing for 'pending' - button is disabled
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'employers':
        return <EmployersPage onNavigateToCompany={navigateToCompany} onNavigate={handleNavigate} />;
      case 'company':
        return <CompanyPage companyEik={selectedCompanyEik} onNavigate={handleNavigate} />;
      case 'blockchain':
        return <BlockchainPage onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} />;
      case 'privacy':
        return <PrivacyPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;
      case 'my-official-profile':
        return <MyOfficialProfilePage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Render CTA button for desktop header - depends ONLY on request status
  const renderDesktopCTA = () => {
    // Don't show anything while loading or if not authenticated
    if (!isAuthenticated || isLoadingContext) {
      return null;
    }

    // Admin: Always show "Админ" button
    if (isAdmin) {
      return (
        <button
          onClick={() => handleNavigate('admin')}
          className={`px-6 py-2 rounded-full transition-colors font-medium bg-amber-500 hover:bg-amber-600 text-blue-900 ${
            currentPage === 'admin' ? 'ring-2 ring-white' : ''
          }`}
        >
          Админ
        </button>
      );
    }

    // User: Show profile-related button based ONLY on status
    if (isUser) {
      // Status: approved → Show "Профил" button
      if (employerRequestStatus === 'approved') {
        return (
          <button
            onClick={handleProfileButtonClick}
            className="px-6 py-2 rounded-full transition-colors font-medium bg-amber-500 hover:bg-amber-600 text-blue-900"
          >
            Профил
          </button>
        );
      }

      // Status: pending → Show disabled "В преглед" button with tooltip
      if (employerRequestStatus === 'pending') {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="px-6 py-2 rounded-full transition-colors font-medium bg-gray-400 text-gray-700 cursor-not-allowed"
                >
                  В преглед
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Заявката е изпратена и се преглежда</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Status: rejected or none → Show active "Заявка за официален профил" button
      if (employerRequestStatus === 'rejected' || employerRequestStatus === 'none') {
        return (
          <button
            onClick={handleProfileButtonClick}
            className="px-6 py-2 rounded-full transition-colors font-medium bg-amber-500 hover:bg-amber-600 text-blue-900"
          >
            Заявка за официален профил
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Now sticky */}
      <header className="sticky top-0 z-50 bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleNavigate('landing')}
            >
              <img 
                src="/assets/verithos-logo-rgb-shield.png" 
                alt="Verithos Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold">Verithos</h1>
                <p className="text-sm text-blue-200">Смелостта да покажеш истината</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => handleNavigate('landing')}
                className={`hover:text-amber-400 transition-colors ${
                  currentPage === 'landing' ? 'text-amber-400' : ''
                }`}
              >
                Начало
              </button>
              <button
                onClick={() => handleNavigate('employers')}
                className={`hover:text-amber-400 transition-colors ${
                  currentPage === 'employers' ? 'text-amber-400' : ''
                }`}
              >
                Работодатели
              </button>
              <button
                onClick={() => handleNavigate('blockchain')}
                className={`hover:text-amber-400 transition-colors ${
                  currentPage === 'blockchain' ? 'text-amber-400' : ''
                }`}
              >
                Как работи Verithos
              </button>
              <button
                onClick={() => handleNavigate('terms')}
                className={`hover:text-amber-400 transition-colors ${
                  currentPage === 'terms' ? 'text-amber-400' : ''
                }`}
              >
                Условия
              </button>
              <button
                onClick={() => handleNavigate('privacy')}
                className={`hover:text-amber-400 transition-colors ${
                  currentPage === 'privacy' ? 'text-amber-400' : ''
                }`}
              >
                Поверителност
              </button>
              <button
                onClick={() => setIsSuggestionModalOpen(true)}
                className="hover:text-amber-400 transition-colors"
              >
                Препоръки
              </button>
              {renderDesktopCTA()}
              <LoginButton />
            </nav>

            {/* Mobile menu button and login */}
            <div className="md:hidden flex items-center space-x-3">
              <LoginButton />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Отвори меню"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onClose={() => setIsMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        currentUserRole={currentUserRole}
        employerRequestStatus={employerRequestStatus}
        onOpenOfficialProfileModal={handleOpenOfficialProfileModal}
        onProfileButtonClick={handleProfileButtonClick}
        isLoadingContext={isLoadingContext}
        onOpenSuggestionModal={() => {
          setIsSuggestionModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
      />

      {/* Rejection Notification - Show when user has rejected request */}
      {isAuthenticated && employerRequestStatus === 'rejected' && rejectedRequest && (
        <RejectionNotification 
          rejectionReason={rejectedRequest.rejectionReason}
          onOpenModal={handleOpenOfficialProfileModal}
        />
      )}

      {/* Official Profile Request Modal */}
      <OfficialProfileRequestModal
        isOpen={isOfficialProfileModalOpen}
        onClose={() => setIsOfficialProfileModalOpen(false)}
        isAuthenticated={isAuthenticated}
        employerRequestStatus={employerRequestStatus}
      />

      {/* Suggestion Modal */}
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Copyright */}
            <p className="text-gray-600 mb-6">© {new Date().getFullYear()} Verithos. Всички права запазени.</p>
            
            {/* Navigation links - styled as simple text links */}
            <nav className="flex flex-wrap justify-center items-center gap-6 mb-6">
              <button
                onClick={() => handleNavigate('landing')}
                className={`text-gray-600 hover:text-blue-900 transition-colors underline ${
                  currentPage === 'landing' ? 'text-blue-900 font-medium' : ''
                }`}
              >
                Начало
              </button>
              <button
                onClick={() => handleNavigate('employers')}
                className={`text-gray-600 hover:text-blue-900 transition-colors underline ${
                  currentPage === 'employers' ? 'text-blue-900 font-medium' : ''
                }`}
              >
                Работодатели
              </button>
              <button
                onClick={() => handleNavigate('blockchain')}
                className={`text-gray-600 hover:text-blue-900 transition-colors underline ${
                  currentPage === 'blockchain' ? 'text-blue-900 font-medium' : ''
                }`}
              >
                Как работи Verithos
              </button>
              <button
                onClick={() => handleNavigate('terms')}
                className={`text-gray-600 hover:text-blue-900 transition-colors underline ${
                  currentPage === 'terms' ? 'text-blue-900 font-medium' : ''
                }`}
              >
                Условия
              </button>
              <button
                onClick={() => handleNavigate('privacy')}
                className={`text-gray-600 hover:text-blue-900 transition-colors underline ${
                  currentPage === 'privacy' ? 'text-blue-900 font-medium' : ''
                }`}
              >
                Поверителност
              </button>
              <button
                onClick={() => setIsSuggestionModalOpen(true)}
                className="text-gray-600 hover:text-blue-900 transition-colors underline"
              >
                Препоръки
              </button>
            </nav>
            
            {/* Platform disclaimer */}
            <p className="text-sm text-gray-500">
              Verithos е технологична платформа. Отговорността за съдържанието е изцяло на потребителите.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
