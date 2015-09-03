/**
* Enabling Chart of Accounts approval process for Editing Existing Accounts.
* @author Dinanath Bablu
* @Release Date 30th Dec 2013
* @Release Number RLSE0050094
* @version 1.0
* Change was done for hard coded path
* @Release Date 16th Jan 2014
* @Release Number RLSE0050112
* @version 2.0
*
*Made change in script under afterAccountSubmit() function to remove the condition for checking the Requester(Field Internal Id: custrecord_owner_ea) to set the User ID in this field when user edit the Update Accounts.
* @author   Jitendra Singh
* @Release Date 22nd May 2015
* @Release Number RLSE0050369
* @version 3.0
 */

var userRole = nlapiGetRole();

/******* Code for editing existing Accounts records *******/

var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var fromEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_fromemail');
var sendToEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_toemail');

// It is a client script and enables/disables the fields based on the account type. 
function updateAccountOnInit(type)
{
	var acctype = nlapiGetFieldText('custrecord_account_type');
	if(!acctype)
	{
		alert('You cannot create a new account from here. Please use the path "Setup -> COA Approval Process -> Accounts -> New" to create a new account or click Ok to take you to this path.');			
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa');
		window.open(rLink,'_self');
	}
	if(acctype == 'Other Asset' || acctype == 'Other Current Asset'|| acctype == 'Bank' || acctype == 'Long Term Liability' || acctype == 'Other Current Liability')
	{
		nlapiDisableField('custrecord_currency_value',true);
	}
    nlapiDisableField('custrecord_account_type', true);
    nlapiSetFieldValue('custrecord_approval_status_coa', '1');
	nlapiSetFieldValue('custrecord_date_approve_ea', '');	
	var subs = nlapiGetFieldValues('custrecord_subs_coa');
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
            nlapiSetFieldValue('custrecord_approver_coa', coaApprover);
        }
        else 
		{
            alert('There is no Approver assigned for this Subsidiary. Please contact your Administrator.');
            nlapiSetFieldValue('custrecord_approver_coa', '');
            return false;
        }
    }
    else 
	{
        nlapiSetFieldValue('custrecord_approver_coa', '');
        return false;
    }    
}

