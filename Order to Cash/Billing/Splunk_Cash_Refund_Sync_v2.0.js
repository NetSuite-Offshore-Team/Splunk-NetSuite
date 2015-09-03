/*
* This script file is used to create/update Cash Refund in Cloudhub
* @ AUTHOR : Vaibhav
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Name: Hangman
* @Project Number PRJ0050865 
* @version 1.0
*/
/*
* To fix the try/catch exception handling in the script for setting Cloudhub Errors on Submit Field for respective Record Type and record ID 
* @ AUTHOR : Rahul
* @Release Date: 13th Mar 2015
* @Release Number RLSE0050322
* @Project Number DFCT0050552
* @version 1.1
*/
/*

* Escape special characters while passing the memo field. 
* @ AUTHOR : Rahul
* @Release Date: 21st May 2015
* @Release Number: RLSE0050339
* @Project Number: DFCT0050651 
* @version 1.2
*/
/*
* To include subscription id and Order id in the JSON and pass it to Cloudhub as part of Rainmakr Project.
* @ AUTHOR : Rahul
* @Release Date: 7th June 2015
* @Release Number: RLSE0050382 
* @Project Number: PRJ0050945 
* @version 2.0
*/
function cashRefundJson(type) {
		nlapiLogExecution('DEBUG', 'type', type);
		try
		{
			/*Checking the execution type. The script should run on 'Create' and 'Edit' only*/
			if (type != 'delete' && (type == 'create' || type == 'edit')) {
			
				/*---Start----Getting SFDC Customer ID through look up----Start-----*/
				var nscustomer = nlapiGetFieldValue('entity');
				if(nscustomer != null && nscustomer != '')
				{
					nlapiLogExecution('DEBUG','NS Customer',nscustomer);
					var sfdccustomer = nlapiLookupField('customer',nscustomer,'custentity_celigo_ns_sfdc_sync_id');
					nlapiLogExecution('DEBUG','SFDC Customer',sfdccustomer);
				}	
				/*---END----Getting SFDC Customer ID through look up----END-----*/
				
				/*----Start------------Creating JSON Object to be sent to Cloudhub------------Start-----*/
				var string1 = '{';
				var r = nlapiLoadRecord('cashrefund',nlapiGetRecordId());
						
				/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
				if(r.getFieldValue('custbody_spk_cloudhuberror') == 'T')
				{
					nlapiLogExecution('DEBUG','CloudhubError','In');
					var field = new Array();
					var value = new Array();
					field[0] = 'custbody_spk_cloudhuberror';
					field[1] = 'custbody_spk_cloudhuberrortxt';
					value[0] = 'F';
					value[1] = '';
					nlapiSubmitField('cashrefund',nlapiGetRecordId(),field,value);
				}
				/*----End-------------------Clearing the sync Error fields-----------------End------*/
						
				var currency = r.getFieldText('currency');
				if ((currency == null) || (currency == '')) {
					currency = '""';
				}
				else {
					currency = '"' + currency + '"';              
				}
				string1 = string1 + '"currencyName" : ' + currency;
				nlapiLogExecution('DEBUG', 'currencyName', currency);
				
				var discountTotal = r.getFieldValue('discounttotal');
				if ((discountTotal == null) || (discountTotal == '')) {
					discountTotal = '""';
				}
				else {
					discountTotal =discountTotal;                
				}
				string1 = string1 + ',"discountTotal" : ' + discountTotal;
				nlapiLogExecution('DEBUG', 'discountTotal', discountTotal);
				
				var entity = sfdccustomer;
				if ((entity == null) || (entity == '')) {
					entity = '""';
				}
				else {
					entity = '"' + entity + '"';               
				}
				string1 = string1 + ',"entity" : ' + entity;
				nlapiLogExecution('DEBUG', 'entity', entity);
				
				var memo = r.getFieldValue('memo');
				if ((memo == null) || (memo == '')) {
					memo = '""';
				}
				else {
					memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.
					memo = '"' + memo + '"';
				}
				string1 = string1 + ',"memo" : ' + memo;
				nlapiLogExecution('DEBUG', 'memo', memo);
				 
				 var internalId = r.getFieldValue('id');
				if ((internalId == null) || (internalId == '')) {
					internalId = '""';
				}
				else {
					internalId = '"' + internalId + '"';                
				}
				string1 = string1 + ',"internalId" : ' + internalId;
				nlapiLogExecution('DEBUG', 'internalId', internalId);

				
				var shippingCost = r.getFieldValue('shippingcost');
				if ((shippingCost == null) || (shippingCost == '')) {
					shippingCost = '0.00';
				}
				else {
					shippingCost = '"' + shippingCost + '"';                
				}
				string1 = string1 + ',"shippingCost" : ' + shippingCost;
				nlapiLogExecution('DEBUG', 'shippingCost', shippingCost);
			//  Addition of Subscription id to the cash sale - Rainmakr Project	
				var subscriptionId = r.getFieldValue('custbody_spk_sfdc_subscription_id'); 
				var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
			//  If subscription id is not present then only we have to send the order id-Rainmakr	
			    if((subscriptionId == null) || (subscriptionId == ''))
				{
					if ((sfdcSyncId == null) || (sfdcSyncId == '')) {
						sfdcSyncId = '" "';
					}
					else {
						sfdcSyncId = '"' + sfdcSyncId + '"';                
					}
					string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
					nlapiLogExecution('DEBUG', 'oppurtunityID', sfdcSyncId);
				}
				
				//Start of including the subscription Id in the JSON to be sent to SFDC as part of Rainmakr
				if (!subscriptionId || subscriptionId== '')
				{ 
					subscriptionId='""';
				}
				else
				{
					subscriptionId= '"'+ subscriptionId +'"';
				}
				string1 = string1 + ',"subscriptionPaymentId" : ' + subscriptionId;
				//End of including the subscription Id in the JSON to be sent to SFDC as part of Rainmakr - Rahul Shaw
				
				
				var subTotal = r.getFieldValue('subtotal');
				if ((subTotal == null) || (subTotal == '')) {

					subTotal = '""';
				}
				else {
					subTotal =  subTotal;                
				}
				string1 = string1 + ',"subTotal" : ' + subTotal;
				nlapiLogExecution('DEBUG', 'subTotal', subTotal);	
				
				var taxTotal = r.getFieldValue('taxtotal');
				if ((taxTotal == null) || (taxTotal == '')) {
					taxTotal = '""';
				}
				else {
					taxTotal = taxTotal;                
				}
				string1 = string1 + ',"taxTotal" : ' + taxTotal;
				nlapiLogExecution('DEBUG', 'taxTotal', taxTotal);
				
				var total = r.getFieldValue('total');
				if ((total == null) || (total == '')) {
					total = '""';
				}
				string1 = string1 + ',"total" : ' + total;
				nlapiLogExecution('DEBUG', 'total', total);
				
				var tranDate = r.getFieldValue('trandate');
				if ((tranDate == null) || (tranDate == '')) {
					tranDate = '""';
				}
				else {
					tranDate = '"' + tranDate + '"';                
				}
				string1 = string1 + ',"transactionDate" : ' + tranDate;
				nlapiLogExecution('DEBUG', 'tranDate', tranDate);
							
				var tranId = r.getFieldValue('tranid');
				if ((tranId == null) || (tranId == '')) {
					tranId = '""';
				}
				else {
					tranId = '"' + tranId + '"';                
				}
				string1 = string1 + ',"transactionId" : ' + tranId;
				nlapiLogExecution('DEBUG', 'tranId', tranId);

				var type = r.getRecordType();
				if ((type == null) || (type == '')) {
					type = '""';
				}
				string1 = string1 + ',"type" : "Cash Refund"';			
				nlapiLogExecution('DEBUG', 'type', type);
				
				string1 = string1 + '}';
				nlapiLogExecution('DEBUG', 'cashRefund-Json Data::', string1);			
				/*----END------------Creating JSON Object to be sent to Cloudhub------------END-----*/
									
				//Getting Cloudhub URL from script parameter to which JSON object to be posted
				
					var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
					nlapiLogExecution('DEBUG', 'Referred URL', url);
				
				//Getting Authorization header from script parameter which is used when requesting URL for Authentication
				var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
				nlapiLogExecution('DEBUG', 'authorizationHeader', authorizationHeader);
				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
						
				var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
				nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());

				/*------Start-----Checking if the request is processed successfully----------Start-------*/	    
				if(parseInt(y.getCode()) == 200)
				{
				   nlapiLogExecution('DEBUG','TEst Object ID', y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
				   //Capturing SFDC object id for the record created successfully in NetSuite custom field
				   nlapiSubmitField('cashrefund',nlapiGetRecordId(),'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
				}

				/*------END-----Checking if the request is processed successfully----------END-------*/
						
				/*------Start-------------If the sent request failed---------------------Start-------*/								   
				if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
				{
					nlapiLogExecution('DEBUG','In',y.getCode());        
					var fields = new Array();
					var values = new Array();
					fields[0] = 'custbody_spk_cloudhuberror';
					fields[1] = 'custbody_spk_cloudhuberrortxt';
					values[0] = 'T';
					values[1] = y.getBody().toString();
					//var sfdcsoid = y.getBody().toString().split('"salesOrderId":"')[1].split('","')[0];
					nlapiSubmitField('cashrefund',nlapiGetRecordId(),fields,values);	//Capturing error message in a custom field
				}
				/*------End-------------If the sent request failed---------------------End-------*/
			}
		}
		catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
                                var fields = new Array();
                var values = new Array();
                fields[0] = 'custbody_spk_cloudhuberror';
                fields[1] = 'custbody_spk_cloudhuberrortxt';
                values[0] = 'T';
                values[1] = e.getCode() + '\n' + e.getDetails();                                                               
               //DFCT0050552: To fix the try/catch exception handling for nlapiGetRecordType(),nlapiGetRecordId()
				nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
                                var fields = new Array();
                var values = new Array();
                fields[0] = 'custbody_spk_cloudhuberror';
                fields[1] = 'custbody_spk_cloudhuberrortxt';
                values[0] = 'T';
                values[1] = e.toString();                                                              
               //DFCT0050552: To fix the try/catch exception handling for nlapiGetRecordType(),nlapiGetRecordId()
				nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
							
			}  
		}
}

function escapeXML(s) {////Added by Rahul Shaw to escape special characters.
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}