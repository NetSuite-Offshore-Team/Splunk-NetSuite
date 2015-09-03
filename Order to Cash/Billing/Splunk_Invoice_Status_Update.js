/*
* This script file is used to send Invoice JSON data to Cloud hub whenever transaction that changes the status of Invoice are created
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
* @Release Description: Escape special characters while passing the memo field.
* @AUTHOR : Rahul
* @Release Date 21st May 2015
* @Project Name:DFCT0050651
* @Release Number : RLSE0050339
* @Version 1.2
*/
function updateStatus(type)
{
	try {
// Getting Invoice internal Id values and checking if the amount due and the amount paid are equal or not
        // var invoice nocreatedfrom
	   var rectype = nlapiGetRecordType();
	   
	   if (rectype == 'creditmemo')
		{
			var invoiceId = nlapiGetFieldValue('createdfrom');
			
			var string1 = '{';
            string1 = string1;
            var header = new Array();
            header['Accept'] = 'application/json';
            header['Content-Type'] = 'application/json';	
			if(invoiceId)
			{
			 var r = nlapiLoadRecord('invoice',invoiceId);
			}
			else{
			  var r = nlapiLoadRecord(rectype,nlapiGetRecordId());
			  // invoiceId = nlapiGetRecordId();
			}
	    
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
            if ((createdfrom == null) || (createdfrom == '')) {
                createdfrom = '""';
            }
            else {                
				if(createdfrom.search('#')>-1)
				{
				createdfrom = '"' + createdfrom.split('#')[1] + '"';               
				}
            }
			string1 = string1 + '"createdFrom" : ' + createdfrom;
            
	        var currency = r.getFieldValue('currencyname');
            if ((currency == null) || (currency == '')) {
                currency = '""';
            }
            else {
                currency = '"' + currency + '"';               
            }
			string1 = string1 + ',"currencyName" : ' + currency;
            
			
	        var type = r.getFieldValue('type');
            if ((type == null) || (type == '')) {
                type = '""';
            }
            else {
			    if (type == 'custinvc')
					{
					type = "Invoice";
					}
                type = '"' + type + '"';                
            }
			string1 = string1 + ',"type" : ' + type;
            
			
	        var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
            if ((sfdcSyncId == null) || (sfdcSyncId == '')) {
                sfdcSyncId = '" "';
            }
            else {
                sfdcSyncId = '"' + sfdcSyncId + '"';                
            }
			string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
            
			
	        var endDate = r.getFieldValue('enddate');
            if ((endDate == null) || (endDate == '')) {
                endDate = '""';
            }
            else {
                endDate = '"' + endDate + '"';                
            }
			string1 = string1 + ',"endDate" : ' + endDate;
            
			
	        var startDate = r.getFieldValue('startdate');
            if ((startDate == null) || (startDate == '')) {
                startDate = '""';
            }
            else {
                startDate = '"' + startDate + '"';             
            }
			string1 = string1 + ',"startDate" : ' + startDate;
            

            var supportInvoice = r.getFieldValue('custbody_splunk_support_invoice');
            if ((supportInvoice == null) || (supportInvoice == '')) {
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
            if ((terms == null) || (terms == '')) {
                terms = 0;
                string1 = string1 + ',"termInMonths" : ' + terms;
            }
            else {
                string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
            }
            		

	        var discountTotal = r.getFieldValue('discounttotal');
            if ((discountTotal == null) || (discountTotal == '')) {
                discountTotal = '""';
            }
			string1 = string1 + ',"discountTotal" : ' +  parseFloat(discountTotal);
            
			
	        var customer =r.getFieldValue('custbody_sfdc_id');
            if ((customer == null) || (customer == '')) {
                customer = '" "';
            }
            else {
                customer = '"' + customer + '"';                
            }		
			string1 = string1 + ',"entity" : ' + customer;
			
	        var internalId = invoiceId;//r.getFieldValue('internalid');
            if ((internalId == null) || (internalId == '')) {
                internalId = '""';
            }
            else {
                internalId = '"' +internalId+ '"';               
            }
			string1 = string1 + ',"internalId" : ' + internalId;
					
			 
	        var memo = r.getFieldValue('memo');
            if ((memo == null) || (memo == '')) {
                memo = '""';
            }
            else {
				memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.DFCT0050651
                memo = '"' + memo + '"';                
			}
			string1 = string1 + ',"memo" : ' + memo;
				
			
            var shippingCost = r.getFieldValue('shippingcost');
            if ((shippingCost == null) || (shippingCost == '')) {
                shippingCost = '0.00';
            }
            else {
                shippingCost = shippingCost;                
            }
			string1 = string1 + ',"shippingCost" : ' +  shippingCost;
            
			
	        var status = r.getFieldValue('status');
            if ((status == null) || (status == '')) {
                status = '""';
            }
            else {
            status = '"' + status + '"';                    
            }
	        string1 = string1 + ',"status" : ' + status;
            

	        var subTotal = r.getFieldValue('subtotal');
            if ((subTotal == null) || (subTotal == '')) {
                subTotal = '""';
            }
            else {
                subTotal = subTotal;                
            }
			string1 = string1 + ',"subTotal" : ' +  parseFloat(subTotal);
            
						
	        var taxTotal = r.getFieldValue('taxtotal');
            if ((taxTotal == null) || (taxTotal == '')) {
                taxTotal = '""';
            }
            else {
                taxTotal = taxTotal;                
            }
			string1 = string1 + ',"taxTotal" : ' + taxTotal;
            
            
		
	
	        var total = r.getFieldValue('total');
            if ((total == null) || (total == '')) {
                total = '""';
            }
			string1 = string1 + ',"total" : ' +  parseFloat(total);
            
                    
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
            
		
	        var pdfId = r.getFieldValue('custbody_splunk_pdfid'); 
			if (!pdfId || pdfId== ''){ 
					pdfId='""';
			}
			else{
			pdfId= '"'+ pdfId +'"';
			}
			string1 = string1 + ',"pdfId" : ' + pdfId;
		
            var folderId =  nlapiGetContext().getSetting('SCRIPT', 'custscript_splunk_pdf_folderid'); 
			if(folderId == '' ||! folderId ){ 
					folderId =='""';
			}
			else{
				string1 = string1 + ',"folderId" : ' + '"' +folderId + '"';
				}
			   
            string1 = string1 + '}';
            	

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
					if(invoiceId)
					{
					  nlapiSubmitField('invoice',invoiceId,'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
					}
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
						if(invoiceId)
						{
						 nlapiSubmitField('invoice',invoiceId,fields,values);
						}					//Capturing error message in a custom field
                    }
			/*------End-------------If the sent request failed---------------------End-------*/ 
			
		}

		if (rectype == 'customerpayment')
		{
			var Itemcount = nlapiGetLineItemCount('apply');
			for(var m=1; m<=Itemcount; m++)
			{
			var invoiceId = nlapiGetLineItemValue('apply','internalid',m);
			var  amountdue = parseFloat(nlapiGetLineItemValue('apply','due',m));
			var  payment = parseFloat(nlapiGetLineItemValue('apply','amount',m));
			if(amountdue == payment)
			{
			/*----Start------------Creating JSON Object to be sent to Cloudhub------------Start-----*/	        
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
            if ((createdfrom == null) || (createdfrom == '')) {
                createdfrom = '""';
            }
            else {                
				if(createdfrom.search('#')>-1)
				{
				createdfrom = '"' + createdfrom.split('#')[1] + '"';               
				}
            }
			string1 = string1 + '"createdFrom" : ' + createdfrom;
            

	        var currency = r.getFieldValue('currencyname');
            if ((currency == null) || (currency == '')) {
                currency = '""';
            }
            else {
                currency = '"' + currency + '"';               
            }
			string1 = string1 + ',"currencyName" : ' + currency;
            
			
	        var type = r.getFieldValue('type');
            if ((type == null) || (type == '')) {
                type = '""';
            }
            else {
			    if (type == 'custinvc')
					{
					type = "Invoice";
					}
                type = '"' + type + '"';                
            }
			string1 = string1 + ',"type" : ' + type;
            
			
	        var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
            if ((sfdcSyncId == null) || (sfdcSyncId == '')) {
                sfdcSyncId = '" "';
            }
            else {
                sfdcSyncId = '"' + sfdcSyncId + '"';                
            }
			string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
            
			
	        var endDate = r.getFieldValue('enddate');
            if ((endDate == null) || (endDate == '')) {
                endDate = '""';
            }
            else {
                endDate = '"' + endDate + '"';                
            }
			string1 = string1 + ',"endDate" : ' + endDate;
            
			
	        var startDate = r.getFieldValue('startdate');
            if ((startDate == null) || (startDate == '')) {
                startDate = '""';
            }
            else {
                startDate = '"' + startDate + '"';             
            }
			string1 = string1 + ',"startDate" : ' + startDate;
            	

            var supportInvoice = r.getFieldValue('custbody_splunk_support_invoice');
            if ((supportInvoice == null) || (supportInvoice == '')) {
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
            if ((terms == null) || (terms == '')) {
                terms = 0;
                string1 = string1 + ',"termInMonths" : ' + terms;
            }
            else {
                string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
            }
            	

	        var discountTotal = r.getFieldValue('discounttotal');
            if ((discountTotal == null) || (discountTotal == '')) {
                discountTotal = '""';
            }
			string1 = string1 + ',"discountTotal" : ' +  parseFloat(discountTotal);
            
			
	        var customer =r.getFieldValue('custbody_sfdc_id');
            if ((customer == null) || (customer == '')) {
                customer = '" "';
            }
            else {
                customer = '"' + customer + '"';                
            }		
			string1 = string1 + ',"entity" : ' + customer;
			
	        var internalId = invoiceId;//r.getFieldValue('internalid');
            if ((internalId == null) || (internalId == '')) {
                internalId = '""';
            }
            else {
                internalId = '"' +internalId+ '"';               
            }
			string1 = string1 + ',"internalId" : ' + internalId;
					
			 
	        var memo = r.getFieldValue('memo');
            if ((memo == null) || (memo == '')) {
                memo = '""';
            }
            else {
				memo = escapeXML(memo);//Added by Rahul Shaw to escape special characters.DFCT0050651
                memo = '"' + memo + '"';                
			}
			string1 = string1 + ',"memo" : ' + memo;
					
			
            var shippingCost = r.getFieldValue('shippingcost');
            if ((shippingCost == null) || (shippingCost == '')) {
                shippingCost = '0.00';
            }
            else {
                shippingCost = shippingCost;                
            }
			string1 = string1 + ',"shippingCost" : ' +  shippingCost;
            
			
	        var status = r.getFieldValue('status');
            if ((status == null) || (status == '')) {
                status = '""';
            }
            else {
            status = '"' + status + '"';                    
            }
	        string1 = string1 + ',"status" : ' + status;
            

	        var subTotal = r.getFieldValue('subtotal');
            if ((subTotal == null) || (subTotal == '')) {
                subTotal = '""';
            }
            else {
                subTotal = subTotal;                
            }
			string1 = string1 + ',"subTotal" : ' +  parseFloat(subTotal);
            
						
	        var taxTotal = r.getFieldValue('taxtotal');
            if ((taxTotal == null) || (taxTotal == '')) {
                taxTotal = '""';
            }
            else {
                taxTotal = taxTotal;                
            }
			string1 = string1 + ',"taxTotal" : ' + taxTotal;
            
            
			
	        var total = r.getFieldValue('total');
            if ((total == null) || (total == '')) {
                total = '""';
            }
			string1 = string1 + ',"total" : ' +  parseFloat(total);
            
                    
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
            
		
	        var pdfId = r.getFieldValue('custbody_splunk_pdfid'); 
			if (!pdfId || pdfId== ''){ 
					pdfId='""';
			}
			else{
			pdfId= '"'+ pdfId +'"';
			}
			string1 = string1 + ',"pdfId" : ' + pdfId;
		
            var folderId =  nlapiGetContext().getSetting('SCRIPT', 'custscript_splunk_pdf_folderid'); 
			if(folderId == '' ||! folderId ){ 
					folderId =='""';
			}
			else{
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
                 	nlapiSubmitField('invoice',invoiceId,fields,values);	//Capturing error message in a custom field
                    }
			/*------End-------------If the sent request failed---------------------End-------*/ 
			}
			}
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
function escapeXML(s) {//Escape special characters while passing the memo field.DFCT0050651
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}