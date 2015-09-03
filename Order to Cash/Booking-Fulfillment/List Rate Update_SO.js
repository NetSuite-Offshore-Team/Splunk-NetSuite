/**
* This script will change the list rate at line item level to Unit Cost/ Term in months. 
* @param (string) stEventType After Submit
* @author Dinanath Bablu
* @Release Date 10/11/2013 for defect DFCT0050099
* @Release Number RLSE0050007
* @version 1.0
*/

function listRateUpdateOnSubmit(type, form) // After Submit function
{
		if (type == 'create') {
			var rec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId()); // Loading the current record
			try {
				var newCount = nlapiGetLineItemCount('item'); // Getting the line item count
				nlapiLogExecution('DEBUG', 'count is ', newCount);
				for (var j = 1; j <= newCount; j++) {
					// Fetching the value of rev rec start and end date
					var newStartDate = rec.getLineItemValue('item', 'revrecstartdate', j);
					var newEndDate = rec.getLineItemValue('item', 'revrecenddate', j);
					if (newStartDate != null && newStartDate != '' && newEndDate != null && newEndDate != '') 
                                       {
						var currentUnitCost = parseFloat(rec.getLineItemValue('item', 'rate', j)); // Getting the Unit cost from the record
						var terms = rec.getLineItemValue('item', 'revrecterminmonths', j); // Fetching the terms in month value
                                                nlapiLogExecution('DEBUG','num of term',terms);
						var itemid = nlapiGetLineItemValue('item', 'item', j);

                                                // Getting the item category and sub item of information of item record
                                                var Fields = ['custitem_item_category', 'parent'];
                                                var Columns = nlapiLookupField('item', itemid, Fields);
                                                var itemCategory = Columns.custitem_item_category;
                                                var parent =  Columns.parent;
					
                                                nlapiLogExecution('DEBUG','category is ',itemCategory);
					
                                                nlapiLogExecution('DEBUG','sub item of is ',parent);
						if ((itemCategory == '2' || parent == '134')&& terms > 0) // Checking whether the item is a "License-Term" or "Support". The static values 2 and 134 are the internal ids for “License-Term” and “Support” respectively.
						{
							nlapiSelectLineItem('item', j);
							nlapiLogExecution('DEBUG', 'unit cost is', currentUnitCost);
							
							// Setting the List Rate value at each line level.
							var listRate = parseFloat(currentUnitCost / terms);
							nlapiLogExecution('DEBUG', 'list rate cost is', listRate);
							rec.setLineItemValue('item', 'custcol_list_rate', j, listRate);
							nlapiCommitLineItem('item');
						}
					}
				}
				var newRecId = nlapiSubmitRecord(rec, true); // Submitting the Sales Order record.
				nlapiLogExecution('DEBUG', 'Sales Order new record created successfully', 'ID = ' + newRecId);
			} 
			catch (e) {
				nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
			}
		}
}

