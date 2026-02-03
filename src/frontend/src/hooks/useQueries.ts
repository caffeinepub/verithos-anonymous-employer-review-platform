import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Company, Review, OfficialProfileRequest, OfficialResponse, OfficialResponseAuthorization, UserContextState, UserRole, TimePeriod, RatingValues, Time, SubscriptionStatus, Suggestion, SuggestionStatus, CompanyEdit, OfficialResponseEdit } from '../backend';

// Unified user context state query - single source of truth
export function useGetUserContextState() {
  const { actor, isFetching } = useActor();

  return useQuery<UserContextState>({
    queryKey: ['userContextState'],
    queryFn: async () => {
      if (!actor) {
        return {
          role: UserRole.guest,
          officialProfileStatus: 'none'
        };
      }
      return actor.getUserContextState();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

// Admin role queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Company queries
export function useGetCompanies() {
  const { actor, isFetching } = useActor();

  return useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompanies();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCompany() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      managerName, 
      registrationNumber,
      sector,
      city,
      website
    }: { 
      name: string; 
      description: string; 
      managerName: string; 
      registrationNumber: string;
      sector: string;
      city: string;
      website?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Convert empty string or undefined to null, otherwise pass the string value
      const websiteParam = website && website.trim() ? website.trim() : null;
      return actor.createCompany(name, description, managerName, registrationNumber, city, sector, websiteParam);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companyStats'] });
    },
  });
}

export function useEditCompany() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      registrationNumber, // Use ЕИК as identifier
      newName,
      newDescription, 
      newOwnerName, 
      newSector,
      newCity,
      newWebsite,
      reason
    }: { 
      registrationNumber: string; // Original ЕИК as identifier
      newName: string;
      newDescription: string; 
      newOwnerName: string; 
      newSector: string;
      newCity: string;
      newWebsite: string | null;
      reason: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editCompany(registrationNumber, newName, newDescription, newOwnerName, newCity, newSector, newWebsite, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companyStats'] });
      queryClient.invalidateQueries({ queryKey: ['companyEditHistory', variables.registrationNumber] });
    },
  });
}

// Company edit history query
export function useGetCompanyEditHistory(companyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CompanyEdit[]>({
    queryKey: ['companyEditHistory', companyId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompanyEditHistory(companyId);
    },
    enabled: !!actor && !isFetching && !!companyId,
  });
}

// Review queries - using ЕИК as companyId
export function useGetReviewsForCompany(companyEik: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Review[]>({
    queryKey: ['reviews', companyEik],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReviewsForCompany(companyEik);
    },
    enabled: !!actor && !isFetching && !!companyEik,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      companyId, // This is ЕИК
      content, 
      evidencePaths, 
      hash,
      payRating,
      workConditionsRating,
      managementRating,
      jobSecurityRating,
      otherRating
    }: { 
      companyId: string; // ЕИК
      content: string; 
      evidencePaths: string[]; 
      hash: string;
      payRating: number;
      workConditionsRating: number;
      managementRating: number;
      jobSecurityRating: number;
      otherRating: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitReview(companyId, content, evidencePaths, hash, payRating, workConditionsRating, managementRating, jobSecurityRating, otherRating);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['companyStats', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['ratingHistory', variables.companyId] });
    },
  });
}

export function useReportReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hash: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportReview(hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['companyStats'] });
      queryClient.invalidateQueries({ queryKey: ['reportCount'] });
    },
  });
}

export function useSupportReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hash: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.supportReview(hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['companyStats'] });
    },
  });
}

// Get report count for a specific review
export function useGetReportCount(hash: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['reportCount', hash],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getReportCount(hash);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!hash,
  });
}

