/**
* The Before Load function of the script file is used for adding approve and reject buttons. 
* User can click on "Approve" or "Reject" button in email to do the approval and rejection. 
* Before Submit function of the Script file checks the invoice threshold validation.
* After Submit function of the Script file populates the Approval matrix
* @author Unitha
* @Release Date 21th July 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/
//Modified Script for AP Approval Phase-II
/**
* 1.Changes in script method "vbOnLoad"  the Reject, Edit button enabled for Additional roles.
* 2.Changes in script method "validateBillThreshold"  Optimizing the threshold validation to get value of amount from PO and new/existing bill record.
* 3.Changes in script method "vbApprovalRouting"  to create the Matrix routing of the Bill on After submitted based on conditions of "NON_PO Bill Reasons", "Exclude Supervisor" and "Amount" greater or less than 1000.
* @author Unitha Rangam
* @Release Date 6th Oct 2014
* @Release Number RLSE0050262
* @Project # PRJ0050722
* @version 1.1
*/
/**
* Added two additional Approval steps in the matrix levels of the bill.
* @author Anchana SV
* @Release Date 
* @Release Number 
* @Project # ENHC0051710
* @version 1.2
*/

var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var rolemap = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_rolemap_editbill');
var userRole = nlapiGetRole();
var ExecutiveReqAmtLimit = nlapiGetContext().getSetting('SCRIPT', 'custscript_executive_reqamtlimitphs2');
var rejectrole = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_rejectrole');
var nonpoAmtLimit = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_nonpobillamtlimit');
function vbOnLoad(type,form) // Before Load function of user event script
{
	if(type == 'view') // When seen in view mode.
	{
		try
		{
			form.setScript('customscript_spk_cntrl_buttonclick');
            var id = nlapiGetRecordId();
			var user = nlapiGetUser();				
			var vbStatus = nlapiGetFieldValue('approvalstatus');
			var billRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			var currentCount = billRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
			var billStatus = billRec.getFieldValue('status');
			var flag = false;
			for(var j = 1;j<= currentCount;j++)
			{
				var status = billRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',j); 
				if(status == '3') // Status is either rejected/Pending approval/blank
				{
					flag = true;
					break;
				}
			}
			var createdBy = billRec.getFieldValue('custbody_spk_bill_creator');
			//AP Phase -II : Begin
			// If user is next approver or an administrator and the approval status is "Pending Approval".
			nlapiLogExecution('DEBUG', nlapiGetRole(), 'rejectrole '+rejectrole);
            if (id && (user == nlapiGetFieldValue('custbody_spk_inv_apvr') || userRole == '3') && nlapiGetFieldValue('approvalstatus') == '1' && billStatus != 'cancelled') {
				form.addButton('custpage_approve', 'Approve', 'BtnCheck_AppStd();'); // Creation of "Approve" Button
			}				
			if (id && (user == nlapiGetFieldValue('custbody_spk_inv_apvr') || userRole == '3' || userRole == rejectrole) && nlapiGetFieldValue('approvalstatus') == '1' && billStatus != 'cancelled') {	
				form.addButton('custpage_reject', 'Reject', 'BtnCheck_RejStd();'); // Creation of "Reject" Button					
				
            }
			
			// If approval status is "Approved" and role is not Administrator
            //Allow editing Approved bill if role is 3-Admin,1025-Splunk Controller,1045-Splunk AP Manager - Inc,1050-Splunk AP Manager - International,1074-Senior A/P Clerk
			if(id && vbStatus == 2 && userRole != '3' && userRole != '1025' && userRole != '1045' && userRole != '1050' && userRole != '1074') {
				form.removeButton('edit');
			}	
			//AP Phase -II : End			
			var isApMngr = nlapiLookupField('employee',user,'custentity_spk_apmanager');
			if(id && ((userRole == '3' && nlapiGetFieldValue('approvalstatus') != '2' && billStatus != 'cancelled') || (isApMngr == 'T' && flag == true && billStatus != 'cancelled') || (user == createdBy && flag == true && billStatus != 'cancelled')))
			{
				var reAppUrl = nlapiResolveURL('SUITELET', 'customscript_spk_vbrouting_onreapprov_su', 'customdeploy_spk_vbrouting_onreapprov_su');
                reAppUrl += '&vbId=' + nlapiGetRecordId();
                var reApprovedUrl = reqUrl + reAppUrl;
                var clickUrl = "window.open('" + reApprovedUrl + "','_self')";
				form.addButton('custpage_approve', 'Re-Initiate Approval', clickUrl); // Creation of "Re-Approve" Button
			}
			if(id &&(userRole != '3' && isApMngr == 'F' && user != createdBy))
			{
				form.removeButton('cancelbill');
			}
			
        } 
        catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
	}
	else if(type == 'edit')
	{
		try
		{
			var vbId = nlapiGetRecordId();
			if(vbId) {
				var rec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
				//AP Phase-II Changes enable or disable PO Exempt fields : Begin
				var nonPoBill = rec.getFieldValue('custbody_spk_nonpobillreason');
				//PO Exempt = 1; 
				if(nonPoBill == 1) {
					form.getField('custbody_spk_poexemptrsn').setDisplayType('normal');
					form.getField('custbody_spk_poexceptionreason').setDisplayType('disabled');
				}
				else if(nonPoBill == 2) { //Exception = 2;
					form.getField('custbody_spk_poexemptrsn').setDisplayType('disabled');
					form.getField('custbody_spk_poexceptionreason').setDisplayType('normal');
				}
				else if(nonPoBill == 3) { //PO Required=3
					form.getField('custbody_spk_poexemptrsn').setDisplayType('disabled');
					form.getField('custbody_spk_poexceptionreason').setDisplayType('disabled');
				}
				//AP Phase-II Changes enable or disable PO Exempt fields : End
				var count = rec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
				var createdBy = rec.getFieldValue('custbody_spk_bill_creator');
				var appstatus = rec.getFieldValue('approvalstatus');
				for(var a = 1;a<=count;a++)
				{
					var status = rec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',a);
					if(status == '3') // status of the approval matrix record is "Rejected"
					{
						if(nlapiGetUser() == createdBy || nlapiGetRole() == '3') // If user is either the creator or an Administrator
						{
							form.getField('custbody_spk_inv_owner').setDisplayType('normal');
							break;
						}
						else
						{
							form.getField('custbody_spk_inv_owner').setDisplayType('inline');
						}
					}
				}	
				//Allow editing Approved bill if role is 3-Admin,1025-Splunk Controller,1045-Splunk AP Manager - Inc,1050-Splunk AP Manager - International,1074-Senior A/P Clerk
				if(appstatus == '2' && userRole != '3' && userRole != '1025' && userRole != '1045' && userRole != '1050' && userRole != '1074')
				{
					nlapiSetRedirectURL('RECORD', 'vendorbill', vbId, false);
				}
			}
		}
		catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
	}
}

