// Run the below in Anonymous Apex (In your Dev Org), replace the Id with a Listing in your Dev Org

update new Listing__c(
    Id = 'a0G2F000004X1dlUAC',
    Status__c = 'Building',
    SmartRates_Enabled__c = true,
    EB_Base_Price__c = 100,
    Min_Price__c = 100
);

// Log in as user 'Logan Lagesse'
// Navigate to the Listing you updated with the above Anonymous Apex