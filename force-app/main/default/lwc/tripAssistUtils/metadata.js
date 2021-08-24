import { FIELD, DEFAULT } from 'c/metadataUtils';

import FIELD_BOOKING_ID from '@salesforce/schema/Booking__c.Id';
import FIELD_BOOKING_NAME from '@salesforce/schema/Booking__c.Name';
import FIELD_BOOKING_CHECKIN from '@salesforce/schema/Booking__c.Check_In__c';
import FIELD_BOOKING_CHECKOUT from '@salesforce/schema/Booking__c.Check_Out__c';
import FIELD_BOOKING_GUEST_SHORT_NAME from '@salesforce/schema/Booking__c.Guest_Short_Name__c';
import FIELD_BOOKING_PRIMARY_PHONE from '@salesforce/schema/Booking__c.Primary_Phone__c';
import FIELD_BOOKING_REFERRAL_SOURCE from '@salesforce/schema/Booking__c.ReferralSource__c';
import FIELD_BOOKING_RESERVATION_EMAIL from '@salesforce/schema/Booking__c.Reservation_Email__c';
import FIELD_BOOKING_STATUS from '@salesforce/schema/Booking__c.Status__c';
import FIELD_BOOKING_ADULTS from '@salesforce/schema/Booking__c.Adults__c';
import FIELD_BOOKING_CHILDREN from '@salesforce/schema/Booking__c.Children__c';
import FIELD_BOOKING_INFANTS from '@salesforce/schema/Booking__c.Infants__c';
import FIELD_BOOKING_LISTING from '@salesforce/schema/Booking__c.Listing__c';
import FIELD_BOOKING_CANCELLATION_POLICY from '@salesforce/schema/Booking__c.Cancellation_Policy_at_Time_of_Booking__c';
import FIELD_BOOKING_DAYS_UNTIL_CHECKIN from '@salesforce/schema/Booking__c.DaysUntilCheckin__c';
import FIELD_BOOKING_TOTAL_AMOUNT from '@salesforce/schema/Booking__c.Total_Amount__c';
import FIELD_BOOKING_CLOSE_DATE from '@salesforce/schema/Booking__c.Booking_Close_Date__c';

import FIELD_BOOKING_PAYMENT_METHOD_BRAND from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Brand__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_LAST_4_DIGIT from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Last_4_Digit__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_MONTH from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Expiration_Month__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_YEAR from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Expiration_Year__c';


import FIELD_INQUIRY_LINE_ITEM_ID from '@salesforce/schema/Inquiry_Line_Item__c.Id';
import FIELD_INQUIRY_LINE_ITEM_NAME from '@salesforce/schema/Inquiry_Line_Item__c.Name';
import FIELD_INQUIRY_LINE_ITEM_TOTAL_AMOUNT from '@salesforce/schema/Inquiry_Line_Item__c.Total_Amount__c';
import FIELD_INQUIRY_LINE_ITEM_TYPE from '@salesforce/schema/Inquiry_Line_Item__c.Type__c';

import FIELD_CANCELLATION_POLICY_ID from '@salesforce/schema/Cancellation_Policy__c.Id';
import FIELD_CANCELLATION_POLICY_DESCRIPTION from '@salesforce/schema/Cancellation_Policy__c.Cancel_Policy_Description__c';

import FIELD_ALLOCATION_ID from '@salesforce/schema/Allocation__c.Id';
import FIELD_ALLOCATION_NAME from '@salesforce/schema/Allocation__c.Name';
import FIELD_ALLOCATION_AMOUNT from '@salesforce/schema/Allocation__c.Amount__c';

import FIELD_TRANSACTION_ID from '@salesforce/schema/bt_stripe__Transaction__c.Id';
import FIELD_TRANSACTION_NAME from '@salesforce/schema/bt_stripe__Transaction__c.Name';
import FIELD_TRANSACTION_STATUS from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Transaction_Status__c';
import FIELD_TRANSACTION_AMOUNT from '@salesforce/schema/bt_stripe__Transaction__c.bt_stripe__Amount__c';

