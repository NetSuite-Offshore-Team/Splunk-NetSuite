/**
 * Script file used for PO Exempt Validations,File Size for 5mb, Enabling/Disabling PO Exempt fields on Recal,Field Change function and Duplication check for Cancelled Vendor bill
 * @author Unitha.Rangam
 * @Release Date 6th Oct 2014
 * @Release Number RLSE0050262
 * @Project # PRJ0050722
 * @version 1.0
 *
 * This script has been modified to include logs to track, why sometimes this script is not getting triggered when users are creating duplicate bills through UI.
 * Added lines 76, 95, 96, 100-103. It contains logs to print the value of the custom search results' length and the context.
 * @AUTHOR : Rahul
 * @Release Date 23rd Jan 2015.
 * @Defect # DFCT0050498.
 * @version 2.0
 * 
 *  Script has been modified such that if ReferenceNo/InvoiceNo has spaces in the beginning/ending then removing the spaces from ReferenceNo/InvoiceNo.
 * @AUTHOR : Jitendra Singh
 * @Release Date 29th May 2015
 * @Release Number RLSE0050372
 * @version 3.0
 */

var rolemap = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_rolemap_editbill');
nlapiLogExecution('DEBUG', 'rolemap', rolemap);
var fromemail = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_fromemail_apsplunk');
var nonpoAmtLimit = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_nonpobillamtlimit');

//On Page load, Enabling/Disabling PO Exempt fields based on Converted Amount and for PO Bills
function onInit() {
	var ponum = nlapiGetFieldValue('custbody_spk_poid');
	var convertAmt = exchangerate();
	if(convertAmt) {
		nlapiSetFieldValue('custbody_spk_inv_converted_amt',convertAmt);
	}
	if(ponum || convertAmt <= parseFloat(nonpoAmtLimit)) {
		nlapiDisableField('custbody_spk_nonpobillreason',true);
		nlapiDisableField('custbody_spk_poexemptrsn',true);
		nlapiDisableField('custbody_spk_poexceptionreason',true);
	}
}

