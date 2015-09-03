/**
 * Before Submit function,the script file is used for validating vendor bill record for creating Approval Matrix routing
 * @author Dinanath Bablu
 * @Release Date 15th June 2014
 * @Release Number RLSE0050216
 * @Project #PRJ0050215
 * @version 1.0
 */
//Modified Script for AP Approval Phase-II
/**
 * Changes in script method "routingValidation"  to validate the Matrix created before Bill is submitted for "NON_PO Bill Reasons", "Exclude Supervisor" and "Amount" greater or less than 1000 the matrix flow is changed.
 * @author Unitha Rangam
 * @Release Date 6th Oct 2014
 * @Release Number RLSE0050262
 * @Project # PRJ0050722
 * @version 1.1
 */
 /**
* Changes in script method "routingValidation"  to validate the Matrix created before Bill is submitted for newly added Approval steps and FP& A approver validation is changes based on the Line item department the matrix flow is changed.
* @author Anchana SV
* @Release Date 
* @Release Number 
* @Project # ENHC0051710
* @version 1.2
*/

var approve_BOD = nlapiGetContext().getSetting('SCRIPT', 'custscript_amount_bod_approval');
var ExecutiveReqAmtLimit = nlapiGetContext().getSetting('SCRIPT', 'custscript_executive_reqamtlimitphs2');
function routingValidation() // On Save function
{
	var poId = nlapiGetFieldValue('custbody_spk_poid');
	var vbSubs = nlapiGetFieldValue('subsidiary');
	var vbOwner = nlapiGetFieldValue('custbody_spk_inv_owner');
	var itemCount = nlapiGetLineItemCount('item');
	var expenseCount = nlapiGetLineItemCount('expense');
    	
	nlapiLogExecution('DEBUG', 'poId is', poId);
	var totalAmt = 0;

	var InvAmt = nlapiGetFieldValue('usertotal');
	var vbCurrency = nlapiLookupField('subsidiary',vbSubs,'currency',true);
	if(vbCurrency == '1') {
		totalAmt = InvAmt;
	}
	else {
		var rate = nlapiExchangeRate(vbCurrency,'USD');
		totalAmt = parseFloat(InvAmt * rate) ;
	}
	var item_department ='';
	var item_amount = new Array();
	if(itemCount){
	for(var i=0;i<itemCount;i++){
		item_amount[i] = nlapiGetLineItemValue('item','amount',i+1);
		nlapiLogExecution('DEBUG','itemamount',item_amount);
	}
	var largest = Math.max.apply(Math, item_amount);
	nlapiLogExecution('DEBUG','Largest',largest);
	
	for(var i=0;i<itemCount;i++){
		item_amount[i] = nlapiGetLineItemValue('item','amount',i+1);
		if(item_amount[i]==largest){
		item_department = nlapiGetLineItemValue('item','department',i+1);
		nlapiLogExecution('DEBUG','depart',item_department);
		}
	}
	}
	else if(expenseCount){
		for(var i=0;i<expenseCount;i++){
		item_amount[i] = nlapiGetLineItemValue('expense','amount',i+1);
		nlapiLogExecution('DEBUG','itemamount',item_amount);
	}
	var largest = Math.max.apply(Math, item_amount);
	nlapiLogExecution('DEBUG','Largest',largest);
	
	for(var i=0;i<expenseCount;i++){
		item_amount[i] = nlapiGetLineItemValue('expense','amount',i+1);
		if(item_amount[i]==largest){
		item_department = nlapiGetLineItemValue('expense','department',i+1);
		nlapiLogExecution('DEBUG','depart',item_department);
		}
	}
	}
	var ownerName = nlapiGetFieldText('custbody_spk_inv_owner');
	if(!poId)
	{
		// Fetching the Bill amount and the owner information of the bill

		var date = new Date();
		nlapiLogExecution('DEBUG', 'vbOwner is', vbOwner);
		var excludeSupervisor = nlapiGetFieldValue('custbody_spk_excludesupervisor');
		var nonPOBillReason = nlapiGetFieldValue('custbody_spk_nonpobillreason');
		if(vbSubs){
			var apclerkinactive =  ValidateHTCreviewer(vbSubs);
		}
		if(apclerkinactive !='T'){
			var InvownerInactive = ValidateInvoiceOwner(vbOwner); 
			if(InvownerInactive != 'T') {
				//check for Employee active for Approver
				var empactive = checkemailIsactive(vbOwner);
				if(empactive != 'T') {
					var count = 1;
					//Bills with Amount <= $1000
					var amtlimit = 1000;
					if(totalAmt <= parseFloat(amtlimit)) {
						//Scenario-1: If ‘Exclude Supervisor’ flag is selected
						//set 1. Business Owner 2. FP&A  3. AP Manager
						if(excludeSupervisor == 'T') {
							var inactive_fpa = ValidateFPAapprover(item_department);  
							if(inactive_fpa != 'T') {
								if(vbSubs) {
									var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
								}
								if(inactive_apclerkonshore !='T'){
									if(vbSubs) {
										ValidateAPManager(vbSubs);
									}
								}
							}
						}
						else { //(excludeSupervisor != 'T')
							//Scenario-2: If ‘Exclude Supervisor’ flag is NOT selected; the program will route the same as the standard process today
							//set 1. Business Owner  2. Supervisor (s)  3. FP&A  4.	Executive (s) [for amount >= $10,000]  5. AP Manager
							var isSupervisor = Supervisor(vbOwner,totalAmt,count);
							if(isSupervisor != 'T'){
								var inactive_fpa = ValidateFPAapprover(item_department);  
								if(inactive_fpa != 'T') {
									if(totalAmt >= ExecutiveReqAmtLimit) {
										nlapiLogExecution('DEBUG', 'totalAmt '+totalAmt, 'ExecutiveReqAmtLimit '+ExecutiveReqAmtLimit);
										var inactive_csr = ValidateExecutiveApprover(vbOwner,totalAmt);  
									}
									if(vbSubs) {
										var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
									}
									if(inactive_apclerkonshore !='T'){
										if(vbSubs) {
											ValidateAPManager(vbSubs);
										}
									}
								}
							} //if(vbSubs)
						}
					}
					else if(totalAmt > parseFloat(amtlimit)) { //Bills with Amount > $1000
						//Scenario-3: If the ‘Non-PO Bill Reason’ has ‘PO Exempt’ selected, 
						if(nonPOBillReason == 1) { //PO Exempt
							var inactive_fpa = ValidateFPAapprover(item_department);  
							if(inactive_fpa != 'T') {
								if(vbSubs) {
									ValidateAPManager(vbSubs);
								}
							}
						}
						else if(nonPOBillReason == 2) { //PO Exception
							//Scenario-4: If the ‘Non-PO Bill Reason’ has ‘PO Exception’ selected & the ‘Exclude Supervisor’ flag is selected
							//set 1. Business Owner 2. FP&A  3. AP Manager
							if(excludeSupervisor == 'T') {
								var inactive_fpa = ValidateFPAapprover(item_department);  
								if(inactive_fpa != 'T') {
									if(vbSubs) {
										var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
									}
									if(inactive_apclerkonshore !='T'){
										if(vbSubs) {
											ValidateAPManager(vbSubs);
										}
									}
								}
							}
						}
						else { //(excludeSupervisor != 'T')
							//Scenario-5: If the ‘Non-PO Bill Reason’ has ‘PO Exception’ selected & the ‘Exclude Supervisor’ flag is NOT selected
							//set 1. Business Owner  2. Supervisor (s)  3. FP&A  4.	Executive (s) [for amount >= $10,000]  5. AP Manager
							var isSupervisor = Supervisor(vbOwner,totalAmt,count);
							if(isSupervisor != 'T'){
								var inactive_fpa = ValidateFPAapprover(item_department);  
								if(inactive_fpa != 'T') {
									if(totalAmt >= ExecutiveReqAmtLimit) {
										nlapiLogExecution('DEBUG', 'totalAmt '+totalAmt, 'ExecutiveReqAmtLimit '+ExecutiveReqAmtLimit);
										var inactive_csr = ValidateExecutiveApprover(vbOwner,totalAmt);  
									}
									if(vbSubs) {
										var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
									}
									if(inactive_apclerkonshore !='T'){
										if(vbSubs) {
											ValidateAPManager(vbSubs);
										}
									}
								}
							}
						} //if(vbSubs)
					}
				}//if(nonPOBillReason == 2)
			}//if(totalAmt > parseFloat(amtlimit))



			else
			{
				throw nlapiCreateError('ERROR MESSAGE','The Invoice Owner record '+ownerName+ ' is in-active in ‘Invoice Owner & Approvers’ table. Please contact your administrator.',false);
				return false;
			}
		}
	}

	else if(poId)
	{
		/****** If vendor bill is created from a purchase order  ******/
		//For the bills with PO, if the bill contains only goods item in it, the Invoice Business Owner should get auto-populated from the Purchase Requester  value of the corresponding Purchase Order
		var itemCount = nlapiGetLineItemCount('item');	
		var expenseCount = nlapiGetLineItemCount('expense');
		if(vbSubs){
			var apclerkinactive =  ValidateHTCreviewer(vbSubs);
		}
		if(apclerkinactive !='T'){
			for(var i=1;itemCount && i<=itemCount;i++) {
				var itemId = nlapiGetLineItemValue('item','item',i);
				var isServiceItem = nlapiLookupField('item',itemId,'isfulfillable');
				if(isServiceItem == 'F') {
					//If service Items or Good Items
					var InvownerInactive = ValidateInvoiceOwner(vbOwner);
					if(InvownerInactive != 'T') {
						var empactive = checkemailIsactive(vbOwner);
						if(empactive != 'T') {

							if(vbSubs) {
								var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
							}
							if(inactive_apclerkonshore !='T'){
								if(vbSubs) {
									ValidateAPManager(vbSubs);
								}
							}
						}
						else {
							throw nlapiCreateError('ERROR MESSAGE','The Invoice Owner record '+ownerName+ ' is in-active in ‘Invoice Owner & Approvers’ table. Please contact your administrator.',false);
							return false;
						}
						break;
					}
					else {
						if(vbSubs) {
							var inactive_apclerkonshore = ValidateAPClerkOnshore(vbSubs);
						}
						if(inactive_apclerkonshore !='T'){
							if(vbSubs) {
								ValidateAPManager(vbSubs);
							};
						}
					}
				}
			}

		}
	}
		return true;
	}
