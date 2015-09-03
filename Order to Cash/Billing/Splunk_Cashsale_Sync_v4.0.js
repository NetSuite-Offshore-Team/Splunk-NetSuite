/*
* This script file is used to create/update Cash Sale in Cloudhub
* @ AUTHOR : Vaibhav
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Name: Hangman
* @Project Number PRJ0050865 
* @version 1.0
*/
/*
* To fix the try/catch exception handling in the script for setting Cloudhub Errors on Submit Field for respective Record Type and record ID 
* @ AUTHOR : Unitha
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
* To include subscription id in the JSON and pass it to Cloudhub as part of Rainmakr Project.
* @ AUTHOR : Rahul
* @Release Date: 7th June 2015
* @Release Number: RLSE0050382 
* @Project Number: PRJ0050945 
* @version 2.0
*/
/*
* @Release Description: 
* The following changes have been done in the script file as part of the release RLSE0050396:
* Updated the scenario to call the scheduled script & sync function for generate pdf and sync to SFDC, when multiple financial records are submitted together.
* @AUTHOR : Mani
* @Release Date 13th July 2015
* @Project Name:DFCT0050773 - Financial Record not flowing back to SFDC
* @Release Number : RLSE0050396
* @Version 3.0
*/
/* To include upgrade fields to the cash sale as part of Rainmakr MVP2 Project.
* @ AUTHOR : Maria Auxilia
* @Release Date: 14th July 2015
* @Release Number: TBD
* @Project Number: TBD
* @version 4.0
*/
// this is the from field email employee, accounting@splunk.com
// var fromEmailId = 26872;
// this is the new from field employee, "Management, Order"
var BLANK_TC_INV_ID = 2;
var BLANK_TC_QT_ID = 1;


/*
    convert text type to tx lookup ID
 */

var txTypeIdMap = {
    'estimate' : 6,
    'invoice' : 7,
	'cashsale' : 7
	};

function onAfterSubmitCashSalePdf(type) {

    try {
			var order = nlapiGetNewRecord();
			var invoiceId = order.getId();
			nlapiLogExecution( 'DEBUG', 'type', type);
			nlapiLogExecution('DEBUG','recordtype',order.getRecordType());
		
			if(type == 'create')   // In New Invoice Creation Call
			{
				var params = new Array();
				params['custscript_splunk_invoiceid'] = invoiceId;
				params['custscript_splunk_pdf'] = 'T';
			    params['custscript_splunk_txtype']=order.getRecordType();
				if(order.getRecordType() == 'invoice')// as part of defect : DFCT0050773
			    {
				    invoiceSync(invoiceId);  // Invoice Sync
				}
				else
				{
				     cashsaleSync(invoiceId)   //  CashSale Sync
				}
				//call the  SCH script for create PDF and Invoice sync : DFCT0050773.
				callSCH(params,invoiceId);
			}
			else if(type == 'edit')  // In Invoice Edit call
			{
				var oldRecord = nlapiGetOldRecord();
				var oldAmount = oldRecord.getFieldValue('total');
				var newAmount = order.getFieldValue('total');
                var PdfId =order.getFieldValue('custbody_splunk_pdfid');
							
				if(oldAmount != newAmount)   // check if any modification made in invoice record
				{
				   var params = new Array();
				   params['custscript_splunk_invoiceid'] = order.getId();
				   params['custscript_splunk_pdf'] ='T';
				   params['custscript_splunk_txtype']=order.getRecordType();
				   cashsaleSync(invoiceId);//calling the cashsaleSync function to sync with SFDC : DFCT0050773.
				   callSCH(params,order.getId()); // calling the scheduled script to generate PDF and sync with SFDC : DFCT0050773.
				  // var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params)
			  
				}
				else  // No changes in invoice record
				{
				   if(PdfId)
				   {
						if(order.getRecordType() == 'invoice')
						{
							invoiceSync(invoiceId);  // Invoice Sync
						}
						else
						{
							 cashsaleSync(invoiceId)  // CashSale Sync
						}
				   }
				   else
				   {
					   var params = new Array();
					   params['custscript_splunk_invoiceid'] = order.getId();
					   params['custscript_splunk_pdf'] ='T';
					   params['custscript_splunk_txtype']=order.getRecordType();
					   cashsaleSync(invoiceId);
					   callSCH(params,order.getId()); 
					   // var params = new Array();
					   // params['custscript_splunk_invoiceid'] = order.getId();
					   // params['custscript_splunk_pdf'] ='T';
					   // cashsaleSync(invoiceId);
					   // var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params);
					}				 
				}
			}
  
	}
	catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
							
			}  
		}
}

/*
    add button to invoke pdf suitelet
 */

function onBeforeLoadCashSalePdf(type,form,request) {

    try {
        if(type == 'view') {
            var rec = nlapiGetNewRecord();
            var tcType = rec.getFieldValue('custbody_celigo_tc_type');
           
            var txId = rec.getId();
            var custId =  rec.getFieldValue('entity');
            var url = nlapiResolveURL('SUITELET', 'customscript_splunk_invoice_pdf_suitelet', 'customdeploy_splunk_invoice_pdf_suitelet', false);
            var script = "window.open('" + url +  "&tx_type=" + rec.getRecordType() + "&tx_id=" + rec.getId() +
                      "','PRINT', 'scrollbars=yes, location=no, toolbar=no, width=500, height=550, resizable=yes');";
            form.addButton("custpage_bfo_print","View CashSale PDF",script);  // add the View Pdf button 
     
            /* add Send Email button to view form */

            var rec = nlapiGetNewRecord();
            var tcType = rec.getFieldValue('custbody_celigo_tc_type');
            if(tcType == null || tcType == '') 
			{
                var blankTcId = getBlankTcId(rec);
                if(blankTcId != null) 
				{
                    rec.setFieldValue('custbody_celigo_tc_type',blankTcId);
				}
            }
            var fld = form.addField('custpage_is_print_bundle','checkbox','Is Save & Print Bundle');
            fld.setDefaultValue('F');
            fld.setDisplayType('hidden');
			var url = nlapiResolveURL('SUITELET', 'customscript_splunk_invoice_pdf_suitelet', 'customdeploy_splunk_invoice_pdf_suitelet', false);
			var script = "window.location.replace('" + url  +  "&tx_type=" + rec.getRecordType() + "&invoiceId=" + txId+ "')";
			form.addButton("custpage_bfo_save_email","Send Email",script); // on button click will call suitelet function and send the mail with attachment
			
        }
    } 
	catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
							
			}  
		}
}


