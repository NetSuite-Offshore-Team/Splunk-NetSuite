/*
* This script file is used to create PDF and upload in file cabinet and send to Customer
* @ AUTHOR : Mani
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Name: Hangman
* @Project Number PRJ0050865 
* @version 1.0
*/
/*
* @Release Description:
* The following changes have been done in the script file as part of the release RLSE0050325: In invoice edit checking the record got changed or not for updating the PDF (Line# 66-128).
* @AUTHOR : Mani
* @Release Date 27th March 2015
* @Project Name:ENHC0051480: CPQ-368: New Product - Customer Adoption Bundle
* @Release Number : RLSE0050325: PRJ_War_Room_Release_2015.03.27
* @Version 2.0
*/
/*
* @Release Description:
* The following changes have been done in the script file as part of the release RLSE0050326: 
* Updating the memo field for the CAB bundle item to append the start & end date for the Support & Splunk Advisory (child items of the CAB Bundle)(Line# 569-693 or <PageInit()>). 
* @AUTHOR : Mani
* @Release Date 3rd April 2015
* @Project Name:ENHC0051726: CPQ-655: Data Mapping -Annual Renewal amount should flow from FPX-->SFDC-->NS
* @Release Number : RLSE0050326
* @Version 3.0
*/
/*
* @Release Description:
* The following changes have been done in the script file as part of the release RLSE0050327: 
* Updated the scenario for memo field display in the CAB bundle item to append the start & end date for the Support & Splunk Advisory (child items of the   CAB Bundle)(Line# 579-711 or <PageInit()>). 
* @AUTHOR : Mani
* @Release Date 15th April 2015
* @Project Name:ENHC0051511: CPQ-396-Invoice - Support line rollup for Upgrade/Renewal Orders
* @Release Number : RLSE0050327
* @Version 4.0
*/
/*
* @Release Description:
* The following changes have been done in the script file as part of the release RLSE0050354: 
* Updated the scenario for memo field display in the CAB bundle item (fixed the issue for special character display ) and Updated the scenario for checking the record got changed in invoice edit or not for updating the Invoice PDF.
* @AUTHOR : Mani
* @Release Date 1st May 2015
* @Project Name:ENHC0051782: CPQ-668: Need to pass the Arrow distributor specific attributes to NS
* @Release Number : RLSE0050354
* @Version 5.0
*/
/*
* @Release Description:
* The following changes have been done in the script file as part of the release RLSE0050365: 
* Remove the proposal Dates coming from FPX for CAB Bundle on the invoice record in memo field and added the new FEAA item to show in invoice PDF
* @AUTHOR : Mani
* @Release Date 28th May 2015
* @Project Name:ENHC0051798: Need to remove the proposal Dates coming from FPX for CAB Bundle on the Invoice PDF & ENHC0051573 : CPQ-364: New Product - Fixed GB EAA
* @Release Number : RLSE0050365
* @Version 6.0
*/
/*
	convert text type to tx lookup ID
 */

var txTypeIdMap = {
	'estimate' : 6,
	'invoice' : 7
	};
