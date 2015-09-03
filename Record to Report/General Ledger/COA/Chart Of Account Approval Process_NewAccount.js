/**
 * Enabling Chart of Accounts approval process for Newly created Accounts.
 * @author Dinanath Bablu
 * @Release Date 30th Dec 2013
 * @Release Number RLSE0050094
 * @version 1.0
 * Change was done for hard coded path
 * @Release Date 16th Jan 2014
 * @Release Number RLSE0050112
 * @version 2.0
 */
var userRole = nlapiGetRole();
var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var fromEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_fromemail');
var sendToEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_toemail');

/* Applying before load function on the Custom Account record. The "Approve" and "Reject" buttons are available to the 
 Approver or the Administrator. On clicking "Approve" button, it will create an entry in standard COA list.
 On Rejecting, it will not create an entry in standard COA list */

function beforeLoad(type, form, request)
{
    if (type == 'view') 
	{
        try {
            var id = nlapiGetRecordId();
            nlapiLogExecution('DEBUG', 'rec id is', id);
            var approver = nlapiGetFieldValue('custrecord_approvedby');
            var requester = nlapiGetFieldValue('custrecord_owner_accounts');
            // If the user is either the Approver or it is an Administrator.
              if (nlapiGetRecordId() != null && nlapiGetRecordId() != '' && ((nlapiGetUser() == approver && (approver  != requester)) || userRole == '3') && (nlapiGetUser()) && nlapiGetFieldText('custrecord_approvalstatus') != 'Approved' && nlapiGetFieldText('custrecord_approvalstatus') != 'Rejected')  {
                var url = nlapiResolveURL('SUITELET', 'customscript_approve_new_coa', 'customdeploy_approving_coa');
                url += '&pendingAccountid=' + nlapiGetRecordId();
                var approvedUrl = reqUrl + url;
                nlapiLogExecution('DEBUG', 'url is', approvedUrl);
                var openUrl = "window.open('" + approvedUrl + "','_self')";
                form.addButton('custpage_approve', 'Approve', openUrl); // Creation of "Approve" Button               
                form.setScript('customscript_rejectcoa'); // Putting a reference of the client script
                form.addButton('custpage_reject', 'Reject', 'rejectCOA(' + id + ')'); // Creation of "Reject" Button
            }
            else 
                if (nlapiGetFieldText('custrecord_approvalstatus') == 'Approved') 
				{
                    form.removeButton('edit');
                }
        } 
        catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
    if (type == 'edit') 
	{
		var acctype = nlapiGetFieldText('custrecord_accnttype');
		if(acctype == 'Other Asset' || acctype == 'Other Current Asset'|| acctype == 'Bank' || acctype == 'Long Term Liability' || acctype == 'Other Current Liability')
		{
			form.getField('custrecord_currency').setDisplayType('disabled');
		}
        var approvalStatus = nlapiGetFieldValue('custrecord_approvalstatus');
        if (approvalStatus == '2' && userRole != '3') 
		{
            nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
        }
    }
	
	display(type,form);
}

/***** Implementing Validations ******/
function checkAccountBeforeSubmit(type)
{
    if (type == 'create' && (nlapiGetContext().getExecutionContext() == 'csvimport' || nlapiGetContext().getExecutionContext() == 'userinterface')) 
	{		
			var accountNum = nlapiGetFieldValue('custrecord_number');
			nlapiLogExecution('DEBUG', 'number ', accountNum);
			var accntName = nlapiGetFieldValue('custrecord_name');
			nlapiLogExecution('DEBUG', 'IN', accntName);
			
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
                    var accountType = nlapiLookupField('customrecord_accounts', records[0].getId(), 'custrecord_account_type', true);
                    if (status == 'Pending Approval') 
					{
                        throw nlapiCreateError('User Defined', 'The Subaccount chosen has not been approved. Please select any other account.', true);
                    }
                    if (accountType != currentAccountType) 
					{
                        throw nlapiCreateError('User Defined', 'Type must be same as parent.', true);
                    }
                }
            }
            var currency = nlapiGetFieldValue('custrecord_currency');
			var acctype = nlapiGetFieldText('custrecord_accnttype');
			if (acctype == 'Bank' && (currency == null || currency == '') && nlapiGetContext().getExecutionContext() != 'userinterface') 
			{
				throw nlapiCreateError('User Defined','Please enter value(s) for: Currency',true);
			}
			var filter = new Array();
			filter[0] = new nlobjSearchFilter('custrecord_number', null, 'is', accountNum);
			var results = nlapiSearchRecord('customrecord_coa', 'customsearch_accounts_duplicate', filter);
			
			/*** If the account number/name selected has already been used ****/
			if (results != null) 
			{
				throw nlapiCreateError('User Defined', 'The account number you have chosen is already used.Go back, change the number and resubmit.', true);
			}
			var nameFilter = new Array();
			nameFilter[0] = new nlobjSearchFilter('custrecord_name', null, 'is', accntName);
			var records = nlapiSearchRecord('customrecord_coa', 'customsearch_accounts_duplicate', nameFilter);
			
			if (records != null) 
			{
				throw nlapiCreateError('User Defined', 'The account name you have chosen is already used.Go back, change the name and resubmit.', true);
			}
			
			/******* If the Bank/Credit card account type is assigned to an elimination Subsidiary *****/ 
			var subsName = nlapiGetFieldText('custrecord_subs');
			var acctype = nlapiGetFieldText('custrecord_accnttype');
			if (acctype == 'Bank' || acctype == 'Credit Card') 
			{
				if (subsName == 'Splunk Inc. : Splunk Consolidation Elimination') 
				{
					throw nlapiCreateError('User Defined', 'This record may not be assigned to an elimination Subsidiary.', true);
				}
			}
		}	
}

