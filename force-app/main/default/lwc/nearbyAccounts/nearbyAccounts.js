import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { getSObjectValue } from "@salesforce/apex";
import { handleErrorMixin } from "c/utils";
import APEX_retrieveGeocodeRecords from "@salesforce/apex/Controller_NearbyAccounts.retrieveGeocodeRecords";
import APEX_loadPartnerServices from "@salesforce/apex/Controller_NearbyAccounts.loadPartnerServices";
import APEX_loadAccountFields from "@salesforce/apex/Controller_NearbyAccounts.loadAccountFields";

import FIELD_ACCOUNT_STREET from "@salesforce/schema/Account.BillingStreet";
import FIELD_ACCOUNT_CITY from "@salesforce/schema/Account.BillingCity";
import FIELD_ACCOUNT_STATE from "@salesforce/schema/Account.BillingState";
import FIELD_ACCOUNT_POSTAL_CODE from "@salesforce/schema/Account.BillingPostalCode";
import FIELD_ACCOUNT_ID from "@salesforce/schema/Account.Id";
import FIELD_ACCOUNT_NAME from "@salesforce/schema/Account.Name";
import FIELD_ACCOUNT_SERVICES from "@salesforce/schema/Account.Services__c";
import FIELD_ACCOUNT_WEBSITE from "@salesforce/schema/Account.Website";
import FIELD_ACCOUNT_YEAR_COMPANY_ESTABLISHED from "@salesforce/schema/Account.Year_company_established__c";
import FIELD_ACCOUNT_PRIMARY_BILLING_CONTACT_NAME from "@salesforce/schema/Account.Primary_Billing_Contact__r.Name";
import FIELD_ACCOUNT_TYPE from "@salesforce/schema/Account.Type";
import FIELD_ACCOUNT_BIO from "@salesforce/schema/Account.Bio__c";
import FIELD_ACCOUNT_YEARS_WITH_EVOLVE from "@salesforce/schema/Account.Years_with_Evolve__c";
import FIELD_ACCOUNT_PARTNER_ACTIVE_LISTINGS from "@salesforce/schema/Account.Partner_Active_Listings__c";
import FIELD_PARTNER_SERVICE_ID from "@salesforce/schema/Partner_Services__c.Id";
import FIELD_PARTNER_SERVICE_NAME from "@salesforce/schema/Partner_Services__c.Name";
import FIELD_PARTNER_SERVICE_SERVICE from "@salesforce/schema/Partner_Services__c.Service__c";
import FIELD_PARTNER_SERVICE_RATE_STRUCTURE from "@salesforce/schema/Partner_Services__c.Rate_Structure__c";
import FIELD_PARTNER_SERVICE_FEE_TYPE from "@salesforce/schema/Partner_Services__c.Fee_Type__c";
import FIELD_PARTNER_SERVICE_FLAT_RATE from "@salesforce/schema/Partner_Services__c.Flat_Rate__c";
import FIELD_PARTNER_SERVICE_PERCENT_RATE from "@salesforce/schema/Partner_Services__c.Percent_Rate__c";

export default class NearbyAccounts extends handleErrorMixin(NavigationMixin(LightningElement)) {
    @api recordId;
    @api accountDataSetId;
    @api partnerServicesDataSetId;
    @api caseUrl;

    @track accountsJSON = {};
    @track mapMarkers = [];
    @track accountRecords = [];
    @track isLoading = false;

    @track listData = {
        accounts: [],
        partnerServices: {},
        hasNoRecords: false
    };

    //
    // LIFECYCLE
    //
    connectedCallback() {
        this.loadData();
    }

    //
    // API METHODS
    //
    loadData() {
        this.isLoading = true;
        APEX_retrieveGeocodeRecords({
            recordId: this.recordId,
            dataSetIdentifier: this.accountDataSetId
        })
            .then((data) => {
                this.accountsJSON = data;
                this.loadAccountPartnerServices();
            })
            .catch(this.handleError)
            .finally(() => {
                this.isLoading = false;
            });
    }

    loadAccountPartnerServices() {
        APEX_loadPartnerServices({
            accountIds: Object.keys(this.accountsJSON)
        })
            .then((data) => {
                this.listData.partnerServices = data;
                this.loadAccountFields();
            })
            .catch(this.handleError);
    }

    loadAccountFields() {
        APEX_loadAccountFields({
            accountIds: Object.keys(this.accountsJSON)
        })
            .then((data) => {
                this.accountRecords = data;
                this.parseAccountsToMapMarkers();
                this.parseAccountsToListCards();
            })
            .catch(this.handleError);
    }