export const MTD_BOOKING = {
    Id: {
        [FIELD]: FIELD_BOOKING_ID,
        [DEFAULT]: ''
    },
    Name: {
        [FIELD]: FIELD_BOOKING_NAME,
        [DEFAULT]: ''
    },
    Status__c: {
        [FIELD]: FIELD_BOOKING_STATUS,
        [DEFAULT]: ''
    },
    Check_In__c: {
        [FIELD]: FIELD_BOOKING_CHECKIN,
        [DEFAULT]: ''
    },
    Check_Out__c: {
        [FIELD]: FIELD_BOOKING_CHECKOUT,
        [DEFAULT]: ''
    },
    ReferralSource__c: {
        [FIELD]: FIELD_BOOKING_REFERRAL_SOURCE,
        [DEFAULT]: ''
    },
    Guest_Short_Name__c: {
        [FIELD]: FIELD_BOOKING_GUEST_SHORT_NAME,
        [DEFAULT]: ''
    },
    Reservation_Email__c: {
        [FIELD]: FIELD_BOOKING_RESERVATION_EMAIL,
        [DEFAULT]: ''
    },
    Primary_Phone__c: {
        [FIELD]: FIELD_BOOKING_PRIMARY_PHONE,
        [DEFAULT]: ''
    },
    Adults__c: {
        [FIELD]: FIELD_BOOKING_ADULTS,
        [DEFAULT]: 0
    },
    Children__c: {
        [FIELD]: FIELD_BOOKING_CHILDREN,
        [DEFAULT]: 0
    },
    Infants__c: {
        [FIELD]: FIELD_BOOKING_INFANTS,
        [DEFAULT]: 0
    },
    Listing__c: {
        [FIELD]: FIELD_BOOKING_LISTING,
        [DEFAULT]: null
    },
    Cancellation_Policy_at_Time_of_Booking__c: {
        [FIELD]: FIELD_BOOKING_CANCELLATION_POLICY,
        [DEFAULT]: null
    },
    DaysUntilCheckin__c: {
        [FIELD]: FIELD_BOOKING_DAYS_UNTIL_CHECKIN,
        [DEFAULT]: 0
    },
    Total_Amount__c: {
        [FIELD]: FIELD_BOOKING_TOTAL_AMOUNT,
        [DEFAULT]: 0
    },
    Booking_Close_Date__c: {
        [FIELD]: FIELD_BOOKING_CLOSE_DATE,
        [DEFAULT]: 0
    },

    Payment_Method__r: {
        bt_stripe__Brand__c: {
            [FIELD]: FIELD_BOOKING_PAYMENT_METHOD_BRAND,
            [DEFAULT]: ''
        },
        bt_stripe__Card_Last_4_Digit__c: {
            [FIELD]: FIELD_BOOKING_PAYMENT_METHOD_CARD_LAST_4_DIGIT,
            [DEFAULT]: ''
        },
        bt_stripe__Card_Expiration_Month__c: {
            [FIELD]: FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_MONTH,
            [DEFAULT]: ''
        },
        bt_stripe__Card_Expiration_Year__c	: {
            [FIELD]: FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_YEAR,
            [DEFAULT]: ''
        },
                
    }
};


export const MTD_INQUIRY_LINE_ITEM = {
    Id: {
        [FIELD]: FIELD_INQUIRY_LINE_ITEM_ID,
        [DEFAULT]: ''
    },
    Name: {
        [FIELD]: FIELD_INQUIRY_LINE_ITEM_NAME,
        [DEFAULT]: ''
    },
    Total_Amount__c: {
        [FIELD]: FIELD_INQUIRY_LINE_ITEM_TOTAL_AMOUNT,
        [DEFAULT]: 0
    },
    Type__c: {
        [FIELD]: FIELD_INQUIRY_LINE_ITEM_TYPE,
        [DEFAULT]: ''
    }
};

export const MTD_ALLOCATION = {
    Id: {
        [FIELD]: FIELD_ALLOCATION_ID,
        [DEFAULT]: ''
    },
    Name: {
        [FIELD]: FIELD_ALLOCATION_NAME,
        [DEFAULT]: ''
    },
    Amount__c: {
        [FIELD]: FIELD_ALLOCATION_AMOUNT,
        [DEFAULT]: 0
    }
};

export const MTD_TRANSACTION = {
    Id: {
        [FIELD]: FIELD_TRANSACTION_ID,
        [DEFAULT]: ''
    },
    Name: {
        [FIELD]: FIELD_TRANSACTION_NAME,
        [DEFAULT]: ''
    },
    bt_stripe__Transaction_Status__c: {
        [FIELD]: FIELD_TRANSACTION_STATUS,
        [DEFAULT]: ''
    },
    bt_stripe__Amount__c: {
        [FIELD]: FIELD_TRANSACTION_AMOUNT,
        [DEFAULT]: 0
    }
};

export const MTD_CANCELLATION_POLICY = {
    Id: {
        [FIELD]: FIELD_CANCELLATION_POLICY_ID,
        [DEFAULT]: ''
    },
    Cancel_Policy_Description__c: {
        [FIELD]: FIELD_CANCELLATION_POLICY_DESCRIPTION,
        [DEFAULT]: ''
    }
}