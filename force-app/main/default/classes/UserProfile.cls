public with sharing class UserProfile {
    @AuraEnabled(cacheable=true)
    public static wrapperToLWC getUserData() {
        List<Id> cdId = new List<Id>();

        //Retrieve Account Id attached the current Community User
        User currentUser = [SELECT Contact.AccountId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];

        //Retrieve Account (and Primary Billing Contact information) associated with User
        Account currentUserAccount = [
            SELECT
                Id,
                Name,
                Payment_Methods_Accepted__c,
                Year_company_established__c,
                Website,
                Primary_Billing_Contact__r.Name,
                Primary_Billing_Contact__r.Phone,
                Primary_Billing_Contact__r.Email,
                Primary_Billing_Contact__r.Id,
                OwnerId,
                (
                    SELECT
                        Partner_Services__c.Services_Offered__c,
                        Partner_Services__c.Rate_Structure__c,
                        Partner_Services__c.Flat_Rate__c,
                        Partner_Services__c.Flat_Rate_Max__c,
                        Partner_Services__c.Number_of_Bedrooms__c,
                        Partner_Services__c.Not_Serviced__c
                    FROM Partner_Services__r
                    ORDER BY Partner_Services__c.Services_Offered__c, Partner_Services__c.Number_of_Bedrooms__c
                )
            FROM Account
            WHERE Id = :currentUser.Contact.AccountId
            LIMIT 1
        ];

        //Retrieve Photo from the User account of the primary billing contact
        User billingUser = [
            SELECT FullPhotoUrl, SmallPhotoUrl
            FROM User
            WHERE ContactId = :currentUserAccount.Primary_Billing_Contact__r.Id
            LIMIT 1
        ];

        for (ContentDocumentLink cdl : [
            SELECT ContentDocumentId, LinkedEntityId
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :currentUserAccount.Id
        ]) {
            cdId.add(cdl.contentDocumentId);
        }

        Map<Id, ContentVersion> files = new Map<Id, ContentVersion>(
            [
                SELECT Id, Title, FileExtension, AccountFileType__c
                FROM ContentVersion
                WHERE
                    ContentDocumentId IN :cdId
                    AND isDeleted__c = false
                    AND isLatest = true
                    AND (AccountFileType__c = 'Account Image'
                    OR AccountFileType__c = 'Brochure File')
            ]
        );

        List<ContentDistribution> fileUrls = UserProfile.getContentDistribution(new List<Id>(files.keySet()));

        //Wrap everything in a wrapper object to pass to myBuss Lightning Web Component
        return new wrapperToLWC(currentUserAccount, billingUser, files, fileUrls);
    }

    public class wrapperToLWC {
        @AuraEnabled
        public User objUser;
        @AuraEnabled
        public Account objAcc;
        @AuraEnabled
        public Map<Id, ContentVersion> files;
        @AuraEnabled
        public List<ContentDistribution> fileUrls;

        public wrapperToLWC(Account acc, User use, Map<Id, ContentVersion> files, List<ContentDistribution> fileUrls) {
            this.objAcc = acc;
            this.objUser = use;
            this.files = files;
            this.fileUrls = fileUrls;
        }
    }

    // !FILE METHODS
    @AuraEnabled
    public static List<ContentVersion> updateFileData(List<ContentVersion> files) {
        try {
            update files;
            return files;
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }
    }

    // !CONTENT DISTRIBUTION METHODS
    @AuraEnabled
    public static List<ContentDistribution> getContentDistribution(List<Id> cvIds) {
        List<ContentDistribution> cd = [
            SELECT DistributionPublicUrl, ContentDownloadUrl, ContentVersionId, ContentDocumentId
            FROM ContentDistribution
            WHERE ContentVersionId IN :cvIds
        ];
        return cd;
    }

    @AuraEnabled
    public static List<ContentDistribution> createContentDistribution(List<Id> contentDocIds, String fileType) {
        Map<Id, ContentVersion> cvMap = new Map<Id, ContentVersion>(
            [SELECT Id FROM ContentVersion WHERE ContentDocumentId IN :contentDocIds AND isDeleted__c = false AND isLatest = true]
        );
        List<ContentDistribution> cdList = new List<ContentDistribution>();
        for (Id cv : cvMap.keySet()) {
            ContentDistribution cd = new ContentDistribution();
            cd.Name = 'Distribution URL';
            cd.ContentVersionId = cv;
            cd.PreferencesAllowViewInBrowser = true;
            cd.PreferencesLinkLatestVersion = true;
            cd.PreferencesAllowOriginalDownload = true;
            cdList.add(cd);

            if (fileType != null)
                cvMap.get(cv).AccountFileType__c = fileType;
        }

        try {
            if (fileType != null)
                update cvMap.values();

            insert cdList;
            return UserProfile.getContentDistribution(new List<Id>(cvMap.keyset()));
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }
    }
    // !SERVICES METHODS
    @AuraEnabled
    public static List<Partner_Services__c> upsertServices(List<Partner_Services__c> services) {
        try {
            upsert services;
            return services;
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static void uploadUserImage(String fileRecordId) {
        ConnectApi.UserProfiles.setPhoto(null, UserInfo.getUserId(), fileRecordId, null);
    }
}