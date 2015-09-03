/**
 * The script file is used for validating that the Items in the bill should be on PO. If items in the bill are mismatching with items in PO, then user will not be allowed to save the record..
 * And if user change the Item name in any existing items then it will check on field change,same item name present on lines or not and item is available on PO line item or not.
 * @author Jitendra Singh
 * @Release Date 22nd May 2015
 * @Release Number RLSE0050369
 * @version 1.0
 */

//For validating that the Items in the bill should be on PO. If items in the bill are mismatching with items in PO, then user will not be allowed to save the record.
function clientValidateLine(type){
	try
	{
		nlapiLogExecution('DEBUG','Start', '***START***');
		var context = nlapiGetContext().getExecutionContext();
		nlapiLogExecution('DEBUG','context:type', context+':'+type);

		if(type == 'item')
		{
			var createdFromId = nlapiGetFieldValue('custbody_spk_poid');
			if(createdFromId)
			{
				var createdFromRec = nlapiLoadRecord('purchaseorder', createdFromId);
				var poItemCount = createdFromRec.getLineItemCount('item');
				var vbItemCount = nlapiGetLineItemCount('item');
				nlapiLogExecution('DEBUG','createdFromId:poItemCount:vbItemCount',createdFromId+':'+poItemCount+':'+vbItemCount);

				var currentVBItemId = nlapiGetCurrentLineItemValue('item', 'item');
				var line = nlapiGetCurrentLineItemValue('item', 'line');
				nlapiLogExecution('DEBUG','currentVBItemId:line',currentVBItemId+':'+line);

				for(var itemIndex=1; itemIndex<=vbItemCount; itemIndex++)
				{
					var vbItemId = nlapiGetLineItemValue('item', 'item', itemIndex);
					nlapiLogExecution('DEBUG','vbItemId',vbItemId);

					/*This condition is for checking that if any item is added more then one time or copying line item in Bill*/
					if((vbItemId == currentVBItemId) && !line)
					{
						nlapiLogExecution('DEBUG','same item found');
						alert('You cannot add same item again to a Vendor Bill.');
						return false;
					}
				}

				var isItemOnPO = 'T';
				for(var poitemIndex=1; poitemIndex<=poItemCount; poitemIndex++)
				{
					var poItemId = createdFromRec.getLineItemValue('item', 'item', poitemIndex);
					nlapiLogExecution('DEBUG','poItemId == currentVBItemId',poItemId +'=='+ currentVBItemId);

					if(poItemId == currentVBItemId)
					{
						isItemOnPO = 'T';
						break;
					}
					else
					{
						isItemOnPO = 'F';
					}
				}
				if(isItemOnPO == 'F')
				{
					nlapiLogExecution('DEBUG','item not found on po');
					alert('You cannot add an item and purchase order combination that does not exist to a Vendor Bill.');
					return false;
				}
			}
			else
			{
				nlapiLogExecution('DEBUG','createdFrom else', 'createdFrom else');
			}
		}
		nlapiLogExecution('DEBUG','End', '***END***');
		return true;

	}
	catch(e) {
		alert("Error message : "+e.toString());
	}
}

//For if user change the Item name in any existing items then it will check on field change,same item name present on lines or not and item is available on PO line item or not.
function clientFieldChanged(type, name, linenum)
{
	try
	{
		if(type == 'item' && name == 'item')
		{
			var currentVBItemId = nlapiGetCurrentLineItemValue('item', 'item');
			var line = nlapiGetCurrentLineItemValue('item', 'line');
			if(line)
			{
				var createdFromId = nlapiGetFieldValue('custbody_spk_poid');
				if(createdFromId)
				{
					var createdFromRec = nlapiLoadRecord('purchaseorder', createdFromId);
					var poItemCount = createdFromRec.getLineItemCount('item');
					var vbItemCount = nlapiGetLineItemCount('item');

//					alert(currentVBItemId+':'+line);
					for(var itemIndex=1; itemIndex<=vbItemCount; itemIndex++)
					{
						var vbItemId = nlapiGetLineItemValue('item', 'item', itemIndex);
						nlapiLogExecution('DEBUG','vbItemId',vbItemId);
						nlapiLogExecution('DEBUG','line:itemIndex',line+':'+itemIndex);

						/*This condition is for checking that if any item is added more then one time in Bill*/
						if((vbItemId == currentVBItemId) && line !=itemIndex)
						{
							nlapiLogExecution('DEBUG','same item found');
							alert('You cannot add same item again to a Vendor Bill.');
							return false;
						}
					}
					var isItemOnPO = 'T';
					for(var poitemIndex=1; poitemIndex<=poItemCount; poitemIndex++)
					{
						var poItemId = createdFromRec.getLineItemValue('item', 'item', poitemIndex);
						nlapiLogExecution('DEBUG','poItemId == currentVBItemId',poItemId +'=='+ currentVBItemId);

						if(poItemId == currentVBItemId)
						{
							isItemOnPO = 'T';
							break;
						}
						else
						{
							isItemOnPO = 'F';
						}
					}
					if(isItemOnPO == 'F')
					{
						nlapiLogExecution('DEBUG','item not found on po');
						alert('You cannot add an item and purchase order combination that does not exist to a Vendor Bill.');
						return false;
					}
				}
			}
		}
	}
	catch(e) {
		alert("Error message : "+e.toString());
	}
}