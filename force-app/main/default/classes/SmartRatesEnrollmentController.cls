/**
 * Created by sergeylegostaev on 9/18/19.
 */

public with sharing class SmartRatesEnrollmentController {

    public String message {get; private set;}
    public Id listingId {get; private set;}
    public Boolean isButtonDisabled {get; private set;}
    public String lastModification {get; private set;}

    public SmartRatesEnrollmentController(ApexPages.StandardController stdController) {
        this.listingId = ((Listing__c) stdController.getRecord()).Id;
        this.lastModification = getLastPricesModificationDate(this.listingId);
        if (SmartRatesService.isMaintenanceMode()) {
            this.message = SmartRatesService.MAINTENANCE_MODE_MESSAGE;
            this.isButtonDisabled = true;
        } else {
            this.message = 'Press "Build Prices" button to start process.';
            this.isButtonDisabled = false;
        }

    }

    @AuraEnabled
    static public String getLastPricesModificationDate(String listingId) {
        try{
            Listing_Jobs_Info__c listingJobsInfo = SmartRatesService.getListingJobsInfo(listingId);
            return listingJobsInfo == null || listingJobsInfo.Last_Prices_Modification__c == null ? '' : listingJobsInfo.Last_Prices_Modification__c.format('MM/dd/yyyy hh:mm a');
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    static public String getInitialStatus(String listingId, String jobName) {

        if (jobName == QueueManagementService.SINGLE_LISTING_BUILD_PRICES) {
            String status = SmartRatesService.validateBuildPricesForListing(listingId);
            if (status != 'OK') {
                throw new AuraHandledException(status);
            }
        }
        
        try {
            Queue_Manager__c existingJob = QueueManagementService.getJobForListing(listingId, jobName, null);
            return existingJob == null || existingJob.Is_Completed__c ? 'Ready' : existingJob.Extended_Status__c;
            
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }

    }

    @AuraEnabled
    static public String startBuildingPrices(String listingId){
        try {
            QueueableJobHandler.handle(new ListingBuildPricesJob(listingId));
            return 'Single Listing Update Prices Job has been started.';
        }
        catch (Exception e) {
            System.debug(e);
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }

    }

    @AuraEnabled(Cacheable=true)
    static public String getCurrentJobStatus(String listingId, String jobName, Long jobStartTime){
        try {
            Datetime startTime = (jobStartTime == null ? null : Datetime.newInstance(jobStartTime));
            Queue_Manager__c job = QueueManagementService.getJobForListing(listingId, jobName, startTime);
            return job == null ? '' :  job.Extended_Status__c;
        } catch (Exception e) {
            // "Convert" the exception into an AuraHandledException
            throw new AuraHandledException(e.getMessage());
        }

    }

    @AuraEnabled
    static public String startErodingMinStay(String listingId){
        try {
            QueueableJobHandler.handle(new ErodingMinStayBuildRules(listingId));
            return 'Eroding Min Stay Job has been started';
        }
        catch (Exception e){
            System.debug(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

}