// Company statistics with enhanced sorting support - using ЕИК
export function useGetCompanyStatistics(companyEik: string) {
  const { data: reviews } = useGetReviewsForCompany(companyEik);

  return useQuery({
    queryKey: ['companyStats', companyEik],
    queryFn: () => {
      if (!reviews) return null;
      
      const totalReviews = reviews.length;
      const reportedReviews = reviews.filter(r => r.reported).length;
      const evidenceCount = reviews.filter(r => r.evidencePaths.length > 0).length;
      const reportedPercentage = totalReviews > 0 ? Math.round((reportedReviews / totalReviews) * 100) : 0;

      return {
        totalReviews,
        reportedReviews,
        reportedPercentage,
        evidenceCount,
      };
    },
    enabled: !!reviews,
  });
}

// Enhanced company statistics for sorting
export function useGetAllCompanyStatistics() {
  const { data: companies } = useGetCompanies();
  
  return useQuery({
    queryKey: ['allCompanyStats'],
    queryFn: async () => {
      if (!companies) return {};
      
      const statsMap: Record<string, { totalReviews: number; reportedPercentage: number; evidenceCount: number }> = {};
      
      // This would ideally be done on the backend for better performance
      // For now, we'll return empty stats and let individual company stats handle it
      companies.forEach(company => {
        statsMap[company.registrationNumber] = { // Use ЕИК as key
          totalReviews: 0,
          reportedPercentage: 0,
          evidenceCount: 0,
        };
      });
      
      return statsMap;
    },
    enabled: !!companies,
  });
}

// Official Profile Request queries
export function useGetCallerOfficialProfileRequest() {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialProfileRequest | null>({
    queryKey: ['callerOfficialProfileRequest'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerOfficialProfileRequest();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0, // Always fetch fresh data
  });
}

export function useSubmitOfficialProfileRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      companyName, 
      registrationNumber, 
      website,
      tradeRegisterLink,
      confirmationDocument
    }: { 
      companyName: string; 
      registrationNumber: string; 
      website?: string;
      tradeRegisterLink: string;
      confirmationDocument: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Convert empty string or undefined to null, otherwise pass the string value
      const websiteParam = website && website.trim() ? website.trim() : null;
      return actor.submitOfficialProfileRequest(companyName, registrationNumber, websiteParam, tradeRegisterLink, confirmationDocument);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerOfficialProfileRequest'] });
      queryClient.invalidateQueries({ queryKey: ['userContextState'] });
    },
  });
}

// Get all official profile requests (admin only) - returns tuples of (requestKey, request)
export function useGetAllOfficialProfileRequests(filter?: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, OfficialProfileRequest]>>({
    queryKey: ['allOfficialProfileRequests', filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOfficialProfileRequests(filter ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

// Approve official profile request (admin only) - uses exact requestKey from backend
export function useApproveOfficialProfileRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestKey: string) => {
      if (!actor) throw new Error('Actor not available');
      // Pass null as rejectionReason when approving
      return actor.updateOfficialProfileRequestStatus(requestKey, 'approved', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOfficialProfileRequests'] });
      queryClient.invalidateQueries({ queryKey: ['userContextState'] });
      queryClient.invalidateQueries({ queryKey: ['callerOfficialProfileRequest'] });
    },
  });
}

// Reject official profile request (admin only) - uses exact requestKey from backend
export function useRejectOfficialProfileRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestKey, reason }: { requestKey: string; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Pass the rejection reason as the third parameter
      return actor.updateOfficialProfileRequestStatus(requestKey, 'rejected', reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOfficialProfileRequests'] });
      queryClient.invalidateQueries({ queryKey: ['userContextState'] });
      queryClient.invalidateQueries({ queryKey: ['callerOfficialProfileRequest'] });
    },
  });
}

// Centralized Subscription Status queries
export function useGetSubscriptionStatus(registrationNumber: string) {
  const { actor, isFetching } = useActor();

  return useQuery<SubscriptionStatus>({
    queryKey: ['subscriptionStatus', registrationNumber],
    queryFn: async () => {
      if (!actor) return SubscriptionStatus.inactive;
      return actor.getOfficialProfileSubscriptionStatus(registrationNumber);
    },
    enabled: !!actor && !isFetching && !!registrationNumber,
  });
}

