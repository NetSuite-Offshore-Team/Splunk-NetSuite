/* When User clicks "Save & Email" button, the transaction should flow to the customer or the designated AP Contact. 
* @author Dinanath Bablu
* @Release Date 10/11/2013  for Enhancement ENHC0050222
* @Release Number RLSE0050007
* @version 1.0
 */

// Client script running on page initialization

function emailToAPContact_init() // Functions on the initialization of the page
{
    var apEmail = nlapiGetFieldValue('custbody2'); // Taking the AP Contact email id
    nlapiLogExecution('DEBUG', 'AP email is ', apEmail);
    var apContact = apEmail.toLowerCase();
    var contactId = nlapiGetFieldValue('email'); // Taking the Customer email id
    nlapiLogExecution('DEBUG', 'To be emailed val is ', contactId);
    var contactEmail = contactId.toLowerCase();
    nlapiLogExecution('DEBUG', 'To be emailed small case is ', contactEmail);

    if (contactId != null && contactId != '') // If the customer email id is available
    {
        var isAPAppended = contactEmail.search(apContact); // Searches if the AP email has already been appended
        
        // If customer email is not same as AP Contact and AP email is not null and AP email is not appended already 
        if (contactEmail != apContact && apContact != null && apContact != '' && isAPAppended == -1) 
	{
            var toBeEmailed = contactId + ';' + apEmail;
            nlapiLogExecution('DEBUG', 'Updated contact id is', toBeEmailed);
            nlapiSetFieldValue('email', toBeEmailed);
            nlapiSetFieldValue('custbody_is_appended', 'T');
        }
        // If customer email is same as AP Contact
        else 
	{
            var toBeEmailed = contactId;
            nlapiSetFieldValue('email', toBeEmailed);
        }
    }
}


// User event script running on after submitting the record.

function emailToAPContactOnSubmit(type) // Function running after submit of record
{
if(type == 'create' || type == 'edit')
{
   try
  {
    var apEmail = nlapiGetFieldValue('custbody2'); // Taking the AP Contact email id
    nlapiLogExecution('DEBUG', 'AP email is ', apEmail);        
    var contactId = nlapiGetFieldValue('email'); // Taking the Customer email id  
    
    if (contactId != null && contactId != '') // If the customer email id is available
    {      
        var contactEmailLen = contactId.length; 
        // If AP email is appended already 
        if (nlapiGetFieldValue('custbody_is_appended') == 'T') 
	{
            var apContactLen = apEmail.length;   
            var toBeEmailed = contactId.substring(0, (contactEmailLen - apContactLen - 1));
            nlapiSetFieldValue('email', toBeEmailed);
            nlapiSetFieldValue('custbody_is_appended', 'F');
            nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), ['email', 'custbody_is_appended'], [toBeEmailed, 'F']);
        }        
        else 
	{
            nlapiSetFieldValue('email', contactId);
        }
    }
}
    catch (e) 
   {
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
    }    
}   
}