/****** Implementing functionalities/validations based on field change done ******/
function fieldChange_Sub(type, name)
{
    if (name == 'custrecord_subs_coa') {
        var subs = nlapiGetFieldValues('custrecord_subs_coa');
        var subVal = subs[0];
        if (subVal != null && subVal != '') {
            var filter = new Array();
            filter[0] = new nlobjSearchFilter('custrecord_subs_approver', null, 'anyof', subVal);
            filter[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            var rec = nlapiSearchRecord('customrecord_coaapprover', null, filter);
            if (rec != null) {
                var coaApprover = nlapiLookupField('customrecord_coaapprover', rec[0].getId(), 'custrecord_coaapp');
                nlapiSetFieldValue('custrecord_approver_coa',coaApprover);
            }
            else {
                alert('There is no Approver assigned for this Subsidiary. Please contact your Administrator.');
                return false;
            }
        }
    }
    if (name == 'custrecord_subaccount_info') {
        var type = nlapiGetFieldText('custrecord_account_type');
        var subAccount = nlapiGetFieldValue('custrecord_subaccount_info');
        if (subAccount != null && subAccount != '') {
            var filters = new Array();
            filters[0] = new nlobjSearchFilter('internalid', null, 'is', subAccount);
            var records = nlapiSearchRecord('account', null, filters);
            if (records != null) {
                var accountType = nlapiLookupField('account', records[0].getId(), 'type',true);
            }
            if (accountType != type) {
                alert('Type must be same as parent.');
                return false;
            }
        }
    }
	if(name == 'isinactive')
	{
		var status = nlapiGetFieldValue('isinactive');
		nlapiSetFieldValue('custrecord_isinactive',status);
	}
	if (name == 'custrecord_coa_include_children') 
	{
        var includeChildren = nlapiGetFieldValue('custrecord_coa_include_children');
        var accntType = nlapiGetFieldText('custrecord_account_type');
        if (includeChildren == 'T' && (accntType == 'Bank' || accntType == 'Credit Card')) 
		{
            alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary.');
			nlapiSetFieldValue('custrecord_coa_include_children','F');
        }
    }    
}

/****** Function running when an Update account is saved. *********/
function validateOnSave()
{
	var approver = nlapiGetFieldValue('custrecord_approver_coa');
    if (approver == null || approver == '') 
	{
        alert('There is no Approver assigned for this Record.');
        return false;
    }
	//check for sub account type validation to its parent type
    var subAccount = nlapiGetFieldText('custrecord_subaccount_info');
    var currentAccountType = nlapiGetFieldText('custrecord_account_type');
    if (subAccount) 
	{
		//if Sub account is of Update accounts
		var filters = new Array();
		var columns = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_accntname', null, 'is', subAccount);
		columns[0] = new nlobjSearchColumn('custrecord_account_type');
		columns[1] = new nlobjSearchColumn('custrecord_approval_status_coa');
		var records = nlapiSearchRecord('customrecord_accounts', null, filters, columns);
		var accountType = '';
		if (records) {
			accountType = records[0].getText('custrecord_account_type');
			var status = records[0].getText('custrecord_approval_status_coa');
			if (status == 'Pending Approval') {
				alert('The Subaccount chosen has not been approved. Please select any other account.');
				return false;
			}
		}
	}
		//Validation for single subsidiary on Bank and credit card
		var subs = nlapiGetFieldValues('custrecord_subs_coa');
		var subLen = subs.length;
		var child = nlapiGetFieldValue('custrecord_coa_include_children');
		if ((currentAccountType == 'Bank' || currentAccountType == 'Credit Card') && (subLen > 1 || child == 'T')) {
			alert('Bank Accounts and Credit Card Accounts must be restricted to a single Subsidiary');
			return false;
		}
		// If the Bank/Credit card account type is assigned to an elimination Subsidiary //
		var subEliminationid = 6; //'Splunk Inc. : Splunk Consolidation Elimination'
		if (currentAccountType == 'Bank' || currentAccountType == 'Credit Card') 
		{
			for (var x = 0; x < subs.length; x++) 
			{
				if (subs[x] == subEliminationid) 
				{
					alert('This record may not be assigned to an elimination Subsidiary.');
					return false;
				}
			}
		}
		//Check for Deferral Account
		var deferralAccount = nlapiGetFieldValue('custrecord_def_account_ea');
		var deferralAccountName = nlapiGetFieldText('custrecord_def_account_ea');
		if (deferralAccount) 
		{
			var customSub = nlapiGetFieldValues('custrecord_subs_coa');
			var accountRec = nlapiLoadRecord('account', deferralAccount);
			var stdSubsidiary = accountRec.getFieldValues('subsidiary');
			var includchild = accountRec.getFieldValue('includechildren');
			var stdSub = '';
			if (stdSubsidiary) 
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
				if (includchild != 'T') {
					var aresult = [];
					var index = {};
					customSub = customSub.sort();
					for (var c = 0; c < stdSub.length; c++) 
					{
						index[stdSub[c]] = stdSub[c];
					}
					for (var d = 0; d < customSub.length; d++) 
					{
						if (!(customSub[d] in index)) 
						{
							aresult.push(customSub[d]);
						}
					}
					if (aresult.length > 0) {
						alert('The subsidiary restrictions on this record are incompatible with those defined for account:' + deferralAccountName + '.' + 'Subsidiary access on this record must be a subset of those permitted by the account.');
						return false;
					}
				}
			}
		}
		var accntName = nlapiGetFieldValue('custrecord_accntname');
        var accntNumber = nlapiGetFieldValue('custrecord_accntnumber');
		var filter = new Array();
        filter[0] = new nlobjSearchFilter('custrecord_accntnumber', null, 'is', accntNumber);
        filter[1] = new nlobjSearchFilter('custrecord_accntnumber', null, 'isnotempty', null);
		filter[2] = new nlobjSearchFilter('internalid',null,'noneof',nlapiGetRecordId());
        var result = nlapiSearchRecord('customrecord_accounts', null, filter);
        if (result != null) {
            alert('The account number you have chosen is already used.Go back, change the number and resubmit.');
            return false;
        }
        
        var newFilter = new Array();
        newFilter[0] = new nlobjSearchFilter('custrecord_accntname', null, 'is', accntName);
		newFilter[1] = new nlobjSearchFilter('internalid',null,'noneof',nlapiGetRecordId());
        var records = nlapiSearchRecord('customrecord_accounts', null, newFilter);
        if (records != null) {
            alert('The account name you have chosen is already used.Go back, change the name and resubmit.');
            return false;
        }
		return true;
}

