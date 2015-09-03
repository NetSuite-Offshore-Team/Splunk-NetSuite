/*
* DFCT0050719 and ENHC0050397 This script is used to set the all credit card fields values and check the get authorization checkbox  under payment subtab when payment type is credit card on SO
* @AUTHOR : Mukta Goyal
* @Release Date: 
* @Release Number 
* @version 1.0
*/
function clientFieldChanged(type, name, linenum)
{
	var pvalue= nlapiGetFieldValue('paymentmethod');
	
	
		if(name == 'custbodymab_payment_type')
		{
			
			var paymenttype= nlapiGetFieldValue('custbodymab_payment_type');
			var customer= nlapiGetFieldValue('entity');
			var rec= nlapiLoadRecord('customer', customer);
			if(paymenttype ==7 || paymenttype ==8|| paymenttype ==9|| paymenttype ==10) 
			{
				nlapiSetFieldValue('creditcard',"");
				nlapiSetFieldValue('getauth','F');	
				nlapiSetFieldText('paymentmethod',"");
				nlapiSetFieldValue('ccstreet',null);
				nlapiSetFieldValue('cczipcode',null);
				nlapiSetFieldText('ccavsstreetmatch',"");
				nlapiSetFieldText('ccavszipmatch',"");
				nlapiSetFieldValue('authcode',null);
				nlapiSetFieldValue('pnrefnum',null);
				
				
			}
			else 
			{
				if(customer)
				{
					var cards= rec.getLineItemCount('creditcards');
					
					for ( var i=1; i<=cards; i++)
					{
						var values= rec.getLineItemValue('creditcards','ccdefault', i);
						if(values=='T' && paymenttype ==6)
						{
							var id= rec.getLineItemValue('creditcards','internalid', i);
							
							nlapiSetFieldValue('creditcard', id);
							if(id)
							{
								nlapiSetFieldValue('getauth','T');
							}
							else
							{
								nlapiSetFieldValue('getauth','F');
							}
							
							
						}
						
					}
				}
			}
			
		}
		
		else
		{
			if(name == 'creditcard')
			{
							var pay = nlapiGetFieldValue('paymentmethod');
							nlapiSetFieldValue('pnrefnum',null);
							nlapiSetFieldValue('authcode',null);
							nlapiSetFieldText('ccavsstreetmatch',"");
							nlapiSetFieldText('ccavszipmatch',"");
							if(pay)
							{
								nlapiSetFieldValue('getauth','T');
							}
						
			}
		}
	
 
}