function invoiceSync(invoiceId){

	try {
	
			var string1 = '{';
            string1 = string1;
            var header = new Array();
            header['Accept'] = 'application/json';
            header['Content-Type'] = 'application/json';	
			var r = nlapiLoadRecord('invoice',invoiceId);
	    
        /*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
			if(r.getFieldValue('custbody_spk_cloudhuberror') == 'T')
			{
			var field = new Array();
	        var value = new Array();
	        field[0] = 'custbody_spk_cloudhuberror';
			field[1] = 'custbody_spk_cloudhuberrortxt';
	        value[0] = 'F';
            value[1] = '';
			nlapiSubmitField('invoice',invoiceId,field,value);
			}
		/*----End-------------------Clearing the sync Error fields-----------------End------*/		
		
	        var createdfrom = r.getFieldText('createdfrom');
            if ((createdfrom == null) || (createdfrom == '')) 
			{
                createdfrom = '""';
            }
            else 
			{                
				if(createdfrom.search('#')>-1)
				{
				createdfrom = '"' + createdfrom.split('#')[1] + '"';               
				}
            }
			string1 = string1 + '"createdFrom" : ' + createdfrom;
            
	        var currency = r.getFieldValue('currencyname');
            if ((currency == null) || (currency == '')) 
			{
                currency = '""';
            }
            else 
			{
                currency = '"' + currency + '"';               
            }
			string1 = string1 + ',"currencyName" : ' + currency;
            
	        var type = r.getFieldValue('type');
            if ((type == null) || (type == '')) 
			{
                type = '""';
            }
            else 
			{
			    if (type == 'custinvc')
					{
					type = "Invoice";
					}
                type = '"' + type + '"';                
            }
			string1 = string1 + ',"type" : ' + type;
            			
	        var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
            if ((sfdcSyncId == null) || (sfdcSyncId == '')) 
			{
                sfdcSyncId = '" "';
            }
            else 
			{
                sfdcSyncId = '"' + sfdcSyncId + '"';                
            }
			string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
			
	        var endDate = r.getFieldValue('enddate');
            if ((endDate == null) || (endDate == '')) 
			{
                endDate = '""';
            }
            else 
			{
                endDate = '"' + endDate + '"';                
            }
			string1 = string1 + ',"endDate" : ' + endDate;
           			
	        var startDate = r.getFieldValue('startdate');
            if ((startDate == null) || (startDate == '')) 
			{
                startDate = '""';
            }
            else 
			{
                startDate = '"' + startDate + '"';             
            }
			string1 = string1 + ',"startDate" : ' + startDate;
       
            var supportInvoice = r.getFieldValue('custbody_splunk_support_invoice');
            if ((supportInvoice == null) || (supportInvoice == '')) 
			{
                supportInvoice = '""';
				string1 = string1 + ',"supportInvoice" :' + supportInvoice;
            }
            else 			
			{
				if (supportInvoice == 'T')
					{
					string1 = string1 + ',"supportInvoice" : true';
					}
				if (supportInvoice == 'F')
					{
					string1 = string1 + ',"supportInvoice" : false';
					}
            }
			
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
            
	        var discountTotal = r.getFieldValue('discounttotal');
            if ((discountTotal == null) || (discountTotal == '')) 
			{
                discountTotal = '""';
            }
			string1 = string1 + ',"discountTotal" : ' +  parseFloat(discountTotal);
            			
	        var customer =r.getFieldValue('custbody_sfdc_id');
            if ((customer == null) || (customer == '')) 
			{
                customer = '" "';
            }
            else 
			{
                customer = '"' + customer + '"';                
            }		
			string1 = string1 + ',"entity" : ' + customer;
			
	        var internalId = invoiceId;
            if ((internalId == null) || (internalId == '')) 
			{
                internalId = '""';
            }
            else 
			{
                internalId = '"' +internalId+ '"';               
            }
			string1 = string1 + ',"internalId" : ' + internalId;
					 
	        var memo = r.getFieldValue('memo');
            if ((memo == null) || (memo == '')) 
			{
                memo = '""';
            }
            else 
			{
               //Added by Rahul Shaw to escape special characters.DFCT0050651  
				memo = escapeXMLChar(memo); 
                memo = '"' + memo + '"';                
			}
			string1 = string1 + ',"memo" : ' + memo;
						
            var shippingCost = r.getFieldValue('shippingcost');
            if ((shippingCost == null) || (shippingCost == '')) 
			{
                shippingCost = '0.00';
            }
            else 
			{
                shippingCost = shippingCost;                
            }
			string1 = string1 + ',"shippingCost" : ' +  shippingCost;
            			
	        var status = r.getFieldValue('status');
            if ((status == null) || (status == '')) 
			{
                status = '""';
            }
            else 
			{
            status = '"' + status + '"';                    
            }
	        string1 = string1 + ',"status" : ' + status;
            
	        var subTotal = r.getFieldValue('subtotal');
            if ((subTotal == null) || (subTotal == '')) 
			{
                subTotal = '""';
            }
            else 
			{
                subTotal = subTotal;                
            }
			string1 = string1 + ',"subTotal" : ' +  parseFloat(subTotal);
            						
	        var taxTotal = r.getFieldValue('taxtotal');
            if ((taxTotal == null) || (taxTotal == '')) 
			{
                taxTotal = '""';
            }
            else 
			{
                taxTotal = taxTotal;                
            }
			string1 = string1 + ',"taxTotal" : ' + taxTotal;
             
	        var total = r.getFieldValue('total');
            if ((total == null) || (total == '')) 
			{
                total = '""';
            }
			string1 = string1 + ',"total" : ' +  parseFloat(total);
                                
            var tranDate = r.getFieldValue('trandate');
            if ((tranDate == null) || (tranDate == '')) 
			{
                tranDate = '""';
            }
            else 
			{
                tranDate = '"' + tranDate + '"';                
            }
			string1 = string1 + ',"transactionDate" : ' + tranDate;
            			
	        var tranId = r.getFieldValue('tranid');
            if ((tranId == null) || (tranId == '')) 
			{
                tranId = '""';
            }
            else 
			{
                tranId = '"' + tranId + '"';                
            }
			string1 = string1 + ',"transactionId" : ' + tranId;
            		
	        var pdfId = r.getFieldValue('custbody_splunk_pdfid'); 
			if (!pdfId || pdfId== '')
			{ 
					pdfId='""';
			}
			else
			{
			pdfId= '"'+ pdfId +'"';
			}
			string1 = string1 + ',"pdfId" : ' + pdfId;
		
            var folderId =  nlapiGetContext().getSetting('SCRIPT', 'custscript_splunk_pdf_folderid'); 
			if(folderId == '' ||! folderId )
			{ 
					folderId =='""';
			}
			else
			{
				string1 = string1 + ',"folderId" : ' + '"' +folderId + '"';
			}
			string1 = string1 + '}';
            nlapiLogExecution('DEBUG', 'string1', string1);
			
			/*----End------------Creating JSON Object to be sent to Cloudhub------------End-----*/
	
            //Getting Cloudhub URL from script parameter to which JSON object to be posted
            var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
			//Getting Authorization header from script parameter which is used when requesting URL for Authentication
            var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
            var header = new Array();
		    header['Authorization'] = authorizationHeader;
            header['Accept'] = 'application/json';
            header['Content-Type'] = 'application/json';
		    var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
            nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
			
			
			/*------Start-----Checking if the request is processed successfully----------Start-------*/
	        if(parseInt(y.getCode()) == 200)
            {
			//Capturing SFDC object id for the record created successfully in NetSuite custom field
                 nlapiSubmitField('invoice',invoiceId,'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
			}
					
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/
					
          	if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
            {
                  var fields = new Array();
	              var values = new Array();
	              fields[0] = 'custbody_spk_cloudhuberror';
	              fields[1] = 'custbody_spk_cloudhuberrortxt';
	              values[0] = 'T';
	              values[1] = y.getBody().toString();
               //var sfdcsoid = y.getBody().toString().split('"salesOrderId":"')[1].split('","')[0];
	              nlapiSubmitField('invoice',invoiceId,fields,values);	//Capturing error message in a custom field
            }
			/*------End-------------If the sent request failed---------------------End-------*/ 
	}
	catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
							
			}  
		}
}


