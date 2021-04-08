import {LightningElement, track, api, wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import APEX_getLastPricesModificationDate from "@salesforce/apex/SmartRatesEnrollmentController.getLastPricesModificationDate";
import APEX_getInitialStatus from "@salesforce/apex/SmartRatesEnrollmentController.getInitialStatus";
import APEX_startBuildingPrices from "@salesforce/apex/SmartRatesEnrollmentController.startBuildingPrices";
import APEX_getCurrentJobStatus from '@salesforce/apex/SmartRatesEnrollmentController.getCurrentJobStatus';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { DateTime } from "c/luxon";


const COMPLETED_STATUSES = ['Completed'];
const IN_PROCESS_STATUSES = ['Pending', 'In Queue', 'In Progress', 'Moved to Daily Job', 'Holding',  'Queued', 'Preparing', 'Processing', 'Single Listing Update Prices Job has been started.'];
const FAILED_STATUSES = ['Error', 'Aborted', 'Failed'];

export default class BuildSinglePricesComponent extends NavigationMixin(LightningElement)  {
    @api recordId;

    refresher = 0;

    loadingMessage = "Loading Component";
    lastPricesUpdateDate = "";

    status = "Press \"Build Prices\" button to start process."; //display job status
    statusMessage = ""; //full info
    startBtnDisabled = false;

    jobStartedAt = null;

    inProgress = true;

    $ = {
        inited: false
    }

    updateTimer = {
        timer: null,
        timeoutSeconds: 10000
    }

    connectedCallback() {
        if (this.$.inited) return;
        this.getLastPricesModificationDate();
        this.getInitialStatus();
        this.$.inited = true;

    }

    //
    // methods
    //

    @wire(APEX_getCurrentJobStatus, { listingId: '$recordId', jobName: 'Single Listing Build Prices', jobStartTime: '$jobStartedAt', refresher: '$refresher'  })
    wiresJobStatus({ error, data }) {
        if (data) {
            if (this.refresher > 0){
                this.status = data;
                this.statusMessage = '';
                if (COMPLETED_STATUSES.includes(data) || FAILED_STATUSES.includes(data)){
                    this.inProgress = false;
                    this.startBtnDisabled = false;
                    clearInterval(this.updateTimer.timer);
                    this.refresher = 0;
                }
            }
        } else if (error) {
            console.log('WiredJobError -> ',error);
            this.statusMessage = error.body.message;
            this.status = 'Failed';
        }
    };

    buildPricesStart(){
        this.statusMessage = "";
        this.startBuildingPrices();
        this.startBtnDisabled = true;
    }

    backToListing(){
        window.history.back();
    }

    getLastPricesModificationDate() {
        APEX_getLastPricesModificationDate({
            listingId: this.recordId
        })
            .then(result => {
                console.debug('GetLastPricesModificationDateResult -> ', result);
                this.lastPricesUpdateDate = result;
            })
            .catch(error => {
                console.log('GetLastPricesModificationDateError -> ', error);
            });
    }

    getInitialStatus(){
        APEX_getInitialStatus({
            listingId: this.recordId,
            jobName: 'Single Listing Build Prices'
        })
            .then(result => {
                console.debug('GetInitialStatusResult -> ', result);

                if (result !== 'Ready'){
                    //this.statusMessage = result ? result : 'Unknown error';
                    this.startBtnDisabled = true;

                    this.updateStatus();
                    this.status = result;
                }
            })
            .catch(error => {
                console.log('GetInitialStatusError -> ', error);
                this.statusMessage = error.body.message;
                this.status = 'Failed';
                this.startBtnDisabled = true;
            }).finally(() => {
            this.inProgress = false;
        })
    }

    startBuildingPrices() {
        APEX_startBuildingPrices({
            listingId: this.recordId
        })
            .then(result => {
                console.debug('StartBuildingPricesResult -> ', result);
                this.status = result;
                this.jobStartedAt = DateTime.fromMillis(new Date().getTime(), {zone: TIME_ZONE}).toMillis();
                this.updateStatus();
                if (result !== 'Single Listing Update Prices Job has been started.'){
                    this.status = 'Failed';
                }
            })
            .catch(error => {
                console.log('StartBuildingPricesError -> ', error);
                this.statusMessage = error.body.message;
                this.status = 'Failed';
            })
            .finally(() => {
                this.inProgress = false;
            })
    }

    updateStatus() {
        this.updateTimer.timer = setInterval( () => {
            this.refresher++;
            // this.getCurrentJobStatus();
        }, this.updateTimer.timeoutSeconds);
    }

    //
    // getters
    //

    get LastPricesModificationDate(){
        return this.lastPricesUpdateDate;
    }

    get isStartBtnDisabled(){
        return this.startBtnDisabled;
    }

    get isInProgress(){
        return this.inProgress;
    }
    get statusClass(){
        console.log('###')
        if (COMPLETED_STATUSES.includes(this.status) ){
            return "slds-box slds-p-vertical_large slds-theme_alert-texture status-display status-display_succeeded";
        }
        if (FAILED_STATUSES.includes(this.status)){
            return "slds-box slds-p-vertical_large slds-theme_alert-texture status-display status-display_failed";
        }
        if (IN_PROCESS_STATUSES.includes(this.status)){
            return "slds-box slds-p-vertical_large slds-theme_alert-texture status-display status-display_info animation-texture";
        }
        return "slds-box slds-p-vertical_large slds-theme_alert-texture status-display ";
    }
}