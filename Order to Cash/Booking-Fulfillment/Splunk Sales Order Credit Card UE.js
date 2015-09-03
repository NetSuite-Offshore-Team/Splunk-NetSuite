/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2015     mukta.goyal
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */

/*Script is used for Auto populating the Payment information under payment tab if Payment Type is Credit card when sales order is created by Make Copy action.
 * @author Mukta
 * @Release Date 
 * @Release Number 
 * @version 1.0
 */

function userEventBeforeLoad(type)
{
	if(type == 'copy')
	{
		nlapiLogExecution('DEBUG','type',type);
		var paymenttype= nlapiGetFieldValue('custbodymab_payment_type');
		nlapiLogExecution('DEBUG','paymenttype',paymenttype);
		var customer= nlapiGetFieldValue('entity');
		var rec= nlapiLoadRecord('customer', customer);
		if(paymenttype ==7 || paymenttype == 8|| paymenttype == 9|| paymenttype ==10) 
		{
			nlapiSetFieldValue('creditcard',"");
			nlapiSetFieldValue('getauth','F');	
			nlapiSetFieldText('paymentmethod',"");
			nlapiSetFieldValue('ccstreet',null);
			nlapiSetFieldValue('ccnumber',null);
			nlapiSetFieldValue('ccexpiredate',null);
			nlapiSetFieldValue('ccname',null);
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
					nlapiLogExecution('DEBUG','values',values);
					if(values=='T' && paymenttype ==6)
					{
						nlapiLogExecution('DEBUG','paymenttype',paymenttype);
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
}

function userEventAftersub(type)
{
	if(type == 'create')
	{
		var id = nlapiGetRecordId();
		nlapiLogExecution('DEBUG','type',type);
		var paymenttype= nlapiGetFieldValue('custbodymab_payment_type');
		nlapiLogExecution('DEBUG','paymenttype',paymenttype);
		var customer= nlapiGetFieldValue('entity');
		var rec= nlapiLoadRecord('customer', customer);
		if(paymenttype ==7 || paymenttype ==8|| paymenttype ==9|| paymenttype ==10) 
		{
			nlapiSubmitField('salesorder',id,'creditcard',"");
			nlapiSubmitField('salesorder',id,'getauth','F');
			nlapiSubmitField('salesorder',id,'paymentmethod',"");
			nlapiSubmitField('salesorder',id,'ccstreet',null);
			nlapiSubmitField('salesorder',id,'ccnumber',null);
			nlapiSubmitField('salesorder',id,'ccexpiredate',null);
			nlapiSubmitField('salesorder',id,'ccname',null);
			nlapiSubmitField('salesorder',id,'cczipcode',null);
			nlapiSubmitField('salesorder',id,'ccavsstreetmatch',"");
			nlapiSubmitField('salesorder',id,'ccavszipmatch',"");
			nlapiSubmitField('salesorder',id,'authcode',null);
			nlapiSubmitField('salesorder',id,'pnrefnum',null);
		}
		else 
		{
			if(customer)
			{
				var cards= rec.getLineItemCount('creditcards');

				for ( var i=1; i<=cards; i++)
				{
					var values= rec.getLineItemValue('creditcards','ccdefault', i);
					nlapiLogExecution('DEBUG','values',values);
					if(values=='T' && paymenttype ==6)
					{
						nlapiLogExecution('DEBUG','paymenttype',paymenttype);
						var ccid= rec.getLineItemValue('creditcards','internalid', i);

						nlapiLogExecution('DEBUG','ccid',ccid);

						nlapiSubmitField('salesorder',id,'creditcard', ccid);
//						if(ccid)
//						{
//							nlapiSubmitField('salesorder',id,'getauth','T');
//						}
//						else
//						{
//							nlapiSubmitField('salesorder',id,'getauth','F');
//						}
					}
				}
			}
		}
		nlapiSubmitField('salesorder',id,'getauth','F');
	}
}

function userEventBeforesub(type)
{
        nlapiLogExecution('DEBUG','Beforesub:type',type);
	if(type == 'create')
	{
		nlapiSetFieldValue('getauth','F');
	}
}