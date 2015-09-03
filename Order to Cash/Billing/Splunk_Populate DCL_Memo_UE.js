/* Script file to populate Department, Class, Location fields for a standalone credit memo having a single line item.
* @author Dinanath Bablu
* @Release Date 03/28/2014
* @Release Number RLSE0050154
* @Enhancement #ENHC0050092
* @version 1.0
*/

function splunk_memoOnSave() // OnSave client script function
{
	var createdFrom = nlapiGetFieldValue('createdfrom');
	nlapiLogExecution('DEBUG','createdFrom is',createdFrom);
	// Checking if it is a standalone credit memo
	if(!createdFrom)
	{
		var count = nlapiGetLineItemCount('item'); // Keeping the count of the line item on the memo record
		nlapiLogExecution('DEBUG','Count is',count);
		if(count == 1)
		{
			/******* Fetching the item record and the field informations from item record ******/ 
			var itemId = nlapiGetLineItemValue('item','item',count);
			var fields = ['department','location','custitem_spk_dclfieldpopulate'];
			var columns = nlapiLookupField('item',itemId, fields);
			var isEligible = columns.custitem_spk_dclfieldpopulate;			
			nlapiLogExecution('DEBUG','flag is',isEligible);
			if(isEligible == 'T') // If the "Populate DCL Field" flag is checked on the item record.
			{
				try
				{
					var dept = columns.department;
					var class_item = nlapiLookupField('item',itemId,'class'); 
					var loc = columns.location; 
					if(!dept || !class_item || !loc) // If any or all of Department/Class/Location values are not available on item record.
					{						
						var result = confirm('Item does not have either of Department/Class/Location assigned. Do you want to proceed ? ');
						if (result == true)
						{
							return true;
						}
						else
						{
							return false;
						}
					}
				}
				catch (e) 
				{
					nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				}
			}			
		}
	}
	return true;
}

function splunk_memoOnSubmit(type,form) // After Submitting the record on creation.
{
	try
	{
		if(type == 'create')
		{		
			var createdFrom = nlapiGetFieldValue('createdfrom');
			nlapiLogExecution('DEBUG','createdFrom is',createdFrom);
			// Checking if it is a standalone credit memo
			if(!createdFrom)
			{
				var count = nlapiGetLineItemCount('item'); // Keeping the count of the line item on the memo record
				nlapiLogExecution('DEBUG','Count is',count);
				if(count == 1)
				{
					/******* Fetching the item record and the field informations from item record ******/ 
					var itemId = nlapiGetLineItemValue('item','item',count);
					var fields = ['department','location','custitem_spk_dclfieldpopulate'];
					var columns = nlapiLookupField('item',itemId, fields);
					var isEligible = columns.custitem_spk_dclfieldpopulate;			
					nlapiLogExecution('DEBUG','flag is',isEligible);
					if(isEligible == 'T') // If the "Populate DCL Field" flag is checked on the item record.
					{							
						var dept = columns.department;
						var class_item = nlapiLookupField('item',itemId,'class'); 
						var loc = columns.location;						
						/****** Setting the DCL field values on Credit Memo Record ******/
						if(dept && class_item && loc)
						{
							nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),['department','class','location'],[dept,class_item,loc]);
						}
						else
						{
							if(dept)
							{
								nlapiSetFieldValue('department',dept);
								nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'department',dept);
							}
							if(class_item)
							{
								nlapiSetFieldValue('class',class_item);
								nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'class',class_item);
							}
							if(loc)
							{
								nlapiSetFieldValue('location',loc);
								nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'location',loc);
							}	
						}
					}
				}
			}
		}	
		if(type == 'edit')
		{
			var createdFrom = nlapiGetFieldValue('createdfrom');
			nlapiLogExecution('DEBUG','createdFromEdit is',createdFrom);
			// Checking if it a standalone credit memo
			if(!createdFrom)
			{
				var count = nlapiGetLineItemCount('item'); // Keeping the count of the line item on the memo record
				nlapiLogExecution('DEBUG','CountEdit is',count);
				if(count == 1)
				{
					/******* Fetching the item record and the field informations from item record ******/ 
					var itemId = nlapiGetLineItemValue('item','item',count);
					var fields = ['department','location','custitem_spk_dclfieldpopulate'];
					var columns = nlapiLookupField('item',itemId, fields);
					var isEligible = columns.custitem_spk_dclfieldpopulate;			
					nlapiLogExecution('DEBUG','flag is',isEligible);
					if(isEligible == 'T') // If the "Populate DCL Field" flag is checked on the item record.
					{
						var dept = columns.department;
						var class_item = nlapiLookupField('item',itemId,'class'); 
						var loc = columns.location; 
						var currentDept = nlapiGetFieldValue('department');
						var currentClass = nlapiGetFieldValue('class');
						nlapiLogExecution('DEBUG','class is',currentClass);
						var currentLoc = nlapiGetFieldValue('location');
						/****** Updating the DCL field values on Credit Memo Record ******/
						if(!currentDept)
						{
							nlapiSetFieldValue('department',dept);
							nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'department',dept);
						}
						if(!currentClass)
						{
							nlapiSetFieldValue('class',class_item);
							nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'class',class_item);
						}
						if(!currentLoc)
						{
							nlapiSetFieldValue('location',loc);
							nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'location',loc);
						}
					}
				}
			}
		}
	}
	catch (e) 
	{
		nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
	}
}	
					
					
