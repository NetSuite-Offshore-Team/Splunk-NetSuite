function APContact()
{
	
	
	var email = '';
	
	if((nlapiGetFieldValue('createdfrom') != null)&&(nlapiGetFieldValue('createdfrom') != ''))
		{
		
		
			var filters = new Array();
			var columns = new Array();
			filters[0] = new nlobjSearchFilter('role',null,'is',3);
			filters[1] = new nlobjSearchFilter('company',null,'is',nlapiGetFieldValue('entity'));
			columns[0] = new nlobjSearchColumn('email');
			var result = nlapiSearchRecord('contact',null,filters,columns);
			if(result != null)
			{
			if(result.length > 0)	
			{
				
				if (email == '')
				{
					email = result[0].getValue('email');
			nlapiSetFieldValue('custbody2', email);
                                           	nlapiSetFieldValue('custbody1','T');


				}
							}
			}
			
		}
		
		
		
}