//On Save Record, Check File Size having more than 5mb avoid saving bill with soft message, and Duplication check for Cancelled Vendor bill
function onSave() {
	//Get required parameters for Validation on save record
	var convertAmt = exchangerate();

	var invowner = nlapiGetFieldValue('custbody_spk_inv_owner');

	//Start-DFCT0050672://If RefrenceNo has spaces then removing spaces from beginning/ending of value-By Jitendra on 20th May 2015
	var refnum = nlapiGetFieldValue('tranid').trim();
	//End-DFCT0050672

	var vendorname = nlapiGetFieldText('entity');
	var memo = nlapiGetFieldValue('memo');
	var ponum = nlapiGetFieldValue('custbody_spk_poid');
	var userId = nlapiGetUser();
	var userRole = nlapiGetRole();
	var recId = nlapiGetRecordId();
	//Check for mandatory field "Bill received Date"
	var billreceiveddate = nlapiGetFieldValue('custbody_spk_billreceiveddate');
	if(!billreceiveddate || billreceiveddate == null) {
		alert('Please enter Bill Received Date.');
		return false;
	}
	//Check File Size having more than 5mb
	var attachfile = nlapiGetFieldValue('custbody_splunk_attach_bill');
	if(attachfile) {
		var filefilter = new Array();
		var filecolumn = new Array();
		filefilter.push(new nlobjSearchFilter('internalid',null,'is',attachfile));
		filecolumn.push(new nlobjSearchColumn('documentsize'));
		var filerec = nlapiSearchRecord('file',null,filefilter,filecolumn);	
		if(filerec) {
			var filesize = filerec[0].getValue('documentsize');
			//5120 kb = 5mb ; any file greater than 5 mb is not supported for file attachment
			if(filesize > 5120) {
				alert('Please choose attach file field having file size upto 5MB.');
				return false;
			}
		}
	}
	// Check for Duplicate Vendor Bills for Non-Administrator role
	//3-Admin,1025-Splunk Controller,1045-Splunk AP Manager - Inc,1050-Splunk AP Manager - International,1073-Senior A/P Clerk
	//ENHC0051269: AP:Netsuite to allow duplicate invoice number even if different vendors: Modified by Unitha on : 10th Oct 2014 - Begin
	var vendorid = nlapiGetFieldValue('entity');
	if(refnum) {
		var context = nlapiGetContext().getExecutionContext();
		var rolearr = rolemap.split(',');
		nlapiLogExecution('DEBUG', 'rolearr', rolearr);
		var filter = new Array();
		var column = new Array();
		filter.push(new nlobjSearchFilter('tranid',null,'is',refnum));
		filter.push(new nlobjSearchFilter('mainline',null,'is','T'));
		filter.push(new nlobjSearchFilter('entity',null,'anyof',vendorid));
		//ENHC0051269: AP:Netsuite to allow duplicate invoice number even if different vendors: Modified by Unitha on : 10th Oct 2014 - End
		if(recId) {
			filter.push(new nlobjSearchFilter('internalid',null,'noneof',recId));
		}
		column.push(new nlobjSearchColumn('status'));	
		for(var y = 0; y<=rolearr.length; y++) {
			if(userRole == rolearr[y]) {
				filter.push(new nlobjSearchFilter('status',null,'noneof','VendBill:C'));
				break;
			}
		}
		var vbillRecords = nlapiSearchRecord('vendorbill',null,filter,column);				
		if(vbillRecords){
			nlapiLogExecution('DEBUG','vbillRecords ', vbillRecords.length);
			nlapiLogExecution('DEBUG','context ', context);
			alert('Reference No/Invoice No "'+ refnum+ '" already exist. Please enter a different Reference No for this bill.');
			return false;
		}
		else{
			nlapiLogExecution('DEBUG','no vbillRecords ', 'no vbillRecords');
			nlapiLogExecution('DEBUG','context ', context);

			//Start-DFCT0050672://For Re-setting the InvoiceNo after removing spaces. By Jitendra on 20th May 2015
			nlapiSetFieldValue('tranid', refnum);
			//End-DFCT0050672
		}
	}
	//PO Exempt Validations for Non_PO Bills Reasons
	if(ponum) { return true; }
 else if(!ponum){
	if(convertAmt > parseFloat(nonpoAmtLimit)) {
		//PO Exempt = 1; Exception = 2;PO Required=3 (Custom List : PO Exempt List)
		var poexempt = nlapiGetFieldValue('custbody_spk_nonpobillreason');
		if(poexempt == 1) {
			//Legal = 1; Rent = 2; (Custom List : PO_Exempt Reason List)
			var poexemptrsn = nlapiGetFieldValue('custbody_spk_poexemptrsn');
			if(!poexemptrsn) {
				alert("Please choose the value in PO Exempt Reason.");
				return false;
			}
		}
		else if(poexempt == 2) {
			var exceptionreason = nlapiGetFieldValue('custbody_spk_poexceptionreason');
			if(!exceptionreason) {
				alert("Please enter the reason for exception in PO Exception Reason field.");
				return false;
			}
		}
		else if(poexempt == 3) {
			if(!invowner) {
				alert("Please choose Invoice Business Owner.");
				return false;
			}
			else {

				var html ='<P style="font-family=verdana;font-size=6px;">Hi,</P>';
				html = html + '<P style="font-family=verdana;font-size=6px;"> <br>The Vendor bill# "'+refnum+'" from Vendor "'+vendorname+'" is on hold; since there is no PO created & approved in the system. Once the PO is created & fully approved for the services consumed, we will create the bill in the system to go through the approval process & further processing for payment.</P>';
				html = html + '<br><p style="font-family=verdana;font-size=6px;"><b>Memo :</b> '+memo+'</p>';
				html = html + '<br><P style="font-family=verdana;font-size=6px;">Please contact <a href="mailto:ap@splunk.com">ap@splunk.com</a> in case you have further questions.</P> ';
				html = html + '<br><P style="font-family=verdana;font-size=6px;">Thank You,</P>';
				html = html + '<P style="font-family=verdana;font-size=6px;">Accounts Payable</P>';

				var bodymsg = html;
				var subject = 'Vendor Bill# "'+refnum+'" is on Hold; and requires an approved PO for further processing.';

				nlapiSendEmail(fromemail,invowner,subject,bodymsg);
				alert("An email has been sent to the Invoice Business Owner requiring a PO for the associated bill. You can re-enter the bill in NetSuite once the PO is fully approved.");
				//save custom record NOn-PO bills to keep track of the reason for PO Exempt
				var recid = saveNonPOBill();
				return false;
			}
		}
		else if(!poexempt) {
			alert("Please choose the value in Non-PO Bill Reason field.");
			return false;
		}
	}
 }

	return true;
}
//Save Custom record NOn-PO bills to keep track of the reason for PO Exempt and the Bills that are hold for reporting purpose "AP Invoice Exceptions-PO Required Report"
function saveNonPOBill() {
	try {
		var custrec = nlapiCreateRecord('customrecord_spk_nonpobills');
		var custrec = nlapiCreateRecord('customrecord_spk_nonpobills');
		custrec.setFieldValue('custrecord_spk_poreq_account',nlapiGetFieldValue('account'));
		custrec.setFieldValue('custrecord_spk_poreq_vendor',nlapiGetFieldValue('entity'));
		custrec.setFieldValue('custrecord_spk_poreq_currency',nlapiGetFieldValue('currency'));
		custrec.setFieldValue('custrecord_spk_poreq_subsidiary',nlapiGetFieldValue('subsidiary'));
		custrec.setFieldValue('custrecord_spk_poreq_postingperiod',nlapiGetFieldValue('postingperiod'));
		custrec.setFieldValue('custrecord_spk_poreq_date',nlapiGetFieldValue('trandate'));

		custrec.setFieldValue('custrecord_spk_poreq_terms',nlapiGetFieldValue('terms'));
		custrec.setFieldValue('custrecord_spk_poreq_duedate',nlapiGetFieldValue('duedate'));
		custrec.setFieldValue('custrecord_spk_poreq_discdate',nlapiGetFieldValue('discountdate'));
		custrec.setFieldValue('custrecord_spk_poreq_referenceno',nlapiGetFieldValue('tranid'));
		custrec.setFieldValue('custrecord_spk_poreq_amount',nlapiGetFieldValue('usertotal'));

		custrec.setFieldValue('custrecord_spk_poreq_discamt',nlapiGetFieldValue('discountamount'));
		custrec.setFieldValue('custrecord_spk_poreq_memo',nlapiGetFieldValue('memo'));
		custrec.setFieldValue('custrecord_spk_poreq_approvalstatus',nlapiGetFieldValue('approvalstatus'));
		custrec.setFieldValue('custrecord_spk_poreq_creditlimit',nlapiGetFieldValue('creditlimit'));
		custrec.setFieldValue('custrecord_spk_poreq_nextinvoiceapprover',nlapiGetFieldValue('custbody_spk_inv_apvr'));
		custrec.setFieldValue('custrecord_spk_poreq_bodapproval',nlapiGetFieldValue('custbody_spk_inv_bod_apvr'));
		custrec.setFieldValue('custrecord_spk_poreq_convrtamount',nlapiGetFieldValue('custbody_spk_inv_converted_amt'));
		custrec.setFieldValue('custrecord_spk_poreq_invowner',nlapiGetFieldValue('custbody_spk_inv_owner'));
		custrec.setFieldValue('custrecord_spk_poreq_createdfrompo',nlapiGetFieldValue('custbody_spk_poid'));
		custrec.setFieldValue('custrecord_spk_poreq_attachbill',nlapiGetFieldValue('custbody_splunk_attach_bill'));
		custrec.setFieldValue('custrecord_spk_poreq_nonpo_billrsn',nlapiGetFieldValue('custbody_spk_nonpobillreason'));
		custrec.setFieldValue('custrecord_spk_poreq_poexemprsn',nlapiGetFieldValue('custbody_spk_poexemptrsn'));
		custrec.setFieldValue('custrecord_spk_poreq_poexceptionrsn',nlapiGetFieldValue('custbody_spk_poexceptionreason'));
		custrec.setFieldValue('custrecord_spk_billreceiveddate',nlapiGetFieldValue('custbody_spk_billreceiveddate'));
		var custrecId = nlapiSubmitRecord(custrec);
		nlapiLogExecution('DEBUG','custrecId ', custrecId);
	}
	catch(e) {
		alert("Error message : "+e.toString());
	}
}

