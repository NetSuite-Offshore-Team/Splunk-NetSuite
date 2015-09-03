/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Feb 2014     Hari Gaddipati   DSG Case 37979
 *                                                                                                                                                                                            Set Rev Rec Start/End/Template based on criteria
 *                                                                                                                                                                                            DFCT0050319 - Modify script to only fire on create
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */


/* Update the Invoice RR Start and End date calculations to change into minimum RR Start Date and maximum RR End Date of all line items based on combination of item category.
 * User Event Script - Invoice update rev rec information
 * @author Abith Nitin
 * @Release Date 13-March-2015   
 * @Release Number  RLSE0050322 
 * @version 1.0
 */

/*Update the Invoice End date calculations according to the new advisory services item category
 * User Event Script - Invoice update rev rec information
 * @author Mukta Goyal
 * @Release Date 24-April-2015   
 * @Release Number RLSE0050363
 * @version 1.1
 */

/* Script is changed for restricting the script to uncheck "Combined Straight-line" if "EXCLUDE FROM CS SCRIPTS" checkbox is checked off.
 * @author Jitendra Singh
 * @Release Date    
 * @Release Number 
 * @Project ENHC0051436
 * @version 1.2
 */

function userEventAfterSubmit(type)
{
	try {
                //Start-ENHC0051436: Uncheck "Combined Straight-line" When user edit the invoice and check the "Combined Straight-line" from UI and if "EXCLUDE FROM CS SCRIPTS" checkbox is checked off.
		if(type == 'edit')
		{
			var recId = nlapiGetRecordId();
			var excludeCSFlag =  nlapiGetFieldValue('custbody_spk_exclude_from_cs_scripts');
			nlapiLogExecution('DEBUG', 'excludeCSFlag on edit',excludeCSFlag);
			if(excludeCSFlag == 'T')
			{
				nlapiSubmitField('invoice', recId, 'custbodycombined_services', 'F');
			}
		}
		//End-ENHC0051436: Uncheck "Combined Straight-line" When user edit the invoice and check the "Combined Straight-line" from UI and if "EXCLUDE FROM CS SCRIPTS" checkbox is checked off.

		if (type == 'create') 
		{
			var itemIdArray = new Array();
			var invoiceRec =  nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId(), {recordmode:'dynamic'});
			nlapiLogExecution('Error', 'Checking', 'Invoice Id: ' + invoiceRec.getId());
			var createdFromSO = false;
			//Load the Sales Order which is linked to the Invoice.
			var createdFrom = invoiceRec.getFieldText('createdfrom');

			nlapiLogExecution('Error', 'createdFrom',createdFrom);

			if (createdFrom.indexOf('Sales Order') == 0)
			{   

				createdFromSO = true;
				var soId = invoiceRec.getFieldValue('createdfrom');
				nlapiLogExecution('Error', 'soId',soId);
				var soRec = nlapiLoadRecord('salesorder', soId);
				nlapiLogExecution('Error', 'soRec',soRec);
			}

			var updateInvoice = false;        
			if (createdFromSO)
			{
				if (soRec.getLineItemCount('item') > 0) {
					var gl_rsdate = '';
					var gl_redate = '';
					var revRecStartDateUpd = '';
					var revRecEndDateUpd = '';
					var revRecStartDateStr = '';
					var revRecEndDateStr = '';
					var licensetermItemExists = false;
					var supportItemExists = false;
					var updateRevRecData = false;
					var delayDeferRev = false;
					var csm_miscitems = false;
					var miscItemExists = false;
					var csmitem = false;
					var csmitem_misc_support = false;
					var licenseterm_count = 0;
					var support_count = 0;

					for(var intPos = 1; intPos <= soRec.getLineItemCount('item'); intPos++) 
					{
						nlapiLogExecution('Error', 'intPos', intPos);

						var itemId = soRec.getLineItemValue('item', 'item', intPos);
						var BundledbuyingVehicle = soRec.getLineItemValue('item', 'custcol_spk_bundled_buying_vehicle', intPos);
						nlapiLogExecution('Error', 'BundledbuyingVehicle', BundledbuyingVehicle);
						var ifields = ['custitem_item_category'] ;	
						var itemfields = nlapiLookupField('item', itemId, ifields,true);						
						var combinedDelayRevrec = nlapiLookupField('item', itemId, 'custitem_splunk_combinedservice_delay');
						nlapiLogExecution('Error', 'combined delay rev rec', combinedDelayRevrec);
						if(itemfields){
							var itemCategory = itemfields.custitem_item_category;
						}
						nlapiLogExecution('Error', 'item category', itemCategory);
						//Get the Item category and check for the combination of item in order to update the RR Start date and End Date and check Bundled Buying Vehicle flag is true.		
						if (itemCategory == 'Other' || itemCategory == 'Subscription' || itemCategory == 'Marketing' || BundledbuyingVehicle == 'T') {
							continue;
						}
						if ((itemCategory == 'Services') || (combinedDelayRevrec == 'T')) {
							nlapiLogExecution('Error', 'inside combined delay rev rec if', combinedDelayRevrec);
							delayDeferRev = true;
						}
						if (itemCategory == 'License - Term' && BundledbuyingVehicle!= 'T') {
							licensetermItemExists = true;
							licenseterm_count++;
						}              
						if ((itemCategory == 'Maintenance - New' || itemCategory == 'Maintenance - Renewal') && BundledbuyingVehicle!= 'T'){
							supportItemExists = true;
							support_count++;
						}
						if ((itemCategory == 'CSM') || (itemCategory == 'Services') || (itemCategory == 'Training') || (itemCategory == 'License - Perpetual') || (itemCategory == 'Advisory Services' )|| (combinedDelayRevrec == 'T') || (licenseterm_count > 1) || (support_count > 1)) {
							miscItemExists = true;
						}

						if (itemCategory == 'Services' || itemCategory == 'Training' || itemCategory == 'License - Perpetual' || itemCategory == 'Advisory Services' || combinedDelayRevrec == 'T' || licensetermItemExists || supportItemExists) {
							csm_miscitems = true;
						}
						if (itemCategory == 'CSM') {
							csmitem = true;  
						}
						if (itemCategory == 'Services' || itemCategory == 'Training' || supportItemExists || combinedDelayRevrec == 'T')
						{
							nlapiLogExecution('DEBUG', 'licDeliveryDate of csmitem_misc_support if', csmitem_misc_support);
							csmitem_misc_support = true;
						}

						var revRecStartDate = soRec.getLineItemValue('item', 'revrecstartdate', intPos);
						var revRecEndDate = soRec.getLineItemValue('item', 'revrecenddate', intPos);
						//Get the max RR Start Date of License term and License Perpetual and Bundled Buying Vehicle flag should be false for the item.
						if((itemCategory == 'License - Term' && BundledbuyingVehicle!= 'T') || itemCategory == 'License - Perpetual') 
						{
							var sdate1 = '';							
							if(!gl_rsdate) 
							{
								sdate1 = new Date(revRecStartDate);
								sdate1.setHours(0, 0, 0, 0);
								gl_rsdate = sdate1;
							}
							else 
							{
								sdate1 = new Date(revRecStartDate);
								sdate1.setHours(0, 0, 0, 0);
								if(sdate1 > gl_rsdate) 
								{
									gl_rsdate = sdate1;
								}
							}
							nlapiLogExecution('DEBUG', 'gl_rsdate ', gl_rsdate);

						}
						//Get the max RR End Date of Maintenance New, Maintenance Renewal and CSM items also the Bundled Buying Vehicle flag is false. //enhancement
						if(((itemCategory == 'Maintenance - New' || itemCategory == 'Maintenance - Renewal') && BundledbuyingVehicle!= 'T') || itemCategory == 'CSM' || itemCategory == 'Advisory Services') {
							var edate1 = '';
							nlapiLogExecution('Error', 'gl_redate ', gl_redate);
							if(!gl_redate) {
								edate1 = new Date(revRecEndDate);
								edate1.setHours(0, 0, 0, 0);
								gl_redate = edate1;
							}
							else {
								edate1 = new Date(revRecEndDate);
								edate1.setHours(0, 0, 0, 0);
								if(edate1 > gl_redate) {
									gl_redate = edate1;
								}
							}	

						}
					} //Out side for loop for Sales order line items

					if(gl_rsdate) {
						revRecStartDateUpd = nlapiDateToString(gl_rsdate);
					}
					nlapiLogExecution('DEBUG', 'revRecStartDateUpd ', revRecStartDateUpd);
					if(gl_redate) {
						revRecEndDateUpd = nlapiDateToString(gl_redate);
					}
					nlapiLogExecution('Error', 'revRecEndDateUpd ', revRecEndDateUpd);

					//Get the Maximum RR start date if License delivery date has value on SO and compare that with the items having License term and License Perpetual RR Start dates
					var licDeliveryDate = soRec.getFieldValue('custbody_license_delivery_date');					
					if (licDeliveryDate != '' && licDeliveryDate != null) 
					{					
						if(gl_rsdate) 
						{	
							licDeliveryDate = new Date(licDeliveryDate);
							licDeliveryDate.setHours(0, 0, 0, 0);	
							nlapiLogExecution('Error', 'gl_rsdate ', gl_rsdate);	

							if(gl_rsdate < licDeliveryDate) 
							{								
								gl_rsdate = licDeliveryDate;
							}							
						}

						if(gl_rsdate) {
							revRecStartDateUpd = nlapiDateToString(gl_rsdate);
						}
						nlapiLogExecution('DEBUG', 'licDeliveryDate of revRecStartDateUpd ', revRecStartDateUpd);
					}			

					if(csmitem_misc_support && csmitem && (!gl_rsdate) )
					{						
						revRecStartDateUpd = invoiceRec.getFieldValue('trandate');	
						nlapiLogExecution('Error', 'licDeliveryDate of csmitem_misc_support ', revRecStartDateUpd);
					}
				}
			}
			//Check whether combination of item is satisfied.
			if ((licensetermItemExists && supportItemExists && miscItemExists) || (csm_miscitems && csmitem) || (csmitem_misc_support && csmitem)) {
				updateRevRecData = true;
			}
			//Updating the RR Start and End Date,Delay RevRec and delay Rev rec reason in the Invoice line items if the combination of items is satisfied.
			if (updateRevRecData) {
				var context = nlapiGetContext();
				var revRecTemplateId = context.getSetting('SCRIPT', 'custscript_invoice_rev_rec_template_id');
				for(var intPos = 1; intPos <= invoiceRec.getLineItemCount('item'); intPos++) 
				{
					nlapiLogExecution('Error', 'intPos before', intPos);
					var BundledbuyingVehicle = invoiceRec.getLineItemValue('item', 'custcol_spk_bundled_buying_vehicle', intPos);
					var itemId = invoiceRec.getLineItemValue('item', 'item', intPos);
					var ifields = ['custitem_item_category'] ;
					var itemfields = nlapiLookupField('item', itemId, ifields,true);
					if(itemfields){
						var itemCategory = itemfields.custitem_item_category;
					}
					if (itemCategory == 'Other'|| itemCategory == 'Subscription' || itemCategory == 'Marketing' || BundledbuyingVehicle == 'T') {
						continue;
					}
					invoiceRec.selectLineItem('item', intPos);
					if (delayDeferRev) {
						invoiceRec.setCurrentLineItemValue('item', 'deferrevrec', 'T');
						invoiceRec.setCurrentLineItemValue('item', 'custcol_rev_rec_delay_reason', 'Combined Service with PS');
					}
					if (revRecStartDateUpd != '' && revRecStartDateUpd != null) {
						nlapiLogExecution('Error', 'revRecStartDateUpd inside if ', revRecStartDateUpd);
						invoiceRec.setCurrentLineItemValue('item', 'revrecstartdate', revRecStartDateUpd);
					}	
					if (revRecEndDateUpd != '' && revRecEndDateUpd != null) {
						invoiceRec.setCurrentLineItemValue('item', 'revrecenddate', revRecEndDateUpd);

					}	
					if (revRecTemplateId != '' && revRecTemplateId != null) {
						invoiceRec.setCurrentLineItemValue('item', 'revrecschedule', revRecTemplateId);						
					}
					invoiceRec.commitLineItem('item');
					nlapiLogExecution('Error', 'intPos commit', intPos);
				}
				updateInvoice = true;
			}

			if (createdFromSO) {
				if (soRec.getFieldValue('custbodycombined_services') == 'T') {
					invoiceRec.setFieldValue('custbodycombined_services', 'T');
					updateInvoice = true;
				}
			}

			//Start-ENHC0051436: On Invoice create Uncheck "Combined Straight-line" When user manually check the "Combined Straight-line" from UI and if "EXCLUDE FROM CS SCRIPTS" checkbox is checked off.
			var excludeCSFlag =  invoiceRec.getFieldValue('custbody_spk_exclude_from_cs_scripts');
			nlapiLogExecution('DEBUG', 'excludeCSFlag on create',excludeCSFlag);
			if(excludeCSFlag == 'T')
			{
				invoiceRec.setFieldValue('custbodycombined_services', 'F');
				updateInvoice = true;
			}
			//End-ENHC0051436: On Invoice create Uncheck "Combined Straight-line" When user manually check the "Combined Straight-line" from UI and if "EXCLUDE FROM CS SCRIPTS" checkbox is checked off.

			nlapiLogExecution('Error', 'updateInvoice ', updateInvoice);
			if (updateInvoice) {
				nlapiSubmitRecord(invoiceRec, true);
			}
		}
	}
	catch(e) {
		nlapiLogExecution('DEBUG', 'Error', e.toString());
		var estring = '';
		var fields = new Array();
		var values = new Array();
		fields[0] = 'custbody_spk_cloudhuberror';
		fields[1] = 'custbody_spk_cloudhuberrortxt';
		values[0] = 'T';
		values[1] = e.toString();
		nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
	}
}
