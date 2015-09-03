function SPlunk_ven_pyment_profile(type,name)
{
	
	 if (name == 'subsidiary')
	 {
		
			var linevalue = nlapiGetFieldText('subsidiary');
			alert(linevalue);
			nlapiSetFieldValue('custentity_currency',linevalue);
			}	
		  if (name == 'currency')
	           {
		
			var linevalue = nlapiGetFieldText('currency');
			alert(linevalue);
			nlapiSetFieldValue('custentity_currency',linevalue);
			}	
}