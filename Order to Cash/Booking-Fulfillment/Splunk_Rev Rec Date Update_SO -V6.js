/**
 * Changing the Rev Rec Start and End Date based on the License Start and End Date.
 * @author Dinanath Bablu
 * @Release Date 15th Feb 2014
 * @Release Number RLSE0050124
 * @version 1.0
 *
 * // Modified
 * Including 2 parameters in the script which will help us to Override Revenue Recognition dates for different Item Categories without changing the script.
 * We only need to include the item categories and its id in the script parameters.
 * @author Rahul Shaw
 * @Release Date 22nd Nov 2014
 * @Release Number RLSE0050297
 * @version 2.0
 */
/*
* On record Sales order create/edit/approve/Fulfilment, the License and Rev Rec Dates are updated based on Base Product and Item categories. Changes for JIRA CPQ-319,CPQ-470,CPQ-437
* @ AUTHOR : Mani
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731 
* @version 2.0
 */
/*
* On record Sales order create/edit/approve/Fulfilment, the License and Rev Rec Dates are updated based on Item categories. Changes for JIRA CPQ-496
* @ AUTHOR : Mani
* @Release Date 13th Mar 2015
* @Release Number  RLSE0050322
* @Project Number DFCT0050521 
* @version 2.1
 */
 /*
* On record Sales order create/edit/Fulfilment, the License and Rev Rec Dates to be updated for the Support Term and Perpetual items. Changes for DFCT0050660
* @ AUTHOR : Mani
* @Release Date 18th April 2015
* @Release Number  RLSE0050355
* @Project Number DFCT0050660 
* @version 2.2
 */
 /*
* On record Sales order create/edit/Fulfilment, the License and Rev Rec Dates to be updated for the Support Term and Perpetual items. Changes for DFCT0050731:Issue with the Perpetual Support items not updating Start & End Date after the fulfilment.
* @ AUTHOR : Mani
* @Release Date 28th May 2015
* @Release Number  RLSE0050355
* @Project Number DFCT0050729,DFCT0050731 
* @version 2.2
 */
 /* On record Sales order create/edit/Fulfilment, the License and Rev Rec Dates to be updated for the Support Term and Perpetual items. Changes for DFCT0050805- (CPQ : Dates don't get updated for Upgrade Perpetual Support where the Renewal Start Date > End Date).
* @ AUTHOR : Mani
* @Release Date 18th July 2015
* @Release Number  RLSE0050403
* @Project Number DFCT0050805 
* @version 2.3
 */
 var itemCategoriesId = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_item_categories_id'); //Parameter Included by Rahul.
 function revrecDateUpdateOnSubmit(type) // After Submit function
 {
	try {		
		nlapiLogExecution('DEBUG', 'type ',type);
		/**** Loading the record and checking the condition to set the rev rec start and end date *****/
		var soRec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
		nlapiLogExecution('DEBUG', 'context is', nlapiGetContext().getExecutionContext());
		var deliveryStatus = soRec.getFieldValue('custbody_license_delivery_status'); // To get the license delivery status
		var status = soRec.getFieldValue('status');
		var count = soRec.getLineItemCount('item'); // Count of the line items.
		var createdfrom = soRec.getFieldValue('createdfrom');
		nlapiLogExecution('DEBUG', 'createdfrom '+createdfrom, 'delivery status is ' +deliveryStatus);
		//If SO created from Quote Record then implement existing logic for License and RR dates
		if(createdfrom) {
			if(type == 'create' || type == 'edit') {
				if(status == 'Pending Billing' && deliveryStatus == '1') {
					for (var i = 1; i <= count; i++) {
						var itemid = soRec.getLineItemValue('item', 'item', i);
						var category = nlapiLookupField('item', itemid,'custitem_item_category');
						nlapiLogExecution('DEBUG', 'category',category);
						//Item_Categories_Ids = 2,15,3,4,18 [2='License - Term', 15= 'Subscription',3-Maintenance New, 4=Maintenance Renewal, 18=Advisory Services]
						var y = itemCategoriesId.toString().search(category);//searching the parameter for the item category Id of the item on SO.By Rahul
						nlapiLogExecution('DEBUG', 'y',y);
						if(y >-1) //Checking if the Item Category or the Item Category Id is present or not in the Parameters. By Rahul
						{
							var licenseStartDate = soRec.getLineItemValue('item','custcol_license_start_date',i);
							var licenseEndDate = soRec.getLineItemValue('item','custcol_license_end_date',i);
							var revrecStartDate = soRec.getLineItemValue('item','revrecstartdate',i);
							var revrecEndDate = soRec.getLineItemValue('item','revrecenddate',i);
							if(type == 'create') {
								soRec.setLineItemValue('item','custcol_spk_fpx_startdate',i,licenseStartDate);
								soRec.setLineItemValue('item','custcol_spk_fpx_enddate',i,licenseEndDate);
							}
							/** Validating if the delivery start and end date is equal or not to rev rec start and end date respectively **/
						if(licenseStartDate && licenseEndDate ){
							var licenseStartDate1 = convertdate(licenseStartDate);
							var licenseEndDate1 = convertdate(licenseEndDate);
							if(licenseEndDate1 >= licenseStartDate1){		  // for DFCT0050805: changes made  by Mani on 7/9/2015
									if(licenseStartDate && licenseStartDate != revrecStartDate) {
										soRec.setLineItemValue('item','revrecstartdate',i,licenseStartDate);			
									}
									if(licenseEndDate && licenseEndDate != revrecEndDate) {
										soRec.setLineItemValue('item','revrecenddate',i,licenseEndDate);
									}
									nlapiLogExecution('DEBUG', 'if','if');
								}
						    }
							else {  // for DFCT0050805: changes made  by Mani on 7/9/2015
								if(licenseStartDate && licenseStartDate != revrecStartDate) {
									soRec.setLineItemValue('item','revrecstartdate',i,licenseStartDate);
									message+= 'Create Point#1 '+' revrecstartdate '+i+ ' '+licenseStartDate;
								}
								if(licenseEndDate && licenseEndDate != revrecEndDate) {
									soRec.setLineItemValue('item','revrecenddate',i,licenseEndDate);
									message+= 'Create Point#1 '+' revrecenddate '+i+ ' '+licenseEndDate;
								}
					        }	
							
						}	
						
					}
					//var soid = nlapiSubmitRecord(soRec, true); // Submitting the values which has been set.//commented by RS
					//nlapiLogExecution('DEBUG', 'soid Submitted', soid);
				}
			}
		}
		//If SO created for FPX Quote ID then implement new logic for License and RR dates
		if(!createdfrom) {
			var message = '';
			//JIRA CPQ-319- on Create set License Dates to RR dates
			if(type == 'create') {	
				for (var i = 1; i <= count; i++) {
					var itemid = soRec.getLineItemValue('item', 'item', i);
					var licenseStartDate = soRec.getLineItemValue('item','custcol_license_start_date',i);
					var licenseEndDate = soRec.getLineItemValue('item','custcol_license_end_date',i);
					var revrecStartDate = soRec.getLineItemValue('item','revrecstartdate',i);
					var revrecEndDate = soRec.getLineItemValue('item','revrecenddate',i);
					soRec.setLineItemValue('item','custcol_spk_fpx_startdate',i,licenseStartDate);
					soRec.setLineItemValue('item','custcol_spk_fpx_enddate',i,licenseEndDate);
					/** Validating if the delivery start and end date is equal or not to rev rec start and end date respectively **/
					//nlapiLogExecution('DEBUG', 'licenseStartDate '+licenseStartDate, 'licenseEndDate '+licenseEndDate+ ' revrecEndDate '+revrecEndDate);
					if(licenseStartDate && licenseEndDate ){   
						var licenseStartDate1 = convertdate(licenseStartDate);
						var licenseEndDate1 = convertdate(licenseEndDate);
						if(licenseEndDate1 >= licenseStartDate1){	 // for DFCT0050805: changes made  by Mani on 7/9/2015
							//nlapiLogExecution('DEBUG', ' create licenseStartDate1 '+licenseStartDate1, ' licenseEndDate1 '+licenseEndDate1);
							if(licenseStartDate && licenseStartDate != revrecStartDate) {
								soRec.setLineItemValue('item','revrecstartdate',i,licenseStartDate);
								message+= 'Create Point#1 '+' revrecstartdate '+i+ ' '+licenseStartDate;
							}
							
							if(licenseEndDate && licenseEndDate != revrecEndDate) {
								nlapiLogExecution('DEBUG', 'Inside licenseEndDate '+licenseEndDate, ' revrecEndDate '+revrecEndDate);
								soRec.setLineItemValue('item','revrecenddate',i,licenseEndDate);
								message+= 'Create Point#1 '+' revrecenddate '+i+ ' '+licenseEndDate;
							}
					    }
					}
					else {  // for DFCT0050805: changes made  by Mani on 7/9/2015
						
						if(licenseStartDate && licenseStartDate != revrecStartDate) {
							soRec.setLineItemValue('item','revrecstartdate',i,licenseStartDate);
							message+= 'Create Point#1 '+' revrecstartdate '+i+ ' '+licenseStartDate;
						}
						if(licenseEndDate && licenseEndDate != revrecEndDate) {
							soRec.setLineItemValue('item','revrecenddate',i,licenseEndDate);
							message+= 'Create Point#1 '+' revrecenddate '+i+ ' '+licenseEndDate;
						}
					}	
				}
			}
			//JIRA CPQ-319 - On Sales order edit, update License Dates and RR dates based on Sales order approval and fulfilment
			if(type == 'edit') {
				var isenddateupdate = false;
				var licensedeliverydate = soRec.getFieldValue('custbody_license_delivery_date');
				//JIRA CPQ-319- On Sales order fulfilment where status is Pending Billing and delivery status is Complete, then update License and RR dates
				if(status == 'Pending Approval' || status == 'Pending Billing') {
					for (var j = 1; j <= count; j++) {
						var aitemid = soRec.getLineItemValue('item', 'item', j);
						var aitemtxt = soRec.getLineItemText('item', 'item', j);
						var itemCategory = nlapiLookupField('item', aitemid,'custitem_item_category',true);
						var baseproduct = soRec.getLineItemValue('item', 'custcol_spk_baseproduct', j);
						//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : Begin
						var licenseterm = soRec.getLineItemValue('item', 'custcol_spk_licenseterm', j);
						var licensetermmonth = soRec.getLineItemValue('item', 'custcol_spk_licensetermmonths', j);
						//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : End
						nlapiLogExecution('DEBUG', 'edit category '+itemCategory,'baseproduct '+baseproduct+ ' aitemtxt '+aitemtxt);
						var assetgroup = soRec.getLineItemValue('item', 'custcol_spk_assetgroup', j);
						var licenseStartDate = soRec.getLineItemValue('item','custcol_license_start_date',j);
						var licenseEndDate = soRec.getLineItemValue('item','custcol_license_end_date',j);
						var startondelivery = soRec.getLineItemValue('item','custcol_spk_startondelivery',j);
						var revrecStartDate = soRec.getLineItemValue('item','revrecstartdate',j);
						var revrecEndDate = soRec.getLineItemValue('item','revrecenddate',j);
						var licensedelvryEdate = '';
						var isLT = false;
						var baseLsdate = '';
						//get the items that doesn't have base product : DFCT0050660 Begin
						if(!baseproduct) {
							if(licenseStartDate && licenseEndDate ){
								//nlapiLogExecution('DEBUG', 'licenseStartDate '+licenseStartDate, 'licenseEndDate '+licenseEndDate+ ' revrecEndDate '+revrecEndDate);
								var licenseStartDate1 = convertdate(licenseStartDate);
								var licenseEndDate1 = convertdate(licenseEndDate);
								if(licenseEndDate1 >= licenseStartDate1){	  // for DFCT0050805: changes made  by Mani on 7/9/2015
								//nlapiLogExecution('DEBUG', 'edit licenseStartDate1 '+licenseStartDate1, ' licenseEndDate1 '+licenseEndDate1);
									if(licenseStartDate && licenseStartDate != revrecStartDate) {
										soRec.setLineItemValue('item','revrecstartdate',j,licenseStartDate);
										message+= 'Create Point#1 '+' revrecstartdate '+j+ ' '+licenseStartDate;
									}
									if(licenseEndDate && licenseEndDate != revrecEndDate) {
										soRec.setLineItemValue('item','revrecenddate',j,licenseEndDate);
										message+= 'Create Point#1 '+' revrecenddate '+j+ ' '+licenseEndDate;
									}
								}
							}
							else {  // for DFCT0050805: changes made  by Mani on 7/9/2015
						
								if(licenseStartDate && licenseStartDate != revrecStartDate) {
									soRec.setLineItemValue('item','revrecstartdate',j,licenseStartDate);
									message+= 'Create Point#1 '+' revrecstartdate '+j+ ' '+licenseStartDate;
								}
								if(licenseEndDate && licenseEndDate != revrecEndDate) {
									soRec.setLineItemValue('item','revrecenddate',j,licenseEndDate);
									message+= 'Create Point#1 '+' revrecenddate '+j+ ' '+licenseEndDate;
								}
					        }
							//get the support items that match the base product and the License Item
							for(var l = 1; l <= count; l++) {
								var allItemid = soRec.getLineItemValue('item', 'item', l);
								var allassetgrp = soRec.getLineItemValue('item', 'custcol_spk_assetgroup', l);
								var allLsd = soRec.getLineItemValue('item','custcol_license_start_date',l);
								var allLed = soRec.getLineItemValue('item','custcol_license_end_date',l);
								//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : Begin
								var allLsterm = soRec.getLineItemValue('item', 'custcol_spk_licenseterm', l);
								var allLstermmonth = soRec.getLineItemValue('item', 'custcol_spk_licensetermmonths', l);
								//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : End
								var allstartondelivery = soRec.getLineItemValue('item', 'custcol_spk_startondelivery', l);
								var allbaseproduct = soRec.getLineItemValue('item', 'custcol_spk_baseproduct', l);
								//check if support item's base product matching anyof the lines license Term/perpetual and having same asset group
								if(allbaseproduct && allbaseproduct == aitemid && assetgroup == allassetgrp) {
									nlapiLogExecution('DEBUG', 'Supportitems allbaseproduct '+allbaseproduct,'aitemid '+aitemid+ ' aitemtxt '+aitemtxt);
									//var allcategory = nlapiLookupField('item', allbaseproduct,'custitem_item_category',true);
									nlapiLogExecution('DEBUG', 'itemCategory '+itemCategory,'licenseStartDate '+licenseStartDate+ ' licenseterm '+licenseterm+ ' licensetermmonth '+licensetermmonth);
									if(itemCategory == 'License - Term') {
										if(licenseStartDate) {
											baseLsdate = licenseStartDate;
										}
										licensedelvryEdate = licenseEndDate;
										isLT = true;
									}
									// if License Perpetual get License delivery date and add License Term days to get the License end date
									if(itemCategory == 'License - Perpetual') {
										nlapiLogExecution('DEBUG', 'iSLP '+itemCategory,'licensedeliverydate '+licensedeliverydate+ ' allLsterm '+allLsterm+ ' allLed '+allLed+ ' allLstermmonth '+allLstermmonth);
										if((startondelivery == 'T' || allstartondelivery == 'T') && licensedeliverydate) {
											baseLsdate = licensedeliverydate;
											//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : Begin
											//changes for DFCT0050731
											if(!allLed && baseLsdate && (allLsterm == 365 || allLsterm == 730 || allLsterm == 1095 || allLstermmonth == 12 || allLstermmonth == 24 || allLstermmonth == 36 )) {
												// validate the leap year for license end date
												if(allLstermmonth == 12 || allLstermmonth == 24 || allLstermmonth == 36) {
													licensedelvryEdate = nlapiAddMonths(nlapiStringToDate(baseLsdate), parseInt(allLstermmonth));
													licensedelvryEdate = nlapiDateToString(nlapiAddDays((licensedelvryEdate),-1));
												}
												else if(allLsterm == 365 || allLsterm == 730 || allLsterm == 1095 ) {
													licensedelvryEdate = LeapYear(baseLsdate,allLsterm);
													licensedelvryEdate = nlapiDateToString(nlapiAddDays((licensedelvryEdate),-1));
												}
											}
											else {
												licensedelvryEdate = allLed;
											}
										}
										else {
										//changes for DFCT0050731 : to set LSD if it has value
											if(allLsd) {
												baseLsdate = allLsd;
											}
											licensedelvryEdate = allLed;
										}
									}
									// set the License Start Date and Rev Rec start Dates for support Items
									if(baseLsdate) {
										nlapiLogExecution('DEBUG', 'baseLsdate ',baseLsdate);
										soRec.setLineItemValue('item','custcol_license_start_date',l,baseLsdate);			
										soRec.setLineItemValue('item','revrecstartdate',l,baseLsdate);
									}
									// set the License End Date and Rev Rec End Dates for support Items
									if(licensedelvryEdate) {
										nlapiLogExecution('DEBUG', 'licensedelvryEdate ',licensedelvryEdate);
										soRec.setLineItemValue('item','custcol_license_end_date',l,licensedelvryEdate);
										soRec.setLineItemValue('item','revrecenddate',l,licensedelvryEdate);
									}
									//DFCT0050660 : End
								}
							}
							//New/Upgrade CAB Bundle for Advisory Service Items : Begin
							if(itemCategory == 'Advisory Services') {
								nlapiLogExecution('DEBUG', 'SAE '+itemCategory,'licensedeliverydate '+licensedeliverydate+ ' licenseterm '+licenseterm+ ' licenseEndDate '+licenseEndDate+ ' licensetermmonth '+licensetermmonth);
								if(startondelivery == 'T' && licensedeliverydate) {
									baseLsdate = licensedeliverydate;
									//Changes for DFCT0050729: Need to pass the "Term (Months) atribute value for License End Date calculation : Begin
									//changes for DFCT0050731
									if(!licenseEndDate && baseLsdate && (licenseterm == 365 || licenseterm == 730 || licenseterm == 1095 || licensetermmonth == 12 || licensetermmonth == 24 || licensetermmonth == 36)) {
										// validate the leap year for license end date
										if(licensetermmonth == 12 || licensetermmonth == 24 || licensetermmonth == 36) {
											licensedelvryEdate = nlapiAddMonths(nlapiStringToDate(baseLsdate), parseInt(licensetermmonth));
											licensedelvryEdate = nlapiDateToString(nlapiAddDays((licensedelvryEdate),-1));
										}
										else if(licenseterm == 365 || licenseterm == 730 || licenseterm == 1095) {
											licensedelvryEdate = LeapYear(baseLsdate,licenseterm);
											licensedelvryEdate = nlapiDateToString(nlapiAddDays((licensedelvryEdate),-1));
										}
									}
									else {
										licensedelvryEdate = licenseEndDate;
									}
								}
								else {
									if(licenseStartDate) {
										baseLsdate = licenseStartDate;
									}
									licensedelvryEdate = licenseEndDate;
								}
								// set the License Start Date and Rev Rec start Dates for support Items
								if(baseLsdate) {
									soRec.setLineItemValue('item','custcol_license_start_date',j,baseLsdate);			
									soRec.setLineItemValue('item','revrecstartdate',j,baseLsdate);
								}
								// set the License End Date and Rev Rec End Dates for support Items
								if(licensedelvryEdate) {
									soRec.setLineItemValue('item','custcol_license_end_date',j,licensedelvryEdate);
									soRec.setLineItemValue('item','revrecenddate',j,licensedelvryEdate);
								}
							}
							//New/Upgrade CAB Bundle for Advisory Service Items : End
						}
					}
				}
			}
		}
		//JIRA CPQ-319 - After SO record submitted for all lines with License and RR dates then get the Maximum of all the License End dates and update on SO header End Date.
		nlapiLogExecution('DEBUG', 'message ', message);
		var soid = nlapiSubmitRecord(soRec, true); // Submitting the values which has been set.//commented by RS
		nlapiLogExecution('DEBUG', 'soid Submitted', soid);
		
		 // CPQ-496 : DFCT0050521 : Sales Order end date is coming 1 day less :Comment for now and may be used in future enhancement : Begin
		/*if(type == 'edit') {
			if(soid && isenddateupdate) {
				var soRec = nlapiLoadRecord(nlapiGetRecordType(),soid);
				var count = soRec.getLineItemCount('item');
				var maxledate ='';
				for (var a = 1; a <= count; a++) {
					var licenseEndDate = soRec.getLineItemValue('item','custcol_license_end_date',a);
					if(licenseEndDate){
						maxledate = getMaxLsEdate(licenseEndDate,maxledate);
					}
				}
				if(maxledate) {
					nlapiLogExecution('DEBUG', 'maxledate ', maxledate);
					var maxNSEndDate = nlapiDateToString(maxledate);
					nlapiSubmitField(nlapiGetRecordType(),soid, 'enddate', maxNSEndDate);
				}
			}
		}*/
		// CPQ-496 : DFCT0050521 : Sales Order end date is coming 1 day less :Comment for now and may be used in future enhancement : End
	}
	catch (e) 
	{
		nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
		var fields = new Array();
		var values = new Array();
		fields[0] = 'custbody_spk_cloudhuberror';
		fields[1] = 'custbody_spk_cloudhuberrortxt';
		values[0] = 'T';
		values[1] = e.getDetails();
		nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
	}
 }
 // CPQ-496 : DFCT0050521 : Sales Order end date is coming 1 day less :Comment for now and may be used in future enhancement
 function getMaxLsEdate(revrecEndDate,maxRedate) {
	var maxLedate = '';
	if(!maxRedate) {
		maxLedate = new Date(revrecEndDate);
		maxLedate.setHours(0, 0, 0, 0);
		maxRedate = maxLedate;
	}
	else {
		maxLedate = new Date(revrecEndDate);
		maxLedate.setHours(0, 0, 0, 0);
		if(maxLedate > maxRedate) {
			maxRedate = maxLedate;
		}
	}	
	if(maxRedate) {
		return maxRedate;
	}
 }
 
 function LeapYear(baseLsdate,allLsterm) {
	var noofyears = parseInt(allLsterm/365);
	var addedDate = nlapiStringToDate(baseLsdate);
	for(var i =1; i<= noofyears; i++) {
		addedDate = (nlapiAddMonths(addedDate, 12));
	}
	return addedDate;
 }
 
 function convertdate(Licensedate) {
	var Licensedate1 = new Date(Licensedate);
	Licensedate1.setHours(0, 0, 0, 0);
	return Licensedate1;
 }