/**
 * Created by Artem Hamzin on 13.03.2021.
 */

import { LightningElement, track, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { DateTime } from "c/luxon";

import APEX_getLastPricesModificationDate from "@salesforce/apex/SmartRatesEnrollmentController.getLastPricesModificationDate";
import APEX_getInitialStatus from "@salesforce/apex/SmartRatesEnrollmentController.getInitialStatus";
import APEX_startBuildingPrices from "@salesforce/apex/SmartRatesEnrollmentController.startBuildingPrices";
import APEX_getCurrentJobStatus from '@salesforce/apex/SmartRatesEnrollmentController.getCurrentJobStatus';

const DEFAULT_STATUS_MESSAGE = "Press \"Build Prices\" button to start process.";
const LOADING_MESSAGE = "Loading Component";

const STATUS_FAILED = 'Failed';
const JOB_STATUS_READY = 'Ready';
const JOB_NAME_SINGLE_LISTING_BUILD_PRICES = "Single Listing Build Prices";


const COMPLETED_STATUSES = ['Completed'];
const IN_PROCESS_STATUSES = ['Pending', 'In Queue', 'In Progress', 'Moved to Daily Job', 'Holding', 'Queued', 'Preparing', 'Processing', 'Single Listing Update Prices Job has been started.'];
const FAILED_STATUSES = ['Error', 'Aborted', STATUS_FAILED];

export default class BuildSinglePricesComponent extends NavigationMixin(LightningElement) {
    @api listing_id;
    @api user_id;

    refresher = 0;

    loadingMessage = LOADING_MESSAGE;
    lastPricesUpdateDate = "";

    status = DEFAULT_STATUS_MESSAGE; //display job status
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

    //
    // GETTERS
    //

    get statusClass() {
        return [
            'slds-box slds-p-vertical_large slds-theme_alert-texture',
            COMPLETED_STATUSES.includes(this.status) ? 'build-single-prices_status-display_succeeded' : '',
            FAILED_STATUSES.includes(this.status) ? 'build-single-prices_status-display_failed' : '',
            IN_PROCESS_STATUSES.includes(this.status) ? 'build-single-prices_status-display_info build-single-prices_animation-texture' : ''
        ].join(' ');
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

    //
    // API METHODS
    //

    @wire(APEX_getCurrentJobStatus, {
        listingId: '$listing_id',
        jobName: JOB_NAME_SINGLE_LISTING_BUILD_PRICES,
        jobStartTime: '$jobStartedAt',
        refresher: '$refresher'
    })
    wiredJobStatus({ error, data }) {
        if (data) {
            if (this.refresher > 0) {
                this.status = data;
                this.statusMessage = '';
                if (COMPLETED_STATUSES.includes(data) || FAILED_STATUSES.includes(data)) {
                    this.inProgress = false;
                    this.startBtnDisabled = false;
                    clearInterval(this.updateTimer.timer);
                    this.refresher = 0;
                }
            }
        } else if (error) {
            console.log('WiredJobError -> ', error);
            this.statusMessage = error.body.message;
            this.status = 'Failed';
        }
    };

    getLastPricesModificationDate() {
        APEX_getLastPricesModificationDate({
            listingId: this.listing_id
        })
            .then(result => {
                console.debug('GetLastPricesModificationDateResult -> ', result);
                this.lastPricesUpdateDate = result;
            })
            .catch(error => {
                console.log('GetLastPricesModificationDateError -> ', error);
            });
    }

    getInitialStatus() {
        APEX_getInitialStatus({
            listingId: this.listing_id,
            jobName: 'Single Listing Build Prices'
        })
            .then(result => {
                console.debug('GetInitialStatusResult -> ', result);
                if (result !== JOB_STATUS_READY) {
                    this.startBtnDisabled = true;
                    this.updateStatus();
                    this.status = result;
                }
            })
            .catch(error => {
                console.log('GetInitialStatusError -> ', error);
                this.statusMessage = error.body.message;
                this.status = STATUS_FAILED;
                this.startBtnDisabled = true;
            }).finally(() => {
                this.inProgress = false;
            })
    }

    startBuildingPrices() {
        APEX_startBuildingPrices({
            listingId: this.listing_id
        })
            .then(result => {
                console.debug('StartBuildingPricesResult -> ', result);
                this.status = result;
                this.jobStartedAt = DateTime.fromMillis(new Date().getTime(), { zone: TIME_ZONE }).toMillis();
                this.updateStatus();
            })
            .catch(error => {
                console.log('StartBuildingPricesError -> ', error);
                this.statusMessage = error.body.message;
                this.status = STATUS_FAILED;
            })
            .finally(() => {
                this.inProgress = false;
            })
    }
    
    //
    // TEMPLATE EVENTS HANDLERS
    //
    
    handleBuildPricesButtonClick() {
        this.statusMessage = "";
        this.startBuildingPrices();
        this.startBtnDisabled = true;
    }

    handleBackToListingButtonClick() {
        window.history.back();
    }

    // 
    // PRIVATE METHODS
    //    
    
    updateStatus() {
        this.updateTimer.timer = setInterval(() => {
            this.refresher++;
            // this.getCurrentJobStatus();
        }, this.updateTimer.timeoutSeconds);
    }
}