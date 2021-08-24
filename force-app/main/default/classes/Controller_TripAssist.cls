public without sharing class Controller_TripAssist {
    // -------- Constants --------
    private static final String INQUIRY_LINE_ITEM_TRIP_ASSIST_FIELD_SET = 'InquiryLineItem_TripAssist';
    private static final String BOOKING_TRIP_ASSIST_FIELD_SET = 'Booking_TripAssist';
    private static final String CREDIT_LINE_ITEM_NAME = 'Applied Booking Credit';

    private static final Id TRANSACTION_CHARGE_ID = RecordTypeHelper.getRecordType('bt_stripe__Transaction__c', 'Charge').Id;

    // -------- Constructor --------
    public Controller_TripAssist() {
    }

    // -------- Variables --------
    private static ecm_AvailabilitySummarySelector availabilitySummarySelector = new ecm_AvailabilitySummarySelector();
    private static ecm_BookingSelector bookingSelector = new ecm_BookingSelector();
    private static ecm_CreditDebitSelector creditDebitSelector = new ecm_CreditDebitSelector();
    private static ecm_InquiryLineItemSelector inquiryLineItemSelector = new ecm_InquiryLineItemSelector();
    private static ecm_TransactionSelector transactionSelector = new ecm_TransactionSelector();
    private static ecm_AllocationSelector allocationSelector = new ecm_AllocationSelector();

    // -------- Properties --------
    // None

    // -------- Methods --------
    @AuraEnabled
    public static BookingData getBookingData(String bookingId) {
        BookingData result = new BookingData();

        if (String.isNotEmpty(bookingId)) {
            result.booking = getBooking(bookingId);
            if (result.booking == null) {
                return result;
            }
            result.availabilitySummary = getAvailabilitySummary(result.booking.Listing__c);
            result.inquiryLineItems = getInquiryLineItems(bookingId);
            result.optionalLineItems = getOptionalLineItems(bookingId);
            result.maxOccupancy = getMaxOccupancy(result.booking);
            result.creditAllocations = getCreditAllocations(bookingId);
            result.completedCharges = getCompletedChargeTransactions(bookingId);
            result.availableCreditAmount = getAvailableCreditAmount(result.booking);
        }

        return result;
    }

    @AuraEnabled
    public static List<Inquiry_Line_Item__c> getInquiryLineItems(String bookingId) {
        List<Inquiry_Line_Item__c> result = new List<Inquiry_Line_Item__c>();
        if (String.isNotEmpty(bookingId)) {
            inquiryLineItemSelector.addPrimaryTableFieldSet(new Set<String>{
                    INQUIRY_LINE_ITEM_TRIP_ASSIST_FIELD_SET
            });

            result =
                    (List<Inquiry_Line_Item__c>) inquiryLineItemSelector.retrieveRecordsByRelationshipID('Booking__c', new Set<Id>{
                            bookingId
                    });
        }
        return result;
    }

    @AuraEnabled
    public static BookingModificationTransactionResult getUpdatedBookingLineItems(Id bookingId, Integer adults,
            Integer children, Integer infants, String checkIn, String checkOut, List<BookingModificationServices.OptionalLineItem> fees, Boolean isFullProcess) {
        BookingModificationTransactionResult result = new BookingModificationTransactionResult();
        try {
            if (String.isNotEmpty(bookingId)) {
                Booking__c booking = [
                        SELECT ReferralSource__c,Check_In__c,Check_Out__c, Inquiry__c
                        FROM Booking__c
                        WHERE Id = :bookingId
                        LIMIT 1
                ];

                List<String> warnings = BookingModificationController.checkAvailabilityForDates(bookingId, booking.Inquiry__c, Date.valueOf(checkIn), Date.valueOf(checkOut), adults, children, infants, true).errors;

                if (!warnings.isEmpty()) {
//                    throw new AuraHandledException(warnings);
                }

                BookingModificationServices.BookingModificationServiceResponse response = BookingModificationController.modifyLineItems(bookingId, checkIn, checkOut);

                List<Inquiry_Line_Item__c> modifyLineItems = response.modifiedLineItemsList;
//                modifyLineItems.addAll(fees);
                List<Allocation__c> newAllocations = createAllocations(bookingId, modifyLineItems);
                if (isFullProcess) {
                    upsert modifyLineItems;
                    insert newAllocations;
                }
                result.newInquiryLineItems = modifyLineItems;
                System.debug(modifyLineItems);

                BookingModificationTransactionServices.DISTRO currentDistro = getDistro(booking.ReferralSource__c);

                BookingModificationTransactionServices.BookingModificationData data = new BookingModificationTransactionServices.BookingModificationData();
                data.bookingId = bookingId;
                data.bookingAddition = true;
                data.additionalLineItems = modifyLineItems;
                data.creditAllocations = newAllocations;
                data.newCheckIn = checkIn == null ? booking.Check_In__c : Date.valueOf(checkIn);
                data.newCheckOut = checkOut == null ? booking.Check_Out__c : Date.valueOf(checkOut);

                BookingModificationTransactionServices bmtServices = new BookingModificationTransactionServices(data);
                result = bmtServices.processTransactionModification(currentDistro);

                if (isFullProcess) {
                    bmtServices.processBookingAndTransactions(result);

                    booking = BookingHandler.updateBookingFromInquiryLineItems(booking, booking.Booking_Line_Items__r);
                    booking.Adults__c = adults;
                    booking.Children__c = children;
                    booking.Infants__c = infants;
                    update booking;

                    BookingModificationController.nevadaBookingProcess(bookingId);
                } else {
                    bmtServices.updateTransactionAmountByLedgers(result);
                    setRecordTypesOnTransactions(result.newTransactions);
                    setRecordTypesOnTransactions(result.existingTransactions);
                }
            }
        } catch (Exception e) {
            result.error = e;
        }

        return result;
    }

    @AuraEnabled
    public static BookingModificationTransactionResult cancelBooking(Id bookingId, String cancellationFault, String responsibleValue, Boolean isFullProcess) {
        return cancelBooking(bookingId, cancellationFault, responsibleValue, null, null, false,
                false, false, isFullProcess);
    }

    @AuraEnabled
    public static BookingModificationTransactionResult cancelBooking(Id bookingId, String cancellationFault, String responsibleValue, String exceptionReason, String exceptionNotes, Boolean emailGuest, Boolean emailOwner, Boolean emailPartner, Boolean isFullProcess) {
        Booking__c booking = [
                SELECT Id, Cancellation_Policy_at_Time_of_Booking__c, ReferralSource__c, Inquiry__c, (SELECT Id,Name,Amount__c,Type__c FROM Booking_Line_Items__r)
                FROM Booking__c
                WHERE Id = :bookingId
        ];

        BookingModificationTransactionServices.FAULT currentFault = null;
        BookingModificationTransactionServices.POLICY_TYPE currentPolicyType = BookingModificationTransactionServices.POLICY_TYPE.Standard;

        BookingModificationTransactionServices.DISTRO currentDistro = getDistro(booking.ReferralSource__c);

        if (cancellationFault.startsWith('Traveler')) {
            currentFault = BookingModificationTransactionServices.FAULT.Traveler;
        } else if (cancellationFault.startsWith('Owner')) {
            currentFault = BookingModificationTransactionServices.FAULT.Owner;
        } else if (cancellationFault.startsWith('Evolve')) {
            currentFault = BookingModificationTransactionServices.FAULT.Evolve;
        }

        BookingModificationTransactionServices.BookingModificationData data = new BookingModificationTransactionServices.BookingModificationData();
        data.bookingId = bookingId;
        data.cancellationPolicyId = booking.Cancellation_Policy_at_Time_of_Booking__c;
        data.cancelBooking = true;
        data.fault = currentFault;
        data.policy = currentPolicyType;
        data.cancellationReason = cancellationFault;
        data.cancelledBy = currentFault.name();
        data.cancellationMethod = BookingModificationTransactionServices.CANCELLATION_METHOD.Mod_Tool;
        data.refundResponsibility = currentFault == BookingModificationTransactionServices.FAULT.Traveler ?
                Constants.BOTH_OWNER_AND_EVOLVE_ONLY_RESPONSIBILITY_TYPE :
                responsibleValue.replace('"', '');
        data.creditIDUsedForBooking = booking.Credits_Debits__r.isEmpty() ? null : booking.Credits_Debits__r[0].Id;
        data.creditAmountAppliedToBooking = BookingModificationController.getAppliedBookingCreditLineItemAmount(booking) ;
        data.exceptionReason = exceptionReason;
        data.exceptionNotes = exceptionNotes;

        BookingModificationTransactionServices bmtServices = new BookingModificationTransactionServices(data);
        BookingModificationTransactionResult result = bmtServices.processTransactionModification(currentDistro);

        if (!result.doesNotQualify) {
            if (isFullProcess) {
                bmtServices.processBookingAndTransactions(result);
            } else {
                bmtServices.updateTransactionAmountByLedgers(result);
            }
            BookingModificationController.nevadaBookingProcess(bookingId);
        }

        System.debug(':::result ' + result);
        return result;
    }

    @AuraEnabled
    public static List<bt_stripe__Payment_Method__c> getPaymentMethods(String bookingId) {
        if (String.isEmpty(bookingId)) throw new AuraHandledException('Empty booking ID');
        String travelerId = [SELECT Traveler__c FROM Booking__c WHERE Id = :bookingId LIMIT 1].Traveler__c;
        if (String.isEmpty(travelerId)) throw new AuraHandledException('There is no traveler for this booking');
        List<bt_stripe__Payment_Method__c> paymentMethods = [
                SELECT
                        Id, bt_stripe__Card_Last_4_Digit__c, bt_stripe__Card_Expiration_Month__c,
                        bt_stripe__Card_Expiration_Year__c, bt_stripe__Brand__c, bt_stripe__Default_Payment_Method__c
                FROM bt_stripe__Payment_Method__c
                WHERE bt_stripe__Account__c = :travelerId
        ];
        return paymentMethods;
    }

    @AuraEnabled
    public static List<BookingModificationServices.OptionalLineItem> getOptionalLineItems(String bookingId) {
        List<Inquiry_Line_Item__c> optionalLineItems = getNotAddedOptionalLineItems(bookingId);
        List<Inquiry_Line_Item__c> addedOptionalLineItems = getAddedOptionalLineItems(bookingId);

        List<BookingModificationServices.OptionalLineItem> result = new List<BookingModificationServices.OptionalLineItem>();
        if (!addedOptionalLineItems.isEmpty()) {
            result = filterAlreadyAddedAndRemovedLineItems(optionalLineItems, addedOptionalLineItems);
        } else {
            result = buildAdditionOptionalMap(optionalLineItems);
        }

        return result;
    }

    private static List<bt_stripe__Transaction__c> getCompletedChargeTransactions(String bookingId) {
        List<bt_stripe__Transaction__c> result = new List<bt_stripe__Transaction__c>();
        if (String.isNotEmpty(bookingId)) {
            transactionSelector.addPrimaryTableAndClause('RecordTypeId', '=', TRANSACTION_CHARGE_ID);
            transactionSelector.addPrimaryTableAndClause('bt_stripe__Transaction_Status__c', '=', ecm_TransactionConstants.TRANSACTION_STATUS_COMPLETED);
            transactionSelector.addPrimaryTableAndClause('bt_stripe__Payment_Status__c', '=', ecm_TransactionConstants.TRANSACTION_PAYMENT_STATUS_CAPTURED);
            result =
                    (List<bt_stripe__Transaction__c>) transactionSelector.retrieveRecordsByRelationshipID('Booking__c', new Set<Id>{
                            bookingId
                    });
        }
        return result;
    }

    private static Decimal getAvailableCreditAmount(Booking__c booking) {
        Decimal sumCreditAmount = 0;
        List<Credit_Debit__c> result = new List<Credit_Debit__c>();
        if (booking != null && String.isNotEmpty(booking.Traveler__c)) {
            creditDebitSelector.addPrimaryTableAndClause('Valid_Through__c', '>', String.valueOf(Datetime.now()));
            creditDebitSelector.addPrimaryTableAndClause('UnappliedTotal__c', '>', String.valueOf(0));
            result =
                    (List<Credit_Debit__c>) creditDebitSelector.retrieveRecordsByRelationshipID('Account__c', new Set<Id>{
                            booking.Traveler__c
                    });
        }

        for (Credit_Debit__c cd : result) {
            sumCreditAmount += cd.UnappliedTotal__c;
        }

        return sumCreditAmount;
    }

    private static List<Allocation__c> getCreditAllocations(String bookingId) {
        List<Allocation__c> result = new List<Allocation__c>();
        if (String.isNotEmpty(bookingId)) {
            result =
                    (List<Allocation__c>) allocationSelector.retrieveRecordsByRelationshipID('Booking__c', new Set<Id>{
                            bookingId
                    });
        }
        return result;
    }

    @AuraEnabled(Cacheable=true)
    public static List<String> getUserPermissions() {
        List<String> result = new List<String>();
        User u = [
                SELECT Id, Beta_Testing__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
        ];
        if (String.isNotEmpty(u.Beta_Testing__c)) {
            for (String action : u.Beta_Testing__c.split(';')) {
                result.add(action.trim());
            }
        }

        return result;
    }

    private static Integer getMaxOccupancy(Booking__c record) {
        Decimal maxOccupancy = null;
        Map<Id, Listing__c> result = new Map<Id, Listing__c>([
                SELECT Id, Status__c, Min_Stay__c, Max_Occupancy__c, Minimum_Days_Until_Check_In__c, checkin_time_24hr__c, Listing_Timezone__c, (
                        SELECT Id, Max_Occupancy__c
                        FROM Booking_Rules__r
                        WHERE Active__c = TRUE
                        AND Max_Occupancy__c != NULL
                        AND Check_In_During_End_Date__c >= :Date.today() AND Start_Date__c <= :Date.today() AND End_Date__c >= :Date.today()
                        AND RecordTypeId = :BookingRuleHandler.RECORD_TYPE_RULES
                        AND (
                                (Start_Check_In_During__c <= :record.Check_In__c AND Check_In_During_End_Date__c >= :record.Check_Out__c)
                                OR (
                                        (Start_Check_In_During__c >= :record.Check_In__c AND Start_Check_In_During__c <= :record.Check_Out__c)
                                        OR (Check_In_During_End_Date__c >= :record.Check_In__c AND Check_In_During_End_Date__c <= :record.Check_Out__c)))
                )
                FROM Listing__c
                WHERE Id = :record.Listing__c
        ]);

        for (BookingRule__c bookingRule : result.get(record.Listing__c).Booking_Rules__r) {
            if (maxOccupancy == null) {
                maxOccupancy = 0;
            }
            maxOccupancy = maxOccupancy > bookingRule.Max_Occupancy__c ? maxOccupancy : bookingRule.Max_Occupancy__c;
        }

        if (maxOccupancy == null && result.get(record.Listing__c).Max_Occupancy__c != null) {
            maxOccupancy = result.get(record.Listing__c).Max_Occupancy__c;
        }

        return maxOccupancy != null ? Integer.valueOf(maxOccupancy) : null;
    }

    private static void setRecordTypesOnTransactions(List<bt_stripe__Transaction__c> transactions) {
        RecordType charge = RecordTypeHelper.getRecordType('bt_stripe__Transaction__c', 'Charge');
        RecordType transfer = RecordTypeHelper.getRecordType('bt_stripe__Transaction__c', 'Transfer');

        for (bt_stripe__Transaction__c tr : transactions) {
            if (tr.RecordTypeId == charge.Id) {
                tr.RecordType = charge;
            } else if (tr.RecordTypeId == transfer.Id) {
                tr.RecordType = transfer;
            }
        }
    }

    private static List<Allocation__c> createAllocations(Id bookingId, List<Inquiry_Line_Item__c> lineItems) {
        List<Allocation__c> newAllocations = new List<Allocation__c>();
        for (Inquiry_Line_Item__c lineItem : lineItems) {
            if (lineItem.Name == CREDIT_LINE_ITEM_NAME) {
                Allocation__c newAllocation = new Allocation__c();
                newAllocation.Booking__c = bookingId;
                newAllocation.Credit_Debit__c = lineItem.Credit__c;
                newAllocation.Amount__c = Math.abs(lineItem.Amount__c);
                newAllocations.add(newAllocation);
            }
        }

        return newAllocations;
    }

    private static List<BookingModificationServices.OptionalLineItem> buildAdditionOptionalMap(List<Inquiry_Line_Item__c> itemsToMap) {
        List<BookingModificationServices.OptionalLineItem> modificationMap = new List<BookingModificationServices.OptionalLineItem>();

        for (Inquiry_Line_Item__c lineItem : itemsToMap) {
            QuoteForInquiry.OptionalLineItemPurchases optionalPurchase = new QuoteForInquiry.OptionalLineItemPurchases(lineItem);
            modificationMap.add(
                    new BookingModificationServices.OptionalLineItem(
                            optionalPurchase.name,
                            optionalPurchase.price,
                            lineItem.Amount__c,
                            lineItem.Marketing_Cost__c,
                            (Integer) optionalPurchase.requestedQuantity,
                            optionalPurchase.quantityMayNotBeIncreased,
                            false,
                            lineItem.Fee_Category_Text__c,
                            lineItem.Optional_Value_Type__c,
                            lineItem.Line_Item_Help_Text__c
                    )
            );
        }
        return modificationMap;
    }

    private static List<BookingModificationServices.OptionalLineItem> filterAlreadyAddedAndRemovedLineItems(
            List<Inquiry_Line_Item__c> optionalLineItems,
            List<Inquiry_Line_Item__c> addedOptionalLineItems
    ) {

        List<Inquiry_Line_Item__c> itemsToAdd = new List<Inquiry_Line_Item__c>();
        List<Inquiry_Line_Item__c> itemsToRemove = new List<Inquiry_Line_Item__c>();

        Map<String, List<Inquiry_Line_Item__c>> helperMap = buildHelperMap(addedOptionalLineItems);

        for (Inquiry_Line_Item__c optionalItem : optionalLineItems) {
            List<Inquiry_Line_Item__c> additionList = helperMap.get('Addition ' + optionalItem.Name) != null ?
                    helperMap.get('Addition ' + optionalItem.Name) :
                    new List<Inquiry_Line_Item__c>();

            List<Inquiry_Line_Item__c> reductionList = helperMap.get('Reduction ' + optionalItem.Name) != null ?
                    helperMap.get('Reduction ' + optionalItem.Name) :
                    new List<Inquiry_Line_Item__c>();

            List<Inquiry_Line_Item__c> originallyAddedList = helperMap.get('Original ' + optionalItem.Name) != null ?
                    helperMap.get('Original ' + optionalItem.Name) :
                    new List<Inquiry_Line_Item__c>();

            if (reductionList.isEmpty() && (!additionList.isEmpty() || !originallyAddedList.isEmpty())) {
                additionList.addAll(originallyAddedList);
                itemsToRemove.addAll(additionList);
            }

            if ((!additionList.isEmpty() || !originallyAddedList.isEmpty()) && !reductionList.isEmpty()) {
                if ((additionList.size() + originallyAddedList.size()) > reductionList.size()) {
                    additionList.addAll(originallyAddedList);
                    itemsToRemove.addAll(getItemsToRemove(additionList, reductionList));
                } else if ((additionList.size() + originallyAddedList.size()) == reductionList.size()) {
                    itemsToAdd.add(optionalItem);
                }
            }
        }


        return buildAdditionOptionalMap(itemsToAdd);
//        bookingDataResponse.optionalLineItemsForRemove = buildAdditionOptionalMap(itemsToRemove);
    }

    private static List<Inquiry_Line_Item__c> getItemsToRemove(List<Inquiry_Line_Item__c> additionList, List<Inquiry_Line_Item__c> reductionList) {
        for (Inquiry_Line_Item__c reductionItem : reductionList) {
            for (Integer index = 0; index < additionList.size(); index++) {
                Inquiry_Line_Item__c additionItem = additionList.get(index);
                if (reductionItem.Name.remove('Reduction ').trim().equals(additionItem.Name) &&
                        (reductionItem.Quantity__c == additionItem.Quantity__c) &&
                        (reductionItem.Amount__c.abs() == additionItem.Amount__c)) {
                    additionList.remove(index);
                }
            }
        }
        return additionList;
    }

    private static Map<String, List<Inquiry_Line_Item__c>> buildHelperMap(List<Inquiry_Line_Item__c> currentIliItems) {

        Map<String, List<Inquiry_Line_Item__c>> helperMap = new Map<String, List<Inquiry_Line_Item__c>>();

        for (Inquiry_Line_Item__c item : currentIliItems) {
            String itemName;
            if (item.Name.contains('Reduction')) {
                itemName = item.Name.remove('Addition ').trim();
            } else if (item.Name.contains('Addition')) {
                itemName = item.Name;
            } else {
                itemName = 'Original ' + item.Name;
            }

            if (!helperMap.containsKey(itemName)) {
                helperMap.put(itemName, new List<Inquiry_Line_Item__c>());
            }
            helperMap.get(itemName).add(item);
        }

        return helperMap;
    }

    private static List<Inquiry_Line_Item__c> getAddedOptionalLineItems(String bookingId) {
        try {
            List<Inquiry_Line_Item__c> addedOptionalLineItems = [
                    SELECT Id,
                            Name,
                            Amount__c,
                            Quantity__c,
                            Required__c,
                            Fee_Category_Text__c,
                            Optional_Value_Type__c,
                            Line_Item_Help_Text__c,
                            Marketing_Cost__c
                    FROM Inquiry_Line_Item__c
                    WHERE Booking__c = :bookingId
                    AND Restriction__c = :BookingRuleHandler.RESTRICTION_NOT_REQUIRED
                    AND Type__c = :InquiryLineItemHandler.ILI_TYPE_FEES
                    AND Quantity__c = 1
                    AND Name != :Constants.TRAVEL_INSURANCE_TYPE
            ];

            return addedOptionalLineItems;
        } catch (Exception ex) {
            System.debug('ex==' + ex);
            return null;
        }
    }

    private static List<Inquiry_Line_Item__c> getNotAddedOptionalLineItems(String bookingId) {
        try {
            List<Inquiry_Line_Item__c> addedOptionalLineItems = [
                    SELECT Id,
                            Name,
                            Amount__c,
                            Quantity__c,
                            Required__c,
                            Fee_Category_Text__c,
                            Optional_Value_Type__c,
                            Line_Item_Help_Text__c,
                            Marketing_Cost__c
                    FROM Inquiry_Line_Item__c
                    WHERE Booking__c = :bookingId
                    AND Restriction__c = :BookingRuleHandler.RESTRICTION_NOT_REQUIRED
                    AND Type__c = :InquiryLineItemHandler.ILI_TYPE_FEES
                    AND Quantity__c = 0
                    AND Name != :Constants.TRAVEL_INSURANCE_TYPE
            ];

            return addedOptionalLineItems;
        } catch (Exception ex) {
            System.debug('ex==' + ex);
            return null;
        }
    }

    private static Booking__c getBooking(String bookingId) {
        bookingSelector.addPrimaryTableFieldSet(new Set<String>{
                BOOKING_TRIP_ASSIST_FIELD_SET
        });
        List<Booking__c> returnedBookings = (List<Booking__c>) bookingSelector.retrieveRecordsByRecordID(new Set<Id>{
                bookingId
        });
        Booking__c result = null;
        if (!returnedBookings.isEmpty()) {
            result = returnedBookings[0];
        }

        return result;
    }

    @AuraEnabled
    public static Availability_Summary__c getAvailabilitySummary(String listingId) {
        Availability_Summary__c availabilitySummary = null;
        if (!String.isEmpty(listingId)) {
            List<Availability_Summary__c> result = (List<Availability_Summary__c>) availabilitySummarySelector.retrieveRecordsByRelationshipID('Listing__c', new Set<Id>{
                    listingId
            });
            if (!result.isEmpty()) {
                availabilitySummary = result[0];
            }
        }
        return availabilitySummary;
    }

    private static BookingModificationTransactionServices.DISTRO getDistro(String referralSource) {
        BookingModificationTransactionServices.DISTRO result;
        switch on referralSource {
            when 'Website' {
                result = BookingModificationTransactionServices.DISTRO.Website;
            }
            when 'VRBO', 'HomeAway' {
                result = BookingModificationTransactionServices.DISTRO.HAVRBO;
            }
            when 'Airbnb' {
                result = BookingModificationTransactionServices.DISTRO.ABB;
            }
            when 'Tripadvisor' {
                result = BookingModificationTransactionServices.DISTRO.TA;
            }
            when 'Booking.com' {
                result = BookingModificationTransactionServices.DISTRO.BC;
            }
            when else {
                result = null;
            }
        }

        return result;
    }

    // -------- Classes --------
    public class BookingData {
        @AuraEnabled
        public Booking__c booking { get; set; }
        @AuraEnabled
        public List<Inquiry_Line_Item__c> inquiryLineItems { get; set; }
        @AuraEnabled
        public Availability_Summary__c availabilitySummary { get; set; }
        @AuraEnabled
        public List<BookingModificationServices.OptionalLineItem> optionalLineItems { get; set; }
        @AuraEnabled
        public Integer maxOccupancy { get; set; }
        @AuraEnabled
        public List<Allocation__c> creditAllocations { get; set; }
        @AuraEnabled
        public List<bt_stripe__Transaction__c> completedCharges { get; set; }
        @AuraEnabled
        public Decimal availableCreditAmount { get; set; }

        public BookingData() {
            this.inquiryLineItems = new List<Inquiry_Line_Item__c>();
            this.optionalLineItems = new List<BookingModificationServices.OptionalLineItem>();
            this.creditAllocations = new List<Allocation__c>();
            this.completedCharges = new List<bt_stripe__Transaction__c>();
        }
    }
}