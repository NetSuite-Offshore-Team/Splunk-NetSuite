/**
* This script file is used to validate Delegate on Employee Record. 
* @author Unitha.Rangam
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/

function OnSave() {
	var roleid = nlapiGetContext().getRole();
	if(roleid != 3){
		return true;
	}
	var currentempId = nlapiGetRecordId();
	var username = nlapiGetFieldValue('entityid');
	var delegateapprover = nlapiGetFieldValue('custentity_spk_emp_delgt_apv');
	var delegateSdate = nlapiGetFieldValue('custentity_spk_emp_delgt_stdate');
	var delegateEdate = nlapiGetFieldValue('custentity_spk_emp_delgt_enddate');
	var isdelegatereq = nlapiGetFieldValue('custentity_spk_isdelegatereq');
    if(isdelegatereq != 'T') { return true; }
	if(delegateapprover) 
	{
		var invOwnerApplimit = '';
		var Approverlimit = '';
		if(currentempId) 
		{
			//The Delegate assigned should be present as an Invoice Owner or Approver in the ‘Invoice Owner & Approver’ reference table to avoid any exception in future while generating approval matrix. 
			if(currentempId == delegateapprover) 
			{
				alert('The current employee and delegate Approver cannot be same.');
				return false;
			}
			var filters = new Array();
			var columns = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'is',currentempId);
			columns[0] = new nlobjSearchColumn( 'custrecord_spk_ioa_iolvl' );
			columns[1] = new nlobjSearchColumn( 'isinactive' );
			var InvOwnersearch = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,filters,columns);
			if(InvOwnersearch) 
			{
				invOwnerApplimit = InvOwnersearch[0].getValue('custrecord_spk_ioa_iolvl');
				var InvownerInactive = InvOwnersearch[0].getValue('isinactive');
				if(InvownerInactive == 'T') 
				{
					alert('The employee record is presently in-active in the Invoice Owner & Approver List. Please contact your administrator.');
					nlapiSetFieldValue('custentity_spk_emp_delgt_apv','');
					return false;
				}
				//The Delegate’s Approval Limit (i.e. Level) should be same or greater than the employee’s Approval limit (Level).
				var column = new Array();
				var filterExpression =	[['custrecord_spk_ioa_apvr','is',delegateapprover],'or',['custrecord_spk_ioa_invown','is',delegateapprover]] ;
				column[0] = new nlobjSearchColumn( 'custrecord_spk_ioa_apvlvl' );
				column[1] = new nlobjSearchColumn( 'isinactive' );
				var Approversearch = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,filterExpression,column);
				if(Approversearch)
				{
					var filterExpression =[[['custrecord_spk_ioa_apvr','is',delegateapprover],'or',['custrecord_spk_ioa_invown','is',delegateapprover]],'and',['isinactive','is','F']] ;
					var Approversearch_isinactive = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,filterExpression,column);
					if(Approversearch_isinactive)
					{
						Approverlimit = Approversearch[0].getValue('custrecord_spk_ioa_apvlvl');
						if(invOwnerApplimit && Approverlimit && (invOwnerApplimit > Approverlimit)) 
						{
							alert('The Delegate selected has less approval limit. Please select a Delegate whose approval limit is equal to or greater than the  approval limit assigned to you.');
							return false;
						}
					}
					else
					{
						alert('The Delegate selected is presently in-active in the Invoice Owner & Approver List. Please contact your administrator.');
						nlapiSetFieldValue('custentity_spk_emp_delgt_apv','');
						return false;
					}
				}
				else {
					alert('The Delegate selected is not present in the Invoice Owner & Approver List. Please contact your administrator.');
					nlapiSetFieldValue('custentity_spk_emp_delgt_apv','');
					return false;
				}
			}
			else {
				alert('The logged in employee '+username+' is not part of the Invoice Owner & Approver List, to be able to assign Delegate. Please contact your administrator.');
				return false;
			}
		}
		else {
			alert('The logged in employee '+username+' is not part of the Invoice Owner & Approver List, to be able to assign Delegate. Please contact your administrator. ');
			nlapiSetFieldValue('custentity_spk_emp_delgt_apv','');
			return false;
		}
		
		if(delegateSdate) {
		//The Delegation Start Date should be later than the current system date. 
			if(delegateSdate && nlapiStringToDate(delegateSdate) <= nlapiStringToDate(nlapiDateToString(new Date()))){
				alert('Please select a Delegate Start Date later than the today’s date.');
				return false;
			}
		}
		else {
			alert('Please Select Delegate Start Date.');
			return false;
		}
		if(delegateEdate) {
			if(delegateEdate && !delegateSdate) {
				alert('Please select a Delegate Start Date field first');
				nlapiSetFieldValue('custentity_spk_emp_delgt_enddate','');
				return false;
			}
			//The Delegation End Date should be equal to or later than the date selected in the Delegation Start Date.
			if((delegateSdate && delegateEdate && nlapiStringToDate(delegateEdate) < nlapiStringToDate(delegateSdate))){
				alert('Please select a Delegate End Date equal to or later than the Delegate Start Date.');
				return false;
			}
		}
		else {
			alert('Please Select Delegate End Date.');
			return false;
		}
	}
	else 
	{
		alert('Please select Delegate Approver.');
		return false;
	}		
	return true;
}
//Function to Enable or Disable Delegate Fields on checkbox check Is Delegate required to validate Delegate Info
function onFieldchange(type,name) 
{
	if(name == 'custentity_spk_isdelegatereq') 
	{
		var roleid = nlapiGetContext().getRole();
		if(roleid != 3)
		{
			return true;
		}
		var isdelegatereq = nlapiGetFieldValue('custentity_spk_isdelegatereq');
		if(isdelegatereq == 'T') 
		{
			nlapiDisableField('custentity_spk_emp_delgt_apv',false);
			nlapiDisableField('custentity_spk_emp_delgt_stdate',false);
			nlapiDisableField('custentity_spk_emp_delgt_enddate',false);
		}
		if(isdelegatereq == 'F')
		{
			nlapiDisableField('custentity_spk_emp_delgt_apv',true);
			nlapiDisableField('custentity_spk_emp_delgt_stdate',true);
			nlapiDisableField('custentity_spk_emp_delgt_enddate',true);
		}
	}
}