    //
    // PRIVATE METHODS
    //
    parseAccountsToMapMarkers() {
        this.mapMarkers = this.accountRecords.map((account) => {
            return {
                location: {
                    Street: account[FIELD_ACCOUNT_STREET.fieldApiName],
                    City: account[FIELD_ACCOUNT_CITY.fieldApiName],
                    State: account[FIELD_ACCOUNT_STATE.fieldApiName],
                    PostalCode: account[FIELD_ACCOUNT_POSTAL_CODE.fieldApiName]
                },
                title: account[FIELD_ACCOUNT_NAME.fieldApiName],
                description: `${account[FIELD_ACCOUNT_STREET.fieldApiName]}, ${account[FIELD_ACCOUNT_CITY.fieldApiName]}, ${
                    account[FIELD_ACCOUNT_STATE.fieldApiName]
                } ${account[FIELD_ACCOUNT_POSTAL_CODE.fieldApiName]}<br>
                Distance: ${(Math.round(this.accountsJSON[account[FIELD_ACCOUNT_ID.fieldApiName]] * 100) / 100).toFixed(2)} mi<br>
                Year Company Established: ${
                    account[FIELD_ACCOUNT_YEAR_COMPANY_ESTABLISHED.fieldApiName]
                        ? account[FIELD_ACCOUNT_YEAR_COMPANY_ESTABLISHED.fieldApiName]
                        : ""
                }<br>
                Years with Evolve: ${account[FIELD_ACCOUNT_YEARS_WITH_EVOLVE.fieldApiName]}<br>
                Partner Active Listings: ${account[FIELD_ACCOUNT_PARTNER_ACTIVE_LISTINGS.fieldApiName]}<br>
                Contact Full Name: ${getSObjectValue(account, FIELD_ACCOUNT_PRIMARY_BILLING_CONTACT_NAME)}`,
                icon: "utility:salesforce1"
            };
        });
    }

    parseAccountsToListCards() {
        this.listData.accounts = this.accountRecords.map((account) => {
            return {
                url: `/${account[FIELD_ACCOUNT_ID.fieldApiName]}`,
                name: account[FIELD_ACCOUNT_NAME.fieldApiName],
                fullAddress: `${account[FIELD_ACCOUNT_STREET.fieldApiName]}, ${account[FIELD_ACCOUNT_CITY.fieldApiName]}, ${
                    account[FIELD_ACCOUNT_STATE.fieldApiName]
                } ${account[FIELD_ACCOUNT_POSTAL_CODE.fieldApiName]}`,
                primaryBillingContactName: getSObjectValue(account, FIELD_ACCOUNT_PRIMARY_BILLING_CONTACT_NAME),
                services: account[FIELD_ACCOUNT_SERVICES.fieldApiName],
                yearEstablished: account[FIELD_ACCOUNT_YEAR_COMPANY_ESTABLISHED.fieldApiName],
                yearsWithEvolve: account[FIELD_ACCOUNT_YEARS_WITH_EVOLVE.fieldApiName],
                partnerActiveListings: account[FIELD_ACCOUNT_PARTNER_ACTIVE_LISTINGS.fieldApiName],
                distance: (Math.round(this.accountsJSON[account[FIELD_ACCOUNT_ID.fieldApiName]] * 100) / 100).toFixed(2),
                type: account[FIELD_ACCOUNT_TYPE.fieldApiName],
                bio: account[FIELD_ACCOUNT_BIO.fieldApiName],
                website: account[FIELD_ACCOUNT_WEBSITE.fieldApiName],
                partnerServices: this.listData.partnerServices[account[FIELD_ACCOUNT_ID.fieldApiName]].map((service) => {
                    return {
                        url: `/${service[FIELD_PARTNER_SERVICE_ID.fieldApiName]}`,
                        name: service[FIELD_PARTNER_SERVICE_NAME.fieldApiName],
                        service: service[FIELD_PARTNER_SERVICE_SERVICE.fieldApiName],
                        rateStructure: service[FIELD_PARTNER_SERVICE_RATE_STRUCTURE.fieldApiName],
                        feeType: service[FIELD_PARTNER_SERVICE_FEE_TYPE.fieldApiName],
                        flatRate:
                            service[FIELD_PARTNER_SERVICE_FEE_TYPE.fieldApiName] === "Flat Fee"
                                ? `Partner Rates Starting At: ${service[FIELD_PARTNER_SERVICE_FLAT_RATE.fieldApiName]}`
                                : "",
                        percentRate: service[FIELD_PARTNER_SERVICE_PERCENT_RATE.fieldApiName]
                            ? `Partner Percent Rate: ${service[FIELD_PARTNER_SERVICE_PERCENT_RATE.fieldApiName]}`
                            : ""
                    };
                })
            };
        });
        this.listData.accounts.sort(function (a, b) {
            return a.distance - b.distance;
        });
        this.listData.hasNoRecords = this.listData.accounts.length > 0 ? false : true;
    }

    //
    // TEMPLATE EVENTS HANDLERS
    //
    handleOpenMap() {
        this[NavigationMixin.Navigate](
            {
                type: "standard__webPage",
                attributes: {
                    url: `/apex/geopointe__Map?ds=${this.partnerServicesDataSetId}&id=${this.recordId}&runRadialSearch=true&range=30&units=mi`
                }
            },
            false
        );
    }
}