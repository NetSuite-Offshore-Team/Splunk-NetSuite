// ================== ENTITY METHODS =====================================
/**
 * Set the "Export to OpenAir" flag for customers, projects, employees, vendors,
 * and service items based on their respective script parameters.
 */ 
function setExportToOpenAirOnNew()
{
	var nlobjContext = nlapiGetContext();
	var recType = nlapiGetNewRecord().getRecordType();

	var script_fld_id = 'custscript_oa_export_' + recType;
	var export_fld_id = ('serviceitem' == recType ? 'custitem' : 'custentity') + '_oa_export_to_openair';

	var scriptval = nlobjContext.getSetting('SCRIPT', script_fld_id);
	if (scriptval == 'T')
		nlapiSetFieldValue(export_fld_id, 'T', true, true);
	else
		// explicitly set it to false, so other on change handlers can happen (e.g. onItemSetDefaultBillingRule)
		nlapiSetFieldValue(export_fld_id, 'F', true, true);
}

// ----------- PROJECT-SPECIFIC METHODS ------------------------
/**
 * Set the "Limit Time and Expenses to Assignees" field to false if you save a project
 * record with "Export to OpenAir" == true.  This is really only needed when Advanced 
 * Projects is true (the field doesn't exist for basic projects).
 * Note that this method is deployed as a before submit user event script.
 */
function setProjectFieldsUE()
{

	// Set limit time to assignees field to false 
	if (isAdvancedJobsOn())
	{
		var b_export_to_openair = nlapiGetFieldValue('custentity_oa_export_to_openair');
		var b_limit_time_to_assignees = nlapiGetFieldValue('limittimetoassignees');
		if (b_export_to_openair == 'T' && b_limit_time_to_assignees == 'T')
		{
			nlapiSetFieldValue('limittimetoassignees', 'F', false, true);
		}
	}
	
	// Set the project currency custom field to synch with OpenAir
	if (isMultiCurrencyCustomerOn())
	{
		var b_export_to_openair = nlapiGetFieldValue('custentity_oa_export_to_openair');
		var project_currency = nlapiGetFieldValue('currency');
		if (b_export_to_openair == 'T')
		{
			nlapiSetFieldValue('custentity_oa_project_currency', project_currency, false, true);
		}		
	}
}




/**
 * This is the client-side version of setLimitTimeAndExpensesFalseUE.  If the project
 * is marked for export and Advanced Jobs is enabled, then the Limit Time to Assignees
 * flag will be unchecked and disabled.
 */
function setLimitTimeAndExpensesFalseClient(type, name)
{
	if (isAdvancedJobsOn())
	{
		if (name == 'custentity_oa_export_to_openair')
		{
			if (nlapiGetFieldValue('custentity_oa_export_to_openair') == 'T')
			{
				nlapiSetFieldValue('limittimetoassignees', 'F', false, true);
			    nlapiDisableField('limittimetoassignees', true);
			}
			else
			{
			    nlapiDisableField('limittimetoassignees', false);
			}
		}
	}
}
 

/**
 * Uncheck and disable Limit Time if this project is marked for export on init. 
 */
function setLimitTimeAndExpensesFalseInit(type, name)
{
	if (isAdvancedJobsOn())
 	{
		if (nlapiGetFieldValue('custentity_oa_export_to_openair') == 'T')
		{
			nlapiSetFieldValue('limittimetoassignees', 'F', false, true);
		    nlapiDisableField('limittimetoassignees', true);
		}
 	}
}

 /**
  * Returns true if the Advanced Jobs feature is enabled.
  * @return True if AJT is on
  */
function isAdvancedJobsOn()
{
	return (nlapiGetContext().getSetting('FEATURE', 'ADVANCEDJOBS') == 'T');
}

/**
 * Returns true if the Advanced Jobs feature is enabled.
 * @return True if AJT is on
 */
function isMultiCurrencyCustomerOn()
{
	return (nlapiGetContext().getSetting('FEATURE', 'MULTICURRENCYCUSTOMER') == 'T');
}


// ----------- ITEM-SPECIFIC METHODS ------------------------
/**
 * If the item is not marked to be exported, then the only valid billing rule is "Do not export" (4).
 */