function onAfterSubmitInvoicePdf(type) {
	try {
			var order = nlapiGetNewRecord();
			var invoiceId = order.getId();
			if(type == 'create'){   // In New Invoice Creation Call
				var params = new Array();
				params['custscript_splunk_invoiceid'] = invoiceId;
				params['custscript_splunk_pdf'] = 'T';
				params['custscript_splunk_txtype'] = order.getRecordType(); 
				//call the  SCH script for create PDF and Invoice sync
				var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params);  
				if(status == 'QUEUED') {
					// Invoice Sync to SFDC using CloudHub
					invoiceSync(invoiceId); 
				}
				if(status == 'INPROGRESS') {
					var status2 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_2',params);
					if(status2 == 'INPROGRESS') {
						var status3 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_3',params);
						if(status3 == 'INPROGRESS') {
							var status4 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_4',params);
							if(status4 == 'INPROGRESS') {
								var status5 = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_5',params);
							}
						}
					}
				}
			}
			else if(type == 'edit'){  // In Invoice Edit call
				var oldRecord = nlapiGetOldRecord();
				var oldAmount = oldRecord.getFieldValue('total');
				var billtotierOld = oldRecord.getFieldValue('custbody_bill_to_tier');
				var billcustomerOld = oldRecord.getFieldValue('entity');
				var billtotiernew = order.getFieldValue('custbody_bill_to_tier');
				var billcustomernew = order.getFieldValue('entity');
				var adhocBundleOld = oldRecord.getFieldValue('custbody_spk_proposaladhocbundle');
				var adhocBundleOldchk = oldRecord.getFieldValue('custbody_spk_adhocbundlesummary');
				var duedateOld = oldRecord.getFieldValue('duedate')
				var duedateNew =order.getFieldValue('duedate')
				var termsOld =oldRecord.getFieldValue('terms')
				var termsNew = order.getFieldValue('terms')
				var adhocBundle = order.getFieldValue('custbody_spk_proposaladhocbundle');
				var newAmount = order.getFieldValue('total');
				var adhocBundlenewchk = order.getFieldValue('custbody_spk_adhocbundlesummary');
				var PdfId =order.getFieldValue('custbody_splunk_pdfid');
				var buyingvehiclenew = order.getFieldValue('custbody_is_buying_vehicle');
				var buyingvehicletypenew = order.getFieldValue('custbody_spk_buyingvehicletype');
				var buyingvehicleOld = oldRecord.getFieldValue('custbody_is_buying_vehicle');
				var buyingvehicletypeOld = oldRecord.getFieldValue('custbody_spk_buyingvehicletype');
				var flag = false;
				for (var i =1; i<=oldRecord.getLineItemCount('item');i++){
					
					var itemOld = oldRecord.getLineItemValue('item','item',i);
					var quantityOld = oldRecord.getLineItemValue('item','quantity',i);
					var startDateOld =oldRecord.getLineItemValue('item', 'custcol_license_start_date', i);
					var enddateOld =oldRecord.getLineItemValue('item', 'custcol_license_end_date', i);
					var memoOld = oldRecord.getLineItemValue('item', 'custcol_memo', i);
					for(var j = i;j<=order.getLineItemCount('item');j++){
						
						var itemNew = order.getLineItemValue('item','item',j);
						var quantityNew = order.getLineItemValue('item','quantity',j);
						var startDateNew =order.getLineItemValue('item', 'custcol_license_start_date', j);
						var enddateNew =order.getLineItemValue('item', 'custcol_license_end_date', j);
						var memoNew = order.getLineItemValue('item', 'custcol_memo', j);
						// check the old record and new record for update PDF.
						if((itemOld != itemNew) || (quantityOld != quantityNew) || (startDateOld != startDateNew) || (enddateOld != enddateNew) || (memoNew != memoOld)){
							flag = true;
							break;
						}
						break;
					}
					if(flag == true){
						break;
					}
				}				
				if((billcustomerOld != billcustomernew)||(billtotiernew != billtotierOld)||(adhocBundleOldchk != adhocBundlenewchk)||(buyingvehiclenew != buyingvehicleOld)||(buyingvehicletypeOld != buyingvehicletypenew)||(oldAmount != newAmount) ||(adhocBundleOld != adhocBundle) || (duedateOld != duedateNew)|| (termsOld != termsNew) || flag == true){   // check if any modification made in invoice record
				   var params = new Array();
				   params['custscript_splunk_invoiceid'] = order.getId();
				   params['custscript_splunk_pdf'] ='T';
				   params['custscript_splunk_txtype'] = order.getRecordType(); 
				   var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params);
				}
				else{  // No changes in invoice record
nlapiLogExecution('DEBUG', 'invoiceId ', invoiceId);
				   if(PdfId && invoiceId){
					invoiceSync(invoiceId);  // Invoice Sync to SFDC using CloudHub
				   }
				   else{
					   var params = new Array();
					   params['custscript_splunk_invoiceid'] = order.getId();
					   params['custscript_splunk_pdf'] ='T';
					   params['custscript_splunk_txtype'] = order.getRecordType(); 
					   var status = nlapiScheduleScript('customscript_splunk_invoice_sync','customdeploy_splunk_invoice_sync',params)
					}
				}
			}
	}
	catch(e){
		if (e instanceof nlobjError){
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());				
		}              
		else{
		    nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());				
		}  
	}

}