//On Field Change, Enabling/Disabling PO Exempt fields based on Non_PO Bills Reason
function fieldchange(type,name) {
	if(name == 'custbody_spk_nonpobillreason') {
		var nonPoBill = nlapiGetFieldValue('custbody_spk_nonpobillreason');
		if(nonPoBill == 1) {
			nlapiDisableField('custbody_spk_poexemptrsn',false);
			nlapiDisableField('custbody_spk_poexceptionreason',true);
			nlapiSetFieldValue('custbody_spk_poexceptionreason','');
		}
		else if(nonPoBill == 2) {
			nlapiDisableField('custbody_spk_poexemptrsn',true);
			nlapiDisableField('custbody_spk_poexceptionreason',false);
			nlapiSetFieldValue('custbody_spk_poexemptrsn','');
		}
		else if(nonPoBill == 3) {
			nlapiDisableField('custbody_spk_poexemptrsn',true);
			nlapiDisableField('custbody_spk_poexceptionreason',true);
			nlapiSetFieldValue('custbody_spk_poexemptrsn','');
			nlapiSetFieldValue('custbody_spk_poexceptionreason','');
		}
	}
}
//ON Line commit or remove line, calculate amount and Enabling/Disabling PO Exempt fields based on Converted Amount having >,=,< 1000 for PO Bills
function recalAmt(type,name) {
	if(name == 'commit' || name == 'remove') {
		var convertAmt = exchangerate();
		var ponum = nlapiGetFieldValue('custbody_spk_poid');
		if(!ponum) {
			if(parseFloat(convertAmt) > parseFloat(nonpoAmtLimit)) {
				nlapiDisableField('custbody_spk_nonpobillreason',false);
				nlapiDisableField('custbody_spk_poexemptrsn',false);
				nlapiDisableField('custbody_spk_poexceptionreason',false);
				nlapiSetFieldValue('custbody_spk_poexemptrsn','');
				nlapiSetFieldValue('custbody_spk_poexceptionreason','');
			}
			else {
				nlapiDisableField('custbody_spk_nonpobillreason',true);
				nlapiDisableField('custbody_spk_poexemptrsn',true);
				nlapiDisableField('custbody_spk_poexceptionreason',true);
				nlapiSetFieldValue('custbody_spk_nonpobillreason','');
				nlapiSetFieldValue('custbody_spk_poexemptrsn','');
				nlapiSetFieldValue('custbody_spk_poexceptionreason','');
			}
		}
		else {
			nlapiDisableField('custbody_spk_nonpobillreason',true);
			nlapiDisableField('custbody_spk_poexemptrsn',true);
			nlapiDisableField('custbody_spk_poexceptionreason',true);
			nlapiSetFieldValue('custbody_spk_nonpobillreason','');
			nlapiSetFieldValue('custbody_spk_poexemptrsn','');
			nlapiSetFieldValue('custbody_spk_poexceptionreason','');
		}
		if(convertAmt) {
			nlapiSetFieldValue('custbody_spk_inv_converted_amt',convertAmt);
		}
	}
}
//Common function to Convert Amount to USD or exchange rate based on Bill Currency
function exchangerate() {
	var totalAmt = nlapiGetFieldValue('usertotal');
	if(totalAmt) {
		var vbCurrency = nlapiGetFieldValue('currency');
		if(vbCurrency == '1') {// If currency is USD.
			return convertAmt = parseFloat(totalAmt);
		}
		else {
			var rate = nlapiExchangeRate(vbCurrency,'USD');
			return convertAmt = parseFloat(totalAmt * rate);
		}
	}
	else {
		return convertAmt = 0;
	}
}