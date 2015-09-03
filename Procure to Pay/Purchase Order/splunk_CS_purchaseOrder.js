/*
 *	11/07/2012 Kalyani Chintala, DSG Case 30325 - Default Department to G&A:G&A on purchase order lines if item is 16xx
 *	11/12/2012 Kalyani Chintala, DSG Case 30325 - Moving to production
 *
 */

function customPostSourcing(type, name)
{
	if(type == 'item' && name == 'item')
	{
		var itemName = nlapiGetCurrentLineItemText('item', 'item');
		if(itemName.indexOf('16') == 0 || itemName.indexOf('Fixed assets') > 0)
			nlapiSetCurrentLineItemValue('item', 'department', '40', true, true);
	}
}