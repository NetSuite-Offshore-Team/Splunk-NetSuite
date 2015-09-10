/**
* This script file is used when User clicks on "Approve" button from UI of Vendor bill, A suitelet is called to set the Approval Matrix Status to Approve with Approval Date and Next Approver Status to Pending Approval.  The Workflows are triggered to Send Mail for each Bill Approval.
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/
//Modified Script for AP Approval Phase-II
/**
* Modified Posting Period method "getperiod" by replacing with new method "getperiodofSubsidiary", to update Posting period for AP locked unlocked subsidiaries
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
//Modified the code to run the script for Release Manager Role
/**
* Getting rid of the method getperiodofSubsidiary 
* @author Vaibhav Srivastava
* @Release Date: 12th Sep 2015
* @Release Number : ENHC0052043
* @Project 
* @version 1.3
*/

var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var amount_BOD = nlapiGetContext().getSetting('SCRIPT', 'custscript_amount_bod_approval');
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var finalApprover = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_finalapprover');
function onApproveVB(request, response) 
{
   try 
	{
		if(request.getMethod() == 'GET') // GET call
		{
			var role = nlapiGetRole();
			// Passing the vendor bill as parameter in Suitelet
			var vbId = request.getParameter('vbId');
			var crid = request.getParameter('crid');
			nlapiLogExecution('DEBUG', 'Checking', 'Starting......');			
			var currentRec = nlapiLoadRecord('vendorbill', vbId);
			var owner = currentRec.getFieldValue('custbody_spk_inv_owner');
			var custVbId = currentRec.getFieldValue('custbody_spk_vd_id');			
			var vbillAmount = parseFloat(currentRec.getFieldValue('custbody_spk_inv_converted_amt'));
			var user = nlapiGetUser();
			var lineCount = 0;
			var approvalDate = new Date();
			var apprvlDate = nlapiDateToString(approvalDate, 'datetimetz');
			// Getting the count of line items of the vendor bill
			var count = currentRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
			nlapiLogExecution('DEBUG', 'count is', count);
			if(count >0)
			{
				for(var i=1;count && i<=count;i++)
				{	
					// Fetching status of each record one by one
					var status = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',i);
					if(status == '4' || status == '3') // If status is "Pending Approval" or "Rejected".
					{
						if(role == '3')
						{		
							// Function called for requesting to enter SNOW ticket reference.
							updateAdminFields(vbId,crid,apprvlDate,i,count);
							break;
						}
						else
						{
							nlapiLogExecution('DEBUG', 'status is'+status, 'custVbId is'+custVbId);
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
								currentRec.setFieldValue('custbody_spk_inv_apvr',nextApprover);
								currentRec.setFieldValue('approvalstatus','1');
								//*** Start setting the invoice approver field on custom vendor bill 					
								if(custVbId)
								{
									var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'1']);
									nlapiLogExecution('DEBUG', 'customVbId is', customVbId);								
								}
								var recId = nlapiSubmitRecord(currentRec,true); // Submitting the record after updating the fields.
								var rec_VB = nlapiLoadRecord('vendorbill',recId);
								// Triggering workflow for sending the mails.
								nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', rec_VB.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',lineCount), 'customworkflow_spk_ap_inv_apv_ntfcn');
								nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', rec_VB.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',parseInt(lineCount)+1), 'customworkflow_spk_ap_inv_apv_ntfcn');
												
								if(crid)
								{
								// Based on Permission roles assigned to the user, the User is navigated to Purchase Requestor Vendor Bill in view mode
									nlapiSetRedirectURL('RECORD', 'customrecord_spk_vendorbill', crid, false);
								}
								else
								{
								//if User Have access to vendor Bill record then the user is redirected to Vendor Bill record in view mode
									nlapiSetRedirectURL('RECORD', 'vendorbill', recId, false);
								}
								break;
							}
							else
							{
								try
								{
									var flag = false;
									var bodApp = currentRec.getFieldValue('custbody_spk_inv_bod_apvr');
									var poId = currentRec.getFieldValue('custbody_spk_poid');
									nlapiLogExecution('DEBUG', 'amount_BOD is',amount_BOD);
									if(vbillAmount > amount_BOD && !poId && bodApp == 'F')
									{
										nlapiLogExecution('DEBUG', 'bodApp inside is',bodApp);
										verifyBOD(vbillAmount,vbId,crid,apprvlDate,i);
										flag = true;
									}
									var period = currentRec.getFieldText('postingperiod');	// Getting the posting period
									var cdate1 = new Date();
									var year = cdate1.getFullYear();
									
									/*********** Below search filter used to check user has Override Period Restrictions or not ************/								
									var context = nlapiGetContext();	
									var userRole = context.getRole(); // Getting the user current role
									var currentUser = context.getUser(); // User id
									
									nlapiLogExecution('DEBUG', 'userRole '+userRole, 'currentUser '+currentUser);

								
										if(custVbId)
										{	

											var custId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,'custrecord_spk_vb_postingperiod',currentRec.getFieldValue('postingperiod'));
										}

									if(flag == false)
									{
										// After Final Approval the approval status is set to "Approved" and "Fully Approved" as Next Approver. 
										currentRec.setFieldValue('approvalstatus','2');
										currentRec.setFieldValue('custbody_spk_inv_apvr',finalApprover);
										currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',i,apprvlDate);
										currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',i,'2');
										if(custVbId)
										{
											var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'2']);
											nlapiLogExecution('DEBUG', 'customVbId is', customVbId);
										}
										var vbRecId = nlapiSubmitRecord(currentRec,true); // Submitting the record after updating the fields.									
										// Triggering workflow for sending the mails.
										var xx = nlapiLoadRecord('vendorbill',vbRecId);							
										var custRecordId = xx.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',i);
										nlapiLogExecution('DEBUG', 'custRecordId2 is', custRecordId);
										nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', custRecordId, 'customworkflow_spk_ap_inv_apv_ntfcn');
										
										if(crid)
										{
											nlapiSetRedirectURL('RECORD', 'customrecord_spk_vendorbill', crid, false);
										}
										else
										{
											nlapiSetRedirectURL('RECORD', 'vendorbill', vbRecId, false);
										}
									}
								}								/****** End ******/
								catch(e)
								{
									if (e instanceof nlobjError)
									{
										nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails());
									}	
									else
									{
										nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString());
									}
								}	
							}
						}
					}
				}
			}
			else
			{
				// function to Validate Bill to assign Owner and then to re-initiating Approval on bill
				assignOwner(vbId,owner);
			}
		}
		else  // POST call
		{
			if(request.getParameter('submitter') == 'OK')
			{
				var snowRef = request.getParameter('custpage_ticketref');
				var count = parseInt(request.getParameter('custpage_count'));
				var billId = request.getParameter('custpage_billid');				
				var crId = request.getParameter('custpage_crid');
				var apprvlDate = request.getParameter('custpage_apprvdate');
				nlapiLogExecution('DEBUG', 'billId is'+billId,'crId is'+crId);
					
				if(billId)
				{
					var currentRec = nlapiLoadRecord('vendorbill',billId);
					var poId = currentRec.getFieldValue('custbody_spk_poid');
					var custVbId = currentRec.getFieldValue('custbody_spk_vd_id');
					var bodApp = currentRec.getFieldValue('custbody_spk_inv_bod_apvr');
					var vbAmount = parseFloat(currentRec.getFieldValue('custbody_spk_inv_converted_amt'));
					var totalCount = currentRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
					nlapiLogExecution('DEBUG', 'totalCount is'+totalCount, 'count is'+count);
					currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',count,apprvlDate);
					currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',count,'2');
					if(snowRef)
					{
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_snowref',count,snowRef);
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_overrideapp',count,nlapiGetUser());
					}
					var bodFlag = false;
					var lineCount = count;						
					nlapiLogExecution('DEBUG', 'bodApp is'+bodApp, 'vbAmount is'+vbAmount);
					if(count < totalCount)
					{
						// Setting the Approval Date and Approval Status
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_reqdt',count+1,apprvlDate);
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',count+1,'4');
						var nextApprover = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',count+1);
						currentRec.setFieldValue('custbody_spk_inv_apvr',nextApprover);						
						currentRec.setFieldValue('approvalstatus','1');
						//*** Start setting the invoice approver field on custom vendor bill 					
						if(custVbId)
						{
							var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'1']);
							nlapiLogExecution('DEBUG', 'customVbId is', customVbId);								
						}
					}
					else if(vbAmount > amount_BOD && count == totalCount && !poId && bodApp == 'F')   
					{
						if(crId)
						{
							nlapiSetRedirectURL('RECORD', 'customrecord_spk_vendorbill', crId, true);
						}
						else
						{
							nlapiSetRedirectURL('RECORD', 'vendorbill', billId, true);
						}
						bodFlag = true;
					}
					else
					{
						currentRec.setFieldValue('approvalstatus','2');
						currentRec.setFieldValue('custbody_spk_inv_apvr',finalApprover);						
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',count,apprvlDate);
						currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',count,'2');
					}
					if(bodFlag == false)
					{
						var recId = nlapiSubmitRecord(currentRec,true); // Submitting the record after updating the fields.
						var rec_VB = nlapiLoadRecord('vendorbill',recId);					
						if(count < totalCount)
						{
							// Triggering workflow for sending the mails.
							nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', rec_VB.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',parseInt(lineCount)+1), 'customworkflow_spk_ap_inv_apv_ntfcn');
						}
						else
						{												
							var custRecordId = rec_VB.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',count);
							nlapiLogExecution('DEBUG', 'custRecordId2 is', custRecordId);
							nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', custRecordId, 'customworkflow_spk_ap_inv_apv_ntfcn');
						}
						nlapiLogExecution('DEBUG', 'recId is',recId);
						nlapiSetRedirectURL('RECORD', 'vendorbill', billId , false);
					}
				}
				else if(crId)
				{
					nlapiSetRedirectURL('RECORD', 'customrecord_spk_vendorbill', crId, false);
				}	
			}
			else if(request.getParameter('submitter') == 'Submit')
			{
				nlapiLogExecution('DEBUG', 'Post else', 'test');
				var billId = request.getParameter('custpage_billid');
				nlapiSetRedirectURL('RECORD', 'vendorbill', billId, true);
			}
			else if(request.getParameter('submitter') == 'Go Back')
			{
				var billId = request.getParameter('custpage_billid');
				nlapiSetRedirectURL('RECORD', 'vendorbill', billId, false);
			}
		}
	} 
	catch (er) 
	{
		nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
		if(crid)
		{
			('RECORD', 'nlapiSetRedirectURLcustomrecord_spk_vendorbill', crid, false);
		}
		else
		{
			nlapiSetRedirectURL('RECORD', 'vendorbill', recId, false);
		}
	}
}

