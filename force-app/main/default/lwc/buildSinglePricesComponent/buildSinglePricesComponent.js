import {LightningElement, track, api, wire} from 'lwc';
import APEX_getLastPricesModificationDate from "@salesforce/apex/SmartRatesEnrollmentController.getLastPricesModificationDate";
import APEX_getInitialStatus from "@salesforce/apex/SmartRatesEnrollmentController.getInitialStatus";
import APEX_startBuildingPrices from "@salesforce/apex/SmartRatesEnrollmentController.startBuildingPrices";
import APEX_getCurrentJobStatus from '@salesforce/apex/SmartRatesEnrollmentController.getCurrentJobStatus';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { DateTime } from "c/luxon";

const STATUS_FAILED = 'Failed';
const STATUS_READY = 'Ready';
const SINGLE_LISTING_JOB = 'Single Listing Build Prices';
const COMPLETED_STATUSES = ['Completed'];
const IN_PROCESS_STATUSES = ['Pending', 'In Queue', 'In Progress', 'Moved to Daily Job', 'Holding',  'Queued', 'Preparing', 'Processing', 'Single Listing Update Prices Job has been started.'];
const FAILED_STATUSES = ['Error', 'Aborted', 'Failed'];

export default class BuildSinglePricesComponent extends LightningElement {
    @api listing_id;
    @api user_id;

    refresher = 0;
    loadingMessage = "Loading Component";
    lastPricesUpdateDate = "";

    status = "Press \"Build Prices\" button to start process.";
    statusMessage = "";
    isStartButtonDisabled = false;
    isInProgress = false;

    jobStartedAt = null;

    $ = {
        inited: false
    }

    updateTimer = {
        timer: null,
        timeoutSeconds: 10000
    }
    
        //
        // GETTERS
        //
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
        
        //
        // LIFECYCLE
        //
    
        connectedCallback() {
            if (this.$.inited) return;
            this.getLastPricesModificationDate();
            this.getInitialStatus();
            this.$.inited = true;
    
        }

        @wire(APEX_getCurrentJobStatus, { listingId: '$listing_id', jobName: 'Single Listing Build Prices', jobStartTime: '$jobStartedAt', refresher: '$refresher'  })
        wiresJobStatus({ error, data }) {
            if (data) {
                if (this.refresher > 0){
                    this.status = data;
                    this.statusMessage = '';
                    if (COMPLETED_STATUSES.includes(data) || FAILED_STATUSES.includes(data)){
                        this.isInProgress = true;
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
        //
        // PRIVATE METHODS
        //
        
        getLastPricesModificationDate() {
            APEX_getLastPricesModificationDate({
                listingId: this.recordId
            })
                .then(result => {
                    this.lastPricesUpdateDate = result;
                })
                .catch(error => {
                    console.log('GetLastPricesModificationDateError -> ', error);
                });
        }
    
        getInitialStatus(){
            APEX_getInitialStatus({
                listingId: this.recordId,
                jobName: SINGLE_LISTING_JOB
            })
                .then(result => {
                    if (result !== STATUS_READY){
                        this.isStartButtonDisabled = true;
    
                        this.updateStatus();
                        this.status = result;
                    }
                })
                .catch(error => {
                    this.statusMessage = error.body.message;
                    this.status = STATUS_FAILED;
                    this.isStartButtonDisabled = true;
                }).finally(() => {
                this.isInProgress = true;
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
                    this.statusMessage = error.body.message;
                    this.status = STATUS_FAILED;
                })
                .finally(() => {
                    this.isInProgress = true;
                })
        }
    
        updateStatus() {
            this.updateTimer.timer = setInterval( () => {
                this.refresher++;
            }, this.updateTimer.timeoutSeconds);
        }
    
        //
        // TEMPLATE EVENTS HANDLERS
        //

        handleBuildPricesStart(){
            this.statusMessage = "";
            this.startBuildingPrices();
            this.isStartButtonDisabled = true;
        }

        handleBackToListing(){
            window.history.back();
        } 
}