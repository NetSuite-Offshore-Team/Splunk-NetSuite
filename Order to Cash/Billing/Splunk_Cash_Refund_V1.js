/**
* This script function is used to update stripe charge with NetSuite cash refund id.
* @ AUTHOR : Abhilash
* @Release Date 22nd Nov 2014
* @Release Number PRJ0050845
* @version 1.0
*/
/*
* Changes to update Stripe Refund ID metadata to Stripe refund based on Stripe Charge ID on Create and Edit Cash refund.
* @ AUTHOR : Unitha
* @Release Date:20 Aug 2015
* @Release Number TBD
* @version 1.1
*/

var bodyval = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_refund_meta');//Fetching the meatdata.
var authorizationHeader = 'BASIC ' + nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_stripe_key');//Fetching the key.
var url = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_stripe_url');//Fetching the Stripe URL.
function CashRefundSync(type)
{
	nlapiLogExecution('DEBUG','type',type);
	var cashsale = nlapiGetFieldText('createdfrom');
	if((cashsale != null)&&(cashsale != '')&&(cashsale.search('Cash Sale') != -1))//If Cash sale exists.
	{
		var chargeId = nlapiLookupField('cashsale',nlapiGetFieldValue('createdfrom'),'custbody_spk_stripe_chg_id');//fetching the charge id from the cash sale.
		if(chargeId)//if charge id exists.
		{
			var header = new Array();
			header['Authorization'] = authorizationHeader;
			header['Accept'] = '*/*';
			header['Content-Type']= 'application/x-www-form-urlencoded';
			var body = new Array();
			body[bodyval] = nlapiGetRecordId();
			if(type == 'create') {
				nlapiLogExecution('DEBUG','type '+type, ' chargeId '+chargeId+  ' Rec '+nlapiGetRecordId());
				var x = nlapiRequestURL(url+ chargeId+'/refunds',body,header);//Calling the url to update the stripe charge with the refund id.
				nlapiLogExecution('DEBUG','Body',x.getBody().toString());
				if(x.getBody().toString().search('"id":')>-1)//Fetching the stripe refund id from the response of stripe and populating it the NetSuite refund record.
				{
					var v = x.getBody().toString().split('"id": "')[1].split('",')[0];
					nlapiSubmitField('cashrefund',nlapiGetRecordId(),'custbody_spk_stripe_refund_id',v);
				}
			}	
			if(type == 'create' || type == 'edit') {
				var stripeRefundId = nlapiGetFieldValue('custbody_spk_stripe_refund_id');
				nlapiLogExecution('DEBUG','type '+type, ' chargeId '+chargeId+  ' Rec '+nlapiGetRecordId()+ ' stripeRefundId '+stripeRefundId);
				if(nlapiGetFieldValue('custbody_spk_syncstripeupdate') == 'T' && stripeRefundId) {
					//Calling the API to update the stripe Refund Metadata as NS refund id based on Cash Sale Charge ID.
					var response = nlapiRequestURL(url+chargeId+'/refunds/'+stripeRefundId,body,header);
					var response_obj = JSON.parse(response.getBody());
					var srefundid = response_obj.id;
					nlapiLogExecution('DEBUG','srefundid',srefundid);
				}
			}
		}
	}
}