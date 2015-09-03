/* Combined Straight-Line flag should be checked off whenever items belonging to item category maintenance-New , Maintenance renewal or CSM  is selected in the line item level and Combined Service End Date should have max of CSM or Lcense Terms RR End Date.
 * If any of the Line item contains Bundled Buying vehicle flag as true,then ignore that line item.	
 * User Event Script - Splunk _Set Combined Straight-Line flag
 * @author Abith Nitin
 * @Release Date    13-March-2015
 * @Release Number RLSE0050322 

 * @version 1.0
 */

/*Update the SO Combined Services End Date field calculations according to the new advisory services item category
 * User Event Script -  Splunk _Set Combined Straight-Line flag
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

function afterSubmitSO(type, form)
{
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	try {
		var maintenanceItemExists = false;
		var termItemExists = false;
		var csmitem = false;
		if (type == 'create' || type == 'edit')//script gets triggered when user creates or edits the SO
		{	

			/*Start-ENHC0051436: Uncheck "Combined Straight-line" if "EXCLUDE FROM CS SCRIPTS" is checked off.*/
                         var excludeCSFlag =  nlapiGetFieldValue('custbody_spk_exclude_from_cs_scripts');
			nlapiLogExecution('DEBUG', 'excludeCSFlag',excludeCSFlag);
			if(excludeCSFlag == 'T')
			{
				nlapiSubmitField('salesorder', recId, 'custbodycombined_services', 'F');
			}
			/*End-ENHC0051436: Uncheck "Combined Straight-line" if "EXCLUDE FROM CS SCRIPTS" is checked off.*/
			else
			{
				var rec = nlapiLoadRecord(recType,recId);
				var licenseterm_count = 0;
				var support_count = 0;
				var csm_miscitems = false;
				var miscItemExists = false;
				var license_csm = false;
				var gl_licensecsm_redate = '';
				var revRecEndDateUpd = '';
				var combinedenddate = false;
				for(var intPos = 1; intPos <= rec.getLineItemCount('item'); intPos++) 
				{
					var itemId = rec.getLineItemValue('item', 'item', intPos);
					if (itemId != '' && itemId != null) {
						nlapiLogExecution('DEBUG','itemId',itemId);
						var itemCategory = nlapiLookupField('item', itemId, 'custitem_item_category', 'T');
						var combinedDelayRevrec = nlapiLookupField('item', itemId, 'custitem_splunk_combinedservice_delay');
						var revRecEndDate = rec.getLineItemValue('item', 'revrecenddate', intPos);
						var BundledbuyingVehicle = rec.getLineItemValue('item', 'custcol_spk_bundled_buying_vehicle', intPos);
						if((itemCategory == 'License - Term' && BundledbuyingVehicle != 'T') || itemCategory == 'CSM'  || itemCategory == 'Advisory Services') //check whether item category belongs to License Term or CSM and Bundled Buying vehicle flag is false,then sort out the max date from that
						{
							var edate1_licensecsm = '';
							nlapiLogExecution('DEBUG', 'gl_licensecsm_redate ', gl_licensecsm_redate);
							if(!gl_licensecsm_redate) {
								edate1_licensecsm = new Date(revRecEndDate);
								edate1_licensecsm.setHours(0, 0, 0, 0);
								gl_licensecsm_redate = edate1_licensecsm;
							}
							else {
								edate1_licensecsm = new Date(revRecEndDate);
								edate1_licensecsm.setHours(0, 0, 0, 0);
								if(edate1_licensecsm > gl_licensecsm_redate) {
									gl_licensecsm_redate = edate1_licensecsm;
								}
							}	

							if(gl_licensecsm_redate) {
								revRecEndDateUpd = nlapiDateToString(gl_licensecsm_redate);
								combinedenddate = true;
							}
							nlapiLogExecution('DEBUG', 'revRecEndDateUpd ', revRecEndDateUpd);
						}
						if (itemCategory == 'License - Term' && BundledbuyingVehicle != 'T') {
							termItemExists = true;
							licenseterm_count++;
						}              
						if ((itemCategory == 'Maintenance - New'|| itemCategory == 'Maintenance - Renewal') && BundledbuyingVehicle != 'T'){
							maintenanceItemExists = true;
							support_count++;
						}
						if ((itemCategory == 'CSM') || (itemCategory == 'Services') || (itemCategory == 'Training') || (itemCategory == 'License - Perpetual' || itemCategory == 'Advisory Services') || (combinedDelayRevrec == 'T') || (licenseterm_count > 1) || (support_count > 1)) {
							miscItemExists = true;
						}				
						if (itemCategory == 'Services' || itemCategory == 'Training' || itemCategory == 'License - Perpetual'  || itemCategory == 'Advisory Services' || combinedDelayRevrec == 'T' || termItemExists || maintenanceItemExists) {
							csm_miscitems = true;
						}
						if (itemCategory == 'CSM') 
							csmitem = true; 

					}
				}
				if ((termItemExists && maintenanceItemExists && miscItemExists) || ((csm_miscitems) && (csmitem))) {
					rec.setFieldValue('custbodycombined_services', 'T');//If item category combination satisfies then combined service flag is checked.
					if(combinedenddate)//max of CSM or license date is present , then set the max date in combined service en date field. 
					{
						rec.setFieldValue('custbody_splunk_combinedenddate', revRecEndDateUpd);
					}
					else 
					{
						rec.setFieldValue('custbody_splunk_combinedenddate', '');
					}
				}
				else {
					rec.setFieldValue('custbodycombined_services', 'F');
					rec.setFieldValue('custbody_splunk_combinedenddate', '');
				}
				nlapiSubmitRecord(rec,true);
			}
		}
	}
	catch(e)
	{
		nlapiLogExecution('DEBUG', 'Error', e.toString());
		var estring = '';
		nlapiSubmitField(recType,recId,['custbody_spk_cloudhuberror','custbody_spk_cloudhuberrortxt'],['T',e.toString()]);
	}
}