function onItemSetDefaultBillingRule()
{
	var b_export_to_openair = nlapiGetFieldValue('custitem_oa_export_to_openair');
	var default_billing_rule = nlapiGetFieldValue('custitem_oa_default_billing_rule');

	if (b_export_to_openair == 'T')
	{
		nlapiDisableField('custitem_oa_default_billing_rule', false);
	}
	else 
	{
		if (isLineBeingExported(default_billing_rule))
			nlapiSetFieldValue('custitem_oa_default_billing_rule', 4, false, false);  // 4 == 'Do not export'
		nlapiDisableField('custitem_oa_default_billing_rule', true);
	}
}

// ============== SALES ORDERS ==============================
/**
 * We could add a method here in the future to disable the billing rule type field if the item selected
 * cannot be exported.
 */

/** 
 * If the current line has been marked to be exported to OpenAir, check two things:
 * 1) It's a valid item type (see the check below for invalid item types)
 * 2) The item on the line is marked for export to OpenAir
 * 
 * Note that discount and subtotal lines that apply to exported lines are picked up implicitly by the integration.
 */
function validateSOLine()
{

	var item_id = nlapiGetCurrentLineItemValue('item', 'item'); 
	var billingrule = nlapiGetCurrentLineItemValue('item', 'custcol_oa_billing_rule_type');
	var quantity_not_hours = nlapiGetCurrentLineItemValue('item', 'custcol_oa_quantity_not_hours');
	var billingrule_discount = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_discount_billing_rules');

	if (isLineBeingExported(billingrule) && item_id != null && item_id.length > 0)
	{
		var fields = ['type', 'custitem_oa_export_to_openair'];
		var values = nlapiLookupField('item', item_id, fields, false);

		// if the type is not allowed for export, then the billing rule must be "do not export"
		// There is a weird default description item that returns a null 'values' object, so check for it
		// Assembly = ; Description = ; Discount = ; Item Group = ; Kit = ; Markup = ; Payment = ; Subtotal = 
		if (values == null || values.type == 'Assembly' || values.type == 'Description' || (values.type == 'Discount' && billingrule_discount != 'T') || values.type == 'Group' || 
				values.type == 'Kit' || (values.type == 'Markup' && billingrule_discount != 'T') || values.type == 'Payment' || values.type == 'Subtotal')
		{
			alert('Lines containing the following item types cannot be exported to OpenAir: Assembly, Description, Discount, Item Group, Kit, Markup, Payment, Subtotal.');
			return false;
		}

                // validation against the custom field custcol_oa_quantity_not_hours - only works for time-billing rules
                if ((billingrule == '2' || billingrule == '3') && (quantity_not_hours == 'T')) {
               		alert('Only Time billing rules can be used with the "OpenAir Quantity From % Invoiced" field. Make sure this feature is enabled in your OpenAir account.');
			return false;
                }


                // if this is a discount/markup item and we are creating billing rules for these, return true
                if ((values.type == 'Discount' || values.type == 'Markup') && billingrule_discount == 'T') 
                {
                	if (billingrule == '1') 
                	{
                		alert('Discount or markup lines must have one of the following billing rule types: Fixed fee % complete or fixed fee on date or milestone');
                		return false;
                	} 
                        return true;
                }

		// if export_to_openair is false on the item, must be "do not export"
		if (values.custitem_oa_export_to_openair != 'T')
		{
			alert('This line cannot be exported to OpenAir because the associated item has not been marked for export to OpenAir.');
			return false;
		}
		
		// check revenue rules if enabled 
		var revrec_rule_enabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_rev_rec_rule_on_so');
		if (revrec_rule_enabled == 'T' )
		{
			// time project rev rec rule must be tied to a time billing rule
			var revrec_rule = nlapiGetCurrentLineItemValue('item', 'custcol_oa_rev_rec_rule');
			if (revrec_rule == '6' && billingrule != '1')
			{
				alert('The sales order cannot be saved with Time selected as the revenue recognition rule unless Time is also selected in the billing rule dropdown.')
				return false; 
			}
		}
		
	} else if (item_id != null && item_id.length > 0 && billingrule_discount == 'T') 
	{

        var fields = ['type', 'custitem_oa_export_to_openair'];
		var values = nlapiLookupField('item', item_id, fields, false);	    

		// check for description item that returns null value / exclude it
		if ((values != null) && (values.type == 'Discount' || values.type == 'Markup') &&  (billingrule == null || billingrule == ''))
		{
        		alert('Discount or markup lines must have one of the following billing rule types specified: Fixed fee % complete, Fixed fee on date or milestone or Do not export.');
	            	return false;
		}
	}
	
	return true;
}


/**
 * Hide the OpenAir billing rule field on invoices and cash sales.
 * 
 * @param type
 * @param form
 * @return
 */
