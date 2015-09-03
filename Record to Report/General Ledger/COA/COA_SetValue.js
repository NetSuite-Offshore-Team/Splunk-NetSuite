/**
 * Setting Fields based on the Account type selected and implementing the validations.
 * @author Dinanath Bablu
 * @Release Date 30th Dec 2013
 * @Release Number RLSE0050094
 * @version 1.0
 * Change was done for hard coded path
 * @Release Date 16th Jan 2014
 * @Release Number RLSE0050112
 * @version 2.0
 */

// It is a client script and sets the Approval status.
function updateFieldOnInit(rectype)
{
    if (nlapiGetFieldValue('custrecord_approvalstatus') != '2') 
	{
        nlapiSetFieldValue('custrecord_approvalstatus', '1');
    }
}

/**** The field change function changes the fields on new Accounts based on various fields selected. ******/
function COA_SetValue(type, name) // Field Change function
{ 
	if(nlapiGetContext().getExecutionContext() == 'csvimport' || nlapiGetContext().getExecutionContext() == 'userinterface') {
		if (name == 'custrecord_subs') 
		{
		// Restricting only one subsidiary to be chosen for "Bank" and "Credit Card" account type.
        var accType = nlapiGetFieldText('custrecord_accnttype');
        var subs = nlapiGetFieldValues('custrecord_subs');
        var subLen = subs.length;
        if ((accType == 'Bank' || accType == 'Credit Card') && subLen > 1) {
            alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary.');
            return false;
        } 
		// Setting the Approver field based on subsidiary selected.       
        var subVal = subs[0];
        if (subVal != null && subVal != '') 
		{
            var filter = new Array();
            filter[0] = new nlobjSearchFilter('custrecord_subs_approver', null, 'anyof', subVal);
            filter[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            var rec = nlapiSearchRecord('customrecord_coaapprover', null, filter);            
            if (rec != null) 
			{
                var coaApprover = nlapiLookupField('customrecord_coaapprover', rec[0].getId(), 'custrecord_coaapp');
                nlapiSetFieldValue('custrecord_approvedby', coaApprover);
            }
            else 
			{
                alert('There is no Approver assigned for this Subsidiary. Please contact your Administrator.');
                nlapiSetFieldValue('custrecord_approvedby', '');
                return false;
            }
        }
        else 
		{
            nlapiSetFieldValue('custrecord_approvedby', '');
            return false;
        }
    }
	// Checking if the selected Subaccount is approved or not.
	if (name == 'custrecord_subaccount') 
	{
		var currentAccountType = nlapiGetFieldText('custrecord_accnttype');
		var subAccount = nlapiGetFieldText('custrecord_subaccount');
		if (subAccount != null && subAccount != '') 
		{
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_accntname', null, 'is', subAccount);
			var records = nlapiSearchRecord('customrecord_accounts', null, filters);
			if (records != null) 
			{
				var status = nlapiLookupField('customrecord_accounts', records[0].getId(), 'custrecord_approval_status_coa', true);
				var accountType = nlapiLookupField('customrecord_accounts', records[0].getId(),'custrecord_account_type',true);
				if (status == 'Pending Approval') 
				{
					alert('The Subaccount chosen has not been approved. Please select any other account.');
				}
				if (accountType != currentAccountType)
				{
					nlapiSetFieldText('custrecord_accnttype',accountType);
				}
			}
		}
	}	
    if(name == 'isinactive')
	{
		var status = nlapiGetFieldValue('isinactive');		
			nlapiSetFieldValue('custrecord_isinactive_account',status);
	}
	
    if (name == 'custrecord_include_children') 
	{
        var includeChildren = nlapiGetFieldValue('custrecord_include_children');
        var accntType = nlapiGetFieldText('custrecord_accnttype');
        if (includeChildren == 'T' && (accntType == 'Bank' || accntType == 'Credit Card')) 
		{
            alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary.');
			nlapiSetFieldValue('custrecord_include_children','F');
        }
    }	
    
    if (name == 'custrecord_deferral_account') 
	{
        nlapiDisableField('custrecord_include_children', true);
        nlapiSetFieldValue('custrecord_include_children', '');
	}
	
    if (name == 'custrecord_accnttype') 
	{
        var type = nlapiGetFieldText('custrecord_accnttype');		
		var children = nlapiGetFieldValue('custrecord_include_children');
		
        /*******  Enabling/disabling the fields on custom accounts form based on the account type selected ******/
        
        if (type == 'Accounts Receivable' || type == 'Accounts Payable') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_misc_category', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiSetFieldValue('custrecord_revalue', 'T');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Deferred Revenue') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Deferred Expense') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Other Asset' || type == 'Other Current Asset') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', false);
        }
        if (type == 'Cost of Goods Sold') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiDisableField('custrecord_deferral_account', false);
            nlapiDisableField('custrecord_track_expense', false);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Average');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Equity') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Historical');
            nlapiSetFieldText('custrecord_cashflowrate', 'Historical');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Expense' || type == 'Other Expense') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiDisableField('custrecord_deferral_account', false);
            nlapiDisableField('custrecord_track_expense', false);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Average');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Income' || type == 'Other Income') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_deferral_account', false);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_eliminate', false);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Average');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Bank') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_misc_category', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiSetFieldValue('custrecord_revalue', 'T');
            nlapiDisableField('custrecord_eliminate', true);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', false);
            var subs = nlapiGetFieldValues('custrecord_subs');
            var subLen = subs.length;
            if (subs && subLen > 1 || children == 'T') {
                alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary');
				nlapiSetFieldValue('custrecord_include_children','F');
                return false;
            }
        }  
		if (type == 'Credit Card') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_misc_category', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiSetFieldValue('custrecord_revalue', 'T');
            nlapiDisableField('custrecord_eliminate', true);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            var subs = nlapiGetFieldValues('custrecord_subs');
            var subLen = subs.length;
            if (subs && subLen > 1 || children == 'T') {
                alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary');
				nlapiSetFieldValue('custrecord_include_children','F');
                return false;
            }
        }      
        if (type == 'Long Term Liability' || type == 'Other Current Liability') 
		{
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'T');
            nlapiDisableField('custrecord_eliminate', false);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', false);
        }        
        if (type == 'Fixed Asset') {
            nlapiDisableField('custrecord_revalue', false);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'F');
            nlapiDisableField('custrecord_eliminate', true);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
        if (type == 'Unbilled Receivable') {
            nlapiDisableField('custrecord_revalue', true);
            nlapiDisableField('custrecord_deferral_account', true);
            nlapiDisableField('custrecord_track_expense', true);
            nlapiDisableField('custrecord_misc_category', false);
            nlapiSetFieldValue('custrecord_revalue', 'T');
            nlapiDisableField('custrecord_eliminate', true);
            nlapiSetFieldValue('custrecord_eliminate', 'F');
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            nlapiDisableField('custrecord_currency', true);
            nlapiSetFieldValue('custrecord_currency', '');
        }
    }    
 }
}

