/**
* This script file is used for creating custom vendor bill called 'Purchase Requestor Vendor Bill' at the time of creating a standard vendor bill. 
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/

/**
* This script file is used for setting the value of "Description column" of Description items from vendor bill to Purchase Requestor Vendor Bill.
* @author Mukta Goyal
* @Release Date-22-May-2015
* @Defect No- DFCT0050687
* @Release Number -RLSE0050369
* @version 1.1
*/
/**
* This script file is modified for setting the value of "Amortization Schedule" field in line items from vendor bill to Purchase Requestor Vendor Bill.
* @author Anchana SV
* @Release Date
* @Defect No- ENHC0051710 
* @Release Number -
* @version 1.2
*/


/****Scheduled script for Triggering the User Event Script to populate the amortization schedule internal id from the Vendor bill to Purchase Requestor Vendor bill***/
function vendorbillscheduledscript(type){
	var param = nlapiGetContext().getSetting('SCRIPT', 'custscriptrecid1');//script parameter
	nlapiLogExecution('Debug','working1',p);
	var z=param.split(',');
	nlapiLogExecution('Debug','z length=',z.length);
	var recid=z[0];
	nlapiLogExecution('Debug','recid=',recid);
	var recload=nlapiLoadRecord('vendorbill',recid)
		var refname = recload.getFieldValue('tranid');
		var itemCount = recload.getLineItemCount('item');
		var expenseCount = recload.getLineItemCount('expense');
		 if(itemCount){
			   for(var i=1;i<=itemCount;i++)
				{
					
					recload.setLineItemValue('item','custcol_spk_amortsch_hidden',i,z[i]);
				}
		}
		else if(expenseCount){
				for(var i=1;i<=expenseCount;i++)
				{
					
					recload.setLineItemValue('expense','custcol_spk_amortsch_hidden',i,z[i]);
				
	            }
				
		}
		nlapiSubmitRecord(recload);
}

var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var userRole = nlapiGetRole();
function addButtonOnLoad(type,form)
{
if(type == 'view' && nlapiGetContext().getExecutionContext()=='userinterface'   ) // on view mode.
	{   
		if(nlapiGetRecordType() == 'vendorbill')
		{
		nlapiLogExecution('DEBUG','outsdie if',nlapiLookupField('vendorbill',nlapiGetRecordId(),'status'));	
		if(nlapiLookupField('vendorbill',nlapiGetRecordId(),'status')!='cancelled' ){
			nlapiLogExecution('DEBUG','insdide if',nlapiLookupField('vendorbill',nlapiGetRecordId(),'status'));
	var recload=nlapiLoadRecord('vendorbill',nlapiGetRecordId())
		var refname = recload.getFieldValue('tranid');
		var filters = new Array();
		var columns = new Array();
		var itemCount = recload.getLineItemCount('item');
		var expenseCount = recload.getLineItemCount('expense');
		var amort ='';
		var myParams = Array();
		myParams[0]=nlapiGetRecordId()+',';
		     if(itemCount){
			   for(var i=1;i<=itemCount;i++)
				{
					
					amort = nlapiGetLineItemValue('item','amortizationsched',i);
					
					nlapiLogExecution('DEBUG', 'amort', amort);
					//var amort1=recload.setLineItemValue('item','custcol_spk_amortsch_hidden',i,nlapiGetLineItemValue('item','amortizationsched',i));
					nlapiLogExecution('DEBUG', 'amort1', nlapiGetLineItemValue('item','custcol_spk_amortsch_hidden',i));
					myParams[i] = amort+',';
				
					
				}
		}
		else if(expenseCount){
				for(var i=1;i<=expenseCount;i++)
				{
					
					amort = nlapiGetLineItemValue('expense','amortizationsched',i);
					
					nlapiLogExecution('DEBUG', 'amort', amort);
					//var amort1=recload.setLineItemValue('expense','custcol_spk_amortsch_hidden',i,amort);
			        nlapiLogExecution('DEBUG', 'amort', nlapiGetLineItemValue('item','custcol_spk_amortsch_hidden',i));
					
					myParams[i] = amort+',';
				
					
	            }	
		
		
		
		var paramObj = new Array();
	paramObj['custscriptrecid1'] =myParams;
				nlapiScheduleScript('customscript_spk_vb_amortsch_schscript', 'customdeploy_spk_amort_schedscript', paramObj);
		//nlapiSubmitRecord(recload);
		}
		}
		}
		
		
		if(nlapiGetRecordType() == 'customrecord_spk_vendorbill')
		{
			try
			{
				form.setScript('customscript_spk_cntrl_buttonclick');
				var id = nlapiGetFieldValue('custrecord_spk_vb_billid');
				nlapiLogExecution('DEBUG', 'rec On load  id is', id);
				var user = nlapiGetUser();
				// If user is next approver or an administrator and the approval status is "Pending Approval".				
				if (id && (user == nlapiGetFieldValue('custrecord_spk_vb_approver') || userRole == '3') && nlapiGetFieldValue('custrecord_spk_vb_approvalstatus') != '2' )
				{
					if(nlapiGetFieldValue('custrecord_spk_vb_approvalstatus') == '1')
					{
						form.addButton('custpage_approve', 'Approve', 'BtnCheck_App();'); // Creation of "Approve" Button
					}
					if(nlapiGetFieldValue('custrecord_spk_vb_approvalstatus') != '3') 
					{
						form.addButton('custpage_reject', 'Reject', 'BtnCheck_Rej();'); // Creation of "Reject" Button
					}
				}
			} 
			catch (e) 
			{
				nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
			}
		}
	
	}
}

