import { NavigationMixin } from 'lightning/navigation';
import APEX_getUserPermissions from '@salesforce/apex/Controller_TripAssist.getUserPermissions';
import { handleErrorMixin } from 'c/utils';
import { format, CURRENCY_FORMAT } from 'c/formatter';
export { MTD_BOOKING, MTD_INQUIRY_LINE_ITEM, MTD_CANCELLATION_POLICY, MTD_ALLOCATION, MTD_TRANSACTION } from './metadata';


// general actions

export const ACTION_CANCEL = 'cancel';
export const ACTION_MODIFY = 'modify';


// line items states

export const STATE_DEFAULT = 'default';
export const STATE_REFUND = 'refund';
export const STATE_ADJUSTMENTS = 'adjustments';



// responsibility type

export const GUEST = 'Traveler';
export const OWNER = 'Owner';
export const EVOLVE = 'Evolve';

export const DEFAULT_REASONS = {
    [GUEST]: 'Traveler: Change In Plans',
    [OWNER]: 'Owner: Other',
    [EVOLVE]: 'Evolve: Other'
};




// navigation

export const getPageReference = (recordId, action) => ({
    type: 'standard__navItemPage',
    attributes: {
        apiName: 'TripAssist'
    },
    state: {
        c__recordId: recordId,
        c__action: action
    }
});

const actions = [ACTION_CANCEL, ACTION_MODIFY];
const permissions = {
    [ACTION_CANCEL]: 'ta_cancel',
    [ACTION_MODIFY]: 'ta_modify'
}

export const navigateToTripAssistMixin = LWC => class extends NavigationMixin(handleErrorMixin(LWC)) {
    navigateToTripAssist = (recordId, action) => {
        // validate action
        if (!actions.includes(action)) return;

        // check permissions
        APEX_getUserPermissions()
            .then(data => {
                // exit
                if (!data.includes(permissions[action])) {
                    this.handleError('You currently do not have access to this functionality.');
                    return;
                }

                // redirect
                this[NavigationMixin.Navigate](
                    getPageReference(recordId, action)
                );
            })
            .catch(this.handleError)

    }
};


// refund wrapper interface

export const getRefundAmountCopy = (cash, ftc) => {
    let refundCopy
    if (!cash && !ftc){
        refundCopy = 'will be nothing refunded or issued';
    } else {
        refundCopy = [
            cash && `will be refunded <b>${format(CURRENCY_FORMAT, cash)}</b> to the <b>credit card</b> on file`,
            ftc && `will be issued <b>${format(CURRENCY_FORMAT, ftc)}</b> in <b>FTC</b>`
        ].filter(t => !!t)
        .join(' and ')
    } 

    return `If cancelled now, the guest ${refundCopy}.`
}
export const getRefundTypeCopy = rules => {
    let copy = 'This booking is not eligible for a refund or FTC.';

    if (rules.length > 1) {
        copy = 'This is a partial refund.'

    } else if (rules.length === 1) {
        const percent = rules[0].Refund_Percent__c;
        if (percent === 100) copy = 'This is a full refund.';
        if (percent > 0 && percent < 100) copy = 'This is a partial refund.';
    }

    return copy;
}


export const refundView = (cash, ftc, rules = []) => ({
    cash,
    ftc,
    amountCopy: getRefundAmountCopy(cash, ftc),
    typeCopy: getRefundTypeCopy(rules)
});