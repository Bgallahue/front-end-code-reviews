import { api, track, LightningElement } from 'lwc';
import LOCALE from '@salesforce/i18n/locale';
import CURRENCY from '@salesforce/i18n/currency';
import { handleErrorMixin } from "c/utils";
import APEX_loadRelatedRecords from "@salesforce/apex/Controller_FilteredRelatedList.loadRelatedRecords";

const COLUMNS = [
    {label: 'Type', fieldName: 'Type', type: 'text'},
    {label: 'Reward Record', fieldName: 'RewardRecordUrl', type: 'url', typeAttributes: {label: { fieldName: 'Name' },
            target: '_blank'}},
    {label: 'Account', fieldName: 'AccountUrl', type: 'url', typeAttributes: {label: { fieldName: 'AccountName' },
            target: '_blank'}},
    {label: 'Amount', fieldName: 'Amount', type: 'text', cellAttributes:{ alignment: 'right'}},
    {label: 'Description', fieldName: 'Description'},
    {label: 'Status', fieldName: 'Status'},
    {label: 'Created Date', fieldName: 'CreatedDate', type: 'date'},
];

export default class ReferralCommissionRewardDisplay extends handleErrorMixin(LightningElement) {
    @api recordId;

    // static
    COLUMNS = COLUMNS;

    // data
    @track data = [];
    loading = false;


    connectedCallback() {
        this.loading = true;
        Promise.all([
            APEX_loadRelatedRecords({
                fields: 'Name, RecordType.Name, Account__r.Id, Account__r.Name, Initial_Amount__c, Reason__c, AllocationAppliedStatus__c, CreatedDate',
                childObjectApiName: 'Credit_Debit__c',
                recordId: this.recordId,
                middleObjectFieldApiName: 'Commission_ID__c',
                middleObjectApiName: 'Referral_Commission__c',
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
            APEX_loadRelatedRecords({
                fields: 'Who.Name, What.Id, What.Name, Subject, Status, CreatedDate',
                childObjectApiName: 'Task',
                recordId: this.recordId,
                middleObjectFieldApiName: 'WhatId',
                middleObjectApiName: 'Referral_Commission__c',
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
            APEX_loadRelatedRecords({
                fields: 'Name, bt_stripe__Related_Account__r.Id, bt_stripe__Related_Account__r.Name, bt_stripe__Amount__c, Reason_Type__c, bt_stripe__Transaction_Status__c, CreatedDate',
                childObjectApiName: 'bt_stripe__Transaction__c',
                recordId: this.recordId,
                middleObjectFieldApiName: 'Referral_Commission_Id__c',
                middleObjectApiName: 'Referral_Commission__c',
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
        ])
            .then(([credits, tasks, transactions]) => {
                this.data = [];
                credits[this.recordId]
                    .filter(credit => credit.RecordType.Name === 'Credit')
                    .forEach(credit => {
                        this.data.push({
                            Id: credit.Id,
                            Type: 'Credit/Debit',
                            RewardRecordUrl: `/lightning/r/Credit_Debit__c/${credit.Id}/view`,
                            Name: credit.Name,
                            AccountUrl: credit.Account__r ? `/lightning/r/Account/${credit.Account__r?.Id}/view` : '',
                            AccountName: credit.Account__r?.Name,
                            Amount: this.formatCurrency(credit.Initial_Amount__c),
                            Description: credit.Reason__c,
                            Status: credit.AllocationAppliedStatus__c,
                            CreatedDate: credit.CreatedDate
                        });
                    });
                tasks[this.recordId]
                    .filter(task => task.Subject === 'Partner Stripe Account Error')
                    .forEach(task => {
                        this.data.push({
                            Id: task.Id,
                            Type: 'Task',
                            RewardRecordUrl: `/lightning/r/Task/${task.Id}/view`,
                            Name: task.Who?.Name,
                            Amount: 'N/A',
                            Description: task.Subject,
                            Status: task.Status,
                            CreatedDate: task.CreatedDate,
                        });
                    });
                transactions[this.recordId]
                    .forEach(tr => {
                        this.data.push({
                            Id: tr.Id,
                            Type: 'Transaction',
                            RewardRecordUrl: `/lightning/r/bt_stripe__Transaction__c/${tr.Id}/view`,
                            Name: tr.Name,
                            AccountUrl: tr.bt_stripe__Related_Account__r ? `/lightning/r/Account/${tr.bt_stripe__Related_Account__r?.Id}/view` : '',
                            AccountName: tr.bt_stripe__Related_Account__r?.Name,
                            Amount: this.formatCurrency(tr.bt_stripe__Amount__c),
                            Description: tr.Reason_Type__c,
                            Status: tr.bt_stripe__Transaction_Status__c,
                            CreatedDate: tr.CreatedDate
                        });
                    });
            })
            .catch(this.handleError)
            .finally(() => {
                this.loading = false;
            });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat(LOCALE, {
            style: 'currency',
            currency: CURRENCY,
            currencyDisplay: 'symbol'
        }).format(amount);
    }
}