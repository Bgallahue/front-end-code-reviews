/**
 * Created by sergeylegostaev on 7/15/20.
 */

public with sharing class QueueManagementService {
    public static final String PENDING_STATUS = 'Pending';
    public static final String IN_QUEUE_STATUS = 'In Queue';
    public static final String IN_PROGRESS_STATUS = 'In Progress';
    public static final String COMPLETED_STATUS = 'Completed';
    public static final String ERROR_STATUS = 'Error';
    public static final String DUPLICATE_STATUS = 'Error';
    public static final String MOVED_TO_DAILY_JOB = 'Moved to Daily Job';

    public static final String DAILY_JOB = 'Daily Job';
    public static final String SINGLE_LISTING_BUILD_PRICES = 'Single Listing Build Prices';
    public static final String MARKET_ADJUSTMENT_ON_DEMAND = 'Market Adjustment on Demand';
    public static final String SNOWFLAKE_SCRIPTS_JOB = 'Snowflake Scripts Job';
    public static final String ERODING_MIN_STAY = 'Eroding Min Stay';

    public static final Set<String> JOBS;
    public static final Set<String> STATUSES;

    static {
        JOBS = new Set<String> {
                DAILY_JOB, SINGLE_LISTING_BUILD_PRICES, MARKET_ADJUSTMENT_ON_DEMAND, SNOWFLAKE_SCRIPTS_JOB, ERODING_MIN_STAY
        };

        STATUSES = new Set<String> {
                PENDING_STATUS, IN_QUEUE_STATUS, IN_PROGRESS_STATUS, COMPLETED_STATUS, ERROR_STATUS, DUPLICATE_STATUS, MOVED_TO_DAILY_JOB
        };
    }

    public static Id addToQueue(String jobName, Id listingId) {
        return addToQueue(jobName, listingId, false);
    }

    public static Id addToQueue(String jobName) {
        return addToQueue(jobName, null, null, false);
    }

    public static Id addToQueue(String jobName, Boolean isHighPriority) {
        return addToQueue(jobName, null, null, isHighPriority);
    }

    public static Id addToQueue(String jobName, List<Map<String, Object>> maList) {
        return addToQueue(jobName, null, maList, false);
    }

    public static Id addToQueue(String jobName, Id listingId, Boolean isHighPriority) {
        return addToQueue(jobName, listingId, null, isHighPriority);
    }

    private static Id addToQueue(String jobName, Id listingId, List<Map<String, Object>> maList, Boolean isHighPriority) {
        if (JOBS.contains(jobName)) {
            if (jobName == SINGLE_LISTING_BUILD_PRICES && String.isBlank(listingId)) {
                throw new EvolveException('This job requires Listing Id');
            } else if (jobName == MARKET_ADJUSTMENT_ON_DEMAND && (maList == null || maList.isEmpty())) {
                throw new EvolveException('This job requires Market Adjustment Id');
            }

            Queue_Manager__c job = new Queue_Manager__c(Job_Name__c = jobName,
                    Listing_Id__c = listingId,
                    Market_Adjustments_Info__c = JSON.serialize(maList),
                    High_Priority__c = isHighPriority);

            insert job;
            return job.Id;
        }

        throw new EvolveException('Unknown job: ' + jobName);
    }

    public static Queue_Manager__c getJobForListing(Id listingId, String jobName, Datetime startTime) {
        List<Queue_Manager__c> tmp = [select Id, Status__c, Job_Name__c, Main_Job__c, Listing_Id__c, Extended_Status__c, Is_Completed__c, High_Priority__c, CreatedDate
            from Queue_Manager__c where Listing_Id__c = :listingId and CreatedDate >= :startTime
                and Job_Name__c = :jobName order by CreatedDate desc];
        System.debug('jobs '+tmp);
        return tmp == null ? null : (tmp.isEmpty() ? null : tmp.get(0));
    }

}