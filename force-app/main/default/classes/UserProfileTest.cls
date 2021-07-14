@isTest
public with sharing class UserProfileTest {
    // !Billing Contact
    // * bpAccount
    // * bpContact
    // * bpUser

    // ! Business Account
    // * testAccount

    //! Browsing User
    // * testContact
    // * testUser

    // ! Exception Account
    // * exceptionAccount

    //! Files Connected to Test Account
    // * ContentVersion (BrochureImage)
    // * ContentDocument
    // * ContentDocumentLink

    //! File Connected to Exception Account
    // * ContentVersion (DeleteFile)
    // * ContentDocument
    // * ContentDocumentLink

    static Id Partner_Account_RT = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName()
        .get('Partner')
        .getRecordTypeId();

    @TestSetup
    static void makeData() {
        Profile profileId = [SELECT Id FROM Profile WHERE Name = 'Evolve Partner MPL' LIMIT 1];

        //! Billing Account/Contact/User
        Account bpAccount = new Account();

        bpAccount.Name = 'BP Tester';

        insert bpAccount;

        Contact bpContact = new Contact();

        bpContact.FirstName = 'BP';
        bpContact.LastName = 'Tester';
        bpContact.Email = 'BP@test.com';
        bpContact.AccountId = bpAccount.Id;

        insert bpContact;

        User bpUser = new User();

        bpUser.LastName = 'BP Tester';
        bpUser.Email = 'BP@test.com';
        bpUser.Alias = 'BP';
        bpUser.Username = 'BP@test.com';
        bpUser.CommunityNickname = 'bpUser';
        bpUser.LocaleSidKey = 'en_US';
        bpUser.TimeZoneSidKey = 'GMT';
        bpUser.ProfileID = profileId.Id;
        bpUser.LanguageLocaleKey = 'en_US';
        bpUser.EmailEncodingKey = 'UTF-8';
        bpUser.ContactId = bpContact.Id;

        insert bpUser;

        //! Business Account
        Account testAccount = new Account();
        testAccount.RecordTypeId = UserProfileTest.Partner_Account_RT;
        testAccount.Business_Type__c = 'Marketing Partner';
        testAccount.Name = 'Joe sampTester';
        testAccount.Primary_Billing_Contact__c = bpContact.Id;

        insert testAccount;

        //! Browsing Contact/User
        Contact testContact = new Contact();

        testContact.FirstName = 'Joe';
        testContact.LastName = 'Tester';
        testContact.AccountId = testAccount.Id;
        testContact.Email = 'test123@test.com';

        insert testContact;

        User testUser = new User();

        testUser.LastName = 'Tester';
        testUser.Email = 'test@test.com';
        testUser.Alias = 'Tcode';
        testUser.Username = 'test123@test.com';
        testUser.CommunityNickname = 'test12';
        testUser.LocaleSidKey = 'en_US';
        testUser.TimeZoneSidKey = 'GMT';
        testUser.ProfileID = profileId.Id;
        testUser.LanguageLocaleKey = 'en_US';
        testUser.EmailEncodingKey = 'UTF-8';
        testUser.ContactId = testContact.Id;

        insert testUser;

        //! File Connected to Test Account
        // * ContentVersion/ContentDocument/ContentDocumentLink
        ContentVersion cv = new ContentVersion();

        cv.Title = 'BrochureImage';
        cv.PathOnClient = 'BrochureImage.jpg';
        cv.VersionData = Blob.valueOf('Test Content');
        cv.AccountFileType__c = 'Account Image';
        cv.IsMajorVersion = true;

        insert cv;

        ContentDocument document = [
            SELECT Id, Title, LatestPublishedVersionId
            FROM ContentDocument
            WHERE LatestPublishedVersionId = :cv.Id
            LIMIT 1
        ];

        ContentDocumentLink cdl = new ContentDocumentLink();

        cdl.LinkedEntityId = testAccount.Id;
        cdl.ContentDocumentId = document.Id;
        cdl.shareType = 'I';
        cdl.Visibility = 'AllUsers';

        insert cdl;

        // ! Exception Account
        Account exceptionAccount = new Account();

        exceptionAccount.Name = 'Missing Id';

        insert exceptionAccount;

        //! File Connected to Exception Account
        // * ContentVersion/ContentDocument/ContentDocumentLink
        ContentVersion deleteCV = new ContentVersion();

        deleteCV.Title = 'DeleteFile';
        deleteCV.PathOnClient = 'deleteFile.pdf';
        deleteCV.VersionData = Blob.valueOf('file deletion');
        deleteCV.AccountFileType__c = 'Account Image';
        deleteCV.IsMajorVersion = true;

        insert deleteCV;

        ContentDocument deleteDocument = [
            SELECT Id, Title, LatestPublishedVersionId
            FROM ContentDocument
            WHERE LatestPublishedVersionId = :deleteCV.Id
            LIMIT 1
        ];

        ContentDocumentLink deleteCDL = new ContentDocumentLink();

        deleteCDL.LinkedEntityId = exceptionAccount.Id;
        deleteCDL.ContentDocumentId = deleteDocument.Id;
        deleteCDL.shareType = 'I';
        deleteCDL.Visibility = 'AllUsers';

        insert deleteCDL;
    }
    @isTest
    static void PartnerProfile_Test() {
        User testUser = [SELECT Id FROM User WHERE LastName = 'Tester' AND Alias = 'Tcode' LIMIT 1];
        System.runAs(testUser) {
            Test.startTest();
            // TODO Get Exemption Account and Connected Files

            Account exemptionAccount = [SELECT Id, Name FROM Account WHERE Name = 'Missing Id' LIMIT 1];

            List<Id> cdId = new List<Id>();
            for (ContentDocumentLink cdl : [
                SELECT ContentDocumentId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :exemptionAccount.Id
            ]) {
                cdId.add(cdl.contentDocumentId);
            }

            UserProfile.createContentDistribution(cdId, 'Brochure File');

            List<ContentVersion> ExemptionFiles = [
                SELECT Id, Title, AccountFileType__c
                FROM ContentVersion
                WHERE
                    ContentDocumentId IN :cdId
                    AND isDeleted__c = false
                    AND isLatest = true
                    AND (AccountFileType__c = 'Account Image'
                    OR AccountFileType__c = 'Brochure File')
            ];

            // ! TEST getUserData
            UserProfile.wrapperToLWC testWrapper = UserProfile.getUserData();

            User oneTime = [SELECT Id FROM User WHERE Name = 'BP Tester'];

            Account BusinessAcct = testWrapper.objAcc;
            User BusinessContact = testWrapper.objUser;
            List<ContentVersion> BusinessFiles = testWrapper.files.values();

            System.assertEquals('Joe sampTester', testWrapper.objAcc.Name);
            System.assertEquals('BP Tester', testWrapper.objAcc.Primary_Billing_Contact__r.Name);
            System.assertEquals(oneTime.Id, testWrapper.objUser.Id);
            System.assertEquals('BrochureImage', BusinessFiles[0].Title);

            // !TEST upsertServices
            Partner_Services__c service = new Partner_Services__c();
            service.Account__c = testWrapper.objAcc.Id;
            service.Fee_Type__c = 'Flat Fee';
            service.Services_Offered__c = 'Guest Communications';
            service.Rate_Structure__c = 'Month';
            service.Flat_Rate__c = 10.00;
            service.Flat_Rate_Max__c = 20.00;
            List<Partner_Services__c> returnedServices = UserProfile.upsertServices(new List<Partner_Services__c>{ service });
            System.assertEquals('Guest Communications', returnedServices[0].Services_Offered__c);

            try {
                Partner_Services__c exceptService = new Partner_Services__c();
                exceptService.Account__c = testWrapper.objAcc.Id;
                exceptService.Services_Offered__c = 'Guest Communications';
                exceptService.Rate_Structure__c = 'Month';
                exceptService.Flat_Rate__c = 50.00;
                exceptService.Flat_Rate_Max__c = 50.00;
                List<Partner_Services__c> returnedExceptServices = UserProfile.upsertServices(
                    new List<Partner_Services__c>{ exceptService }
                );
            } catch (AuraHandledException e) {
                // System.debug(e.getMessage());
                System.assertEquals(e.getMessage(), 'Script-thrown exception');
            }

            //! TEST updateFileData
            BusinessFiles[0].Title = 'Updated File';
            List<ContentVersion> exceptFiles = UserProfile.updateFileData(BusinessFiles);
            // Test returned files
            System.assertEquals('Updated File', exceptFiles[0].Title);
            // Test queried files
            List<ContentDocumentLink> document = [
                SELECT ContentDocumentId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :BusinessAcct.Id
                LIMIT 1
            ];
            ContentVersion testUpdate = [
                SELECT Id, Title
                FROM ContentVersion
                WHERE ContentDocumentId = :document[0].ContentDocumentId
            ];
            System.assertEquals(testUpdate.Title, exceptFiles[0].Title);
            // Test exception
            try {
                exceptFiles[0]
                    .Title = '===================================================================================================Some string which is longer than 255 characters================================================================================================================';
                UserProfile.updateFileData(exceptFiles);
            } catch (AuraHandledException e) {
                // System.debug(e.getMessage());
                System.assertEquals(e.getMessage(), 'Script-thrown exception');
            }

            //! TEST createContentDistribution and getContentDistribution
            List<Id> contentDocumentIds = new List<Id>();
            contentDocumentIds.add(document[0].ContentDocumentId);

            List<ContentDistribution> returnedCD = UserProfile.createContentDistribution(contentDocumentIds, 'Account Image');

            System.assertEquals(returnedCD[0].ContentVersionId, BusinessFiles[0].Id);

            Test.stopTest();
        }
    }
    @isTest
    static void TaskCreator_Test() {
        User testUser = [SELECT Id FROM User WHERE LastName = 'Tester' AND Alias = 'Tcode' LIMIT 1];
        System.runAs(testUser) {
            Test.startTest();
            // ! TEST getUserData
            UserProfile.wrapperToLWC testWrapper = UserProfile.getUserData();

            Account BusinessAcct = testWrapper.objAcc;

            Task returnedTask = TaskCreator.sendTask(
                BusinessAcct.Id,
                'Partner_Queue',
                BusinessAcct.Name + ' updated their Business Profile',
                'These fields have changed:'
            );

            System.assertEquals('Joe sampTester updated their Business Profile', returnedTask.Subject);

            try {
                Task errorTask = TaskCreator.sendTask(testUser.Id, 'Partner_Queue',  BusinessAcct.Name + ' updated their Business Profile', 'description');
            } catch (AuraHandledException e) {
                System.assertEquals(e.getMessage(), 'Script-thrown exception');
            }
            Test.stopTest();
        }
    }
}