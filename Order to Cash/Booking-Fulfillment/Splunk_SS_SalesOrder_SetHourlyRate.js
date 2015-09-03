/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Apr 2014     Hari Gaddipati	DSG Case: 38866
 * 												Set hourly rate and planned hours on sales item
 * 				08/15/2014		Hari Gaddipati	DSG Case: 40842
 * 												Set Hourly rate fields on Approve of sales order
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
/*
function userEventBeforeSubmit(type)
{
	if (type == 'create' && nlapiGetContext().getExecutionContext() != 'userinterface')
	{
		var recSalesOrder = nlapiGetNewRecord();

		for (var intPos = 1; intPos <= recSalesOrder.getLineItemCount('item'); intPos++)
		{
			var itemId = recSalesOrder.getLineItemValue('item', 'item', intPos);
			if (itemId != '' && itemId != null)
			{
				var itemHours = nlapiLookupField('item', itemId, 'custitem_hours');
					itemHours = itemHours == null || itemHours == '' ? 0 : parseFloat(itemHours);
					
				var itemQuantity = nlapiGetLineItemValue('item', 'quantity', intPos);
					itemQuantity = itemQuantity == null || itemQuantity == '' ? 0 : parseFloat(itemQuantity);
				
				var itemAmount = nlapiGetLineItemValue('item', 'amount', intPos);
					itemAmount = itemAmount == null || itemAmount == '' ? 0 : parseFloat(itemAmount);
				
				var itemPlannedHours = parseFloat(itemQuantity) * parseFloat(itemHours);
				
				if (parseFloat(itemPlannedHours) > 0)
				{
					var itemHourlyRate = parseFloat(itemAmount) / parseFloat(itemPlannedHours);
						itemHourlyRate = itemHourlyRate.toFixed(2);

					recSalesOrder.setLineItemValue('item', 'custcol_hourly_rate', intPos, itemHourlyRate);
				}
				
				recSalesOrder.setLineItemValue('item', 'custcol_hours', intPos, itemPlannedHours);
			}
		}
	}
}
*/
function userEventAfterSubmit(type)
{
	if (type == 'approve')
	{
		updateSO = false;
		var recSalesOrder = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId(), {recordmode: 'dynamic'});

		for (var intPos = 1; intPos <= recSalesOrder.getLineItemCount('item'); intPos++)
		{
			recSalesOrder.selectLineItem('item', intPos);

			var itemId = recSalesOrder.getCurrentLineItemValue('item', 'item');
			if (itemId == '' || itemId == null)
				continue;

			var itemHours = nlapiLookupField('item', itemId, 'custitem_hours');
				itemHours = itemHours == null || itemHours == '' ? 0 : parseFloat(itemHours);

			if (parseFloat(itemHours) <= 0)
				continue;

			updateSO = true;

			var itemQuantity = recSalesOrder.getCurrentLineItemValue('item', 'quantity');
				itemQuantity = itemQuantity == null || itemQuantity == '' ? 0 : parseFloat(itemQuantity);
			
			var itemAmount = recSalesOrder.getCurrentLineItemValue('item', 'amount');
				itemAmount = itemAmount == null || itemAmount == '' ? 0 : parseFloat(itemAmount);
			
			var itemPlannedHours = parseFloat(itemQuantity) * parseFloat(itemHours);
			
			if (parseFloat(itemPlannedHours) > 0)
			{
				var itemHourlyRate = parseFloat(itemAmount) / parseFloat(itemPlannedHours);
					itemHourlyRate = itemHourlyRate.toFixed(2);

				recSalesOrder.setCurrentLineItemValue('item', 'custcol_hourly_rate', itemHourlyRate);
			}
			
			recSalesOrder.setCurrentLineItemValue('item', 'custcol_hours', itemPlannedHours);
			
			recSalesOrder.commitLineItem('item');
		}
		
		if (updateSO)
			nlapiSubmitRecord(recSalesOrder);
	}
}