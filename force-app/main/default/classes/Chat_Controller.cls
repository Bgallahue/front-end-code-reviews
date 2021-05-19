public with sharing class Chat_Controller {
    @AuraEnabled
    public static List<Comment> getComments(Id recordId) {
        List<Comment__c> comments =  [SELECT id, Body__c, Parent__c, CreatedBy.Name, CreatedDate, CreatedBy.FirstName,CreatedBy.LastName
                                      FROM Comment__c
                                      WHERE Case__c = : recordId OR Claim__c = : recordId order by CreatedDate asc];

        List<Comment> result = new List<Comment>();
        for (Comment__c comment : comments) {
            result.add(new Comment(comment));
        }
        return result;
    }

    @AuraEnabled
    public static void saveComment(Id recordId, String body, Boolean published) {
        try {
            Comment__c comment = new Comment__c();
            if (recordId.getSobjectType() == Case.getSObjectType()) {
                comment.Case__c = recordId;
            }
            if (recordId.getSobjectType() == Claims__c.getSObjectType()) {
                comment.Claim__c = recordId;
            }
            comment.Body__c = body;
            insert comment;
        }
        catch (DmlException e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class Comment {
        @AuraEnabled
        public String CommentBody { get; set; }
        @AuraEnabled
        public String CreatedByName { get; set; }
        @AuraEnabled
        public Datetime CreatedDate { get; set; }
        @AuraEnabled
        public Boolean ExternalComment { get; set; }
        @AuraEnabled
        public String FirstName { get; set; }
        @AuraEnabled
        public String LastName { get; set; }

        public Comment(Comment__c comment) {
            this.CommentBody = comment.Body__c;
            this.FirstName = comment.CreatedBy.FirstName;
            this.LastName = comment.CreatedBy.LastName;
            this.CreatedByName = comment.CreatedBy.Name;
            this.CreatedDate = comment.CreatedDate;
        }

    }
}