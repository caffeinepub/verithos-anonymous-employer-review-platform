import React from 'react';
import { UserRole } from '../backend';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface MobileMenuProps {
  isOpen: boolean;
  currentPage: string;
  onNavigate: (page: any) => void;
  onClose: () => void;
  isAuthenticated: boolean;
  currentUserRole: UserRole;
  employerRequestStatus: string;
  onOpenOfficialProfileModal: () => void;
  onProfileButtonClick: () => void;
  isLoadingContext: boolean;
  onOpenSuggestionModal: () => void;
}

export default function MobileMenu({
  isOpen,
  currentPage,
  onNavigate,
  onClose,
  isAuthenticated,
  currentUserRole,
  employerRequestStatus,
  onOpenOfficialProfileModal,
  onProfileButtonClick,
  isLoadingContext,
  onOpenSuggestionModal,
}: MobileMenuProps) {
  if (!isOpen) return null;

  const isAdmin = currentUserRole === UserRole.admin;
  const isUser = currentUserRole === UserRole.user;

  // Render CTA button for mobile menu - depends ONLY on request status
  const renderMobileCTA = () => {
    // Don't show anything while loading or if not authenticated
    if (!isAuthenticated || isLoadingContext) {
      return null;
    }

    // Admin: Always show "Админ" button with desktop styling
    if (isAdmin) {
      return (
        <button
          onClick={() => {
            onNavigate('admin');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors ${
            currentPage === 'admin' ? 'bg-amber-600' : ''
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
            onClick={() => {
              onProfileButtonClick();
              onClose();
            }}
            className="w-full text-left px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
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
                  className="w-full text-left px-4 py-3 bg-gray-400 text-white font-medium cursor-not-allowed opacity-60"
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
            onClick={() => {
              onProfileButtonClick();
              onClose();
            }}
            className="w-full text-left px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            Заявка за официален профил
          </button>
        );
      }
    }

    return null;
  };

  return (
    <div
      className="md:hidden fixed inset-0 bg-blue-900 text-white z-40"
      style={{ top: '72px' }}
    >
      <nav className="flex flex-col">
        <button
          onClick={() => {
            onNavigate('landing');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors ${
            currentPage === 'landing' ? 'bg-blue-800 text-amber-400' : ''
          }`}
        >
          Начало
        </button>
        <button
          onClick={() => {
            onNavigate('employers');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors ${
            currentPage === 'employers' ? 'bg-blue-800 text-amber-400' : ''
          }`}
        >
          Работодатели
        </button>
        <button
          onClick={() => {
            onNavigate('blockchain');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors ${
            currentPage === 'blockchain' ? 'bg-blue-800 text-amber-400' : ''
          }`}
        >
          Как работи Verithos
        </button>
        <button
          onClick={() => {
            onNavigate('terms');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors ${
            currentPage === 'terms' ? 'bg-blue-800 text-amber-400' : ''
          }`}
        >
          Условия
        </button>
        <button
          onClick={() => {
            onNavigate('privacy');
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors ${
            currentPage === 'privacy' ? 'bg-blue-800 text-amber-400' : ''
          }`}
        >
          Поверителност
        </button>
        <button
          onClick={onOpenSuggestionModal}
          className="w-full text-left px-4 py-3 hover:bg-blue-800 transition-colors"
        >
          Препоръки
        </button>
        {renderMobileCTA()}
      </nav>
    </div>
  );
}
