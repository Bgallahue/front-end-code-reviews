/**
 * Class for work with SmartRates Api app
 *
 * 09/18/2019: Added new method SmartRatesService, this method works with SmartRates app through API
 */

public with sharing class SmartRatesService {

    private static final String GET_FAILSAFE_OERRIDE_ENDPOINT = '/api/smartrates/failsafe_override';
    private static final String GET_SETTINGS_ENDPOINT = '/api/smartrates/config';
    private static final String PUSH_TO_QUEUE_ENDPOINT = '/api/push-to-queue';

    private static final String TIME24HOURS_PATTERN = '([01]?[0-9]|2[0-3]):([0-5][0-9])';
    private static final Pattern h24Pattern = Pattern.compile(TIME24HOURS_PATTERN);

    @TestVisible
    private static final String[] SR_STATUSES = new String[] { 'Building', 'Active For Rent', 'On-Hold', 'Active' };

    @TestVisible
    private static final String ERROR_MESSAGE_1 =  'Listing has status: {0}. Supported statuses are {1}.';

    @TestVisible
    private static final String ERROR_MESSAGE_2 =  '\'Evolve Listing Resigned Date\' should be null.';

    @TestVisible
    private static final String ERROR_MESSAGE_3 =  'Listing is not enroll SmartRates, please enable \'SmartRates Enable\' checkbox, set min price and base price.';

    public static final String MAINTENANCE_MODE_MESSAGE = 'Build Prices for Single Listing has been disabled. Maintenance mode.';



    public static Object getFailsafeOverrideSettings(Integer overrideId) {
        String result = HerokuApiService.sendRequest(GET_FAILSAFE_OERRIDE_ENDPOINT + (overrideId == null ? '' : '?id=' + overrideId), 'GET');
//        System.debug(result);
        return JSON.deserializeUntyped(result);
    }

    public static Object saveFailsafeOverrideSettings(Map<String, Object> setting) {
        String result = HerokuApiService.sendRequest(GET_FAILSAFE_OERRIDE_ENDPOINT, 'POST', JSON.serialize(setting));
        return JSON.deserializeUntyped(result);
    }

    public static Object deleteFailsafeOverrideSettings(Integer overrideId) {
        String result = HerokuApiService.sendRequest(GET_FAILSAFE_OERRIDE_ENDPOINT + (overrideId == null ? '' : '?id=' + overrideId), 'DELETE');
        return JSON.deserializeUntyped(result);
    }
    
    public static SmartRatesConfig getSettingsByName(String settingsName) {
        if (String.isEmpty(settingsName))  throw new IllegalArgumentException('Settings name is not defined');

        String result = HerokuApiService.sendRequest(GET_SETTINGS_ENDPOINT + '?settingsName=' + settingsName.replaceAll(' ', '%20'), 'GET');
        List<SmartRatesConfig> settings = (List<SmartRatesConfig>) JSON.deserialize(result, List<SmartRatesConfig>.class);
        return settings.size() > 0 ? settings.get(0) : null;
    }

    public static List<SmartRatesConfig> getAllSettings() {
        String result = HerokuApiService.sendRequest(GET_SETTINGS_ENDPOINT, 'GET');
        return (List<SmartRatesConfig>) JSON.deserialize(result, List<SmartRatesConfig>.class);
    }

    public static void saveSettings(SmartRatesConfig config) {
        if (config == null) throw new IllegalArgumentException('Config is not defined');

        HerokuApiService.sendRequest(GET_SETTINGS_ENDPOINT, 'POST', JSON.serialize(config));
    }

    @Future(Callout = true)
    public static void pushToQueue(String events) {
        HerokuApiService.sendRequest(PUSH_TO_QUEUE_ENDPOINT, 'POST', events);
    }

    @AuraEnabled
    public static Boolean isMaintenanceMode() {
        SmartRates_Settings__mdt smartRatesSettings = getSmartRatesSettingsMetadata();
        if (smartRatesSettings.Enable_Maintenance_Mode__c) {

            Datetime currentDatetime = Datetime.now();
            Matcher startTime = h24Pattern.matcher(smartRatesSettings.Maintenance_Mode_Start_Time__c);
            Matcher endTime = h24Pattern.matcher(smartRatesSettings.Maintenance_Mode_End_Time__c);
            if (startTime.matches() && endTime.matches()) {
                Integer startHour = Integer.valueOf(startTime.group(1));
                Integer startMinutes = Integer.valueOf(startTime.group(2));


                Integer endHour = Integer.valueOf(endTime.group(1));
                Integer endMinutes = Integer.valueOf(endTime.group(2));

//                System.debug('startTime: ' + startTime.group(0));
//                System.debug('endTime: ' + endTime.group(0));

                Datetime startDatetime = Datetime.newInstanceGmt(Date.today(), Time.newInstance(startHour, startMinutes, 0, 0));
                Datetime endDatetime = Datetime.newInstanceGmt(Date.today().addDays(startHour > endHour ? 1 : 0),
                        Time.newInstance(endHour, endMinutes, 0, 0));
                Datetime currentDatetimeGmt = Datetime.newInstanceGmt(currentDatetime.dateGmt(), currentDatetime.timeGmt());
//                System.debug('startDatetime: ' + startDatetime);
//                System.debug('currentDatetimeGmt: ' + currentDatetimeGmt);
//                System.debug('endDatetime: ' + endDatetime);

                return startDatetime < currentDatetimeGmt && currentDatetimeGmt < endDatetime;
            } else {
                throw new EvolveException('Maintenance Mode Time has incorrect format');
            }

            //Datetime maintenanceStartDatetime =
        }

        return false;
    }

    public static SmartRates_Settings__mdt getSmartRatesSettingsMetadata() {
        try {
            if (Test.isRunningTest()) {
                return new SmartRates_Settings__mdt(Snowflake_Account__c = 'evolve',
                        Snowflake_Database__c = 'db', Snowflake_Password__c = 'password', Snowflake_Rolename__c = 'rolename',
                        Snowflake_Username__c = 'user', Snowflake_Warehouse__c = 'wh', Emails__c = 'slegostaev@mycervello.com',
                        Enable_Maintenance_Mode__c = true, Maintenance_Mode_Start_Time__c = '00:00', Maintenance_Mode_End_Time__c = '00:01');
            } else {
                return [
                        select Id, Emails__c, Snowflake_Account__c, Snowflake_Database__c, Snowflake_Password__c,
                                Snowflake_Username__c, Snowflake_Warehouse__c, Snowflake_Rolename__c,
                                Enable_Maintenance_Mode__c, Maintenance_Mode_Start_Time__c, Maintenance_Mode_End_Time__c
                        from SmartRates_Settings__mdt
                        limit 1
                ];
            }
        } catch (QueryException e) {
            //EvolveException.recordException('SmartRatesService', 'getSmartRatesSettingsMetadata', e);
            throw new EvolveException('SmartRates Settings metadata is not declared');
        }
    }


    public static Listing_Jobs_Info__c getListingJobsInfo(Id listingId) {
        List<Listing_Jobs_Info__c> listingJobsInfoList = [SELECT Listing_Id__c, Job_Id__c, Ext_Listing_Id__c, Last_Prices_Modification__c FROM Listing_Jobs_Info__c WHERE Listing_Id__c = :listingId];
        if (listingJobsInfoList.size() > 1) throw new EvolveException('Too many jobs for one listing');

        return listingJobsInfoList.size() == 0 ? null : listingJobsInfoList.get(0);

    }

    public static String validateBuildPricesForListing(Id listingId) {
        if (isMaintenanceMode()) return MAINTENANCE_MODE_MESSAGE;

        Listing__c listing = [select Id, Name, SmartRates_Enabled__c, Status__c, EB_Base_Price__c, Evolve_Listing_Resigned_Date__c, Min_Price__c from Listing__c where Id = :listingId];
        if (listing.Status__c != null && SR_STATUSES.contains(listing.Status__c) == false)  return String.format(ERROR_MESSAGE_1, new List<String> { listing.Status__c, String.join(SR_STATUSES, ',') });

        if (listing.Evolve_Listing_Resigned_Date__c != null) return ERROR_MESSAGE_2;

        if (listing.SmartRates_Enabled__c == false || listing.EB_Base_Price__c == null || listing.Min_Price__c == null) return ERROR_MESSAGE_3;

        return 'OK';
    }
}