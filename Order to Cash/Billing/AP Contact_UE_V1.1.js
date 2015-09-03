/**
 * This script file is used for setting the value of "AP contact" , "Emailed to Ap Contact" and "Special Electronic Invoice" Checkbox in the invoice Record after submit.
 * @author Anchana SV
 * @Release Date:12th June 2015
 * @Defect No- DFCT0050713
 * @Release Number -RLSE0050377
 * @version 1.0
 */

/**
 * This script file is used for setting the value of "AP EMAIL" ,"TO BE E-MAILED TO AP CONTACT" Checkbox in the Credit Memo Record after submit.
 * @author Jitendra
 * @Release Date:
 * @Project ENHC0050609
 * @Release Number:
 * @version 1.1
 */

//On Submitting the record the "AP email","Emailed to AP Contact" and " Special/Electronic Invoice" field will be set.
function userEventAfter(type){
	var email = '';
	try{
		nlapiLogExecution('ERROR','record type',nlapiGetRecordType());
		
		if(nlapiGetRecordType() == 'invoice')
		{
			if((nlapiGetFieldValue('createdfrom') != null)&&(nlapiGetFieldValue('createdfrom') != ''))
			{
				nlapiLogExecution('ERROR','createdfrom',nlapiGetFieldValue('createdfrom'));
				var filters = new Array();
				var columns = new Array();
				filters[0] = new nlobjSearchFilter('role',null,'is',3);
				filters[1] = new nlobjSearchFilter('company',null,'is',nlapiGetFieldValue('entity'));
				columns[0] = new nlobjSearchColumn('email');
				var result = nlapiSearchRecord('contact',null,filters,columns);
				if(result != null)
				{
					nlapiLogExecution('ERROR','result',result);
					if(result.length > 0)	
					{
						if (email == '')
						{
							email = result[0].getValue('email');
							nlapiLogExecution('ERROR','email',email);
							nlapiSubmitField('invoice', nlapiGetRecordId(), 'custbody2', email, 'T');//setting AP email
							nlapiSubmitField('invoice', nlapiGetRecordId(), 'custbody1', 'T', 'T');//Setting Emailed to AP contact checkbox
						}
					}
				}
			}
			var customer = nlapiGetFieldValue('entity');
			nlapiLogExecution('ERROR','customerID',customer);
			if(customer){
				var specialinvoice=nlapiLookupField('customer', customer ,'custentity_specialinvoice_customer');
				nlapiLogExecution('ERROR','specialinvoice',specialinvoice);
				if(specialinvoice)
				{
					nlapiSubmitField('invoice', nlapiGetRecordId(), 'custbody_special_invoice', specialinvoice, 'T');//Setting the Special/Electronic Invoice Checkbox
				}
				else
				{
					nlapiSubmitField('invoice', nlapiGetRecordId(), 'custbody_special_invoice', specialinvoice, 'F');
				}
			}
		}
		
		/*Start: ENHC0050609: Setting "AP EMAIL" ,"TO BE E-MAILED TO AP CONTACT" field value on Credit Memo: Jitendra 19th Aug 2015*/
		if(nlapiGetRecordType() == 'creditmemo')
		{
			if((nlapiGetFieldValue('createdfrom') != null)&&(nlapiGetFieldValue('createdfrom') != ''))
			{
				nlapiLogExecution('ERROR','createdfrom',nlapiGetFieldValue('createdfrom'));
				var filters = new Array();
				var columns = new Array();
				filters[0] = new nlobjSearchFilter('role',null,'is',3);
				filters[1] = new nlobjSearchFilter('company',null,'is',nlapiGetFieldValue('entity'));
				columns[0] = new nlobjSearchColumn('email');
				var result = nlapiSearchRecord('contact',null,filters,columns);
				if(result != null)
				{
					nlapiLogExecution('ERROR','result',result);
					if(result.length > 0)	
					{
						if (email == '')
						{
							email = result[0].getValue('email');
							nlapiLogExecution('ERROR','email',email);
							nlapiSubmitField('creditmemo', nlapiGetRecordId(), 'custbody2', email, 'T');//setting AP email
							nlapiSubmitField('creditmemo', nlapiGetRecordId(), 'custbody1', 'T', 'T');//Setting Emailed to AP contact checkbox
						}
					}
				}
			}
		}
		/*End: ENHC0050609*/
	}
	catch (e) 
	{
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}