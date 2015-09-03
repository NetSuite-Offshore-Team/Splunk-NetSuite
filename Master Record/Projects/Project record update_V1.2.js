/**
 * The script aims to check the "Export to openair" checkbox field when the project is of professional services type i.e 
  the project name starts with "PS-".
 * @param (string) stEventType After Submit
 * @author Dinanath Bablu
 * @Release Date:13th dec2013
 * @Enhancement: ENHC0010650
 * @Release Number RLSE0050042 
 * @version 1.0
 */

/**
 * The script has been modified to check the "Export to openair" checkbox field when the project is of 'SVCS-' type i.e the project name starts with "SVCS-".
 * and if the project is flagged as a "TAS Bundle" "Export to OpenAir" would be checked off (even if it is an EDU project).
 * The script has been modified to populate all field values same on project as doing in automation process,if project created manually from 'Create Projects from Sales Orders' Page script.
 * @author Jitendra Singh
 * @Release Date:
 * @Enhancement: ENHC0051187,ENHC0051780
 * @Release Number  
 * @version 1.1
 */

/**
 * The script has been modified to update Project Record's Status to "Completed" when Percent Complete is >= 100%
 * @author Jitendra Singh
 * @Release Date:
 * @Enhancement: ENHC0051858
 * @Release Number  
 * @version 1.2
 */

