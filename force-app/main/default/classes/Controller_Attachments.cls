/*

Change log:
10/08/2020:     Created. Moved 2 methodsfrom HPP_AuraUtils
10/26/2020:     Added getContentVersionById

*/

public with sharing class Controller_Attachments {
    @AuraEnabled
    public static List<Attachment> getAttachmentsByParentId(String parentId) {
        return [
            SELECT Id, Name, ContentType, BodyLength, ParentId, Description, LastModifiedDate
            FROM Attachment
            WHERE parentId = :parentId
            LIMIT 100
        ];
    }

    @AuraEnabled
    public static List<ContentVersion> getContentVersionByParentId(String parentId) {
        set<id> setContentIds = new Set<id>();
        List<ContentDocumentLink> ContDocs = [
            SELECT ContentDocumentId, Id
            FROM ContentDocumentLink
            WHERE LinkedEntityId = :parentId
        ];
        for (ContentDocumentLink vDocLink : ContDocs) {
            setContentIds.add(vDocLink.ContentDocumentId);
        }
        return [
            SELECT Id, Title, FileExtension, LastModifiedDate, ContentDocumentId
            FROM ContentVersion
            WHERE ContentDocumentId IN :setContentIds AND isDeleted__c = FALSE AND isLatest = TRUE
        ];
    }

    @AuraEnabled
    public static List<ContentVersion> getContentVersionById(List<Id> setContentIds) {
        return [
            SELECT Id, Title, FileExtension, LastModifiedDate, ContentDocumentId
            FROM ContentVersion
            WHERE ContentDocumentId IN :setContentIds AND isDeleted__c = FALSE AND isLatest = TRUE
        ];
    }
}