/*
	add button to invoke pdf suitelet
 */

function onBeforeLoadInvoicePdf(type,form,request) {

	try {
		if(type == 'view'){  // create button called View Invoice PDF and Send Email
		
			var rec = nlapiGetNewRecord();
			var tcType = rec.getFieldValue('custbody_celigo_tc_type');           
			var txId = rec.getId();
			var custId =  rec.getFieldValue('entity');
			var url = nlapiResolveURL('SUITELET', 'customscript_splunk_invoice_pdf_suitelet', 'customdeploy_splunk_invoice_pdf_suitelet', false);
			var script = "window.open('" + url +  "&tx_type=" + rec.getRecordType() + "&tx_id=" + rec.getId() +
					  "','PRINT', 'scrollbars=yes, location=no, toolbar=no, width=500, height=550, resizable=yes');";
			form.addButton("custpage_splunk_print","View Invoice PDF",script);  // add the View Pdf button 
	 
			/* add Send Email button to view form */

			var rec = nlapiGetNewRecord();
			var tcType = rec.getFieldValue('custbody_celigo_tc_type');
			if(tcType == null || tcType == '') {
				var blankTcId = getBlankTcId(rec);
				if(blankTcId != null) {
					rec.setFieldValue('custbody_celigo_tc_type',blankTcId);
				}
			}
			var fld = form.addField('custpage_is_print_bundle','checkbox','Is Save & Print Bundle');
			fld.setDefaultValue('F');
			fld.setDisplayType('hidden');
			var email = rec.getFieldValue('email');
			var url = nlapiResolveURL('SUITELET', 'customscript_splunk_invoice_pdf_suitelet', 'customdeploy_splunk_invoice_pdf_suitelet', false);
			var script = "window.location.replace('" + url +  "&tx_type=" + rec.getRecordType()  + "&invoiceId=" + txId+ "');document.getElementById('custpage_Splunk_save_email').onclick= function(){this.disabled=true;}";
			form.addButton("custpage_Splunk_save_email","Send Email",script); // on button click will call suitelet function and send the mail with attachment
		} 
	}
	catch(e){
		if (e instanceof nlobjError){
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());				
		}              
		else{
			nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());				
		}  
	}

}

