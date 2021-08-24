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

import FIELD_BOOKING_PAYMENT_METHOD_BRAND from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Brand__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_LAST_4_DIGIT from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Last_4_Digit__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_MONTH from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Expiration_Month__c';
import FIELD_BOOKING_PAYMENT_METHOD_CARD_EXPIRATION_YEAR from '@salesforce/schema/Booking__c.Payment_Method__r.bt_stripe__Card_Expiration_Year__c';


import FIELD_INQUIRY_LINE_ITEM_ID from '@salesforce/schema/Inquiry_Line_Item__c.Id';
import FIELD_INQUIRY_LINE_ITEM_NAME from '@salesforce/schema/Inquiry_Line_Item__c.Name';
import FIELD_INQUIRY_LINE_ITEM_TOTAL_AMOUNT from '@salesforce/schema/Inquiry_Line_Item__c.Total_Amount__c';
import FIELD_INQUIRY_LINE_ITEM_TYPE from '@salesforce/schema/Inquiry_Line_Item__c.Type__c';



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