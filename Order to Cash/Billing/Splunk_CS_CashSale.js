/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00        7 May 2014     Hari Gaddipati	DSG Case: 38408
 *												Set the combined services flag 
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord()
{
	var svcsItemExists = false;
	var psItemExists = false;
	var termItemExists = false;
	
	for(var intPos = 1; intPos <= nlapiGetLineItemCount('item'); intPos++)
	{
		var itemId = nlapiGetLineItemValue('item', 'item', intPos);
		if (itemId != '' && itemId != null)
		{
			var itemCategory = nlapiLookupField('item', itemId, 'custitem_item_category', 'T');
		
			if (itemCategory == 'License - Term')
				termItemExists = true;
			
			if (itemCategory == 'Services')
				svcsItemExists = true;
			
			if (itemCategory == 'Training')
				psItemExists = true;
		}
	}

	if (termItemExists && (svcsItemExists || psItemExists))
		nlapiSetFieldValue('custbodycombined_services', 'T');
	
    return true;
}