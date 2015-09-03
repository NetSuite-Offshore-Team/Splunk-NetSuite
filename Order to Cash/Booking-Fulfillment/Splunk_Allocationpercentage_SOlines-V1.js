/*
* This script file is used to calculate the Allocation Percentage of the sum of amount for Term License Items and the Associated Support items on the Invoice. The calculated allocation will then be set on License and Support item Amount fields. The "Do Not Trigger Allocation Box" is used to stop the script to trigger when checked.
* @ AUTHOR : Vaibhav
* @Release Date 3rd Apr 2015 for Enhancement ENHC0051477
* @Release Number RLSE0050326
* @version 1.0
*/
/*
* The following changes have been done in the script file as part of the release ENHC0051855:
Added new Script Parameter called "Allocation Percentage" with Value as 16% & getting amount for calculation from Old Total Amount field instead of SFDC Amount field.
* @ AUTHOR : Mani
* @Release Date 19th June 2015 for Enhancement ENHC0051855 (For Term license carve outs, need to change from 17% to 16% from quote to sales order)
* @Release Number RLSE0050390
* @version 1.1
*/
var allocationper =  nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_allocationpercentage');  // get allocation percentage from script parameter
function allocationpercentage()
	{
	try{
		var oneDay = 24*60*60*1000;
		var id = nlapiGetRecordId();
		var soRec = nlapiLoadRecord('salesorder',id);
		var status = soRec.getFieldValue('status');
		var deliveryStatus = soRec.getFieldValue('custbody_license_delivery_status');
		var noAllocationTrigger = soRec.getFieldValue('custbody_spk_dont_trigger_allocation');	
		/* The trigger condition for this script is to have the status of the SO is Pending Billing*/
		/* and the Delivery Status should be completed*/
		/*and the Do Not Trigger Allocation Checkbox should be unchecked */
		if(noAllocationTrigger == 'F' && status == 'Pending Billing' && deliveryStatus == 1)
			{
			var count = soRec.getLineItemCount('item');
			for (var j = 1; j <= count; j++) {
				var aitemid = soRec.getLineItemValue('item', 'item', j);
				var aitemtxt = soRec.getLineItemText('item', 'item', j);
				var itemCategory = nlapiLookupField('item', aitemid,'custitem_item_category',true);
				var baseproduct = soRec.getLineItemValue('item', 'custcol_spk_baseproduct', j);
				var assetgroup = soRec.getLineItemValue('item', 'custcol_spk_assetgroup', j);
				var basebundle = soRec.getLineItemValue('item','custcol_spk_basebundlecode',j);
				var bundleFlag = soRec.getLineItemValue('item','custcol_bundle',j);
				var supportItemAmount = soRec.getLineItemValue('item','amount',j); // SFDC AMOUNT to Old Total Amount changed by Mani
				var supportItemQty = soRec.getLineItemValue('item','quantity',j);
				var licensedelvryEdate = '';
				if(itemCategory == 'Maintenance - New' || itemCategory == 'Maintenance - Renewal' || itemCategory == 'Subscription') { 
				//get the support items having based product for License Term or Perpetual
				//Checking if selected item is support item or not
					if(baseproduct) {
						for(var l = 1; l <= count; l++) {
							var allItemid = soRec.getLineItemValue('item', 'item', l);
							var allassetgrp = soRec.getLineItemValue('item', 'custcol_spk_assetgroup', l);
							var allbasebundle = soRec.getLineItemValue('item','custcol_spk_basebundlecode',l);
							var allLsd = soRec.getLineItemValue('item','revrecstartdate',l);
							var allLed = soRec.getLineItemValue('item','revrecenddate',l);	
							//Selected the License item which is tagged to the Support item and making sure that they belong to the same Asset group							
							if(baseproduct == allItemid && assetgroup == allassetgrp) {
								var allcategory = nlapiLookupField('item', allItemid,'custitem_item_category',true);	
								//Checking if the License item tag to a Support item is Term License item or not
								if(allcategory == 'License - Term') {
									var licenseItemAmount = soRec.getLineItemValue('item','amount',l); // SFDC AMOUNT to Old Total Amount changed by Mani
									var licenseProductQuantity = soRec.getLineItemValue('item','quantity',l);
									var licStartDate = nlapiStringToDate(allLsd);
									var licEndDate = nlapiStringToDate(allLed);
									//Checking that the rev dates are not null
									if((licStartDate != null && licEndDate != null) && (licStartDate != null && licEndDate != null))
										{
										var allLsdtime = licStartDate.getTime();
										var allLedtime = licEndDate.getTime();
										var diffoflicdates = (parseFloat(allLedtime) - parseFloat(allLsdtime))/oneDay;
										var sumofamount = (parseFloat(supportItemAmount) + parseFloat(licenseItemAmount)).toFixed(2);
										//Calculating the Allocation percentage based on the formula to Allocate 83% to License and rest of amount to Support item 
										var licTotal = ((sumofamount)/(1+(allocationper*((diffoflicdates+1)/365)))).toFixed(2);
										var supTotal = (parseFloat(sumofamount) - parseFloat(licTotal)).toFixed(2);
										//Calculating the Unit cost of the License and the Support items
										var licUnitCost = (licTotal/licenseProductQuantity).toFixed(2);
										var supUnitCost = (supTotal/supportItemQty).toFixed(2);
										//Setting the calculated Allocation values to Total Amount, Unit Cost, Old Total Amount and Old Unit Cost fields 
										soRec.setLineItemValue('item','rate',l,licUnitCost);
										soRec.setLineItemValue('item','amount',l,licTotal);
										soRec.setLineItemValue('item','custcol_spk_unitcost',l,licUnitCost);
										soRec.setLineItemValue('item','custcol_totalamount',l,licTotal);
										soRec.setLineItemValue('item','rate',j,supUnitCost);
										soRec.setLineItemValue('item','amount',j,supTotal);
										soRec.setLineItemValue('item','custcol_spk_unitcost',j,supUnitCost);
										soRec.setLineItemValue('item','custcol_totalamount',j,supTotal);
									}
								}
							}
						}
					}
				}
			}
		nlapiSubmitRecord(soRec);
		}
	}
	catch(e)
		{
		nlapiLogExecution('ERROR', e.getCode(), e.getDetails());
	}
}	