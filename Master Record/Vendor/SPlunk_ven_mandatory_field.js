function SPlunk_ven_mandatory_field(type,form)
{
	
	    if(type == 'create'||type=='edit'){
		
			var linevalue = nlapiGetFieldValue('custentity_recbankprimid');
			if(linevalue)
			{
			var field = form.nlapiGetField('custentity_recbankprimidtype');
			
			field.setMandatory(true); 

			}
	}
	}		