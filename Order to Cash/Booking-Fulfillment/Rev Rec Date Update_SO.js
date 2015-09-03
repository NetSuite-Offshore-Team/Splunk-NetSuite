/**
 * Changing the Rev Rec Start and End Date based on the License Start and End Date.
 * @author Dinanath Bablu
 * @Release Date 15th Feb 2014
 * @Release Number RLSE0050124
 * @version 1.0
 */
 
 function revrecDateUpdateOnSubmit(type) // After Submit function
 {
	try
	{		
		if((type == 'edit' || type == 'create'))
		{			
			/**** Loading the record and checking the condition to set the rev rec start and end date *****/
			var soRec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
			nlapiLogExecution('DEBUG', 'context is', nlapiGetContext().getExecutionContext());
			var deliveryStatus = soRec.getFieldValue('custbody_license_delivery_status'); // To get the license delivery status
			nlapiLogExecution('DEBUG', 'delivery status is',deliveryStatus);
			var status = soRec.getFieldValue('status');
			if(status == 'Pending Billing' && deliveryStatus == '1')
			{
				var count = soRec.getLineItemCount('item'); // Count of the line items.
				for (var i = 1; i <= count; i++) 
				{
					var itemid = soRec.getLineItemValue('item', 'item', i);
					var itemCategory = nlapiLookupField('item', itemid,'custitem_item_category',true);
					var category = nlapiLookupField('item', itemid,'custitem_item_category');
					if(itemCategory == 'License - Term' || category == '2') // If the item is a "License - Term" item
					{
						var licenseStartDate = soRec.getLineItemValue('item','custcol_license_start_date',i);
						var licenseEndDate = soRec.getLineItemValue('item','custcol_license_end_date',i);
						var revrecStartDate = soRec.getLineItemValue('item','revrecstartdate',i);
						var revrecEndDate = soRec.getLineItemValue('item','revrecenddate',i);
						/** Validating if the delivery start and end date is equal or not to rev rec start and end date respectively **/
						if(licenseStartDate && licenseEndDate)
						{
							if(licenseStartDate != revrecStartDate)
							{
								soRec.setLineItemValue('item','revrecstartdate',i,licenseStartDate);			
							}
							if(licenseEndDate != revrecEndDate)
							{
								soRec.setLineItemValue('item','revrecenddate',i,licenseEndDate);
							}
						}
					}					
				}
				var soid = nlapiSubmitRecord(soRec, true); // Submitting the values which has been set.
				nlapiLogExecution('DEBUG', 'soid Submitted', soid);
			}
		}
	}
	catch (e) 
	{
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
 }
 