/**** Allowing/Not allowing to save the record based on various mandatory fields/conditions selected on newly creating record ****/
function ValidateFieldonSave() // OnSave function
{
    var type = nlapiGetFieldText('custrecord_accnttype');
    var curr = nlapiGetFieldText('custrecord_currency');
	//validation for currency if type is bank
    if (type == 'Bank' && curr == '') 
	{
        alert('Please enter value(s) for: Currency');
        return false;
    }
	//Validation for single subsidiary on Bank and credit card
    var subs = nlapiGetFieldValues('custrecord_subs');
    var subLen = subs.length;
	var child = nlapiGetFieldValue('custrecord_include_children');
    if ((type == 'Bank' || type == 'Credit Card') && (subLen > 1 || child == 'T')) 
	{
        alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary');
        return false;
    }

	/******* If the Bank/Credit card account type is assigned to an elimination Subsidiary *****/ 
	var subEliminationid = 6;//'Splunk Inc. : Splunk Consolidation Elimination'
	if (type == 'Bank' || type == 'Credit Card') {
		for(var x=0;x<subs.length;x++)
		{
			if(subs[x] == subEliminationid)
			{
				alert('This record may not be assigned to an elimination Subsidiary.');
				return false;
			}
		}
	}    
    
    var accntName = nlapiGetFieldValue('custrecord_name');
    var accntNumber = nlapiGetFieldValue('custrecord_number');
    //Check for Duplicate account number
    var filter = new Array();
    filter[0] = new nlobjSearchFilter('number', null, 'is', accntNumber);
    filter[1] = new nlobjSearchFilter('number', null, 'isnotempty', null);
    var result = nlapiSearchRecord('account', 'customsearch_extract_all_accounts_creatd', filter);
    if (result != null) 
	{
        alert('The account number you have chosen is already used.Go back, change the number and resubmit.');
        return false;
    }
	//Check for Approver
   var subVal = nlapiGetFieldValue('custrecord_approvedby'); 
    if (subVal == null || subVal == '') 
	{
        alert('There is no Approver assigned for this Subsidiary. Please contact your Administrator.');
        return false;
    }
	//Check for Duplicate account name
    var newFilter = new Array();
    newFilter[0] = new nlobjSearchFilter('name', null, 'is', accntName);
    var records = nlapiSearchRecord('account', 'customsearch_extract_all_accounts_creatd', newFilter);
    if (records != null) 
	{
        alert('The account name you have chosen is already used.Go back, change the name and resubmit.');
        return false;
    }
	//if Sub account is of accounts that are pending Approval
    var subAccount = nlapiGetFieldText('custrecord_subaccount');
    var currentAccountType = nlapiGetFieldText('custrecord_accnttype');
    if (subAccount) 
	{
        var filters = new Array();
		var columns = new Array();
        filters[0] = new nlobjSearchFilter('custrecord_accntname', null, 'is', subAccount);
		columns[0] = new nlobjSearchColumn('custrecord_account_type');
		columns[1] = new nlobjSearchColumn('custrecord_approval_status_coa');
        var records1 = nlapiSearchRecord('customrecord_accounts', null, filters,columns);
		var accountType = '';
        if (records1) {
            accountType = records1[0].getText('custrecord_account_type');
            var status = records1[0].getText('custrecord_approval_status_coa');
            if (status == 'Pending Approval') {
                alert('The Subaccount chosen has not been approved. Please select any other account.');
                return false;
            }            
        }
    }
		var deferralAccount = nlapiGetFieldValue('custrecord_deferral_account');
		var deferralAccountName = nlapiGetFieldText('custrecord_deferral_account');
		if(deferralAccount){
			var customSub = nlapiGetFieldValues('custrecord_subs');
			var accountRec = nlapiLoadRecord('account', deferralAccount);
			var stdSubsidiary = accountRec.getFieldValues('subsidiary'); 
			var includchild = accountRec.getFieldValue('includechildren');
			var stdSub ='';
			if(stdSubsidiary)
			{
				var subs = stdSubsidiary.toString();
				stdSub = subs.split(',');
			}			
			if (customSub.length > stdSub.length) 
			{
                alert('The subsidiary restrictions on this record are incompatible with those defined for account:' + deferralAccountName + '.' + 'Subsidiary access on this record must be a subset of those permitted by the account.');
                return false;
			}
			else 
			{
				if(includchild != 'T'){
					var aresult= [];
					var index={};
					customSub=customSub.sort();
					for(var c=0;c<stdSub.length;c++){
						index[stdSub[c]]=stdSub[c];
					}
					for(var d=0;d<customSub.length;d++){
						if(!(customSub[d] in index )){
							aresult.push(customSub[d]);
						}
					}
					if(aresult.length > 0){
						alert('The subsidiary restrictions on this record are incompatible with those defined for account:' + deferralAccountName + '.' + 'Subsidiary access on this record must be a subset of those permitted by the account.');
						return false;
					}
				}
			}
		}
    return true;
}