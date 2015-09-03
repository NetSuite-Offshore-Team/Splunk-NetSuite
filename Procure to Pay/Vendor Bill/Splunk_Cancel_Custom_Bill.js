/**
* This workflow action script file is called in Workflow "Splunk_Cancel_Custom_Bill" at workflow state 'Entry' for the bills Rejected., it updates the Custom record Purchase requestor Vendor bill status to "Rejected".
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/

function CancelCustomBill() {
	if(nlapiGetFieldText('approvalstatus') == 'Rejected') {
		var id = nlapiGetFieldValue('custbody_spk_vd_id');
		var currentStatus = nlapiLookupField('customrecord_spk_vendorbill',id,'custrecord_spk_vb_approvalstatus');
		if(currentStatus != 3) {
			nlapiSubmitField('customrecord_spk_vendorbill',id,'custrecord_spk_vb_approvalstatus',3);
		}                             
	}
}