/***** Before Submit Script to check the invoice threshold validation ******/
function validateBillThreshold(type) {// BeforeSubmit function on vendor bill
	var currentContext = nlapiGetContext(); 
	// If the context is "User Interface" or "CSV Import".
	nlapiLogExecution('DEBUG', 'type '+type, 'currentContext '+currentContext.getExecutionContext());
	if (type == 'create' || type == 'edit') {// Validating when the record is created. 
		var createdFrom = nlapiGetFieldValue('custbody_spk_poid');
		var vbSubs = nlapiGetFieldValue('subsidiary');
		if (createdFrom) {// If created from a purchase order.
			/****** Loading PO record and fetching required fields ******/
			var poRec = nlapiLoadRecord('purchaseorder',createdFrom);
			var poAmount = poRec.getFieldValue('total');
			var poStatus = poRec.getFieldValue('status');
			var currentVBAmount = parseFloat(nlapiGetFieldValue('usertotal'));
			nlapiLogExecution('DEBUG', 'poAmount is'+poAmount, 'poStatus'+poStatus);
			var thresholdAmount = parseFloat(poAmount)+ parseFloat(poAmount/10); // Calculating the threshold amount.
			var totalBillAmount = 0;			
			// Creating dynamic saved search for finding other Bills for the same Purchase Order
			var filter = new Array();
			var column = new Array();
			filter[0] = new nlobjSearchFilter('createdfrom', null, 'is', createdFrom);
			filter[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
			if(type == 'edit') {
				filter[2] = new nlobjSearchFilter('internalid', null, 'noneof', nlapiGetRecordId());
			}
			column[0] = new nlobjSearchColumn('fxamount');
			var records = nlapiSearchRecord('vendorbill', null, filter, column);
			if (records) {
				for (var i = 0; i < records.length; i++) {
					var vbValue = parseFloat(records[i].getValue('fxamount'));
					totalBillAmount = parseFloat(totalBillAmount) + parseFloat(vbValue);
					nlapiLogExecution('DEBUG', 'totalBillAmount '+totalBillAmount, 'vbValue '+vbValue+ ' i '+i);
				}
				nlapiLogExecution('DEBUG', 'thresholdAmount '+thresholdAmount, 'Final Bill amnt is '+totalBillAmount+ ' currentVBAmount '+currentVBAmount);
				totalBillAmount = parseFloat(totalBillAmount+currentVBAmount);
				// Comparing the Bill Amount and PO Amount.				 
				if (parseFloat(totalBillAmount) > parseFloat(thresholdAmount)) {
					throw nlapiCreateError('User Defined', 'The Bill Total Amount is exceeding the 10% threshold of the PO Amount; so cannot save the Bill. Please reduce the amount to within %10 range in order to save the bill. And raise another PO for the additional Amount.');
				}
			}
			else {
				if(parseFloat(currentVBAmount) > parseFloat(thresholdAmount)) {
					throw nlapiCreateError('User Defined', 'The Bill Total Amount is exceeding the 10% threshold of the PO Amount; so cannot save the Bill. Please reduce the amount to within %10 range in order to save the bill. And raise another PO for the additional Amount.');
				}
			}
		}
	}
}

/***** After Submit script to populate the Approval matrix *******/
function vbApprovalRouting(type,form) // After submit function
{
	try {
		var fileId = nlapiGetFieldValue('custbody_splunk_attach_bill');
		if(fileId) {
			//Attaching the file to the record after saving the record.
			nlapiAttachRecord('file', fileId, nlapiGetRecordType(),nlapiGetRecordId()); 
		}
	} 
	catch (e) {
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
	/*ENHC0051710-----Start Code for Populating the FP&A Approver Added by Anchana SV*/
	var recordId = nlapiGetRecordId();
	var vbRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
	var currentCount = parseInt(vbRec.getLineItemCount('item'));
	var currentCountexpense = parseInt(vbRec.getLineItemCount('expense'));
	var item_department ='';
	var item_amount = new Array();
	if(currentCount){
	for(var i=0;i<currentCount;i++){
		item_amount[i] = vbRec.getLineItemValue('item','amount',i+1);
		nlapiLogExecution('DEBUG','itemamount',item_amount);
	}
	var largest = Math.max.apply(Math, item_amount);//getting Largest of the line item Amount
	nlapiLogExecution('DEBUG','Largest',largest);
	
	for(var i=0;i<currentCount;i++){
		item_amount[i] = vbRec.getLineItemValue('item','amount',i+1);
		if(item_amount[i]==largest){
		item_department = vbRec.getLineItemValue('item','department',i+1);
		nlapiLogExecution('DEBUG','depart',item_department);
		}
	}
	}
	else if(currentCountexpense){
		for(var i=0;i<currentCountexpense;i++){
		item_amount[i] = vbRec.getLineItemValue('expense','amount',i+1);
		nlapiLogExecution('DEBUG','itemamount',item_amount);
	}
	var largest = Math.max.apply(Math, item_amount);
	nlapiLogExecution('DEBUG','Largest',largest);
	
	for(var i=0;i<currentCountexpense;i++){
		item_amount[i] = vbRec.getLineItemValue('expense','amount',i+1);
		if(item_amount[i]==largest){
		item_department = vbRec.getLineItemValue('expense','department',i+1);
		nlapiLogExecution('DEBUG','depart',item_department);
		}
	}
	}
	/*ENHC0051710-----End Added by Anchana SV*/	
	var poId = nlapiGetFieldValue('custbody_spk_poid');
	if (type == 'create') {
		if(!poId) {
			
			var k = 0;
			
			// Fetching the Bill amount and the owner information of the bill
			var vbAmount = exchangerate(vbRec);
			var vbSubs = vbRec.getFieldValue('subsidiary');
			var vbOwner = vbRec.getFieldValue('custbody_spk_inv_owner');
			var excludeSupervisor = vbRec.getFieldValue('custbody_spk_excludesupervisor');
			var nonPOBillReason = vbRec.getFieldValue('custbody_spk_nonpobillreason');
			var date = new Date();
			var requestDate = nlapiDateToString(date,'datetimetz');
			nlapiLogExecution('DEBUG', 'vbOwner is '+vbOwner, 'vbAmount '+vbAmount);
			vbRec.setFieldValue('custbody_spk_inv_converted_amt',vbAmount);
			var f1 = new Array();
			f1[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'is',vbOwner);
			f1[1] = new nlobjSearchFilter('isinactive',null,'is','F');
			var c1 = new Array();
			c1[0] = new nlobjSearchColumn('custrecord_spk_ioa_apvlvl');
			c1[1] = new nlobjSearchColumn('custrecord_spk_ioa_apvr');
			var records = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,f1,c1);			
			if(records) {
				
				if(vbSubs) { //ENHC0051710:set HTCREviewer to the Approval matrix added by Anchana SV
								k = k+1;
								setHTCReviewer(vbRec,vbSubs,vbOwner,k); 
					            vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_reqdt',requestDate);
					            vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_cmnts',nlapiGetFieldValue('custbody_rejection_comments'));
					            vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvstatus',4);
					            vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
							}
				
				try {
					k = k+1;
					// Creating Entry of the invoice Owner
					var delegate_owner = getDelegateApprover(vbOwner);
					vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
					if(delegate_owner) {
						//vbRec.setFieldValue('custbody_spk_inv_apvr',delegate_owner);
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_owner);
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', vbOwner);
					}
					else {
						//vbRec.setFieldValue('custbody_spk_inv_apvr',vbOwner);
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', vbOwner);
					}
				
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Business Owner');
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
                     vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');					
							
				}
				catch (e) {
					nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());		
				}
				
				var approverLevel = records[0].getValue('custrecord_spk_ioa_apvlvl');
				var approver = records[0].getValue('custrecord_spk_ioa_apvr');
				//Bills with Amount <= $0
				//var nonpoAmtLimit = 0;
				if(vbAmount <= parseFloat(nonpoAmtLimit)) {
				//Scenario-1: If ‘Exclude Supervisor’ flag is selected
				//set 1. Business Owner 2. FP&A  3. AP Manager
					if(excludeSupervisor == 'T') {
						/**** Setting FP&A Approver on vendor bill ******/
						//k = k+1;
						
						k = SetFPAApprover(vbRec,vbOwner,item_department,k);
						/**** ENHC0051710:Setting Senior AP clerk on vendor bill ******/
						if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec,vbSubs,vbOwner,k);
							}
						/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
						if(vbSubs) {
							k = k+1;
							SetAPManager(vbRec,vbSubs,vbOwner,k);
						} //if(vbSubs)
					}
					else { //(excludeSupervisor != 'T')
					//Scenario-2: If ‘Exclude Supervisor' flag is NOT selected; the program will route the same as the standard process today
					//set 1. Business Owner  2. Supervisor (s)  3. FP&A  4.	Executive (s) [for amount >= $10,000]  5. AP Manager
						/**** Setting Subsequent supervisor based on the Bill Amount ******/
						k = SetSupervisor(vbRec,vbOwner,vbAmount,approverLevel,approver,k);
						
						/**** Setting FP&A Approver on vendor bill ******/
						//k = k+1;
						//var dept_Owner = nlapiLookupField('employee',vbOwner,'department');
						k = SetFPAApprover(vbRec,vbOwner,item_department,k);
										
						/**** Setting Executives entry based on the vendor bill amount ******/
						nlapiLogExecution('DEBUG', 'ExecutiveReqAmtLimit '+ExecutiveReqAmtLimit, ' vbAmount '+vbAmount);
						k = SetExecutives(vbRec,vbAmount,vbOwner,k);
						
						/**** ENHC0051710 :Setting Senior AP clerk on vendor bill ******/
						if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec,vbSubs,vbOwner,k);
							}
						
						/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
						if(vbSubs) {
							k = k+1;
							SetAPManager(vbRec,vbSubs,vbOwner,k);
						} //if(vbSubs)
					}
				}
				else if(vbAmount > parseFloat(nonpoAmtLimit)) { //Bills with Amount > $1000
				//Scenario-3: If the ‘Non-PO Bill Reason’ has ‘PO Exempt’ selected, 
					if(nonPOBillReason == 1) { //PO Exempt
						/**** Setting FP&A Approver on vendor bill ******/
						//k = k+1;
						//var dept_Owner = nlapiLookupField('employee',vbOwner,'department');
						k = SetFPAApprover(vbRec,vbOwner,item_department,k);
						
						/**** ENHC0051710:Setting Senior AP clerk on vendor bill ******/
						if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec,vbSubs,vbOwner,k);
							}
						/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
						if(vbSubs) {
							k = k+1;
							SetAPManager(vbRec,vbSubs,vbOwner,k);
						} //if(vbSubs)
					}
					else if(nonPOBillReason == 2) { //PO Exception
					//Scenario-4: If the ‘Non-PO Bill Reason’ has ‘PO Exception’ selected & the ‘Exclude Supervisor’ flag is selected
					//set 1. Business Owner 2. FP&A  3. AP Manager
						if(excludeSupervisor == 'T') {
							/**** Setting FP&A Approver on vendor bill ******/
							//k = k+1;
							//var dept_Owner = nlapiLookupField('employee',vbOwner,'department');
							k = SetFPAApprover(vbRec,vbOwner,item_department,k);
							/**** ENHC0051710:Setting Senior AP clerk on vendor bill ******/
							if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec,vbSubs,vbOwner,k);
							}
							
							/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
							if(vbSubs) {
								k = k+1;
								SetAPManager(vbRec,vbSubs,vbOwner,k);
							} //if(vbSubs)
						}
						else { //(excludeSupervisor != 'T')
						//Scenario-5: If the ‘Non-PO Bill Reason’ has ‘PO Exception’ selected & the ‘Exclude Supervisor’ flag is NOT selected
						//set 1. Business Owner  2. Supervisor (s)  3. FP&A  4.	Executive (s) [for amount >= $10,000]  5. AP Manager

							/**** Setting Subsequent supervisor based on the Bill Amount ******/
							k = SetSupervisor(vbRec,vbOwner,vbAmount,approverLevel,approver,k);
							
							/**** Setting FP&A Approver on vendor bill ******/
							//k = k+1;
							//var dept_Owner = nlapiLookupField('employee',vbOwner,'department');
							k = SetFPAApprover(vbRec,vbOwner,item_department,k);
											
							/**** Setting Executives entry based on the vendor bill amount ******/
							nlapiLogExecution('DEBUG', 'ExecutiveReqAmtLimit '+ExecutiveReqAmtLimit, ' vbAmount '+vbAmount);
							k = SetExecutives(vbRec,vbAmount,vbOwner,k);
							
							/**** ENHC0051710:Setting Senior AP clerk on vendor bill ******/
							if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec,vbSubs,vbOwner,k);
							}
							
							/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
							if(vbSubs) {
								k = k+1;
								SetAPManager(vbRec,vbSubs,vbOwner,k);
							} //if(vbSubs)
						}
					}
				}
			}			
			vbRec.setFieldValue('custbody_spk_bill_creator',nlapiGetUser());
			//Submit the Vendor Bill record, along with the Approval Matrix created
			var vbRecId = nlapiSubmitRecord(vbRec);
			nlapiLogExecution('DEBUG', 'vbRecId is', vbRecId);
		}
		/****** If vendor bill is created from a purchase order , check for Service Items and Goods Items for generating Approval Matrix******/
		else if(poId)
		{
			var vbRec_PO = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
			var expenseCount = nlapiGetLineItemCount('expense');
			var vbOwner = vbRec_PO.getFieldValue('custbody_spk_inv_owner');
			var itemCount = nlapiGetLineItemCount('item');	
			var subs = vbRec_PO.getFieldValue('subsidiary');
			var vbAmount = exchangerate(vbRec_PO);
			var flag = true;
			var k = 0;
			if(itemCount) // If Item sublist has any line.
			{
				for(var i=1;i<=itemCount;i++)
				{
					var itemId = nlapiGetLineItemValue('item','item',i);
					var isServiceItem = nlapiLookupField('item',itemId,'isfulfillable');
					if(isServiceItem == 'F')
					{
						flag = false;
					}
				}
			}
			var vbSubs = vbRec_PO.getFieldValue('subsidiary');
			vbRec_PO.setFieldValue('custbody_spk_inv_converted_amt',vbAmount);			
			var date = new Date();
			var requestDate = nlapiDateToString(date,'datetimetz');
			if(vbSubs) {//ENHC0051710:set HTCREviewer to the Approval matrix
								k = k+1;
								setHTCReviewer(vbRec_PO,vbSubs,vbOwner,k); 
								vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_reqdt',requestDate);
				vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvstatus','4');
				vbRec_PO.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
							}
			//For the bills with PO, if the bill contains only goods item in it, the Invoice Business Owner should get auto-populated from the Purchase Requester  value of the corresponding Purchase Order
			if(flag == false || expenseCount)
			{
				k = k+1;
				var delegate_owner = getDelegateApprover(vbOwner);
				nlapiLogExecution('DEBUG', 'delegate_owner is', delegate_owner);
				vbRec_PO.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
				vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
				if(delegate_owner)
				{
					//vbRec_PO.setFieldValue('custbody_spk_inv_apvr',delegate_owner);
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_owner);
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', vbOwner);
				}
				else
				{
					//vbRec_PO.setFieldValue('custbody_spk_inv_apvr',vbOwner);
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', vbOwner);
				}										
				vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Business Owner');						
				vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
				vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
				vbRec_PO.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
								
			}
			/**** ENHC0051710:Setting Senior AP clerk on vendor bill ******/
			if(vbSubs) {
								k = k+1;
								SetAPClerk(vbRec_PO,vbSubs,vbOwner,k);
							}
			/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
			if(subs)
			{							
				k = k+1;
				var f3 = new Array();
				f3[0] = new nlobjSearchFilter('custrecord_spk_apm_sub',null,'anyof',subs);
				f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');
				var searchResult = nlapiSearchRecord('customrecord_spk_apm_approver',null,f3);
				if(searchResult)
				{					
					var managerRec = nlapiLoadRecord(searchResult[0].getRecordType(),searchResult[0].getId());
					var apmanager = managerRec.getFieldValue('custrecord_spk_apm_apv');
					var delegate_apmanager = getDelegateApprover(apmanager);
					vbRec_PO.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
					k=k+1;
					if(delegate_apmanager)
					{						
						vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_apmanager);
						vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof',apmanager);
					}
					else
					{
						vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', apmanager);
					}							
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','AP Manager');
					nlapiLogExecution('DEBUG', 'flag1 is'+flag, 'expenseCount1 is'+expenseCount);
					if(flag == true && (expenseCount == 0))
					{	
						nlapiLogExecution('DEBUG', 'flag is'+flag, 'expenseCount is'+expenseCount);
						//vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_reqdt',requestDate);
						//vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvstatus','4');
						//if(delegate_apmanager)
						//{
							//vbRec_PO.setFieldValue('custbody_spk_inv_apvr',delegate_apmanager);
						//}
						//else
						//{
							//vbRec_PO.setFieldValue('custbody_spk_inv_apvr',apmanager);
						//}
					}
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
					vbRec_PO.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
					vbRec_PO.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');	
				}
				else
				{
					throw nlapiCreateError('User Defined', 'The Ap Manager Record is inactive or there is no approver for the subsidiary. Please contact your Administrator.. Please contact your Administrator.', true);
				}
			}	
			vbRec_PO.setFieldValue('custbody_spk_bill_creator',nlapiGetUser());
			//Submit the Vendor Bill record
			var vbFromPOId = nlapiSubmitRecord(vbRec_PO);
			nlapiLogExecution('DEBUG','rec id is',vbFromPOId);
		}
	}
	else if(type == 'edit') // When editing the amount field, the same gets updated on custom bill as well.
	{
		var newAmount = parseFloat(nlapiGetFieldValue('usertotal'));
		var vbSubs = nlapiGetFieldValue('subsidiary');
		var vbCurrency = nlapiGetFieldValue('currency');		
		if(vbCurrency == '1') // If currency is USD.
		{
			var recId = nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_spk_inv_converted_amt',newAmount);
		}
		else
		{
			var rate = nlapiExchangeRate(vbCurrency,'USD');
			newAmount = parseFloat(newAmount * rate) ;
			var recId = nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_spk_inv_converted_amt',newAmount);
		}
		var filter = new Array();
		filter[0] = new nlobjSearchFilter('custrecord_spk_vb_billid',null,'is',nlapiGetRecordId());
		var record = nlapiSearchRecord('customrecord_spk_vendorbill',null,filter);
		if(record)
		{
			var customVbId = nlapiSubmitField(record[0].getRecordType(),record[0].getId(),'custrecord_spk_vb_cnvtrd_inv_amnt',newAmount);
		}
	}
	else if(type == 'delete') // If deleting any standard bill, corresponding bill should also get deleted.
	{
		var filter = new Array();
		filter[0] = new nlobjSearchFilter('custrecord_spk_vb_billid',null,'is',nlapiGetRecordId());
		var record = nlapiSearchRecord('customrecord_spk_vendorbill',null,filter);
		if(record)
		{
			var f1 = new Array();
			f1[0] = new nlobjSearchFilter('custrecord_spk_vb_itemlink',null,'is',record[0].getId());
			var result = nlapiSearchRecord('customrecord_spk_vb_item',null,f1);
			for(var i =0;result && i<result.length;i++)
			{
				nlapiDeleteRecord(result[i].getRecordType(),result[i].getId());
			}
			var f2 = new Array();
			f2[0] = new nlobjSearchFilter('custrecord_spk_vb_explink',null,'is',record[0].getId());
			var recs = nlapiSearchRecord('customrecord_spk_vb_exp',null,f2);
			for(var j =0;recs && j<recs.length;j++)
			{
				nlapiDeleteRecord(recs[j].getRecordType(),recs[j].getId());
			}
			nlapiDeleteRecord(record[0].getRecordType(),record[0].getId());						
		}
	}
}

