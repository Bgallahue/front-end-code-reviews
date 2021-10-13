import { FIELD, DEFAULT } from 'c/metadataUtils';


import FIELD_CREDITDEBIT_NAME from '@salesforce/schema/Credit_Debit__c.Name';
import FIELD_CREDITDEBIT_RECORD_TYPE from '@salesforce/schema/Credit_Debit__c.RecordType.Name';
import FIELD_CREDITDEBIT_ACCOUNT_ID from '@salesforce/schema/Credit_Debit__c.Account__r.Id';
import FIELD_CREDITDEBIT_ACCOUNT_NAME from '@salesforce/schema/Credit_Debit__c.Account__r.Name';
import FIELD_CREDITDEBIT_INITIAL_AMOUNT from '@salesforce/schema/Credit_Debit__c.Initial_Amount__c';
import FIELD_CREDITDEBIT_REASON from '@salesforce/schema/Credit_Debit__c.Reason__c';
import FIELD_CREDITDEBIT_ALLOCATION_STATUS from '@salesforce/schema/Credit_Debit__c.AllocationAppliedStatus__c';
import FIELD_CREDITDEBIT_CREATED_DATE from '@salesforce/schema/Credit_Debit__c.CreatedDate';

import FIELD_TASK_WHO_NAME from '@salesforce/schema/Task.Who.Name';
import FIELD_TASK_WHAT_ID from '@salesforce/schema/Task.What.Id';
import FIELD_TASK_WHAT_NAME from '@salesforce/schema/Task.What.Name';
import FIELD_TASK_SUBJECT from '@salesforce/schema/Task.Subject';
import FIELD_TASK_STATUS from '@salesforce/schema/Task.Status';
import FIELD_TASK_CREATED_DATE from '@salesforce/schema/Task.CreatedDate';

import FIELD_TRANSACTION_NAME from '@salesforce/schema/bt_stripe__Transaction__c.Name';
import FIELD_TRANSACTION_ACCOUNT_ID from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Related_Account__r.Id';
import FIELD_TRANSACTION_ACCOUNT_NAME from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Related_Account__r.Name';
import FIELD_TRANSACTION_AMOUNT from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Amount__c';
import FIELD_TRANSACTION_REASON_TYPE from '@salesforce/schema/bt_stripe__Transaction__c.Reason_Type__c';
import FIELD_TRANSACTION_STATUS from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Transaction_Status__c';
import FIELD_TRANSACTION_CREATED_DATE from '@salesforce/schema/bt_stripe__Transaction__c.CreatedDate';


export const getFields = (obj, fields = []) => fields.map(f => f.fieldApiName.replace(obj.objectApiName+'.', ''));



export const MTD_CREDITDEBIT = {
    Name: {
        [FIELD]: FIELD_CREDITDEBIT_NAME,
        [DEFAULT]: ''
    },
    RecordType: {
        Name: {
            [FIELD]: FIELD_CREDITDEBIT_RECORD_TYPE,
            [DEFAULT]: ''
        }
    },
    Account__r: {
        Id: {
            [FIELD]: FIELD_CREDITDEBIT_ACCOUNT_ID,
            [DEFAULT]: ''
        },
        Name: {
            [FIELD]: FIELD_CREDITDEBIT_ACCOUNT_NAME,
            [DEFAULT]: ''
        }
    },
    Initial_Amount__c: {
        [FIELD]: FIELD_CREDITDEBIT_INITIAL_AMOUNT,
        [DEFAULT]: 0
    },
    Reason__c: {
        [FIELD]: FIELD_CREDITDEBIT_REASON,
        [DEFAULT]: ''
    },
    AllocationAppliedStatus__c: {
        [FIELD]: FIELD_CREDITDEBIT_ALLOCATION_STATUS,
        [DEFAULT]: ''
    },
    CreatedDate: {
        [FIELD]: FIELD_CREDITDEBIT_CREATED_DATE,
        [DEFAULT]: ''
    }
}


export const MTD_TASK = {
    Who: {
        Name: {
            [FIELD]: FIELD_TASK_WHO_NAME,
            [DEFAULT]: ''
        }
    },
    What: {
        Id: {
            [FIELD]: FIELD_TASK_WHAT_ID,
            [DEFAULT]: ''
        },
        Name: {
            [FIELD]: FIELD_TASK_WHAT_NAME,
            [DEFAULT]: ''
        }
    },
    Subject: {
        [FIELD]: FIELD_TASK_SUBJECT,
        [DEFAULT]: ''
    },
    Status: {
        [FIELD]: FIELD_TASK_STATUS,
        [DEFAULT]: ''
    },
    CreatedDate: {
        [FIELD]: FIELD_TASK_CREATED_DATE,
        [DEFAULT]: ''
    }
}


export const MTD_TRANSACTION = {
    Name: {
        [FIELD]: FIELD_TRANSACTION_NAME,
        [DEFAULT]: ''
    },
    bt_stripe__Related_Account__r: {
        Id: {
            [FIELD]: FIELD_TRANSACTION_ACCOUNT_ID,
            [DEFAULT]: ''
        },
        Name: {
            [FIELD]: FIELD_TRANSACTION_ACCOUNT_NAME,
            [DEFAULT]: ''
        }
    },
    bt_stripe__Amount__c: {
        [FIELD]: FIELD_TRANSACTION_AMOUNT,
        [DEFAULT]: 0
    },
    Reason_Type__c: {
        [FIELD]: FIELD_TRANSACTION_REASON_TYPE,
        [DEFAULT]: ''
    },
    bt_stripe__Transaction_Status__c: {
        [FIELD]: FIELD_TRANSACTION_STATUS,
        [DEFAULT]: ''
    },
    CreatedDate: {
        [FIELD]: FIELD_TRANSACTION_CREATED_DATE,
        [DEFAULT]: ''
    }
}
