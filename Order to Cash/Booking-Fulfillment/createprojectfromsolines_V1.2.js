/**
 * When the approve button is clicked on the sales order page, projects will automatically get created.
 * @param (string) stEventType After Submit
 * @author Dinanath Bablu
 * @Release Date:13th dec2013
 * @Enhancement: ENHC0010650
 * @Release Number RLSE0050042
 * @version 1.0
 * Added a field to capture projects for sending email
 * @Release Date 16th Jan 2014
 * @Release Number RLSE0050112
 * @version 2.0
 * 03/28/2014		Hari Gaddipati		DSG Case 38408 LMS 4 EDU - fields/script/workflow
 * 04/14/2014		Hari Gaddipati		DSG Case 38866 OpenAir/NS Integration changes
 * 07/03/2014		Hari Gaddipati		DSG Case 40115 Projects not auto creating when same item exists more than once
 */
/*
 * On approve sales order record, script will check if Order is created from Quote or having FPX ID then only projects will be created on Line items.
 * @ AUTHOR : Rahul
 * @Release Date 28th Feb 2015
 * @Release Number RLSE0050312
 * @Project Number PRJ0010731  
 * @version 3.0
 */
/*
 * ENHC0051391 to Export Project's end user from NetSuite to OpenAir and ENHC0051409 to Set Default values in OpenAir 
 * @ AUTHOR : Biju Dandapani and  Maria Auxilia
 * @Release Date 28th Feb 2015
 * @Release Number RLSE0050312
 * @Project Number PRJ0010731  
 * @version 3.1
 */
/*
 * ENHC0051496 to update projects for TAS Bundled products
 * @ AUTHOR : Maria Auxilia
 * @Release Date 13th Mar 2015
 * @Release Number RLSE0050322
 * @Project Number ENHC0051496   
 * @version 3.2
 */
/*
 * The Script is modified to check off "Export to OpenAir" on the project record for projects whose project IDs start with "SVCS-".
 * And to map the Sales Order Line Item’s Quantity to the Project’s Quantity field and if the project is flagged as a "TAS Bundle", the "Export to OpenAir" should be checked off (even if it is an EDU project) 
 * @ AUTHOR : Jitendra Singh
 * @Release Date 
 * @Release Number 
 * @Project Number ENHC0051187: SVCS Projects Should Export to OpenAir Automatically, ENHC0051780: Misc Project Creation Changes  
 * @version 3.3
 */
/*
 * ENHC0051428: Added code to set the Transaction is VSOE bundle Check box in Project record from the Sales Order.
 * @ AUTHOR : Anchana SV
 * @Release Date 
 * @Release Number 
 * @Project Number ENHC0051428   
 * @version 3.4
 */