function cashsaleSync(cashSaleId)
{
   try {
   /*---Start----Getting SFDC Customer ID through look up----Start-----*/
		var r = nlapiLoadRecord('cashsale',cashSaleId);
		var nscustomer = r.getFieldValue('entity');
	    if(nscustomer != null && nscustomer != null)
		{
		var sfdccustomer = nlapiLookupField('customer',nscustomer,'custentity_celigo_ns_sfdc_sync_id');
		}
	/*---END----Getting SFDC Customer ID through look up----END-----*/
	
	/*----Start------------Creating JSON Object to be sent to Cloudhub------------Start-----*/
	
	    var string1 = '{';

		/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
			if(r.getFieldValue('custbody_spk_cloudhuberror') == 'T')
			{
			var field = new Array();
	        var value = new Array();
	        field[0] = 'custbody_spk_cloudhuberror';
			field[1] = 'custbody_spk_cloudhuberrortxt';
	        value[0] = 'F';
            value[1] = '';
			nlapiSubmitField('cashsale',cashSaleId,field,value);
			}
	/*----End-------------------Clearing the sync Error fields-----------------End------*/

	        var currency = r.getFieldText('currency');
            if ((currency == null) || (currency == '')) 
			{
                currency = '""';
            }
            else 
			{
                currency = '"' + currency + '"';
                string1 = string1 + '"currencyName" : ' + currency;
            }
            
			
			var discountTotal = r.getFieldValue('discounttotal');
            if ((discountTotal == null) || (discountTotal == '')) 
			{
                discountTotal = '0.00';
            }
            else 
			{
                discountTotal =discountTotal;
                
            }
			string1 = string1 + ',"discountTotal" : ' + discountTotal;
            
			
			var customer = sfdccustomer;
            if ((customer == null) || (customer == '')) 
			{
                customer = '""';
            }
            else 
			{
                customer = '"' + customer + '"';
            }
			string1 = string1 + ',"entity" : ' + customer;
            
			
			var memo = r.getFieldValue('memo');
            if ((memo == null) || (memo == '')) 
			{
                memo = '""';
            }
            else 
			{
                //Added by Rahul Shaw to escape special characters.DFCT0050651
				memo = escapeXMLChar(memo); 
                memo = '"' + memo + '"';
			}
			string1 = string1 + ',"memo" : ' + memo;
			
			
			var internalid = r.getFieldValue('id');
            if ((internalid == null) || (internalid == '')) 
			{
                internalid = '""';
            }
            else 
			{
                internalid = '"' + internalid + '"';
                string1 = string1 + ',"internalId" : ' + internalid;
			}
            
			
			var shippingCost = r.getFieldValue('shippingcost');
            if ((shippingCost == null) || (shippingCost == '')) 
			{
                shippingCost = '0.00';
            }
            else 
			{
                shippingCost = '"' + shippingCost + '"';
            }
			string1 = string1 + ',"shippingCost" : ' + shippingCost;
            
			
			var status = r.getFieldValue('status');
			if ((status == null) || (status == '')) 
			{
            status = '""';
            }
            else 
			{
            status = '"' + status + '"';
            }
			string1 = string1 + ',"status" : ' + status;
                

			var subTotal = r.getFieldValue('subtotal');
            if ((subTotal == null) || (subTotal == '')) 
			{
			subTotal = '""';
            }
            string1 = string1 + ',"subTotal" : ' + subTotal;
			
			var taxTotal = r.getFieldValue('taxtotal');
            if ((taxTotal == null) || (taxTotal == '')) 
			{
                taxTotal = '0.00';
            }
            string1 = string1 + ',"taxTotal" : ' + taxTotal;
            
			//Added the subscription id field as part of Rainmakr project
			var subscriptionId = r.getFieldValue('custbody_spk_sfdc_subscription_id'); 
			var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
			if((subscriptionId == null) || (subscriptionId == ''))//If subscription id is not present then only we have to send the order id-Rainmakr-Rahul Shaw
			{
				if ((sfdcSyncId == null) || (sfdcSyncId == '')) 
				{
					sfdcSyncId = '""';
				}
				else 
				{
					sfdcSyncId = '"' + sfdcSyncId + '"';                
				}
				string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
            }
			//Start of including the subscription Id in the JSON to be sent to SFDC as part of Rainmakr - Rahul Shaw
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
			
			/*Rainmakr MVP2 changes - To retrieve the old cash sale id and start date from the cash sale*/
			
			
			var oldcsid = r.getFieldValue('custbody_spk_old_cashsale_id');	
			nlapiLogExecution('DEBUG','old cash sale id',oldcsid);
			var stdt = r.getLineItemValue('item','revrecstartdate',1);
			var upgradesfdcono = r.getFieldValue('custbody_spk_sfdc_order_no');	
			
			//End of MVP2 changes
			
			var total = r.getFieldValue('total');
            if ((total == null) || (total == '')) 
			{
                total = '""';
            }
            string1 = string1 + ',"total" : ' + total;
            			
			
			var tranDate = r.getFieldValue('trandate');
            if ((tranDate == null) || (tranDate == '')) 
			{
                tranDate = '""';
            }
            else 
			{
                tranDate = '"' + tranDate + '"';              
            }
			string1 = string1 + ',"transactionDate" : ' + tranDate;
            
			
			var tranId = r.getFieldValue('tranid');
            if ((tranId == null) || (tranId == '')) 
			{
                tranId = '""';
            }
            else 
			{
                tranId = '"' + tranId + '"';
            }
			string1 = string1 + ',"transactionId" : ' + tranId;
            
		
			var type = r.getRecordType();
            if ((type == null) || (type == '')) 
			{
                type = '""';
            }
            string1 = string1 + ',"type" : "Cash Sale"';
            
			
			var pdfId = r.getFieldValue('custbody_splunk_pdfid'); 
			if (!pdfId || pdfId== '')
			{ 
					pdfId='""';
			}
			else
			{
			pdfId= '"'+ pdfId +'"';
			}
			string1 = string1 + ',"pdfId" : ' + pdfId;
		
            var folderId =  nlapiGetContext().getSetting('SCRIPT', 'custscript_splunk_pdf_folderid'); 
			if(folderId == '' ||! folderId )
			{ 
					folderId =='""';
			}
			else
			{
				string1 = string1 + ',"folderId" : ' + '"' +folderId + '"';
			}
			
		    			
			string1 = string1 + '}';
			
		    nlapiLogExecution('DEBUG', 'Cashsale-Json Data::', string1);
  
            /*----END------------Creating JSON Object to be sent to Cloudhub------------END-----*/
           
			/*Rainmakr MVP2 changes - updating the upgrade fields on the old cash sale*/
                        
			//If old cash sale id is present then load the cash sale and update fields

			if ( oldcsid || oldcsid != '')
			{
				var rec = nlapiLoadRecord('cashsale',oldcsid);
                var upgradeflag = rec.getFieldValue('custbody_spk_upgrade_flag'); 
		        var upgradedate = rec.getFieldValue('custbody_spk_upgrade_purchase_date'); 
			        
				
				//Update the upgrade fields on the old cs if they are null  else ignore
				nlapiSubmitField('cashsale',oldcsid,'custbody_spk_upgrade_purchase_date',stdt);
				nlapiSubmitField('cashsale',oldcsid,'custbody_spk_upgrade_flag','T');
				nlapiSubmitField('cashsale',oldcsid,'custbody_spk_upgrade_sfdc_order_no',upgradesfdcono);
				nlapiSubmitField('cashsale',oldcsid,'custbody_spk_new_cashsale_id',cashSaleId);
			}
			//End of MVP2 changes
			
			//Getting Cloudhub URL from script parameter to which JSON object to be posted
			
				var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
			
			//Getting Authorization header from script parameter which is used when requesting URL for Authentication
			var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
			
			var header = new Array();
			header['Authorization'] = authorizationHeader;
			header['Accept'] = 'application/json';
			header['Content-Type'] = 'application/json';
			var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
                        nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
			
            /*------Start-----Checking if the request is processed successfully----------Start-------*/			
                        if(parseInt(y.getCode()) == 200)
                        {
						//Capturing SFDC object id for the record created successfully in NetSuite custom field
                        nlapiSubmitField('cashsale',cashSaleId,'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
						}
		   								   
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/
          	        if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
                    {
                    var fields = new Array();
	                var values = new Array();
	                fields[0] = 'custbody_spk_cloudhuberror';
	                fields[1] = 'custbody_spk_cloudhuberrortxt';
	                values[0] = 'T';
                    values[1] = y.getBody().toString();
	                //var sfdcsoid = y.getBody().toString().split('"salesOrderId":"')[1].split('","')[0];
	                nlapiSubmitField('cashsale',cashSaleId,fields,values);	//Capturing error message in a custom field
                    }
			/*------End-------------If the sent request failed---------------------End-------*/
			
			
	}
	catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
							
			}  
		}
}