/**** After Saving the created Record *****/

function afterSubmit(type)
{
    try {
		if (type == 'create' && (nlapiGetContext().getExecutionContext() == 'csvimport' || nlapiGetContext().getExecutionContext() == 'userinterface')) {			
			var sysdate = new Date();
			var user = nlapiGetUser();
			nlapiLogExecution('DEBUG', 'user id is', user);
			var submitDate = nlapiDateToString(sysdate, 'mm/dd/yyyy');
			
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
					nlapiLogExecution('DEBUG', 'time is', currenttime);
                }
			if (nlapiGetContext().getExecutionContext() == 'csvimport') {
				var subs = nlapiGetFieldValues('custrecord_subs');
				var subVal = subs[0];
				if (subVal != null && subVal != '') {
					var filter = new Array();
					filter[0] = new nlobjSearchFilter('custrecord_subs_approver', null, 'anyof', subVal);
					filter[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
					var rec = nlapiSearchRecord('customrecord_coaapprover', null, filter);
					
					if (rec != null) {
						var coaApprover = nlapiLookupField('customrecord_coaapprover', rec[0].getId(), 'custrecord_coaapp');
						nlapiSetFieldValue('custrecord_approvedby', coaApprover);
						nlapiSubmitField('customrecord_coa', nlapiGetRecordId(), 'custrecord_approvedby', coaApprover);
					}
					else {
						throw nlapiCreateError('User Defined', 'The record created does not have an approver.', true);
					}
					nlapiSetFieldValue('custrecord_approvalstatus', '1');
					nlapiSetFieldValue('custrecord_date', submitDate);
					nlapiSetFieldText('custrecord_submit_time_na',currenttime);
					nlapiSetFieldValue('custrecord_owner_accounts', user);
					nlapiSubmitField('customrecord_coa', nlapiGetRecordId(), ['custrecord_approvalstatus', 'custrecord_date', 'custrecord_owner_accounts','custrecord_submit_time_na'], ['1', submitDate, user,currenttime]);
					var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa', nlapiGetRecordId(), 'VIEW');
					var Email = nlapiSendEmail(fromEmail, coaApprover, 'A COA needs your Approval', 'Hi,' + '<br><br>' + 'Please approve the following COA:' + '<br>' + nlapiGetFieldValue('custrecord_number') + '<br><br>' + 'Thanks' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
				}
			}
			else 
				if (nlapiGetRecordId() != null && nlapiGetRecordId() != '' && nlapiGetFieldText('custrecord_approvalstatus') == 'Pending Approval') {
					var approver = nlapiGetFieldValue('custrecord_approvedby');
					nlapiSetFieldValue('custrecord_date', submitDate);
					nlapiSetFieldValue('custrecord_submit_time_na',currenttime);
					nlapiSetFieldValue('custrecord_owner_accounts', user);
					nlapiSubmitField('customrecord_coa', nlapiGetRecordId(), ['custrecord_date', 'custrecord_owner_accounts','custrecord_submit_time_na'], [submitDate, user,currenttime]);
					// Sending the mail for approval
					var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa', nlapiGetRecordId(), 'VIEW');
					var Email = nlapiSendEmail(fromEmail, approver, 'A COA needs your Approval', 'Hi,' + '<br><br>' + 'Please approve the following COA:' + '<br>' + nlapiGetFieldValue('custrecord_number') + '<br><br>' + 'Thanks' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
				}
			}
			if (type == 'edit') {
				var requester = nlapiGetFieldValue('custrecord_owner_accounts');
				if (nlapiGetRecordId() != null && nlapiGetRecordId() != '' && nlapiGetFieldText('custrecord_approvalstatus') == 'Pending Approval') {
					var approver = nlapiGetFieldValue('custrecord_approvedby');
					// Sending the mail for approval
					var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa', nlapiGetRecordId(), 'VIEW');
					var Email = nlapiSendEmail(fromEmail, approver, 'A COA needs your Approval', 'Hi,' + '<br><br>' + 'Please approve the following COA:' + '<br>' + nlapiGetFieldValue('custrecord_number') + '<br><br>' + 'Thanks' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
				}
			}
		}
	catch (e) 
	{
		nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
	}
    if (type == 'delete') 
	{
        try 
		{
            nlapiSetRedirectURL('RECORD', 'customrecord_coa');
        } 
        catch (e) 
		{
            nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
}

 /******** On Rejecting the New Record ***************/

function rejectCOA(id){
    try {
        var fields = ['custrecord_reject_comment', 'custrecord_number', 'custrecord_owner_accounts'];
        var columns = nlapiLookupField('customrecord_coa', id, fields);
        var comment = columns.custrecord_reject_comment;
        var approver = nlapiGetUser();
        var requester = columns.custrecord_owner_accounts;
        var accntNum = columns.custrecord_number;
        var rec = nlapiLoadRecord('customrecord_coa', id);        
        if (comment == '' || comment == null) {
            alert('Please Enter COA Rejection Comment');
            return false;
        }
        else {
            rec.setFieldValue('custrecord_approvalstatus', 3);
            rec.setFieldValue('custrecord_approvedby', approver);
            var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa', nlapiGetRecordId(), 'VIEW');
            var Email = nlapiSendEmail(approver, requester, 'Your COA is Rejected', 'Hi,' + '<br><br>' + 'COA ' + accntNum + ' is rejected with Rejection Comments: ' + comment + '<br><br>' + 'Thanks,' + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
        }
        var recId = nlapiSubmitRecord(rec, true);
        location.reload();
    } 
    
    catch (er) {
        nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
        var error = '';
        nlapiLogExecution('Error', 'Checking', typeof(er));
        if (er instanceof nlobjError){ 
            error += 'Error: ' + er.getDetails();
            }
        else {
            error += 'Error: ' + (er == null ? 'Unexpected error occured!' : er.toString());
        }
        alert(error);        
    }
}


/****** Suitelet for Creating an entry of the newly created Accounts in the standard COA list *************/

function createStandardAccount(request, response){
    var id = request.getParameter('pendingAccountid');
    if (id) {
        try {
			nlapiLogExecution('DEBUG', 'Checking', 'Starting......');
			var pendingAccount = nlapiLoadRecord('customrecord_coa', id);
			var coaApprover = nlapiGetUser();
			var pendingaccountno = pendingAccount.getFieldValue('custrecord_number');
			var approvalDate = new Date();
			var aprvlDate = nlapiDateToString(approvalDate, 'mm/dd/yyyy');
			var user = pendingAccount.getFieldValue('custrecord_owner_accounts');
			var submissionDate = pendingAccount.getFieldValue('custrecord_date');
			//***********************************Create Standard Accounts : Begin ****************************************************
			var accountRec = nlapiCreateRecord('account');
			accountRec.setFieldText('accttype', pendingAccount.getFieldText('custrecord_accnttype'));
			accountRec.setFieldValue('acctnumber', pendingAccount.getFieldValue('custrecord_number'));
			accountRec.setFieldValue('acctname', pendingAccount.getFieldValue('custrecord_name'));
			accountRec.setFieldValue('currency', pendingAccount.getFieldValue('custrecord_currency'));
			accountRec.setFieldText('generalrate', pendingAccount.getFieldText('custrecord_generalrate'));
			accountRec.setFieldText('cashflowrate', pendingAccount.getFieldText('custrecord_cashflowrate'));
			accountRec.setFieldValue('parent', pendingAccount.getFieldValue('custrecord_subaccount'));
			accountRec.setFieldValue('custrecord_appstatus', 2);
			if (coaApprover != null && coaApprover != '') {
				accountRec.setFieldValue('custrecord_to_be_approvedby', coaApprover);
			}
			accountRec.setFieldValue('description', pendingAccount.getFieldValue('custrecord_description'));
			accountRec.setFieldValue('department', pendingAccount.getFieldValue('custrecord_department'));
			accountRec.setFieldValue('class', pendingAccount.getFieldValue('custrecord_class'));
			accountRec.setFieldValue('location', pendingAccount.getFieldValue('custrecord_location_coa'));
			accountRec.setFieldValues('subsidiary', pendingAccount.getFieldValues('custrecord_subs'));
			accountRec.setFieldValue('custrecordqb_account', pendingAccount.getFieldValue('custrecord_qb_account'));
			accountRec.setFieldValues('custrecord_fam_account_showinfixedasset', pendingAccount.getFieldValues('custrecord_show_in_fixedasset'));
			accountRec.setFieldValue('custrecord_requester', pendingAccount.getFieldValue('custrecord_owner_accounts'));
			accountRec.setFieldValue('includechildren',pendingAccount.getFieldValue('custrecord_include_children'));
			
			if (pendingAccount.getFieldValue('isinactive') == 'T') {
				accountRec.setFieldValue('isinactive', 'T');
			}			
			var recId = nlapiSubmitRecord(accountRec, true); // Submitting the created Account.
			nlapiLogExecution('DEBUG', 'Account id is', 'COA Rec Id:' + recId);
			try {
				var fields1 = new Array();
				var values1 = new Array();
				var acctype = pendingAccount.getFieldText('custrecord_accnttype');
				if (acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Other Asset' || acctype == 'Other Current Asset' || acctype == 'Fixed Asset' || acctype == 'Bank' || acctype == 'Credit Card' || acctype == 'Long Term Liability' || acctype == 'Other Current Liability') 
				{					
					fields1.push('revalue');
					values1.push(pendingAccount.getFieldValue('custrecord_revalue'));
				}				
				if (acctype != 'Bank' && acctype != 'Credit Card' && acctype != 'Fixed Asset' && acctype != 'Unbilled Receivable') {
					fields1.push('eliminate');
					values1.push(pendingAccount.getFieldValue('custrecord_eliminate'));
				}				
				if (acctype == 'Cost of Goods Sold' || acctype == 'Expense' || acctype == 'Other Expense') {
					fields1.push('billableexpensesacct');
					values1.push(pendingAccount.getFieldValue('custrecord_track_expense'));
				}
				if (acctype != 'Bank' && acctype != 'Credit Card' && acctype != 'Accounts Receivable' && acctype != 'Accounts Payable') {
					fields1.push('category1099misc');
					values1.push(pendingAccount.getFieldValue('custrecord_misc_category'));
				}
				if (acctype == 'Cost of Goods Sold' || acctype == 'Expense' || acctype == 'Income' || acctype == 'Other Expense' || acctype == 'Other Income') {
					fields1.push('deferralacct');
					values1.push(pendingAccount.getFieldValue('custrecord_deferral_account'));
				}
				recId = nlapiSubmitField('account', recId, fields1, values1);				
			} 
			catch (e) {
				nlapiSubmitField('customrecord_coa', id, ['custrecord_iserror', 'custrecord_errormsg'], ['T', e.toString()]);
				nlapiLogExecution('ERROR', 'Error', 'Error - Reason : ' + e.toString());
				var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_coa', id, 'VIEW');
				var errormsgemail = pendingaccountno + '<br> Error ' + e.toString() + '<br>' + '<a href=' + rLink + '><b>View Record</b></a><br><br>';	
				var Email2 = nlapiSendEmail(coaApprover, sendToEmail, 'Your COA is Approved with limitation/permission Errors', 'The below COA record/s have errors : ' + '<br>' + errormsgemail, null, null, null);
			}
			
			//***********************************Create Update Accounts : Begin ****************************************************
			if (recId) {
				var standardRec = nlapiCreateRecord('customrecord_accounts');
				// Setting the values of the fields in the newly created standard account.
				standardRec.setFieldText('custrecord_account_type', pendingAccount.getFieldText('custrecord_accnttype'));
				standardRec.setFieldValue('custrecord_accntnumber', pendingAccount.getFieldValue('custrecord_number'));
				standardRec.setFieldValue('custrecord_accntname', pendingAccount.getFieldValue('custrecord_name'));
				standardRec.setFieldValue('custrecord_currency_value', pendingAccount.getFieldValue('custrecord_currency'));
				standardRec.setFieldText('custrecord_rate_general', pendingAccount.getFieldText('custrecord_generalrate'));
				standardRec.setFieldText('custrecord_rate_cashflow', pendingAccount.getFieldText('custrecord_cashflowrate'));
				standardRec.setFieldText('custrecord_subaccount_info', pendingAccount.getFieldText('custrecord_subaccount'));
				standardRec.setFieldValue('custrecord_approval_status_coa', 2);
				if (coaApprover != null && coaApprover != '') {
					standardRec.setFieldValue('custrecord_approver_coa', coaApprover);
				}
				var acctype = pendingAccount.getFieldText('custrecord_accnttype');
				
				standardRec.setFieldValue('custrecord_revalue_balance', pendingAccount.getFieldValue('custrecord_revalue'));
			
				standardRec.setFieldValue('custrecord_desc_coa', pendingAccount.getFieldValue('custrecord_description'));
				standardRec.setFieldValue('custrecord_dept', pendingAccount.getFieldValue('custrecord_department'));
				standardRec.setFieldValue('custrecord_class_coa', pendingAccount.getFieldValue('custrecord_class'));
				standardRec.setFieldValue('custrecord_coa_location', pendingAccount.getFieldValue('custrecord_location_coa'));
				standardRec.setFieldValues('custrecord_subs_coa', pendingAccount.getFieldValues('custrecord_subs'));
				standardRec.setFieldValue('custrecord_coa_qb_account', pendingAccount.getFieldValue('custrecord_qb_account'));
				standardRec.setFieldValues('custrecord_coa_fixed_asset', pendingAccount.getFieldValues('custrecord_show_in_fixedasset'));
				if (acctype != 'Bank' && acctype != 'Credit Card') {
					standardRec.setFieldValue('custrecord_coa_include_children', pendingAccount.getFieldValue('custrecord_include_children'));
				}
				standardRec.setFieldValue('custrecord_eliminate_tran', pendingAccount.getFieldValue('custrecord_eliminate'));
				standardRec.setFieldValue('custrecord_def_account_ea', pendingAccount.getFieldValue('custrecord_deferral_account'));
				standardRec.setFieldValue('custrecord_expense_track_ea', pendingAccount.getFieldValue('custrecord_track_expense'));
				standardRec.setFieldValue('custrecord_coa_misc', pendingAccount.getFieldValue('custrecord_misc_category'));
				
				if (pendingAccount.getFieldValue('isinactive') == 'T') {
					standardRec.setFieldValue('isinactive', 'T');
					standardRec.setFieldValue('custrecord_isinactive','T');
				}
				standardRec.setFieldValue('custrecord_date_approve_ea', aprvlDate);
				standardRec.setFieldValue('custrecord_owner_ea', user);
				standardRec.setFieldValue('custrecord_date_submit_ea', submissionDate);
				var standardRecId = nlapiSubmitRecord(standardRec, true); // Submitting the created Account.
				nlapiLogExecution('DEBUG', 'Standard Rec ID', standardRecId);
				}
				if (standardRecId) {
					nlapiSubmitField('customrecord_accounts', standardRecId, 'custrecord_coaid', recId);				
					nlapiLogExecution('DEBUG', 'apprvl Date is', approvalDate);
					var min = approvalDate.getMinutes();
					if (min == 0) {
						nlapiLogExecution('DEBUG', 'IN', 'here');
						var currenttime = approvalDate.getHours() + ":" + "00";
						nlapiLogExecution('DEBUG', 'IN', currenttime);						
					}
					else 
						if (min == 1 || min == 2 || min == 3 || min == 4 || min == 5 || min == 6 || min == 7 || min == 8 || min == 9) {
							nlapiLogExecution('DEBUG', 'IN', min);
							var currenttime = approvalDate.getHours() + ":" + "0" + approvalDate.getMinutes();
							nlapiLogExecution('DEBUG', 'IN', currenttime);							
						}
						else {
							var currenttime = approvalDate.getHours() + ":" + approvalDate.getMinutes();
							nlapiLogExecution('DEBUG', 'time is', currenttime);
						}
					var fields = new Array();
					var values = new Array();
					
					fields.push('custrecord_approvalstatus');
					values.push(2);
					fields.push('custrecord_reject_comment');
					values.push('');
					fields.push('custrecord_date_approval');
					values.push(aprvlDate);
					fields.push('custrecord_approvedby');
					values.push(coaApprover);
					fields.push('custrecord_updateacctid');
					values.push(standardRecId);
					fields.push('custrecord_approve_time_na');
					values.push(currenttime);
					
					var newRecId = nlapiSubmitField('customrecord_coa', id, fields, values); // Submitting the approved Account.
					var rLink = reqUrl + nlapiResolveURL('RECORD', 'account', recId, 'VIEW');
					var Email = nlapiSendEmail(coaApprover, user, 'Your COA is Approved', 'The below COA is Approved ' + '<br>' + pendingaccountno + '<br>' + '<a href=' + rLink + '><b>View Record</b></a>', null, null, null);
					nlapiSetRedirectURL('RECORD', 'account', recId, false); // Redirecting to the newly created account.
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
			response.write(error);
			return;
		}
    }
}

/***** Function to set the fields based on Account type selected ***********/
function display(type,form)
{
    var acctype = nlapiGetFieldText('custrecord_accnttype');
    form.getField('custrecord_updateacctid').setDisplayType('disabled');
    if (type == 'create' || type == 'edit') 
	{
        if (acctype == 'Accounts Receivable' || acctype == 'Accounts Payable' || acctype == 'Unbilled Receivable') 
		{        
            form.getField('custrecord_revalue').setDisplayType('disabled');
            nlapiSetFieldValue('custrecord_revalue', 'T');
            if (acctype == 'Unbilled Receivable') 
			{
                form.getField('custrecord_eliminate').setDisplayType('disabled');
                form.getField('custrecord_misc_category').setDisplayType('normal');
            }
            else 
			{
                form.getField('custrecord_eliminate').setDisplayType('normal');
                form.getField('custrecord_misc_category').setDisplayType('disabled');
            }
            if (type == 'create') 
			{
                nlapiSetFieldValue('custrecord_eliminate', 'F');
            }
            nlapiSetFieldText('custrecord_generalrate', 'Current');
            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
            form.getField('custrecord_currency').setDisplayType('disabled');
            nlapiSetFieldValue('custrecord_currency', '');            
            form.getField('custrecord_deferral_account').setDisplayType('disabled');
            nlapiSetFieldValue('custrecord_deferral_account', '');
            form.getField('custrecord_track_expense').setDisplayType('disabled');
            nlapiSetFieldValue('custrecord_track_expense', '');
            
        }
        else 
            if (acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Other Asset' || acctype == 'Other Current Asset' || acctype == 'Fixed Asset') 
			{
                form.getField('custrecord_revalue').setDisplayType('normal');
                if (type == 'create') 
				{
                    nlapiSetFieldValue('custrecord_revalue', 'F');
                }
                if (acctype == 'Fixed Asset') {
					form.getField('custrecord_eliminate').setDisplayType('disabled');
				}
				else 
				{
					form.getField('custrecord_eliminate').setDisplayType('normal');
				}
                if (type == 'create') 
				{
                    nlapiSetFieldValue('custrecord_eliminate', 'F');
                }
                nlapiSetFieldText('custrecord_generalrate', 'Current');
                nlapiSetFieldText('custrecord_cashflowrate', 'Average');
                if (acctype == 'Deferred Revenue' || acctype == 'Deferred Expense' || acctype == 'Fixed Asset') {
					form.getField('custrecord_currency').setDisplayType('disabled');
					nlapiSetFieldValue('custrecord_currency', '');
				}
				else 
				{
					form.getField('custrecord_currency').setDisplayType('normal');
				}
                form.getField('custrecord_deferral_account').setDisplayType('disabled');
                nlapiSetFieldValue('custrecord_deferral_account', '');
                form.getField('custrecord_misc_category').setDisplayType('normal');
                form.getField('custrecord_track_expense').setDisplayType('disabled');
                nlapiSetFieldValue('custrecord_track_expense', '');
                
            }
            else 
                if (acctype == 'Bank' || acctype == 'Credit Card') 
				{                
                    form.getField('custrecord_revalue').setDisplayType('normal');
                    if (type == 'create') 
					{
                        nlapiSetFieldValue('custrecord_revalue', 'T');
                    }
                    form.getField('custrecord_eliminate').setDisplayType('disabled');
                    nlapiSetFieldValue('custrecord_eliminate', 'F');
                    nlapiSetFieldText('custrecord_generalrate', 'Current');
                    nlapiSetFieldText('custrecord_cashflowrate', 'Average');
                    if (acctype == 'Bank') {
						form.getField('custrecord_currency').setDisplayType('normal');
					}
					else 
					{
						form.getField('custrecord_currency').setDisplayType('disabled');
						nlapiSetFieldValue('custrecord_currency', '');
					}
                    form.getField('custrecord_deferral_account').setDisplayType('disabled');
                    nlapiSetFieldValue('custrecord_deferral_account', '');
                    form.getField('custrecord_misc_category').setDisplayType('disabled');
                    form.getField('custrecord_track_expense').setDisplayType('disabled');
                    nlapiSetFieldValue('custrecord_track_expense', '');                    
                }
                else 
                    if (acctype == 'Cost of Goods Sold' || acctype == 'Equity' || acctype == 'Expense' || acctype == 'Income' || acctype == 'Other Expense' || acctype == 'Other Income') 
					{                    
                        form.getField('custrecord_revalue').setDisplayType('disabled');
                        nlapiSetFieldValue('custrecord_revalue', 'F');
                        form.getField('custrecord_eliminate').setDisplayType('normal');
                        if (type == 'create') 
						{
                            nlapiSetFieldValue('custrecord_eliminate', 'F');
                        }
                        if (acctype == 'Equity') 
						{
                            nlapiSetFieldText('custrecord_generalrate', 'Historical');
                            nlapiSetFieldText('custrecord_cashflowrate', 'Historical');                            
                            form.getField('custrecord_deferral_account').setDisplayType('disabled');
                            nlapiSetFieldValue('custrecord_deferral_account', '');
                            form.getField('custrecord_misc_category').setDisplayType('normal');
                            form.getField('custrecord_track_expense').setDisplayType('disabled');
                            nlapiSetFieldValue('custrecord_track_expense', '');
                        }
                        else 
						{
                            nlapiSetFieldText('custrecord_generalrate', 'Average');
                            nlapiSetFieldText('custrecord_cashflowrate', 'Average');                            
                            form.getField('custrecord_deferral_account').setDisplayType('normal');
                            form.getField('custrecord_misc_category').setDisplayType('normal');
                            if (acctype == 'Income' || acctype == 'Other Income') 
							{
                                form.getField('custrecord_track_expense').setDisplayType('disabled');
                                nlapiSetFieldValue('custrecord_track_expense', '');
                            }
                            else 
							{
                                form.getField('custrecord_track_expense').setDisplayType('normal');
                            }
                        }
                        form.getField('custrecord_currency').setDisplayType('disabled');
                        nlapiSetFieldValue('custrecord_currency', '');                        
                    }
                    else 
                        if (acctype == 'Long Term Liability' || acctype == 'Other Current Liability') 
						{                        
                            form.getField('custrecord_revalue').setDisplayType('normal');
                            form.getField('custrecord_eliminate').setDisplayType('normal');
                            if (type == 'create') 
							{
                                nlapiSetFieldValue('custrecord_revalue', 'T');
                                nlapiSetFieldValue('custrecord_eliminate', 'F');
                            } 
                            nlapiSetFieldText('custrecord_generalrate', 'Current');
                            nlapiSetFieldText('custrecord_cashflowrate', 'Average');
                            form.getField('custrecord_currency').setDisplayType('normal');                            
                            form.getField('custrecord_deferral_account').setDisplayType('disabled');
                            nlapiSetFieldValue('custrecord_deferral_account', '');
                            form.getField('custrecord_misc_category').setDisplayType('normal');
                            form.getField('custrecord_track_expense').setDisplayType('disabled');
                            nlapiSetFieldValue('custrecord_track_expense', '');
                        }
    }
}