// Function to check if any delegate approver is assigned to an employee record.
function getDelegateApprover(recId)
{
	var ret = null;
	if(recId)
	{
		var empRec = nlapiLoadRecord('employee',recId);
		var delegateApp = empRec.getFieldValue('custentity_spk_emp_delgt_apv');
		var isEligible = empRec.getFieldValue('custentity_spk_isdelegatereq');
		if(isEligible == 'T')
		{
			var currDate = new Date();
			var cDate = nlapiDateToString(currDate,'dd/mm/yyyy');
			var currentDate = nlapiStringToDate(cDate);
			var startDate = empRec.getFieldValue('custentity_spk_emp_delgt_stdate');
			var endDate = empRec.getFieldValue('custentity_spk_emp_delgt_enddate');			
			startDate = new Date(startDate);
			endDate = new Date(endDate);		
			if(delegateApp)
			{						
				if(startDate && endDate && (currentDate >= startDate && currentDate <= endDate))
				{
					ret = delegateApp;
				}
			}
		}
    }
	return ret;
}
/**** ENHC0051710:Setting HTC Reviewer(AP Clerk Offshore) Value based on the subsidiary of the vendor selected ******/
function setHTCReviewer(vbRec,vbSubs,vbOwner,k) {			
	var f3 = new Array();
	f3[0] = new nlobjSearchFilter('custrecord_spk_sr_ap_clerk_subsidiary',null,'anyof',vbSubs);
	f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');					
	var col3 = new Array();
	col3[0] = new nlobjSearchColumn('custrecord_spk_senior_apclerk_field');
	var searchResult = nlapiSearchRecord('customrecord_spk_sr_ap_clerk_offshore',null,f3,col3);
	if(searchResult) {
		var htcReviewerRec = searchResult[0];
		var htcReviewer = htcReviewerRec.getValue('custrecord_spk_senior_apclerk_field');
		var delegate_htcReviewer = getDelegateApprover(htcReviewer);
		nlapiLogExecution('DEBUG', 'HTC Reviewer', delegate_htcReviewer);
		vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
		if(delegate_htcReviewer) {
			vbRec.setFieldValue('custbody_spk_inv_apvr',delegate_htcReviewer);
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_htcReviewer);
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof',htcReviewer);
		}
		else {
			var apclerk = vbRec.setFieldValue('custbody_spk_inv_apvr',htcReviewer);
			nlapiLogExecution('DEBUG', 'apclerk', apclerk);
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', htcReviewer);
		}
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','HTC Reviewer');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
		vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
	}
}
function exchangerate(vbRec) {
	var totalAmt = vbRec.getFieldValue('usertotal');
	var vbCurrency = vbRec.getFieldValue('currency');
	var convertAmt = 0;
	if(vbCurrency == '1') {// If currency is USD.
		convertAmt = totalAmt;
	}
	else {
		var rate = nlapiExchangeRate(vbCurrency,'USD');
		convertAmt = parseFloat(totalAmt * rate);
	}
	return convertAmt;
}