function ProjectCreateAfterSubmit(type, form)
{
	try 
	{
		var SOrder = nlapiGetRecordId();
		var SOtype = nlapiGetRecordType();
		var count = nlapiGetLineItemCount('item');       
		var Created = nlapiGetFieldValue('createdfrom');	
		var fpxid = nlapiGetFieldValue('custbody_spk_fpx_id');			
		if (SOrder != '' && SOrder != null) 
		{ 
			// Modified for CPQ , if SO has QuoteID or FPX ID then only Projects are created on Line items
			if(Created || fpxid) {
				// If line item count is more than 40 line items.
				if (count > 40) 
				{
					var params = new Array();
					params['custscriptcustscript_so_id'] = SOrder;
					var status = nlapiScheduleScript('customscript_create_project_frm_solineue', 'customdeploy_create_project_frm_solineue', params);
				}
				else 
				{
					// Fetching values from Sales order record.
					var SO = nlapiLoadRecord(SOtype, SOrder);
					var status = SO.getFieldValue('status');
					nlapiLogExecution('DEBUG', 'status is', status);
					var customer = SO.getFieldValue('entity');
					//Start of changes for ENHC0051391 : 02/19/2015 Biju Dandapani 
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
					nlapiLogExecution('DEBUG', 'Ship To Customer is', ship_to_cust);
					//End of changes for ENHC0051391 02/19/2015 Biju Dandapani
					var subs = SO.getFieldText('subsidiary');
					var ordernum = SO.getFieldValue('tranid');
					var salesrep = SO.getFieldValue('salesrep');
					var combinedServices = SO.getFieldValue('custbodycombined_services');
					for (var i = 1; i <= count; i++) 
					{
						// Checking the line item which qualifies for creating a project
						var itemid = SO.getLineItemValue('item', 'item', i);
						nlapiLogExecution('DEBUG', 'id is', itemid);
						var projectcheck = SO.getLineItemValue('item', 'custcol_create_job', i);
						// Start of changes for ENHC0051496 - TAS Bundled products. Check for value of Bundle and Base Bundle Code fields 
						var tasbundle = 'F';
						var bundlecheck = SO.getLineItemValue('item', 'custcol_bundle', i);
						var bundlecode = SO.getLineItemValue('item', 'custcol_spk_basebundlecode', i);
						nlapiLogExecution('DEBUG', 'bundlecode is', bundlecode);
						nlapiLogExecution('DEBUG', 'bundlecheck is', bundlecheck);
						nlapiLogExecution('DEBUG', 'cs is', combinedServices);
						var prjctname = SO.getLineItemText('item', 'item', i);
						if (prjctname != '' && prjctname != null) 
						{
							var Splitprjctname = prjctname.split(':');
							var prjctid = Splitprjctname[1] + ' ' + '(' + ordernum + ')';
							nlapiLogExecution('DEBUG', 'Prjct name is', prjctid);
							nlapiLogExecution('DEBUG', 'Prjct length is', prjctid.length);

							//Begin of changes for DSG Case: 40115
							var filters =  new Array();
							filters.push(new nlobjSearchFilter('entityid', null, 'contains', prjctid.trim()));
							nlapiLogExecution('DEBUG', 'Prjct length is', prjctid.trim().length);

							var columns = new Array();
							var srchColumnEntity = new nlobjSearchColumn('entityid');
							srchColumnEntity.setSort(true);
							columns.push(srchColumnEntity);

							var projectList = nlapiSearchRecord('job', null, filters, columns);
							if (projectList != null && projectList.length > 0)
							{
								nlapiLogExecution('DEBUG', 'Inside project search : ', projectList.length);
								var projectName = projectList[0].getValue('entityid');
								nlapiLogExecution('DEBUG', 'project name : ', projectName);

								var nameIndex = projectName.indexOf(prjctid.trim());
								var projectNameSubstr = projectName.substr(nameIndex, projectName.length - nameIndex);

								var projectNameArray = projectNameSubstr.split(')');
								if (projectNameArray[1] == '' || projectNameArray[1] == null)
								{
									prjctid = prjctid + '-2';
								}
								else
								{
									var projectNameArray = projectNameArray[1].split('-');
									var projectIdSuffix = projectNameArray[1];
									if (projectIdSuffix != '' && projectIdSuffix != null)
									{
										if (parseFloat(projectIdSuffix) > 0)
										{
											projectIdSuffix++;
											prjctid = prjctid + '-' + projectIdSuffix;
										}
									}
								}
							}
							//End of changes for DSG Case: 40115
							// if ()
							nlapiLogExecution('DEBUG', 'Prjct name after search is', prjctid);

							var itemHours = SO.getLineItemValue('item', 'custcol_hours', i);
							var itemQuantity = SO.getLineItemValue('item', 'quantity', i);
							var itemAmount = SO.getLineItemValue('item', 'amount', i);

							var stringval1 = prjctname.search('PS-');
							// Start Changes for ENHC0051409  : 02/19/2015 Maria Auxilia
							var stringval2 = prjctname.search('PS-EDU');
							// end of Changes for ENHC0051409  : 02/19/2015 Maria Auxilia

							// Start Changes for ENHC0051187  : 27th May 2015 Jitendra Singh
							var stringSVCS = prjctname.search('SVCS-');
							// End of Changes for ENHC0051187  : 27th May 2015 Jitendra Singh

							nlapiLogExecution('DEBUG', 'IN', stringval1);
							nlapiLogExecution('DEBUG', 'IN', stringval2);
							nlapiLogExecution('DEBUG', 'stringSVCS', stringSVCS);
							nlapiLogExecution('DEBUG', 'status OUT ' + status, ' projectcheck ' + projectcheck);
							nlapiLogExecution('DEBUG','AGP','1' + i);
							//Changes for ENHC0051496 - TAS Bundled products - Update project name if Base bundle code has the parent name and check TAS Bundle field
							if (bundlecode != null) 
							{
								if(prjctid.search(bundlecode) == -1)
								{
									prjctid = bundlecode + ' : ' + prjctid ;
								}
								tasbundle = 'T';								
							}
							//If Bundle !=Yes then qualifies to be sent to OpenAir
							if (bundlecheck != 'T')
							{
								if (status == 'Pending Billing' && projectcheck == 'T') 
								{

									// Creating a new project record and setting the fields in the record.
									nlapiLogExecution('DEBUG', 'status IN' + status, ' projectcheck ' + projectcheck);
									var rec = nlapiCreateRecord('job');
									rec.setFieldValue('entityid', prjctid);
									rec.setFieldValue('companyname', prjctid);
									rec.setFieldValue('parent', customer);
									var estimatedRevenue = parseFloat(itemAmount);
									rec.setFieldValue('estimatedrevenue', estimatedRevenue);
									rec.setFieldValue('custentity_project_sales_rep', salesrep);
									rec.setFieldValue('custentity_project_ship_to_customer', ship_to_cust);  //Changes for ENHC0051391 :02/19/2015 Biju Dandapani
									//Changes for ENHC0051496 - TAS Bundled products
									rec.setFieldValue('custentity_oa_tas_bundle', tasbundle);
									//End of Changes for ENHC0051496 - TAS Bundled products
									
//									Changes for ENHC0051428 - Transaction is VSOE Bundle
									//rec.setFieldValue('custentity_spk_transaction_vsoe_bundle',SO.getFieldValue('tranisvsoebundle')); //Commented out as this item is closed.By Jitendra on 10th July 2015
									//End of Changes for ENHC0051428 - Transaction is VSOE Bundle
									/*Changes for ENHC0051845 by Anchana SV*/
									rec.setFieldValue('custentity_spk_proj_salesdistrict',SO.getFieldValue('custbody_sales_district'));
									rec.setFieldValue('custentity_spk_proj_salestheater',SO.getFieldValue('custbody_sales_theater'));
									rec.setFieldValue('custentity_spk_proj_subtheater',SO.getFieldValue('custbody_sales_region'));
									/*End of Changes for ENHC0051845 Anchana SV */
									var syncid = SO.getFieldValue('custbody_sfdc_id');
									if (syncid != '' && syncid != null) 
									{
										rec.setFieldValue('custentity_project_sfdc_account_id', syncid);
									}

									/* START for ENHC0051187
									 * Added the condition "stringSVCS >= 0",if project IDs start with "SVCS-" 
									 * then check off "Export to OpenAir" on the project record.
									 * for ENHC0051187  : 27th May 2015 Jitendra Singh
									 */
									if (stringval1 >= 0 || stringSVCS >= 0) 
									{
										rec.setFieldValue('custentity_oa_export_to_openair', 'T');
										nlapiSubmitField('customer', customer, 'custentity_oa_export_to_openair', 'T');
										nlapiSubmitField('customer', ship_to_cust, 'custentity_oa_export_to_openair', 'T'); //Changes for ENHC0051391 :02/19/2015 Biju Dandapani
									}
									/*END for ENHC0051187*/

									//Changes for ENHC0051409 : 02/19/2015 Maria Auxilia
									if (stringval2 >= 0) 
									{
										rec.setFieldValue('custentity_oa_project_stage', '8');									
									}
									//End of Changes for ENHC0051409 : 02/19/2015 Maria Auxilia
									rec.setFieldText('entitystatus', 'Pending');
									rec.setFieldText('subsidiary', subs);
									rec.setFieldValue('custentity_project_sales_order', SOrder);
									rec.setFieldValue('custentity_planned_hours', parseFloat(itemHours));
									rec.setFieldValue('custentitycombined_services', combinedServices);

									/*Start: ENHC0051780: by Jitendra on 25th June 2015
									//Map the Sales Order Line Item’s Quantity to the Project’s Quantity field*/ 
									rec.setFieldValue('custentity_quantity', itemQuantity);
									var stringval3 = prjctname.search('EDU');
									//If the project is being flagged as a "TAS Bundle", "Export to OpenAir" to be checked off (even if it is an EDU project).
									if((tasbundle == 'T') && (stringval2 >= 0 || stringval3 >= 0))
									{
										rec.setFieldValue('custentity_oa_export_to_openair', 'T');
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
										rec.setFieldValue('custentity_project_edu_amount', projectEDUAmount);
										rec.setFieldValue('custentity_project_edu_credits', projectEDUCredits);
										rec.setFieldValue('custentity_project_edu_used', 0);
										rec.setFieldValue('custentity_cost_per_credit', costPerCredit);
										rec.setFieldValue('custentity_project_sku_name', itemid);
										rec.setFieldValue('custentity_project_line_description', SO.getLineItemValue('item', 'custcol_memo', i));
									}
									//End of changes for Case 38408
									try 
									{
										// Updating the "Project Name Copy" field to check if the item is eligible for creating a project
										SO.setLineItemValue('item', 'custcol_projnamecopy',i, 'Done');

										var recid = nlapiSubmitRecord(rec);  // Submitting the newly created project record.
										nlapiLogExecution('DEBUG', ' Job recid', recid);
										if (recid) 
										{
											SO.setLineItemValue('item', 'job',i, recid);

											var projectStartDate = nlapiLookupField('job', recid, 'startdate');
											projectStartDate = nlapiStringToDate(projectStartDate);

											var projectEndDate = nlapiAddMonths(projectStartDate, 12);
											projectEndDate = nlapiAddDays(projectEndDate, -1);
											projectEndDate = nlapiDateToString(projectEndDate);

											nlapiSubmitField('job', recid, 'enddate', projectEndDate);
										}		 
									} 
									catch (e) 
									{
										nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
									}

								}                            
							}
						}
					}

					var soid = nlapiSubmitRecord(SO, true); // Submitting the sales order
					nlapiLogExecution('DEBUG', 'rec id is', soid);
				}
			}
		}
	} 
	catch (e) 
	{
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}