// Function called for requesting BOD approval.
function verifyBOD(amount,vbId,crid,apprvlDate,count) 
{
	var form = nlapiCreateForm('BOD Approval');
	var field = form.addField('custpage_bodaprvl', 'text', 'Error:');
	var fielddate = form.addField('custpage_apprvdate', 'text', 'Date').setDisplayType('hidden').setDefaultValue(apprvlDate);
	var customRecId = form.addField('custpage_crid', 'text', 'CR Id').setDisplayType('hidden').setDefaultValue(crid);
	var vbAmount = parseFloat(amount);
	field.setDisplayType('inline').setDefaultValue('Vendor Bill amount '+ vbAmount +' requires Board of Director approval. Once approval received, please mark it complete by selecting the ‘Board of Director Approval’ check box & then approve the bill.');									
	var billId = form.addField('custpage_billid','text','Vendor Bill Id').setDisplayType('hidden').setDefaultValue(vbId);
	var count_i = form.addField('custpage_count','text','Count').setDisplayType('hidden').setDefaultValue(count);	
	form.setScript('customscript_spk_cancel_and_poid');
	form.addButton('custpage_cancel','Cancel','cancel('+vbId+');');	
	form.addSubmitButton('OK');	
	response.writePage(form);
}

// Function called for requesting to enter SNOW ticket reference.
function updateAdminFields(vbId,crid,apprvlDate,i,count)
{
	var amount_BOD = nlapiGetContext().getSetting('SCRIPT', 'custscript_amount_bod_approval');
	var vbRec = nlapiLoadRecord('vendorbill',vbId);	
	var poId = vbRec.getFieldValue('custbody_spk_poid');
	var vbAmount = parseFloat(vbRec.getFieldValue('custbody_spk_inv_converted_amt'));
	var bodApp = vbRec.getFieldValue('custbody_spk_inv_bod_apvr');
	nlapiLogExecution('DEBUG', 'bodApp in snow is'+bodApp, 'vbAmount in snow'+vbAmount);
	
	var form = nlapiCreateForm('SNOW Ticket Reference');
	form.setScript('customscript_spk_cancel_and_poid');
	var field = form.addField('custpage_ticketref', 'text', 'SNOW Ticket #').setMandatory( true );
	var fielddate = form.addField('custpage_apprvdate', 'text', 'Date').setDisplayType('hidden').setDefaultValue(apprvlDate); 
	var billId = form.addField('custpage_billid','text','Vendor Bill Id').setDisplayType('hidden').setDefaultValue(vbId);
	var count_i = form.addField('custpage_count','text','Current Count').setDisplayType('hidden').setDefaultValue(i);
	var totalCount = form.addField('custpage_totalcount','text','Total Count').setDisplayType('hidden').setDefaultValue(count);
	if((i == count) && vbAmount > amount_BOD && !poId && bodApp == 'F')
	{
		var field = form.addField('custpage_bodaprvl', 'textarea', 'Error:');
		field.setDisplayType('inline').setDefaultValue('Vendor Bill amount '+ vbAmount +' requires Board of Director approval. Once approval received, please mark it complete by selecting the ‘Board of Director Approval’ check box & then approve the bill.');									
	}
	var customRecId = form.addField('custpage_crid', 'text', 'CR Id').setDisplayType('hidden').setDefaultValue(crid);
	form.addSubmitButton('OK');	
	form.addButton('custpage_cancel','Cancel','cancel_admin('+vbId+');');	
	response.writePage(form);
}

// function to Validate Bill to assign Owner and then to re-initiating Approval on bill
function assignOwner(recId,owner)
{	
	if(recId)
	{
		nlapiLogExecution('DEBUG', 'recId is',recId);
		var form = nlapiCreateForm('Enter Owner Record');
		var billId = form.addField('custpage_billid', 'text', 'Vendor Id').setDisplayType('hidden').setDefaultValue(recId);
		if(!owner)
		{
			var field = form.addField('custpage_ticketref', 'text', 'ERROR: ').setDisplayType('inline').setDefaultValue('Please assign an Invoice Owner and then click Re-Initiate Approval Button on Bill Page.');	
			form.addSubmitButton('Submit');
		}
		else
		{
			var field = form.addField('custpage_ticketref', 'text', 'ERROR: ').setDisplayType('inline').setDefaultValue('Please click Re-Initiate Approval Button on Bill Page to generate the Approval Matrix.');	
			form.addSubmitButton('Go Back');
		}				
		response.writePage(form);
	}
}