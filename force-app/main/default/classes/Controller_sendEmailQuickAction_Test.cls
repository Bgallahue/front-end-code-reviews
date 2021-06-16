@IsTest
public with sharing class Controller_sendEmailQuickAction_Test
{
    private static List<EmailTemplate> testTemplates = new List<EmailTemplate>();
    private static List<Listing__c> testListings = new List<Listing__c>();
    private static List<Account> testAccounts = new List<Account>();
    private static List<Contact> testContacts = new List<Contact>();
    private static List<User> testUsers = new List<User>();
    private static List<Billing_Plan__c> testBillingPlans = new List<Billing_Plan__c>();

    private static void initTestData(Integer testType) {
        if (testType == 0) {
            testTemplates.add(UnitTestFactory.testEmailTemplate('Test', 'TEST_DEVELOPER_NAME_SEND_EMAIL_QUICK_ACTION'));
            testTemplates[0].Body = 'test body';
            insert testTemplates;
        } else if (testType == 1) {
            testAccounts.add(UnitTestFactory.testAccount(RecordTypeHelper.getRecordType('Account', 'Home Owner').Id, 'Test Account'));
            insert testAccounts;

            testContacts.add(UnitTestFactory.testContact(testAccounts[0].Id, 'test contact'));
            insert testContacts;

            testBillingPlans.add(UnitTestFactory.testBillingPlan());
            insert testBillingPlans;

            testListings.add(UnitTestFactory.testListing(RecordTypeHelper.getRecordType('Listing__c', 'Listing').Id, testAccounts[0].Id, testBillingPlans[0].Id));
            testListings[0].Property_Owner__c = testContacts[0].Id;
            insert testListings;

            testUsers.add(UnitTestFactory.testUser('test' + System.now().getTime() + '@test.com', 'user', 'System Administrator'));
            insert testUsers;

            testTemplates.add(UnitTestFactory.testEmailTemplate('Test', 'TEST_DEVELOPER_NAME_SEND_EMAIL_QUICK_ACTION'));
            testTemplates[0].Body = 'test body';
            System.runAs(testUsers[0]) {
                insert testTemplates;
            }
        } else if (testType == 2) {
            testAccounts.add(UnitTestFactory.testAccount(RecordTypeHelper.getRecordType('Account', 'Home Owner').Id, 'Test Account'));
            insert testAccounts;

            testContacts.add(UnitTestFactory.testContact(testAccounts[0].Id, 'test contact'));
            insert testContacts;

            testBillingPlans.add(UnitTestFactory.testBillingPlan());
            insert testBillingPlans;

            testListings.add(UnitTestFactory.testListing(RecordTypeHelper.getRecordType('Listing__c', 'Listing').Id, testAccounts[0].Id, testBillingPlans[0].Id));
            insert testListings;

            testUsers.add(UnitTestFactory.testUser('test' + System.now().getTime() + '@test.com', 'user', 'System Administrator'));
            insert testUsers;

            testTemplates.add(UnitTestFactory.testEmailTemplate('Test', 'TEST_DEVELOPER_NAME_SEND_EMAIL_QUICK_ACTION'));
            testTemplates[0].Body = 'test body';
            System.runAs(testUsers[0]) {
                insert testTemplates;
            }
        }
    }

    @IsTest
    private static void test_getEmailTemplateBody(){
        initTestData(0);

        Test.startTest();
        String templateBody = Controller_sendEmailQuickAction.getEmailTemplateBody(testTemplates[0].DeveloperName);
        Test.stopTest();

        System.assertEquals(testTemplates[0].Body, templateBody);
    }

    @IsTest
    private static void test_getEmailTemplateBodyNull(){
        initTestData(0);

        Test.startTest();
        String templateBody = Controller_sendEmailQuickAction.getEmailTemplateBody(testTemplates[0].DeveloperName+'null');
        Test.stopTest();

        System.assertEquals('', templateBody);
    }

    @IsTest
    private static void test_sendEmail(){
        initTestData(1);
        Test.startTest();
        Controller_sendEmailQuickAction.sendEmail(testListings[0].Id, testTemplates[0].DeveloperName, 'Listing__c','Property_Owner__c', true);
        Test.stopTest();
    }

    @IsTest
    private static void test_sendEmailExceptionFieldToWho(){
        initTestData(2);
        String error = '';

        Test.startTest();
        try{
            Controller_sendEmailQuickAction.sendEmail(testListings[0].Id, testTemplates[0].DeveloperName, 'Listing__c','Property_Owner__c', true);
        } catch (AuraHandledException e) {
            error = e.getMessage();
        }
        Test.stopTest();

        Map<String,Schema.SObjectType>schemaMap=Schema.getGlobalDescribe();
        SObjectField field=(SObjectField)schemaMap.get('Listing__c').getDescribe().fields.getMap().get('Property_Owner__c');
        System.assertEquals(field.getDescribe().getLabel()+ ' is not populated', error);
    }

    @IsTest
    private static void test_sendEmailExceptionRecordId(){
        initTestData(2);
        String error = '';

        Test.startTest();
        try{
            Controller_sendEmailQuickAction.sendEmail(null, testTemplates[0].DeveloperName, 'Listing__c','Property_Owner__c', true);
        } catch (AuraHandledException e) {
            error = e.getMessage();
        }
        Test.stopTest();

        System.assertEquals('Record Id is not defined', error);
    }
}