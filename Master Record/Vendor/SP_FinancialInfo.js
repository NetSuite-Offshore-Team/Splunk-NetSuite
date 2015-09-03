/*
 * This script file is used for disable and enable the ABN NUMBER,BANK SWIFT CODE custom fields.
 * @author : D.Sreenivasulu
 * @Release Date
 * @Release Number
 * @Project  
 * @version 1.0
 */
 
 //This function mainly used for disable and enable the ABN NUMBER,BANK SWIFT CODE custom fields if enter any inputs to ABN NUMBER field automatically will happen disable mode to BANK SWIFT CODE  field and if remove inputs it will come enable mode ABN NUMBER field.Same like that it will happen BANK SWIFT CODE  field also.*/
 
function SP_FinancialInfo(type,name)
{
	
	 if (name == 'custrecord27')
	 {
		
			var linevalue = nlapiGetFieldValue('custrecord27');
			
			
		if (linevalue)
		{
				
				nlapiDisableField('custrecord28',true);
				
		}
  else
        { nlapiDisableField('custrecord28',false);}
     }
 if (name == 'custrecord28')
	 {
		
			var linevalue1 = nlapiGetFieldValue('custrecord28');
			
			
		if (linevalue1)
		{
				
				nlapiDisableField('custrecord27',true);
				
		}
  else{
         nlapiDisableField('custrecord27',false);}
     }
}

 
	