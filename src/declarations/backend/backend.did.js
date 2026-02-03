export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const UserProfile = IDL.Record({});
  const Time = IDL.Int;
  const Company = IDL.Record({
    'ownerName' : IDL.Text,
    'averageWorkConditionsRating' : IDL.Float64,
    'city' : IDL.Text,
    'adminEditReason' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'createdAt' : Time,
    'description' : IDL.Text,
    'averageJobSecurityRating' : IDL.Float64,
    'sector' : IDL.Text,
    'averageManagementRating' : IDL.Float64,
    'registrationNumber' : IDL.Text,
    'website' : IDL.Opt(IDL.Text),
    'editedByAdmin' : IDL.Bool,
    'overallRating' : IDL.Float64,
    'averageOtherRating' : IDL.Float64,
    'averagePayRating' : IDL.Float64,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const Review = IDL.Record({
    'managementRating' : IDL.Float64,
    'content' : IDL.Text,
    'workConditionsRating' : IDL.Float64,
    'jobSecurityRating' : IDL.Float64,
    'hash' : IDL.Text,
    'supporters' : IDL.Vec(IDL.Principal),
    'evidencePaths' : IDL.Vec(IDL.Text),
    'payRating' : IDL.Float64,
    'timestamp' : Time,
    'otherRating' : IDL.Float64,
    'reported' : IDL.Bool,
    'companyId' : IDL.Text,
  });
  return IDL.Service({
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'createCompany' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'editCompany' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Text,
        ],
        [],
        [],
      ),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getCompanies' : IDL.Func([], [IDL.Vec(Company)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getReviewsForCompany' : IDL.Func([IDL.Text], [IDL.Vec(Review)], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'reportReview' : IDL.Func([IDL.Text], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'submitReview' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Text),
          IDL.Text,
          IDL.Float64,
          IDL.Float64,
          IDL.Float64,
          IDL.Float64,
          IDL.Float64,
        ],
        [],
        [],
      ),
    'supportReview' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
