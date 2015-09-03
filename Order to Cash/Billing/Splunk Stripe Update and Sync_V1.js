/*
* This script file is used to update Stripe charge with details from NetSuite.
* @ AUTHOR : Abhilash
* @Release Date 22nd Nov 2014
* @Project Number PRJ0050845
* @version 1.0
*/
/*
* Changes to update Stripe Charge ID metadata to Stripe Charge based on Stripe Charge ID on Create and Edit Cash Sale.
* @ AUTHOR : Unitha
* @Release Date:20 Aug 2015
* @Release Number TBD
* @version 1.1
*/

/* This script function is used to update Stripe charge with details from NetSuite.*/

var authorizationHeader = 'BASIC ' + nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_stripe_key');//Fetching the key used to update data in stripe
var url = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_stripe_url');
var bodyval1 = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_stripe_m1');
var bodyval = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_refund_metadata');

function UpdateStripe(type) 
{
	nlapiLogExecution('DEBUG', 'type', type);
	var chargeId = nlapiGetFieldValue('custbody_spk_stripe_chg_id');//Fetch the charge id from the Cash sale.
	if (chargeId) {													//If the charge id exists
		var header = new Array();                                   //The header has values which are decided by Cloudhub. 
		header['Authorization'] = authorizationHeader;
		header['Accept'] = '*/*';
		header['Content-Type'] = 'application/x-www-form-urlencoded';
		var body = new Array();
		body[bodyval1] = nlapiGetRecordId();
		var isSyncStripeupdate = nlapiGetFieldValue('custbody_spk_syncstripeupdate');
		if(type == 'create' || (type == 'edit' && isSyncStripeupdate == 'T')) {
			var x = nlapiRequestURL(url+ chargeId, body, header);
			nlapiLogExecution('DEBUG', 'response', x.getBody());
			nlapiLogExecution('DEBUG', 'Request URL is', x);
			if(x.getBody().toString().search('"amount":')>-1)//If the amount in Cash sale and the amount updated in stripe are not equal then set flag to true.
			{
				var response_obj = JSON.parse(x.getBody());
				var chargeamount = parseFloat(response_obj.amount)/100;
				var f = new Array();
				var v = new Array();
				f[0] = 'custbody_spk_chargeamount';
				v[0] = chargeamount;
				f[1] = 'custbody_spk_stripemismatch';
nlapiLogExecution('DEBUG', 'total '+parseFloat(nlapiGetFieldValue('total')), 'chargeamount '+parseFloat(chargeamount));
				if(parseFloat(nlapiGetFieldValue('total'))!= parseFloat(chargeamount) ) {
					//The response from Stripe contains amount the amount value in the format
					//"amount": value,. Hence we are splitting it to get the value.	
					//also the value does not have a decimal point, hence dividing it by 100.	
					v[1] = 'T';																											
				}
				else {
					v[1] = 'F';
				}
				nlapiLogExecution('DEBUG', 'cashsaleId '+nlapiGetRecordId(), 'chargeamount '+chargeamount);
				nlapiSubmitField('cashsale',nlapiGetRecordId(),f,v);

			}
		}
	}
}



