// This file hides the OpenAir tax amount field when the feature is not enabled. 
// When the feature is enabled, the total tax on the invoice will be put in a custom field
// This is a workaround for the fact that OpenAir is using the 2008.2 web services and the schema
// does not have enough tax fields properly exposed to handle multi-currency, etc.... 

function setTaxOA(type) 
{

	var nlobjContext = nlapiGetContext();
   	var oa_tax_setting = nlobjContext.getSetting('SCRIPT', 'custscript_oa_invoice_tax_export');

   	if (oa_tax_setting == 'T' && type == 'create') 
   	{     
       		var oa_tax = nlapiGetFieldValue('taxtotal');
		var oa_tax2 = nlapiGetFieldValue('tax2total');
		var oa_tax_total = 0;
		
		// calculate tax
		if (oa_tax != null)
		{
			oa_tax_total = oa_tax_total + parseFloat(oa_tax);		
		}

               
		if (oa_tax2 != null)
		{
			oa_tax_total = oa_tax_total + parseFloat(oa_tax2);		
		}

		oa_tax_total = oa_tax_total.toFixed(2);
       	nlapiSetFieldValue('custbody_oa_invoice_tax_amt',oa_tax_total); 
   	}
}


function hideOATaxField(type, form) 
{
	var nlobjContext = nlapiGetContext();
	var oa_tax_setting = nlobjContext.getSetting('SCRIPT', 'custscript_oa_invoice_tax_export');
	if (oa_tax_setting != 'T')
	{
		var tax_field = form.getField('custbody_oa_invoice_tax_amt');
		if (tax_field != null) 
		{
			tax_field.setDisplayType('hidden');
		}
	}
}