/**
* This script file is used to validate Invoice Owner & Approvers record, AP Approval Level,Department FP&A Approvers & Executive Approvers record
* @author Unitha.Rangam
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/

//3.2.1 Invoice Owner & Approvers record validation
function InvoiceOwner(type)
{
	if(nlapiGetFieldValue('custrecord_spk_ioa_iolvl') && nlapiGetFieldValue('custrecord_spk_ioa_apvlvl') && nlapiGetFieldValue('custrecord_spk_ioa_invown') && nlapiGetFieldValue('custrecord_spk_ioa_apvr')&& nlapiGetFieldValue('custrecord_spk_ioa_validtil')&&nlapiGetFieldValue('custrecord_spk_ioa_validfrm')){
		//The Approver level should be greater than the Invoice Owner level.
		if(nlapiGetFieldValue('custrecord_spk_ioa_iolvl') > nlapiGetFieldValue('custrecord_spk_ioa_apvlvl')) 
		{
			alert('The Approver’s approval limit (level) should be equal to or greater than the Invoice Owner’s approval limit (level).');
			return false;
		}						
		//Invoice Owner & Approver’s cannot be the same employee.
		if(nlapiGetFieldValue('custrecord_spk_ioa_invown')== nlapiGetFieldValue('custrecord_spk_ioa_apvr'))
		{
			alert('The same employee cannot be assigned as Invoice Owner & the Approver in a record.');
			return false;
		}
		//The Date (from) should be equal to or later than the current system date
		if(!nlapiGetRecordId() && nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_ioa_validfrm'))< nlapiStringToDate(nlapiDateToString(new Date())))
		{
			alert('Please select a date "Valid (from)" equal to or later than today’s date.');
			return false;
		}
		//The Date (until) should be later than the date selected in Date (from). 
		if((nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_ioa_validtil')) < nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_ioa_validfrm')))||((nlapiGetFieldValue('custrecord_spk_ioa_validtil')) == (nlapiGetFieldValue('custrecord_spk_ioa_validfrm'))))
		{
			alert('The Date "Valid (until)" should be later than the date selected in date "Valid (from)" field.');
			return false;
		}		
		//This script will validate data entered while creating the Invoice Owner & Approver record and avoid any duplication of the record.
		var fi = new Array();
		fi[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'anyof',nlapiGetFieldValue('custrecord_spk_ioa_invown'));
		fi[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var ri = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,fi);
		if(ri){
			if(ri.length >2){
				alert('The Invoice Owner record exist already. Please in-active the existing Invoice Owner record in order to create a new one.');
				return false;
			}
			else{
				if(ri[0].getId()!= nlapiGetRecordId()){
					alert('The Invoice Owner record exist already. Please in-active the existing Invoice Owner record in order to create a new one.');
					return false;
				}
			}
		}
		return true;
	}	
	return true;
}

//3.2.2	AP Approval Level record validation
function APApprovalLevel(type) {
	if(nlapiGetFieldValue('custrecord_spk_apl_mxm_apvlmt')){
		//System should not allow creation of duplicate AP Approval Level record with same Maximum Approval Limit
		var f = new Array();
		f[0] = new nlobjSearchFilter('custrecord_spk_apl_mxm_apvlmt',null,'contains',nlapiGetFieldValue('custrecord_spk_apl_mxm_apvlmt'));
		f[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var r = nlapiSearchRecord('customrecord_spk_apl_lvl',null,f);
		if(r){
			if(r.length >2){
				alert('This record exist already. Please in-active the existing record in order to create a new one.');
				return false;
			}
			else{
				if(r[0].getId()!= nlapiGetRecordId()){
					alert('This record exist already. Please in-active the existing record in order to create a new one.');
					return false;
				}
			}
		}
		return true;
	}
	return true;
}
//3.2.3	Department FP&A Approvers record validation
function DepartmentFPAApprovers(type)
{
	if(nlapiGetFieldValue('custrecord_spk_dfpa_apvdept') && nlapiGetFieldValue('custrecord_spk_dfpa_validfrm') && nlapiGetFieldValue('custrecord_spk_dfpa_validtil')){
	//There should only be one approver for each department for a given date range.System should throw error message, in case user tries to create a duplicate record
		var f = new Array();
		f[0] = new nlobjSearchFilter('custrecord_spk_dfpa_apvdept',null,'anyof',nlapiGetFieldValue('custrecord_spk_dfpa_apvdept'));
		f[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var r = nlapiSearchRecord('customrecord_spk_dpt_fpa',null,f);
		if(r)
		{
			if(r.length >2){
				alert('This record exist already. Please in-active the existing record in order to create a new one.');
				return false;
			}
			else{
				if(r[0].getId()!= nlapiGetRecordId()){
					alert('This record exist already. Please in-active the existing record in order to create a new one.');
					return false;
				}
			}
		}
		//The Date (from) should be equal to or later than the current system date. 
		if(!nlapiGetRecordId() && nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_dfpa_validfrm'))< nlapiStringToDate(nlapiDateToString(new Date()))){
			alert('Please select a date "Valid (from)" equal to or later than today’s date.');
			return false;
		}
		//The Date (until) should be later than the date selected in Date (from). 
		if((nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_dfpa_validtil')) < nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_dfpa_validfrm')))||((nlapiGetFieldValue('custrecord_spk_dfpa_validtil')) == (nlapiGetFieldValue('custrecord_spk_dfpa_validfrm')))){
			alert('The Date "Valid (until)" should be later than the date selected in date "Valid (from)" field.');
			return false;
		}
		return true;
	}
	return true;
}
//3.2.4	Executive Approvers record validation
function ExecutiveApprovers(type){
//System should not allow any duplicate record to be created with the same Approver in the Executive Approvers table. 
	if(nlapiGetFieldValue('custrecord_spk_csa_apvr')&& nlapiGetFieldValue('custrecord_spk_csa_apvtitle') && nlapiGetFieldValue('custrecord_spk_csa_validfrm') && nlapiGetFieldValue('custrecord_spk_csa_validtil')){
		var f = new Array();
		f[0] = new nlobjSearchFilter('custrecord_spk_csa_apvr',null,'anyof',nlapiGetFieldValue('custrecord_spk_csa_apvr'));
		f[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var r = nlapiSearchRecord('customrecord_spk_cross_sub_apvr',null,f);
		if(r){
			if(r.length >2){
				alert('This record exist already. Please in-active the existing record in order to create a new one.');
				return false;
			}
			else{
				if(r[0].getId()!= nlapiGetRecordId()){
					alert('This record exist already. Please in-active the existing record in order to create a new one.');
					return false;
				}
			}
		}
		//System should not allow any duplicate record to be created with the same Approver in the Executive Approvers table. 
		var fg = new Array();
		fg[0] = new nlobjSearchFilter('custrecord_spk_csa_apvtitle',null,'anyof',nlapiGetFieldValue('custrecord_spk_csa_apvtitle'));
		fg[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var rg = nlapiSearchRecord('customrecord_spk_cross_sub_apvr',null,fg);
		if(rg){
			if(rg.length >2){
				alert('This record exist already. Please in-active the existing record in order to create a new one.');
				return false;
			}
			else{
				if(rg[0].getId()!= nlapiGetRecordId()){
					alert('This record exist already. Please in-active the existing record in order to create a new one.');
					return false;
				}
			}
		}
		//The Date (from) should be equal to or later than the current system date. 
		if(!nlapiGetRecordId() && nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_csa_validfrm'))< nlapiStringToDate(nlapiDateToString(new Date()))){
			alert('Please select a date "Valid (from)" equal to or later than today’s date.');
			return false;
		}
		//The Date (until) should be later than the date selected in Date (from). 
		if((nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_csa_validtil')) < nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_csa_validfrm')))||((nlapiGetFieldValue('custrecord_spk_csa_validtil')) == (nlapiGetFieldValue('custrecord_spk_csa_validfrm')))){
			alert('The Date "Valid (until)" should be later than the date selected in date "Valid (from)" field.');
			return false;
		}
		return true;
	}
	return true;
}
//
function APManagerApprover(type) {
//The Date (from) should be equal to or later than the current system date. 
if(nlapiGetFieldValue('custrecord_spk_apm_validfrm')&& nlapiGetFieldValue('custrecord_spk_apm_validtil')&& nlapiGetFieldValues('custrecord_spk_apm_sub')) {
	if(!nlapiGetRecordId() && nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_apm_validfrm'))< nlapiStringToDate(nlapiDateToString(new Date()))) {
		alert('Please select a date "Valid (from)" equal to or later than today’s date.');
		return false;
	}
	//The Date (until) should be later than the date selected in Date (from).
	if((nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_apm_validtil')) < nlapiStringToDate(nlapiGetFieldValue('custrecord_spk_apm_validfrm')))||((nlapiGetFieldValue('custrecord_spk_apm_validtil')) == (nlapiGetFieldValue('custrecord_spk_apm_validfrm')))) {
		alert('The Date "Valid (until)" should be later than the date selected in date "Valid (from)" field.');
		return false;
	}
	//System should not allow any duplicate record to be created with the same Approver in the AP Manager Approvers table. 
	var values = nlapiGetFieldValues('custrecord_spk_apm_sub');
	for(var i=0;i<values.length;i++) {
		var f = new Array();
		f[0] = new nlobjSearchFilter('custrecord_spk_apm_sub',null,'anyof',values[i]);
		f[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var r = nlapiSearchRecord('customrecord_spk_apm_approver',null,f);
		if(r) {
			if(r.length >2) {
				alert('This record exist already. Please in-active the existing record in order to create a new one.');
				return false;
				break;
			}
			else {
				if(r[0].getId()!= nlapiGetRecordId()) {
					alert('This record exist already. Please in-active the existing record in order to create a new one.');
					return false;
					break;
				}
			}
		}
	}
	return true;
	}
		return true;
}


//Function to avoid deleting custom records if any approver exists in custom Record "AP Invoice Approval History(matrix)"
//3.2.1 (e) Once there are transactions associated, records will not be allowed to be deleted. It can only be made in-active (soft-delete). System shall display an error message to the user, while trying to delete the record.
function OnDeleteInvoiceAp(type)
{
	 
	var approver = '';
	//Check for any Approver of "Invoice Owner & Approvers" is related to "AP Invoice Approval History(matrix)" custom record 
	if(nlapiGetRecordType() == 'customrecord_spk_inv_own_apvr') { // Invoice Owner & Approvers
		approver = nlapiGetFieldValue('custrecord_spk_ioa_apvr');
	}
	//Check for any Approver of "Executive Approvers" is related to "AP Invoice Approval History(matrix)" custom record
	else if(nlapiGetRecordType() == 'customrecord_spk_cross_sub_apvr') { //Executive Approvers
		approver = nlapiGetFieldValue('custrecord_spk_csa_apvr');
	}
	//Check for any Approver of "Department FP&A Approvers" is related to "AP Invoice Approval History(matrix)" custom record
	else if(nlapiGetRecordType() == 'customrecord_spk_dpt_fpa') { //Department FP&A Approvers
		approver = nlapiGetFieldValue('custrecord_spk_dfpa_apvr');
	}
	//Check for any Approver of "AP Manager Approver" is related to "AP Invoice Approval History(matrix)" custom record
	else if(nlapiGetRecordType() == 'customrecord_spk_apm_approver') { //AP Manager Approver
		approver = nlapiGetFieldValue('custrecord_spk_apm_apv');
	}
	var f = new Array();
	f[0] = new nlobjSearchFilter('custrecord_spk_apvmtx_apvr',null,'anyof',approver);
	f[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	var r = nlapiSearchRecord('customrecord_spk_inv_apvmtx',null,f);
	if(r) {
	// if any record found in approver matrix, throw a notice error to avoid deleting related records
		if(r.length > 1) {
		throw nlapiCreateError('User Defined', 'There are transactions associated with this record, hence cannot be deleted. It can only be made in-active.', true);
		}
	}
}