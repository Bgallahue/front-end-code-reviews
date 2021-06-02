/*


Change log:
05/18/2021:     First launch

*/

public with sharing class Controller_NearbyAccounts {
    @AuraEnabled
    public static Map<String, Double> retrieveGeocodeRecords(Id recordId, String dataSetIdentifier) {
        Integer numberOfRecordsToReturn = 5;
        Map<String, Double> recordsByDistanceMap = new Map<String, Double>();
        List<String> recordsInOrder = new List<String>();
        try {
            geopointe.API.radialSearchResult result = geopointe.API.radialSearchDataSet(
                recordId,
                dataSetIdentifier,
                30,
                geopointe.API.units.MILES
            );
            recordsByDistanceMap = result.recordsByDistance;
            recordsInOrder = result.recordsInDistanceOrder;
            if (recordsInOrder.size() > 5) {
                Map<String, Double> closestRecordsToReturn = new Map<String, Double>();
                for (Integer i = 0; i < numberOfRecordsToReturn; i++) {
                    closestRecordsToReturn.put(recordsInOrder[i], recordsByDistanceMap.get(recordsInOrder[i]));
                }
                return closestRecordsToReturn;
            } else {
                return recordsByDistanceMap;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Account> loadAccountFields(List<Id> accountIds) {
        try {
            List<Account> accountList = [
                SELECT
                    Id,
                    Name,
                    BillingStreet,
                    BillingCity,
                    BillingState,
                    BillingPostalCode,
                    Services__c,
                    Website,
                    Year_company_established__c,
                    Primary_Billing_Contact__r.Name,
                    Type,
                    Bio__c,
                    Years_with_Evolve__c,
                    Partner_Active_Listings__c
                FROM Account
                WHERE Id IN :accountIds
            ];
            return accountList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Map<Id, List<Partner_Services__c>> loadPartnerServices(List<Id> accountIds) {
        try {
            Map<Id, List<Partner_Services__c>> accountToServicesMap = new Map<Id, List<Partner_Services__c>>();
            List<Partner_Services__c> allPartnerServices = [
                SELECT Id, Name, Account__c, Service__c, Rate_Structure__c, Fee_Type__c, Flat_Rate__c, Percent_Rate__c
                FROM Partner_Services__c
                WHERE Account__c IN :accountIds
            ];
            for (Partner_Services__c service : allPartnerServices) {
                Id accountId = (Id) service.get('Account__c');
                if (accountToServicesMap.containsKey(accountId)) {
                    List<Partner_Services__c> services = accountToServicesMap.get(accountId);
                    services.add(service);
                    accountToServicesMap.put(accountId, services);
                } else {
                    accountToServicesMap.put(accountId, new List<Partner_Services__c>{ service });
                }
            }
            for (Id accountId : accountIds) {
                if (!accountToServicesMap.containsKey(accountId)) {
                    accountToServicesMap.put(accountId, new List<Partner_Services__c>());
                }
            }
            return accountToServicesMap;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}