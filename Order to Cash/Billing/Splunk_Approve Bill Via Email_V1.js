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
//Changing the script logic again due to NS Defect in loading Vendor Record from Release Manager role in Production
/**
* Modifying the logic to accomodate "getPeriodofSubsidiary" function again. Using the new search "Task Item Status" to replace deprecated search "Period Subsidiary"
* @author Vaibhav Srivastava
* @Release Date: 17th Sep 2015
* @Release Number : 
* @Project 
* @version 1.4
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
							var period = currentRec.getFieldText('postingperiod');	// Getting the posting period
							var periodintid = currentRec.getFieldValue('postingperiod'); //Adding Posting Period internal id as the Posting Period text can not be used as a filter in the New Saved Search "Task Item Status Search"
							nlapiLogExecution('DEBUG','Test Period Id',periodintid);
							var cdate1 = new Date();
							var year = cdate1.getFullYear();						
							getperiodofSubsidiary(currentRec,year,period,custVBId,periodintid);
							
							// After Final Approval the approval status is set to "Approved" and Next Approver as "Fully Approved". 
							currentRec.setFieldValue('approvalstatus','2');
							currentRec.setFieldValue('custbody_spk_inv_apvr',finalApprover);
							if(custVBId)
							{
								var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVBId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[finalApprover,'2']);
								nlapiLogExecution('DEBUG', 'customVbId is', customVbId);
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
/*This function gets the appropriate posting period depending on the role of the user*/
function getperiodofSubsidiary(rec,year,period,custVBId,perintid)
{
	/**** Creating search for finding the open posting period ****/
	var istrue = 0;
	var subsidiary = rec.getFieldValue('subsidiary');
	nlapiLogExecution('DEBUG', 'year '+year, ' period '+ period+' subsidiary '+subsidiary+' PeriodIntid '+perintid);
	var filter = new Array();
	var column = new Array();
	filter[0] = new nlobjSearchFilter('subsidiary',null,'anyof',subsidiary);
	filter[1] = new nlobjSearchFilter('period','null','is',perintid);
	column[0] = new nlobjSearchColumn('internalid');
	//New "Task Item Status" search to be used to replace the deprecated "Period Subsidiary" search
	var result = nlapiSearchRecord(null,'customsearch_spk_task_item_status_search',filter, column);
	//nlapiLogExecution('DEBUG','result length',result.length);
	if(result) {
		for(var x=0; x<result.length;x++) {
			var itemtype = result[x].getValue('itemtype');
			nlapiLogExecution('DEBUG','Item Type',itemtype);
			if(itemtype == "Lock A/P")
				{
				var APLockStatus = result[x].getValue('complete');
				nlapiLogExecution('DEBUG','APLockStatus',APLockStatus);
				if(APLockStatus == 'F')
					{
					
					var filter1 = new Array();
					var column1 = new Array();

					filter1[0] = new nlobjSearchFilter('internalid',null,'anyof',perintid);
					column1[0] = new nlobjSearchColumn('internalid');
					var Accresult = nlapiSearchRecord('accountingperiod',null,filter1, column1);
					if(Accresult) {
						var accid = Accresult[0].getValue('internalid');
						nlapiLogExecution('DEBUG', 'accid '+accid,' Accresult '+Accresult.length);
						if(custVBId) {
							nlapiSubmitField('customrecord_spk_vendorbill',custVBId,'custrecord_spk_vb_postingperiod',accid);
						}
						rec.setFieldValue('postingperiod',accid); 	// Setting of the posting period in bill record.
						istrue = 1;
						}
					}
				}
			}
		}
		/*------Start---This part of the code is implemented so that the future dated period that are not there in "Task Item Search" can be successfully used in AP Bill---Start------*/
		else{
		nlapiLogExecution('DEBUG','The period is outside task item search','T');
			var filter1 = new Array();
			var column1 = new Array();

			filter1[0] = new nlobjSearchFilter('internalid',null,'anyof',perintid);
			column1[0] = new nlobjSearchColumn('internalid');
			var Accresult = nlapiSearchRecord('accountingperiod',null,filter1, column1);
			if(Accresult) {
				var accid = Accresult[0].getValue('internalid');
				nlapiLogExecution('DEBUG', 'accid '+accid,' Accresult '+Accresult.length);
				if(custVBId) {
					nlapiSubmitField('customrecord_spk_vendorbill',custVBId,'custrecord_spk_vb_postingperiod',accid);
				}
			rec.setFieldValue('postingperiod',accid); 	// Setting of the posting period in bill record.
			istrue = 1;
			}
		}
		/*------End---This part of the code is implemented so that the future dated period that are not there in "Task Item Search" can be successfully used in AP Bill---End------*/	
	if(istrue == 0) {			
		
		var txtPeriod = period.split(' ');					
		var monthIndex = monthNames.indexOf(txtPeriod[0]);	
		var periodinternalid = '';
//		Added line of code logic for year captured from Posting period name due to the issue with Vendor Bill Posting for 2016 (INC0090657) ie was due to current system year	: Begin	
		year = parseInt(txtPeriod[1]);
		//END		
		monthIndex = monthIndex + 1;
		nlapiLogExecution('DEBUG', 'monthIndex', monthIndex +'monthNames[monthIndex]'+ monthNames[monthIndex]+' year  '+year); 
		if(monthIndex == 12)
		{
			monthIndex = 0;
			year = parseInt(year+1);
		}
		var periodname = monthNames[monthIndex] +' '+ year;
		var filter2 = new Array();
        filter2[0] = new nlobjSearchFilter('periodname',null,'is',periodname);
		/*-------New Change as per Enhancement#---------*/
        var newperiodid = nlapiSearchRecord('accountingperiod','customsearch_spk_act_per_search_apapprov',filter2);
        for (var p in newperiodid)
			{
			periodinternalid = newperiodid[p].getValue('internalid');
			nlapiLogExecution('DEBUG','New Period Internal ID',periodinternalid);
			getperiodofSubsidiary(rec,year,periodname,custVBId,periodinternalid);	
			}
		/*-----End of New Change as per Enhancement#-----*/
	}	
}

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