/**** Setting Subsequent supervisor based on the Bill Amount ******/
function SetSupervisor(vbRec,vbOwner,vbAmount,approverLevel,approver,k) {
	var appDelegate = getDelegateApprover(approver);
	var amntFilter = new Array();
	var amntColumn = new Array();
	amntFilter[0] = new nlobjSearchFilter('internalid',null,'is',approverLevel);
	amntColumn[0] = new nlobjSearchColumn('custrecord_spk_apl_mxm_apvlmt');
	var rec_amnt = nlapiSearchRecord('customrecord_spk_apl_lvl',null,amntFilter,amntColumn);
	if(rec_amnt) {
		/****** Getting the supervisor Approval limit and comparing with Bill amount to determine the flow ******/					
		var approvalLimit = parseFloat(rec_amnt[0].getValue('custrecord_spk_apl_mxm_apvlmt'));
		nlapiLogExecution('DEBUG', 'Approver limit is', approvalLimit);
		if(vbAmount > approvalLimit) {
			for(var i = 1;i <= 100; i++) {
				// Creating an Entry of the supervisor based on the Bill Amount
				if(i == 1) {
					var mtrxFlag = false;
					var apMtrxCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
					nlapiLogExecution('DEBUG', 'apMtrxCount is', apMtrxCount);
					var updatedTitle = '';
					for(var m = 1;m<= apMtrxCount; m++) {
						var mtrxApp = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',m);
						var mtrxTitle = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m);
						var sprvsrApp = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_delgtof',m);
						if((mtrxApp == approver && !sprvsrApp)|| (mtrxApp == appDelegate && sprvsrApp == approver)) {
							updatedTitle = mtrxTitle + ',' + 'Supervisor' ;
							vbRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m,updatedTitle);
							mtrxFlag = true;
						}
					}
					if(mtrxFlag == false) {
						k = k+1;
						vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
						if(appDelegate) {
						
							vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',appDelegate);
							vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', approver);
						}
						else {
					
							vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', approver);
						}								
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Supervisor');
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
						vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
						//return k;
					}
				}
				else
				{
					// Check for Active Invoice Owner & Approvers
					var f2 = new Array();
					f2[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'is',approver);
					f2[1] = new nlobjSearchFilter('isinactive',null,'is','F');								
					var col2 = new Array();
					col2[0] = new nlobjSearchColumn('custrecord_spk_ioa_apvr');
					col2[1] = new nlobjSearchColumn('custrecord_spk_ioa_apvlvl');
					var InvOwnresults = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,f2,col2);		
					if(InvOwnresults) {
						try {
							var approver = InvOwnresults[0].getValue('custrecord_spk_ioa_apvr');
							var delegateApp = getDelegateApprover(approver);
							var approverLevel = InvOwnresults[0].getValue('custrecord_spk_ioa_apvlvl');
							var approvalFilter = new Array();
							var approvalColumn = new Array();
							approvalFilter[0] = new nlobjSearchFilter('internalid',null,'is',approverLevel);
							approvalColumn[0] = new nlobjSearchColumn('custrecord_spk_apl_mxm_apvlmt');
							var amntRec = nlapiSearchRecord('customrecord_spk_apl_lvl',null,approvalFilter,approvalColumn);
							if(amntRec) {// Determining the approval limit based on level of the approver
								var approvalLimit = parseFloat(amntRec[0].getValue('custrecord_spk_apl_mxm_apvlmt'));
								var currentTitle = '';
								var supervisorFlag = false;
								var mtrxCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
								nlapiLogExecution('DEBUG', 'mtrxCount5 is', mtrxCount);
								for(var m1 = 1;m1<= mtrxCount; m1++) {
									var mtrxAprvr = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',m1);
									var mtrxTitle = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m1);
									var dlgte_sprvsr = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_delgtof',m1);
									if((mtrxAprvr == approver && !dlgte_sprvsr) || (mtrxAprvr == delegateApp && dlgte_sprvsr == approver)) {
										currentTitle = mtrxTitle + ',' + 'Supervisor' ;
										vbRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m1,currentTitle);
										supervisorFlag = true;
									}
								}
								if(supervisorFlag == false) {	
									k = k+1;
									vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
									vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
									if(delegateApp) {
										vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegateApp);
										vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', approver);
									}
									else {
										vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', approver);
									}	
									vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Supervisor');
									vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
									vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
									vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
									//return k;
								}
								if(vbAmount <= approvalLimit) {
									break;
								}
							}
						}
						catch (e) {
							nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());		
						}
					}
				}
			}
		}						
		else {
			var currentTitle = '';
			var supervisorFlag = false;
			var mtrxCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
			nlapiLogExecution('DEBUG', 'mtrxCount11 is', mtrxCount);
			for(var m2 = 1;m2<= mtrxCount; m2++) {
				var mtrxAprvr = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',m2);
				var mtrxTitle = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m2);
				var sprvsrDlgte = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_delgtof',m2);
				if((mtrxAprvr == approver && !sprvsrDlgte) || (mtrxAprvr == appDelegate && sprvsrDlgte == approver)) {
					currentTitle = mtrxTitle + ',' + 'Supervisor' ;
					vbRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m2,currentTitle);
					supervisorFlag = true;
				}
			}
			if(supervisorFlag == false) {
				k = k+1;
				vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
				if(appDelegate) {
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',appDelegate);
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', approver);
				}
				else {
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', approver);
				}	
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Supervisor');
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
				vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
				//return k;
			}
		}
	}
	return k;
}

