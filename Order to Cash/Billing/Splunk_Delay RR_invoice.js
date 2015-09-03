/**
* This script file included multiple functions. It populates the custom field "Last Modified Date" on the line items level when user edits the Delay
* Rev Rec checkbox on Invoice form and saves it. This custom field is used in the saved search "Splunk_Delay RR Changes_invoices".
* @author Dinanath Bablu
* @Release Date 03/14/2014
* @Release Number RLSE0050078
* @version 1.0
*/

function invoiceOnSubmit(type, form) // After Submit event
{
    if (type == 'edit') // Acts when the invoice is edited and saved
    {
		var itemids = '';
		var current_RR_status = '';
		var lineitems = nlapiGetFieldValue('custbody_line_item_ids');
		if(lineitems)
		{
			itemids = lineitems.split(',');		
		}
        // Loading the current invoice record  
        var invrec = nlapiLoadRecord('invoice', nlapiGetRecordId());
		var oldrec = nlapiGetOldRecord(); // Getting the old entry of current record
		var context = nlapiGetContext();
		nlapiLogExecution('DEBUG','contxt is',context.getExecutionContext());
        try 
		{
            var count = invrec.getLineItemCount('item'); // Taking the count of line items
            nlapiLogExecution('DEBUG', 'count is', count);
            if(context.getExecutionContext() != 'csvimport')
			{
				for (var i = 0; i < itemids.length; i++) 
				{
					current_RR_status = invrec.getLineItemValue('item', 'deferrevrec', itemids[i]);  
					var old_RR_status = invrec.getLineItemValue('item', 'custcol_isdelayrrchangedonedit', itemids[i]);				
					var lastModifiedDate = invrec.getLineItemValue('item', 'custcol_last_modified_date_lineitem', itemids[i]);                
					if(current_RR_status != old_RR_status )
					{					
						invrec.selectLineItem('item', itemids[i]);
						var lastmodifieddate = invrec.getFieldValue('lastmodifieddate');
						nlapiLogExecution('DEBUG', 'Date and time val is', lastmodifieddate);
						invrec.setCurrentLineItemValue('item', 'custcol_last_modified_date_lineitem', lastmodifieddate);
						invrec.commitLineItem('item');						
					}					
				}
			}				
			else if(context.getExecutionContext() == 'csvimport')
			{
				for (var j = 1; j <= count; j++)
				{
					current_RR_status = invrec.getLineItemValue('item', 'deferrevrec', j);
					var rr_status_csv = oldrec.getLineItemValue('item', 'deferrevrec', j);
					nlapiLogExecution('DEBUG','current_RR_status CSV '+current_RR_status ,'rr_status_csv CSV '+rr_status_csv);
					if ((rr_status_csv == 'T' && current_RR_status == 'F') || (rr_status_csv == 'F' && current_RR_status == 'T')) 
					{
						invrec.selectLineItem('item', j);
						var lastmodifieddate = invrec.getFieldValue('lastmodifieddate');
						nlapiLogExecution('DEBUG', 'Date and time val in CSV', lastmodifieddate);
						invrec.setCurrentLineItemValue('item', 'custcol_last_modified_date_lineitem', lastmodifieddate);
						invrec.commitLineItem('item');
					}					
				}
			}
            var invoiceId = nlapiSubmitRecord(invrec, true);
            nlapiLogExecution('DEBUG', 'invoice record updated successfully', 'ID = ' + invoiceId);
        } 
        catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
	else if (type == 'create') 
	{
		// Loading the current invoice record 
		var invoiceRec = nlapiLoadRecord('invoice', nlapiGetRecordId());
		try 
		{
			var count = invoiceRec.getLineItemCount('item'); // Taking the count of line items
			nlapiLogExecution('DEBUG', 'count is', count);
			for (var i = 1; i <= count; i++) 
			{
				var current_RR_status = invoiceRec.getLineItemValue('item', 'deferrevrec', i);
				// Checking the condition if the Delay RR is checked on line items while creating
				if (current_RR_status == 'T') 
				{					
					invoiceRec.selectLineItem('item', i);
					var lastmodifieddate = invoiceRec.getFieldValue('lastmodifieddate');
					nlapiLogExecution('DEBUG', 'Date and time val is', lastmodifieddate);
					invoiceRec.setCurrentLineItemValue('item', 'custcol_last_modified_date_lineitem', lastmodifieddate);
					invoiceRec.commitLineItem('item');
				}
			}
			var invId = nlapiSubmitRecord(invoiceRec, true);
			nlapiLogExecution('DEBUG', 'invoice record created successfully', 'ID = ' + invId);
		} 
		catch (e) 
		{
			nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
		}
	}
}

/*** Client script to update the flag "IsChangedOnEdit" ***/
function lineInit()
{
	nlapiSetCurrentLineItemValue('item','custcol_isdelayrrchangedonedit','F');
	var delayrr = nlapiGetCurrentLineItemValue('item','deferrevrec');		
	nlapiSetCurrentLineItemValue('item','custcol_isdelayrrchangedonedit',delayrr);		
}

/*** Client script to nullify the custom field "Updated Line Items" ****/
function pageInit()
{
	nlapiSetFieldValue('custbody_line_item_ids','');
}

/*** Validating a line item when copied or added a new line item ****/
function validateLine()
{
	var linenum = nlapiGetCurrentLineItemValue('item','line');
	nlapiLogExecution('DEBUG', 'linenum is', linenum);
	if(linenum == '' || linenum == null)
	{
		nlapiSetCurrentLineItemValue('item','custcol_isdelayrrchangedonedit','F');
	}
	// Checking the line items which are edited.
	var lid = nlapiGetCurrentLineItemIndex('item');
	var lineitems = nlapiGetFieldValue('custbody_line_item_ids');	
	if(lineitems)
	{
		lineitems = lineitems +','+ lid;
	}
	else
	{
		lineitems = lid;
	}
	nlapiSetFieldValue('custbody_line_item_ids',lineitems);
	return true;
}