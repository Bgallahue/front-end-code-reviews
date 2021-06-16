import {LightningElement, api, track} from "lwc";
import {handleErrorMixin} from 'c/utils';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {CloseActionScreenEvent} from 'lightning/actions';
import APEX_getEmailTemplateBody from '@salesforce/apex/Controller_sendEmailQuickAction.getEmailTemplateBody'
import APEX_sendEmail from '@salesforce/apex/Controller_sendEmailQuickAction.sendEmail'
import APEX_getListingContacts from '@salesforce/apex/Controller_sendEmailQuickAction.getListingContacts'

export default class SendEmailQuickAction extends handleErrorMixin(LightningElement) {
    @api recordId;
    @api emailTemplate="Owner_Introduction_to_Partner_Services";
    @api objectName="Listing__c";
    @api fieldToWho="Property_Owner__c";
    @api setAsActivity = false;
    // template data
    stepNumber = 0;
    selectedContact = null;
    @track listingContacts = [];
    @track
    email = {
        body: 'test body'
    }

    labels = {
        cancel: 'Cancel',
        send: 'Send Partner Info',
        next: 'Next',
        prev: 'Previous'
    };
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

    get getListingContactsOptions() {
        return this.listingContacts.map(contact => {
            return {
                label: `${contact.Contact__r.Name} ${contact.Role__c}`,
                value: contact.Contact__r.Id
            }
        })
    }

    get isSendButtonDisabled(){
        return this.selectedContact === null;
    }

    //
    // LIFECYCLE
    //
    connectedCallback() {
        this.setEmailTemplateBody();
    }

    renderedCallback(){
        console.log('record id',this.recordId)
        if (this.listingContacts.length === 0){
            this.getListingContacts();
        }
    }

    //
    // METHODS
    //
    getListingContacts() {
        APEX_getListingContacts({
            recordId: this.recordId
        })
            .then((data) => {
                console.log(JSON.parse(JSON.stringify(data)));
                this.listingContacts = data;
            })
            .catch(this.handleError);
    }

    setEmailTemplateBody() {
        APEX_getEmailTemplateBody({
            templateName: this.emailTemplate
        })
            .then(result => {
                this.email.body = result.replace(']]>', '');
            })
            .catch(this.handleError)

    }

    sendEmail() {
        APEX_sendEmail({
            recordId: this.recordId,
            templateName: this.emailTemplate,
            objectName: this.objectName,
            fieldToWho: this.fieldToWho,
            setAsActivity: this.setAsActivity
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
        if (event.target.label === this.labels.send) {
            this.sendEmail();
        } else if (event.target.label === this.labels.next) {
            this.stepNumber++;
        } else if (event.target.label === this.labels.next) {
            this.stepNumber--;
        } else {
            this.sendCancelEvent();
        }
    }
}