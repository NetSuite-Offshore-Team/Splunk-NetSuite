/* Whenever an SO is created using make copy, then FPX Quote ID will be default to null for DFCT0050585.ENHC0051451:On creation of Vendor bill, Invoice Business Owner field should default to Julia H Pak.
* and if the bill is created from PO the the Invoice Business Owner of the PO should be default to the Vendor Bill field Invoice Owner on bill
* Client Script : Splunk_PreventProject_SetDefaultValueInv
* @ AUTHOR : Abith Nitin
* @Project Number: DFCT0050585 and ENHC0051451
* @Release Date : 3rd April 2015
* @Release Number : RLSE0050348 
* @version 1.0
*/

var defaultInvOwner = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_defaultinvowner');
function PreventProject_DefaultInv_PageInit(type)
{	
	var recType = nlapiGetRecordType();
	//making the FPX Quote ID as null whenever an SO is copied
	if(type == 'copy' && recType == 'salesorder') {
				
		nlapiSetFieldValue('custbody_spk_fpx_id','');
	}
	//Setting default value for the Invoice business owner whenever Bill is created either standalone or from PO.	
	if((type == 'create' || type == 'copy') && recType == 'vendorbill') {
		
		var ponumber = nlapiGetFieldValue('custbody_spk_poid');
		if(ponumber) {
			var poRec = nlapiLoadRecord('purchaseorder', ponumber);
			var po_spk_inv_owner = poRec.getFieldValue('custbody_spk_inv_owner');
			nlapiSetFieldValue('custbody_spk_invoiceowner_bill',po_spk_inv_owner);	
		}
		nlapiSetFieldValue('custbody_spk_inv_owner',defaultInvOwner);			
	}
		
}