/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Apr 2014     Hari Gaddipati	DSG Case: 38866
 *												Validate quantity is not zero for certain item categorires
 *												Set the combined services flag
 *												Set the planned hours and hourly rate on items
 *				15 Aug 2014		Hari Gaddipati	DSG Case: 40842
 *												Comment code to set hourly rate as this is done from approve of sales order
 *
 *				9  Feb 2015     Abith Nitin     Comment clientSaveRecord() record function as it is replaced by user event script with same functionality *											     for the enhancement ENCH0051155 Combined Service Script changes.
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType//rec.setFieldValue('custentity_spk_transaction_vsoe_bundle',SO.getFieldValue('tranisvsoebundle'));
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
/* Replacing function clientSaveRecord of client script to User event Splunk _Set Combined Straight-Line flag
 * @author Abith Nitin
 * @Release Date 13-March-2015   
 * @Release Number  RLSE0050334
 * @version 1.0
 */

/*The script has been modified to populate SalesOrder's line item Hours value to its respective Project's Planned Hours field when projects created manually from sales order line item.
 * And to map the Sales Order Line Item’s Quantity to the Project’s Quantity field and if the project is flagged as a "TAS Bundle", the "Export to OpenAir" should be checked off (even if it is an EDU project)
 * @author Jitendra Singh
 * @Release Date 
 * @Release Number 
 * @version 1.1
 */

/*function clientSaveRecord()//Replaced by user event script with same functionality : RLSE0050334 : Begin
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

			if ((itemCategory == 'Maintenance - New') || (itemCategory == 'Maintenance - Renewal'))
				svcsItemExists = true;

			if (itemCategory == 'CSM')
				psItemExists = true;
		}
	}

	if (termItemExists && (svcsItemExists || psItemExists))
		nlapiSetFieldValue('custbodycombined_services', 'T');

    return true;
}
 RLSE0050334 : End */
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */

/*Start-ENHC0051187: To get the Project column field value(Project Internal ID)*/
var projectInternalIdOnLineInit = '';
function clientLineInit(type) {
	try
	{
		if(type == 'item')
		{
			projectInternalIdOnLineInit = nlapiGetCurrentLineItemValue('item', 'job'); 
		}
	} 
	catch (e) 
	{
		alert('ERROR:'+e.getCode()+':'+e.getDetails());
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}
/*End-ENHC0051187*/

function clientValidateLine(type)
{
	try
	{
		if(type == 'item')
		{
			var itemId = nlapiGetCurrentLineItemValue('item', 'item');
			if (itemId != '' && itemId != null)
			{
				var itemCategory = nlapiLookupField('item', itemId, 'custitem_item_category', 'T');
				if (itemCategory == 'Services' || itemCategory == 'Training')
				{
					itemQuantity = nlapiGetCurrentLineItemValue('item', 'quantity');
					itemQuantity = itemQuantity == null || itemQuantity == '' ? 0 : parseFloat(itemQuantity);
					if (itemQuantity == 0 )
					{
						alert('Quantity cannot be zero for a Services or Professional Services Item');
						return false;
					}
				}
			}

/*Start: Auto populating Planned Hours and Hourly rate on line item.By Jitendra on 30th july 2015*/
				var itemId = nlapiGetCurrentLineItemValue('item', 'item');
				if (itemId != '' && itemId != null)
				{
					var itemHours = nlapiLookupField('item', itemId, 'custitem_hours');
						itemHours = itemHours == null || itemHours == '' ? 0 : parseFloat(itemHours);

					var itemQuantity = nlapiGetCurrentLineItemValue('item', 'quantity');
						itemQuantity = itemQuantity == null || itemQuantity == '' ? 0 : parseFloat(itemQuantity);

					var itemAmount = nlapiGetCurrentLineItemValue('item', 'amount');
						itemAmount = itemAmount == null || itemAmount == '' ? 0 : parseFloat(itemAmount);

					var itemPlannedHours = parseFloat(itemQuantity) * parseFloat(itemHours);
					
					if (parseFloat(itemPlannedHours) > 0)
					{
						var itemHourlyRate = parseFloat(itemAmount) / parseFloat(itemPlannedHours);
							itemHourlyRate = itemHourlyRate.toFixed(2);

						nlapiSetCurrentLineItemValue('item', 'custcol_hourly_rate', itemHourlyRate, true, true);
					}

					nlapiSetCurrentLineItemValue('item', 'custcol_hours', itemPlannedHours, true, true);
				
//					alert('itemHours:'+itemHours+',itemQuantity:'+itemQuantity+',itemAmount:'+itemAmount+',itemHourlyRate:'+itemHourlyRate+',itemPlannedHours:'+itemPlannedHours);
				}
				/*End: Auto populating Planned Hours and Hourly rate on line item.By Jitendra on 30th july 2015*/


			/*Start-ENHC0051187: To set the Planned Hour field value on Project from SalesOrder's line Item. By Jitendra on 17th June 2015*/
			var projectInternalId = nlapiGetCurrentLineItemValue('item', 'job'); 
//			alert('projectInternalIdOnLineInit:projectInternalId='+projectInternalIdOnLineInit+':'+projectInternalId);
			if(projectInternalId)
			{
				if(projectInternalIdOnLineInit != projectInternalId)
				{
					var projectRec = nlapiLoadRecord('job', projectInternalId);
					if(projectRec)
					{
						var SOrder = nlapiGetRecordId();
//						var SOtype = nlapiGetRecordType();
//						var SO = nlapiLoadRecord(SOtype, SOrder);
						var customer = nlapiGetFieldValue('entity');

						var ship_to_cust_type = nlapiGetFieldValue('custbody_ship_to_tier');
						if (ship_to_cust_type ==1)
						{
							var ship_to_cust = nlapiGetFieldValue('custbody_end_user');
						}
						if (ship_to_cust_type ==2)
						{
							var ship_to_cust = nlapiGetFieldValue('custbody_reseller');
						}
						if (ship_to_cust_type ==2)
						{
							var ship_to_cust = nlapiGetFieldValue('custbody_distributor');
						}

						var soItemName = nlapiGetCurrentLineItemText('item', 'item');	
						if (soItemName != null && soItemName != '') 
						{
							// checking the presence of "PS-" element
							var stringval1 = soItemName.search('PS-');

							// checking the presence of "SVCS-" element
							var stringval2 = soItemName.search('SVCS-');

							//For ENHC0051409: checking the presence of "PS-EDU" element
							var stringval3 = soItemName.search('PS-EDU');

							if (stringval1 >= 0 || stringval2 >= 0)
							{
								// setting the value of the "Export to openair" checkbox field to true.
								projectRec.setFieldValue('custentity_oa_export_to_openair', 'T');
								nlapiSubmitField('customer', customer, 'custentity_oa_export_to_openair', 'T');
								nlapiSubmitField('customer', ship_to_cust, 'custentity_oa_export_to_openair', 'T'); //For ENHC0051391
							}
						}

						//For ENHC0051409
						if (stringval3 >= 0) 
						{
							projectRec.setFieldValue('custentity_oa_project_stage', '8');									
						}
						//End for ENHC0051409

						var prjctid = projectRec.getFieldValue('entityid');
						projectRec.setFieldValue('companyname', prjctid);

						var itemAmount = nlapiGetCurrentLineItemValue('item', 'amount');
						var estimatedRevenue = parseFloat(itemAmount);
						projectRec.setFieldValue('estimatedrevenue', estimatedRevenue);

						projectRec.setFieldValue('custentity_project_sales_rep', nlapiGetFieldValue('salesrep'));

						projectRec.setFieldValue('custentity_project_ship_to_customer', ship_to_cust);

						//Start For ENHC0051496 - TAS Bundled products. Check for value of Bundle and Base Bundle Code fields 
						var tasbundle = 'F';
						var bundlecode = nlapiGetCurrentLineItemValue('item', 'custcol_spk_basebundlecode');

						if (bundlecode != null && bundlecode != '') 
						{
							if(prjctid.search(bundlecode) == -1)
							{
								prjctid = bundlecode + ' : ' + prjctid ;//Update project name if Base bundle code has the parent name and check TAS Bundle field
								projectRec.setFieldValue('entityid', prjctid);
							}
							tasbundle = 'T';								
						}
						projectRec.setFieldValue('companyname', prjctid);
						projectRec.setFieldValue('custentity_oa_tas_bundle', tasbundle);
						//End of For ENHC0051496 - TAS Bundled products

						//Changes for ENHC0051428 - Transaction is VSOE Bundle
						//projectRec.setFieldValue('custentity_spk_transaction_vsoe_bundle',nlapiGetFieldValue('tranisvsoebundle')); //Commented out as this item is closed.By Jitendra on 10th July 2015
                        /*Changes for ENHC0051845 by Anchana SV*/
						projectRec.setFieldValue('custentity_spk_proj_salesdistrict',nlapiGetFieldValue('custbody_sales_district'));
						projectRec.setFieldValue('custentity_spk_proj_salestheater',nlapiGetFieldValue('custbody_sales_theater'));
						projectRec.setFieldValue('custentity_spk_proj_subtheater',nlapiGetFieldValue('custbody_sales_region'));
						/*End of Changes for ENHC0051845 Anchana SV */
						var syncid = nlapiGetFieldValue('custbody_sfdc_id');
						if (syncid != '' && syncid != null) 
						{
							projectRec.setFieldValue('custentity_project_sfdc_account_id', syncid);
						}

						var  proStatus= projectRec.getFieldValue('entitystatus');
						if (proStatus == '' || proStatus == null) 
						{
							projectRec.setFieldValue('entitystatus', '4');
						}

						var subs = nlapiGetFieldValue('subsidiary');
						projectRec.setFieldValue('subsidiary', subs);
						projectRec.setFieldValue('custentity_project_sales_order', SOrder);

						var itemHours = nlapiGetCurrentLineItemValue('item', 'custcol_hours');
						projectRec.setFieldValue('custentity_planned_hours', parseFloat(itemHours));

						var combinedServices = nlapiGetFieldValue('custbodycombined_services');
						projectRec.setFieldValue('custentitycombined_services', combinedServices);

						var itemid = nlapiGetCurrentLineItemValue('item', 'item');
						var itemQuantity = nlapiGetCurrentLineItemValue('item', 'quantity');

						/*Start: ENHC0051780: by Jitendra on 25th June 2015
						//Map the Sales Order Line Item’s Quantity to the Project’s Quantity field*/ 
						projectRec.setFieldValue('custentity_quantity', itemQuantity);
						
						var stringval4 = soItemName.search('EDU');
						//If the project is being flagged as a "TAS Bundle", "Export to OpenAir" to be checked off (even if it is an EDU project).
						if((tasbundle == 'T') && (stringval3 >= 0 || stringval4 >= 0))
						{
							projectRec.setFieldValue('custentity_oa_export_to_openair', 'T');
							nlapiSubmitField('customer', customer, 'custentity_oa_export_to_openair', 'T');
							nlapiSubmitField('customer', ship_to_cust, 'custentity_oa_export_to_openair', 'T');
						}
						/*End: ENHC0051780*/
						
						//Begin of changes for Case 38408
						var eduCredits = nlapiLookupField('item', itemid, 'custitem_edu_credits');
						if (eduCredits != null && eduCredits != '' && eduCredits > 0)
						{
							var eduPortion = nlapiLookupField('item', itemid, 'custitem_edu_portion');
							eduPortion = parseFloat(eduPortion) / 100;

							var projectEDUAmount = parseFloat(itemAmount) * parseFloat(eduPortion);
							var projectEDUCredits = parseFloat(itemQuantity) * parseFloat(eduCredits);

							var costPerCredit = parseFloat(0);
							if (projectEDUAmount > 0 && projectEDUCredits > 0){
								costPerCredit = parseFloat(projectEDUAmount) / parseFloat(projectEDUCredits);
							}
							projectRec.setFieldValue('custentity_project_edu_amount', projectEDUAmount);
							projectRec.setFieldValue('custentity_project_edu_credits', projectEDUCredits);
							projectRec.setFieldValue('custentity_project_edu_used', 0);
							projectRec.setFieldValue('custentity_cost_per_credit', costPerCredit);
							projectRec.setFieldValue('custentity_project_sku_name', itemid);
							projectRec.setFieldValue('custentity_project_line_description', nlapiGetCurrentLineItemValue('item', 'custcol_memo'));
						}
						//End of changes for Case 38408

						/*Setting End date on project*/
						var projectStartDate = projectRec.getFieldValue('startdate');
						projectStartDate = nlapiStringToDate(projectStartDate);
						var projectEndDate = nlapiAddMonths(projectStartDate, 12);
						projectEndDate = nlapiAddDays(projectEndDate, -1);
						projectEndDate = nlapiDateToString(projectEndDate);
						projectRec.setFieldValue('enddate', projectEndDate);
						/*Setting End date on project*/

						//Set Planned Hours from SO Line Item's Hour column field value.
						projectRec.setFieldValue('custentity_planned_hours', nlapiGetCurrentLineItemValue('item', 'custcol_hours'));

						//Submit the Project Record
						var proRecId = nlapiSubmitRecord(projectRec);

						if(proRecId)
						{
							nlapiSetCurrentLineItemValue('item', 'custcol_projnamecopy', 'Done');
						}
					}
				}
			}
			/*End-ENHC0051187: To set the Planned Hour field value on Project from SalesOrder's line Item.*/
		}
		return true;
	} 
	catch (e) 
	{
		alert('ERROR:'+e.getCode()+':'+e.getDetails());
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}
/*
function clientPostSourcing(type, name)
{
	if(type == 'item' && name == 'item')
	{
		var itemId = nlapiGetCurrentLineItemValue('item', 'item');
		if (itemId != '' && itemId != null)
		{
			var itemHours = nlapiLookupField('item', itemId, 'custitem_hours');
				itemHours = itemHours == null || itemHours == '' ? 0 : parseFloat(itemHours);

			var itemQuantity = nlapiGetCurrentLineItemValue('item', 'quantity');
				itemQuantity = itemQuantity == null || itemQuantity == '' ? 0 : parseFloat(itemQuantity);

			var itemAmount = nlapiGetCurrentLineItemValue('item', 'amount');
				itemAmount = itemAmount == null || itemAmount == '' ? 0 : parseFloat(itemAmount);

			var itemPlannedHours = parseFloat(itemQuantity) * parseFloat(itemHours);

			if (parseFloat(itemPlannedHours) > 0)
			{
				var itemHourlyRate = parseFloat(itemAmount) / parseFloat(itemPlannedHours);
					itemHourlyRate = itemHourlyRate.toFixed(2);

				nlapiSetCurrentLineItemValue('item', 'custcol_hourly_rate', itemHourlyRate, true, true);
			}

			nlapiSetCurrentLineItemValue('item', 'custcol_hours', itemPlannedHours, true, true);
		}
	}
}

function pageInit()
{
	if (nlapiGetRecordId() == '')
	{
		for (var intPos = 1; intPos <= nlapiGetLineItemCount('item'); intPos++)
		{
			var itemId = nlapiGetLineItemValue('item', 'item', intPos);
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

					nlapiSetLineItemValue('item', 'custcol_hourly_rate', intPos, itemHourlyRate);
				}

				nlapiSetLineItemValue('item', 'custcol_hours', intPos, itemPlannedHours);
			}
		}
	}
}
 */