function getBlankTcId(rec) {                            // get the T and C Type from splunk pdf config record

    var columns = [];
    columns.push(new nlobjSearchColumn("name"));
    columns.push(new nlobjSearchColumn("custrecord_splunk_tc_type"));

    var filters = [];

    filters.push(new nlobjSearchFilter('name',null,'is','Blank T&C'));
    filters.push(new nlobjSearchFilter('custrecord_splunk_pdf_tx_type',null,'anyof',[txTypeIdMap[rec.getRecordType()]]));

    var srs = nlapiSearchRecord('customrecord_splunk_pdf_config',null,filters,columns);
    if(srs == null)
	{
        return null;
    }
    return srs[0].getValue('custrecord_splunk_tc_type');
}



function excapeXML(s) {
    if(s == null) {
        return null;
    }
    return s.replace(/<br>/g,"\n").replace(/&amp;/g,'&').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g,"&#39;").replace(/\n/g,"<br/>");
}

/*
    convert T&C text to XML
 */

function formatTandC(text) {

    if(text == null) {
        return '';
    }
    
    var escaped = excapeXML(text);
    
    
   
    
    escaped = "<p>" + escaped.replace(/(<br\/>\W*<br\/>)/g,"</p>\n<p>") + "</p>";
    return escaped ;
}