function beforeLoadInvoice(type, form)
{
	var recType = nlapiGetRecordType();
	if ('invoice' == recType || 'cashsale' == recType)
	{
		var billing_rule_field = nlapiGetLineItemField('item', 'custcol_oa_billing_rule_type');
		if (billing_rule_field != null)
			billing_rule_field.setDisplayType('hidden');

		var quantity_not_hours = nlapiGetLineItemField('item', 'custcol_oa_quantity_not_hours');
		if (quantity_not_hours != null)
			quantity_not_hours.setDisplayType('hidden');

		var rev_rec_rule_field = nlapiGetLineItemField('item', 'custcol_oa_rev_rec_rule');
		if (rev_rec_rule_field != null)
			rev_rec_rule_field.setDisplayType('hidden');

	} 
	
	// unless rev rec rule integration enabled, hide the field
	if ('salesorder' == recType || 'invoice' == recType || 'cashsale' == recType)
	{
		// hide rev rec rule field if needed 
		var revrec_rule_enabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_rev_rec_rule_on_so');
		if (revrec_rule_enabled == 'F')
		{
			var rev_rec_rule_field = nlapiGetLineItemField('item', 'custcol_oa_rev_rec_rule');
			rev_rec_rule_field.setDisplayType('hidden');
		}	
	}
}

/* copy the amount on the line to the custom field */ 
function beforeSubmitSalesOrder (type) 
{
    var recType = nlapiGetRecordType();
    if (recType == 'salesorder') 
	{	
		// iterate over the line items
		var lineItemCount = nlapiGetLineItemCount('item');
    	for (var linenum = 1; linenum <= lineItemCount; linenum++) 
		{
	            // set the line-level fields
	        	var line_amt = nlapiGetLineItemValue('item', 'amount', linenum);
	            nlapiSelectLineItem('item', linenum);
	            nlapiSetCurrentLineItemValue('item', 'custcol_oa_so_line_amt', line_amt);
	            nlapiCommitLineItem('item');							
        }
    }
}


/**
 * Same check as validateSOLine, but, instead of throwing an error, just set the line to "Do not discount" if it somehow got 
 * this far and was still invalid.
 */ 
//function updateSOLine()
//{
//}
 
 
 /**
 * Returns true if the billingrule value indicates that it is being exported.  
 * Essentially, any non-empty value other than 4 ("Do not export") indicates that it is being exported.
 * @param billingrule
 * @return
 */
function isLineBeingExported(billingrule)
{
	return (billingrule != null && billingrule != '' && billingrule != 4);
}

/* function to set OpenAir-specific needed fields 
 * when the OpenAir expense report to vendor bill integration is enabled
 */
function setOpenAirVendorFieldsVBIntegration (type)
{	           
	var recType = nlapiGetRecordType();
	var nlobjContext = nlapiGetContext();	
    var enableExpenseVBIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_expense_vb_int');

	if (recType == 'vendor' && enableExpenseVBIntegration == 'T')
	{
		var multiCurrency = nlobjContext.getFeature('MULTICURRENCY'); 
    	var mapToParentVendor = nlapiGetFieldValue('custentity_oa_map_to_parent_vendor');	
		
		// if we are exporting vendors as users and using the expense report to vendor bill integration
		// and this is a multi-currency, set the proper currency to create expense reports in OpenAir
		if (multiCurrency === true)
		{
			var parentVendor = nlapiGetFieldValue('custentity_oa_vendor_parent');	
			if (parentVendor != null && parentVendor != '' && parentVendor != 'F' && mapToParentVendor == 'T')
			{
				var parentVendorCurrency = nlapiLookupField('vendor', parentVendor, 'currency');
				nlapiSetFieldValue('custentity_oa_vendor_user_currency', parentVendorCurrency);
			}
			else 
			{
				var vendorCurrency = nlapiGetFieldValue('currency');	
				nlapiSetFieldValue('custentity_oa_vendor_user_currency', vendorCurrency);			
			}	
		}
	}
}
// client script function to enable/disable vendor fields on initial page load
function setVendorFieldsInit()
{
	var recType = nlapiGetRecordType();	
	var nlobjContext = nlapiGetContext();	
	var enableExpenseVBIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_expense_vb_int');
    var enablePOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_po_integration');
    var enableVBtoOAPOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
	
	if (recType == 'vendor')
	{
		if (nlapiGetFieldValue('custentity_oa_export_to_openair') == 'T' && enableExpenseVBIntegration == 'T')
		{
			nlapiDisableField('custentity_oa_vendor_user_currency', false);
			nlapiDisableField('custentity_oa_map_to_parent_vendor', false);
			nlapiDisableField('custentity_oa_expense_to_vendorbill', false);
			nlapiDisableField('custentity_oa_vendor_tax_nexus', false);
			nlapiDisableField('custentity_oa_vendor_parent', false);
			
			// additional custom field to check whether vendor should be exported as an OpenAir user or vendor
			if (enablePOIntegration == 'T' || enableVBtoOAPOIntegration == 'T')
			{
				nlapiDisableField('custentity_oa_user_or_vendor', false);				
			}
			else 
			{
				nlapiDisableField('custentity_oa_user_or_vendor', true);
			}
		}
		else 
		{
			nlapiDisableField('custentity_oa_vendor_user_currency', true);
			nlapiDisableField('custentity_oa_map_to_parent_vendor', true);
			nlapiDisableField('custentity_oa_expense_to_vendorbill', true);
			nlapiDisableField('custentity_oa_vendor_tax_nexus', true);
			nlapiDisableField('custentity_oa_vendor_parent', true);			
			nlapiDisableField('custentity_oa_user_or_vendor', true);	
		}
	}
}

