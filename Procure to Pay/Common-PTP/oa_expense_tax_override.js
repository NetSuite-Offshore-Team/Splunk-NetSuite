/* 
 * Handling Canadian PST and GST tax overrides from OpenAir integration
 * Use library functions in features_and_preferences.js
 */
function beforeSubmitOAExpenseTaxOverride(){
	var taxOverride = checkTaxOverride();

	if (taxOverride == 'T') {
    	var PST = nlapiGetFieldValue('custbody_oa_pst_override');
    	var GST = nlapiGetFieldValue('custbody_oa_gst_override');
		
		if (GST) {
    		nlapiSetFieldValue('taxamountoverride', GST);			
		}

		if (PST) {
    		nlapiSetFieldValue('taxamount2override', PST);					
		}
	}
}


/*
 * Display OpenAir tax override fields on the vendor bill and expense tax form if needed
 * Tax override preference should be enabled and
 * 1) This is an expense report OR
 * 2) Using vendor bill integration with taxes
 */
function beforeLoadOAExpenseTaxOverride(type, form){
	var taxOverride = checkTaxOverride();
    
    if (taxOverride == 'T') {
        form.getField('custbody_oa_pst_override').setDisplayType('normal');
        form.getField('custbody_oa_gst_override').setDisplayType('normal');
    }
    else {
        form.getField('custbody_oa_pst_override').setDisplayType('hidden');
        form.getField('custbody_oa_gst_override').setDisplayType('hidden');
    }
}

function checkTaxOverride(){
    var nlobjContext = nlapiGetContext();
    var taxOverrideFeature = getPreference(nlobjContext, 'custscript_oa_can_tax_override');
    var expenseVendorBill = getPreference(nlobjContext, 'custscript_oa_expense_vb_int');
    var expenseVendorBillTax = getPreference(nlobjContext, 'custscript_oa_expense_vb_tax');
    var recordType = nlapiGetRecordType();
    
    if ((taxOverrideFeature == 'T') && ((recordType == 'vendorbill' && expenseVendorBill == 'T' && expenseVendorBillTax == 'T') || (recordType == 'expensereport'))) {
		return 'T';
    }
    else {
		return 'F';
    }
}