/*
    generate PDF file for order.  Load config settings and BFO
    xml.  Run thru tempalate processor trimpath for final xml.
    Put that into nlapiXMLToPDF to generate final PDF
 */

function genPdf(order,tranId){     

	var tcType = order.getFieldValue('custbody_celigo_tc_type');
	var recType = order.getRecordType();

	var recTypeId = txTypeIdMap[recType];

	if (recTypeId == null) {
		return;
	}

	var searchFilters = [];   // filter by tx type get the template file 
	var filterIdx = 0;
	searchFilters[filterIdx++] = new nlobjSearchFilter('custrecord_splunk_pdf_tx_type', null, 'anyof', [recTypeId]);
	/* Celigo - csnelson 5/9/2013 added default value for tcType Start*/
	if(!tcType)
		tcType = 2;
	/* Celigo - csnelson 5/9/2013 added default value for tcType End*/
	searchFilters[filterIdx++] = new nlobjSearchFilter('custrecord_splunk_tc_type', null, 'anyof', [tcType]);

	var searchColumns = [];
	var columnIdx = 0;
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_splunk_pdf_tx_type');
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_splunk_pdf_template');
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_splunk_tc_type');
	var searchResults = nlapiSearchRecord('customrecord_splunk_pdf_config', null, searchFilters, searchColumns);

	if (searchResults == null) {
        nlapiLogExecution('ERROR', 'onAfterSubmit_bfo', 'PDF Configuration record not found for selected T&C Type');
		throw "PDF Configuration record not found for selected T&C Type";// error
	}
	if (searchResults.length > 1) {
		nlapiLogExecution('ERROR',  "Mutiple PDF configuration record not found for selected T&C Type, only one may be defined");// error
		throw "Mutiple PDF configuration record not found for selected T&C Type, only one may be defined";// error
	}
	var bfoFileId = searchResults[0].getValue('custrecord_splunk_pdf_template');
	
	var tcType = searchResults[0].getValue('custrecord_splunk_tc_type');
	
	
    var tcRec = nlapiLoadRecord('customrecord_splunk_tandc_type', tcType);

	var repName = '';
	var repEmail = '';
	var repPhone = '';

	if (order.getFieldValue('salesrep') != null && order.getFieldValue('salesrep') != '') {
		var repRec = nlapiLoadRecord('employee', order.getFieldValue('salesrep'));
		repName = repRec.getFieldValue('firstname');
		if (repName != null) {
			repName = '' + repName + ' ';
		}
		else {
			repName = '';
		}
		var repLastName = repRec.getFieldValue('lastname');
		if (repLastName != null) {
			repName = '' + repName + repLastName;
		}

		repEmail = repRec.getFieldValue('email');
		if (repEmail == null) {
			repEmail = '';
		}
		repPhone = repRec.getFieldValue('phone');
		if (repPhone == null) {
			repPhone = '';
		}
	}

	var lines = [];
	/* Splunk - pliu 09/01/2010 Bundle variables Start */
	var bundle = {};
	var amount = 0;
	var licensedesc = '';
	/* Splunk - pliu 09/01/2010 Bundle variables End */
	
	/* Celigo - csnelson 04/04/2013 Bundle variable start */
	var isCeligoBundle = false;
	var pdfLineNum = 0;
	var pdfItems = [];
	/* Celigo - csnelson 04/04/2013 Bundle variable end */
	var lineIdx = 1;
	/* Splunk - adeshpande 10/15/2013 isNodeLicense? */
	var containsNodesLicense = false;
	var containsVolLicense = false;
    /*Splunk - jbalaji 09/16/2014 isMintLicense */
    var containsMintSKU = false;
	var baseItem ='';
	var basedesc = '';
	var basememo = '';
	var basequantity ='';
	var totalrates =0.00;
	var totalamounts =0.00;
	var number =0;
	var baseamount=0;
	var baseItem = new Array();
	var flag =false;
	var baseItemId ='';
	var basedesc  ='';
	var basememos  ='';
	   
	for (var linecount =1 ;linecount <= order.getLineItemCount('item'); linecount++)   // If  Only Normal item on invoice record and push the baseitem if there.
	{
			var normalItem = {};
			var item = order.getLineItemValue('item', 'custcol_ava_item', linecount);
			var itemid = order.getLineItemValue('item', 'item', linecount); 
			var baseproduct = order.getLineItemValue('item', 'custcol_spk_baseproduct', linecount); 
			var amount  = excapeXML(order.getLineItemValue('item', 'amount', linecount));
			var desc = excapeXML(order.getLineItemValue('item', 'description', linecount));
			var memos = excapeXML(order.getLineItemValue('item', 'custcol_memo', linecount));
			var quantity = order.getLineItemValue('item', 'quantity', linecount);
			var rate = excapeXML(order.getLineItemValue('item', 'rate', linecount));
			var amount  = excapeXML(order.getLineItemValue('item', 'amount', linecount));

			if(amount =='0.00')
			{
			    baseItem.push(itemid);
			}
			else if((!baseproduct || baseproduct=='null') && amount !='0.00' && !baseItem[0])
			{
				normalItem.sku = item;
				normalItem.desc = desc;
				normalItem.memo =memos;
				normalItem.qty = quantity;
				normalItem.rate = rate;
				normalItem.amount = amount;
			}
			lines[number] = normalItem;
			number++;	
 
	}
	   
	for (var j=0;j<baseItem.length;j++)    // based on based item we search the child item (bundle items)
	{
	     var baseId =baseItem[j];
		 if(baseId)
		{
			for (lineIdx = 1; lineIdx <=order.getLineItemCount('item'); lineIdx++) 
			{
					var line = {};
					var test={};
					var quantity = order.getLineItemValue('item', 'quantity', lineIdx);
					var item = order.getLineItemValue('item', 'custcol_ava_item', lineIdx);
					var itemid = order.getLineItemValue('item', 'item', lineIdx); 
					var baseproduct = order.getLineItemValue('item', 'custcol_spk_baseproduct', lineIdx); 
					var desc = excapeXML(order.getLineItemValue('item', 'description', lineIdx));
					var memos = excapeXML(order.getLineItemValue('item', 'custcol_memo', lineIdx))
					var rate = excapeXML(order.getLineItemValue('item', 'rate', lineIdx));
					var amount  = excapeXML(order.getLineItemValue('item', 'amount', lineIdx));
					var startdate = excapeXML(order.getLineItemValue('item', 'custcol_license_start_date', lineIdx));
					var enddate = excapeXML(order.getLineItemValue('item', 'custcol_license_end_date', lineIdx));
					if(order.getLineItemValue('item', 'custcol_peak_daily_vol_gb', lineIdx))
					var gb = CommaFormatted(excapeXML(order.getLineItemValue('item', 'custcol_peak_daily_vol_gb', lineIdx)));	
					var retdays = excapeXML(order.getLineItemValue('item', 'custcol_retention_days', lineIdx));
					if(baseId == baseproduct)
					{
						 totalrates = parseFloat(totalrates) + parseFloat(rate);
						 totalamounts = parseFloat(totalamounts) + parseFloat(amount);
					}
					else if(amount =='0.00')
					{
						baseItemId = item;
						basedesc= desc;
						basememos =memos;
					}
					else ((!baseproduct || baseproduct=='null') && amount !='0.00')
					{
						test.sku = item;
						test.desc = desc;
						test.memo =memos;
						test.qty = quantity;
						test.rate = rate;
						test.amount = amount;
							   
					  
					}
				 if(lineIdx == order.getLineItemCount('item') )	  // push the data into array 
				 {
					line.sku = baseItemId;
					line.desc = basedesc;
					line.memo = basememos;
					line.qty = 1;
					line.rate = totalamounts.toFixed(2);
					line.amount = totalamounts.toFixed(2);
					
				  }
			}
			
		}  
		lines[number] = line;    
		number++;
        lines[number] = test;
        number++;		
		   
	}
	

    var obj = {};
    obj.lines = lines;
    obj.containsNodesLicense = containsNodesLicense;
    obj.containsVolLicense = containsVolLicense;
    obj.tranId = tranId//excapeXML(order.getFieldValue('tranid'));
	nlapiLogExecution('DEBUG', "TranId:: ",tranId);
    obj.tranDate = excapeXML(order.getFieldValue('trandate'));
    obj.dueDate = excapeXML(order.getFieldValue('duedate'));
    obj.repName = excapeXML(repName);
    obj.repEmail = repEmail;
    obj.repPhone = repPhone;
    obj.type = order.getRecordType();
    if(obj.type == 'invoice') {
        obj.terms = excapeXML(order.getFieldText('terms'));    // terms
        if(obj.terms == null) {
            obj.terms = '';
        }
        obj.poNumber = excapeXML(order.getFieldValue('otherrefnum'));
        if(obj.poNumber == null) {
            obj.poNumber = '';
        }

    }

    obj.message = excapeXML(order.getFieldValue('message'));

    var billAddress = order.getFieldValue('billaddress');
    var billAddressLines = [""];
    if(billAddress != null) {
        billAddressLines = billAddress.split("\n");
    }
    for(var i = 0; i < 7; i++) {
        if(i < billAddressLines.length) {
            obj['billAddr'+(i+1)] = excapeXML(billAddressLines[i]);
        }
    }
    var shipAddress = order.getFieldValue('shipaddress');
    var shipAddressLines = [""];
    if(shipAddress != null) {
        shipAddressLines = shipAddress.split("\n");
    }
    for(var i = 0; i < 7; i++) {
        if(i < shipAddressLines.length) {
            obj['shipAddr'+(i+1)] = excapeXML(shipAddressLines[i]);
        }
    }

    var orderTotal = parseFloat(order.getFieldValue('total'));
    if(!isNaN(orderTotal)) {
		obj.total = CommaFormatted(nlapiFormatCurrency(orderTotal));
    } else {
        obj.total = '';
    }

    var subTotal = parseFloat(order.getFieldValue('subtotal'));
    if(!isNaN(subTotal)) {
        obj.subTotal = CommaFormatted(nlapiFormatCurrency(subTotal));
    } else {
        obj.subTotal = '';
    }

    var taxTotal = parseFloat(order.getFieldValue('taxtotal'));
    if(!isNaN(subTotal)) {
        obj.taxTotal = CommaFormatted(nlapiFormatCurrency(taxTotal));
    } else {
        obj.taxTotal = '';
    }

    var discountTotal = parseFloat(order.getFieldValue('discounttotal'));
    if(!isNaN(discountTotal)) {
            obj.discountTotal = nlapiFormatCurrency(discountTotal);
    } else {
        obj.discountTotal = '';
    }

    var handlingCost = parseFloat(order.getFieldValue('althandlingcost'));
    if(!isNaN(discountTotal)) {
            obj.handlingCost = nlapiFormatCurrency(handlingCost);
    } else {
        obj.handlingCost = '';
    }
    var shippingCost = parseFloat(order.getFieldValue('altshippingcost'));
    if(!isNaN(discountTotal)) {
            obj.shippingCost = nlapiFormatCurrency(shippingCost);
    } else {
        obj.shippingCost = '';
    }

    if(obj.type == 'invoice') {
        obj.licAggreement = '';
    } else {
        obj.licAggreement = formatTandC(tcRec.getFieldValue('custrecord_celigo_tc_desc'));
    }
    
    
    if (tcType == '5') {
    	obj.licAggreement = obj.licAggreement.split("&lt;columnbreak /&gt;");
    	if (obj.licAggreement.length > 2) {
    		
    	obj.licAggreement[0] = obj.licAggreement[0] + "</p>";
    	obj.licAggreement[1] = "<p>" + obj.licAggreement[1] + "</p>";
    	obj.licAggreement[2] = "<p>" + obj.licAggreement[2];
    	
    	obj.columnFormat = true;
    	}
    }
    
    var data = {};
    data.order = obj;

    var file = nlapiLoadFile(bfoFileId);   // Load the Xml file 
    var template = file.getValue();
    var xmlResult = template.process(data);  // process the data using library file

    return nlapiXMLToPDF( xmlResult );
}



