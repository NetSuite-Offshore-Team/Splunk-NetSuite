/* Validating Purchase order and Vendor Bill line item custom fields for start and end dates
 * Client Script - Validate Line Function
 * @author Abith Nitin
 * @Release Date 11/21/2014  for Enhancement ENHC0051230
 * @Release Number 
 * @version 1.0.
 */
 
function Date_fieldchangeline(type)
{
if (type == 'item') 
{
var startdate =nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_splunk_startdate'));
var enddate = nlapiStringToDate(nlapiGetCurrentLineItemValue('item','custcol_splunk_endate'));
	if ((enddate) &&  (!startdate))
	{ 
		alert('Please Enter Start Date');
		return false;
	}
	if (enddate < startdate)
	{
		if(enddate)
		{
			alert('End date should be after Start Date');
			return false;
		}
		else return true;	
	}
    else return true;
}
if( type == 'expense')
{
var startdate =nlapiStringToDate(nlapiGetCurrentLineItemValue('expense','custcol_splunk_startdate'));
var enddate = nlapiStringToDate(nlapiGetCurrentLineItemValue('expense','custcol_splunk_endate'));

	if ((enddate) && (!startdate))
	{ 
		alert('Please Enter Start Date');
		return false;
	}
	if (enddate < startdate)
	{
		if(enddate)
		{
			alert('End date should be after Start Date');
			return false;
		}
		else return true;	
	}
    else return true;
}
}