function SetFPAApprover(vbRec,vbOwner,item_department,k) { 
try{
	var fpaFilter = new Array();
	var fpaColumn = new Array();
	fpaFilter[0] = new nlobjSearchFilter('custrecord_spk_dfpa_apvdept',null,'is',item_department);
	fpaFilter[1] = new nlobjSearchFilter('isinactive',null,'is','F');				
	fpaColumn[0] = new nlobjSearchColumn( 'custrecord_spk_dfpa_apvr' );
	var fpaRecords = nlapiSearchRecord('customrecord_spk_dpt_fpa',null,fpaFilter,fpaColumn);
	if(fpaRecords) {
		
			var fpaApp = fpaRecords[0].getValue('custrecord_spk_dfpa_apvr');
			var fpaDelegate = getDelegateApprover(fpaApp);
			var fpaFlag = false;
			var mtrxCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
			nlapiLogExecution('DEBUG', 'mtrxCount fpa is', mtrxCount);
			nlapiLogExecution('DEBUG', 'fpaDelegate is'+fpaDelegate,'fpaApp is'+fpaApp);					
			var updatedTitle = '';							
			/***** Checking if the approver entry is already available in system *****/
			for(var fpam = 1;fpam<= mtrxCount; fpam++) {
				var fpanApp = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',fpam);
				var mtrxTitle = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',fpam);
				var fpaDlgteOf = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_delgtof',fpam);
				if((fpanApp == fpaApp  && !fpaDlgteOf) || (fpanApp == fpaDelegate && fpaDlgteOf == fpaApp)) {									
					updatedTitle = mtrxTitle + ',' + 'FP&A Approver' ;
					vbRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',fpam,updatedTitle);
					fpaFlag = true;
				}									
			}
			if(fpaFlag == false) {
				k = k+1;
				vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
				if(fpaDelegate) {
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',fpaDelegate);
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', fpaApp);
				}
				else {
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', fpaApp);
				}
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','FP&A Approver');
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
				vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
				vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');		
			}
		}
}
		catch (e) 
		{
			nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());		
		}
	
	return k;	
}
/**** Setting Executives entry based on the vendor bill amount ******/
function SetExecutives(vbRec,vbAmount,vbOwner,k) {
	var f5 = new Array();
	f5[0] = new nlobjSearchFilter('custrecord_spk_csa_apv_req_amt',null,'greaterthan',0);
	f5[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	var col = new Array();
	col[0] = new nlobjSearchColumn('custrecord_spk_csa_apv_req_amt');				
	col[1] = new nlobjSearchColumn('custrecord_spk_csa_apvr');
	col[2] = col[0].setSort();
	var csRecords = nlapiSearchRecord('customrecord_spk_cross_sub_apvr',null,f5,col);
	for(var n = 0;csRecords && n<csRecords.length;n++) {
		try {
			var csRec = csRecords[n];
			var approvalAmount = csRec.getValue('custrecord_spk_csa_apv_req_amt');						
			var csaApprover = csRec.getValue('custrecord_spk_csa_apvr');
			var delegate_csa = getDelegateApprover(csaApprover);
			nlapiLogExecution('DEBUG', 'vbAmount is'+vbAmount, 'approvalAmount '+approvalAmount);
			if(parseFloat(vbAmount) >= parseFloat(approvalAmount)) {
				var execFlag = false;
				var mtrxCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
				nlapiLogExecution('DEBUG', 'mtrxCount12 is', mtrxCount);
				var updatedTitle = '';							
				/***** Checking if the approver entry is already available in system *****/
				for(var m = 1;m<= mtrxCount; m++) {
					var execApp = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',m);
					var mtrxTitle = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m);
					var execDlgte = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_delgtof',m);
					if((execApp == csaApprover  && !execDlgte) || (execApp == delegate_csa && execDlgte == csaApprover)) {									
						updatedTitle = mtrxTitle + ',' + 'Executive' ;
						vbRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvrl',m,updatedTitle);
						execFlag = true;
					}									
				}
				if(execFlag == false) {
					k = k+1;									
					vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
					if(delegate_csa) {
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_csa);
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof', csaApprover);
					}
					else {
						vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', csaApprover);
					}	
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Executive');
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
					vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
					vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
				}
			}
		}
		catch (e) {
			nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());		
		}
	}
	return k;
}