function zeroPad(d,n) {
    var s = '' + n;
    while(s.length < d) {
        s = '0' + d;
    }
    if(n < 10) {
        return '0' + n;
    }
    return '' + n;
}

function makeDateIdBase() {
    var today = new Date();

    var y = today.getFullYear() - 2000;
	var m = today.getMonth() + 1;
	var d = today.getDate();
	var h = today.getHours();

    return '' + zeroPad(2,y) + zeroPad(2,m) + zeroPad(2,d) + zeroPad(2,h);
}


/*
    public APIs

    This is call by SF integration piece

/*
    called as lib function
 */

function printWithTC(txType, txId) {
    var order = nlapiLoadRecord(txType,txId);
    return genPdf(order);
}

function CommaFormatted(amount)
{
	var delimiter = ","; // replace comma if desired
	var a = amount.split('.',2);
	var d = a[1];
	var i = parseInt(a[0]);
	if(isNaN(i)) { return ''; }
	var minus = '';
	if(i < 0) { minus = '-'; }
	i = Math.abs(i);
	var n = new String(i);
	var a = [];
	while(n.length > 3)
	{
		var nn = n.substr(n.length-3);
		a.unshift(nn);
		n = n.substr(0,n.length-3);
	}
	if(n.length > 0) { a.unshift(n); }
	n = a.join(delimiter);
	if(d.length < 1) { amount = n; }
	else { amount = n + '.' + d; }
	amount = minus + amount;
	return amount;
}
// end of function CommaFormatted()


