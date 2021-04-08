import { LightningElement, track, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import APEX_getLastPricesModificationDate from '@salesforce/apex/SmartRatesEnrollmentController.getLastPricesModificationDate';
import APEX_getInitialStatus from '@salesforce/apex/SmartRatesEnrollmentController.getInitialStatus';
import APEX_startBuildingPrices from '@salesforce/apex/SmartRatesEnrollmentController.startBuildingPrices';
import APEX_getCurrentJobStatus from '@salesforce/apex/SmartRatesEnrollmentController.getCurrentJobStatus';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { DateTime } from 'c/luxon';


const STATUS_FAILED = 'Failed';
const STATUS_READY = 'Ready';
const COMPLETED_STATUSES = ['Completed'];
const IN_PROCESS_STATUSES = ['Pending', 'In Queue', 'In Progress', 'Moved to Daily Job', 'Holding',  'Queued', 'Preparing', 'Processing', 'Single Listing Update Prices Job has been started.'];
const FAILED_STATUSES = ['Error', 'Aborted', STATUS_FAILED];

export default class BuildSinglePricesComponent extends NavigationMixin(LightningElement)  {
    @api recordId;

    // template data
    status = 'Press "Build Prices" button to start process.';
    statusMessage = '';
    lastPricesUpdatedDate = '';
    isStartButtonDisabled = false;
    isInProgress = true;

    // service trackers
    refresher = 0;
    jobStartedAt = null;

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
                    this.isInProgress = false;
                    this.isStartButtonDisabled = false;
                    clearInterval(this.updateTimer.timer);
                    this.refresher = 0;
                }
            }
        } else if (error) {
            console.log('WiredJobError -> ',error);
            this.statusMessage = error.body.message;
            this.status = STATUS_FAILED;
        }
    };

    handleStart(){
        this.statusMessage = '';
        this.startBuildingPrices();
        this.isStartButtonDisabled = true;
    }

    handleBackToListing(){
        window.history.back();
    }

    getLastPricesModificationDate() {
        APEX_getLastPricesModificationDate({
            listingId: this.recordId
        })
            .then(result => {
                console.debug('GetLastPricesModificationDateResult -> ', result);
                this.lastPricesUpdatedDate = result;
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

                if (result !== STATUS_READY){
                    this.isStartButtonDisabled = true;

                    this.updateStatus();
                    this.status = result;
                }
            })
            .catch(error => {
                console.log('GetInitialStatusError -> ', error);
                this.statusMessage = error.body.message;
                this.status = STATUS_FAILED;
                this.isStartButtonDisabled = true;
            }).finally(() => {
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
                this.updateStatus();
                if (result !== 'Single Listing Update Prices Job has been started.'){
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

    updateStatus() {
        this.updateTimer.timer = setInterval( () => {
            this.refresher++;
        }, this.updateTimer.timeoutSeconds);
    }

    //
    // getters
    //

    get statusClass() {
        return [
            'slds-box slds-p-vertical_large slds-theme_alert-texture',
            'build-single-prices_status',
            COMPLETED_STATUSES.includes(this.status) ? 'build-single-prices_succeeded' : '',
            FAILED_STATUSES.includes(this.status) ? 'build-single-prices_failed' : '',
            IN_PROCESS_STATUSES.includes(this.status) ? 'build-single-prices_info build-single-prices_animation-texture' : ''
        ].join(' ');
    }
}