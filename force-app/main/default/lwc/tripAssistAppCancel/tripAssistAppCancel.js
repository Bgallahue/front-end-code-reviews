import { LightningElement, api, track, wire} from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { unproxy, handleErrorMixin, handleChangeFactory, makeOptionsFromArray } from 'c/utils';
import { getFieldListFromMetadata, parseUIApiDataToMetadata } from 'c/metadataUtils';

import APEX_cancelBooking from '@salesforce/apex/Controller_TripAssist.cancelBooking';
import APEX_getPicklistValues from '@salesforce/apex/OB_Picklist_Controller.getPicklistValues';

import { MTD_BOOKING, ACTION_CANCEL } from 'c/tripAssistUtils';
import { GUEST, OWNER, EVOLVE, patternsMap, parseReasonPicklistValues, CANCELLATION_FEE_TRUE, CANCELLATION_FEE_FALSE, OWNER_PAYOUT_TRUE, OWNER_PAYOUT_FALSE, getRefundCopy } from './helper';



export default class TripAssistAppCancel extends handleErrorMixin(LightningElement) {
    @api recordId;

    // data
    @track booking = parseUIApiDataToMetadata(MTD_BOOKING);
    @track lineItems = [];

    // state
    isCommitted = false;
    isLoading = false;

    @track form = {
        responsibility: GUEST,
        reason: "",
    
        cancellationFee: null,
        ownerPayout: null
    }
    @track refund = null;

    // static
    ACTION = ACTION_CANCEL;

    responsibilityOptions = makeOptionsFromArray(Object.values(patternsMap));
    reasonOptionsByResponsibility = parseReasonPicklistValues([]);
    cancellationFeeOptions = makeOptionsFromArray([CANCELLATION_FEE_TRUE, CANCELLATION_FEE_FALSE]);
    ownerPayoutOptions = makeOptionsFromArray([OWNER_PAYOUT_TRUE, OWNER_PAYOUT_FALSE]);

    //cancel booking email modal
    isConfirmationModalOpen = false;
    @track sendEmailsTo = {
        all: false,
        guest: false,
        owner: false,
        partner: false
    }

    //result step
    isResultVisible = false;


    //
    // LIFECYCLE
    //

    connectedCallback() {
        this.cancelBooking(false);
    }

    //
    // GETTERS
    //

    get isGuest() {
        return this.form.responsibility === GUEST;
    }
    get isOwner() {
        return this.form.responsibility === OWNER;
    }
    get isEvolve() {
        return this.form.responsibility === EVOLVE;
    }

    // form
    get reasonOptions() {
        return this.reasonOptionsByResponsibility[this.form.responsibility];
    }
    get isFormValid() {
        return !(
            !this.form.responsibility ||
            !this.form.reason ||
            (this.isOwner && !this.form.cancellationFee) ||
            (this.isEvolve && !this.form.ownerPayout)
        );
    }
    get responsibleValue() {
        if (this.isGuest) return null;
        if (this.isEvolve && this.form.ownerPayout === OWNER_PAYOUT_TRUE) return 'Evolve Only';
        if (this.isEvolve && this.form.ownerPayout === OWNER_PAYOUT_FALSE) return 'Both Owner and Evolve';
        if (this.isOwner && this.form.cancellationFee === CANCELLATION_FEE_TRUE) return 'Owner Only';
        if (this.isOwner && this.form.cancellationFee === CANCELLATION_FEE_FALSE) return 'Both Owner and Evolve';
    }

    // changes state
    get isRefreshRequired() {
        return this.isFormValid && !this.isCommitted;
    }
    /*get state() {
        return this.isRefreshed || this.isRefreshRequired ? STATE_REFUND : STATE_DEFAULT;
    }*/


    // buttons
    get isDisabledRefresh() {
        return !this.isRefreshRequired;
    }
    get isDisabledSubmit() {
        return !this.isCommitted;
    }

    //refund from original booking
    get isRefundFromOriginalBookingVisible(){
        return {
            warningSection: this.form.responsibility !== GUEST,
            successSection: this.form.responsibility !== GUEST
        }
    }

    //
    // DATA LOADERS
    //

    // load booking by recordId
    @wire(getRecord, {
        recordId: '$recordId',
        fields: getFieldListFromMetadata(MTD_BOOKING)
    })
    wiredBooking({error, data}) {
        if (error) {
            this.handleError(error);

        } else if (data) {
            this.booking = parseUIApiDataToMetadata(MTD_BOOKING, data);
        }
    }

    // reason picklist values
    @wire(APEX_getPicklistValues, {
        objectApiName: 'Booking__c',
        fieldName: 'Reason__c'
    })
    wiredPicklistValues({error, data}) {
        if (error) {
            this.handleError(error);

        } else if (data) {
            console.log(unproxy(data))
            this.reasonOptionsByResponsibility = parseReasonPicklistValues(data);
        }
    }



    //
    // METHODS
    //

    cancelBooking(isFullProcess) {
        console.log({
            bookingId: this.recordId,
            cancellationFault: this.form.reason,
            responsibleValue: this.responsibleValue,
            isFullProcess
        });
        this.isLoading = true;
        APEX_cancelBooking({
            bookingId: this.recordId,
            cancellationFault: this.form.reason ? this.form.reason : DEFAULT_REASONS.GUEST,
            responsibleValue: this.responsibleValue,
            isFullProcess
        })
            .then(data => {
                console.log(unproxy(data));
                // commit state
                this.isCommitted = true;

                // apply data to details
                const {refundAmount, refundFTCAmount} = data;

                this.refund = {
                    cash: refundAmount,
                    ftc: refundFTCAmount,
                    copy: getRefundCopy(refundAmount, refundFTCAmount)
                }

                console.log(refundAmount, refundFTCAmount);

                // apply data to line items
                this.template.querySelector('c-trip-assist-line-items').setRefund(data);
            })
            .catch(this.handleError)
            .finally(() => {
                this.isLoading = false;
                if (isFullProcess) {
                    this.isResultVisible = true
                }
            })
    }



    //
    // TEMPLATE EVENTS HANDLERS
    //

    handleChange = handleChangeFactory({
        propertyDefinition: event => this.form,
        onApplyCallback: ({target}) => {
            // was updated
            this.isCommitted = false;

            // reset values on Responsibility
            if (target.name === 'responsibility') {
                this.form = {
                    ...this.form,
                    reason: '',
                    cancellationFee: null,
                    ownerPayout: null
                };
            }

            // refresh if GUEST selected
            if (target.name === 'responsibility' && target.value === GUEST){
                this.cancelBooking(false);
            }
        }
    });

    handleRefresh() {
        this.cancelBooking(false);
    }

    handleSubmit() {
        this.cancelBooking(true);
        this.isConfirmationModalOpen = false;
    }

    openConfirmationModal(){
        this.isConfirmationModalOpen = true;
    }

    handleCloseConfirmationModal(){
        this.isConfirmationModalOpen = false;
    }

    handleSendEmailsChange(e){
        this.sendEmailsTo[e.target.name] = e.target.checked;

        if (e.target.name === "all" && e.target.checked){
            this.sendEmailsTo.guest = true;
            this.sendEmailsTo.owner = true;
            this.sendEmailsTo.partner = true;
        } else if (e.target.name !== "all" && !e.target.checked){
            this.sendEmailsTo.all = false;
        }
    }

    handleHideResults(){
        this.isResultVisible = false;
    }

    handleRefundFromOriginalBooking(){

    }

    handleRevertToCurrentBooking(){

    }

    handleDualInputChange(){

    }

}