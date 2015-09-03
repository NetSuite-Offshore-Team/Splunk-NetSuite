/**
 * Making inactive "Accounts" and "Update Accounts" records on Inactivating Standard Chart of Accounts.
 * @author Dinanath Bablu
 * @Release Date 30th Dec 2013
 * @Release Number RLSE0050094
 * @version 1.0
 */

function inactivateCOA(type) // After Submit function
{
	/***** When making the standard account inactive, it will make the correcponding "Accounts" and "Update Accounts" Record *****/
	if(type == 'edit' && nlapiGetContext().getExecutionContext() == 'userinterface')
	{
nlapiLogExecution('DEBUG','in',type);
		var name = nlapiGetFieldValue('acctname');
		var isInactive = nlapiGetFieldValue('isinactive');
		
		/****** Searching and making the "Update Accounts" records inactive*******/
		var filter = new Array();
		filter[0] = nlobjSearchFilter('custrecord_accntname',null,'is',name);
		var records = nlapiSearchRecord('customrecord_accounts',null,filter);
        
        if (records != null) 
		{
            for (var i = 0; i < records.length; i++) 
			{
                nlapiSubmitField(records[i].getRecordType(), records[i].getId(),['isinactive','custrecord_isinactive'],[isInactive,isInactive]);
            }
        }
		
		/****** Searching and making the "Accounts" records inactive*******/
		var filters = new Array();
		filters[0] = nlobjSearchFilter('custrecord_name',null,'is',name);
		var results = nlapiSearchRecord('customrecord_coa',null,filters);
        
        if (results != null) 
		{
            for (var i = 0; i < results.length; i++) 
			{
                nlapiSubmitField(results[i].getRecordType(), results[i].getId(),['isinactive','custrecord_isinactive_account'],[isInactive,isInactive]);
            }
        }			 
	}	
	
}
