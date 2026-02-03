import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Company {
  'ownerName' : string,
  'averageWorkConditionsRating' : number,
  'city' : string,
  'adminEditReason' : [] | [string],
  'name' : string,
  'createdAt' : Time,
  'description' : string,
  'averageJobSecurityRating' : number,
  'sector' : string,
  'averageManagementRating' : number,
  'registrationNumber' : string,
  'website' : [] | [string],
  'editedByAdmin' : boolean,
  'overallRating' : number,
  'averageOtherRating' : number,
  'averagePayRating' : number,
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface Review {
  'managementRating' : number,
  'content' : string,
  'workConditionsRating' : number,
  'jobSecurityRating' : number,
  'hash' : string,
  'supporters' : Array<Principal>,
  'evidencePaths' : Array<string>,
  'payRating' : number,
  'timestamp' : Time,
  'otherRating' : number,
  'reported' : boolean,
  'companyId' : string,
}
export type Time = bigint;
export type UserProfile = {};
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'createCompany' : ActorMethod<
    [string, string, string, string, string, string, [] | [string]],
    undefined
  >,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'editCompany' : ActorMethod<
    [string, string, string, string, string, string, [] | [string], string],
    undefined
  >,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getCompanies' : ActorMethod<[], Array<Company>>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getReviewsForCompany' : ActorMethod<[string], Array<Review>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'reportReview' : ActorMethod<[string], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'submitReview' : ActorMethod<
    [
      string,
      string,
      Array<string>,
      string,
      number,
      number,
      number,
      number,
      number,
    ],
    undefined
  >,
  'supportReview' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
