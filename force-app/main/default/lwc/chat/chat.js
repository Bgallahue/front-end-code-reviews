import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import APEX_getComments from '@salesforce/apex/Chat_Controller.getComments';
import APEX_saveComment from '@salesforce/apex/Chat_Controller.saveComment';
import { unproxy, handleErrorMixin, handleChangeFactory } from 'c/utils';

const MODEL = {
    text: '',
    isPublic: true
};

export default class Chat extends handleErrorMixin(LightningElement) {
    @api recordId;

    // state
    @track loading = {
        list: false,
        save: false
    };
    @track form = unproxy(MODEL);
    @track comments = [];


    //
    // GETTERS
    //

    get disableSave() {
        return !this.form.text.trim();
    }


    //
    // LIFECYCLE
    //

    connectedCallback() {
        this.loadListData();
    }


    //
    // METHODS
    //

    loadListData() {
        this.loading.list = true;
        APEX_getComments({
            recordId: this.recordId
        })
            .then(data => {
                this.comments = data.map((c,i) => ({
                    key: c.Id,
                    date: c.CreatedDate,
                    name: c.externalComment ? c.CreatedByName : c.FirstName,
                    message: c.CommentBody || '',
                    itemClass: [
                        'slds-p-vertical_large',
                        (i > 0 ? 'slds-border_bottom' : '')
                    ].join(' ')
                })).reverse();
            })
            .catch(this.handleError)
            .finally(() => {
                this.loading.list = false;
            });
    }


    //
    // TEMPLATE EVENTS HANDLERS
    //

    handleChange = handleChangeFactory({
        propertyDefinition: (event) => this.form
    });

    handleSave(event) {
        // prevent auto-submit form
        //event.stopPropagation();
        //event.preventDefault();

        // validation
        if (!this.form.text) return; 

        // loading
        this.loading.save = true;

        // call save
        APEX_saveComment({
            recordId: this.recordId,
            body: this.form.text,
            published: this.form.isPublic
        })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Your Comment has been saved',
                        variant: 'success'
                    })
                );
                this.loadListData();

                // reset form, doesn't need a separate method
                this.form = unproxy(MODEL);
            })
            .catch(this.handleError)
            .finally(() => {
                this.loading.save = false;
            });
    }

}