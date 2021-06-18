import {LightningElement, api, track} from "lwc";
import {handleErrorMixin} from 'c/utils';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {CloseActionScreenEvent} from 'lightning/actions';
import APEX_getEmailTemplateBody from '@salesforce/apex/Controller_sendEmailQuickAction.getEmailTemplateBody'
import APEX_sendEmail from '@salesforce/apex/Controller_sendEmailQuickAction.sendEmail'
import APEX_getListingContacts from '@salesforce/apex/Controller_sendEmailQuickAction.getListingContacts'

const EMAIL_TEMPLATE_OWNER_INTRODUCTION_TO_PARTNER_SERVICES = "Owner_Introduction_to_Partner_Services";
const BUTTONS_LABELS = {
    CANCEL: 'Cancel',
    SEND: 'Send Partner Info',
    NEXT: 'Next',
    PREV: 'Previous'
};
export default class SendEmailQuickAction extends handleErrorMixin(LightningElement) {
    @api recordId;

    // template data
    stepNumber = 0;
    selectedContact = null;
    listingContactsOptions = [];
    isLoading = false;
    @track
    email = {
        body: null
    }

    buttonLabels = BUTTONS_LABELS;
    // service trackers

    //
    // GETTERS
    //

    get isFirstStep() {
        return this.stepNumber === 0;
    }

    get isSecondStep() {
        return this.stepNumber === 1;
    }

    //
    // LIFECYCLE
    //
    connectedCallback() {
        this.setEmailTemplateBody();
        this.getListingContacts();
    }

    //
    // METHODS
    //
    setEmailTemplateBody() {
        APEX_getEmailTemplateBody({
            templateName: EMAIL_TEMPLATE_OWNER_INTRODUCTION_TO_PARTNER_SERVICES
        })
            .then(result => {
                this.email.body = result.replace(']]>', '');
            })
            .catch(this.handleError)

    }

    getListingContacts() {
        APEX_getListingContacts({
            recordId: this.recordId
        })
            .then((data) => {
                this.listingContactsOptions = data.map(contact => {
                    return {
                        label: `${contact.Contact__r.Name} - ${contact.Role__c}`,
                        value: contact.Contact__r.Id
                    }
                });
            })
            .catch(this.handleError);
    }

    sendEmail() {
        isLoading = true;
        APEX_sendEmail({
            recordId: this.recordId,
            templateName: EMAIL_TEMPLATE_OWNER_INTRODUCTION_TO_PARTNER_SERVICES,
            toWho: this.selectedContact,
            setAsActivity: false
        })
            .then(() => {
                const event = new ShowToastEvent({
                    message: 'Email was sent successfully',
                    variant: 'success'
                });
                this.dispatchEvent(event);
            })
            .catch(this.handleError)
            .finally(() => {
                    isLoading = false;
                    this.sendCancelEvent();
                }
            )
    }

    sendCancelEvent() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    //
    // TEMPLATE EVENTS HANDLERS
    //
    handleClick(event) {
        if (event.target.label === BUTTONS_LABELS.SEND) {
            this.sendEmail();
        } else if (event.target.label === BUTTONS_LABELS.NEXT) {
            this.stepNumber++;
        } else if (event.target.label === BUTTONS_LABELS.PREV) {
            this.stepNumber--;
        } else {
            this.sendCancelEvent();
        }
    }

    handleSelectContact(event){
        this.selectedContact = event.detail.value;
    }
}