import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserContextState {
    role: UserRole;
    rejectedRequest?: OfficialProfileRequest;
    officialProfileStatus: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Suggestion {
    id: string;
    status: SuggestionStatus;
    title: string;
    content: string;
    sender: string;
    timestamp: Time;
}
export interface Subscription {
    status: SubscriptionStatus;
    currentPeriodStart?: Time;
    lastPaymentStatus: PaymentStatus;
    plan: SubscriptionPlan;
    currentPeriodEnd?: Time;
    lastPaymentAt?: Time;
    autoRenew: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface CompanyEdit {
    editor: Principal;
    registrationNumber: string;
    timestamp: Time;
    changes: Array<ChangedField>;
    reason: string;
}
export interface SubscriptionPlan {
    planId: string;
    priceEur: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface FileReference {
    hash: string;
    path: string;
}
export interface Review {
    managementRating: number;
    content: string;
    reportCount: bigint;
    workConditionsRating: number;
    jobSecurityRating: number;
    hash: string;
    supporters: Array<Principal>;
    evidencePaths: Array<string>;
    payRating: number;
    timestamp: Time;
    otherRating: number;
    reported: boolean;
    companyId: string;
}
export interface OfficialResponse {
    content: string;
    responder: Principal;
    hash: string;
    evidencePaths: Array<string>;
    timestamp: Time;
    reviewId: string;
    editedAt?: Time;
    companyId: string;
}
export interface RatingValues {
    managementRating: number;
    workConditionsRating: number;
    jobSecurityRating: number;
    payRating: number;
    overallRating: number;
    otherRating: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Company {
    ownerName: string;
    averageWorkConditionsRating: number;
    city: string;
    name: string;
    createdAt: Time;
    description: string;
    averageJobSecurityRating: number;
    sector: string;
    averageManagementRating: number;
    registrationNumber: string;
    website?: string;
    overallRating: number;
    averageOtherRating: number;
    averagePayRating: number;
    isOfficialEmployer: boolean;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface OfficialResponseAuthorization {
    requestorId?: Principal;
    companyId: string;
}
export interface OfficialResponseEdit {
    editor: Principal;
    timestamp: Time;
    reviewId: string;
    changes: Array<ChangedField>;
    reason: string;
    companyId: string;
}
export interface ChangedField {
    oldValue: string;
    newValue: string;
    fieldName: string;
}
export interface UserProfile {
}
export interface OfficialProfileRequest {
    status: string;
    requestor: Principal;
    subscription: Subscription;
    createdAt: Time;
    rejectionReason?: string;
    confirmationDocument: string;
    approvalTimestamp?: Time;
    registrationNumber: string;
    website?: string;
    tradeRegisterLink: string;
    timestamp: Time;
    companyName: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum PaymentStatus {
    pending = "pending",
    none = "none",
    paid = "paid",
    failed = "failed"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    expired = "expired",
    inactive = "inactive"
}
export enum SuggestionStatus {
    new_ = "new",
    planned = "planned",
    inReview = "inReview",
    implemented = "implemented",
    rejected = "rejected"
}
export enum TimePeriod {
    days = "days",
    months = "months",
    years = "years"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateOfficialProfile(registrationNumber: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkOfficialResponseAuthorization(companyId: string): Promise<OfficialResponseAuthorization>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCompany(name: string, description: string, ownerName: string, registrationNumber: string, city: string, sector: string, website: string | null): Promise<void>;
    deactivateOfficialProfile(registrationNumber: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    editCompany(registrationNumber: string, newName: string, newDescription: string, newOwnerName: string, newCity: string, newSector: string, newWebsite: string | null, reason: string): Promise<void>;
    getCallerOfficialProfileRequest(): Promise<OfficialProfileRequest | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanies(): Promise<Array<Company>>;
    getCompanyEditHistory(companyId: string): Promise<Array<CompanyEdit>>;
    getFileReference(path: string): Promise<FileReference>;
    getOfficialProfileRequests(filter: string | null): Promise<Array<[string, OfficialProfileRequest]>>;
    getOfficialProfileSubscriptionStatus(registrationNumber: string): Promise<SubscriptionStatus>;
    getOfficialResponseEditHistory(companyId: string, reviewId: string): Promise<Array<OfficialResponseEdit>>;
    getOfficialResponseForReview(companyId: string, reviewId: string): Promise<OfficialResponse | null>;
    getOfficialResponsesForCompany(companyId: string): Promise<Array<OfficialResponse>>;
    getOfficialResponsesForReview(reviewId: string): Promise<Array<OfficialResponse>>;
    getRatingHistory(companyId: string, period: TimePeriod): Promise<Array<[Time, RatingValues]>>;
    getReportCount(hash: string): Promise<bigint>;
    getReviewsForCompany(companyId: string): Promise<Array<Review>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscriptionExpirationDate(registrationNumber: string): Promise<Time | null>;
    getUserContextState(): Promise<UserContextState>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasOfficialResponseForReview(companyId: string, reviewId: string): Promise<boolean>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listFileReferences(): Promise<Array<FileReference>>;
    listSuggestions(): Promise<Array<Suggestion>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    reportReview(hash: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitOfficialProfileRequest(companyName: string, registrationNumber: string, website: string | null, tradeRegisterLink: string, confirmationDocument: string): Promise<void>;
    submitOfficialResponse(reviewId: string, companyId: string, content: string, evidencePaths: Array<string>, hash: string, isEdit: boolean): Promise<void>;
    submitReview(companyId: string, content: string, evidencePaths: Array<string>, hash: string, payRating: number, workConditionsRating: number, managementRating: number, jobSecurityRating: number, otherRating: number): Promise<void>;
    submitSuggestion(title: string, content: string): Promise<void>;
    supportReview(hash: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCompanyRatings(companyId: string, newRatings: RatingValues): Promise<void>;
    updateOfficialProfileRequestStatus(requestKey: string, newStatus: string, rejectionReason: string | null): Promise<void>;
    updateSuggestionStatus(id: string, newStatus: SuggestionStatus): Promise<void>;
}
