/*
* This script file is used to create/update SO in Cloudhub
* This script file is also used to update SO status in cloudhub when Cash Sale is created in NetSuite.
* This script file is also used to update SO status in cloudhub when Invoice is created in NetSuite.
* @ AUTHOR : Abhilash
* @Release Date 22nd Nov 2014
* @Project Number PRJ0050845
* @version 1.0
*
* 
*/
/*
* On record Sales order create/edit/approve/cancel, the status of sales order gets updated, 
* if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to Cloudhub for updating salesorder values in SFDC
* if PO# has value then push to Cloudhub for updating salesorder values in SFDC
* @ AUTHOR : Rahul
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731  
* @version 2.0
 */
/* @Release Description: Escape special characters while passing the memo field.
* @AUTHOR : Rahul
* @Release Date 21st May 2015
* @Project Name:DFCT0050651
* @Release Number : RLSE0050339
* @Version 3.0
/*
/*This script function is used to create/update SO in Cloudhub*/
var url = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_cloudhub_url');//Fetch the Cloudhub URL.
var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth'),'base64');//encoding the Cloudhub key by base64

function SyncSo(type) 
{
    nlapiLogExecution('DEBUG', 'type', type);
	nlapiLogExecution('DEBUG', 'url', url);
	try {
		if (type != 'delete') {
			var string1 = '{ '; //Creating the body with data as requested by CLoudhub to create/Update SO in SFDC.

			var action = '';
			if ((type == 'edit')||(type == 'approve')||(type == 'cancel')) 
			{
				action = '"' + "update" + '"';

			}
			else 
			{
				action = '"' + "create" + '"';
			}
			string1 = string1 + '"operationType" : ' + action;

			var header = new Array();
			header['Authorization'] = authorizationHeader;
			header['Accept'] = 'application/json';
			header['Content-Type'] = 'application/json';
			var r = nlapiLoadRecord('salesorder', nlapiGetRecordId());
			var order = r.getFieldText('custbody_order_type');
			if ((r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != null) && (r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != '')) {
				var actualShipDate = r.getFieldValue('actualshipdate');
				if ((actualShipDate == null) || (actualShipDate == '')) {
					actualShipDate = '""';
				}
				else {
					actualShipDate = '"' + actualShipDate + '"';
					string1 = string1 + ',"actualShipDate" : ' + actualShipDate;
				}
				nlapiLogExecution('DEBUG', 'actualShipDate', actualShipDate);
				var currency = r.getFieldValue('currencyname');
				if ((currency == null) || (currency == '')) {
					currency = '""';
				}
				else {
					currency = '"' + currency + '"';
					string1 = string1 + ',"currency" : ' + currency;

				}
				nlapiLogExecution('DEBUG', 'currency', currency);
				//Modified for CPQ, if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to Cloudhub for updating salesorder values in SFDC : Begin
				var createdfrom = '';
				var createdquote = r.getFieldText('createdfrom');
				var fpxId = r.getFieldValue('custbody_spk_fpx_id');
				if (((createdquote == null) || (createdquote == '')) && ((fpxId == null) || (fpxId == ''))) {
					createdfrom = '""';
					string1 = string1 + ',"createdFrom" : ' + createdfrom;
				}
				else if(createdquote) {
					if(createdquote.search('#')>-1) {
						createdfrom = '"' + createdquote.split('#')[1] + '"';
						string1 = string1 + ',"createdFrom" : ' + createdfrom;
					}
					nlapiLogExecution('DEBUG', 'createdfrom', createdquote.split('#')[1]);
				}
				else if(fpxId) {
					fpxId = '"' + fpxId + '"';
					string1 = string1 + ',"createdFrom" : ' + fpxId;
					nlapiLogExecution('DEBUG', 'fpxId', fpxId);
				}

				//End
				
				var sfdcOpportunityId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
				if ((sfdcOpportunityId == null) || (sfdcOpportunityId == '')) {
					sfdcOpportunityId = '""';
				}
				else {
					sfdcOpportunityId = '"' + sfdcOpportunityId + '"';
					string1 = string1 + ',"sfdcOpportunityId" : ' + sfdcOpportunityId;
				}
				nlapiLogExecution('DEBUG', 'sfdcOpportunityId', sfdcOpportunityId);
				var sfdcAccountId = r.getFieldValue('custbody_sfdc_id');
				if ((sfdcAccountId == null) || (sfdcAccountId == '')) {
					sfdcAccountId = '""';
				}
				else {
					sfdcAccountId = '"' + sfdcAccountId + '"';
					string1 = string1 + ',"sfdcAccountId" : ' + sfdcAccountId;
				}
				nlapiLogExecution('DEBUG', 'sfdcAccountId', sfdcAccountId);
				var discountTotal = r.getFieldValue('discounttotal');
				if ((discountTotal == null) || (discountTotal == '')) {
					discountTotal = '""';
				}
				else {
					discountTotal = '"' + discountTotal + '"';
					string1 = string1 + ',"discountTotal" : ' + discountTotal;
				}
				nlapiLogExecution('DEBUG', 'discountTotal', discountTotal);
				var endDate = r.getFieldValue('enddate');
				if ((endDate == null) || (endDate == '')) 
				{
					endDate = '""';
				}
				else 
				{
					endDate = '"' + endDate + '"';
					string1 = string1 + ',"endDate" : ' + endDate;
				}
				nlapiLogExecution('DEBUG', 'endDate', endDate);
				var memo = r.getFieldValue('memo');
				if ((memo == null) || (memo == '')) 
				{
					memo = '""';
				}
				else 
				{
					memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.DFCT0050651
					memo = '"' + memo + '"';
					
				}
				string1 = string1 + ',"memo" : ' + memo;
				nlapiLogExecution('DEBUG', 'memo', memo);
				
				
				var netSuiteId = nlapiGetRecordId();
				if ((netSuiteId == null) || (netSuiteId == '')) 
				{
					netSuiteId = '""';
				}
				else 
				{
					netSuiteId = '"' + netSuiteId + '"';
					string1 = string1 + ',"netSuiteId" : ' + netSuiteId;
				}
				nlapiLogExecution('DEBUG', 'netSuiteId', netSuiteId);
				var shipDate = r.getFieldValue('shipdate');
				if ((shipDate == null) || (shipDate == '')) 
				{
					shipDate = '""';
				}
				else 
				{
					shipDate = '"' + shipDate + '"';
					string1 = string1 + ',"shipDate" : ' + shipDate;
				}
				nlapiLogExecution('DEBUG', 'shipDate', shipDate);
				var shippingCost = r.getFieldValue('shippingcost');
				if ((shippingCost == null) || (shippingCost == '')) 
				{
					shippingCost = '""';
				}
				else 
				{
					shippingCost = '"' + shippingCost + '"';
					string1 = string1 + ',"shippingCost" : ' + shippingCost;
				}
				nlapiLogExecution('DEBUG', 'shippingCost', shippingCost);
				var startDate = r.getFieldValue('startdate');
				if ((startDate == null) || (startDate == '')) 
				{
					startDate = '""';
				}
				else 
				{
					startDate = '"' + startDate + '"';
					string1 = string1 + ',"startDate" : ' + startDate;
				}
				nlapiLogExecution('DEBUG', 'startDate', startDate);
				var status = r.getFieldText('orderstatus');
				if ((status == null) || (status == '')) 
				{
					status = '""';
				}
				else 
				{
					status = '"' + status + '"';
					string1 = string1 + ',"status" : ' + status;
				}
				nlapiLogExecution('DEBUG', 'status', status);
				var subTotal = r.getFieldValue('subtotal');
				if ((subTotal == null) || (subTotal == '')) 
				{
					subTotal = '""';
				}
				else 
				{
					subTotal = '"' + subTotal + '"';
					string1 = string1 + ',"subTotal" : ' + subTotal;
				}
				nlapiLogExecution('DEBUG', 'subTotal', subTotal);
				var taxTotal = r.getFieldValue('taxtotal');
				if ((taxTotal == null) || (taxTotal == '')) 
				{
					taxTotal = '""';
				}
				else 
				{
					taxTotal = '"' + taxTotal + '"';
					string1 = string1 + ',"taxTotal" : ' + taxTotal;
				}
				nlapiLogExecution('DEBUG', 'taxTotal', taxTotal);
				var terms = r.getFieldValue('custbody_tran_term_in_months');
				if ((terms == null) || (terms == '')) 
				{
					terms = 0;
					string1 = string1 + ',"termInMonths" : ' + terms;
				}
				else 
				{
					string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
				}

				nlapiLogExecution('DEBUG', 'terms', terms);
				var total = r.getFieldValue('total');
				if ((total == null) || (total == '')) 
				{
					total = '""';
				}
				else 
				{
					total = '"' + total + '"';
					string1 = string1 + ',"total" : ' + total;
				}
				nlapiLogExecution('DEBUG', 'total', total);
				var linkedTrackingNumbers = r.getFieldValue('linkedtrackingnumbers');
				if ((linkedTrackingNumbers == null) || (linkedTrackingNumbers == '')) 
				{
					linkedTrackingNumbers = '""';
				}
				else 
				{
					linkedTrackingNumbers = '"' + linkedTrackingNumbers + '"';
					string1 = string1 + ',"trackingNumbers" : ' + linkedTrackingNumbers;
				}
				nlapiLogExecution('DEBUG', 'linkedTrackingNumbers', linkedTrackingNumbers);
				var tranDate = r.getFieldValue('trandate');
				if ((tranDate == null) || (tranDate == '')) 
				{
					tranDate = '""';
				}
				else 
				{
					tranDate = '"' + tranDate + '"';
					string1 = string1 + ',"tranDate" : ' + tranDate;
				}
				nlapiLogExecution('DEBUG', 'tranDate', tranDate);
				var tranId = r.getFieldValue('tranid');
				if ((tranId == null) || (tranId == '')) 
				{
					tranId = '""';
				}
				else 
				{
					tranId = '"' + tranId + '"';
					string1 = string1 + ',"transactionId" : ' + tranId;
				}
				nlapiLogExecution('DEBUG', 'tranId', tranId);
				//Modified for JIRA CPQ-309, if PO# on Sales order has value the push along with other field values to Cloudhub for updating salesorder values in SFDC : Begin
				var poNumber = r.getFieldValue('otherrefnum');
				if ((poNumber == null) || (poNumber == '')) 
				{
					poNumber = '""';
				}
				else 
				{
					poNumber = '"' + poNumber + '"';
					string1 = string1 + ',"poNumber" : ' + poNumber;
				}
				nlapiLogExecution('DEBUG', 'poNumber', poNumber);
				//End
				string1 = string1 + '}';
				
				nlapiLogExecution('DEBUG', 'action', action + '::' + string1);
				
					
				try{
					var y = nlapiRequestURL(url, string1, header);
					nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
							
					if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
					{
						var fields = new Array();
						var values = new Array();
						fields[0] = 'custbody_spk_cloudhuberror';
						fields[1] = 'custbody_spk_cloudhuberrortxt';
						values[0] = 'T';
						values[1] = y.getBody().toString();
						nlapiSubmitField('salesorder',nlapiGetRecordId(),fields,values);
					}
					else
					{
						var fields = new Array();
						var values = new Array();
						fields[0] = 'custbody_spk_cloudhuberror';
						fields[1] = 'custbody_spk_cloudhuberrortxt';
						values[0] = 'F';
						values[1] = '';
						nlapiSubmitField('salesorder',nlapiGetRecordId(),fields,values);
					}
				}
				catch(e) {
					nlapiLogExecution('DEBUG', 'Error', 'Error');
					var fields = new Array();
					var values = new Array();
					fields[0] = 'custbody_spk_cloudhuberror';
					fields[1] = 'custbody_spk_cloudhuberrortxt';
					values[0] = 'T';
					values[1] = e.toString();
					nlapiSubmitField('salesorder',nlapiGetRecordId(),fields,values);
				}
			}
		}
	}
	catch(e) {
		nlapiLogExecution('DEBUG', 'Error', e.toString());
		var estring = '';
		if ( e instanceof nlobjError ) {
			estring = 'system error '+ e.getCode() + '\n' + e.getDetails();
		}
		else {
			estring = 'unexpected error '+ e.toString();
		}
		var fields = new Array();
		var values = new Array();
		fields[0] = 'custbody_spk_cloudhuberror';
		fields[1] = 'custbody_spk_cloudhuberrortxt';
		values[0] = 'T';
		values[1] = estring;
		nlapiSubmitField('salesorder',nlapiGetRecordId(),fields,values);
	}
}



