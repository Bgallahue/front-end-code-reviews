import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { handleErrorMixin } from 'c/utils';
import APEX_createBankAccount from '@salesforce/apex/Controller_CreateStripeACHAccount.createBankAccount';
import OB_RESOURCES_URL from '@salesforce/resourceUrl/OB_Resources';
import STRIPE_LOGO_SVG_URL from '@salesforce/resourceUrl/stripeLogo';

const BANKINFO = {
    name: '',
    accountNumber: '',
    routingNumber: ''
};

const bankAccountInformationPNG = OB_RESOURCES_URL + '/img/BankAccountInformation.png';
const stripeLogoSVG = STRIPE_LOGO_SVG_URL + '#logo';
const stripeLockSVG = STRIPE_LOGO_SVG_URL + '#lock';



export default class CreateStripeACHAccount extends handleErrorMixin(LightningElement) {
    @track bankInformation = {...BANKINFO};
    isSpinnerShowing = false;

    // static
    $ = {
        bankAccountInformationPNG,
        stripeLogoSVG,
        stripeLockSVG
    }


    //
    // API METHODS
    //



    //
    // TEMPLATE EVENTS HANDLERS
    //

    handleInput(event) {
        this.bankInformation[event.target.name] = event.target.value;
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    handleInitiateSave() {
        // valudation
        const allValid = [...this.template.querySelectorAll('lightning-input')].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);

        if (!allValid) {
            this.handleError('Please correct the errors on the Bank Account inputs and try again');
            return;
        }

        // call apex
        this.isSpinnerShowing = true;
        APEX_createBankAccount({
            bankAccount: this.bankInformation
        })
            .then((data) => {
                if (data.status !== 'errored') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            message: 'Payout Method Sucessfully Submitted',
                            variant: 'Success'
                        })
                    );
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Payout Method Failed',
                            message: 'Submitting your Payout Method Failed, please try again',
                            variant: 'Error',
                            mode: 'sticky'
                        })
                    );
                }
                this.bankInformation = {...BANKINFO};
                this.dispatchEvent(new CustomEvent('blah', { detail: 3 }));
            })
            .catch(this.handleError)
            .finally(() => {
                this.isSpinnerShowing = false;
            });
    }

}