function cashsaleJson(type) {
    try {
	
	/*Checking the execution type. The script should run on 'Create' and 'Edit' only*/
    if (type != 'delete' && (type == 'create' || type == 'edit')) {
	
	/*---Start----Getting SFDC Customer ID through look up----Start-----*/
    var nscustomer = nlapiGetFieldValue('entity');
	if(nscustomer != null && nscustomer != null)
    {
    var sfdccustomer = nlapiLookupField('customer',nscustomer,'custentity_celigo_ns_sfdc_sync_id');
    }
	/*---END----Getting SFDC Customer ID through look up----END-----*/
	
	/*----Start------------Creating JSON Object to be sent to Cloudhub------------Start-----*/
	
	        var string1 = '{';

			var r = nlapiLoadRecord('cashsale',nlapiGetRecordId());
			
	/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
			if(r.getFieldValue('custbody_spk_cloudhuberror') == 'T')
			{
			var field = new Array();
	        var value = new Array();
	        field[0] = 'custbody_spk_cloudhuberror';
			field[1] = 'custbody_spk_cloudhuberrortxt';
	        value[0] = 'F';
            value[1] = '';
			nlapiSubmitField('cashsale',nlapiGetRecordId(),field,value);
			}
	/*----End-------------------Clearing the sync Error fields-----------------End------*/

	        var currency = r.getFieldText('currency');
            if ((currency == null) || (currency == '')) {
                currency = '""';
            }
            else {
                currency = '"' + currency + '"';
                string1 = string1 + '"currencyName" : ' + currency;

            }
            
			
			var discountTotal = r.getFieldValue('discounttotal');
            if ((discountTotal == null) || (discountTotal == '')) 
			{
                discountTotal = '0.00';
            }
            else 
			{
                discountTotal =discountTotal;
            }
			string1 = string1 + ',"discountTotal" : ' + discountTotal;
            			
			
			var customer = sfdccustomer;
            if ((customer == null) || (customer == '')) 
			{
                customer = '""';
            }
            else 
			{
                customer = '"' + customer + '"';
            }
			string1 = string1 + ',"entity" : ' + customer;
            
			
			var memo = r.getFieldValue('memo');
            if ((memo == null) || (memo == '')) 
			{
                memo = '""';
            }
            else 
			{
               //Added by Rahul Shaw to escape special characters.DFCT0050651
				memo = escapeXMLChar(memo);
                memo = '"' + memo + '"';
            }
			string1 = string1 + ',"memo" : ' + memo;
			
			
			var internalid = r.getFieldValue('id');
            if ((internalid == null) || (internalid == '')) {
                internalid = '""';
            }
            else 
			{
                internalid = '"' + internalid + '"';
                string1 = string1 + ',"internalId" : ' + internalid;
			}
            
			
			var shippingCost = r.getFieldValue('shippingcost');
            if ((shippingCost == null) || (shippingCost == '')) 
			{
                shippingCost = '0.00';
            }
            else 
			{
                shippingCost = '"' + shippingCost + '"';
            }
			string1 = string1 + ',"shippingCost" : ' + shippingCost;
            
			
			var status = r.getFieldValue('status');
            if ((status == null) || (status == '')) 
			{
				status = '""';
            }
            else 
			{
				status = '"' + status + '"';
            }
			string1 = string1 + ',"status" : ' + status;
           

	        var subTotal = r.getFieldValue('subtotal');
            if ((subTotal == null) || (subTotal == '')) 
			{
				subTotal = '""';
            }
            string1 = string1 + ',"subTotal" : ' + subTotal;
            
			
			var taxTotal = r.getFieldValue('taxtotal');
            if ((taxTotal == null) || (taxTotal == '')) {
                taxTotal = '0.00';
            }
            string1 = string1 + ',"taxTotal" : ' + taxTotal;
            

            var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
            if ((sfdcSyncId == null) || (sfdcSyncId == '')) {
                sfdcSyncId = '" "';
            }
            else {
                sfdcSyncId = '"' + sfdcSyncId + '"';                
            }
			string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
            
			
			var total = r.getFieldValue('total');
            if ((total == null) || (total == '')) {
                total = '""';
            }
            string1 = string1 + ',"total" : ' + total;
            
			
			var tranDate = r.getFieldValue('trandate');
            if ((tranDate == null) || (tranDate == '')) {
                tranDate = '""';
            }
            else {
                tranDate = '"' + tranDate + '"';              
            }
			string1 = string1 + ',"transactionDate" : ' + tranDate;
            
           
			var tranId = r.getFieldValue('tranid');
            if ((tranId == null) || (tranId == '')) {
                tranId = '""';
            }
            else {
                tranId = '"' + tranId + '"';
            }
			string1 = string1 + ',"transactionId" : ' + tranId;
            
		
			var type = r.getRecordType();
            if ((type == null) || (type == '')) {
                type = '""';
            }
            string1 = string1 + ',"type" : "Cash Sale"';
            string1 = string1 + '}';
		    nlapiLogExecution('DEBUG', 'Cashsale-Json Data::', string1);
  
            /*----END------------Creating JSON Object to be sent to Cloudhub------------END-----*/
			
			//Getting Cloudhub URL from script parameter to which JSON object to be posted	 
			var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
			//Getting Authorization header from script parameter which is used when requesting URL for Authentication
			var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
			nlapiLogExecution('DEBUG', 'authorizationHeader', authorizationHeader);
			var header = new Array();
			header['Authorization'] = authorizationHeader;
			header['Accept'] = 'application/json';
			header['Content-Type'] = 'application/json';
			var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
                        			
            /*------Start-----Checking if the request is processed successfully----------Start-------*/			
                        if(parseInt(y.getCode()) == 200)
                                   {
								   //Capturing SFDC object id for the record created successfully in NetSuite custom field
                                   nlapiSubmitField('cashsale',nlapiGetRecordId(),'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
								   }
								   
        								   
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/
						if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
							{
                              var fields = new Array();
	                          var values = new Array();
	                          fields[0] = 'custbody_spk_cloudhuberror';
	                          fields[1] = 'custbody_spk_cloudhuberrortxt';
	                          values[0] = 'T';
                              values[1] = y.getBody().toString();
	                          nlapiSubmitField('cashsale',nlapiGetRecordId(),fields,values);	//Capturing error message in a custom field
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

function escapeXMLChar(s) {
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}
function callSCH(params,invoiceId)// // calling the scheduled script to generate PDF and sync with SFDC : DFCT0050773.
{
	var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params);  //call the  SCH script for 
	nlapiLogExecution('DEBUG', 'status::', status+':tranId:'+invoiceId);
	if(status == 'INPROGRESS' || status=='INQUEUE') {
		var status2 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_2',params);
		nlapiLogExecution('DEBUG', 'status2::', status2+':tranId:'+invoiceId);
		if(status2 == 'INPROGRESS'|| status2=='INQUEUE') {
			var status3 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_3',params);
			nlapiLogExecution('DEBUG', 'status3::', status3+':tranId:'+invoiceId);
			if(status3 == 'INPROGRESS'|| status3=='INQUEUE') {
				var status4 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_4',params);
				nlapiLogExecution('DEBUG', 'status4::', status4+':tranId:'+invoiceId);
				if(status4 == 'INPROGRESS'|| status4=='INQUEUE') {
					var status5 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_5',params);
					nlapiLogExecution('DEBUG', 'status5::', status5+':tranId:'+invoiceId);
					if(status5 == 'INPROGRESS'|| status5=='INQUEUE') {
						//callSCH(params,invoiceId);
						nlapiSubmitField('cashsale',invoiceId,'custbody_spk_pdf_flag','T');
					}
				}
			}
		}
	}
}