//	Validate Invoice Owner & Approver record to check for Active Approver
	function ValidateInvoiceOwner(vbOwner) {
		var f1 = new Array();
		var c1 = new Array();
		f1[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'is',vbOwner);
		c1[0] = new nlobjSearchColumn( 'isinactive' );
		var InvOwnersearch = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,f1,c1);
		if(InvOwnersearch)
		{
			var InvownerInactive = InvOwnersearch[0].getValue('isinactive');
			return InvownerInactive;
		}
		else // Throwing message if the Invoice Owner record is inactive.
		{
			throw nlapiCreateError('ERROR MESSAGE','The Invoice Owner record is not present in ‘Invoice Owner & Approvers’ table. Please contact your administrator.',false);
			return false;
		}
	}
//	Validate Department FP&A Approvers record for the employee department and Active FP&A Approver
	function  ValidateFPAapprover(item_department) { //matrix creation function
//	Creating Entry of the FP&A Approver
				var fpaFilter = new Array();
				var column = new Array();
				fpaFilter[0] = new nlobjSearchFilter('custrecord_spk_dfpa_apvdept',null,'is',item_department);
				column[0] = new nlobjSearchColumn( 'internalid' );
				column[1] = new nlobjSearchColumn( 'custrecord_spk_dfpa_apvr' );
				column[2] = new nlobjSearchColumn( 'isinactive' );
				var fpaRecords = nlapiSearchRecord('customrecord_spk_dpt_fpa',null,fpaFilter,column);				
				if(fpaRecords){
					nlapiLogExecution('DEBUG','fpa rec is ',fpaRecords.length);
					var fpaAppName = fpaRecords[0].getValue('custrecord_spk_dfpa_apvr');
					var inactive_fpa = fpaRecords[0].getValue('isinactive');
					if(inactive_fpa == 'T'){
						throw nlapiCreateError('ERROR MESSAGE','The FP&A Approver is in-active in ‘Department FP&A Approvers’ table. Please contact your administrator.',false);
						return false;
					}
					else {
						var empactive = checkemailIsactive(fpaAppName);
						if(empactive != 'T') {
							return inactive_fpa = 'F';
						}
					}
				}					
				else{
					throw nlapiCreateError('ERROR MESSAGE','The FP&A Approver record is not present in ‘Department FP&A Approvers’ table. Please contact your administrator.',false);
					return false;
				}

	}
		
