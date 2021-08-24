import { format, CURRENCY_FORMAT } from 'c/formatter';

export const GUEST = 'Guest';
export const OWNER = 'Owner';
export const EVOLVE = 'Evolve';


// Reason__c options parser
export const patternsMap = {
    'Traveler: ': GUEST,
    'Owner: ': OWNER,
    'Evolve: ': EVOLVE
}

export const parseReasonPicklistValues = options => Object.keys(patternsMap).reduce((acc, p) => ({
    ...acc,
    [patternsMap[p]]: options
        .filter(o => String(o.value).includes(p))
        .map(({label, value}) => ({
            label: label.replace(p, ''),
            value
        }))
        .sort((a, b) => { // custom sort
            if (a.label === 'Other') return 1;
            if (b.label === 'Other') return -1;
            return a.label < b.label ? -1 : 1;
        })
}), {});


// toggles values
export const CANCELLATION_FEE_TRUE = 'Charge Cancellation Fee';
export const CANCELLATION_FEE_FALSE = 'Do Not Charge Cancellation Fee';
export const OWNER_PAYOUT_TRUE = 'Owner Gets Full Payout';
export const OWNER_PAYOUT_FALSE = 'Owner Does Not Get Full Payout';


// refund copy text
export const getRefundCopy = (cash, ftc) => {
    if (!cash && !ftc) return 'If cancelled now, the guest will be nothing refunded or issued.';

    return 'If cancelled now, the guest '+
    [
        cash && `will be refunded ${format(CURRENCY_FORMAT, cash)} to the credit card on file`,
        ftc && `will be issued ${format(CURRENCY_FORMAT, ftc)} in FTC`
    ].filter(t => !!t).join(' and ')
    +'.';
}