/*


Change log:
04/14/2021:     First launch

*/

public with sharing class Controller_CaseToClaimFileCopy {
    @AuraEnabled
    public static List<Claims__c> getRelatedClaims(Id recordId) {
        try {
            return [
                SELECT Id, Name, Booking__c, Booking__r.Name, RecordType.Name
                FROM Claims__c
                WHERE Incident_Report_Case__c = :recordId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String saveFiles(Id recordId, List<ContentVersion> files) {
        try {
            List<ContentDocumentLink> linksToInsert = new List<ContentDocumentLink>();
            for (ContentVersion file : files) {
                ContentDocumentLink link = new ContentDocumentLink();
                link.ContentDocumentId = file.ContentDocumentId;
                link.LinkedEntityId = recordId;
                linksToInsert.add(link);
            }

            // Links will fail to insert if they are duplicates. Return success if at least one saves, otherwise return an error
            Database.SaveResult[] result = Database.Insert(linksToInsert, false);
            for (Database.SaveResult save : result) {
                if (save.isSuccess()) {
                    return 'success';
                }
            }
            // return first error message if no links were inserted successfully
            for (Database.Error err : result[0].getErrors()) {
                return err.getMessage();
            }
            return 'success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}