function projectonsubmit(type)
{
	try
	{
		if(type == 'create' || type == 'edit')
		{
			var projectid = nlapiGetRecordId();
			if (projectid != '' && projectid != null) 
			{
				// Loading the project record
				var projectrec = nlapiLoadRecord('job', projectid);
				// Fetching the project name from the Project ID and Project Name field  
				var projectname = projectrec.getFieldValue('entityid');
				var compname = projectrec.getFieldValue('companyname');		
				if (projectname != null && projectname != '') 
				{
					// checking the presence of "PS-" element
					var stringval1 = projectname.search('PS-');
					nlapiLogExecution('DEBUG', 'IN', stringval1);
					var stringval2 = projectname.search('Professional Services');
					var stringval3 = -1;
					var stringval4 = -1;
					if(compname != null && compname != '')
					{
						stringval3 = compname.search('PS-');
						stringval4 = compname.search('Professional Services');
					}

					/*Start-ENHC0051187: by Jitendra on 16th June 2015*/
					var stringval5 = projectname.search('SVCS-');
					if(compname != null && compname != '')
					{
						var stringval6 = compname.search('SVCS-');
					}
					/*End-ENHC0051187*/

					if (stringval1 >= 0 || stringval2 >= 0 || stringval3 >= 0 || stringval4 >= 0 || stringval5 >=0 || stringval6 >=0) /*ENHC0051187: Included '|| stringval5 >=0 || stringval6 >=0' in condition by Jitendra on 16th June 2015*/
					{
						// setting the value of the "Export to openair" checkbox field to true.
						projectrec.setFieldValue('custentity_oa_export_to_openair', 'T');
						nlapiLogExecution('DEBUG', 'IN', projectrec.getFieldValue('custentity_oa_export_to_openair'));					
					}

					/*Start: ENHC0051780: by Jitendra on 25th June 2015*/
					//If the project is being flagged as a "TAS Bundle", "Export to OpenAir" to be checked off (even if it is an EDU project).
					var tasbundle = projectrec.getFieldValue('custentity_oa_tas_bundle');
					var stringval7 = projectname.search('EDU');
					//If the project is being flagged as a "TAS Bundle", "Export to OpenAir" to be checked off (even if it is an EDU project).
					if((tasbundle == 'T') && (stringval7 >= 0))
					{
						projectrec.setFieldValue('custentity_oa_export_to_openair', 'T');
					}
					/*End: ENHC0051780*/

					/*Start: Populating project values when project manually created from 'Create Projects from Sales Orders' Page*/
					//By Jitendra on 10th July 2015
					var SOrder = projectrec.getFieldValue('custentity_project_sales_order');
					nlapiLogExecution('DEBUG', 'SOrder', SOrder);
					if(SOrder)
					{
						var SO = nlapiLoadRecord('salesorder', SOrder);
						var customer = SO.getFieldValue('entity');

						var ship_to_cust_type = SO.getFieldValue('custbody_ship_to_tier');
						if (ship_to_cust_type ==1)
						{
							var ship_to_cust = SO.getFieldValue('custbody_end_user');
						}
						if (ship_to_cust_type ==2)
						{
							var ship_to_cust = SO.getFieldValue('custbody_reseller');
						}
						if (ship_to_cust_type ==2)
						{
							var ship_to_cust = SO.getFieldValue('custbody_distributor');
						}

						if (stringval1 >= 0 || stringval5 >= 0)
						{
							// setting the value of the "Export to openair" checkbox field to true.
							projectrec.setFieldValue('custentity_oa_export_to_openair', 'T');
							nlapiSubmitField('customer', customer, 'custentity_oa_export_to_openair', 'T');
							nlapiSubmitField('customer', ship_to_cust, 'custentity_oa_export_to_openair', 'T'); //For ENHC0051391
						}

						//For ENHC0051409
						var stringval8 = projectname.search('PS-EDU');
						if (stringval8 >= 0) 
						{
							projectrec.setFieldValue('custentity_oa_project_stage', '8');									
						}
						//End for ENHC0051409

						var soItemCount = SO.getLineItemCount('item');
						for(var i=1;i<=soItemCount;i++)
						{
							var itemid = SO.getLineItemValue('item', 'item', i);
							var tasbundle = 'F';
							var projectNameSO = SO.getLineItemText('item', 'job',i);
							if(projectNameSO.trim() == projectname.trim())
							{
								nlapiLogExecution('DEBUG', 'itemNameProj:itemNameSO', projectname+':'+projectNameSO);
								var bundlecode = SO.getLineItemValue('item', 'custcol_spk_basebundlecode', i);
								var itemHours = SO.getLineItemValue('item', 'custcol_hours', i);
								var itemQuantity = SO.getLineItemValue('item', 'quantity', i);

								//Start For ENHC0051496 - TAS Bundled products. Check for value of Bundle and Base Bundle Code fields 
								var tasbundle = 'F';
								var bundlecode = SO.getLineItemValue('item', 'custcol_spk_basebundlecode',i);

								if (bundlecode != null && bundlecode != '') 
								{
									if(projectname.search(bundlecode) == -1)
									{
										projectname = bundlecode + ' : ' + projectname ;//Update project name if Base bundle code has the parent name and check TAS Bundle field
										projectrec.setFieldValue('entityid', projectname);	
									}
									tasbundle = 'T';								
								}
projectrec.setFieldValue('companyname', projectname);
								projectrec.setFieldValue('custentity_oa_tas_bundle', tasbundle);
								//End of For ENHC0051496 - TAS Bundled products

								projectrec.setFieldValue('custentity_planned_hours', parseFloat(itemHours));

								/*Start: ENHC0051780: by Jitendra on 25th June 2015
							//Map the Sales Order Line Itemâ€™s Quantity to the Projectâ€™s Quantity field*/ 
								projectrec.setFieldValue('custentity_quantity', itemQuantity);

								var stringval7 = projectname.search('EDU');
								//If the project is being flagged as a "TAS Bundle", "Export to OpenAir" to be checked off (even if it is an EDU project).
								if((tasbundle == 'T') && (stringval8 >= 0 || stringval7 >= 0))
								{
									projectrec.setFieldValue('custentity_oa_export_to_openair', 'T');
									nlapiSubmitField('customer', customer, 'custentity_oa_export_to_openair', 'T');
									nlapiSubmitField('customer', ship_to_cust, 'custentity_oa_export_to_openair', 'T');
								}
								/*End: ENHC0051780*/

								var itemAmount = SO.getLineItemValue('item', 'amount', i);
								var itemDescription = SO.getLineItemValue('item', 'custcol_memo', i);

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
									projectrec.setFieldValue('custentity_project_edu_amount', projectEDUAmount);
									projectrec.setFieldValue('custentity_project_edu_credits', projectEDUCredits);
									projectrec.setFieldValue('custentity_project_edu_used', 0);
									projectrec.setFieldValue('custentity_cost_per_credit', costPerCredit);
									projectrec.setFieldValue('custentity_project_sku_name', itemid);
									projectrec.setFieldValue('custentity_project_line_description', itemDescription);
								}
								//End of changes for Case 38408

								// Updating the "Project Name Copy" field to check if the item is eligible for creating a project
								SO.setLineItemValue('item', 'custcol_projnamecopy',i, 'Done');
								var soid = nlapiSubmitRecord(SO, true); // Submitting the sales order
								nlapiLogExecution('DEBUG', 'soid', soid);

								break;
							}
						}

						projectrec.setFieldValue('custentity_project_ship_to_customer', ship_to_cust);

						var combinedServices = SO.getFieldValue('custbodycombined_services');
						projectrec.setFieldValue('custentitycombined_services', combinedServices);
						
						/*Changes for ENHC0051845 by Anchana SV*/
						projectrec.setFieldValue('custentity_spk_proj_salesdistrict',SO.getFieldValue('custbody_sales_district'));
						projectrec.setFieldValue('custentity_spk_proj_salestheater',SO.getFieldValue('custbody_sales_theater'));
						projectrec.setFieldValue('custentity_spk_proj_subtheater',SO.getFieldValue('custbody_sales_region'));
						projectrec.setFieldValue('custentity_spk_inactivehidden',projectrec.getFieldValue('isinactive'));
						/*End of Changes for ENHC0051845 Anchana SV */

						/*Start: ENHC0051858 to update status if project to "Completed" if percentcomplete >=100% by Jitendra on */
						var perCompleted = projectrec.getFieldValue('percentcomplete');
						if(perCompleted)
						{
							var perCompletedSplit = perCompleted.split('%')[0];
							var perCompletedFloat = parseFloat(perCompletedSplit);
							if(perCompletedFloat >= 100.0)
							{
								projectrec.setFieldText('entitystatus', 'Completed');
							}
							else
							{
								projectrec.setFieldText('entitystatus', 'Pending');
							}
						}
						/*End: ENHC0051858 to update status if project to "Completed" if percentcomplete >=100%*/
						
						
						/*Setting End date on project*/
						var projectStartDate = projectrec.getFieldValue('startdate');
						projectStartDate = nlapiStringToDate(projectStartDate);
						var projectEndDate = nlapiAddMonths(projectStartDate, 12);
						projectEndDate = nlapiAddDays(projectEndDate, -1);
						projectEndDate = nlapiDateToString(projectEndDate);
						projectrec.setFieldValue('enddate', projectEndDate);
						/*Setting End date on project*/
					}
					/*End: Populating project values when project manually created from 'Create Projects from Sales Orders' Page*/
				}
				try 
				{
					var prjctid = nlapiSubmitRecord(projectrec, true);
					nlapiLogExecution('DEBUG', 'prjctid', prjctid);
				} 					
				catch (e) 
				{
					nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				}
			}
		}
	} 
	catch (e) 
	{
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}