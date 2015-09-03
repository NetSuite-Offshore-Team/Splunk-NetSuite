/*
* This script file is used to create/update Account Record in SFDC through cloudhub
* @ AUTHOR : Vaibhav
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Name: Hangman
* @Project Number PRJ0050865
* @version  1.0
*/
/*
* To fix the try/catch exception handling in the script for setting Cloudhub Errors on Submit Field for respective Record Type and record ID 
* @ AUTHOR : Unitha
* @Release Date: 13th Mar 2015
* @Release Number RLSE0050322
* @Project Number DFCT0050552
* @version 1.1
*/
function SyncCustomer(type){
	try {
		//New Change File git1
        var pr1 = r.getFieldValue('total');
        //New Change File End git1
        //New Comment
//Changes to Git through Eclipse
// Changes on Git direct
        //ANother Change Eclipse test ST 2
        //Vab Change GitHub
//New Change New Day
        //Vab Change Eclipse
        /*------New Change 8/19-------*/
        
       var test = 1234
       
       /*------End New Change 8/19------*/
       
//pr1 change
        //Vab Change

        //Pr Change

        
        //New Change File git2
        var pr2 = r.getFieldValue('total');
        //New Change File End git2
 
    /*Checking the execution type. The script should run on 'Create' and 'Edit' only*/
	if (type == 'edit')
	{
	var oldrec = nlapiGetOldRecord();
	var newrec = nlapiGetNewRecord();
	var oldcreditlimit = oldrec.getFieldValue('creditlimit');
	
	//New Change File git
            var Pr = r.getFieldValue('total');
        //New Change File End git
	
	if (oldcreditlimit == null || oldcreditlimit == '')
	{
	oldcreditlimit = 0;
	}
	
	var newcreditlimit = newrec.getFieldValue('creditlimit');
	if (newcreditlimit == null || newcreditlimit == '')
	{
	newcreditlimit = 0;
	}
	
	var oldcredithold = oldrec.getFieldValue('creditholdoverride');
	var newcredithold = newrec.getFieldValue('creditholdoverride');
    var oldcollectionnotes = oldrec.getFieldValue('custentity_collection_notes');
	if (oldcollectionnotes == null || oldcollectionnotes == '')
		{
		oldcollectionnotes = '';
		}
    
    var newcollectionnotes = newrec.getFieldValue('custentity_collection_notes');
	if (newcollectionnotes == null || newcollectionnotes == '')
		{
		newcollectionnotes = '';
		}
    
	}
	
	/*---Git Test-----*/
	var x = 1234;
	/*-----Git Test End------*/
	
    if ((type != 'delete') && ((type == 'create') || ((type == 'edit' || type == 'xedit') && (oldcreditlimit != newcreditlimit)) || ((type == 'edit' || type == 'xedit') && (oldcredithold != newcredithold)) || ((type == 'edit' || type == 'xedit') && (oldcollectionnotes != newcollectionnotes)))){
			
	 /*----Start------------Creating JSON Object to be sent to Cloudhub------------Start-----*/
	 
            var string1 = '{';
            var header = new Array();
            header['Accept'] = 'application/json';
            header['Content-Type'] = 'application/json'; 
            var r = nlapiLoadRecord('customer',nlapiGetRecordId());    
			var netSuiteinternalId = r.getFieldValue('id');
			
	/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
			if(r.getFieldValue('custentity_spk_cloudhub_sync_error_cb') == 'T')
			{
			nlapiLogExecution('DEBUG','CloudhubError','In');
			var field = new Array();
	        var value = new Array();
	        field[0] = 'custentity_spk_cloudhub_sync_error_cb';
			field[1] = 'custentity_spk_cloudhub_sync_error';
	        value[0] = 'F';
            value[1] = '';
			nlapiSubmitField('customer',netSuiteinternalId,field,value);
			}
	/*----End-------------------Clearing the sync Error fields-----------------End------*/
						
            var customer = r.getFieldValue('entityid');
            if ((customer == null) || (customer == '')) { 
                customer = '""'; 
            } 
            else {
                customer = '"' + customer + '"';
                
            }
            
            // Test Gits
            string1 = string1 + '"accountNumber" : ' + customer;
            
 
            var creditHold = r.getFieldValue('creditholdoverride');
            if ((creditHold == null) || (creditHold == '')) {
                creditHold = '""';
            }
            else {
                creditHold = '"' + creditHold + '"'; 
            }
            string1 = string1 + ',"creditHold" : ' + creditHold;
            
                                              
            var creditLimit = r.getFieldValue('creditlimit');
            if ((creditLimit == null) || (creditLimit == '')) { 
                creditLimit = '0.00'; 
            } 
			string1 = string1 + ',"creditLimit" : ' +creditLimit;
                                              
            
			var balanceAmount = r.getFieldValue('balance'); 
            if ((balanceAmount == null) || (balanceAmount == '')) { 
                balanceAmount = '""';
            } 
            string1 = string1 + ',"balanceAmount" : ' + balanceAmount;
            
			
			var collectionNotes = r.getFieldValue('custentity_collection_notes'); 
            if ((collectionNotes == null) || (collectionNotes == '')) { 
                collectionNotes = '""';
            } 
			 else {
                collectionNotes = '"' + collectionNotes + '"'; 
            }
            string1 = string1 + ',"collectionNotes" : ' + collectionNotes;
            
			
			var daysOverdue = r.getFieldValue('daysoverdue'); 
            if ((daysOverdue == null) || (daysOverdue == '')) { 
                daysOverdue = 0.00;
            string1 = string1 + ',"daysOverdue" : 0';
            } 
            else
			{
            string1 = string1 + ',"daysOverdue" : ' + daysOverdue;
            }
            
			
			var accountOverdueBalance = r.getFieldValue('overduebalance'); 
            if ((accountOverdueBalance == null) || (accountOverdueBalance == '')) { 
                accountOverdueBalance = '""';
            } 
            string1 = string1 + ',"accountOverdueBalance" : ' + accountOverdueBalance;
            
			
			var unbilledOrders = r.getFieldValue('unbilledorders'); 
            if ((unbilledOrders == null) || (unbilledOrders == '')) { 
                unbilledOrders = '""';
            } 
            string1 = string1 + ',"unbilledOrders" : ' + unbilledOrders;
            
			
			string1 = string1 + ',"crossReferences" : {'
			
			var crmId = r.getFieldValue('custentity_celigo_ns_sfdc_sync_id'); 
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
			
		nlapiLogExecution('DEBUG', 'Customer-Json Data::', string1);	
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
            
            /*------Start-----Checking if the request is processed successfully----------Start-------*/
            if(parseInt(y.getCode()) == 200)
			{
                nlapiSubmitField('customer',netSuiteinternalId,'custentity_spk_rev_customer_sync_success','T');
            }								   
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/						   
								   
          	if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
                {
                nlapiLogExecution('DEBUG','In',y.getCode());        
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
                fields[0] = 'custentity_spk_cloudhub_sync_error_cb';
                fields[1] = 'custentity_spk_cloudhub_sync_error';
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
                fields[0] = 'custentity_spk_cloudhub_sync_error_cb';
                fields[1] = 'custentity_spk_cloudhub_sync_error';
                values[0] = 'T';
                values[1] = e.toString();                                                              
                //DFCT0050552: To fix the try/catch exception handling for nlapiGetRecordType(),nlapiGetRecordId()
				nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
							
			}  
		}
}	
