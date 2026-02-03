import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import Registry "blob-storage/registry";
import Mixin "blob-storage/Mixin";
import UserApproval "user-approval/approval";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";

actor {
    let accessControlState = AccessControl.initState();
    let registry = Registry.new();
    include Mixin(registry);
    let approvalState = UserApproval.initState(accessControlState);

    transient let textMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

    var companies = textMap.empty<Company>();
    var reviews = textMap.empty<Review>();
    var userProfiles = principalMap.empty<UserProfile>();
    var officialProfileRequests = textMap.empty<OfficialProfileRequest>();
    var officialResponses = textMap.empty<OfficialResponse>();
    var fileOwnership = textMap.empty<Principal>();
    var ratingHistory = textMap.empty<[Time.Time]>();
    var ratingValues = textMap.empty<RatingValues>();
    var stripeConfiguration : ?Stripe.StripeConfiguration = null;
    var companyEditHistory = textMap.empty<[CompanyEdit]>();
    var officialResponseEditHistory = textMap.empty<[OfficialResponseEdit]>();
    var reviewReports = textMap.empty<[Principal]>();
    var suggestions = textMap.empty<Suggestion>();
    var suggestionCounter : Nat = 0;

    public type Company = {
        name : Text;
        description : Text;
        createdAt : Time.Time;
        ownerName : Text;
        registrationNumber : Text;
        city : Text;
        sector : Text;
        website : ?Text;
        overallRating : Float;
        averagePayRating : Float;
        averageWorkConditionsRating : Float;
        averageManagementRating : Float;
        averageJobSecurityRating : Float;
        averageOtherRating : Float;
        isOfficialEmployer : Bool;
    };

    public type Review = {
        companyId : Text;
        content : Text;
        evidencePaths : [Text];
        timestamp : Time.Time;
        hash : Text;
        reported : Bool;
        supporters : [Principal];
        payRating : Float;
        workConditionsRating : Float;
        managementRating : Float;
        jobSecurityRating : Float;
        otherRating : Float;
        reportCount : Nat;
    };

    public type UserProfile = {};

    public type SubscriptionPlan = {
        planId : Text;
        priceEur : Nat;
    };

    public type SubscriptionStatus = {
        #inactive;
        #active;
        #expired;
        #cancelled;
    };

    public type PaymentStatus = {
        #none;
        #pending;
        #paid;
        #failed;
    };

    public type Subscription = {
        plan : SubscriptionPlan;
        status : SubscriptionStatus;
        currentPeriodStart : ?Time.Time;
        currentPeriodEnd : ?Time.Time;
        autoRenew : Bool;
        lastPaymentStatus : PaymentStatus;
        lastPaymentAt : ?Time.Time;
    };

    public type OfficialProfileRequest = {
        companyName : Text;
        registrationNumber : Text;
        website : ?Text;
        tradeRegisterLink : Text;
        confirmationDocument : Text;
        requestor : Principal;
        timestamp : Time.Time;
        status : Text;
        approvalTimestamp : ?Time.Time;
        subscription : Subscription;
        rejectionReason : ?Text;
        createdAt : Time.Time;
    };

    public type OfficialResponse = {
        reviewId : Text;
        companyId : Text;
        content : Text;
        evidencePaths : [Text];
        timestamp : Time.Time;
        hash : Text;
        responder : Principal;
        editedAt : ?Time.Time;
    };

    public type OfficialResponseAuthorization = {
        requestorId : ?Principal;
        companyId : Text;
    };

    public type UserContextState = {
        role : AccessControl.UserRole;
        officialProfileStatus : Text;
        rejectedRequest : ?OfficialProfileRequest;
    };

    public type TimePeriod = {
        #days;
        #months;
        #years;
    };

    public type RatingValues = {
        overallRating : Float;
        payRating : Float;
        workConditionsRating : Float;
        managementRating : Float;
        jobSecurityRating : Float;
        otherRating : Float;
    };

    public type CompanyEdit = {
        registrationNumber : Text;
        editor : Principal;
        timestamp : Time.Time;
        reason : Text;
        changes : [ChangedField];
    };

    public type ChangedField = {
        fieldName : Text;
        oldValue : Text;
        newValue : Text;
    };

    public type OfficialResponseEdit = {
        companyId : Text;
        reviewId : Text;
        editor : Principal;
        timestamp : Time.Time;
        reason : Text;
        changes : [ChangedField];
    };

    public type SuggestionStatus = {
        #new;
        #inReview;
        #planned;
        #implemented;
        #rejected;
    };

    public type Suggestion = {
        id : Text;
        title : Text;
        content : Text;
        sender : Text;
        timestamp : Time.Time;
        status : SuggestionStatus;
    };

    // Edit history functions - PUBLIC ACCESS (read-only)
    public query func getOfficialResponseEditHistory(companyId : Text, reviewId : Text) : async [OfficialResponseEdit] {
        switch (textMap.get(officialResponseEditHistory, companyId)) {
            case (null) { [] };
            case (?history) {
                Array.filter<OfficialResponseEdit>(
                    history,
                    func(e : OfficialResponseEdit) : Bool {
                        e.reviewId == reviewId;
                    },
                );
            };
        };
    };

    // Suggestion management functions
    // PUBLIC ACCESS - No authentication required, accessible to everyone including guests
    public shared ({ caller }) func submitSuggestion(title : Text, content : Text) : async () {
        // No authorization check - intentionally allows guests per specification
        let timestamp = Time.now();

        // Generate unique ID using counter to avoid collisions for anonymous users
        suggestionCounter += 1;
        let suggestionId = "suggestion-" # Nat.toText(suggestionCounter) # "-" # debug_show (timestamp);

        let sender : Text = if (Principal.isAnonymous(caller)) {
            "Guest";
        } else {
            Principal.toText(caller);
        };

        let suggestion : Suggestion = {
            id = suggestionId;
            title;
            content;
            sender;
            timestamp;
            status = #new;
        };

        suggestions := textMap.put(suggestions, suggestionId, suggestion);
    };

    // ADMIN ONLY - Only administrators can view all suggestions
    public query ({ caller }) func listSuggestions() : async [Suggestion] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view all suggestions");
        };

        Iter.toArray(textMap.vals(suggestions));
    };

    // ADMIN ONLY - Only administrators can update suggestion status
    public shared ({ caller }) func updateSuggestionStatus(id : Text, newStatus : SuggestionStatus) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update suggestion status");
        };

        // Helper function to get severity level of each status
        func getSeverity(status : SuggestionStatus) : Int {
            switch (status) {
                case (#new) { 0 };
                case (#inReview) { 1 };
                case (#planned) { 2 };
                case (#implemented) { 3 };
                case (#rejected) { 4 };
            };
        };

        switch (textMap.get(suggestions, id)) {
            case (null) {
                Debug.trap("Suggestion not found");
            };
            case (?suggestion) {
                // Allow transition to rejected anytime
                if (newStatus != #rejected) {
                    // For non-rejected transitions, prevent downgrades
                    if (getSeverity(newStatus) < getSeverity(suggestion.status)) {
                        Debug.trap("Cannot downgrade suggestion status. Only upgrades or rejection are allowed.");
                    };
                };

                let updatedSuggestion = {
                    suggestion with
                    status = newStatus;
                };
                suggestions := textMap.put(suggestions, id, updatedSuggestion);
            };
        };
    };

    // Access control functions
    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        // Admin-only check happens inside AccessControl.assignRole
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    // User profile functions - USER ONLY
    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can access profiles");
        };
        principalMap.get(userProfiles, caller);
    };

    // USER OR ADMIN - Can view own profile or admin can view any profile
    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile");
        };
        principalMap.get(userProfiles, user);
    };

    // USER ONLY - Can save own profile
    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    // Approval-based user functions
    public query ({ caller }) func isCallerApproved() : async Bool {
        AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
    };

    // USER ONLY - Request approval
    public shared ({ caller }) func requestApproval() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can request approval");
        };
        UserApproval.requestApproval(approvalState, caller);
    };

    // ADMIN ONLY - Set approval status
    public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.setApproval(approvalState, user, status);
    };

    // ADMIN ONLY - List all approvals
    public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.listApprovals(approvalState);
    };

    // Company management - USER ONLY can create
    public shared ({ caller }) func createCompany(name : Text, description : Text, ownerName : Text, registrationNumber : Text, city : Text, sector : Text, website : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create companies");
        };

        let existingCompanies = Iter.toArray(textMap.vals(companies));
        let duplicate = Array.find<Company>(
            existingCompanies,
            func(c : Company) : Bool {
                c.registrationNumber == registrationNumber;
            },
        );

        switch (duplicate) {
            case (?_) { Debug.trap("Company with this registration number already exists") };
            case (null) {
                let company : Company = {
                    name;
                    description;
                    createdAt = Time.now();
                    ownerName;
                    registrationNumber;
                    city;
                    sector;
                    website;
                    overallRating = 0.0;
                    averagePayRating = 0.0;
                    averageWorkConditionsRating = 0.0;
                    averageManagementRating = 0.0;
                    averageJobSecurityRating = 0.0;
                    averageOtherRating = 0.0;
                    isOfficialEmployer = false;
                };
                companies := textMap.put(companies, registrationNumber, company);
                ratingHistory := textMap.put(ratingHistory, registrationNumber, [Time.now()]);
                ratingValues := textMap.put(ratingValues, registrationNumber, {
                    overallRating = 0.0;
                    payRating = 0.0;
                    workConditionsRating = 0.0;
                    managementRating = 0.0;
                    jobSecurityRating = 0.0;
                    otherRating = 0.0;
                });
            };
        };
    };

    // ADMIN OR APPROVED EMPLOYER - Can edit company
    public shared ({ caller }) func editCompany(registrationNumber : Text, newName : Text, newDescription : Text, newOwnerName : Text, newCity : Text, newSector : Text, newWebsite : ?Text, reason : Text) : async () {

        let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
        let isApprovedEmployer = hasApprovedOfficialProfileForCompany(caller, registrationNumber);

        if (not isAdmin and not isApprovedEmployer) {
            Debug.trap("Unauthorized: Only admins or approved employers can edit companies");
        };

        // Verify company exists before proceeding
        switch (textMap.get(companies, registrationNumber)) {
            case (null) { Debug.trap("Company not found") };
            case (?company) {
                // If caller is approved employer (not admin), verify they own this specific company
                if (isApprovedEmployer and not isAdmin) {
                    if (not hasApprovedOfficialProfileForCompany(caller, registrationNumber)) {
                        Debug.trap("Unauthorized: You can only edit your own company's data");
                    };
                };

                let websiteChange = {
                    fieldName = "website";
                    oldValue = switch (company.website) {
                        case (null) { "" };
                        case (?val) { val };
                    };
                    newValue = switch (newWebsite) {
                        case (null) { "" };
                        case (?val) { val };
                    };
                };

                let changes : [ChangedField] = Array.filter<ChangedField>(
                    [
                        { fieldName = "name"; oldValue = company.name; newValue = newName },
                        { fieldName = "description"; oldValue = company.description; newValue = newDescription },
                        { fieldName = "ownerName"; oldValue = company.ownerName; newValue = newOwnerName },
                        { fieldName = "city"; oldValue = company.city; newValue = newCity },
                        { fieldName = "sector"; oldValue = company.sector; newValue = newSector },
                        websiteChange
                    ],
                    func(change : ChangedField) : Bool {
                        change.oldValue != change.newValue;
                    },
                );

                let companyEdit : CompanyEdit = {
                    registrationNumber;
                    editor = caller;
                    timestamp = Time.now();
                    reason;
                    changes;
                };

                switch (textMap.get(companyEditHistory, registrationNumber)) {
                    case (null) { companyEditHistory := textMap.put(companyEditHistory, registrationNumber, [companyEdit]) };
                    case (?existingHistory) {
                        let updatedHistory = Array.append(existingHistory, [companyEdit]);
                        companyEditHistory := textMap.put(companyEditHistory, registrationNumber, updatedHistory);
                    };
                };

                let updatedCompany : Company = {
                    name = newName;
                    description = newDescription;
                    createdAt = company.createdAt;
                    ownerName = newOwnerName;
                    registrationNumber;
                    city = newCity;
                    sector = newSector;
                    website = newWebsite;
                    overallRating = company.overallRating;
                    averagePayRating = company.averagePayRating;
                    averageWorkConditionsRating = company.averageWorkConditionsRating;
                    averageManagementRating = company.averageManagementRating;
                    averageJobSecurityRating = company.averageJobSecurityRating;
                    averageOtherRating = company.averageOtherRating;
                    isOfficialEmployer = company.isOfficialEmployer;
                };
                companies := textMap.put(companies, registrationNumber, updatedCompany);
            };
        };
    };

    // PUBLIC ACCESS - Anyone can view companies
    public query func getCompanies() : async [Company] {
        Iter.toArray(textMap.vals(companies));
    };

    // PUBLIC ACCESS - Anyone can view company edit history
    public query func getCompanyEditHistory(companyId : Text) : async [CompanyEdit] {
        switch (textMap.get(companyEditHistory, companyId)) {
            case (null) { [] };
            case (?history) { history };
        };
    };

    func validateFileOwnership(caller : Principal, evidencePaths : [Text]) : Bool {
        for (path in evidencePaths.vals()) {
            switch (textMap.get(fileOwnership, path)) {
                case (null) { return false };
                case (?owner) {
                    if (owner != caller) {
                        return false;
                    };
                };
            };
        };
        true;
    };

    // USER ONLY - Submit review
    public shared ({ caller }) func submitReview(companyId : Text, content : Text, evidencePaths : [Text], hash : Text, payRating : Float, workConditionsRating : Float, managementRating : Float, jobSecurityRating : Float, otherRating : Float) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can submit reviews");
        };

        if (evidencePaths.size() > 0 and not validateFileOwnership(caller, evidencePaths)) {
            Debug.trap("Unauthorized: You can only reference files you have uploaded");
        };

        let review : Review = {
            companyId;
            content;
            evidencePaths;
            timestamp = Time.now();
            hash;
            reported = false;
            supporters = [];
            payRating;
            workConditionsRating;
            managementRating;
            jobSecurityRating;
            otherRating;
            reportCount = 0;
        };

        reviews := textMap.put(reviews, hash, review);

        switch (textMap.get(companies, companyId)) {
            case (null) { Debug.trap("Company not found") };
            case (?company) {
                let companyReviews = Iter.toArray(textMap.vals(reviews));
                let filteredReviews = Array.filter<Review>(
                    companyReviews,
                    func(r : Review) : Bool {
                        r.companyId == companyId;
                    },
                );

                let totalReviews = Float.fromInt(Array.size(filteredReviews));

                var sumPay : Float = 0.0;
                var averagePay : Float = 0.0;
                var sumWorkConditions : Float = 0.0;
                var averageWorkConditions : Float = 0.0;
                var sumManagement : Float = 0.0;
                var averageManagement : Float = 0.0;
                var sumJobSecurity : Float = 0.0;
                var averageJobSecurity : Float = 0.0;
                var sumOther : Float = 0.0;
                var averageOther : Float = 0.0;

                if (totalReviews > 0.0) {
                    sumPay := Array.foldLeft<Review, Float>(
                        filteredReviews,
                        0.0,
                        func(acc, r) { acc + r.payRating },
                    );
                    averagePay := sumPay / totalReviews;

                    sumWorkConditions := Array.foldLeft<Review, Float>(
                        filteredReviews,
                        0.0,
                        func(acc, r) { acc + r.workConditionsRating },
                    );
                    averageWorkConditions := sumWorkConditions / totalReviews;

                    sumManagement := Array.foldLeft<Review, Float>(
                        filteredReviews,
                        0.0,
                        func(acc, r) { acc + r.managementRating },
                    );
                    averageManagement := sumManagement / totalReviews;

                    sumJobSecurity := Array.foldLeft<Review, Float>(
                        filteredReviews,
                        0.0,
                        func(acc, r) { acc + r.jobSecurityRating },
                    );
                    averageJobSecurity := sumJobSecurity / totalReviews;

                    sumOther := Array.foldLeft<Review, Float>(
                        filteredReviews,
                        0.0,
                        func(acc, r) { acc + r.otherRating },
                    );
                    averageOther := sumOther / totalReviews;
                };

                let updatedCompany = {
                    company with
                    overallRating = if (totalReviews == 0.0) 0.0 else (sumPay + sumWorkConditions + sumManagement + sumJobSecurity + sumOther) / (totalReviews * 5.0);
                    averagePayRating = averagePay;
                    averageWorkConditionsRating = averageWorkConditions;
                    averageManagementRating = averageManagement;
                    averageJobSecurityRating = averageJobSecurity;
                    averageOtherRating = averageOther;

                };
                companies := textMap.put(companies, companyId, updatedCompany);
            };
        };
    };

    // PUBLIC ACCESS - Anyone can view reviews
    public query func getReviewsForCompany(companyId : Text) : async [Review] {
        let allReviews = Iter.toArray(textMap.vals(reviews));
        Array.filter(
            allReviews,
            func(r : Review) : Bool {
                r.companyId == companyId;
            },
        );
    };

    // USER ONLY - Report review
    public shared ({ caller }) func reportReview(hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can report reviews");
        };

        switch (textMap.get(reviews, hash)) {
            case (null) { Debug.trap("Review not found") };
            case (?review) {
                let alreadyReportedReviewers = textMap.get(reviewReports, hash);

                switch (alreadyReportedReviewers) {
                    case (null) {
                        reviewReports := textMap.put(reviewReports, hash, [caller]);
                        let updatedReview = {
                            review with
                            reported = true;
                            reportCount = 1;
                        };

                        reviews := textMap.put(reviews, hash, updatedReview);
                    };
                    case (?reviewers) {
                        let alreadyReported = Array.find<Principal>(
                            reviewers,
                            func(p : Principal) : Bool {
                                p == caller;
                            },
                        );

                        switch (alreadyReported) {
                            case (?_) {
                                return;
                            };
                            case (null) {
                                let updatedReviewers = Array.append(reviewers, [caller]);
                                reviewReports := textMap.put(reviewReports, hash, updatedReviewers);

                                let updatedReview = {
                                    review with
                                    reported = true;
                                    reportCount = updatedReviewers.size();
                                };
                                reviews := textMap.put(reviews, hash, updatedReview);

                            };
                        };
                    };
                };
            };
        };
    };

    // USER ONLY - Support review
    public shared ({ caller }) func supportReview(hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can support reviews");
        };

        switch (textMap.get(reviews, hash)) {
            case (null) { Debug.trap("Review not found") };
            case (?review) {
                let alreadySupported = Array.find<Principal>(
                    review.supporters,
                    func(p : Principal) : Bool {
                        p == caller;
                    },
                );

                switch (alreadySupported) {
                    case (?_) {
                        return;
                    };
                    case (null) {
                        let updatedReview = {
                            review with supporters = Array.append(review.supporters, [caller])
                        };
                        reviews := textMap.put(reviews, hash, updatedReview);
                    };
                };
            };
        };
    };

    // PUBLIC ACCESS - Anyone can view report count
    public query func getReportCount(hash : Text) : async Nat {
        switch (textMap.get(reviewReports, hash)) {
            case (null) { 0 };
            case (?reviewers) { reviewers.size() };
        };
    };

    // Official profile request management - USER ONLY
    public shared ({ caller }) func submitOfficialProfileRequest(companyName : Text, registrationNumber : Text, website : ?Text, tradeRegisterLink : Text, confirmationDocument : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can submit official profile requests");
        };

        var latestRequestKey : ?Text = null;
        var latestRequestTime : Time.Time = 0;

        for ((requestKey, request) in textMap.entries(officialProfileRequests)) {
            if (request.requestor == caller and (request.status == "pending" or request.status == "approved" or request.status == "rejected")) {
                switch (latestRequestKey) {
                    case (null) {
                        latestRequestKey := ?requestKey;
                        latestRequestTime := request.timestamp;
                    };
                    case (?_) {
                        if (request.timestamp > latestRequestTime) {
                            latestRequestKey := ?requestKey;
                            latestRequestTime := request.timestamp;
                        };
                    };
                };
            };
        };

        switch (latestRequestKey) {
            case (?requestKey) {
                switch (textMap.get(officialProfileRequests, requestKey)) {
                    case (null) {};
                    case (?existingRequest) {
                        debugPrint("Existing request found with status: " # existingRequest.status);
                        switch (existingRequest.status) {
                            case ("pending") {
                                Debug.trap("You already have a pending request");
                            };
                            case ("approved") {
                                Debug.trap("You already have an approved official profile");
                            };
                            case ("rejected") {
                                // Allow new submission after rejection
                            };
                            case (_) {
                                // handle other statuses here if necessary
                            };
                        };
                    };
                };
            };
            case (null) {};
        };

        let companyExists = switch (textMap.get(companies, registrationNumber)) {
            case (null) { false };
            case (?_) { true };
        };

        if (not companyExists) {
            Debug.trap("Не е намерена фирма с въведения ЕИК. Моля, проверете данните.");
        };

        let requestKey = Principal.toText(caller) # "-" # debug_show (Time.now());

        let subscription : Subscription = {
            plan = {
                planId = "official_profile_monthly";
                priceEur = 50;
            };
            status = #inactive;
            currentPeriodStart = null;
            currentPeriodEnd = null;
            autoRenew = false;
            lastPaymentStatus = #none;
            lastPaymentAt = null;
        };

        let request : OfficialProfileRequest = {
            companyName;
            registrationNumber;
            website;
            tradeRegisterLink;
            confirmationDocument;
            requestor = caller;
            timestamp = Time.now();
            status = "pending";
            approvalTimestamp = null;
            subscription;
            rejectionReason = null;
            createdAt = Time.now();
        };
        officialProfileRequests := textMap.put(officialProfileRequests, requestKey, request);

    };

    func debugPrint(message : Text) {
        if (message != "") {
            Debug.print(message);
        };
    };

    // ADMIN ONLY - Update official profile request status
    public shared ({ caller }) func updateOfficialProfileRequestStatus(requestKey : Text, newStatus : Text, rejectionReason : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update official profile request status");
        };

        if (requestKey == "") {
            Debug.trap("Invalid request: requestKey cannot be empty");
        };

        if (newStatus != "approved" and newStatus != "rejected" and newStatus != "pending") {
            Debug.trap("Invalid status: must be 'approved', 'rejected', or 'pending'");
        };

        switch (textMap.get(officialProfileRequests, requestKey)) {
            case (null) {
                Debug.trap("Заявката вече е обработена или не съществува");
            };
            case (?request) {
                if (request.status != "pending") {
                    Debug.trap("Заявката вече е обработена или не съществува");
                };

                switch (newStatus) {
                    case ("approved") {
                        var hasDuplicate = false;
                        for ((key, officialProfileRequest) in textMap.entries(officialProfileRequests)) {
                            if (officialProfileRequest.registrationNumber == request.registrationNumber and officialProfileRequest.status == "approved" and key != requestKey) {
                                hasDuplicate := true;
                            };
                        };

                        if (hasDuplicate) {
                            Debug.trap("Вече съществува активен официален профил за тази фирма (ЕИК).");
                        };

                        let updatedRequest = {
                            request with
                            status = "approved";
                            approvalTimestamp = null;
                            rejectionReason = null;
                        };
                        officialProfileRequests := textMap.put(officialProfileRequests, requestKey, updatedRequest);
                    };
                    case ("rejected") {
                        let updatedRequest = {
                            request with
                            status = "rejected";
                            rejectionReason;
                        };
                        officialProfileRequests := textMap.put(officialProfileRequests, requestKey, updatedRequest);
                    };
                    case ("pending") {
                        let updatedRequest = {
                            request with
                            status = "pending";
                            rejectionReason = null;
                        };
                        officialProfileRequests := textMap.put(officialProfileRequests, requestKey, updatedRequest);
                    };
                    case (_) {
                        Debug.trap("Invalid status value");
                    };
                };
            };
        };
    };

    // USER ONLY - Get own official profile request
    public query ({ caller }) func getCallerOfficialProfileRequest() : async ?OfficialProfileRequest {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            return null;
        };

        var latestRequestKey : ?Text = null;
        var latestRequestTime : Time.Time = 0;

        for ((requestKey, request) in textMap.entries(officialProfileRequests)) {
            if (request.requestor == caller and (request.status == "pending" or request.status == "approved" or request.status == "rejected")) {
                switch (latestRequestKey) {
                    case (null) {
                        latestRequestKey := ?requestKey;
                        latestRequestTime := request.timestamp;
                    };
                    case (?_) {
                        if (request.timestamp > latestRequestTime) {
                            latestRequestKey := ?requestKey;
                            latestRequestTime := request.timestamp;
                        };
                    };
                };
            };
        };

        switch (latestRequestKey) {
            case (null) { null };
            case (?requestKey) {
                switch (textMap.get(officialProfileRequests, requestKey)) {
                    case (null) { null };
                    case (?request) { ?request };
                };
            };
        };
    };

    // ADMIN ONLY - Get all official profile requests with filter
    public query ({ caller }) func getOfficialProfileRequests(filter : ?Text) : async [(Text, OfficialProfileRequest)] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view all official profile requests");
        };

        let entries = Iter.toArray(textMap.entries(officialProfileRequests));

        switch (filter) {
            case (?filterValue) {
                Array.filter<(Text, OfficialProfileRequest)>(
                    entries,
                    func(entry : (Text, OfficialProfileRequest)) : Bool {
                        entry.1.status == filterValue
                    },
                );
            };
            case (null) { entries };
        };
    };

    // USER ONLY - Deactivate own official profile
    public shared ({ caller }) func deactivateOfficialProfile(registrationNumber : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only registered users can deactivate official profiles");
        };

        let allRequests = Iter.toArray(textMap.vals(officialProfileRequests));
        let userRequest = Array.find<OfficialProfileRequest>(
            allRequests,
            func(r : OfficialProfileRequest) : Bool {
                r.registrationNumber == registrationNumber and r.requestor == caller
            },
        );

        switch (userRequest) {
            case (null) { Debug.trap("Official profile request not found for this company") };
            case (?request) {
                // Verify ownership
                if (request.requestor != caller) {
                    Debug.trap("Unauthorized: You can only deactivate your own official profile");
                };

                if (request.status != "approved") {
                    Debug.trap("Unauthorized: Cannot deactivate - official profile is not in \"approved\" status");
                };

                let matchingEntry = Array.find<(Text, OfficialProfileRequest)>(
                    Iter.toArray(textMap.entries(officialProfileRequests)),
                    func(e : (Text, OfficialProfileRequest)) : Bool {
                        e.1.registrationNumber == registrationNumber and e.1.requestor == caller
                    },
                );

                switch (matchingEntry) {
                    case (null) { Debug.trap("Internal error: Request key not found") };
                    case (?e) {
                        let updatedSubscription : Subscription = {
                            plan = request.subscription.plan;
                            status = #inactive;
                            currentPeriodStart = null;
                            currentPeriodEnd = null;
                            autoRenew = false;
                            lastPaymentStatus = #none;
                            lastPaymentAt = request.subscription.lastPaymentAt;
                        };

                        let updatedRequest = {
                            request with
                            subscription = updatedSubscription;
                        };
                        officialProfileRequests := textMap.put(officialProfileRequests, e.0, updatedRequest);
                    };
                };
            };
        };
    };

    // USER ONLY - Activate own official profile
    public shared ({ caller }) func activateOfficialProfile(registrationNumber : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only registered users can activate official profiles");
        };

        let allRequests = Iter.toArray(textMap.vals(officialProfileRequests));
        let userRequest = Array.find<OfficialProfileRequest>(
            allRequests,
            func(r : OfficialProfileRequest) : Bool {
                r.requestor == caller and r.registrationNumber == registrationNumber
            },
        );

        switch (userRequest) {
            case (null) { Debug.trap("Official profile request not found for this company") };
            case (?request) {
                // Verify ownership
                if (request.requestor != caller) {
                    Debug.trap("Unauthorized: You can only activate your own official profile");
                };

                if (request.status != "approved") {
                    Debug.trap("Cannot activate - official profile is not `approved` status");
                };

                let matchingEntry = Array.find<(Text, OfficialProfileRequest)>(
                    Iter.toArray(textMap.entries(officialProfileRequests)),
                    func(e : (Text, OfficialProfileRequest)) : Bool {
                        e.1.registrationNumber == registrationNumber and e.1.requestor == caller
                    },
                );

                switch (matchingEntry) {
                    case (null) { Debug.trap("Internal error: Request key not found") };
                    case (?e) {
                        let now = Time.now();
                        let updatedSubscription : Subscription = {
                            plan = request.subscription.plan;
                            status = #active;
                            currentPeriodStart = ?now;
                            currentPeriodEnd = ?(now + (30 * 24 * 60 * 60 * 1_000_000_000));
                            autoRenew = true;
                            lastPaymentStatus = #paid;
                            lastPaymentAt = ?now;
                        };

                        let updatedRequest = {
                            request with
                            subscription = updatedSubscription;
                        };
                        officialProfileRequests := textMap.put(officialProfileRequests, e.0, updatedRequest);
                    };
                };
            };
        };
    };

    // PUBLIC ACCESS - Anyone can check subscription status
    public query func getOfficialProfileSubscriptionStatus(registrationNumber : Text) : async SubscriptionStatus {
        let allRequests = Iter.toArray(textMap.vals(officialProfileRequests));
        let matchingRequest = Array.find<OfficialProfileRequest>(
            allRequests,
            func(r : OfficialProfileRequest) : Bool {
                r.registrationNumber == registrationNumber and r.status == "approved"
            },
        );

        switch (matchingRequest) {
            case (null) { #inactive };
            case (?request) {
                let now = Time.now();
                let subscription = request.subscription;

                let isExpired = switch (subscription.currentPeriodEnd) {
                    case (null) { false };
                    case (?periodEnd) { now > periodEnd };
                };

                if (not subscription.autoRenew and isExpired) {
                    #expired;
                } else {
                    subscription.status;
                };
            };
        };
    };

    // PUBLIC ACCESS - Anyone can check subscription expiration date
    public query func getSubscriptionExpirationDate(registrationNumber : Text) : async ?Time.Time {
        let allRequests = Iter.toArray(textMap.vals(officialProfileRequests));
        let matchingRequest = Array.find<OfficialProfileRequest>(
            allRequests,
            func(r : OfficialProfileRequest) : Bool {
                r.registrationNumber == registrationNumber and r.status == "approved"
            },
        );

        switch (matchingRequest) {
            case (null) { null };
            case (?request) {
                switch (request.subscription.status) {
                    case (#active) {
                        request.subscription.currentPeriodEnd;
                    };
                    case (_) { null };
                };
            };
        };
    };

    // PUBLIC ACCESS - Anyone can get user context state (but only meaningful for authenticated users)
    public query ({ caller }) func getUserContextState() : async UserContextState {
        let role = AccessControl.getUserRole(accessControlState, caller);
        var latestRequest : ?OfficialProfileRequest = null;

        if (role == #user) {
            for (request in textMap.vals(officialProfileRequests)) {
                if (request.requestor == caller and (request.status == "pending" or request.status == "approved" or request.status == "rejected")) {
                    switch (latestRequest) {
                        case (null) {
                            latestRequest := ?request;
                        };
                        case (?existing) {
                            if (request.timestamp > existing.timestamp) {
                                latestRequest := ?request;
                            };
                        };
                    };
                };
            };
        };

        let officialProfileStatus = switch (latestRequest) {
            case (?request) { request.status };
            case (null) { "none" };
        };

        let rejectedRequest = switch (latestRequest) {
            case (?request) {
                if (request.status == "rejected") { ?request } else { null };
            };
            case (null) { null };
        };

        {
            role;
            officialProfileStatus;
            rejectedRequest;
        };
    };

    // USER ONLY - Register file reference (ownership claim)
    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only registered users can register file references");
        };
        fileOwnership := textMap.put(fileOwnership, path, caller);
        Registry.add(registry, path, hash);
    };

    // PUBLIC ACCESS - Anyone can get file reference
    public query func getFileReference(path : Text) : async Registry.FileReference {
        Registry.get(registry, path);
    };

    // PUBLIC ACCESS - Anyone can list file references
    public query func listFileReferences() : async [Registry.FileReference] {
        Registry.list(registry);
    };

    // ADMIN ONLY - Delete file reference
    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete file references");
        };
        Registry.remove(registry, path);
        fileOwnership := textMap.delete(fileOwnership, path);
    };

    func hasApprovedOfficialProfileForCompany(requestor : Principal, companyId : Text) : Bool {
        let allRequests = Iter.toArray(textMap.vals(officialProfileRequests));
        let approvedRequest = Array.find<OfficialProfileRequest>(
            allRequests,
            func(request : OfficialProfileRequest) : Bool {
                request.requestor == requestor and request.status == "approved" and request.registrationNumber == companyId;
            },
        );

        switch (approvedRequest) {
            case (null) { false };
            case (?_) { true };
        };
    };

    func findExistingOfficialResponse(companyId : Text, reviewId : Text) : ?OfficialResponse {
        let allResponses = Iter.toArray(textMap.vals(officialResponses));
        Array.find<OfficialResponse>(
            allResponses,
            func(response : OfficialResponse) : Bool {
                response.companyId == companyId and response.reviewId == reviewId
            },
        );
    };

    func generateOfficialResponseKey(companyId : Text, reviewId : Text) : Text {
        companyId # "-" # reviewId;
    };

    // USER ONLY - Submit official response (requires approved official profile)
    public shared ({ caller }) func submitOfficialResponse(reviewId : Text, companyId : Text, content : Text, evidencePaths : [Text], hash : Text, isEdit : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only registered users can submit official responses");
        };

        if (not hasApprovedOfficialProfileForCompany(caller, companyId)) {
            Debug.trap("Unauthorized: You do not have an approved official profile for this company");
        };

        if (evidencePaths.size() > 0 and not validateFileOwnership(caller, evidencePaths)) {
            Debug.trap("Unauthorized: You can only reference files you have uploaded");
        };

        switch (textMap.get(reviews, reviewId)) {
            case (null) { Debug.trap("Review not found") };
            case (?review) {
                if (review.companyId != companyId) {
                    Debug.trap("Review does not belong to the specified company");
                };

                let existingResponse = findExistingOfficialResponse(companyId, reviewId);

                // Only record edit history for actual edits (not initial creation)
                if (isEdit) {
                    let responseChange = {
                        fieldName = "content";
                        oldValue = switch (existingResponse) {
                            case (null) { "" };
                            case (?response) { response.content };
                        };
                        newValue = content;
                    };

                    let evidencePathChange = {
                        fieldName = "evidencePaths";
                        oldValue = switch (existingResponse) {
                            case (null) { "" };
                            case (?response) {
                                let oldPaths = Array.map<Text, Text>(
                                    response.evidencePaths,
                                    func(path : Text) : Text {
                                        path;
                                    },
                                );
                                let oldPathsString = Array.foldLeft<Text, Text>(
                                    oldPaths,
                                    "",
                                    func(acc : Text, path : Text) : Text {
                                        if (acc == "") { path } else { acc # ", " # path };
                                    },
                                );
                                oldPathsString;
                            };
                        };
                        newValue = Array.foldLeft<Text, Text>(
                            evidencePaths,
                            "",
                            func(acc : Text, path : Text) : Text {
                                if (acc == "") { path } else { acc # ", " # path };
                            },
                        );
                    };

                    let changes : [ChangedField] = Array.filter<ChangedField>(
                        [responseChange, evidencePathChange],
                        func(change : ChangedField) : Bool {
                            change.oldValue != change.newValue;
                        },
                    );

                    if (changes.size() > 0) {
                        let responseEdit : OfficialResponseEdit = {
                            companyId;
                            reviewId;
                            editor = caller;
                            timestamp = Time.now();
                            reason = "Edited response";
                            changes;
                        };

                        switch (textMap.get(officialResponseEditHistory, companyId)) {
                            case (null) {
                                officialResponseEditHistory := textMap.put(officialResponseEditHistory, companyId, [responseEdit]);
                            };
                            case (?existingHistory) {
                                let updatedHistory = Array.append(existingHistory, [responseEdit]);
                                officialResponseEditHistory := textMap.put(officialResponseEditHistory, companyId, updatedHistory);
                            };
                        };
                    };
                };

                switch (existingResponse) {
                    case (null) {
                        if (isEdit) {
                            Debug.trap("Cannot edit: No existing official response found for this review");
                        };

                        let responseKey = generateOfficialResponseKey(companyId, reviewId);
                        let response : OfficialResponse = {
                            reviewId;
                            companyId;
                            content;
                            evidencePaths;
                            timestamp = Time.now();
                            hash;
                            responder = caller;
                            editedAt = null;
                        };
                        officialResponses := textMap.put(officialResponses, responseKey, response);
                    };
                    case (?response) {
                        if (response.responder != caller) {
                            Debug.trap("Unauthorized: You can only edit your own official responses");
                        };

                        if (not isEdit) {
                            Debug.trap("An official response already exists for this review from this company");
                        };

                        let responseKey = generateOfficialResponseKey(companyId, reviewId);
                        let editedResponse : OfficialResponse = {
                            reviewId;
                            companyId;
                            content;
                            evidencePaths;
                            timestamp = response.timestamp;
                            hash;
                            responder = response.responder;
                            editedAt = ?Time.now();
                        };
                        officialResponses := textMap.put(officialResponses, responseKey, editedResponse);
                    };
                };
            };
        };
    };

    // USER ONLY - Check official response authorization
    public query ({ caller }) func checkOfficialResponseAuthorization(companyId : Text) : async OfficialResponseAuthorization {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            return { requestorId = null; companyId };
        };

        if (hasApprovedOfficialProfileForCompany(caller, companyId)) {
            { requestorId = ?caller; companyId };
        } else {
            { requestorId = null; companyId };
        };
    };

    // PUBLIC ACCESS - Anyone can view official responses
    public query func getOfficialResponsesForCompany(companyId : Text) : async [OfficialResponse] {
        let allResponses = Iter.toArray(textMap.vals(officialResponses));
        Array.filter(
            allResponses,
            func(r : OfficialResponse) : Bool {
                r.companyId == companyId;
            },
        );
    };

    // PUBLIC ACCESS - Anyone can view official responses for review
    public query func getOfficialResponsesForReview(reviewId : Text) : async [OfficialResponse] {
        let allResponses = Iter.toArray(textMap.vals(officialResponses));
        Array.filter(
            allResponses,
            func(r : OfficialResponse) : Bool {
                r.reviewId == reviewId;
            },
        );
    };

    // PUBLIC ACCESS - Anyone can check if official response exists
    public query ({ caller }) func hasOfficialResponseForReview(companyId : Text, reviewId : Text) : async Bool {
        switch (findExistingOfficialResponse(companyId, reviewId)) {
            case (null) { false };
            case (?_) { true };
        };
    };

    // PUBLIC ACCESS - Anyone can get official response for review
    public query ({ caller }) func getOfficialResponseForReview(companyId : Text, reviewId : Text) : async ?OfficialResponse {
        findExistingOfficialResponse(companyId, reviewId);
    };

    // PUBLIC ACCESS - Anyone can view rating history
    public query func getRatingHistory(companyId : Text, period : TimePeriod) : async [(Time.Time, RatingValues)] {
        let currentTime = Time.now();
        let periodStart = switch (period) {
            case (#days) { currentTime - 30 * 24 * 60 * 60 * 1_000_000_000 };
            case (#months) { currentTime - 12 * 30 * 24 * 60 * 60 * 1_000_000_000 };
            case (#years) { currentTime - 5 * 365 * 24 * 60 * 60 * 1_000_000_000 };
        };

        switch (textMap.get(ratingHistory, companyId)) {
            case (null) { [] };
            case (?timestamps) {
                let filteredTimestamps = Array.filter<Time.Time>(
                    timestamps,
                    func(timestamp : Time.Time) : Bool {
                        timestamp >= periodStart
                    },
                );

                Array.map<Time.Time, (Time.Time, RatingValues)>(
                    filteredTimestamps,
                    func(timestamp : Time.Time) : (Time.Time, RatingValues) {
                        switch (textMap.get(ratingValues, companyId)) {
                            case (null) {
                                (
                                    timestamp,
                                    {
                                        overallRating = 0.0;
                                        payRating = 0.0;
                                        workConditionsRating = 0.0;
                                        managementRating = 0.0;
                                        jobSecurityRating = 0.0;
                                        otherRating = 0.0;
                                    },
                                );
                            };
                            case (?values) {
                                (timestamp, values);
                            };
                        };
                    },
                );
            };
        };
    };

    func updateRatingHistoryOnEdit(companyId : Text, newRatingValues : RatingValues) {
        let currentTime = Time.now();

        switch (textMap.get(ratingHistory, companyId)) {
            case (null) {
                ratingHistory := textMap.put(ratingHistory, companyId, [currentTime]);
            };
            case (?timestamps) {
                ratingHistory := textMap.put(ratingHistory, companyId, Array.append(timestamps, [currentTime]));
            };
        };

        ratingValues := textMap.put(ratingValues, companyId, newRatingValues);
    };

    // ADMIN ONLY - Update company ratings
    public shared ({ caller }) func updateCompanyRatings(companyId : Text, newRatings : RatingValues) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update company ratings");
        };
        switch (textMap.get(companies, companyId)) {
            case (null) { Debug.trap("Company not found") };
            case (?company) {
                updateRatingHistoryOnEdit(companyId, newRatings);
            };
        };
    };

    // PUBLIC ACCESS - Anyone can check if Stripe is configured
    public query func isStripeConfigured() : async Bool {
        switch (stripeConfiguration) {
            case (null) { false };
            case (?_) { true };
        };
    };

    // ADMIN ONLY - Set Stripe configuration
    public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        stripeConfiguration := ?config;
    };

    func getStripeConfiguration() : Stripe.StripeConfiguration {
        switch (stripeConfiguration) {
            case (null) { Debug.trap("Stripe needs to be first configured") };
            case (?config) { config };
        };
    };

    // PUBLIC ACCESS - Anyone can get Stripe session status
    public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
        await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
    };

    // USER ONLY - Create checkout session
    public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create checkout sessions");
        };
        await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    };

    // PUBLIC ACCESS - Transform function for HTTP outcalls
    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };
};
