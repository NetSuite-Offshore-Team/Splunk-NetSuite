/**
* Script will capture the Error messages and display an Alert to the user
* @param (string) stEventType After Submit
* @author Dinanath Bablu
* @Release Date  20th dec2013
* @Release Number RLSE0050077
* @version 1.0
*/
function beforeload(type, form)
{
	if(type == 'view')
	{
		try
		{
			var rec = nlapiGetNewRecord();	
			var role = nlapiGetRole();
			nlapiLogExecution('DEBUG', 'role', role);
			
			var user = nlapiGetUser();
			nlapiLogExecution('DEBUG', 'user', user);
			var filters = new Array();			
			filters[0] = new nlobjSearchFilter('permission', 'role', 'anyof', 'ADMI_PERIODOVERRIDE'); 
			filters[1] = new nlobjSearchFilter('level', 'role', 'anyof', 4); 
			filters[2] = new nlobjSearchFilter('internalid', 'role', 'anyof', role); 
			filters[3] = new nlobjSearchFilter('internalid', null, 'anyof', user); 		
			var searchresults = nlapiSearchRecord('employee', null, filters, null);
			var period = rec.getFieldText('postingperiod');	
			var status = getperiod(period);
			if((searchresults || role == 3) || (status))
			{
				var rectype = nlapiGetRecordType();
				var id = nlapiGetRecordId();
				nlapiLogExecution('DEBUG', 'rectype', rectype);
				nlapiLogExecution('DEBUG', 'id', id);
				nlapiSubmitField(rectype,id,'custbody_journalerrormessage', ' ',true);
			}
			else
			{			
				
				var _journalerrormessage = nlapiGetFieldValue('custbody_journalerrormessage');	
				if(_journalerrormessage)
				{
					var html = '<SCRIPT language="JavaScript" type="text/javascript">';
					
					
					
					html += "function bindEvent(element, type, handler) {if(element.addEventListener) {element.addEventListener(type, handler, false);} else {element.attachEvent('on'+type, handler);}} "; 
					html += 'bindEvent(window, "load", function(){'; 
					html += 'alert("'+_journalerrormessage+'");'; 
					html += '});'; 
					html += '</SCRIPT>';
					
					

					// push a dynamic field into the environment
					var field0 = form.addField('custpage_alertmode', 'inlinehtml', '',null,null); 
					field0.setDefaultValue(html);
				
					nlapiLogExecution('DEBUG', 'inside', _journalerrormessage);	

					
				}			
			}	
			
		}
		catch(e)
		{		
			if (e instanceof nlobjError)
			{
				nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
				
			}	
			else
			{
				nlapiLogExecution('ERROR', 'unexpected error', e.toString());			
			}
			
		}	
	}
}

function getperiod(period)
{
	var flag = false;
	var filter = new Array();
	var column = new Array();
	filter[0] = new nlobjSearchFilter('periodname',null,'is',period);
	filter[1] = new nlobjSearchFilter('closed',null,'is','F');
	filter[2] = new nlobjSearchFilter('aplocked',null,'is','F');
	filter[3] = new nlobjSearchFilter('arlocked',null,'is','F');
	column[0] = new nlobjSearchColumn('internalid');
	var result = nlapiSearchRecord('accountingperiod',null,filter, column);
	if(result)
	{		
		flag = true;	
	}
	return flag;
	
}