// client script function to enable/disable vendor fields based on export to OpenAir
function setVendorFieldsClient(type, name)
{
	var recType = nlapiGetRecordType();	
	var nlobjContext = nlapiGetContext();	
	var enableExpenseVBIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_expense_vb_int');
    var enablePOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_po_integration');
	var enableVBtoOAPOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
	
	if (recType == 'vendor')
	{
		// hiding, unhiding fields
		if (nlapiGetFieldValue('custentity_oa_export_to_openair') == 'T' && enableExpenseVBIntegration == 'T')
		{
			nlapiDisableField('custentity_oa_vendor_user_currency', false);
			nlapiDisableField('custentity_oa_map_to_parent_vendor', false);
			nlapiDisableField('custentity_oa_expense_to_vendorbill', false);
			nlapiDisableField('custentity_oa_vendor_tax_nexus', false);
			nlapiDisableField('custentity_oa_vendor_parent', false);	
			
			if (enablePOIntegration == 'T' || enableVBtoOAPOIntegration == 'T')
			{
				nlapiDisableField('custentity_oa_user_or_vendor', false);		
			}
						
			// give an alert if added parent vendor
			if (name == 'custentity_oa_vendor_parent' && nlapiGetFieldValue('custentity_oa_vendor_parent') > 0)
			{
				alert("If vendor bills should be created for this parent vendor from OpenAir expense reports, please check the 'Map to Parent Vendor' box.");
			}			
			
			// give an alert to pick vendor or user if necessary 
			if (name == 'custentity_oa_export_to_openair' && (enablePOIntegration == 'T' || enableVBtoOAPOIntegration == 'T') && nlapiGetFieldValue('custentity_oa_user_or_vendor') < 1)
			{
				alert("Be sure to indicate whether this NetSuite vendor should be created as an OpenAir user or vendor.");
			}
			
			// give an alert to pick parent vendor
			if (name == 'custentity_oa_map_to_parent_vendor' && nlapiGetFieldValue('custentity_oa_map_to_parent_vendor') == 'T'  && nlapiGetFieldValue('custentity_oa_vendor_parent') < 1)
			{
				alert("Be sure to indicate the parent vendor for this vendor.");
			}			
			
		}
		else 
		{
			nlapiSetFieldValue('custentity_oa_vendor_user_currency', '', false, true);
			nlapiSetFieldValue('custentity_oa_map_to_parent_vendor', 'F', false, true);
			nlapiSetFieldValue('custentity_oa_expense_to_vendorbill', 'F', false, true);			
			nlapiSetFieldValue('custentity_oa_vendor_tax_nexus', '', false, true);
			nlapiSetFieldValue('custentity_oa_vendor_parent', '', false, true);
			nlapiSetFieldValue('custentity_oa_user_or_vendor', '', false, true);
			
			nlapiDisableField('custentity_oa_vendor_user_currency', true);
			nlapiDisableField('custentity_oa_map_to_parent_vendor', true);
			nlapiDisableField('custentity_oa_expense_to_vendorbill', true);
			nlapiDisableField('custentity_oa_vendor_tax_nexus', true);
			nlapiDisableField('custentity_oa_vendor_parent', true);			
			nlapiDisableField('custentity_oa_user_or_vendor', true);	
		}
	}
}