function invoiceSync(invoiceId)  // invoice Sync to SFDC using CloudHub
{
	
	try {
			var string1 = '{';
			string1 = string1;
			var header = new Array();
			header['Accept'] = 'application/json';
			header['Content-Type'] = 'application/json';	
			var r = nlapiLoadRecord('invoice',invoiceId);
		
		/*----Start-------------------Clearing the sync Error fields-----------------Start------*/		
			if(r.getFieldValue('custbody_spk_cloudhuberror') == 'T')
			{
			var field = new Array();
			var value = new Array();
			field[0] = 'custbody_spk_cloudhuberror';
			field[1] = 'custbody_spk_cloudhuberrortxt';
			value[0] = 'F';
			value[1] = '';
			nlapiSubmitField('invoice',invoiceId,field,value);
			}
		/*----End-------------------Clearing the sync Error fields-----------------End------*/		
		
			var createdfrom = r.getFieldText('createdfrom');
			if ((createdfrom == null) || (createdfrom == '')) {
				createdfrom = '""';
			}
			else {                
				if(createdfrom.search('#')>-1)
				{
				createdfrom = '"' + createdfrom.split('#')[1] + '"';               
				}
			}
			string1 = string1 + '"createdFrom" : ' + createdfrom;
			

			var currency = r.getFieldValue('currencyname');
			if ((currency == null) || (currency == '')) {
				currency = '""';
			}
			else {
				currency = '"' + currency + '"';               
			}
			string1 = string1 + ',"currencyName" : ' + currency;
			
			
			var type = r.getFieldValue('type');
			if ((type == null) || (type == '')) {
				type = '""';
			}
			else {
				if (type == 'custinvc')
					{
					type = "Invoice";
					}
				type = '"' + type + '"';                
			}
			string1 = string1 + ',"type" : ' + type;
			
			
			var sfdcSyncId = r.getFieldValue('custbody_celigo_ns_sfdc_sync_id');
			if ((sfdcSyncId == null) || (sfdcSyncId == '')) {
				sfdcSyncId = '" "';
			}
			else {
				sfdcSyncId = '"' + sfdcSyncId + '"';                
			}
			string1 = string1 + ',"oppurtunityID" : ' + sfdcSyncId;
			
			
			var endDate = r.getFieldValue('enddate');
			if ((endDate == null) || (endDate == '')) {
				endDate = '""';
			}
			else {
				endDate = '"' + endDate + '"';                
			}
			string1 = string1 + ',"endDate" : ' + endDate;
			
			
			var startDate = r.getFieldValue('startdate');
			if ((startDate == null) || (startDate == '')) {
				startDate = '""';
			}
			else {
				startDate = '"' + startDate + '"';             
			}
			string1 = string1 + ',"startDate" : ' + startDate;
			

			var supportInvoice = r.getFieldValue('custbody_splunk_support_invoice');
			nlapiLogExecution('DEBUG', 'Support Invoice Value', supportInvoice); 
			if ((supportInvoice == null) || (supportInvoice == '')) {
				supportInvoice = '""';
				string1 = string1 + ',"supportInvoice" :' + supportInvoice;
			}
			else 			
			{
				if (supportInvoice == 'T')
					{
					string1 = string1 + ',"supportInvoice" : true';
					}
				if (supportInvoice == 'F')
					{
					string1 = string1 + ',"supportInvoice" : false';
					}
			}
			
			
			var terms = r.getFieldValue('custbody_tran_term_in_months');
			if ((terms == null) || (terms == '')) {
				terms = 0;
				string1 = string1 + ',"termInMonths" : ' + terms;
			}
			else {
				string1 = string1 + ',"termInMonths" : ' + parseInt(terms);
			}
				

			var discountTotal = r.getFieldValue('discounttotal');
			if ((discountTotal == null) || (discountTotal == '')) {
				discountTotal = '""';
			}
			string1 = string1 + ',"discountTotal" : ' +  parseFloat(discountTotal);
			
			
			var customer =r.getFieldValue('custbody_sfdc_id');
			if ((customer == null) || (customer == '')) {
				customer = '" "';
			}
			else {
				customer = '"' + customer + '"';                
			}		
			string1 = string1 + ',"entity" : ' + customer;
			
			var internalId = invoiceId;
			if ((internalId == null) || (internalId == '')) {
				internalId = '""';
			}
			else {
				internalId = '"' +internalId+ '"';               
			}
			string1 = string1 + ',"internalId" : ' + internalId;
					
			 
			var memo = r.getFieldValue('memo');
			if ((memo == null) || (memo == '')) {
				memo = '""';
			}
			else {
				memo = escapeXML(memo);
				memo = '"' + memo + '"';                
			}
			string1 = string1 + ',"memo" : ' + memo;
				
			
			var shippingCost = r.getFieldValue('shippingcost');
			if ((shippingCost == null) || (shippingCost == '')) {
				shippingCost = '0.00';
			}
			else {
				shippingCost = shippingCost;                
			}
			string1 = string1 + ',"shippingCost" : ' +  shippingCost;
			
			
			var status = r.getFieldValue('status');
			if ((status == null) || (status == '')) {
				status = '""';
			}
			else {
			status = '"' + status + '"';                    
			}
			string1 = string1 + ',"status" : ' + status;
			

			var subTotal = r.getFieldValue('subtotal');
			if ((subTotal == null) || (subTotal == '')) {
				subTotal = '""';
			}
			else {
				subTotal = subTotal;                
			}
			string1 = string1 + ',"subTotal" : ' +  parseFloat(subTotal);
			
						
			var taxTotal = r.getFieldValue('taxtotal');
			if ((taxTotal == null) || (taxTotal == '')) {
				taxTotal = '""';
			}
			else {
				taxTotal = taxTotal;                
			}
			string1 = string1 + ',"taxTotal" : ' + taxTotal;
			
			
			
			var total = r.getFieldValue('total');
			if ((total == null) || (total == '')) {
				total = '""';
			}
			string1 = string1 + ',"total" : ' +  parseFloat(total);
			
					
			var tranDate = r.getFieldValue('trandate');
			if ((tranDate == null) || (tranDate == '')) {
				tranDate = '""';
			}
			else {
				tranDate = '"' + tranDate + '"';                
			}
			string1 = string1 + ',"transactionDate" : ' + tranDate;
			
		   
			
			var tranId = r.getFieldValue('tranid');
			if ((tranId == null) || (tranId == '')) {
				tranId = '""';
			}
			else {
				tranId = '"' + tranId + '"';                
			}
			string1 = string1 + ',"transactionId" : ' + tranId;
			
		
			var pdfId = r.getFieldValue('custbody_splunk_pdfid'); 
			if (!pdfId || pdfId== ''){ 
					pdfId='""';
			}
			else{
			pdfId= '"'+ pdfId +'"';
			}
			string1 = string1 + ',"pdfId" : ' + pdfId;
		
			var folderId =  nlapiGetContext().getSetting('SCRIPT', 'custscript_splunk_pdf_folderid'); 
			if(folderId == '' ||! folderId ){ 
					folderId =='""';
			}
			else{
				string1 = string1 + ',"folderId" : ' + '"' +folderId + '"';
				}
			   
			string1 = string1 + '}';
			nlapiLogExecution('DEBUG', 'string1', string1);
			
			/*----End------------Creating JSON Object to be sent to Cloudhub------------End-----*/
	
			//Getting Cloudhub URL from script parameter to which JSON object to be posted
			var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_cloudhub_sync_url');
			//Getting Authorization header from script parameter which is used when requesting URL for Authentication
			var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
			var header = new Array();
			header['Authorization'] = authorizationHeader;
			header['Accept'] = 'application/json';
			header['Content-Type'] = 'application/json';
			var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
			nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode());
			
			
			/*------Start-----Checking if the request is processed successfully----------Start-------*/
				if(parseInt(y.getCode()) == 200)
					{
					try{
					//Capturing SFDC object id for the record created successfully in NetSuite custom field
					nlapiSubmitField('invoice',invoiceId,'custbody_spk_sfdc_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
					}
					catch(e){
					nlapiLogExecution('DEBUG','Catch Message','No ObjectID returned');
					}
					}	
					
			/*------END-----Checking if the request is processed successfully----------END-------*/
			
			/*------Start-------------If the sent request failed---------------------Start-------*/
					
				if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
				{
					var fields = new Array();
					var values = new Array();
					fields[0] = 'custbody_spk_cloudhuberror';
					fields[1] = 'custbody_spk_cloudhuberrortxt';
					values[0] = 'T';
					values[1] = y.getBody().toString();
					nlapiSubmitField('invoice',invoiceId,fields,values);	//Capturing error message in a custom field
				}
			/*------End-------------If the sent request failed---------------------End-------*/ 
	}
	catch(e)
		{
			if (e instanceof nlobjError)
			{
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
							
			}              
			else
			{
				nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
							
			}  
		}

}


