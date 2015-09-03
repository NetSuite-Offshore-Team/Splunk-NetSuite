/*
* User script to set Total Amount on Salesorder line items.
* @ AUTHOR : Dinanath Bablu
* @Release Date 10th Jan 2014
* @Release Number RLSE0050065
* @version 1.0
 */
/*
* User Event script to set Unit Cost on Salesorder line items without changing according to Terms In Months.
* @ AUTHOR : Abith Nitin
* @Release Date 17th Oct 2014
* @Release Number RLSE0050237 
* @version 1.1
 */
 /*
* Script modified for CPQ impact of Quote on sales order. If the Order is created from Quote then the Unit cost is captured from quote line items 
* else if the order is created from CPQ/FPX then the Unit cost is captured from the custom column fields SFDC Unitcost and SFDC Amount to handle override Unit cost and Amount fields on Line items
* @ AUTHOR : Unitha Rangam
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731 
* @version 1.3
 */
  //Function is used in User event script to calculate Total Amt Field as qty*unitcost and keeping the Unit Cost field as constant even on change of terms in months on beforesubmit of SO
 function setTotalAmtBeforeSubmit(type)
 {
	var recType = nlapiGetRecordType();		
	var recId = nlapiGetRecordId();
	var currentContext = nlapiGetContext(); 
	if(recType == 'salesorder'&& type == 'create') {
		for(var p = 1; p <= nlapiGetLineItemCount('item'); p++){
			nlapiSetLineItemValue('item', 'custcol_spk_sfdc_unit_cost', p, nlapiGetLineItemValue('item', 'rate', p));
			nlapiSetLineItemValue('item', 'custcol_spk_sfdc_amount', p, nlapiGetLineItemValue('item', 'amount', p));
			
			nlapiSetLineItemValue('item', 'custcol_spk_unitcost', p, nlapiGetLineItemValue('item', 'rate', p));
			nlapiSetLineItemValue('item', 'custcol_totalamount', p, nlapiGetLineItemValue('item', 'amount', p));
		}
	}
	if(currentContext.getExecutionContext() == 'userinterface') {
		try{
			//Update Total Amount,Unit Cost,Old Unit Cost and Old Total Amount columns of SO line items, getting from Quote record line items Rate column
			if(recType == 'salesorder'){
				if (type == 'create' || type == 'edit') {
					nlapiLogExecution('DEBUG','type in 1st loop',type);
					var quoteid = nlapiGetFieldValue('createdfrom');
					nlapiLogExecution('DEBUG','quoteid',quoteid);
					var status = nlapiGetFieldValue('status');
					nlapiLogExecution('DEBUG','status',status);
					if(status && status != 'Pending Approval' && status!= 'Pending Billing') {
						return;
					}
					//Check for SO record billed or partially billed in terms of Invoice so that SO Amount is not updated for Billed orders
					if(type == 'edit') {
						var filters = new Array();
						var columns = new Array();
						filters.push(new nlobjSearchFilter('createdfrom', null, 'is', recId, null));
						filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T', null));
						columns[0] = new nlobjSearchColumn('internalid');
						var searchresults = nlapiSearchRecord('invoice', null, filters, columns);
						if(searchresults) {
							nlapiLogExecution('DEBUG','searchresults',searchresults.length);
							return;
						}
					}
					// Modified for CPQ, If SO created from Quote record then the Unit Cost is captured from Quote and this is used for Override Unit Cost and Amount validation
					if(quoteid) {
						var quoterec = '';
						//In order to load the record from the field 'created from'(Newly added)
						var quoterec = nlapiLoadRecord('estimate', quoteid);
						// get quote line items price check for same lines available on SO lines to update price
						var linecount = quoterec.getLineItemCount('item');
						for(var a = 1; a <= linecount; a++){
							var linenum = quoterec.getLineItemValue('item','line',a);
							var unitCost = quoterec.getLineItemValue('item','rate',a);
							var Qitem = quoterec.getLineItemValue('item','item',a);
							var qty = quoterec.getLineItemValue('item','quantity',a);
							var qamount = quoterec.getLineItemValue('item','quantity',a);
							Qtotalamt = quoterec.getFieldValue('total');
							nlapiLogExecution('DEBUG', 'Quote a '+a,  'linenum '+linenum+' unitCost '+unitCost+ ' Qtotalamt '+Qtotalamt);
							var lineitemcount = nlapiGetLineItemCount('item');
							nlapiLogExecution('DEBUG', 'soline ', ' lineitemcount '+lineitemcount);
							for(var b = a; b <= lineitemcount; b++){
								var lineno = nlapiGetLineItemValue('item','line',b);
								var SOitem = nlapiGetLineItemValue('item','item',b);
								nlapiLogExecution('DEBUG', 'b '+b, ' a '+a+ ' lineno '+lineno+ ' SOitem '+SOitem+ ' linenum '+linenum+ ' Qitem '+Qitem);
								//if both the lines and Items of quote and SO matchs then only update respective amounts considering override concept
								if((linenum == lineno) && (Qitem == SOitem)) {
									var isoverride = nlapiGetLineItemValue('item', 'custcol_overridetotalamount', b);
									var unitCostisoverride = nlapiGetLineItemValue('item', 'custcol_spk_overrideunitcost', b);
									nlapiLogExecution('DEBUG', 'soline ', ' Invoice isoverride'+isoverride);
									var quantity = nlapiGetLineItemValue('item', 'quantity', b);
									//If Unit Cost Override and Total Amount Override fields are not checked then Unit cost is set as the Quote Unit cost and amount is calculated accordingly.
									if (isoverride != 'T' && unitCostisoverride != 'T' ) {
										nlapiLogExecution('DEBUG', 'isoverride != T', 'unitCostisoverride!= T');
										nlapiSetLineItemValue('item','custcol_spk_unitcost',b,unitCost); // Unit Cost(Custom Field)
										nlapiLogExecution('DEBUG', 'unitCost', unitCost);
										nlapiSetLineItemValue('item', 'rate', b, unitCost); // Old Unit Cost(Standard Field)
										var amt = parseFloat(quantity * unitCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									//If Unit Cost Override and Total Amount Override fields are checked,then Unit cost field is overridden with custom Unit cost filed value and total amount is calculated based on the new Unit Cost.
									if(isoverride == 'T' && unitCostisoverride == 'T' ) {
										nlapiLogExecution('DEBUG', 'isoverride == T', 'unitCostisoverride == T');
										var uCost = nlapiGetLineItemValue('item', 'custcol_spk_unitcost', b);
										if(!uCost) { uCost = 0; }
										nlapiLogExecution('DEBUG', 'uCost ', uCost);
										nlapiSetLineItemValue('item', 'rate', b, uCost);
										var amt = parseFloat(quantity * uCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									//If Unit Cost override is checked and Total amount override is not checked, then Unit cost field will be overridden with custom Unit cost field value and Total amount will be calculated based on the new value.
									if(isoverride != 'T' && unitCostisoverride == 'T' ) {
										nlapiLogExecution('DEBUG', 'isoverride != T', 'unitCostisoverride== T'+' b '+b);
										var uCost = nlapiGetLineItemValue('item', 'custcol_spk_unitcost', b);
										if(!uCost) { uCost = 0; }
										nlapiLogExecution('DEBUG', 'uCost ', uCost);
										nlapiSetLineItemValue('item', 'rate', b, uCost);
										var amt = parseFloat(quantity * uCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									//If Unit Cost override is not checked and Total amount override is checked, then Unit cost will have the default Quote Unit Cost value and Total amount will take the custom total amount field value.
									if(isoverride == 'T' && unitCostisoverride != 'T' ) {
										nlapiLogExecution('DEBUG', 'isoverride == T', 'unitCostisoverride!= T'+' b '+b);
										nlapiSetLineItemValue('item','custcol_spk_unitcost',b,unitCost); // Unit Cost
										nlapiSetLineItemValue('item', 'rate', b, unitCost); // Old Unit Cost
										var totamt = nlapiGetLineItemValue('item', 'custcol_totalamount',b);
										if(!totamt) { totamt = 0; }
										nlapiLogExecution('DEBUG', 'totamt', totamt);
										nlapiSetLineItemValue('item', 'amount', b, totamt);
									}
								}
								// if any deleted lines or new lines on order exists without price, then simply override Total Amount to Old Total AMount
								// If any New lines or overriding the existing lines in SO to a new line,then override the unit cost field with List rate value.
								else {
									nlapiLogExecution('DEBUG', 'else', 'b= '+b);
									var termInMonth = nlapiGetLineItemValue('item', 'revrecterminmonths', b);
									var Listrate = nlapiGetLineItemValue('item', 'custcol_list_rate', b); // Getting List rate Value
									var quantity = nlapiGetLineItemValue('item', 'quantity', b);
									var isoverrideamt = nlapiGetLineItemValue('item', 'custcol_overridetotalamount', b);
									var isuCost = nlapiGetLineItemValue('item', 'custcol_spk_unitcost', b);
									if(!termInMonth) {
										isuCost = Listrate;
									}
									var isoverrideUcost = nlapiGetLineItemValue('item', 'custcol_spk_overrideunitcost', b);
									nlapiLogExecution('DEBUG', 'else b '+b,' isoverrideamt '+isoverrideamt+ ' isoverrideUcost '+isoverrideUcost);
									
									if(isoverrideamt != 'T' && isoverrideUcost != 'T') {
										nlapiLogExecution('DEBUG', 'Else isoverrideamt != T', 'isoverrideUcost!= T'+' b '+b);
										nlapiSetLineItemValue('item','custcol_spk_unitcost',b,isuCost);
										nlapiSetLineItemValue('item', 'rate', b, isuCost);
										var amt = parseFloat(quantity * isuCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									if(isoverrideamt == 'T' && isoverrideUcost == 'T' ) {
										nlapiLogExecution('DEBUG', 'Else isoverrideamt == T', 'isoverrideUcost== T'+' b '+b);
										nlapiSetLineItemValue('item', 'rate', b, isuCost);
										var amt = parseFloat(quantity * isuCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									if(isoverrideamt != 'T' && isoverrideUcost == 'T' ) {
										nlapiLogExecution('DEBUG', 'Else isoverrideamt != T', 'isoverrideUcost== T'+' b '+b);
										nlapiSetLineItemValue('item', 'rate', b, isuCost);
										var amt = parseFloat(quantity * isuCost);
										nlapiSetLineItemValue('item','custcol_totalamount',b,amt);
										nlapiSetLineItemValue('item','amount',b,amt);
									}
									if(isoverrideamt == 'T' && isoverrideUcost != 'T' ) {
										nlapiLogExecution('DEBUG', 'Else isoverrideamt == T', 'isoverrideUcost!= T'+' b '+b);
										nlapiSetLineItemValue('item','custcol_spk_unitcost',b,isuCost);
										var totamt1 = nlapiGetLineItemValue('item', 'custcol_totalamount', b);
										if(!totamt1) { totamt1 = 0; }
										nlapiSetLineItemValue('item', 'amount', b, totamt1);
									}
								}
							}
						}
						//update SO Total AMount that matches to the actual quote amount for reference in ase of SO line amounts modified
						nlapiSetFieldValue('custbody_totalamount', Qtotalamt);
					}
					//Modified for CPQ, If SO created from FPX(Salesforce) record then the Unit Cost is captured from SO Line item SFDC UnitCost and SFDC Amount and this is used for Override Unit Cost and Amount validation
					else {
						for(var x = 1; x <= nlapiGetLineItemCount('item'); x++){
							var termInMonth = nlapiGetLineItemValue('item', 'revrecterminmonths', x);
							var Listrate = nlapiGetLineItemValue('item', 'custcol_list_rate', x); // Getting List rate Value
							var quantity = nlapiGetLineItemValue('item', 'quantity', x);
							var isoverrideamt = nlapiGetLineItemValue('item', 'custcol_overridetotalamount', x);
							var sfdcucost = nlapiGetLineItemValue('item', 'custcol_spk_sfdc_unit_cost', x);
							var sfdcamount = nlapiGetLineItemValue('item', 'custcol_spk_sfdc_amount', x);
							if(!termInMonth) {
								sfdcucost = Listrate;
							}
							var isoverrideUcost = nlapiGetLineItemValue('item', 'custcol_spk_overrideunitcost', x);
							nlapiLogExecution('DEBUG', 'else x '+x,' isoverrideamt '+isoverrideamt+ ' isoverrideUcost '+isoverrideUcost);
							
							if(isoverrideamt != 'T' && isoverrideUcost != 'T') {
								nlapiLogExecution('DEBUG', 'Else isoverrideamt != T', 'isoverrideUcost!= T'+' x '+x);
								nlapiSetLineItemValue('item','custcol_spk_unitcost',x,sfdcucost);
								nlapiSetLineItemValue('item', 'rate', x, sfdcucost);
								var amt = parseFloat(quantity * sfdcucost);
								nlapiSetLineItemValue('item','custcol_totalamount',x,amt);
								nlapiSetLineItemValue('item','amount',x,amt);
							}
							if(isoverrideamt == 'T' && isoverrideUcost == 'T' ) {
								nlapiLogExecution('DEBUG', 'Else isoverrideamt == T', 'isoverrideUcost== T'+' x '+x);
								var isuCost = nlapiGetLineItemValue('item', 'custcol_spk_unitcost', x);
								if(!isuCost) { isuCost = 0; }
								nlapiSetLineItemValue('item', 'rate', x, isuCost);
								var amt = parseFloat(quantity * isuCost);
								nlapiSetLineItemValue('item','custcol_totalamount',x,amt);
								nlapiSetLineItemValue('item','amount',x,amt);
							}
							if(isoverrideamt != 'T' && isoverrideUcost == 'T' ) {
								nlapiLogExecution('DEBUG', 'Else isoverrideamt != T', 'isoverrideUcost== T'+' x '+x);
								var isuCost = nlapiGetLineItemValue('item', 'custcol_spk_unitcost', x);
								if(!isuCost) { isuCost = 0; }
								nlapiSetLineItemValue('item', 'rate', x, isuCost);
								var amt = parseFloat(quantity * isuCost);
								nlapiSetLineItemValue('item','custcol_totalamount',x,amt);
								nlapiSetLineItemValue('item','amount',x,amt);
							}
							if(isoverrideamt == 'T' && isoverrideUcost != 'T' ) {
								nlapiLogExecution('DEBUG', 'Else isoverrideamt == T', 'isoverrideUcost!= T'+' x '+x);
								nlapiSetLineItemValue('item','custcol_spk_unitcost',x,sfdcucost);
								var totamt1 = nlapiGetLineItemValue('item', 'custcol_totalamount', x);
								if(!totamt1) { totamt1 = 0; }
								nlapiSetLineItemValue('item', 'amount', x, totamt1);
							}
						}
					}
				}
			}
		}
		catch(e)
		{
			nlapiLogExecution('ERROR', 'Error', 'Error - Reason : ' + e.toString());
		}
	}
 }
 
 //Function is used in Client script on field change onoverride Unitcost or Override Amt checked to enable/disable Total Amt Field
 function amtFieldChange(type,name)
 {
	if(type == 'item') {
		if(name == 'custcol_spk_overrideunitcost') {
			var linenum = nlapiGetCurrentLineItemValue(type,'line');
			var isoverride = nlapiGetCurrentLineItemValue(type,name);
			if(isoverride == 'T'){
				nlapiSetLineItemDisabled(type,'custcol_spk_unitcost',false,linenum);
			}
			else{
				nlapiSetLineItemDisabled(type,'custcol_spk_unitcost',true,linenum);
			}
		}
		if(name == 'custcol_overridetotalamount'){
			var linenum = nlapiGetCurrentLineItemValue(type,'line');
			var isoverride = nlapiGetCurrentLineItemValue(type,name);
			if(isoverride == 'T'){
				nlapiSetLineItemDisabled(type,'custcol_totalamount',false,linenum);
			}
			else{
				nlapiSetLineItemDisabled(type,'custcol_totalamount',true,linenum);
			}
		}
		//If any change in Terms in Month, default Unit cost field value is captured and will set it to the custom Unit cost field.
		if(name == 'revrecterminmonths'){
			var rate = nlapiGetCurrentLineItemValue(type,'rate');
			if(!rate) {
				rate = 0;
			}
			if(nlapiGetCurrentLineItemValue(type,'custcol_spk_overrideunitcost')!= 'T') {
				nlapiSetCurrentLineItemValue(type,'custcol_spk_unitcost',rate);
			}
		}
	}
}
 //Function is used in Client script on line Init to disable Total Amt & Unit Cost Field on SO lines
 function onlineinit()
 {
	var isoverrideuc = nlapiGetCurrentLineItemValue('item','custcol_spk_overrideunitcost');
		if(isoverrideuc == 'T'){
			nlapiDisableLineItemField('item','custcol_spk_unitcost',false);
		}
		else{
			nlapiDisableLineItemField('item','custcol_spk_unitcost',true);
		}
	var isoverride = nlapiGetCurrentLineItemValue('item','custcol_overridetotalamount');
		if(isoverride == 'T'){
			nlapiDisableLineItemField('item','custcol_totalamount',false);
		}
		else{
			nlapiDisableLineItemField('item','custcol_totalamount',true);
		}	
 }
 
 
 
 