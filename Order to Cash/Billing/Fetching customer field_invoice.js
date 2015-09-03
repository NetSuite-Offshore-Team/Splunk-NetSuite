/**
* This script loads the custom fields when the customer name is selected on invoice form. 
* The script fetches value of few fields from the customer record and sets the same on invoice page
* @param (string) stEventType Field Change and Page Init (Client Script)
* @author Dinanath Bablu
* @Release Date 07/11/2013
* @Release Number RLSE0050003
* @version 1.0
*/
function pagestartedit(type)
{
if(type == 'edit' || 'create')
{
                                          var custid = nlapiGetFieldValue('entity');
if(custid != '' && custid !=null)
{
		var custrec = nlapiLoadRecord('customer',custid);
		var flagval = custrec.getFieldValue('custentity_specialinvoice_customer');
		var invcomment = custrec.getFieldValue('custentity_comments_customer');
		if ((flagval == 'T') && (invcomment != '' && invcomment != null)) 
		{
			nlapiSetFieldValue('custbody_special_invoice', 'T');
			nlapiSetFieldValue('custbody_comments', invcomment);
		}
		else if((flagval == 'F')&& (invcomment != '' && invcomment != null))
		{
			nlapiSetFieldValue('custbody_special_invoice', 'F');
			nlapiSetFieldValue('custbody_comments', invcomment);
		}
		else if((flagval == 'T') && (invcomment == '' || invcomment == null)) 
		{
			nlapiSetFieldValue('custbody_special_invoice', 'T');
			nlapiSetFieldValue('custbody_comments', '');			
		}	
                                          else if((flagval == 'F') && (invcomment == '' || invcomment == null))
                                          {
                                                               nlapiSetFieldValue('custbody_special_invoice', 'F');
                                                               nlapiSetFieldValue('custbody_comments', '');

                                          } 
}

}
}





function fieldupdate(type, name)
{
	if(name== 'entity')
	{
		var custid = nlapiGetFieldValue('entity');
		var custrec = nlapiLoadRecord('customer',custid);
		var flagval = custrec.getFieldValue('custentity_specialinvoice_customer');
		var invcomment = custrec.getFieldValue('custentity_comments_customer');
		if ((flagval == 'T') && (invcomment != '' && invcomment != null)) 
		{
			nlapiSetFieldValue('custbody_special_invoice', 'T');
			nlapiSetFieldValue('custbody_comments', invcomment);
		}
		else if((flagval == 'F')&& (invcomment != '' && invcomment != null))
		{
			nlapiSetFieldValue('custbody_special_invoice', 'F');
			nlapiSetFieldValue('custbody_comments', invcomment);
		}
		else if((flagval == 'T') && (invcomment == '' || invcomment == null)) 
		{
			nlapiSetFieldValue('custbody_special_invoice', 'T');
			nlapiSetFieldValue('custbody_comments', '');			
		}	
                                          else if((flagval == 'F') && (invcomment == '' || invcomment == null))
                                          {
                                                               nlapiSetFieldValue('custbody_special_invoice', 'F');
                                                               nlapiSetFieldValue('custbody_comments', '');

                                          } 

}
}