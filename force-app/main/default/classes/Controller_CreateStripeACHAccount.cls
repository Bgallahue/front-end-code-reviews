public with sharing class Controller_CreateStripeACHAccount {
    @AuraEnabled
    public static String createBankAccount(Map<string, string> bankAccount) {
        User connectedAccount = [
            SELECT Id, Account.Stripe_Connected_Account__c, Account.Stripe_Connected_Account__r.bt_stripe__Connected_Account_ID__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        if (connectedAccount.Account.Stripe_Connected_Account__r.bt_stripe__Connected_Account_ID__c == null) {
            String errorMessage = 'This user does not have a valid Stripe Connected Account and cannot proceed';
            ExceptionLogEventServices.pushExceptionLog('Controller_CreateStripeACHAccount', 'createBankAccount', errorMessage);
            throw new AuraHandledException(errorMessage);
         }

        String body =
            'bank_account[country]=' +
            'US' +
            '&bank_account[currency]=' +
            'USD' +
            '&bank_account[account_holder_type]=' +
            'Individual' +
            '&bank_account[account_holder_name]=' +
            bankAccount.get('name') +
            '&bank_account[account_number]=' +
            bankAccount.get('accountNumber') +
            '&bank_account[routing_number]=' +
            bankAccount.get('routingNumber') +
            '&default_for_currency=true';

        Http h = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(
            'https://api.stripe.com//v1/accounts/' +
            connectedAccount.Account.Stripe_Connected_Account__r.bt_stripe__Connected_Account_ID__c +
            '/external_accounts'
        );
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer sk_test_FAKE_FOR_GITHUB');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody(body);
        HttpResponse res = h.send(req);
        // 201, 203
        if (res.getStatusCode() == 200 || res.getStatusCode() == 201 || res.getStatusCode() == 203) {
            return res.getBody();
        } else {
            Map<String, Object> parsedToken = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            Map<String, Object> innerObject = (Map<String, Object>) parsedToken.get('error');
            String errorMessage = (String) innerObject.get('message');
            ExceptionLogEventServices.pushExceptionLog('Controller_CreateStripeACHAccount', 'createBankAccount', 'This is an error generated from Stripe: ' + errorMessage);
            throw new CalloutException(errorMessage);
        }
    }
}