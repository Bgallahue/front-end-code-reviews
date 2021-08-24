// !Lightning/ Salesforce
import { LightningElement, api, wire, track } from "lwc";
import { updateRecord, getRecord, deleteRecord, getFieldValue } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import SYMBOLS_SVG from "@salesforce/contentAssetUrl/symbolssvg";
import { handleErrorMixin } from "c/utils";

// !Apex Methods
import createContentDistribution from "@salesforce/apex/UserProfile.createContentDistribution";
import uploadUserImage from "@salesforce/apex/UserProfile.uploadUserImage";

//! Fields
import USER_ID from "@salesforce/user/Id";
import PHOTO_URL_FIELD from "@salesforce/schema/User.FullPhotoUrl";
import IS_DELETED_FIELD from "@salesforce/schema/ContentVersion.isDeleted__c";
import ACCOUNT_FILE_TYPE_FIELD from "@salesforce/schema/ContentVersion.AccountFileType__c";
import CONTACT_ID_FIELD from "@salesforce/schema/User.ContactId";
import ACCOUNT_FIELD from "@salesforce/schema/Contact.AccountId";

// TOC
// !ATTRIBUTES
// !GETTERS/SETTER
// !CHANGE VIEWPORT
// !HANDLE USER INPUT
// !SAVE USER INPUT
// !MISC

export default class AccountImageUpload extends handleErrorMixin(LightningElement) {
    // !ATTRIBUTES
    @api ownerId;
    @api accountImage;
    userImage;
    newImage;
    @api uploadType;
    _getRecordResponse;
    @track contactId;

    // Viewport
    showModal = false;
    showSpinner = false;
    saveDisabled = true;

    // !GET RECORD INFORMATION
    //GET USER RECORD
    @wire(getRecord, { recordId: USER_ID, fields: [PHOTO_URL_FIELD, CONTACT_ID_FIELD] })
    userRecord(response) {
        this._getRecordResponse = response;
        let error = response && response.error;
        let data = response && response.data;
        if (data) {
            this.contactId = data.fields[CONTACT_ID_FIELD.fieldApiName].value;
            this.userImage = data.fields[PHOTO_URL_FIELD.fieldApiName].value;
            this.newImage = undefined;
        } else if (error) {
            this.handleError(error);
        }
    }

    @wire(getRecord, {
        recordId: "$contactId",
        fields: [ACCOUNT_FIELD]
    })
    handleContactResult({ error, data }) {
        if (data) {
            this.contact = { ...data };
        } else {
            this.handleError(error);
        }
    }

    get accountId() {
        return getFieldValue(this.contact, ACCOUNT_FIELD);
    }

    // !GETTERS/SETTER
    get userSymbolURL() {
        return SYMBOLS_SVG + "#user";
    }
    get photoSymbolURL() {
        return SYMBOLS_SVG + "#photo";
    }

    get acceptedFormats() {
        return [".jpg", ".gif", ".png", ".jpeg"];
    }

    get imagePresent() {
        return this.accountImage || this.newImage;
    }
    get imageURL() {
        if (this.newImage) {
            return this.newImage.ContentDownloadUrl;
        } else if (this.uploadType === "User") {
            return this.userImage;
        } else if (this.uploadType === "Account" && this.accountImage) {
            return this.accountImage.ContentDownloadUrl;
        }
        return undefined;
    }

    // !CHANGE VIEWPORT
    launchModal() {
        this.showModal = true;
    }

    initialCancel() {
        this.template.querySelector("c-prompt").show();
    }

    cancelFeedback() {
        this.template.querySelector("c-prompt").hide();
    }

    cancel() {
        this.showModal = false;
        this.template.querySelector("c-prompt").hide();
        if (this.newImage)
            this.updateContentVersion(
                {
                    Id: this.newImage.ContentVersionId,
                    [IS_DELETED_FIELD.fieldApiName]: true
                },
                false
            );
    }

    // !HANDLE USER INPUT
    handleFileInput(event) {
        this.saveDisabled = false;
        createContentDistribution({
            contentDocIds: [event.detail.files[0].documentId]
        })
            .then(result => {
                if (result) {
                    this.newImage = { ...result[0] };
                }
            })
            .catch(error => {
                this.handleError(error);
                this.saveDisabled = true;
            });
    }

    // !SAVE USER INPUT
    save() {
        this.showSpinner = true;
        if (this.newImage && this.uploadType === "Account") {
            // "Create" new Account Image
            this.updateContentVersion(
                {
                    Id: this.newImage.ContentVersionId,
                    [ACCOUNT_FILE_TYPE_FIELD.fieldApiName]: "Account Image"
                },
                true
            );

            if (this.accountImage)
                this.updateContentVersion(
                    {
                        Id: this.accountImage.ContentVersionId,
                        [IS_DELETED_FIELD.fieldApiName]: true
                    },
                    false
                );

            return;
        }

        if (this.newImage && this.uploadType === "User") {
            uploadUserImage({
                fileRecordId: this.newImage.ContentDocumentId
            })
                .then(() => {
                    this.showSpinner = false;

                    setTimeout(() => {
                        refreshApex(this._getRecordResponse);
                    }, 3000);
                    this.showModal = false;
                    this.saveDisabled = true;
                    deleteRecord(this.newImage.ContentDocumentId);
                })
                .catch(error => {
                    this.handleError(error);
                    this.showSpinner = false;
                    this.saveDisabled = true;
                });
        }
    }

    sendTask(subject) {
        this.dispatchEvent(new CustomEvent("task", { detail: subject }));
    }

    updateContentVersion(contentVersion, addImage) {
        updateRecord({ fields: contentVersion })
            .then(() => {
                this.showSpinner = false;

                this.updateApex();
                this.newImage = undefined;
                this.showModal = false;
                this.saveDisabled = true;
                if (addImage) this.sendTask("The business has added or updated a profile image");
            })
            .catch(error => {
                this.handleError(error);
                this.showSpinner = false;
                this.saveDisabled = true;
            });
    }

    // !MISC
    updateApex() {
        this.dispatchEvent(new CustomEvent("saving"));
    }
}