export function useGetSubscriptionExpirationDate(registrationNumber: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Time | null>({
    queryKey: ['subscriptionExpirationDate', registrationNumber],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscriptionExpirationDate(registrationNumber);
    },
    enabled: !!actor && !isFetching && !!registrationNumber,
  });
}

// Activate subscription - calls backend activateOfficialProfile
export function useActivateOfficialProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.activateOfficialProfile(registrationNumber);
    },
    onSuccess: (_, registrationNumber) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus', registrationNumber] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionExpirationDate', registrationNumber] });
      queryClient.invalidateQueries({ queryKey: ['callerOfficialProfileRequest'] });
    },
  });
}

// Deactivate subscription - calls backend deactivateOfficialProfile
export function useDeactivateOfficialProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deactivateOfficialProfile(registrationNumber);
    },
    onSuccess: (_, registrationNumber) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus', registrationNumber] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionExpirationDate', registrationNumber] });
      queryClient.invalidateQueries({ queryKey: ['callerOfficialProfileRequest'] });
    },
  });
}

// Check if Stripe is configured
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isStripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

// Official Response queries
export function useCheckOfficialResponseAuthorization(companyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialResponseAuthorization>({
    queryKey: ['officialResponseAuth', companyId],
    queryFn: async () => {
      if (!actor) return { requestorId: undefined, companyId };
      return actor.checkOfficialResponseAuthorization(companyId);
    },
    enabled: !!actor && !isFetching && !!companyId,
  });
}

export function useGetOfficialResponsesForReview(reviewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialResponse[]>({
    queryKey: ['officialResponses', reviewId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOfficialResponsesForReview(reviewId);
    },
    enabled: !!actor && !isFetching && !!reviewId,
  });
}

export function useGetOfficialResponseForReview(companyId: string, reviewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialResponse | null>({
    queryKey: ['officialResponse', companyId, reviewId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOfficialResponseForReview(companyId, reviewId);
    },
    enabled: !!actor && !isFetching && !!companyId && !!reviewId,
  });
}

export function useGetOfficialResponsesForCompany(companyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialResponse[]>({
    queryKey: ['officialResponsesCompany', companyId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOfficialResponsesForCompany(companyId);
    },
    enabled: !!actor && !isFetching && !!companyId,
  });
}

export function useSubmitOfficialResponse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      reviewId,
      companyId,
      content, 
      evidencePaths, 
      hash,
      isEdit = false
    }: { 
      reviewId: string;
      companyId: string;
      content: string; 
      evidencePaths: string[]; 
      hash: string;
      isEdit?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitOfficialResponse(reviewId, companyId, content, evidencePaths, hash, isEdit);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['officialResponses', variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['officialResponse', variables.companyId, variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['officialResponsesCompany', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['officialResponseEditHistory', variables.companyId, variables.reviewId] });
    },
  });
}

// Official response edit history query
export function useGetOfficialResponseEditHistory(companyId: string, reviewId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<OfficialResponseEdit[]>({
    queryKey: ['officialResponseEditHistory', companyId, reviewId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOfficialResponseEditHistory(companyId, reviewId);
    },
    enabled: !!actor && !isFetching && !!companyId && !!reviewId,
  });
}

// Rating History query
export function useGetRatingHistory(companyId: string, period: TimePeriod) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Time, RatingValues]>>({
    queryKey: ['ratingHistory', companyId, period],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRatingHistory(companyId, period);
    },
    enabled: !!actor && !isFetching && !!companyId,
  });
}

// Suggestion queries
export function useSubmitSuggestion() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitSuggestion(title, content);
    },
  });
}

export function useGetAllSuggestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Suggestion[]>({
    queryKey: ['allSuggestions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuggestions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSuggestionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SuggestionStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSuggestionStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuggestions'] });
    },
  });
}