/**
* This function is used to update SO status in cloudhub when Cash Sale is created in NetSuite.
* @author Abhilash Gopinathan
* @Release Date 22nd Nov 2014
* @Project Number PRJ0050845
* @version 1.0
* 
*/
/*
* On record Cash sale create/edit/approve/cancel, the status of sales order gets updated, 
* if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to Cloudhub for updating salesorder values in SFDC
* if PO# has value then push to Cloudhub for updating salesorder values in SFDC
* @ AUTHOR : Rahul
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731  
* @version 2.0
 */
 /* @Release Description: Escape special characters while passing the memo field.
* @AUTHOR : Rahul
* @Release Date 21st May 2015
* @Project Name:DFCT0050651
* @Release Number : RLSE0050339
* @Version 3.0
*/
function SyncSoCashSale(type) {
	nlapiLogExecution('DEBUG', 'type', type);
	try {
		if (type != 'delete') {
			var SO = nlapiGetFieldText('createdfrom');
			if ((SO != null)&&(SO != '')&&(SO.search('Sales Order')!= -1)) {
				var string1 = '{ ';  //Creating the body with data as requested by CLoudhub to Update SO in SFDC.

				var action = '';

				action = '"' + "update" + '"';

				string1 = string1 + '"operationType" : ' + action;

				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
				var nssoid = nlapiGetFieldValue('createdfrom');
				var r = nlapiLoadRecord('salesorder', nssoid);
				if ((r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != null) && (r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != '')) {
					var actualShipDate = r.getFieldValue('actualshipdate');
					if ((actualShipDate == null) || (actualShipDate == '')) {
						actualShipDate = '""';
					}
					else {
						actualShipDate = '"' + actualShipDate + '"';
						string1 = string1 + ',"actualShipDate" : ' + actualShipDate;
					}
					nlapiLogExecution('DEBUG', 'actualShipDate', actualShipDate);
					var currency = r.getFieldValue('currencyname');
					if ((currency == null) || (currency == '')) {
						currency = '""';
					}
					else {
						currency = '"' + currency + '"';
						string1 = string1 + ',"currency" : ' + currency;
					}
					nlapiLogExecution('DEBUG', 'currency', currency);
					
					//Modified for CPQ, if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to SFDC : Begin
					var createdfrom = '';
					var createdquote = r.getFieldText('createdfrom');
					var fpxId = r.getFieldValue('custbody_spk_fpx_id');
					if (((createdquote == null) || (createdquote == '')) && ((fpxId == null) || (fpxId == ''))) {
						createdfrom = '""';
						string1 = string1 + ',"createdFrom" : ' + createdfrom;
					}
					else if(createdquote) {
						if(createdquote.search('#')>-1) {
							createdfrom = '"' + createdquote.split('#')[1] + '"';
							string1 = string1 + ',"createdFrom" : ' + createdfrom;
						}
						nlapiLogExecution('DEBUG', 'createdfrom', createdquote.split('#')[1]);
					}
					else if(fpxId) {
						fpxId = '"' + fpxId + '"';
						string1 = string1 + ',"createdFrom" : ' + fpxId;
						nlapiLogExecution('DEBUG', 'fpxId', fpxId);
					}

					//End
					var sfdcOpportunityId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
					if ((sfdcOpportunityId == null) || (sfdcOpportunityId == '')) {
						sfdcOpportunityId = '""';
					}
					else {
						sfdcOpportunityId = '"' + sfdcOpportunityId + '"';
						string1 = string1 + ',"sfdcOpportunityId" : ' + sfdcOpportunityId;
					}
					nlapiLogExecution('DEBUG', 'sfdcOpportunityId', sfdcOpportunityId);
					var sfdcAccountId = r.getFieldValue('custbody_sfdc_id');
					if ((sfdcAccountId == null) || (sfdcAccountId == '')) {
						sfdcAccountId = '""';
					}
					else {
						sfdcAccountId = '"' + sfdcAccountId + '"';
						string1 = string1 + ',"sfdcAccountId" : ' + sfdcAccountId;
					}
					nlapiLogExecution('DEBUG', 'sfdcAccountId', sfdcAccountId);
					var discountTotal = r.getFieldValue('discounttotal');
					if ((discountTotal == null) || (discountTotal == '')) {
						discountTotal = '""';
					}
					else {
						discountTotal = '"' + discountTotal + '"';
						string1 = string1 + ',"discountTotal" : ' + discountTotal;
					}
					nlapiLogExecution('DEBUG', 'discountTotal', discountTotal);
					var endDate = r.getFieldValue('enddate');
					if ((endDate == null) || (endDate == '')) {
						endDate = '""';
					}
					else {
						endDate = '"' + endDate + '"';
						string1 = string1 + ',"endDate" : ' + endDate;
					}
					nlapiLogExecution('DEBUG', 'endDate', endDate);
					var memo = r.getFieldValue('memo');
					if ((memo == null) || (memo == '')) {
						memo = '""';
					}
					else {
					
						memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.DFCT0050651
						memo = '"' + memo + '"';
						
					}
					string1 = string1 + ',"memo" : ' + memo;
					nlapiLogExecution('DEBUG', 'memo', memo);
					var netSuiteId = nssoid;
					if ((netSuiteId == null) || (netSuiteId == '')) {
						netSuiteId = '""';
					}
					else {
						netSuiteId = '"' + netSuiteId + '"';
						string1 = string1 + ',"netSuiteId" : ' + netSuiteId;
					}
					nlapiLogExecution('DEBUG', 'netSuiteId', netSuiteId);
					var shipDate = r.getFieldValue('shipdate');
					if ((shipDate == null) || (shipDate == '')) {
						shipDate = '""';
					}
					else {
						shipDate = '"' + shipDate + '"';
						string1 = string1 + ',"shipDate" : ' + shipDate;
					}
					nlapiLogExecution('DEBUG', 'shipDate', shipDate);
					var shippingCost = r.getFieldValue('shippingcost');
					if ((shippingCost == null) || (shippingCost == '')) {
						shippingCost = '""';
					}
					else {
						shippingCost = '"' + shippingCost + '"';
						string1 = string1 + ',"shippingCost" : ' + shippingCost;
					}
					nlapiLogExecution('DEBUG', 'shippingCost', shippingCost);
					var startDate = r.getFieldValue('startdate');
					if ((startDate == null) || (startDate == '')) {
						startDate = '""';
					}
					else {
						startDate = '"' + startDate + '"';
						string1 = string1 + ',"startDate" : ' + startDate;
					}
					nlapiLogExecution('DEBUG', 'startDate', startDate);
					var status = r.getFieldText('orderstatus');
					if ((status == null) || (status == '')) {
						 status = '""';
					}
					else {
					   status = '"' + status + '"';
					   string1 = string1 + ',"status" : ' + status;
					}
					nlapiLogExecution('DEBUG', 'status', status);
					var subTotal = r.getFieldValue('subtotal');
					if ((subTotal == null) || (subTotal == '')) {

						subTotal = '""';
					}
					else {
						subTotal = '"' + subTotal + '"';
						string1 = string1 + ',"subTotal" : ' + subTotal;
					}
					nlapiLogExecution('DEBUG', 'subTotal', subTotal);
					var taxTotal = r.getFieldValue('taxtotal');
					if ((taxTotal == null) || (taxTotal == '')) {
						taxTotal = '""';
					}
					else {
						taxTotal = '"' + taxTotal + '"';
						string1 = string1 + ',"taxTotal" : ' + taxTotal;
					}
					nlapiLogExecution('DEBUG', 'taxTotal', taxTotal);
					var terms = r.getFieldValue('custbody_tran_term_in_months');
					if ((terms == null) || (terms == '')) {
						terms = 0;
						string1 = string1 + ',"termInMonths" : ' + terms;
					}
					else {
						string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
					}
					nlapiLogExecution('DEBUG', 'terms', terms);
					var total = r.getFieldValue('total');
					if ((total == null) || (total == '')) {
						total = '""';
					}
					else {
						total = '"' + total + '"';
						string1 = string1 + ',"total" : ' + total;
					}
					nlapiLogExecution('DEBUG', 'total', total);
					var linkedTrackingNumbers = r.getFieldValue('linkedtrackingnumbers');
					if ((linkedTrackingNumbers == null) || (linkedTrackingNumbers == '')) {
						linkedTrackingNumbers = '""';
					}
					else {
						linkedTrackingNumbers = '"' + linkedTrackingNumbers + '"';
						string1 = string1 + ',"trackingNumbers" : ' + linkedTrackingNumbers;
					}
					nlapiLogExecution('DEBUG', 'linkedTrackingNumbers', linkedTrackingNumbers);
					var tranDate = r.getFieldValue('trandate');
					if ((tranDate == null) || (tranDate == '')) {
						tranDate = '""';
					}
					else {
						tranDate = '"' + tranDate + '"';
						string1 = string1 + ',"tranDate" : ' + tranDate;
					}
					nlapiLogExecution('DEBUG', 'tranDate', tranDate);
					var tranId = r.getFieldValue('tranid');
					if ((tranId == null) || (tranId == '')) {
						tranId = '""';
					}
					else {
						tranId = '"' + tranId + '"';
						string1 = string1 + ',"transactionId" : ' + tranId;
					}
					nlapiLogExecution('DEBUG', 'tranId', tranId);
					//Modified for JIRA CPQ-309, if PO# on Sales order has value the push along with other field values to Cloudhub for updating salesorder values in SFDC : Begin
					var poNumber = r.getFieldValue('otherrefnum');
					if ((poNumber == null) || (poNumber == '')) 
					{
						poNumber = '""';
					}
					else 
					{
						poNumber = '"' + poNumber + '"';
						string1 = string1 + ',"poNumber" : ' + poNumber;
					}
					nlapiLogExecution('DEBUG', 'poNumber', poNumber);
					//End
					string1 = string1 + '}';
					try{
						var y = nlapiRequestURL(url, string1, header);
						nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
						if(parseInt(y.getCode())!= 200) //If the creation/update is not successful then populate error in custom fields in NetSuite.
						{
							var fields = new Array();
							var values = new Array();
							fields[0] = 'custbody_spk_cloudhuberror';
							fields[1] = 'custbody_spk_cloudhuberrortxt';
							values[0] = 'T';
							values[1] = y.getBody().toString();
							nlapiSubmitField('salesorder',nssoid,fields,values);
						}
						else
						{
							var fields = new Array();
							var values = new Array();
							fields[0] = 'custbody_spk_cloudhuberror';
							fields[1] = 'custbody_spk_cloudhuberrortxt';
							values[0] = 'F';
							values[1] = '';
							nlapiSubmitField('salesorder',nssoid,fields,values);
						}
					}
					catch (e) {
						var fields = new Array();
						var values = new Array();
						fields[0] = 'custbody_spk_cloudhuberror';
						fields[1] = 'custbody_spk_cloudhuberrortxt';
						values[0] = 'T';
						values[1] = e.toString();
						nlapiSubmitField('salesorder',nssoid,fields,values);
					}
				}
			}
		}
	}
	catch(e) {
		nlapiLogExecution('DEBUG', 'Error', e.toString());
		var estring = '';
		if ( e instanceof nlobjError ) {
			estring = 'system error '+ e.getCode() + '\n' + e.getDetails();
		}
		else {
			estring = 'unexpected error '+ e.toString();
		}
		var fields = new Array();
		var values = new Array();
		fields[0] = 'custbody_spk_cloudhuberror';
		fields[1] = 'custbody_spk_cloudhuberrortxt';
		values[0] = 'T';
		values[1] = estring;
		nlapiSubmitField('cashsale',nlapiGetRecordId(),fields,values);
	}
}

