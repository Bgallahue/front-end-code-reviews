/*
This is a controller for UtilityPIcklistComponent

Change log:
8/13/2018: Builded
*/

public with sharing class OB_Picklist_Controller {
	// -------- Constants --------
	// None

	// -------- Constructor --------
	public OB_Picklist_Controller() {

	}

	// -------- Variables --------
	// None
	/**
	 * This method returns map of dependent picklist values
	 * @param  objectApiName  Parent object
	 * @param  fieldName      name of dependent field
	 * @param  contrFieldName controlling field
	 * @return                Map parent field <- list of dependend fields
	 */
	@AuraEnabled
	public static Map<String, List<PicklistEntryWrapper>> getDependentPicklistValues(String objectApiName, String fieldName, String contrFieldName) {
		String objectName = objectApiName.toLowerCase();
		String controllingField = contrFieldName.toLowerCase();
		String dependentField = fieldName.toLowerCase();

		Map<String, List<PicklistEntryWrapper>> objResults = new Map<String, List<PicklistEntryWrapper>>();
		// get the string to sobject global map
		Map<String, Schema.SObjectType> objGlobalMap = Schema.getGlobalDescribe();

		if (!Schema.getGlobalDescribe().containsKey(objectName)) {
			return null;
		}

		Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
		if (objType == null) {
			return objResults;
		}
		Bitset bitSetObj = new Bitset();
		Map<String, Schema.SObjectField> objFieldMap = objType.getDescribe().fields.getMap();

		// check if picklist values exist
		if (!objFieldMap.containsKey(controllingField) || !objFieldMap.containsKey(dependentField)) {
			return objResults;
		}
		// collect picklist values
		List<Schema.PicklistEntry> contrEntries = objFieldMap.get(controllingField).getDescribe().getPicklistValues();
		List<Schema.PicklistEntry> depEntries = objFieldMap.get(dependentField).getDescribe().getPicklistValues();
		objFieldMap = null;
		List<Integer> controllingIndexes = new List<Integer>();
		for (Integer contrIndex = 0; contrIndex < contrEntries.size(); contrIndex++) {
			Schema.PicklistEntry ctrlentry = contrEntries[contrIndex];
			String label = ctrlentry.getLabel();
			objResults.put(label, new List<PicklistEntryWrapper>());
			controllingIndexes.add(contrIndex);
		}
		List<Schema.PicklistEntry> objEntries = new List<Schema.PicklistEntry>();
		List<PicklistEntryWrapper> objJsonEntries = new List<PicklistEntryWrapper>();
		for (Integer dependentIndex = 0; dependentIndex < depEntries.size(); dependentIndex++) {
			Schema.PicklistEntry depentry = depEntries[dependentIndex];
			objEntries.add(depentry);
		}
		// convert PicklistEntry to PicklistEntryWrapper to get hidden validFor value
		objJsonEntries = (List<PicklistEntryWrapper>)JSON.deserialize(JSON.serialize(objEntries), List<PicklistEntryWrapper>.class);
		List<Integer> indexes;
		for (PicklistEntryWrapper objJson : objJsonEntries) {
			if (objJson.validFor == null || objJson.validFor == '') {
				continue;
			}
			indexes = bitSetObj.testBits(objJson.validFor, controllingIndexes);
			for (Integer idx : indexes) {
				String contrLabel = contrEntries[idx].getLabel();
				objResults.get(contrLabel).add(objJson);
			}
		}
		objEntries = null;
		objJsonEntries = null;
		return objResults;
	}

	// -------- Methods --------

	/**
	* This method returns list of all active picklist values
	* @param  objectApiName Parent object
	* @param  fieldName     name of picklist field
	* @return               list of
	*/
	@AuraEnabled(Cacheable=true)
	public static List<PicklistEntryWrapper> getPicklistValues(String objectApiName, String fieldName) {
		Map<String, Schema.SObjectType> globalMap = Schema.getGlobalDescribe();
		Schema.DescribeSObjectResult obj = globalMap.get(objectApiName).getDescribe();
		Schema.DescribeFieldResult field = obj.Fields.getMap().get(fieldName).getDescribe();

		List<Schema.PicklistEntry> values =  field.getPicklistValues();
		List<PicklistEntryWrapper> result = new List<PicklistEntryWrapper>();
		for (Schema.PicklistEntry entry : values) {
			if (entry.isActive()) {
				result.add(new PicklistEntryWrapper(entry.getLabel(), entry.getValue()));
			}
		}
		return result;
	}

	// -------- Classes --------

	/**
	* This class is used to control notifications on page
	*/
	public class PicklistEntryWrapper {

		public PicklistEntryWrapper() {
		}

		public PicklistEntryWrapper(String label, String value) {
			this.label = label;
			this.value = value;
		}

		@AuraEnabled
		public String label {get; set;}

		@AuraEnabled
		public String value {get; set;}

		public String active {get; set;}
		public String defaultValue {get; set;}
		public String validFor {get; set;}
	}

}