// Before load function deployed on the standard Accounts custom record type and it aims to create "Approve" and "Reject" buttons on editing it. 
function beforeLoadOnEdit(type, form, request)
{
    if (type == 'view' && (nlapiGetContext().getExecutionContext() == 'csvimport' || nlapiGetContext().getExecutionContext() == 'userinterface')) {
        try 
		{
            var id = nlapiGetRecordId();
            nlapiLogExecution('DEBUG', 'rec id is', nlapiGetRecordId());
            var approver = nlapiGetFieldValue('custrecord_approver_coa');
            var requester = nlapiGetFieldValue('custrecord_owner_ea');    
            if (nlapiGetRecordId() != null && nlapiGetRecordId() != '' && nlapiGetFieldValue('custrecord_approval_status_coa') != '2' && nlapiGetFieldValue('custrecord_approval_status_coa') != '3' && ((nlapiGetUser() == approver && (approver  != requester)) || userRole == '3')) 
			{
                var url = nlapiResolveURL('SUITELET', 'customscript_create_custom_account', 'customdeploy_save_existing_coa');
                url += '&pendingAccountid=' + nlapiGetRecordId();
                var approvedUrl = reqUrl + url;
                nlapiLogExecution('DEBUG', 'url is', approvedUrl);
                var openUrl = "window.open('" + approvedUrl + "','_self')";
                form.addButton('custpage_approve', 'Approve', openUrl);
                
                form.setScript('customscript_reject_coa'); // Putting a reference of the client script
                form.addButton('custpage_reject', 'Reject', 'onRejectingCoa(' + id + ')'); // Creation of "Reject" Button            
            }
        } 
        catch (e) 
		{
            nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
    
    if (type == 'edit') 
	{
        form.removeButton('submitas');
		var accntnumber = nlapiGetFieldValue('custrecord_accntnumber');
		if(accntnumber != null && accntnumber != '') {
			nlapiLogExecution('DEBUG','name is',accntnumber);
			var f = new Array();
			f[0] = nlobjSearchFilter('number',null,'is',accntnumber);		
			var records = nlapiSearchRecord('account',null,f);
			if(records != null)
			{
				var id = records[0].getId();
				nlapiLogExecution('DEBUG','id val is',id);
				
				var filter = new Array();
				filter[0] = nlobjSearchFilter('account', null ,'is',id);
				filter[1] = nlobjSearchFilter('accounttype', null, 'is', 'Bank');

				var results = nlapiSearchRecord('transaction',null,filter);
				if(results != null)
				{
					form.getField('custrecord_subs_coa').setDisplayType('inline');
				}
			}
		}
	}
	display(type,form);
}

/**** AfterSubmit function to populate requester, submission date, approval date fields ******/
function afterAccountSubmit(type)
{
    if (type == 'edit') 
	{
        try 
		{
            var sysdate = new Date();
            var submitDate = nlapiDateToString(sysdate, 'mm/dd/yyyy');
			var submissionDate = nlapiDateToString(sysdate,'datetime');
			var acctype = nlapiGetFieldText('custrecord_account_type');
			// For determining submission time and approval time
			nlapiLogExecution('DEBUG', 'Date is', sysdate);
            var min = sysdate.getMinutes();
            if (min == 0) 
			{
                nlapiLogExecution('DEBUG', 'IN', 'here');                
                var currenttime = sysdate.getHours() + ":" + "00";
                nlapiLogExecution('DEBUG', 'IN', currenttime);
                
            }
            else 
                if (min == 1 || min == 2 || min == 3 || min == 4 || min == 5 || min == 6 || min == 7 || min == 8 || min == 9) {
                    nlapiLogExecution('DEBUG', 'IN', min);
                    var currenttime = sysdate.getHours() + ":" + "0" + sysdate.getMinutes();
                    nlapiLogExecution('DEBUG', 'IN', currenttime);
                    
                }
                else 
				{
                    var currenttime = sysdate.getHours() + ":" + sysdate.getMinutes();
                }
				
			// If data edited using CSV imported 
			if (nlapiGetContext().getExecutionContext() == 'csvimport') 
			{
				nlapiSetFieldValue('custrecord_account_type', acctype);
				nlapiSetFieldValue('custrecord_approval_status_coa', '1');
				nlapiSetFieldValue('custrecord_submissiondateandtime_ua',submissionDate);
				nlapiSubmitField('customrecord_accounts', nlapiGetRecordId(),['custrecord_approval_status_coa','custrecord_submissiondateandtime_ua'],['1',submissionDate]);
             var subs = nlapiGetFieldValues('custrecord_subs_coa');
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
                        nlapiSetFieldValue('custrecord_approver_coa', coaApprover);
                        nlapiSubmitField('customrecord_accounts', nlapiGetRecordId(), 'custrecord_approver_coa', coaApprover);
                    }
                    else 
					{
                        alert('There is no Approver assigned for this Subsidiary. Please contact your Administrator.');
                        nlapiSetFieldValue('custrecord_approver_coa', '');
                    }
                }	
				var appstatus = nlapiGetFieldValue('custrecord_approval_status_coa');
				var coaid = nlapiGetFieldValue('custrecord_coaid');
				nlapiLogExecution('DEBUG','appstatus '+appstatus,' coaid '+coaid);
				if(coaid){
					nlapiSubmitField('account', coaid, 'isinactive','T');
				}
			}
			
			//Start- For DFCT0050515 need to remove the condition for checking the Requester field value by Jitendra on 24th April 2015 
				nlapiSetFieldValue('custrecord_owner_ea', nlapiGetUser());
				nlapiSubmitField('customrecord_accounts', nlapiGetRecordId(), 'custrecord_owner_ea', nlapiGetUser());
			/*END - For DFCT0050515*/
			
			if (nlapiGetRecordId() != null && nlapiGetRecordId() != '' && nlapiGetFieldValue('custrecord_approval_status_coa') == '1') 
			{
				var approver = nlapiGetFieldValue('custrecord_approver_coa');
				nlapiSetFieldValue('custrecord_submissiondateandtime_ua',submissionDate);
				nlapiSubmitField('customrecord_accounts', nlapiGetRecordId(), ['custrecord_date_submit_ea','custrecord_submit_time_updateaccount','custrecord_approve_time_updateaccount','custrecord_submissiondateandtime_ua'],[submitDate,currenttime,'',submissionDate]);
				
				// Sending the mail for approval
				var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_accounts', nlapiGetRecordId(), 'VIEW');
				var Email = nlapiSendEmail(fromEmail, approver, 'A COA needs your Approval', 'Hi,' + '<br><br>' + 'Please approve the following COA:' + '<br>' + nlapiGetFieldValue('custrecord_accntnumber') + '<br><br>' + 'Thanks' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
			}			
			var appstatus = nlapiGetFieldValue('custrecord_approval_status_coa');
			var coaid = nlapiGetFieldValue('custrecord_coaid');
			nlapiLogExecution('DEBUG','appstatus out'+appstatus,' coaid '+coaid);
			if(coaid !=null && coaid != '' && appstatus == '1')
			{
				nlapiSubmitField('account', coaid, 'isinactive','T');
				nlapiLogExecution('DEBUG','appstatus in'+appstatus,' coaid '+coaid);
			}
        } 
        catch (e) 
		{
            nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
        }		
    }
}

/****** Suitelet for opening the updated existing Account after being Approved *************/
function saveExistingAccount(request, response){
    var id = request.getParameter('pendingAccountid');
    if (id) 
	{
		var accntNum = '';
		var coaApprover = nlapiGetUser();
        try 
		{
            nlapiLogExecution('DEBUG', 'Checking', 'Starting......');			
			var currentRec = nlapiLoadRecord('customrecord_accounts', id);
			accntNum = currentRec.getFieldValue('custrecord_accntnumber');
			var coaid = currentRec.getFieldValue('custrecord_coaid');
			var user = currentRec.getFieldValue('custrecord_owner_ea');
            var approvalDate = new Date();
            var apprvlDate = nlapiDateToString(approvalDate, 'datetime');
            var requester = currentRec.getFieldValue('custrecord_owner_ea');
		    var acctype = currentRec.getFieldText('custrecord_account_type');	
			var fields = new Array();
			var values = new Array();
            if (coaid) //check for Coaid in Update accounts
			{
				var stdRec = nlapiLoadRecord('account', coaid);
				nlapiLogExecution('Error', 'id id is', coaid);
				if (stdRec.getFieldValue('acctname') != currentRec.getFieldValue('custrecord_accntname')) {
					stdRec.setFieldValue('acctname', currentRec.getFieldValue('custrecord_accntname'));
				}
				if (stdRec.getFieldValue('acctnumber') != currentRec.getFieldValue('custrecord_accntnumber')) {
					stdRec.setFieldValue('acctnumber', currentRec.getFieldValue('custrecord_accntnumber'));
				}
				if (stdRec.getFieldValue('currency') != currentRec.getFieldValue('custrecord_currency_value')) {
					stdRec.setFieldValue('currency', currentRec.getFieldValue('custrecord_currency_value'));
				}
				if (stdRec.getFieldText('generalrate') != currentRec.getFieldText('custrecord_rate_general')) {
					stdRec.setFieldText('generalrate', currentRec.getFieldText('custrecord_rate_general'));
				}
				if (stdRec.getFieldText('cashflowrate') != currentRec.getFieldText('custrecord_rate_cashflow')) {
					stdRec.setFieldText('cashflowrate', currentRec.getFieldText('custrecord_rate_cashflow'));
				}
				if ((stdRec.getFieldValue('parent') != currentRec.getFieldValue('custrecord_subaccount_info')) && (currentRec.getFieldValue('custrecord_subaccount_info') != '' && currentRec.getFieldValue('custrecord_subaccount_info') != null)) {
					nlapiLogExecution('DEBUG','parent is',currentRec.getFieldValue('custrecord_subaccount_info'));
					stdRec.setFieldValue('parent', currentRec.getFieldValue('custrecord_subaccount_info'));
				}
				if (stdRec.getFieldValue('billableexpensesacct') != currentRec.getFieldValue('custrecord_expense_track_ea')) {
					stdRec.setFieldValue('billableexpensesacct', currentRec.getFieldValue('custrecord_expense_track_ea'));
				}
				if ((stdRec.getFieldValue('eliminate') != currentRec.getFieldValue('custrecord_eliminate_tran')) && (acctype != 'Bank' && acctype != 'Credit Card' && acctype != 'Fixed Asset' && acctype != 'Unbilled Receivable')) {
					stdRec.setFieldValue('eliminate', currentRec.getFieldValue('custrecord_eliminate_tran'));
				}
				if (stdRec.getFieldValue('deferralacct') != currentRec.getFieldValue('custrecord_def_account_ea')) {
					stdRec.setFieldValue('deferralacct', currentRec.getFieldValue('custrecord_def_account_ea'));
				}
				if (stdRec.getFieldValue('description') != currentRec.getFieldValue('custrecord_desc_coa')) {
					stdRec.setFieldValue('description', currentRec.getFieldValue('custrecord_desc_coa'));
				}
				
				var str = currentRec.getFieldValue('custrecord_subs_coa');
				var string = str.toString();
				var strChar5 = String.fromCharCode(5);
				var multiSelectStringArray = string.split(strChar5);
				nlapiLogExecution('DEBUG','Array is',multiSelectStringArray);

				var str1 = stdRec.getFieldValue('subsidiary');
				var string1 = str1.toString();
				var strChar1 = String.fromCharCode(5);
				var multiSelectStringArray1 = string1.split(strChar5);
				nlapiLogExecution('DEBUG','Array1 is',multiSelectStringArray1);				

				if(multiSelectStringArray.length == '1' && (multiSelectStringArray.length == multiSelectStringArray1.length))
				{
					for(var t = 0; t < multiSelectStringArray.length; t++)
					{
						var a_sub = multiSelectStringArray[t];
						nlapiLogExecution('DEBUG','a_sub is',a_sub);	
						for(var g = 0; g < multiSelectStringArray1.length; g++)
						{
							var b_sub = multiSelectStringArray1[g];
							nlapiLogExecution('DEBUG','b_sub is',b_sub);	
							if(a_sub == b_sub)
							{
								break;
							}
							else
							{
								stdRec.setFieldValue('subsidiary', multiSelectStringArray);
							}
						}
					}
				}				
				else
				{
					stdRec.setFieldValue('subsidiary', multiSelectStringArray);
				}				
				if ((stdRec.getFieldValue('revalue') != currentRec.getFieldValue('custrecord_revalue_balance')) && (acctype == 'Bank' || acctype == 'Credit Card' || acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Other Asset' || acctype == 'Other Current Asset' || acctype == 'Fixed Asset' || acctype == 'Long Term Liability' || acctype == 'Other Current Liability')) {
					stdRec.setFieldValue('revalue', currentRec.getFieldValue('custrecord_revalue_balance'));
				}
				if (stdRec.getFieldValue('isinactive') != currentRec.getFieldValue('isinactive')) {
					stdRec.setFieldValue('isinactive', currentRec.getFieldValue('isinactive'));
				}
				if (stdRec.getFieldValue('department') != currentRec.getFieldValue('custrecord_dept')) {
					stdRec.setFieldValue('department', currentRec.getFieldValue('custrecord_dept'));
				}
				if (stdRec.getFieldValue('class') != currentRec.getFieldValue('custrecord_class_coa')) {
					stdRec.setFieldValue('class', currentRec.getFieldValue('custrecord_class_coa'));
				}
				if (stdRec.getFieldValue('location') != currentRec.getFieldValue('custrecord_coa_location')) {
					stdRec.setFieldValue('location', currentRec.getFieldValue('custrecord_coa_location'));
				}
				if (stdRec.getFieldValue('category1099misc') != currentRec.getFieldValue('custrecord_coa_misc')) {
					stdRec.setFieldValue('category1099misc', currentRec.getFieldValue('custrecord_coa_misc'));
				}
				if (stdRec.getFieldValue('custrecordqb_account') != currentRec.getFieldValue('custrecord_coa_qb_account')) {
					stdRec.setFieldValue('custrecordqb_account', currentRec.getFieldValue('custrecord_coa_qb_account'));
				}
				if (stdRec.getFieldValues('custrecord_fam_account_showinfixedasset') != currentRec.getFieldValues('custrecord_coa_fixed_asset')) {
					stdRec.setFieldValues('custrecord_fam_account_showinfixedasset', currentRec.getFieldValues('custrecord_coa_fixed_asset'));
				}
				if (stdRec.getFieldValue('includechildren') != currentRec.getFieldValue('custrecord_coa_include_children')) {
					stdRec.setFieldValue('includechildren', currentRec.getFieldValue('custrecord_coa_include_children'));
				}
				stdRec.setFieldValue('custrecord_appstatus', 2);
				stdRec.setFieldValue('isinactive', currentRec.getFieldValue('isinactive'));
				if (coaApprover) {
					stdRec.setFieldValue('custrecord_to_be_approvedby', coaApprover);
				}
				if (requester) {
					stdRec.setFieldValue('custrecord_requester', requester);
				}				
				var stdRecId = nlapiSubmitRecord(stdRec,true);
				//************************************Set fields on Update Accounts on Approval************************************			
				fields.push('custrecord_approval_status_coa');
				values.push(2);
				fields.push('custrecord_approver_coa');
				values.push(coaApprover);
				fields.push('custrecord_rejection_comment');
				values.push('');
				fields.push('custrecord_approval_time_ua');
				values.push(apprvlDate);
				var recId = nlapiSubmitField('customrecord_accounts', id, fields, values);
				nlapiLogExecution('DEBUG','recId is',recId);
				var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_accounts', recId, 'VIEW');
				var Email = nlapiSendEmail(coaApprover, user, 'Your COA is Approved', 'The below COA is Approved ' + '<br>' + accntNum + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
				nlapiLogExecution('Error', 'rec id is', 'COA Rec Id:' + recId);
				nlapiSetRedirectURL('RECORD', 'customrecord_accounts', id, false);
			}		
        } 
        catch (er) 
		{
            nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
			var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_accounts', id, 'VIEW');
			var errormsgemail = accntNum + '<br> Error ' + er.toString() + '<br>' + '<a href=' + rLink + '><b>View Record</b></a><br><br>';
			var Email = nlapiSendEmail(coaApprover, sendToEmail, 'Your COA is Not Approved due to limitation/permission Errors', 'The below COA has limitation errors : ' + '<br>' + errormsgemail, null, null, null);
            nlapiSetRedirectURL('RECORD', 'customrecord_accounts', id, false);
        }
    }
}

/****** ClientScript for opening the updated existing Account after being Rejected *************/
function onRejectingCoa(id){
    try {
        var comment = nlapiLookupField('customrecord_accounts', id, 'custrecord_rejection_comment');
        if (comment == '' || comment == null) {
            alert('Please Enter COA Rejection Comment');
            return false;
        }
        else {
			var url = nlapiResolveURL('SUITELET', 'customscript_splunk_rejectupdatecoa_suit', 'customdeploy_splunk_rejectupdatecoa_suit');
			url += '&pendingAccountid=' + id;
			window.location = reqUrl + url;
        }
    }    
    catch (er) {
        nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
        var error = '';
        nlapiLogExecution('Error', 'Checking', typeof(er));
        if (er instanceof nlobjError) {
            error += 'Error: ' + er.getDetails();
        }
        else {
            error += 'Error: ' + (er == null ? 'Unexpected error occured!' : er.toString());
        }
        alert(error);
    }
}

function RejectCOASuitelet(request, response)
{
	var id = request.getParameter('pendingAccountid');
    if (id) {
		try {
				var fields = ['custrecord_rejection_comment', 'custrecord_accntnumber', 'custrecord_owner_ea'];
				var columns = nlapiLookupField('customrecord_accounts', id, fields);
				var comment = columns.custrecord_rejection_comment;
				var approver = nlapiGetUser();
				var date_rejection = new Date();
				var rejectionDate = nlapiDateToString(date_rejection, 'datetime');
				var requester = columns.custrecord_owner_ea;
				var accntNum = columns.custrecord_accntnumber;
				nlapiLogExecution('DEBUG', 'date_rejection '+date_rejection, 'rejectionDate '+rejectionDate);
				var recId = nlapiSubmitField('customrecord_accounts', id, ['custrecord_approval_status_coa','custrecord_rejectiondate_ua'],[3,rejectionDate]);			
				var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_accounts', id, 'VIEW');
				var Email = nlapiSendEmail(approver, requester, 'Your COA is Rejected', 'Hi,' + '<br><br>' + 'COA ' + accntNum + ' is rejected with Rejection Comments: ' + comment + '<br><br>' + 'Thanks,' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
				nlapiSetRedirectURL('RECORD','customrecord_accounts',recId);
		}
		catch (er) {
			 nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
            var error = '';
            nlapiLogExecution('Error', 'Checking', typeof(er));
            if (er instanceof nlobjError) {
                error += 'Error: ' + er.getDetails();
            }
            else {
                error += 'Error: ' + (er == null ? 'Unexpected error occured!' : er.toString());
            }
            response.write(error);
            return;
		}
	}
}
/***** Function to set the fields based on Account type selected ***********/
function display(type,form)
{
    var acctype = nlapiGetFieldText('custrecord_account_type');
    if (type == 'create' || type == 'edit') 
	{
        if (acctype == 'Accounts Receivable' || acctype == 'Accounts Payable' || acctype == 'Unbilled Receivable') 
		{        
            form.getField('custrecord_revalue_balance').setDisplayType('inline');
            if (acctype == 'Unbilled Receivable') 
			{
                form.getField('custrecord_eliminate_tran').setDisplayType('disabled');
                form.getField('custrecord_coa_misc').setDisplayType('normal');
            }
            else 
			{
                form.getField('custrecord_eliminate_tran').setDisplayType('normal');
                form.getField('custrecord_coa_misc').setDisplayType('disabled');
            }
            form.getField('custrecord_currency_value').setDisplayType('disabled');
            form.getField('custrecord_def_account_ea').setDisplayType('disabled');
            form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
        }
        else if (acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Other Asset' || acctype == 'Other Current Asset' || acctype == 'Fixed Asset') 
		{
			form.getField('custrecord_revalue_balance').setDisplayType('normal');
			if (acctype == 'Fixed Asset') {
				form.getField('custrecord_eliminate_tran').setDisplayType('disabled');
			}
			else {
				form.getField('custrecord_eliminate_tran').setDisplayType('normal');
			}
			if (acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Fixed Asset') {
				form.getField('custrecord_currency_value').setDisplayType('disabled');
			}
			else {
				form.getField('custrecord_currency_value').setDisplayType('normal');
			}
			form.getField('custrecord_def_account_ea').setDisplayType('disabled');
			form.getField('custrecord_coa_misc').setDisplayType('normal');
			form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
		}
		else if (acctype == 'Bank' || acctype == 'Credit Card') {                
			form.getField('custrecord_revalue_balance').setDisplayType('normal');
			form.getField('custrecord_eliminate_tran').setDisplayType('disabled');
			if (acctype == 'Bank') {
				form.getField('custrecord_currency_value').setDisplayType('normal');
			}
			else {
				form.getField('custrecord_currency_value').setDisplayType('disabled');
			}
			form.getField('custrecord_def_account_ea').setDisplayType('disabled');
			form.getField('custrecord_coa_misc').setDisplayType('disabled');
			form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
		}
		else if (acctype == 'Cost of Goods Sold' || acctype == 'Equity' || acctype == 'Expense' || acctype == 'Income' || acctype == 'Other Expense' || acctype == 'Other Income') 
		{                    
			form.getField('custrecord_revalue_balance').setDisplayType('disabled');
			form.getField('custrecord_eliminate_tran').setDisplayType('normal');
			if (acctype == 'Equity') {
				form.getField('custrecord_def_account_ea').setDisplayType('disabled');
				form.getField('custrecord_coa_misc').setDisplayType('normal');
				form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
			}
			else {
				form.getField('custrecord_def_account_ea').setDisplayType('normal');
				form.getField('custrecord_coa_misc').setDisplayType('normal');
				if (acctype == 'Income' || acctype == 'Other Income') 
				{
					form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
				}
				else 
				{
					form.getField('custrecord_expense_track_ea').setDisplayType('normal');
				}
			}
			form.getField('custrecord_currency_value').setDisplayType('disabled');                    
		}
		else if (acctype == 'Long Term Liability' || acctype == 'Other Current Liability') {                        
			form.getField('custrecord_revalue_balance').setDisplayType('normal');
			form.getField('custrecord_eliminate_tran').setDisplayType('normal');
			form.getField('custrecord_currency_value').setDisplayType('normal');                            
			form.getField('custrecord_def_account_ea').setDisplayType('disabled');
			form.getField('custrecord_coa_misc').setDisplayType('normal');
			form.getField('custrecord_expense_track_ea').setDisplayType('disabled');
		}
    }
}