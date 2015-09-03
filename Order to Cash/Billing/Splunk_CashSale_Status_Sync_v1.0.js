/*
* This script has been created to sync the cash sale data to SFDC on Cash sale status
* change from "Not Deposited" to "Deposited"
* @ AUTHOR : Maria Auxilia
* @Release Date: 7th June 2015
* @Release Number: RLSE0050382 
* @Project Number: PRJ0050945 
* @version 1.0
*/

function onAfterSubmitDeposit(type) {

    try {
			var dep = nlapiGetNewRecord();
			var depId = dep.getId();
			nlapiLogExecution( 'DEBUG', 'type', type);
			nlapiLogExecution('DEBUG','recordtype',dep.getRecordType());
			var rec = nlapiLoadRecord('deposit',depId);
		    var lineNum = rec.getLineItemCount('payment');
			for (var i = 1 ;i <= lineNum; i++)   
				{
					if ((rec.getLineItemValue('payment','deposit',i) == 'T') && (rec.getLineItemValue('payment','type',i) == 'CashSale'))
					{
						var csnum = rec.getLineItemValue('payment','docnumber',i);
						var csid = rec.getLineItemValue('payment','id',i);
						cashsaleSync(csid);
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
				memo = escapeXML(memo);
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
			nlapiLogExecution( 'DEBUG', 'Status', status);
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
            
			
			var subscriptionId = r.getFieldValue('custbody_spk_sfdc_subscription_id'); 
			var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
			nlapiLogExecution( 'ERROR', 'subscriptionId', subscriptionId);
			//If subscription id is not present then only we have to send the order id-Rainmakr
			if((subscriptionId == null) || (subscriptionId == ''))
			{
				nlapiLogExecution( 'ERROR', 'subscriptionId is null', 'subscriptionId is null');
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
			//End of including the subscription Id in the JSON to be sent to SFDC as part of Rainmakr 
			
			
			nlapiLogExecution( 'ERROR', 'sfdcSyncId', sfdcSyncId);
			nlapiLogExecution( 'ERROR', 'subscriptionId', subscriptionId);
			
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
			
			//Getting Cloudhub URL from script parameter to which JSON object to be posted
		
				var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
				nlapiLogExecution('DEBUG', 'Referred URL', url);
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


function escapeXML(s) {
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}