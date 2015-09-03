function throwError(type)
{
	if(type == 'create')
	{
		var billtype = nlapiGetFieldValue('custbody_spk_billingtype');
		nlapiLogExecution('DEBUG','billtype',billtype);
		if(billtype == 2)
		{
			var linecount = nlapiGetLineItemCount('item');
			for(var i = 1; i<=linecount; i++)
			{
				var project = nlapiGetLineItemValue('item', 'job',i);
				var revRecTemplate = nlapiGetLineItemValue('item', 'revrecschedule', i);
				if((project && revRecTemplate !=6)||((project == null|| project == ' ')&& revRecTemplate ==6))
				{	
					var erroFlag = 1;
				}
			}

			if(erroFlag == 1)
			{
				var error = nlapiCreateError('1111', 'One or more line items on this transaction have Variable Revenue Recognition Templates, but do not have the required project also populated. Please either change the Template for these items or indicate which project will be used to schedule the recognition of revenue', false);
				throw error;
			}
		}
	}
}