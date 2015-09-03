/*
* This script file is used to send Updated Customer JSON once the transaction affecting the balance field are update
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
function customerbalancevaluesync(type){
	try {
	
	var rectype = nlapiGetRecordType();
	var recid = nlapiGetRecordId();
	
	if ((rectype == 'invoice') || (rectype == 'creditmemo') || (rectype == 'cashsale') || (rectype == 'cashrefund') || (rectype == 'salesorder'))
	{
	var customer = nlapiGetFieldValue('entity');
	}
	if (rectype == 'customerpayment' || rectype == 'customerrefund' || rectype == 'customerdeposit')
	{
	var customer = nlapiGetFieldValue('customer');
	}
		
	if(type == 'edit')
	{
	var oldrec = nlapiGetOldRecord();
	var newrec = nlapiGetNewRecord();
	var oldtotal = oldrec.getFieldValue('total');
	var newtotal = newrec.getFieldValue('total');
	}
	if ((type == 'create') || ((type == 'edit') && (oldtotal != newtotal)))
		{		
		/*----START------------Creating JSON Object to be sent to Cloudhub------------START-----*/
		var string1 = '{';
        var header = new Array();
        header['Accept'] = 'application/json';
        header['Content-Type'] = 'application/json';	

		var customerrec = nlapiLoadRecord('customer',customer);
		var netSuiteinternalId = customerrec.getFieldValue('id');
		
		var customerid = customerrec.getFieldValue('entityid');
		if ((customerid == null) || (customerid == '')) { 
                entity = '""'; 
            } 
            else {
                entity = '"' + customerid + '"';
                
            }
        string1 = string1 + '"accountNumber" : ' + entity;
        
			
	/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
	    if(customerrec.getFieldValue('custentity_spk_cloudhub_sync_error_cb') == 'T')
			{
			var field = new Array();
	        var value = new Array();
	        field[0] = 'custentity_spk_cloudhub_sync_error_cb';
			field[1] = 'custentity_spk_cloudhub_sync_error';
	        value[0] = 'F';
            value[1] = '';
			nlapiSubmitField('customer',netSuiteinternalId,field,value);
			}
	/*----End-------------------Clearing the sync Error fields-----------------End------*/
		
		var creditLimit = customerrec.getFieldValue('creditlimit');
		if ((creditLimit == null) || (creditLimit == '')) { 
                creditLimit = '0.00'; 
            } 
        string1 = string1 + ',"creditLimit" : ' + creditLimit;
        	
		
		var creditHold = customerrec.getFieldValue('creditholdoverride');
		if ((creditHold == null) || (creditHold == '')) {
            creditHold = '""';
        }
        else {
            creditHold = '"' + creditHold + '"'; 
        }
        string1 = string1 + ',"creditHold" : ' + creditHold;
        
		
		var balanceAmount = customerrec.getFieldValue('balance');
		if ((balanceAmount == null) || (balanceAmount == '')) { 
             balanceAmount = '""';
        } 
        string1 = string1 + ',"balanceAmount" : ' + balanceAmount;
        
		
		var collectionNotes = customerrec.getFieldValue('custentity_collection_notes'); 
        if ((collectionNotes == null) || (collectionNotes == '')) { 
        collectionNotes = '""';
        } 
		else {
        collectionNotes = '"' + collectionNotes + '"';          
        }
        string1 = string1 + ',"collectionNotes" : ' + collectionNotes;
        
			
		var daysOverdue = customerrec.getFieldValue('daysoverdue'); 
        if ((daysOverdue == null) || (daysOverdue == '')) { 
        daysOverdue = '0.00';
        } 
        string1 = string1 + ',"daysOverdue" : ' + daysOverdue;
        
			
		var accountOverdueBalance = customerrec.getFieldValue('overduebalance'); 
        if ((accountOverdueBalance == null) || (accountOverdueBalance == '')) { 
		accountOverdueBalance = '""';
        } 
        string1 = string1 + ',"accountOverdueBalance" : ' + accountOverdueBalance;
        
			
		var unbilledOrders = customerrec.getFieldValue('unbilledorders'); 
        if ((unbilledOrders == null) || (unbilledOrders == '')) { 
        unbilledOrders = '""';
        } 
        string1 = string1 + ',"unbilledOrders" : ' + unbilledOrders;
        
			
	    string1 = string1 + ',"crossReferences" : {'		
		var crmId = customerrec.getFieldValue('custentity_celigo_ns_sfdc_sync_id');
		if ((crmId == null) || (crmId == '')) { 
            crmId = '""';
        } 
        else { 
            crmId = '"' + crmId + '"';               
        }
        string1 = string1 + '"crmId" : ' + crmId;
        
		
		if ((netSuiteinternalId == null) || (netSuiteinternalId == '')) {
            netSuiteId = '""';
        } 
        else { 
            netSuiteId = '"' + netSuiteinternalId + '"';               
        }
        string1 = string1 + ',"netSuiteId" : ' + netSuiteId;
        string1 = string1 + '}' + '}';
			
	    nlapiLogExecution('DEBUG','JSON Object',string1);
		
		/*----END------------Creating JSON Object to be sent to Cloudhub------------END-----*/
			
			//Getting Cloudhub URL from script parameter to which JSON object to be posted
            // url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
			var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_customer_cloudhub_sync');
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
              nlapiSubmitField('customer',netSuiteinternalId,'custentity_spk_rev_customer_sync_success','T');
            }	
								   
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/						   
								   
          	if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
            {
                var fields = new Array();
	            var values = new Array();
	            var fields = new Array();
	            var values = new Array();
	            fields[0] = 'custentity_spk_cloudhub_sync_error_cb';
	            fields[1] = 'custentity_spk_cloudhub_sync_error';
				fields[2] = 'custentity_spk_rev_customer_sync_success';
	            values[0] = 'T';
                values[1] = y.getBody().toString();
				values[2] = 'T';
	            nlapiSubmitField('customer',netSuiteinternalId,fields,values);	//Capturing error message in a custom field
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