//  The User event script aims to show the approval routing of the PO created based on the PO amount. 

function ApprovalRouting(type) // After submit function
{
    if (type == 'create') {
    
        var RecordId = nlapiGetRecordId();
        var PORecord = nlapiLoadRecord('purchaseorder', RecordId);
        //var POTotal = parseFloat(PORecord.getFieldValue('custbody_converted_total'));
        
        // Fetching the PO amount and the currency of the vendor
        var amount = PORecord.getFieldValue('total');
        var curr = PORecord.getFieldValue('currency');
        
        // checking if the PO is created by an employee or it is being created on someone's behalf
        if (PORecord.getFieldValue('custbody_onbehalf') == null || PORecord.getFieldValue('custbody_onbehalf') == '') 
		{
        
            var Employee = PORecord.getFieldValue('employee');
			nlapiLogExecution('ERROR', 'Employee',Employee);
			
        }
        else {
        
            var Employee = PORecord.getFieldValue('custbody_onbehalf');
        }
        
        
       // Getting PA of the Employee and assigning in the approval routing tab. 
        var SuperVisor = nlapiLookupField('employee', Employee, 'purchaseorderapprover'); // 
       nlapiLogExecution('ERROR', 'supervisor val is',SuperVisor  );
        var k = 1;
        var c = 1;
        PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', SuperVisor);
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Supervisor');
        PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
       
       var emp = nlapiLoadRecord('employee', SuperVisor);
	var base_curr = nlapiLookupField('currency', emp.getFieldValue('currency'), 'name');
	nlapiLogExecution('ERROR', 'Approver Currency', base_curr);
	var rate = nlapiExchangeRate(curr, emp.getFieldValue('currency'));
	var base_amount = parseFloat(amount * rate);
	nlapiLogExecution('ERROR', 'IN', base_amount);
	var approvalLimit = emp.getFieldValue('purchaseorderapprovallimit');

	nlapiLogExecution('ERROR', 'App limit', approvalLimit );	
	// checking the PA limit of the Supervisor.
        if (base_amount > approvalLimit) 
        {
        
            nlapiLogExecution('ERROR', 'IN', 'PO val rchd in loop1');
            for (var j = 1; j <= 100; j++) 
			{
nlapiLogExecution('ERROR', 'before SuperVisor j '+j, SuperVisor);
				var SuperVisor = nlapiLookupField('employee', SuperVisor, 'purchaseorderapprover');
				nlapiLogExecution('ERROR', 'After SuperVisor j '+j, SuperVisor);
				var emp = nlapiLoadRecord('employee', SuperVisor);
				var base_curr = nlapiLookupField('currency', emp.getFieldValue('currency'), 'name');
				nlapiLogExecution('ERROR', 'Approver Currency', base_curr);
				
				var rate = nlapiExchangeRate(curr, emp.getFieldValue('currency'));
				var base_amount = parseFloat(amount * rate);
				nlapiLogExecution('ERROR', 'IN', base_amount);
				
				
				
				var approvalLimit = parseFloat(nlapiLookupField('employee', SuperVisor, 'purchaseorderapprovallimit'));
				// Based on the approval limit of the current supervisor
				if (base_amount > approvalLimit) 
				{
					var k = k + 1;
					PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
					PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
					PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', SuperVisor);
					PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Supervisor');
					PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
				}
				else 
				{
					if (c == 1) 
					{
						var k = k + 1;
						PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
						PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
						PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', SuperVisor);
						PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Supervisor');
						PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
						c = c + 1;
						break;
					}
					else 
					{
						break;
					}
				}
			
             }
            k = k + 1;
			var supervisorapprovedflag = 't';
			nlapiLogExecution('ERROR','flag val is',supervisorapprovedflag);
        }
        else 
		{
            nlapiLogExecution('ERROR', 'IN', 'PO val is less');
            
            k = k + 1;
            var flag = 't';
        }
        
        PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', nlapiLookupField('employee', Employee, 'custentity_finance_manager_approver'));
        PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Finance Manager');
        PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
        k = k + 1;
        
        var a = 10000;
        
        if (flag == 't' && base_amount <= a || base_amount <= a )  
		{
            PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', nlapiLookupField('employee', Employee, 'custentity_purchaser_mngr_approver'));
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Final Purchase Approver');
            PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
            k = k + 1;
        }
        // Code for the Executive approval routing 
        else if(supervisorapprovedflag == 't' || (flag == 't' && base_amount <= parseFloat(nlapiLookupField('employee', SuperVisor, 'purchaseorderapprovallimit'))))

		{
		if (parseFloat(PORecord.getFieldValue('total'))>a || base_amount > a) 
		{
			for (var m = 1; m <= 100; m++) 
			{
					
			if(m == 1)
{
var SuperVisor = 58813;
PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);	
PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', SuperVisor);
PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Executive Approver');
PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
k = k + 1;
var emp = nlapiLoadRecord('employee', SuperVisor);
var base_curr = nlapiLookupField('currency', emp.getFieldValue('currency'), 'name');
nlapiLogExecution('ERROR', 'Approver Currency', base_curr);
			
var rate = nlapiExchangeRate(curr, emp.getFieldValue('currency'));
var base_amount = parseFloat(amount * rate);
nlapiLogExecution('ERROR', 'IN', base_amount);

var execapproverlimit = parseFloat(nlapiLookupField('employee', SuperVisor, 'purchaseorderapprovallimit'));

var SuperVisor = nlapiLookupField('employee', SuperVisor, 'purchaseorderapprover');
}
else
{
nlapiLogExecution('ERROR', 'super is', SuperVisor);
						
if (execapproverlimit < parseFloat(base_amount)) 
		{
				
			PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
			PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
			PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', SuperVisor);
			PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Executive Approver');
			PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
			k = k + 1;
			var execapproverlimit = parseFloat(nlapiLookupField('employee', SuperVisor, 'purchaseorderapprovallimit'));
			var SuperVisor = nlapiLookupField('employee', SuperVisor, 'purchaseorderapprover');
					}
					else
					{
						break;
					}
						
				}
}
				
 if (parseFloat(base_amount) == execapproverlimit) 
{

}

	if (parseFloat(base_amount) < execapproverlimit) {
					for (var n = 1; n <= 100; n++) 
                                        {
					
						break;
						
					}
				}
			}
            PORecord.selectNewLineItem('recmachcustrecord_approvalflow_splunk');
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_sequence', k);
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_name', nlapiLookupField('employee', Employee, 'custentity_purchaser_mngr_approver'));
            PORecord.setCurrentLineItemValue('recmachcustrecord_approvalflow_splunk', 'custrecord_approver_role', 'Final Purchase Approver');
            PORecord.commitLineItem('recmachcustrecord_approvalflow_splunk');
        }
        nlapiSubmitRecord(PORecord);
        
    }
}