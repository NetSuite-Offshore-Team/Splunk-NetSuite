/**
* This script file is used to check the Credit Hold Sync Field to true. 
* @author Abhilash Gopinathan
* @Enhancement # ENHC0051154
* @Release Date 16th October 2014
* @version 1.0
*/

function SetFlagInvoice()
{
if((nlapiGetFieldValue('entity')!=null)&&(nlapiGetFieldValue('entity')!=''))
{
nlapiSubmitField('customer',nlapiGetFieldValue('entity'),'custentitycustbody_credithold_synch','T');
}
if((nlapiGetFieldValue('customer')!=null)&&(nlapiGetFieldValue('customer')!=''))
{
nlapiSubmitField('customer',nlapiGetFieldValue('customer'),'custentitycustbody_credithold_synch','T');
}
}
