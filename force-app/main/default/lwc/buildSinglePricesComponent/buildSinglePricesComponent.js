import { LightningElement, api, wire } from 'lwc';
import APEX_getLastPricesModificationDate from '@salesforce/apex/SmartRatesEnrollmentController.getLastPricesModificationDate';
import APEX_getInitialStatus from '@salesforce/apex/SmartRatesEnrollmentController.getInitialStatus';
import APEX_startBuildingPrices from '@salesforce/apex/SmartRatesEnrollmentController.startBuildingPrices';
import APEX_getCurrentJobStatus from '@salesforce/apex/SmartRatesEnrollmentController.getCurrentJobStatus';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { DateTime } from 'c/luxon';


const INTERVAL_DELAY = 10000;
const JOB_NAME = 'Single Listing Build Prices';

const STATUS_FAILED = 'Failed';
const STATUS_READY = 'Ready';
const COMPLETED_STATUSES = ['Completed'];
const IN_PROCESS_STATUSES = ['Pending', 'In Queue', 'In Progress', 'Moved to Daily Job', 'Holding',  'Queued', 'Preparing', 'Processing', 'Single Listing Update Prices Job has been started.'];
const FAILED_STATUSES = ['Error', 'Aborted', STATUS_FAILED];

export default class BuildSinglePricesComponent extends LightningElement {
    @api recordId;

    // template data
    status = 'Press "Build Prices" button to start process.';
    statusMessage = '';
    lastPricesUpdatedDate = '';
    isStartButtonDisabled = false;
    isInProgress = true;

    // service trackers
    intervalId = 0;
    refresher = 0;
    jobStartedAt = null;


    //
    // GETTERS
    //

    get statusClass() {
        return [
            'slds-box slds-p-vertical_large',
            'slds-theme_info slds-theme_alert-texture',
            'slds-text-align_center',
            COMPLETED_STATUSES.includes(this.status) ? 'slds-theme_success' : '',
            FAILED_STATUSES.includes(this.status) ? 'slds-theme_error' : '',
            IN_PROCESS_STATUSES.includes(this.status) ? 'slds-theme_warning build-single-prices_animation-texture' : ''
        ].join(' ');
    }


    //
    // LIFECYCLE
    //

    connectedCallback() {
        this.getLastPricesModificationDate();
        this.getInitialStatus();
    }



    //
    // METHODS
    //

    @wire(APEX_getCurrentJobStatus, {
        listingId: '$recordId',
        jobName: JOB_NAME,
        jobStartTime: '$jobStartedAt',
        refresher: '$refresher'
    })
    wiresJobStatus({ error, data }) {
        if (data) {
            if (this.refresher > 0){
                this.status = data;
                this.statusMessage = '';

                if (COMPLETED_STATUSES.includes(data) || FAILED_STATUSES.includes(data)){
                    this.isInProgress = false;
                    this.isStartButtonDisabled = false;
                    this.stopIntervalUpdates();
                }
            }

        } else if (error) {
            console.log('WiredJobError -> ',error);
            this.statusMessage = error.body.message;
            this.status = STATUS_FAILED;
        }
    };


    getLastPricesModificationDate() {
        APEX_getLastPricesModificationDate({
            listingId: this.recordId
        })
            .then(result => {
                console.debug('GetLastPricesModificationDateResult -> ', result);
                this.lastPricesUpdatedDate = result;
            })
            .catch(error => console.log('GetLastPricesModificationDateError -> ', error));
    }

    getInitialStatus(){
        APEX_getInitialStatus({
            listingId: this.recordId,
            jobName: JOB_NAME
        })
            .then(result => {
                console.debug('GetInitialStatusResult -> ', result);

                if (result !== STATUS_READY) {
                    this.isStartButtonDisabled = true;

                    this.setupIntervalUpdate();
                    this.status = result;
                }
            })
            .catch(error => {
                console.log('GetInitialStatusError -> ', error);
                this.statusMessage = error.body.message;
                this.status = STATUS_FAILED;
                this.isStartButtonDisabled = true;
            })
            .finally(() => {
                this.isInProgress = false;
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
                this.setupIntervalUpdate();

                if (result !== `${JOB_NAME} Job has been started.`){
                    this.status = STATUS_FAILED;
                }
            })
            .catch(error => {
                console.log('StartBuildingPricesError -> ', error);
                this.statusMessage = error.body.message;
                this.status = STATUS_FAILED;
            })
            .finally(() => {
                this.isInProgress = false;
            })
    }

    setupIntervalUpdate() {
        this.intervalId = setInterval(() => {
            this.refresher++;
        }, INTERVAL_DELAY);
    }
    stopIntervalUpdates() {
        clearInterval(this.intervalId);
        this.refresher = 0;
    }



    //
    // TEMPLATE EVENTS HANDLERS
    //

    handleStart(){
        this.statusMessage = '';
        this.startBuildingPrices();
        this.isStartButtonDisabled = true;
    }

    handleBackToListing(){
        window.history.back();
    }

}