// Function to create Custom Vendor Bill record  and initiate the Workflow for sending email notification for the next approver
function createCustomVbill(type,form) // AfterSubmit Function of UserEvent Script
{	
	try
	{
		if(nlapiGetRecordType() == 'vendorbill')
		{
			// Loading the vendor bill
			var vbRec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());			
			var currentCount = vbRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');
			nlapiLogExecution('DEBUG','vbRec Id is '+vbRec.getId(),'currentCount is'+currentCount);
			if(type == 'create')
			{
				/******* Creating a custom Vendor Bill(Purchase Requestor Vendor Bill) along with the Items *******/
				var customVBRec = nlapiCreateRecord('customrecord_spk_vendorbill');
				customVBRec.setFieldValue('custrecord_spk_vb_currency', vbRec.getFieldValue('currency'));
				customVBRec.setFieldValue('custrecord_spk_vb_account', vbRec.getFieldValue('account'));
				customVBRec.setFieldValue('custrecord_spk_vb_vendor', vbRec.getFieldValue('entity'));
				customVBRec.setFieldValue('custrecord_spk_vb_subsidiary', vbRec.getFieldValue('subsidiary'));
				customVBRec.setFieldValue('custrecord_spk_vb_postingperiod', vbRec.getFieldValue('postingperiod'));
				customVBRec.setFieldValue('custrecord_spk_vb_date', vbRec.getFieldValue('trandate'));
				customVBRec.setFieldValue('custrecord_spk_vb_terms', vbRec.getFieldValue('terms'));
				customVBRec.setFieldValue('custrecord_spk_vb_duedate', vbRec.getFieldValue('duedate'));
				customVBRec.setFieldValue('custrecord_spk_vb_discdate', vbRec.getFieldValue('discountdate'));
				customVBRec.setFieldValue('custrecord_spk_vb_refnum', vbRec.getFieldValue('tranid'));
				customVBRec.setFieldValue('custrecord_spk_vb_amount', vbRec.getFieldValue('usertotal'));
				customVBRec.setFieldValue('custrecord_spk_vb_discamnt', vbRec.getFieldValue('discountamount'));
				customVBRec.setFieldValue('custrecord_spk_vb_memo', vbRec.getFieldValue('memo'));
				customVBRec.setFieldValue('custrecord_spk_vb_approvalstatus', vbRec.getFieldValue('approvalstatus'));
				customVBRec.setFieldValue('custrecord_spk_vb_creditlimit', vbRec.getFieldValue('creditlimit'));
				customVBRec.setFieldValue('custrecord_spk_vb_rejectioncomment', vbRec.getFieldValue('custbody_rejection_comments'));
				customVBRec.setFieldValue('custrecord_spk_vb_approver',vbRec.getFieldValue('custbody_spk_inv_apvr'));
				customVBRec.setFieldValue('custrecord_spk_vb_aprvl_bod',vbRec.getFieldValue('custbody_spk_inv_bod_apvr'));
				customVBRec.setFieldValue('custrecord_spk_vb_cnvtrd_inv_amnt',vbRec.getFieldValue('custbody_spk_inv_converted_amt'));
				customVBRec.setFieldValue('custrecord_spk_vb_inv_bus_owner',vbRec.getFieldValue('custbody_spk_inv_owner'));
				customVBRec.setFieldValue('custrecord_spk_vb_ponumber',vbRec.getFieldValue('custbody_spk_poid'));
				customVBRec.setFieldValue('custrecord_spk_vb_billid',nlapiGetRecordId());
				
				/**** Creating the entry of line items ****/
				var itemCount = nlapiGetLineItemCount('item');
				var description1 = new Array();
				var descitem = '';
				for(var i=1;i<=itemCount;i++)
				{
					
					var id2= vbRec.getLineItemValue('item','item',i);
					nlapiLogExecution('DEBUG','id2',id2);
					customVBRec.selectNewLineItem('recmachcustrecord_spk_vb_itemlink');
					if(id2!= '-3')//changes 
					{
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_item',vbRec.getLineItemValue('item','item',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_vendor_item', vbRec.getLineItemValue('item','vendorname',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_quantity_item', vbRec.getLineItemValue('item','quantity',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_desc_item', vbRec.getLineItemValue('item','description',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_rate_item', vbRec.getLineItemValue('item','rate',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amount_item', vbRec.getLineItemValue('item','amount',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_option_item', vbRec.getLineItemValue('item','options',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_project_item', vbRec.getLineItemValue('item','custcolproject',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_dept_item ', vbRec.getLineItemValue('item','department',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_class_item', vbRec.getLineItemValue('item','class',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_customer_item', vbRec.getLineItemValue('item','customer',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_billable_item', vbRec.getLineItemValue('item','isbillable',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortschedule_item', vbRec.getLineItemValue('item','custcol_spk_amortsch_hidden',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_loc_item', vbRec.getLineItemValue('item','location',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortstart_item', vbRec.getLineItemValue('item','amortizstartdate',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortend_item', vbRec.getLineItemValue('item','amortizationenddate',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_residual_item', vbRec.getLineItemValue('item','amortizationresidual',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_receipt_item', vbRec.getLineItemValue('item','billreceipts',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_linenum_item', vbRec.getLineItemValue('item','linenumber',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_market_item', vbRec.getLineItemValue('item','custcol_marketing_campaign',i));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_openair_item', vbRec.getLineItemValue('item','custcol_oa_export_to_openair',i));
					customVBRec.commitLineItem('recmachcustrecord_spk_vb_itemlink');
					}
					else
					{
					 
						 var value3 = vbRec.getLineItemValue('item','description',i);
						 nlapiLogExecution('DEBUG','value3',value3);
						 description1.push(value3);
						 nlapiLogExecution('DEBUG','description1',description1);
						 descitem = description1.join();
						 nlapiLogExecution('DEBUG','descitem',descitem);
						 
						
					 
					 
					}
						customVBRec.setFieldValue('custrecord_spk_vb_decription',descitem);
				}
				
				var expenseCount = nlapiGetLineItemCount('expense');
				for(var j=1;j<=expenseCount;j++)
				{
					customVBRec.selectNewLineItem('recmachcustrecord_spk_vb_explink');
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_cat_exp',vbRec.getLineItemValue('expense','category',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_acnt_exp', vbRec.getLineItemValue('expense','account',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amount_exp', vbRec.getLineItemValue('expense','amount',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_loc_exp', vbRec.getLineItemValue('expense','location',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_memo_exp', vbRec.getLineItemValue('expense','memo',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_project_exp', vbRec.getLineItemValue('expense','job',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_dept_exp', vbRec.getLineItemValue('expense','department',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_class_exp', vbRec.getLineItemValue('expense','class',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_customer_exp ', vbRec.getLineItemValue('expense','customer',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_billable_exp', vbRec.getLineItemValue('expense','isbillable',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortschedule_exp', vbRec.getLineItemValue('expense','custcol_spk_amortsch_hidden',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortstart_exp', vbRec.getLineItemValue('expense','amortizstartdate',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortend_exp', vbRec.getLineItemValue('expense','amortizationenddate',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_residual_exp', vbRec.getLineItemValue('expense','amortizationresidual',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_linenum_exp', vbRec.getLineItemValue('expense','custcol_po_line_no',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_market_exp', vbRec.getLineItemValue('expense','custcol_marketing_campaign',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_cdholder_exp', vbRec.getLineItemValue('expense','custcolcust_cardholder_name',j));
					customVBRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_openair_exp', vbRec.getLineItemValue('expense','custcol_oa_expense_report_line_id',j));
					customVBRec.commitLineItem('recmachcustrecord_spk_vb_explink'); 				
				}
				var recId = nlapiSubmitRecord(customVBRec, true); // Submitting the custom vendor bill record.				
				var stdRecId = nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_spk_vd_id',recId);
				// Attaching the file in the custom bill.
				var fileId = vbRec.getFieldValue('custbody_splunk_attach_bill');
				if(fileId)
				{
					//Attaching the file to the record after saving the record.
					nlapiAttachRecord('file', fileId, 'customrecord_spk_vendorbill',recId); 
				}
				nlapiLogExecution('DEBUG','stdRecId is '+stdRecId,'currentCount is '+currentCount);
				var custRecordId = vbRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',1);							
				nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', custRecordId, 'customworkflow_spk_ap_inv_apv_ntfcn');				
			}	
		
			if(type == 'edit') // When Editing a vendor bill record
			{
				/***** Searching for the corresponding custom vendor bill *****/
				var customRecId = nlapiGetRecordId(); 
				var filter = new Array();
				filter[0] = nlobjSearchFilter('custrecord_spk_vb_billid',null,'is',customRecId);
				var record = nlapiSearchRecord('customrecord_spk_vendorbill',null,filter);
				if(record) // If there is a record
				{				
					var newVBRec = nlapiGetNewRecord();
					var oldRec = nlapiGetOldRecord();
					var customRec = nlapiLoadRecord(record[0].getRecordType(),record[0].getId());
					/******* Compare the old record and new record and then update the value in custom bill record ********/
					if(newVBRec.getFieldValue('currency') != oldRec.getFieldValue('currency'))
					{
						customRec.setFieldValue('custrecord_spk_vb_currency', newVBRec.getFieldValue('currency'));
					}
					if(newVBRec.getFieldValue('account') != oldRec.getFieldValue('account'))
					{
						customRec.setFieldValue('custrecord_spk_vb_account', newVBRec.getFieldValue('account'));
					}
					if(newVBRec.getFieldValue('entity') != oldRec.getFieldValue('entity'))
					{
						customRec.setFieldValue('custrecord_spk_vb_vendor', newVBRec.getFieldValue('entity'));
					}
					if(newVBRec.getFieldValue('subsidiary') != oldRec.getFieldValue('subsidiary'))
					{
						customRec.setFieldValue('custrecord_spk_vb_subsidiary', newVBRec.getFieldValue('subsidiary'));
					}
					if(newVBRec.getFieldValue('postingperiod') != oldRec.getFieldValue('postingperiod'))
					{
						customRec.setFieldValue('custrecord_spk_vb_postingperiod', newVBRec.getFieldValue('postingperiod'));
					}
					if(newVBRec.getFieldValue('trandate') != oldRec.getFieldValue('trandate'))
					{
						customRec.setFieldValue('custrecord_spk_vb_date', newVBRec.getFieldValue('trandate'));
					}
					if(newVBRec.getFieldValue('terms') != oldRec.getFieldValue('terms'))
					{
						customRec.setFieldValue('custrecord_spk_vb_terms', newVBRec.getFieldValue('terms'));
					}
					if(newVBRec.getFieldValue('duedate') != oldRec.getFieldValue('duedate'))
					{
						customRec.setFieldValue('custrecord_spk_vb_duedate', newVBRec.getFieldValue('duedate'));
					}
					if(newVBRec.getFieldValue('discountdate') != oldRec.getFieldValue('discountdate'))
					{
						customRec.setFieldValue('custrecord_spk_vb_discdate', newVBRec.getFieldValue('discountdate'));
					}
					if(newVBRec.getFieldValue('tranid') != oldRec.getFieldValue('tranid'))
					{
						customRec.setFieldValue('custrecord_spk_vb_refnum', newVBRec.getFieldValue('tranid'));
					}
					if(newVBRec.getFieldValue('usertotal') != oldRec.getFieldValue('usertotal'))
					{
						customRec.setFieldValue('custrecord_spk_vb_amount', newVBRec.getFieldValue('usertotal'));
					}
					if(newVBRec.getFieldValue('discountamount') != oldRec.getFieldValue('discountamount'))
					{
						customRec.setFieldValue('custrecord_spk_vb_discamnt', newVBRec.getFieldValue('discountamount'));
					}
					if(newVBRec.getFieldValue('memo') != oldRec.getFieldValue('memo'))
					{
						customRec.setFieldValue('custrecord_spk_vb_memo', newVBRec.getFieldValue('memo'));
					}
					if(newVBRec.getFieldValue('approvalstatus') != oldRec.getFieldValue('approvalstatus'))
					{
						customRec.setFieldValue('custrecord_spk_vb_approvalstatus', newVBRec.getFieldValue('approvalstatus'));
					}
					if(newVBRec.getFieldValue('creditlimit') != oldRec.getFieldValue('creditlimit'))
					{
						customRec.setFieldValue('custrecord_spk_vb_creditlimit', newVBRec.getFieldValue('creditlimit'));
					}
					if(newVBRec.getFieldValue('custbody_rejection_comments') != oldRec.getFieldValue('custbody_rejection_comments'))
					{
						customRec.setFieldValue('custrecord_spk_vb_rejectioncomment', newVBRec.getFieldValue('custbody_rejection_comments'));
					}
					if(newVBRec.getFieldValue('custbody_spk_inv_apvr') != oldRec.getFieldValue('custbody_spk_inv_apvr'))
					{
						customRec.setFieldValue('custrecord_spk_vb_approver',newVBRec.getFieldValue('custbody_spk_inv_apvr'));
					}
					if(newVBRec.getFieldValue('custbody_spk_inv_bod_apvr') != oldRec.getFieldValue('custbody_spk_inv_bod_apvr'))
					{
						customRec.setFieldValue('custrecord_spk_vb_aprvl_bod',newVBRec.getFieldValue('custbody_spk_inv_bod_apvr'));
					}
					if(newVBRec.getFieldValue('custbody_spk_inv_converted_amt') != oldRec.getFieldValue('custbody_spk_inv_converted_amt'))
					{
						customRec.setFieldValue('custrecord_spk_vb_cnvtrd_inv_amnt',newVBRec.getFieldValue('custbody_spk_inv_converted_amt'));
					}
					if(newVBRec.getFieldValue('custbody_spk_inv_owner') != oldRec.getFieldValue('custbody_spk_inv_owner'))
					{
						customRec.setFieldValue('custrecord_spk_vb_inv_bus_owner',newVBRec.getFieldValue('custbody_spk_inv_owner'));
					}
					if(newVBRec.getFieldValue('custbody_spk_poid') != oldRec.getFieldValue('custbody_spk_poid'))
					{
						customRec.setFieldValue('custrecord_spk_vb_ponumber',newVBRec.getFieldValue('custbody_spk_poid'));
					}
					/***** Updating the Line Item Field Values *****/
					var count = nlapiGetLineItemCount('item');
					var description2 = new Array();
					var descitem2 ='';
					var vbCount = customRec.getLineItemCount('recmachcustrecord_spk_vb_itemlink');
					nlapiLogExecution('DEBUG','Custom vbCount is ',vbCount);
					for(var i=1;i<=count;i++)
					{
					
						var id3= vbRec.getLineItemValue('item','item',i);
						nlapiLogExecution('DEBUG','id3',id3);
						if(id3!= '-3')//changes 
						{
						customRec.selectNewLineItem('recmachcustrecord_spk_vb_itemlink');
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_item',newVBRec.getLineItemValue('item','item',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_vendor_item', newVBRec.getLineItemValue('item','vendorname',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_quantity_item', newVBRec.getLineItemValue('item','quantity',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_desc_item', newVBRec.getLineItemValue('item','description',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_rate_item', newVBRec.getLineItemValue('item','rate',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amount_item', newVBRec.getLineItemValue('item','amount',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_option_item', newVBRec.getLineItemValue('item','options',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_project_item', newVBRec.getLineItemValue('item','custcolproject',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_dept_item ', newVBRec.getLineItemValue('item','department',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_class_item', newVBRec.getLineItemValue('item','class',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_customer_item', newVBRec.getLineItemValue('item','customer',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_billable_item', newVBRec.getLineItemValue('item','isbillable',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortschedule_item', newVBRec.getLineItemValue('item','custcol_spk_amortsch_hidden',i));
						nlapiLogExecution('Debug','Amort Value=',newVBRec.getLineItemValue('item','custcol_spk_amortsch_hidden',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_loc_item', newVBRec.getLineItemValue('item','location',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortstart_item', newVBRec.getLineItemValue('item','amortizstartdate',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_amortend_item', newVBRec.getLineItemValue('item','amortizationenddate',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_residual_item', newVBRec.getLineItemValue('item','amortizationresidual',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_receipt_item', newVBRec.getLineItemValue('item','billreceipts',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_linenum_item', newVBRec.getLineItemValue('item','linenumber',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_market_item', newVBRec.getLineItemValue('item','custcol_marketing_campaign',i));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_itemlink','custrecord_spk_vb_openair_item ', newVBRec.getLineItemValue('item','custcol_oa_export_to_openair',i));
						customRec.commitLineItem('recmachcustrecord_spk_vb_itemlink');
						}
						else
						{
							var value3 = vbRec.getLineItemValue('item','description',i);
							nlapiLogExecution('DEBUG','value3',value3);
							description2.push(value3);
							nlapiLogExecution('DEBUG','description1',description2);
							descitem2 = description2.join();
							nlapiLogExecution('DEBUG','descitem',descitem2);
							
					
						}	
						customRec.setFieldValue('custrecord_spk_vb_decription',descitem2);
					}
					
					/***** Updating the expense Field Values *****/
					var vbCount_expense = customRec.getLineItemCount('recmachcustrecord_spk_vb_explink');
					var expenseCount = nlapiGetLineItemCount('expense');
					nlapiLogExecution('DEBUG','Custom expenseCount is ',expenseCount);
					for(var j=1;j<=expenseCount;j++)
					{
						customRec.selectNewLineItem('recmachcustrecord_spk_vb_explink');
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_cat_exp',newVBRec.getLineItemValue('expense','category',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_acnt_exp', newVBRec.getLineItemValue('expense','account',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amount_exp', newVBRec.getLineItemValue('expense','amount',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_loc_exp', newVBRec.getLineItemValue('expense','location',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_memo_exp', newVBRec.getLineItemValue('expense','memo',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_project_exp', newVBRec.getLineItemValue('expense','job',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_dept_exp', newVBRec.getLineItemValue('expense','department',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_class_exp', newVBRec.getLineItemValue('expense','class',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_customer_exp ', newVBRec.getLineItemValue('expense','customer',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_billable_exp', newVBRec.getLineItemValue('expense','isbillable',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortschedule_exp', newVBRec.getLineItemValue('expense','custcol_spk_amortsch_hidden',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortstart_exp', newVBRec.getLineItemValue('expense','amortizstartdate',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_amortend_exp ', newVBRec.getLineItemValue('expense','amortizationenddate',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_residual_exp', newVBRec.getLineItemValue('expense','amortizationresidual',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_linenum_exp', newVBRec.getLineItemValue('expense','custcol_po_line_no',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_market_exp', newVBRec.getLineItemValue('expense','custcol_marketing_campaign',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_cdholder_exp', newVBRec.getLineItemValue('expense','custcolcust_cardholder_name',j));
						customRec.setCurrentLineItemValue('recmachcustrecord_spk_vb_explink','custrecord_spk_vb_openair_exp', newVBRec.getLineItemValue('expense','custcol_oa_expense_report_line_id',j));
						customRec.commitLineItem('recmachcustrecord_spk_vb_explink'); 				
					}		
					var vbRecId = nlapiSubmitRecord(customRec);	// Submitting the custom vendor bill record after editing.
					nlapiLogExecution('DEBUG','vbRecId is ',vbRecId);				
					
					var filter_vb = new Array();
					filter_vb[0] = new nlobjSearchFilter('custrecord_spk_vb_itemlink',null,'is',vbRecId);
					
					var col = new Array();
					col[0] = new nlobjSearchColumn('internalid');
					col[1] = col[0].setSort();
					var records = nlapiSearchRecord('customrecord_spk_vb_item',null,filter_vb,col);
					if(records)
					{
						for(var k =0;k<vbCount;k++) 
						{
							nlapiDeleteRecord('customrecord_spk_vb_item', records[k].getId());
						}
					}					
					var filter_exp = new Array();
					filter_exp[0] = new nlobjSearchFilter('custrecord_spk_vb_explink',null,'is',vbRecId);
					
					var col_exp = new Array();
					col_exp[0] = new nlobjSearchColumn('internalid');
					col_exp[1] = col_exp[0].setSort();
					var results = nlapiSearchRecord('customrecord_spk_vb_exp',null,filter_exp,col_exp);
					if(results)
					{
						nlapiLogExecution('DEBUG','len is '+results.length,'count is'+vbCount_expense);
						for(var n=0;n<vbCount_expense;n++) 
						{
							nlapiDeleteRecord('customrecord_spk_vb_exp', results[n].getId());
						}
					}
				}
			}
		}
		if(nlapiGetRecordType() != 'customrecord_spk_vendorbill')
		{
			if(nlapiGetFieldText('approvalstatus') == 'Rejected')
			{
				var id = nlapiGetFieldValue('custbody_spk_vd_id');
				nlapiSubmitField('customrecord_spk_vendorbill',id,'custrecord_spk_vb_approvalstatus',3);
			}
		}
	}
	catch (e) 
	{
		nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
	}
}
