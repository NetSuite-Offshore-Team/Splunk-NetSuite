/**
* This script populates the custom fields when user edits/creates the Sales Order and saves it 
* @param (string) stEventType After Submit
* @author Dinanath Bablu
* @Release Date 07/11/2013
* @Release Number RLSE0050003
* @version 1.0
*/

function Approvaldate(type,form)
{
nlapiLogExecution('DEBUG','IN the script', type);
// Fetching values from Sales order record.
var SOrder = nlapiGetRecordId();
if(SOrder != '' && SOrder != null)
{
var date = new Date();
var approvaldate = nlapiDateToString(date,'mm/dd/yyyy');
var sorec = nlapiLoadRecord('salesorder',SOrder);
sorec.setFieldValue('custbody_approvaldate',approvaldate);
}
try 
{
     var soid = nlapiSubmitRecord(sorec); // Submitting the newly
    // created project record.
} 
catch (e) 
{
    nlapiLogExecution('ERROR', e.getCode(), e.getDetails());
}
}