/**** ENHC0051710:Setting  Senior AP Clerk  Value based on the subsidiary of the vendor selected ******/
function SetAPClerk(vbRec,vbSubs,vbOwner,k) {			
	var f3 = new Array();
	f3[0] = new nlobjSearchFilter('custrecord_spk_sr_ap_clerk_ons_sub',null,'anyof',vbSubs);
	f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');					
	var col3 = new Array();
	col3[0] = new nlobjSearchColumn('custrecord_spk_sr_ap_clerk_onshore_field');
	var searchResult = nlapiSearchRecord('customrecord_spk_sr_ap_clerk_onshore',null,f3,col3);
	if(searchResult) {
		var apclerkOnshoreRec = searchResult[0];
		var apclerkOnshore = apclerkOnshoreRec.getValue('custrecord_spk_sr_ap_clerk_onshore_field');
		var delegate_apclerkonshore = getDelegateApprover(apclerkOnshore);
		nlapiLogExecution('DEBUG', 'apClerkOnshore', delegate_apclerkonshore);
		vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
		if(delegate_apclerkonshore) {
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_apclerkonshore);
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof',apclerkOnshore);
		}
		else {
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', apclerkOnshore);
		}
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','Sr. AP Clerk');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
		vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
	}
}
/**** Setting AP Manager Value based on the subsidiary of the vendor selected ******/
function SetAPManager(vbRec,vbSubs,vbOwner,k) {			
	var f3 = new Array();
	f3[0] = new nlobjSearchFilter('custrecord_spk_apm_sub',null,'anyof',vbSubs);
	f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');					
	var col3 = new Array();
	col3[0] = new nlobjSearchColumn('custrecord_spk_apm_apv');
	var searchResult = nlapiSearchRecord('customrecord_spk_apm_approver',null,f3,col3);
	if(searchResult) {
		var managerRec = searchResult[0];
		var apmanager = managerRec.getValue('custrecord_spk_apm_apv');
		var delegate_apmanager = getDelegateApprover(apmanager);
		vbRec.selectNewLineItem('recmachcustrecord_spk_apvmtx_tranno');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_seq', k);
                k=k+1;
		if(delegate_apmanager) {
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr',delegate_apmanager);
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_delgtof',apmanager);
		}
		else {
			vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvr', apmanager);
		}
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apvrl','AP Manager');
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_apmanager',nlapiGetUser());
		vbRec.setCurrentLineItemValue('recmachcustrecord_spk_apvmtx_tranno', 'custrecord_spk_apvmtx_invown',vbOwner);
		vbRec.commitLineItem('recmachcustrecord_spk_apvmtx_tranno');
	}
      return k;
}