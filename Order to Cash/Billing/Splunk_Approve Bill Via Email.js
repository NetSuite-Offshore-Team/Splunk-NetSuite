/**
* This script file is used when User clicks on "Approve" link from Email, A suitelet is called to set the Approval Matrix Status to Approve with Approval Date and Next Approver Status to Pending Approval.  The Workflows are triggered to Send Mail for each Bill Approval.
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/
//Modified Script for AP Approval Phase-II
/**
* 1.Logic applied on html page to close window of the browser automatically once bill Approve link is clicked from email.
* 2.Modified Posting Period method "getperiod" by replacing with new method "getperiodofSubsidiary", to update Posting period for AP locked unlocked subsidiaries
* @author Unitha Ranagam
* @Release Date 6th Oct 2014
* @Release Number RLSE0050262
* @Project # PRJ0050722
* @version 1.1
*/
//Modified line of code in method getperiodofSubsidiary
/**
* Added inline logic for year captured from Posting period name due to the issue with Vendor Bill Posting for 2016 (INC0090657)
* @author Unitha Rangam
* @Release Date 13th Jan 2015
* @Release Number RLSE0050308
* @Project # DFCT0050493
* @version 1.2
*/
//Modified the code to run the script from Release Manager Role. 
/**
* Getting rid of the method getperiodofSubsidiary 
* @author Vaibhav Srivastava
* @Release Date: 12th Sep 2015
* @Release Number : ENHC0052043
* @Project 
* @version 1.3
*/

var finalApprover = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_finalapprover');
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function approveBill(request,response)
{
	// Passing the vendor bill as parameter in Suitelet
    var vbId = request.getParameter('vbId');	
	var empRecId = request.getParameter('empId');
	var sequenceId = request.getParameter('seqId');
    if (vbId) 
	{
        try 
		{			
			var lineCount = 0;
			var cancelFlag = 0;
            nlapiLogExecution('DEBUG', 'Checking', 'Starting......');			
			var currentRec = nlapiLoadRecord('vendorbill', vbId);
			var custVBId = currentRec.getFieldValue('custbody_spk_vd_id');
			var status_Bill = currentRec.getFieldValue('status');
			nlapiLogExecution('DEBUG', 'status_Bill is'+status_Bill,'cancelFlag is'+cancelFlag);
			var user = nlapiGetUser();
			if(status_Bill != 'Cancelled')
			{
				var approvalDate = new Date();
				var flag = 0;
				cancelFlag = 1;
				var apprvlDate = nlapiDateToString(approvalDate, 'datetimetz');
				// Getting the count of line items of the vendor bill
				var count = currentRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
				nlapiLogExecution('DEBUG', 'count is'+count,'vbId is'+vbId);			
				for(var i=1;i<=count;i++)
				{
					if(i == 1 && sequenceId == null)
					{
						sequenceId = 1;
					}
					// Fetching status of each record one by one
					var status = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',i);				
					var approver = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',i);
					if(status == '4' &&(empRecId == approver) && (sequenceId == i)) // If status is "Pending Approval".
					{
						nlapiLogExecution('DEBUG', 'status is'+status, 'custVBId is'+custVBId);
						// Setting the Approval Date and Approval Status
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',i,apprvlDate);
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',i,'2');
						
						lineCount = i;
						if(i<count)
						{						
							// Setting the Approval Date and Approval Status
							currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_reqdt',i+1,apprvlDate);
							currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',i+1,'4');
							var nextApprover = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',i+1);
							currentRec.setFieldValue('approvalstatus','1');
							currentRec.setFieldValue('custbody_spk_inv_apvr',nextApprover);
							/*** Start setting the invoice approver field on custom vendor bill ****/						
							if(custVBId)
							{
								var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVBId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'1']);
								nlapiLogExecution('DEBUG', 'customVbId is', customVbId);
							}
						}
						else
						{
							currentRec.setFieldValue('approvalstatus','2');
							currentRec.setFieldValue('custbody_spk_inv_apvr',finalApprover);

							if(custVBId)
							{
								var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVBId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[finalApprover,'2']);
								var custId = nlapiSubmitField('customrecord_spk_vendorbill',custVBId,'custrecord_spk_vb_postingperiod',currentRec.getFieldValue('postingperiod'));
								nlapiLogExecution('DEBUG', 'customVbId is', custVBId);
							}
						}	
						flag = 1;					
						break;
					}
					else if(empRecId == approver && (sequenceId == i))
					{
						nlapiLogExecution('DEBUG', 'IN', 'HERE');
						if(status == '2')
						{
							flag = 0;
							break;
						}
						if(status == '3')
						{
							flag = 2;
							break;
						}
					}
				}
				var recId = nlapiSubmitRecord(currentRec,true); // Submitting the record after updating the fields.
				var xx = nlapiLoadRecord('vendorbill',recId);
				if(i<count && flag == 1)
				{				
					//nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', xx.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',lineCount), 'customworkflow_spk_ap_inv_apv_ntfcn');
					nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', xx.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',parseInt(lineCount)+1), 'customworkflow_spk_ap_inv_apv_ntfcn');
				}
				else if(i == count && flag == 1)
				{
					nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', xx.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',lineCount), 'customworkflow_spk_ap_inv_apv_ntfcn');
				}
				/**** Messages Based on the conditions ****/
				//AP Approval Phase 2 : Begin - Added Auto close window Condition once bill is approved
				if(flag == 1)
				{
					var html = '';
					html = html + '<center><p><h3>You have approved the bill successfully.</h3></p></center>';
					html = html +'<script>setTimeout(function () { window.close();}, 3000);</script>';
					response.write(html);
				}
				if(flag == 0)
				{
					var html = '';
					html = html + '<center><p><h3>The Vendor bill has already been approved.</h3></p></left>';
					html = html +'<script>setTimeout(function () { window.close();}, 3000);</script>';
					response.write(html);
				}
				if(flag == 2)
				{
					var html = '';
					html = html + '<center><p><h3>The Vendor bill has already been Rejected.</h3></p></left>';
					html = html +'<script>setTimeout(function () { window.close();}, 3000);</script>';
					response.write(html);
				}
			}
			else if(cancelFlag == 0)
			{
				var html = '';
				html = html + '<center><p><h3>The Vendor bill has already been cancelled.</h3></p></left>';
				html = html +'<script>setTimeout(function () { window.close();}, 3000);</script>';
				response.write(html);
			}
        } 
        catch (er) 
		{
            nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
			var html = '';
			html = html + '<left><p><h3>The Vendor bill is either in Approved or Rejected Status.</h3></p></left>';
			html = html +'<script>setTimeout(function () { window.close();}, 3000);</script>';
			response.write(html);
        }
    }
}
//AP Approval Phase 2 : End


// Function to check if any delegate approver is assigned to an employee record.
function getDelegateApprover(approverId)
{
	var ret = null;
	if(approverId)
	{
		var empRec = nlapiLoadRecord('employee',approverId);
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
				nlapiLogExecution('DEBUG', 'startDate is'+startDate,'endDate is'+endDate);					
				if(startDate && endDate && (currentDate >= startDate && currentDate <= endDate))
				{
					ret = delegateApp;
				}
			}
		}
    }
	return ret;
}
