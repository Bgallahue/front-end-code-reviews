export const GUEST = 'Guest';
export const OWNER = 'Owner';
export const EVOLVE = 'Evolve';

export const REASONS = {
    [GUEST]: [
        'Access Issue',
        'Amex Payment Error',
        'Change In Plans',
        'Did not intend to book',
        'Does Not Meet Policies',
        'Failure to Pay',
        'Found Better Deal',
        'Natural Disaster',
        'Not Satisfied',
        'Optional Fees Issue',
        'Other',
        'Personal Issue',
        'PPP - Cost',
        'Screening',
        'Service Fee',
        'Traveler Complaint'
    ],
    [OWNER]: [
        'Double Booking',
        'First Booking',
        'HOA Restriction',
        'HOA/Govt Restriction',
        'Listing Accuracy',
        'Natural Disaster',
        'Personal Issue',
        'Property Sold',
        'Property/Service Issue',
        'Rate/Rule Issue',
        'Resignation',
        'Yield Management',
        'Other'
    ],
    [EVOLVE]: [
        '48-Hr Close-in',
        'Does Not Meet Policies',
        'Double Booking',
        'Duplicate Booking',
        'External Calendar',
        'Fraudulent Traveler',
        'Inactive Listing',
        'Last-Min',
        'Listing Accuracy',
        'Other Error',
        'Owner First Booking',
        'Rate/Rule Error',
        'Other'
    ]
}