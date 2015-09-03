/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Aug 2015     Mukta
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
 
function userEventBeforeSubmit(type)
{
	nlapiLogExecution('DEBUG', 'type',type);
	if(type == 'copy')
	{
		var value = nlapiGetFieldValue('custbody_spk_billingtype');
		if(value == 2)
		{
			var url = request.getParameter('id');
			nlapiLogExecution('DEBUG', 'url',url);
			if(url)
			{
			 nlapiGetContext().setSetting('SESSION', 'testsessionobject', url); //Sending Old Sales Order Id to After Submit Script
			}
		}
	}
 
}

function copyBillingSchedule(type)
{
	var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
	var newrecord;
	nlapiLogExecution('DEBUG', 'type',type);
	var newid = nlapiGetRecordId();
	var value = nlapiGetFieldValue('custbody_spk_billingtype');
	if(value == 2)
	{
		var testparam = nlapiGetContext().getSetting('SESSION','testsessionobject');  //Getting Old Sales Order Id
		nlapiLogExecution('debug','test param',testparam);
		
		if(testparam)
		{	
			if(type == 'create')
				{
					try {
							var url1 = nlapiResolveURL('SUITELET','customscript_spk_installmentbillcopyse','customdeploy_spkinstallmentbillingse',true);
							url1 += '&testparam='+testparam+'&newid='+newid;
							nlapiLogExecution('DEBUG','url1 = ',url1);
							var testUrl = nlapiRequestURL(url1); //Calling the Suitelet to create installment billing record
							nlapiLogExecution('DEBUG','testUrl = ',testUrl);
						}
					catch(e)
						{
						 nlapiLogExecution('DEBUG','error',e.getDetalis);
						}
				}
		}
	}
}



