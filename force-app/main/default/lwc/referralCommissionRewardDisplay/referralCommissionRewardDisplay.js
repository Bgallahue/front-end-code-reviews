import { api, track, LightningElement } from 'lwc';
import { handleErrorMixin } from "c/utils";
import { CURRENCY_FORMAT, format } from 'c/formatter';
import APEX_loadRelatedRecords from "@salesforce/apex/Controller_FilteredRelatedList.loadRelatedRecords";

import { getFieldListFromMetadata, parseApexDataToMetadata } from 'c/metadataUtils';
import { getFields, MTD_CREDITDEBIT, MTD_TASK, MTD_TRANSACTION } from './metadata';
import OBJECT_CREDITDEBIT from '@salesforce/schema/Credit_Debit__c';
import OBJECT_TASK from '@salesforce/schema/Task';
import OBJECT_TRANSACTION from '@salesforce/schema/bt_stripe__Transaction__c';
import OBJECT_REFERRAL_COMMISSION from '@salesforce/schema/Referral_Commission__c';




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
                fields: getFields(OBJECT_CREDITDEBIT, getFieldListFromMetadata(MTD_CREDITDEBIT)),
                childObjectApiName: OBJECT_CREDITDEBIT.objectApiName,
                recordId: this.recordId,
                middleObjectFieldApiName: 'Commission_ID__c', // !!! TBD to import from schema
                middleObjectApiName: OBJECT_REFERRAL_COMMISSION.objectApiName,
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
            APEX_loadRelatedRecords({
                fields: getFields(OBJECT_TASK, getFieldListFromMetadata(MTD_TASK)),
                childObjectApiName: OBJECT_TASK.objectApiName,
                recordId: this.recordId,
                middleObjectFieldApiName: 'WhatId', // !!! TBD to import from schema
                middleObjectApiName: OBJECT_REFERRAL_COMMISSION.objectApiName,
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
            APEX_loadRelatedRecords({
                fields: getFields(OBJECT_TRANSACTION, getFieldListFromMetadata(MTD_TRANSACTION)),
                childObjectApiName: OBJECT_TRANSACTION.objectApiName,
                recordId: this.recordId,
                middleObjectFieldApiName: 'Referral_Commission_Id__c', // !!! TBD to import from schema
                middleObjectApiName: OBJECT_REFERRAL_COMMISSION.objectApiName,
                relatedFieldApiName: 'Id',
                whereClause: null
            }),
        ])
            .then(([credits, tasks, transactions]) => {
                this.data = [
                    ...credits[this.recordId]
                        .map(credit => parseApexDataToMetadata(MTD_CREDITDEBIT, credit))
                        .filter(credit => credit.RecordType.Name === 'Credit')
                        .map(credit => ({
                            Id: credit.Id,
                            Type: 'Credit/Debit',
                            RewardRecordUrl: `/lightning/r/Credit_Debit__c/${credit.Id}/view`,
                            Name: credit.Name,
                            AccountUrl: credit.Account__r ? `/lightning/r/Account/${credit.Account__r?.Id}/view` : '',
                            AccountName: credit.Account__r?.Name,
                            Amount: format(CURRENCY_FORMAT, credit.Initial_Amount__c),
                            Description: credit.Reason__c,
                            Status: credit.AllocationAppliedStatus__c,
                            CreatedDate: credit.CreatedDate
                        })),

                    ...tasks[this.recordId]
                        .map(task => parseApexDataToMetadata(MTD_TASK, task))
                        .filter(task => task.Subject === 'Partner Stripe Account Error')
                        .map(task => ({
                            Id: task.Id,
                            Type: 'Task',
                            RewardRecordUrl: `/lightning/r/Task/${task.Id}/view`,
                            Name: task.Who?.Name,
                            Amount: 'N/A',
                            Description: task.Subject,
                            Status: task.Status,
                            CreatedDate: task.CreatedDate,
                        })),

                    ...transactions[this.recordId]
                        .map(tr => parseApexDataToMetadata(MTD_TRANSACTION, tr))
                        .map(tr => ({
                            Id: tr.Id,
                            Type: 'Transaction',
                            RewardRecordUrl: `/lightning/r/bt_stripe__Transaction__c/${tr.Id}/view`,
                            Name: tr.Name,
                            AccountUrl: tr.bt_stripe__Related_Account__r ? `/lightning/r/Account/${tr.bt_stripe__Related_Account__r?.Id}/view` : '',
                            AccountName: tr.bt_stripe__Related_Account__r?.Name,
                            Amount: format(CURRENCY_FORMAT, tr.bt_stripe__Amount__c),
                            Description: tr.Reason_Type__c,
                            Status: tr.bt_stripe__Transaction_Status__c,
                            CreatedDate: tr.CreatedDate
                        }))
                ];
            })
            .catch(this.handleError)
            .finally(() => {
                this.loading = false;
            });
    }
}