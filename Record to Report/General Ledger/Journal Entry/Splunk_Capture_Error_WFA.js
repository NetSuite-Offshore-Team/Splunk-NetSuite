/**
* This script will capture the Error messages displayed on Journal Approval
* @param (string) stEventType After Submit
* @author Dinanath Bablu
* @Release Date  20th Dec 2013
* @Release Number RLSE0050077
* @version 1.0
*/
function captureError()
{

	var rectype = nlapiGetRecordType();
	var id = nlapiGetRecordId();
	try
	{  			

		nlapiSubmitField(rectype,id,['custbodyjournal_approval_status','approvalstatus','approved','custbody_journalerrormessage'],[2,2,'T','']);
		nlapiLogExecution( 'DEBUG', 'try block', 'Inside try');		
		return 0;
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
		nlapiSubmitField(rectype,id,['custbody_journalerrormessage'],[e.getDetails()]);

		return 1;
	}	
}

