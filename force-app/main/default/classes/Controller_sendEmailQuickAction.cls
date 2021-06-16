public class Controller_sendEmailQuickAction
{
    @AuraEnabled
    public static String getEmailTemplateBody(String templateName){
        String body = '';

        try
        {
            List<EmailTemplate> emailTemplates = [SELECT Id,Body,HtmlValue FROM EmailTemplate WHERE DeveloperName = :templateName LIMIT 1];
            if (!emailTemplates.isEmpty())
            {
                body = emailTemplates[0]?.HtmlValue != null ? emailTemplates[0]?.HtmlValue : emailTemplates[0]?.Body;
            }
        } catch (Exception error) {
            throw createException('Template is not found.');
        }

        return body;
    }

    private static AuraHandledException createException(String errorMessage)
    {
        AuraHandledException e = new AuraHandledException(errorMessage);
        e.setMessage(errorMessage);
        return e;
    }

    @AuraEnabled
    public static void sendEmail(Id recordId, String templateName, String objectName, String fieldToWho, Boolean setAsActivity){

        if (recordId == null){
            throw createException('Record Id is not defined');
        }

        sObject so;
        String query = 'SELECT Id,' + fieldToWho + ' FROM ' + objectName + ' WHERE Id = \'' + recordId + '\'';
        so = Database.Query(query);
        if ((Id) so.get(fieldToWho) == null) {
           Map<String,Schema.SObjectType>schemaMap=Schema.getGlobalDescribe();
           SObjectField field=(SObjectField)schemaMap.get(objectName).getDescribe().fields.getMap().get(fieldToWho);
           throw createException(field.getDescribe().getLabel()+' is not populated');
        }

        try {
            List<Messaging.SingleEmailMessage> emails = EmailHandler.buildEmails((Id) so.get(fieldToWho), recordId, templateName, setAsActivity);
            if (!emails.isEmpty()) {
               EmailHandler.sendEmails(emails, new Set<Id>{recordId});
            }
        } catch (Exception error) {
            throw createException(error.getMessage());
        }
    }

    @AuraEnabled
    public static List<ListingContactRole__c> getListingContacts(String recordId){
        List<ListingContactRole__c> listingContacts = [SELECT Id, Contact__r.Name, Role__c FROM ListingContactRole__c WHERE Listing__c = :recordId];
        return listingContacts;
    }
}