import { LightningElement, track, api } from "lwc";
import { getSObjectValue } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import APEX_getContentVersionByParentId from "@salesforce/apex/Controller_Attachments.getContentVersionByParentId";
import APEX_getRelatedClaims from "@salesforce/apex/Controller_CaseToClaimFileCopy.getRelatedClaims";
import APEX_saveFiles from "@salesforce/apex/Controller_CaseToClaimFileCopy.saveFiles";

import FIELD_CONTENTVERSION_TITLE from "@salesforce/schema/ContentVersion.Title";
import FIELD_CONTENTVERSION_FILEEXTENSION from "@salesforce/schema/ContentVersion.FileExtension";
import FIELD_CONTENTVERSION_LASTMODIFIEDDATE from "@salesforce/schema/ContentVersion.LastModifiedDate";
import FIELD_CONTENTVERSION_CONTENTDOCUMENTID from "@salesforce/schema/ContentVersion.ContentDocumentId";
import FIELD_CLAIM_ID from "@salesforce/schema/Claims__c.Id";
import FIELD_CLAIM_RECORDTYPE_NAME from "@salesforce/schema/Claims__c.RecordType.Name";
import FIELD_CLAIM_NAME from "@salesforce/schema/Claims__c.Name";
import FIELD_CLAIM_BOOKING from "@salesforce/schema/Claims__c.Booking__c";
import FIELD_CLAIM_BOOKING_NAME from "@salesforce/schema/Claims__c.Booking__r.Name";

import { handleErrorMixin } from "c/utils";
import { sortBy } from "c/lodash";

const DATATABLE_COLUMNS = [
    { label: "File Name", fieldName: FIELD_CONTENTVERSION_TITLE.fieldApiName },
    { label: "Extension", fieldName: FIELD_CONTENTVERSION_FILEEXTENSION.fieldApiName },
    { label: "Date", fieldName: FIELD_CONTENTVERSION_LASTMODIFIEDDATE.fieldApiName, type: "date" }
];

export default class CaseToClaimFileCopy extends handleErrorMixin(LightningElement) {
    @api recordId;

    columns = DATATABLE_COLUMNS;

    @track data = {
        fileList: [],
        relatedClaimsList: []
    };

    @track state = {
        selectedFilesToCopy: [],
        selectedClaim: null,
        loading: false
    };

    //
    // GETTERS
    //
    get isCopyDisabled() {
        return this.state.selectedClaim === null || this.state.selectedFilesToCopy.length === 0;
    }

    get isShown() {
        return this.data.fileList.length !== 0 && this.data.relatedClaimsList !== 0;
    }

    //
    // LIFECYCLE
    //
    connectedCallback() {
        this.getData();
    }

    //
    // API METHODS
    //
    getData() {
        this.state.loading = true;
        Promise.all([
            APEX_getRelatedClaims({
                recordId: this.recordId
            }),
            APEX_getContentVersionByParentId({
                parentId: this.recordId
            })
        ])
            .then(([claims, contentVersions]) => {
                this.data.relatedClaimsList = claims.map((claim) => {
                    return {
                        label: `${getSObjectValue(claim, FIELD_CLAIM_RECORDTYPE_NAME)} ${getSObjectValue(
                            claim,
                            FIELD_CLAIM_NAME
                        )}${
                            getSObjectValue(claim, FIELD_CLAIM_BOOKING) != null
                                ? ` for Booking ${getSObjectValue(claim, FIELD_CLAIM_BOOKING_NAME)}`
                                : ""
                        }`,
                        value: getSObjectValue(claim, FIELD_CLAIM_ID)
                    };
                });
                this.data.fileList = sortBy(
                    contentVersions.map((cv) => {
                        return {
                            Id: cv.Id,
                            Title: cv[FIELD_CONTENTVERSION_TITLE.fieldApiName],
                            FileExtension: cv[FIELD_CONTENTVERSION_FILEEXTENSION.fieldApiName],
                            LastModifiedDate: cv[FIELD_CONTENTVERSION_LASTMODIFIEDDATE.fieldApiName],
                            ContentDocumentId: cv[FIELD_CONTENTVERSION_CONTENTDOCUMENTID.fieldApiName]
                        };
                    }),
                    // sort and reverse by date
                    [FIELD_CONTENTVERSION_LASTMODIFIEDDATE.fieldApiName]
                ).reverse();
            })
            .catch(this.handleError)
            .finally(() => {
                this.state.loading = false;
            });
    }

    saveFiles() {
        this.state.loading = true;
        APEX_saveFiles({
            recordId: this.state.selectedClaim,
            files: this.state.selectedFilesToCopy
        })
            .then((data) => {
                if (data === "success") {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success",
                            message: "Files have been copied",
                            variant: "success"
                        })
                    );
                } else {
                    this.handleError(data);
                }
            })
            .finally(() => {
                this.state.loading = false;
            });
    }

    //
    // TEMPLATE EVENTS HANDLERS
    //
    handleChangeClaim(event) {
        this.state.selectedClaim = event.detail.value;
    }

    handleSelectRow(event) {
        this.state.selectedFilesToCopy = event.detail.selectedRows;
    }

    handleClick() {
        this.saveFiles();
    }
}