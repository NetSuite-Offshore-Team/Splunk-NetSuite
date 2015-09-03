/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 May 2014     Hari Gaddipati	DSG Case: 38408
 * 												Create projects for lines on cash sales
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function afterSubmitCashSales(type)
{
	if (type == 'create' || type  == 'edit')
	{
		var recCashSale = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		var itemCount = recCashSale.getLineItemCount('item');       
		var customerNumber = recCashSale.getFieldValue('entity');
		var cashSaleNum = recCashSale.getFieldValue('tranid');
		var salesRep = recCashSale.getFieldText('salesrep');
		var combinedServices = recCashSale.getFieldValue('custbodycombined_services');
		for (var intPos = 1; intPos <= itemCount; intPos++)
		{
			var itemProjectId = recCashSale.getLineItemValue('item', 'job', intPos);
			if (itemProjectId != null && itemProjectId != '')
				continue;
			
			// Checking the line item which qualifies for creating a project
			var itemId = recCashSale.getLineItemValue('item', 'item', intPos);
			var projectCheck = recCashSale.getLineItemValue('item', 'custcol_create_job', intPos);
			var projectName = recCashSale.getLineItemText('item', 'item', intPos);
			if (projectName != '' && projectName != null) 
			{
				var splitProjectName = projectName.split(':');
				var projectId = splitProjectName[1] + ' ' + '(C' + cashSaleNum + ')';
				
				var itemHours = recCashSale.getLineItemValue('item', 'custcol_hours', intPos);
				var itemQuantity = recCashSale.getLineItemValue('item', 'quantity', intPos);
				var itemAmount = recCashSale.getLineItemValue('item', 'amount', intPos);
		
				if (projectCheck == 'T') 
				{
					// Creating a new project record and setting the fields in the record.
			        var recProject = nlapiCreateRecord('job');
			        recProject.setFieldValue('entityid', projectId);
			        recProject.setFieldValue('companyname', projectId);
			        recProject.setFieldValue('parent', customerNumber);
					var estimatedRevenue = parseFloat(itemAmount);
					recProject.setFieldValue('estimatedrevenue', estimatedRevenue);
					recProject.setFieldText('custentity_project_sales_rep', salesRep);
					recProject.setFieldValue('custentity_project_ship_to_customer', customerNumber);
					var syncId = recCashSale.getFieldValue('custbody_sfdc_id');
					if (syncId != '' && syncId != null) 
					{
						recProject.setFieldValue('custentity_project_sfdc_account_id', syncId);
					}
					
					recProject.setFieldValue('custentity_oa_export_to_openair', 'T');
					nlapiSubmitField('customer', customerNumber, 'custentity_oa_export_to_openair', 'T');
					
					recProject.setFieldText('entitystatus', 'Pending');
					recProject.setFieldText('subsidiary', recCashSale.getFieldText('subsidiary'));
					recProject.setFieldValue('custentity_project_sales_order', recCashSale.getId());
					recProject.setFieldValue('custentity_planned_hours', parseFloat(itemHours));
					recProject.setFieldValue('custentitycombined_services', combinedServices);
					
					var eduCredits = nlapiLookupField('item', itemId, 'custitem_edu_credits');
					if (eduCredits != null && eduCredits != '' && eduCredits > 0)
					{
						var eduPortion = nlapiLookupField('item', itemId, 'custitem_edu_portion');
						eduPortion = parseFloat(eduPortion) / 100;
		
						var projectEDUAmount = parseFloat(itemAmount) * parseFloat(eduPortion);
						var projectEDUCredits = parseFloat(itemQuantity) * parseFloat(eduCredits);
						
						var costPerCredit = parseFloat(0);
						if (projectEDUAmount > 0 && projectEDUCredits > 0)
							costPerCredit = parseFloat(projectEDUAmount) / parseFloat(projectEDUCredits);
						
						recProject.setFieldValue('custentity_project_edu_amount', projectEDUAmount);
						recProject.setFieldValue('custentity_project_edu_credits', projectEDUCredits);
						recProject.setFieldValue('custentity_project_edu_used', 0);
						recProject.setFieldValue('custentity_cost_per_credit', costPerCredit);
						recProject.setFieldValue('custentity_project_sku_name', itemId);
						recProject.setFieldValue('custentity_project_line_description', recCashSale.getLineItemValue('item', 'custcol_memo', intPos));
					}
					try 
					{
						//Updating the "Project Name Copy" field to check if the item is eligible for creating a project
						recCashSale.setLineItemValue('item', 'custcol_projnamecopy', intPos, 'Done');
		 
						var recId = nlapiSubmitRecord(recProject);  // Submitting the newly created project record.
						if (recId) 
						{
							recCashSale.setLineItemValue('item', 'job', intPos, recId);
						   
							var projectStartDate = nlapiLookupField('job', recId, 'startdate');
					   	   		projectStartDate = nlapiStringToDate(projectStartDate);
					   
					   	   	var projectEndDate = nlapiAddMonths(projectStartDate, 12);
					   	   		projectEndDate = nlapiAddDays(projectEndDate, -1);
					   	   		projectEndDate = nlapiDateToString(projectEndDate);
		
						   nlapiSubmitField('job', recId, 'enddate', projectEndDate);
						}		 
					} 
					catch (e) 
					{
						nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
					}
				}                            
			}
		}
		
		nlapiSubmitRecord(recCashSale, true); // Submitting the Cash Sale
	}
}