function getBlankTcId(rec) {  // get the T and C Type from splunk pdf config record

	var columns = [];
	columns.push(new nlobjSearchColumn("name"));
	columns.push(new nlobjSearchColumn("custrecord_splunk_tc_type"));

	var filters = [];

	filters.push(new nlobjSearchFilter('name',null,'is','Blank T&C'));
	filters.push(new nlobjSearchFilter('custrecord_splunk_pdf_tx_type',null,'anyof',[txTypeIdMap[rec.getRecordType()]]));

	var srs = nlapiSearchRecord('customrecord_splunk_pdf_config',null,filters,columns);
	if(srs == null) {
		return null;
	}
	return srs[0].getValue('custrecord_splunk_tc_type');
}

function excapeXML(s) {
	if(s == null) {
		return null;
	}
	return s.replace(/<br>/g,"\n").replace(/&amp;/g,'&').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g,"&#39;").replace(/\n/g,"<br/>");
}

function zeroPad(d,n) {
	var s = '' + n;
	while(s.length < d) {
		s = '0' + d;
	}
	if(n < 10) {
		return '0' + n;
	}
	return '' + n;
}

function makeDateIdBase() {
	var today = new Date();

	var y = today.getFullYear() - 2000;
	var m = today.getMonth() + 1;
	var d = today.getDate();
	var h = today.getHours();

	return '' + zeroPad(2,y) + zeroPad(2,m) + zeroPad(2,d) + zeroPad(2,h);
}