// client script function to check required vendor fields
function validateVendorClient()
{
	var recType = nlapiGetRecordType();	
	var nlobjContext = nlapiGetContext();	
    var enableExpenseVBIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_expense_vb_int');
    var enablePOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_po_integration');
	var enableVBtoOAPOIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
	var expenseVBIntegrationTax = nlobjContext.getSetting('SCRIPT', 'custscript_oa_expense_vb_tax');
	var exportToOA = nlapiGetFieldValue('custentity_oa_export_to_openair');

	if (recType == 'vendor' && exportToOA == 'T' && enableExpenseVBIntegration == 'T')
	{
		// did we specify a parent vendor?
		var mapToParentVendor = nlapiGetFieldValue('custentity_oa_map_to_parent_vendor');
		var parentVendor = nlapiGetFieldValue('custentity_oa_vendor_parent');
		if (mapToParentVendor == 'T' && parentVendor < 1)
		{
			alert("The 'Map to Parent Vendor' field has been checked but a parent vendor has not been chosen.");
			return false;
		}

		// are we mapping expense reports to vendor bills?
		var createVendorBills = nlapiGetFieldValue('custentity_oa_expense_to_vendorbill');
		var vendorTaxNexus = nlapiGetFieldValue('custentity_oa_vendor_tax_nexus');
		if ((mapToParentVendor == 'T' || parentVendor > 0 || vendorTaxNexus > 0) && createVendorBills != 'T')
		{
			alert("The 'Map Expense Reports to Vendor Bills' field is not checked but fields used only for that OpenAir integration have been picked. Either check the 'Map Expense Reports to Vendor Bills' field or remove values entered for fields specific to the OpenAir expense to vendor bill integration.");
			return false;			
		}
		
		// did we pick whether this should create a user or vendor?
		// this is only required when we are doing both PO and vendor bill integration
		if ((enablePOIntegration == 'T' || enableVBtoOAPOIntegration == 'T') && nlapiGetFieldValue('custentity_oa_user_or_vendor') < 1)
		{
			alert("Please specify whether this vendor should export to OpenAir as a user or vendor.");
			return false;				
		}
		
		// pick the tax nexus field / its required if taxes have been enabled in NS
		if (createVendorBills == 'T' && vendorTaxNexus < 1 && expenseVBIntegrationTax == 'T')
		{
			alert("The 'OpenAir Tax Nexus Type' field is required.");
			return false;
		}
		
		// everything is okay
		return true;
	} else 
	{
		// vendor custom fields used for vendor bill integration / blank them out 
		// if we are not doing vendor bill integration
		nlapiSetFieldValue('custentity_oa_vendor_user_currency', '', false, true);
		nlapiSetFieldValue('custentity_oa_map_to_parent_vendor', 'F', false, true);
		nlapiSetFieldValue('custentity_oa_expense_to_vendorbill', 'F', false, true);			
		nlapiSetFieldValue('custentity_oa_vendor_tax_nexus', '', false, true);
		nlapiSetFieldValue('custentity_oa_vendor_parent', '', false, true);
		nlapiSetFieldValue('custentity_oa_user_or_vendor', '', false, true);
	}
	
	// this is not a vendor for vendor bill integration
	return true;
}


//----------- PROJECT TASK-SPECIFIC METHODS ------------------------

/**
 * If the project task is marked "Export to OpenAir", set the custom fields needed by the integration 
 */
function beforeSubmitSetProjectTaskFields () 
{
	
	var nlobjContext = nlapiGetContext();	
    var enableTaskIntegration = nlobjContext.getSetting('SCRIPT', 'custscript_oa_export_project_task');
	
	var recType = nlapiGetRecordType();
	var exportToOA = nlapiGetFieldValue('custevent_oa_export_to_openair');
	
	// populate some required custom fields on project task save 
	if (enableTaskIntegration == 'T' && recType.toLowerCase() == 'projecttask' && exportToOA == 'T') 
	{
		// set milestone flag if we need it 
		var isMilestone = nlapiGetFieldValue('ismilestone');
		if (isMilestone == 'T') {
			nlapiSetFieldValue('custevent_oa_milestone', 'T', false, true);
		}
		
		// set the task name so that we do not get the full chain name
		var taskName = nlapiGetFieldValue('title');
		nlapiSetFieldValue('custevent_oa_project_task_name', taskName, false, true);
		
	}
}