/**
* This function is used to update SO status in cloudhub when Invoice is created in NetSuite.
* @author Abhilash Gopinathan
* @Release Date 22nd Nov 2014
* @Project Number PRJ0050845
* @version 1.0
* 
*/
/*
* On record Invoice create/edit/approve/cancel, the status of sales order gets updated, 
* if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to Cloudhub for updating salesorder values in SFDC
* if PO# has value then push to Cloudhub for updating salesorder values in SFDC
* @ AUTHOR : Rahul
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731  
* @version 2.0
 */
  /* @Release Description: Escape special characters while passing the memo field.
* @AUTHOR : Rahul
* @Release Date 21st May 2015
* @Project Name:DFCT0050651
* @Release Number : RLSE0050339
* @Version 3.0
*/

function SyncSoInvoice(type) 
{
    nlapiLogExecution('DEBUG', 'type', type);
	try {
		if (type != 'delete') {
			var SO = nlapiGetFieldText('createdfrom');
			if ((SO != null)&&(SO != '')&&(SO.search('Sales Order')!= -1)) {
				var string1 = '{ '; //Creating the body with data as requested by CLoudhub to Update SO in SFDC.

				var action = '';

				action = '"' + "update" + '"';

				string1 = string1 + '"operationType" : ' + action;

				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
				var nssoid = nlapiGetFieldValue('createdfrom');
				var r = nlapiLoadRecord('salesorder',nssoid );
				if ((r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != null) && (r.getFieldValue('custbody_celigo_ns_sfdc_sync_id') != '')) {
					var actualShipDate = r.getFieldValue('actualshipdate');
					if ((actualShipDate == null) || (actualShipDate == '')) {
						actualShipDate = '""';
					}
					else {
						actualShipDate = '"' + actualShipDate + '"';
						string1 = string1 + ',"actualShipDate" : ' + actualShipDate;
					}
					nlapiLogExecution('DEBUG', 'actualShipDate', actualShipDate);
					var currency = r.getFieldValue('currencyname');
					if ((currency == null) || (currency == '')) {
						currency = '""';
					}
					else {
						currency = '"' + currency + '"';
						string1 = string1 + ',"currency" : ' + currency;

					}
					nlapiLogExecution('DEBUG', 'currency', currency);

					//Modified for CPQ, if CreatedFrom(QuoteId) is blank on sales order then get the FPX ID field to push along with other field values to SFDC : Begin
					var createdfrom = '';
					var createdquote = r.getFieldText('createdfrom');
					var fpxId = r.getFieldValue('custbody_spk_fpx_id');
					if (((createdquote == null) || (createdquote == '')) && ((fpxId == null) || (fpxId == ''))) {
						createdfrom = '""';
						string1 = string1 + ',"createdFrom" : ' + createdfrom;
					}
					else if(createdquote) {
						if(createdquote.search('#')>-1) {
							createdfrom = '"' + createdquote.split('#')[1] + '"';
							string1 = string1 + ',"createdFrom" : ' + createdfrom;
						}
						nlapiLogExecution('DEBUG', 'createdfrom', createdquote.split('#')[1]);
					}
					else if(fpxId) {
						fpxId = '"' + fpxId + '"';
						string1 = string1 + ',"createdFrom" : ' + fpxId;
						nlapiLogExecution('DEBUG', 'fpxId', fpxId);
					}

					//End
					var sfdcOpportunityId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
					if ((sfdcOpportunityId == null) || (sfdcOpportunityId == '')) {
						sfdcOpportunityId = '""';
					}
					else {
						sfdcOpportunityId = '"' + sfdcOpportunityId + '"';
						string1 = string1 + ',"sfdcOpportunityId" : ' + sfdcOpportunityId;
					}
					nlapiLogExecution('DEBUG', 'sfdcOpportunityId', sfdcOpportunityId);
					var sfdcAccountId = r.getFieldValue('custbody_sfdc_id');
					if ((sfdcAccountId == null) || (sfdcAccountId == '')) {
						sfdcAccountId = '""';
					}
					else {
						sfdcAccountId = '"' + sfdcAccountId + '"';
						string1 = string1 + ',"sfdcAccountId" : ' + sfdcAccountId;
					}
					nlapiLogExecution('DEBUG', 'sfdcAccountId', sfdcAccountId);
					var discountTotal = r.getFieldValue('discounttotal');
					if ((discountTotal == null) || (discountTotal == '')) {
						discountTotal = '""';
					}
					else {
						discountTotal = '"' + discountTotal + '"';
						string1 = string1 + ',"discountTotal" : ' + discountTotal;
					}
					nlapiLogExecution('DEBUG', 'discountTotal', discountTotal);
					var endDate = r.getFieldValue('enddate');
					if ((endDate == null) || (endDate == '')) {
						endDate = '""';
					}
					else {
						endDate = '"' + endDate + '"';
						string1 = string1 + ',"endDate" : ' + endDate;
					}
					nlapiLogExecution('DEBUG', 'endDate', endDate);
					var memo = r.getFieldValue('memo');
					if ((memo == null) || (memo == '')) {
						memo = '""';
					}
					else {
						
						memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.DFCT0050651
						memo = '"' + memo + '"';
						
					}
					string1 = string1 + ',"memo" : ' + memo;
					nlapiLogExecution('DEBUG', 'memo', memo);
					var netSuiteId = nssoid;
					if ((netSuiteId == null) || (netSuiteId == '')) {
						netSuiteId = '""';
					}
					else {
						netSuiteId = '"' + netSuiteId + '"';
						string1 = string1 + ',"netSuiteId" : ' + netSuiteId;
					}
					nlapiLogExecution('DEBUG', 'netSuiteId', netSuiteId);
					var shipDate = r.getFieldValue('shipdate');
					if ((shipDate == null) || (shipDate == '')) {
						shipDate = '""';
					}
					else {
						shipDate = '"' + shipDate + '"';
						string1 = string1 + ',"shipDate" : ' + shipDate;
					}
					nlapiLogExecution('DEBUG', 'shipDate', shipDate);
					var shippingCost = r.getFieldValue('shippingcost');
					if ((shippingCost == null) || (shippingCost == '')) {
						shippingCost = '""';
					}
					else {
						shippingCost = '"' + shippingCost + '"';
						string1 = string1 + ',"shippingCost" : ' + shippingCost;
					}
					nlapiLogExecution('DEBUG', 'shippingCost', shippingCost);
					var startDate = r.getFieldValue('startdate');
					if ((startDate == null) || (startDate == '')) {
						startDate = '""';
					}
					else {
						startDate = '"' + startDate + '"';
						string1 = string1 + ',"startDate" : ' + startDate;
					}
					nlapiLogExecution('DEBUG', 'startDate', startDate);
					var status = r.getFieldText('orderstatus');
					if ((status == null) || (status == '')) {
						status = '""';
					}
					else {
						status = '"' + status + '"';
						string1 = string1 + ',"status" : ' + status;
					}
					nlapiLogExecution('DEBUG', 'status', status);
					var subTotal = r.getFieldValue('subtotal');
					if ((subTotal == null) || (subTotal == '')) {
						subTotal = '""';
					}
					else {
						subTotal = '"' + subTotal + '"';
						string1 = string1 + ',"subTotal" : ' + subTotal;
					}
					nlapiLogExecution('DEBUG', 'subTotal', subTotal);
					var taxTotal = r.getFieldValue('taxtotal');
					if ((taxTotal == null) || (taxTotal == '')) {
						taxTotal = '""';
					}
					else {
						taxTotal = '"' + taxTotal + '"';
						string1 = string1 + ',"taxTotal" : ' + taxTotal;
					}
					nlapiLogExecution('DEBUG', 'taxTotal', taxTotal);
					var terms = r.getFieldValue('custbody_tran_term_in_months');
					if ((terms == null) || (terms == '')) {
						terms = 0;
						string1 = string1 + ',"termInMonths" : ' + terms;
					}
					else {
						string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
					}
					nlapiLogExecution('DEBUG', 'terms', terms);
					var total = r.getFieldValue('total');
					if ((total == null) || (total == '')) {
						total = '""';
					}
					else {
						total = '"' + total + '"';
						string1 = string1 + ',"total" : ' + total;
					}
					nlapiLogExecution('DEBUG', 'total', total);
					var linkedTrackingNumbers = r.getFieldValue('linkedtrackingnumbers');
					if ((linkedTrackingNumbers == null) || (linkedTrackingNumbers == '')) {
						linkedTrackingNumbers = '""';
					}
					else {
						linkedTrackingNumbers = '"' + linkedTrackingNumbers + '"';
						string1 = string1 + ',"trackingNumbers" : ' + linkedTrackingNumbers;
					}
					nlapiLogExecution('DEBUG', 'linkedTrackingNumbers', linkedTrackingNumbers);
					var tranDate = r.getFieldValue('trandate');
					if ((tranDate == null) || (tranDate == '')) {
						tranDate = '""';
					}
					else {
						tranDate = '"' + tranDate + '"';
						string1 = string1 + ',"tranDate" : ' + tranDate;
					}
					nlapiLogExecution('DEBUG', 'tranDate', tranDate);
					var tranId = r.getFieldValue('tranid');
					if ((tranId == null) || (tranId == '')) {
						tranId = '""';
					}
					else {
						tranId = '"' + tranId + '"';
						string1 = string1 + ',"transactionId" : ' + tranId;
					}
					nlapiLogExecution('DEBUG', 'tranId', tranId);
					//Modified for JIRA CPQ-309, if PO# on Sales order has value the push along with other field values to Cloudhub for updating salesorder values in SFDC : Begin
					var poNumber = r.getFieldValue('otherrefnum');
					if ((poNumber == null) || (poNumber == '')) 
					{
						poNumber = '""';
					}
					else 
					{
						poNumber = '"' + poNumber + '"';
						string1 = string1 + ',"poNumber" : ' + poNumber;
					}
					nlapiLogExecution('DEBUG', 'poNumber', poNumber);
					//End
					string1 = string1 + '}';
				try {
					var y = nlapiRequestURL(url, string1, header);
					nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
					if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
					{
						var fields = new Array();
						var values = new Array();
						fields[0] = 'custbody_spk_cloudhuberror';
						fields[1] = 'custbody_spk_cloudhuberrortxt';
						values[0] = 'T';
						values[1] = y.getBody().toString();
						nlapiSubmitField('salesorder',nssoid,fields,values);
					}
					else {
						var fields = new Array();
						var values = new Array();
						fields[0] = 'custbody_spk_cloudhuberror';
						fields[1] = 'custbody_spk_cloudhuberrortxt';
						values[0] = 'F';
						values[1] = '';
						nlapiSubmitField('salesorder',nssoid,fields,values);
					}
				}
				catch (e) {
						
					var fields = new Array();
					var values = new Array();
					fields[0] = 'custbody_spk_cloudhuberror';
					fields[1] = 'custbody_spk_cloudhuberrortxt';
					values[0] = 'T';
					values[1] = e.toString();
					nlapiSubmitField('salesorder',nssoid,fields,values);
				}
			}
			}
		}
	}
	catch(e) {
		nlapiLogExecution('DEBUG', 'Error', e.toString());
		var estring = '';
		if ( e instanceof nlobjError ) {
			estring = 'system error '+ e.getCode() + '\n' + e.getDetails();
		}
		else {
			estring = 'unexpected error '+ e.toString();
		}
		var fields = new Array();
		var values = new Array();
		fields[0] = 'custbody_spk_cloudhuberror';
		fields[1] = 'custbody_spk_cloudhuberrortxt';
		values[0] = 'T';
		values[1] = estring;
		nlapiSubmitField('invoice',nlapiGetRecordId(),fields,values);
	}
}


function escapeXML(s) {//Added by Rahul Shaw to escape special characters.DFCT0050651
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}