function CommaFormatted(amount)
{
	var delimiter = ","; // replace comma if desired
	var a = amount.split('.',2);
	var d = a[1];
	var i = parseInt(a[0]);
	if(isNaN(i)) { return ''; }
	var minus = '';
	if(i < 0) { minus = '-'; }
	i = Math.abs(i);
	var n = new String(i);
	var a = [];
	while(n.length > 3)
	{
		var nn = n.substr(n.length-3);
		a.unshift(nn);
		n = n.substr(0,n.length-3);
	}
	if(n.length > 0) { a.unshift(n); }
	n = a.join(delimiter);
	if(d.length < 1) { amount = n; }
	else { amount = n + '.' + d; }
	amount = minus + amount;
	return amount;
}
// end of function CommaFormatted()

// Updating the memo field for the CAB bundle item to append the start & end date for the Support & Splunk Advisory (child items of the CAB Bundle)
function PageInit(type)  
{
	var invItemArray = new Array();
	for(var x = 1; x <=nlapiGetLineItemCount('item'); x++) {
		var invitem = nlapiGetLineItemValue('item', 'custcol_ava_item', x);
		var invitemid = nlapiGetLineItemValue('item', 'item', x);
		var invbundlecode = nlapiGetLineItemValue('item', 'custcol_spk_basebundlecode', x); 
		var invbasesupportproduct = nlapiGetLineItemValue('item','custcol_spk_baseproduct', x);
		var invitemassetGroup = nlapiGetLineItemValue('item', 'custcol_spk_assetgroup', x);
		var invisbundle = nlapiGetLineItemValue('item', 'custcol_bundle', x);
		var invamount  = excapeXML(nlapiGetLineItemValue('item', 'amount', x));
		var invdesc = nlapiGetLineItemValue('item', 'description', x);
		var invmemos = nlapiGetLineItemValue('item', 'custcol_memo', x);
		var invquantity = nlapiGetLineItemValue('item', 'quantity', x);
		var invstartdatenormal = excapeXML(nlapiGetLineItemValue('item', 'revrecstartdate', x)); 
		var invenddatenormal = excapeXML(nlapiGetLineItemValue('item', 'revrecenddate', x));
		var invstartdate = excapeXML(nlapiGetLineItemValue('item', 'custcol_license_start_date', x));
		var invenddate = excapeXML(nlapiGetLineItemValue('item', 'custcol_license_end_date', x));
		var invrate = excapeXML(nlapiGetLineItemValue('item', 'rate', x));
		var invcategory = nlapiLookupField('item', invitemid,'custitem_item_category');
		var invproposalName = excapeXML(nlapiGetLineItemValue('item', 'custcol_spk_proposalname', x));
		var invrenewamount = excapeXML(nlapiGetLineItemValue('item', 'custcol_spk_sfdcunitlistprice', x));  
		var invitemcategory = excapeXML(nlapiGetLineItemValue('item', 'custcol_item_category', x)); 
		invItemArray.push([invitem,invitemid,invbundlecode,invbasesupportproduct,invitemassetGroup,invisbundle,invamount,invdesc,invmemos,invquantity,invstartdatenormal,invenddatenormal,invstartdate,invenddate,invrate,invcategory,invproposalName,x,invrenewamount,invitemcategory]); 
	}
			
	var count=0;
	
	var memoupdate=true;
	for(var linecount =1 ;linecount <= nlapiGetLineItemCount('item'); linecount++) {
		//If Only Normal item on invoice record and push the baseitem if there.
		var memo='';
		var quantityUpdate='';
		var lstartdate ='';
		var lenddate ='';
		var q =0;
		var itemtype = nlapiGetLineItemValue('item', 'itemtype', linecount);
		var item = nlapiGetLineItemValue('item', 'custcol_ava_item', linecount);
		var itemid = nlapiGetLineItemValue('item', 'item', linecount);
		var baseproduct = nlapiGetLineItemValue('item', 'custcol_spk_basebundlecode', linecount); 
		var basesupportproduct = nlapiGetLineItemValue('item','custcol_spk_baseproduct', linecount);
		var itemassetGroup = nlapiGetLineItemValue('item', 'custcol_spk_assetgroup', linecount);
		var isbundle = nlapiGetLineItemValue('item', 'custcol_bundle', linecount);
		var amount  = excapeXML(nlapiGetLineItemValue('item', 'amount', linecount));
		var desc = nlapiGetLineItemValue('item', 'description', linecount);
		
		var quantity = nlapiGetLineItemValue('item', 'quantity', linecount);
		var startdatenormal = excapeXML(nlapiGetLineItemValue('item', 'revrecstartdate', linecount)); 
		var enddatenormal = excapeXML(nlapiGetLineItemValue('item', 'revrecenddate', linecount));
		var startdate = excapeXML(nlapiGetLineItemValue('item', 'custcol_license_start_date', linecount));
		var enddate = excapeXML(nlapiGetLineItemValue('item', 'custcol_license_end_date', linecount));
		var proposalName = excapeXML(nlapiGetLineItemValue('item', 'custcol_spk_proposalname', linecount));
		var rate = excapeXML(nlapiGetLineItemValue('item', 'rate', linecount));
		var bundlebuyingvehicle = excapeXML(nlapiGetLineItemValue('item', 'custcol_spk_bundled_buying_vehicle', linecount));
		var memoOld ='';
	  
		if(isbundle == 'T') {
			
			//var res = item.match(/CAB/g);
		    var itemIdMemo = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_itemidmemo');
		    var itemIdMemo1 =itemIdMemo.split(',');
			//alert('itemIdMemo::'+itemIdMemo);
			for(var q=0;q<itemIdMemo1.length;q++)
			{
				 var id = itemIdMemo1[q];
				//alert('id::'+id);
				if(itemid ==id)
				{
				//alert('id::'+id+'itemid::'+itemid);
				  var memos = nlapiGetLineItemValue('item', 'custcol_memo', linecount);
				
				  var memo1 ='';
				  var date ='';
				  for(var m = 0; m < invItemArray.length; m++) {
					var bItemname = invItemArray[m][0];
					var bItemid = invItemArray[m][1];
					var bundlebaseproduct = invItemArray[m][2]; 
					var bassetgrp =  invItemArray[m][4];
					var itemCategory =nlapiLookupField('item',bItemid,'custitem_item_category');
					if(bundlebaseproduct == item && itemassetGroup == bassetgrp ) {
						var count=0;
						var count1=0;
						var bLsd = invItemArray[m][10];
						var bLed = invItemArray[m][11];
						var bmemo = invItemArray[m][8];
						var bquantity = invItemArray[m][9];
						var brate = invItemArray[m][14];
						var bamount  = invItemArray[m][6];
						var bdesc = invItemArray[m][7];
						var brenewalamount = invItemArray[m][18];
						var itemcate = invItemArray[m][19];
						if((type=='edit' && !memos) || !memos){					
							if(bLsd && bLed){
								
								if(!memo){
								   memo = bdesc +'(' + bLsd + ' to ' + bLed + ')';
								}
								 else{
									  memo = memo+';'+'\n'+ bdesc +'(' + bLsd + ' to ' + bLed + ')'+';';
								 }
								
							}
							else
							{
								if(count1==1){
								memo = memo +';\n'+ bdesc; 
								}
								else{
									memo = memo +'\n'+ bdesc; 
								}
								count1++;
							}
							 nlapiSetLineItemValue('item','custcol_memo',linecount,memo);
						}
						else if(type !='edit' && memos ){
							
							//memos = memos.replace('&amp;','&');
							 var memo1='';
							if(bLsd && bLed){
								
								var memos2 = memos.split(';');
							
								for(var n=0; n<memos2.length;n++)
								{
									var memos1 = memos2[n];
									var memosfinal = memos1.split('(Start');
									var date='';
									
										if(memosfinal[1])
										{
											var test1 = memosfinal[1].match(/Annual/g);
											var finalmemo = memosfinal[1].split('.');
											if(test1=='Annual')
											{
												date ='('+bLsd + ' to ' +bLed+finalmemo[1]+'.00'+')';  //+'. Annual Renewal Amount = $'+CommaFormatted(brenewalamount)+')';
											}
											else
											{
													date ='('+bLsd + ' to ' + bLed+')';

											}
											
										}
										if(memosfinal[0])
										{
											memo1 = memo1+memosfinal[0]+date+';';
										}
									
							    }
								
							
								//memofin = memo1 + memofin ;
								//memo1 = memo1.replace(memosplit,date);
								//alert(memos.replace(memosplit,date));	
								
								//alert(memos);
								if(memo) {
									 var updatememo = memo.split(bdesc);  
								 }
								 else if(!memo){
									 var updatememo = memos.split(bdesc);
								 }
								 // if(itemid == 5937)
								 // {
									 // var EAA = memos.split(';');
									 // var updatememo = new Array();
									 // updatememo[0]=EAA[0];
									 // updatememo[1]=EAA[1];
								 // }
								 //alert(memo[0]);
								var memofinal ='';
								if(updatememo[1]){
									var updatememo1 = updatememo[1].split(';');
									for(var j=1;j<updatememo1.length;j++)
									{   
										if(!memofinal){
											memofinal = updatememo1[j];	
										}
										else if(memofinal){
											var test = ';';
											if(count==0){
											   memofinal =  memofinal+';'+updatememo1[j] ;
											   count++;
											}
											else{
												memofinal = test +memofinal+';'+updatememo1[j] ;
											}													
										}	
									}	
							   }
							   if(!updatememo[1])
							   {
								 memo = memos;  
							   }
							   else
							   {
								 // alert(updatememo1[0]);
								  var test1='';
								   var test ='';
									    test =  updatememo1[0].split('.');
									   if(test){
										   test1= '(' + bLsd + ' to ' + bLed + test[1]+'.00'+')'+ memofinal;
									   }
									   else {
										   test1 ='(' + bLsd + ' to ' + bLed + ')'+ memofinal;; 
									   }
									  // alert(test1);
								       test1 = test1.replace('undefined.00','');
									
								      memo = updatememo[0] + bdesc + test1;
									
							   }
							  // alert(memo);
                             nlapiSetLineItemValue('item','custcol_memo',linecount,memo); 							   
							}
								
						}
                     }	
				}
			}
		  }
		}
	}	
}
function escapeXML(s) {
    if(s == null) {
        return null;
    }
    return s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\");
	
}