//	Validate Executive Approvers for the Invoice owner and check for Active Executive record
	function ValidateExecutiveApprover(vbOwner,totalAmt) {
		// Setting Executives entry based on the vendor bill amount 
		var f5 = new Array();
		f5[0] = new nlobjSearchFilter('custrecord_spk_csa_apv_req_amt',null,'lessthanorequalto',totalAmt);
		f5[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		var col = new Array();
		col[0] = new nlobjSearchColumn('custrecord_spk_csa_apv_req_amt');
		col[1] = col[0].setSort();
		col[2] = new nlobjSearchColumn('custrecord_spk_csa_apvr');
		col[3] = new nlobjSearchColumn('isinactive');
		var csRecords = nlapiSearchRecord('customrecord_spk_cross_sub_apvr',null,f5,col);
		if(csRecords){
			nlapiLogExecution('DEBUG','cs rec is ',csRecords.length);
			for(var n = 0; n<csRecords.length;n++){						

				var csAppName = csRecords[n].getValue('custrecord_spk_csa_apvr');
				var inactive_csr = csRecords[n].getValue('isinactive');
				if(inactive_csr == 'T'){
					throw nlapiCreateError('ERROR MESSAGE','The executive is in-active in ‘Executive Approvers’ table. Please contact your administrator.',false);
					return false;
				}
				else {
					var empactive = checkemailIsactive(csAppName);
					if(empactive != 'T') {
						return inactive_csr = 'F';
					}
				}
			}
		}
		else{					
			throw nlapiCreateError('ERROR MESSAGE','The executive record is not available in ‘Executive Approvers’ table. Please contact your administrator.',false);
			return false;
		}
	}
//	Validate Active HTC Reviewer(AP Clerk Offshore) record against the vendor bill Subsidiary
	function ValidateHTCreviewer(vbSubs) {
		var f3 = new Array();
		var c3 = new Array();
		f3[0] = new nlobjSearchFilter('custrecord_spk_sr_ap_clerk_subsidiary',null,'anyof',vbSubs);	
		f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		c3[0] = new nlobjSearchColumn('custrecord_spk_senior_apclerk_field');
		c3[1] = new nlobjSearchColumn('isinactive');					
		var searchResult = nlapiSearchRecord('customrecord_spk_sr_ap_clerk_offshore',null,f3,c3);
		if(searchResult)
		{					
			var htcReviewer = searchResult[0].getValue('custrecord_spk_senior_apclerk_field');
			var htcReviewername = searchResult[0].getText('custrecord_spk_senior_apclerk_field');
			var inactive_ap = searchResult[0].getValue('isinactive');
			if(inactive_ap == 'T')
			{
				throw nlapiCreateError('ERROR MESSAGE','The HTC Reviewer Record ' +htcReviewername+ ' is inactive. Please contact your Administrator.',false);
				return false;
			}
			else {
				var empactive = checkemailIsactive(htcReviewer);
				if(empactive != 'T') {
					return true;
				}
			}
		}							
		else
		{
			throw nlapiCreateError('ERROR MESSAGE','The HTC Reviewer for this subsidiary may be in-active or does not exist. Please contact your Administrator.',false);
			return false;
		}
	}
//	Validate Active Senior AP Clerk record against the vendor bill Subsidiary
	function ValidateAPClerkOnshore(vbSubs) {
		var f3 = new Array();
		var c3 = new Array();
		f3[0] = new nlobjSearchFilter('custrecord_spk_sr_ap_clerk_ons_sub',null,'anyof',vbSubs);	
		f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		c3[0] = new nlobjSearchColumn('custrecord_spk_sr_ap_clerk_onshore_field');
		c3[1] = new nlobjSearchColumn('isinactive');					
		var searchResult = nlapiSearchRecord('customrecord_spk_sr_ap_clerk_onshore',null,f3,c3);
		if(searchResult)
		{					
			var apclerkonshore = searchResult[0].getValue('custrecord_spk_sr_ap_clerk_onshore_field');
			var apclerkOnshorename = searchResult[0].getText('custrecord_spk_sr_ap_clerk_onshore_field');
			var inactive_ap = searchResult[0].getValue('isinactive');
			if(inactive_ap == 'T')
			{
				throw nlapiCreateError('ERROR MESSAGE','The Senior Ap Clerk Record ' +apclerkOnshorename+ ' is inactive. Please contact your Administrator.',false);
				return false;
			}
			else {
				var empactive = checkemailIsactive(apclerkonshore);
				if(empactive != 'T') {
					return true;
				}
			}
		}							
		else
		{
			throw nlapiCreateError('ERROR MESSAGE','The Senior Ap Clerk  for this subsidiary may be in-active or does not exist. Please contact your Administrator.',false);
			return false;
		}
	}

//	Validate Active AP Manager record against the vendor bill Subsidiary
	function ValidateAPManager(vbSubs) {
		var f3 = new Array();
		var c3 = new Array();
		f3[0] = new nlobjSearchFilter('custrecord_spk_apm_sub',null,'anyof',vbSubs);	
		f3[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		c3[0] = new nlobjSearchColumn('custrecord_spk_apm_apv');
		c3[1] = new nlobjSearchColumn('isinactive');					
		var searchResult = nlapiSearchRecord('customrecord_spk_apm_approver',null,f3,c3);
		if(searchResult)
		{					
			var apmanager = searchResult[0].getValue('custrecord_spk_apm_apv');
			var apmanagername = searchResult[0].getText('custrecord_spk_apm_apv');
			var inactive_ap = searchResult[0].getValue('isinactive');
			if(inactive_ap == 'T')
			{
				throw nlapiCreateError('ERROR MESSAGE','The Ap Manager Record ' +apmanagername+ ' is inactive. Please contact your Administrator.',false);
				return false;
			}
			else {
				var empactive = checkemailIsactive(apmanager);
				if(empactive != 'T') {
					return true;
				}
			}
		}							
		else
		{
			throw nlapiCreateError('ERROR MESSAGE','The Ap Manager for this subsidiary may be in-active or does not exist. Please contact your Administrator.',false);
			return false;
		}
	}

//	Validate employee's mailId and check for active employee record for the Invoice business owner of vendor bill
	function checkemailIsactive(vbOwner) {
		var f3 = new Array();
		var c3 = new Array();
		f3[0] = new nlobjSearchFilter('internalid',null,'anyof',vbOwner);	
		c3[0] = new nlobjSearchColumn('email');
		c3[1] = new nlobjSearchColumn('isinactive');
		c3[2] = new nlobjSearchColumn('entityid');	
		var empsearchResult = nlapiSearchRecord('employee',null,f3,c3);
		if(empsearchResult)
		{					
			var email = empsearchResult[0].getValue('email');
			var inactive_emp = empsearchResult[0].getValue('isinactive');
			var empname = empsearchResult[0].getValue('entityid');
			var emprec = nlapiLoadRecord('employee',vbOwner);
			var empdelegate = emprec.getFieldValue('custentity_spk_emp_delgt_apv');
			if(inactive_emp == 'T')
			{
				throw nlapiCreateError('ERROR MESSAGE','The employee record of the Approver '+empname+' is in-active. Please contact your administrator',false);
				return false;
			}
			else if(!email) {
				throw nlapiCreateError('ERROR MESSAGE','Email id is missing in the employee record of the Approver '+empname+'. Please contact your administrator.',false);
				return false;
			}
			else {
				//Validate Delegate employee's mailId and check for active employee record for the Delegate Approver
				if(empdelegate) {
					var fields = ['entityid','isinactive'] ;
					var columns = nlapiLookupField('employee',empdelegate,fields);
					var isdeleEmpActive = columns.isinactive;
					empname = columns.entityid;
					nlapiLogExecution('DEBUG', 'isdeleEmpActive '+isdeleEmpActive, ' empdelegate '+empdelegate);
					if(isdeleEmpActive == 'T') {
						throw nlapiCreateError('ERROR MESSAGE','The Delegate employee record of the Approver '+empname+' is in-active. Please contact your administrator',false);
						return false;
					}
				}
				return inactive_emp = 'F';
			}
		}							
		else
		{
			throw nlapiCreateError('ERROR MESSAGE','The employee record does not exist. Please contact your Administrator.',false);
			return false;
		}
	}

//	Validate for Active Supervisor Approver in Invoice Owner & Approvers record with the Approver Level of limit comparing with Bill total Amount
	function Supervisor(vbOwner,totalAmt,count) {
		var isSupervisor = 'F';
		var f1 = new Array();
		var c1 = new Array();
		f1[0] = new nlobjSearchFilter('custrecord_spk_ioa_invown',null,'is',vbOwner);
		c1[0] = new nlobjSearchColumn( 'custrecord_spk_ioa_apvr' );
		c1[1] = new nlobjSearchColumn( 'isinactive' );
		c1[2] = new nlobjSearchColumn( 'custrecord_spk_ioa_apvlvl' );
		c1[3] = new nlobjSearchColumn( 'custrecord_spk_ioa_invown' );
		var InvOwnersearch = nlapiSearchRecord('customrecord_spk_inv_own_apvr',null,f1,c1);
		if(InvOwnersearch) {
			var InvownerInactive = InvOwnersearch[0].getValue('isinactive');
			var approverName = InvOwnersearch[0].getValue('custrecord_spk_ioa_apvr');
			var approverNametext = InvOwnersearch[0].getText('custrecord_spk_ioa_apvr');
			var approverLevel = InvOwnersearch[0].getValue('custrecord_spk_ioa_apvlvl');
			var InvoiceOwnerName = InvOwnersearch[0].getText('custrecord_spk_ioa_invown');
			//The approvers present in the Invoice Owner & Approver’s list have the Approval Limit that is not greater or equal to the Bill Amount. There might be few approvers missing in the Invoice Owner & Approver’s list. Please contact your administrator to add the approvers to the list.
			if(approverName) {
				if(InvownerInactive == 'T') {
					throw nlapiCreateError('ERROR MESSAGE','The record for Approver '+InvoiceOwnerName+ ' is in-active in ‘Invoice Owner & Approvers’ table. Please contact your administrator.',false);
					return false;
				}
				else {
					var empactive = checkemailIsactive(approverName);
					if(empactive != 'T') {

						var limitf = new Array();
						var limitc = new Array();
						limitf[0] = new nlobjSearchFilter('isinactive',null,'is','F');
						limitc[0] = new nlobjSearchColumn( 'custrecord_spk_apl_mxm_apvlmt',null,'max');
						var maxlimitsearch = nlapiSearchRecord('customrecord_spk_apl_lvl',null,limitf,limitc);
						if(maxlimitsearch) 
						{
							var maxlimitAmt = maxlimitsearch[0].getValue(limitc[0]);
							nlapiLogExecution('DEBUG', 'totalAmt is '+totalAmt, ' maxlimitAmt '+maxlimitAmt+' maxlimitsearch '+maxlimitsearch.length);
							if((totalAmt <= maxlimitAmt) || (totalAmt > approve_BOD))
							{
								var approverlevelAmount = nlapiLookupField('customrecord_spk_apl_lvl',approverLevel,'custrecord_spk_apl_mxm_apvlmt');
								nlapiLogExecution('DEBUG', 'approverlevelAmount is '+approverlevelAmount, ' totalAmt '+totalAmt);
								if(totalAmt > approverlevelAmount) {
									nlapiLogExecution('DEBUG', 'approverName is '+approverName, ' approverNametext '+approverNametext);
									Supervisor(approverName,totalAmt,2);
									isSupervisor = 'T';
								}
							}
							else {
								throw nlapiCreateError('ERROR MESSAGE','The Invoice Amount has crossed the maximum approval limit set in the AP Approval Level list. Please contact your administrator to add another approval limit & assign the limit to Approvers; to be able to create this Invoice.',false);
								return false;
							}
						}

						var f5 = new Array();
						var col = new Array();
						f5[0] = new nlobjSearchFilter('custrecord_spk_csa_apv_req_amt',null,'greaterthan',0);
						f5[1] = new nlobjSearchFilter('isinactive',null,'is','F');
						col[0] = new nlobjSearchColumn('custrecord_spk_csa_apv_req_amt');
						col[1] = col[0].setSort();
						col[2] = new nlobjSearchColumn('custrecord_spk_csa_apvr');
						var csRecords = nlapiSearchRecord('customrecord_spk_cross_sub_apvr',null,f5,col);
						for(var n = 0;csRecords && n<csRecords.length;n++) {
							var approvalAmount = csRecords[n].getValue('custrecord_spk_csa_apv_req_amt');	
							var Exapprovalname = csRecords[n].getValue('custrecord_spk_csa_apvr');	
							if(totalAmt >= approvalAmount) { 
								checkemailIsactive(Exapprovalname);
							}
						}
						return isSupervisor = 'F';
					}
				}
			}
			else {// Throwing message if the Approver record doesn't exist
				throw nlapiCreateError('ERROR MESSAGE','The approvers present in the Invoice Owner & Approver’s list have the Approval Limit that is not greater or equal to the Bill Amount. There might be few approvers missing in the Invoice Owner & Approver’s list. Please contact your administrator to add the approvers to the list.',false);
				return false;
			}
		}
		else 
		{// Throwing message if the Invoice Owner record is inactive.
			if(count == 1) {
				throw nlapiCreateError('ERROR MESSAGE','The Invoice Owner record is not present in ‘Invoice Owner & Approvers’ table. Please contact your administrator.',false);
				return false;
			}
			if(count == 2 && (totalAmt <= approve_BOD)) {
				throw nlapiCreateError('ERROR MESSAGE','The approvers present in the Invoice Owner & Approver’s list have the Approval Limit that is not greater or equal to the Bill Amount. There might be few approvers missing in the Invoice Owner & Approver’s list. Please contact your administrator to add the approvers to the list.',false);
				return false;
			}
		}
	}