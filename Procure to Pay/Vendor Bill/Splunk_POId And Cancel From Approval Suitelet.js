/** Page Init function of Script file to populate purchase order Id on vendor bill record. 
* This function will only execute on Vendor Bills which are associated with a PO.
* Cancel function to be called from suitelet which work when "approve" buttom clicked on UI of vendor bill record.* 
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215 
* @version 1.0
*/
function poIdOnInit(type)
{
	if(type == 'copy')
	{
		var poId = '';
		var url = window.location.href.toString();
		if(url) {
			var istransform = url.split("transform=")[1];
			// check for bill is transformed from PO record, then copy the employee or Behalf of from PO to Vendor bill Invoice Owner field
			//alert('istransform '+istransform);
			if(istransform) {
				istransform = istransform.split('&')[0];
				poId = url.split("&id=")[1];
				if(poId) {
					var checkpo = poId.split('&e');
					//alert('poId '+poId);
					//alert('checkpo '+checkpo[0]);
					// check if 
					if(checkpo[0]){
						poId = checkpo[0];// poId.split('&e')[0];
					}
					else { poId = '';
					}
				}
				nlapiLogExecution('DEBUG', 'poId is', poId);
			}
		}
//check for Memorized Bill, if found then don't copy the PO fields to Vendor Bill
					var memdoc = url.split('&memdoc=')[1];
					if(memdoc) {
						memdoc = memdoc.split('&')[0];
						if(memdoc[0] > 0) {
							return;
						}
					}		
		nlapiSetFieldValue('custbody_spk_poid',poId);
		//2.For the bills with PO, if the bill contains only goods item in it, the Invoice Business Owner should get auto-populated from the Purchase Requestor  value of the corresponding Purchase Order
		if(poId) {
			var isin = 0;
			var itemCount = nlapiGetLineItemCount('item');
			var expenseCount = nlapiGetLineItemCount('expense');
			for(var i=1; itemCount && i<=itemCount; i++){
				var itemId = nlapiGetLineItemValue('item','item',i);
				var isServiceItem = nlapiLookupField('item',itemId,'isfulfillable');
				if(isServiceItem != 'T' || expenseCount){
					isin = 1;
					break;
				}
			}
			if(isin == 0) {
				var porec = nlapiLoadRecord('purchaseorder',poId);
			  // get values from PO Employee and On-Behalf Of fields
				var PREmp = porec.getFieldValue('employee');
				var PROnbehalf = porec.getFieldValue('custbody_onbehalf');
				var PurschaseRequester = '';
				if(PROnbehalf){
				PurschaseRequester = PROnbehalf;
				}
				else if(PREmp) {
					PurschaseRequester = PREmp;
				}
				
				nlapiSetFieldValue('custbody_spk_inv_owner',PurschaseRequester);
			}
		}
	}
}

// function getting called on clicking cancel from SNOW Reference page which appears when approving as administrator from UI.
function cancel(vbId)
{
	var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
	var crid = nlapiGetFieldValue('custpage_crid');
	if(crid)
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_spk_vendorbill',crid);
		window.open(rLink,'_self');
	}
	else
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'vendorbill',vbId);
		window.open(rLink,'_self');
	}
}

// function getting called on clicking cancel from Enter Rejection Comments page which appears when rejecting as administrator from UI.
function cancel_Reject(vbId)
{
	var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
	var crid = nlapiGetFieldValue('custpage_crid');
	if(crid)
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_spk_vendorbill',crid);
		window.open(rLink,'_self');
	}
	else
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'vendorbill',vbId);
		window.open(rLink,'_self');
	}
}

// function getting called on clicking cancel from SNOW Reference page which appears when approving as administrator from UI.
function cancel_admin(vbId)
{
	var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
	var crid = nlapiGetFieldValue('custpage_crid');
	if(crid)
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'customrecord_spk_vendorbill',crid);
		window.open(rLink,'_self');
	}
	else
	{
		var rLink = reqUrl + nlapiResolveURL('RECORD', 'vendorbill',vbId);
		window.open(rLink,'_self');
	}
}

function Onsave() 
{
	var existingbill = nlapiGetRecordId();
	if(existingbill > 1) 
	{
		var status = nlapiGetFieldValue('approvalstatus');
		if(status == 3 ) // 'Pending Approval', '1', 'Approved', '2', 'Rejected', '3'
		{ 
			alert('Please click the ‘Re-Initiate Approval’ button for resending the bill for approval.');
			return true;
		}
	}
	return true;
}