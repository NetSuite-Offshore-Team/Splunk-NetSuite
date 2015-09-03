/*
 * 17 Apr 2014		Hari Gaddipati		DSG Case: 38866
 * 										After submit script to set upfront billing flag on project if invoiced amount = sales order amount
 */
var adminRoles = ['3'];
function beforeLoadInv(type, form)
{
	if (type == 'create' && nlapiGetContext().getExecutionContext() == 'userinterface')
	{
		var createdFrom = nlapiGetFieldValue('createdfrom');
		if (createdFrom != null && createdFrom != '')
		{
	    var soRecFldList = ['statusref', 'custbody_license_delivery_status'];
	    var soRecVal = nlapiLookupField('salesorder', createdFrom, soRecFldList);
			
			var orderStatus = soRecVal.statusref;
			
			nlapiLogExecution('Error','Checking', 'orderStatus ' + orderStatus);	
			nlapiLogExecution('Error','Checking', 'soRecVal.custbody_license_delivery_status ' + soRecVal.custbody_license_delivery_status);	
			
			if (!findValueInList(adminRoles, nlapiGetContext().getRole()))
			{
				if (orderStatus != 'PendingApproval' && (soRecVal.custbody_license_delivery_status == '4' || soRecVal.custbody_license_delivery_status == '2'))	//Order Status not equal to Pending Approval and License Delivery Status = Pending
				{
					if (soRecVal.custbody_license_delivery_status == '4')
					{
						throw nlapiCreateError('User Defined', 'An Approved Sales Order with a License Delivery Status of "Pending" cannot be Invoiced.', true);
					}
					else 
					{
						throw nlapiCreateError('User Defined', 'An Approved Sales Order with a License Delivery Status of "Error" cannot be Invoiced.', true);
					}

				}
			}
		}
	}
}


function findValueInList(inputList, val)
{
	nlapiLogExecution('Error','Checking', 'input length ' + inputList.length);
	for (var intPos = 0;inputList != null && intPos < inputList.length;intPos++)
	{
		nlapiLogExecution('Error','Checking', 'intpos ' + intPos);
		if (inputList[intPos] == val)
		{
			return true;
		}
	}
	return false;
}

function userEventAfterSubmit(type)
{
	//Begin of changes for DSG Case: 38866
	if (type == 'create')
    {
		var recInvoice =  nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());

    	var createdFrom = recInvoice.getFieldText('createdfrom');
    	if (createdFrom.indexOf('Sales Order') == 0)
    	{
    		var soId = recInvoice.getFieldValue('createdfrom');
    		var soTotal = parseFloat(nlapiLookupField('salesorder', soId, 'total'));
    		
    		var filters = new Array();
    		filters.push(new nlobjSearchFilter('createdfrom', '', 'anyOf', soId));
    		filters.push(new nlobjSearchFilter('mainline', '', 'is', 'T'));

    		var columns = new Array();
    		columns.push(new nlobjSearchColumn('total'));
    		
    		var invoicedTotal = parseFloat(0);
    		var invoiceList = nlapiSearchRecord('invoice', '', filters, columns);
    		for (var intPos = 0;  invoiceList != null && intPos < invoiceList.length; intPos++)
    		{
    			invoicedTotal = parseFloat(invoicedTotal) + parseFloat(invoiceList[intPos].getValue('total'));
    		}
    		
    		if(invoicedTotal.toFixed(2) == soTotal.toFixed(2))
    		{
    			var filters = new Array();
    			filters.push(new nlobjSearchFilter('custentity_project_sales_order', '', 'anyOf', soId));

    			var projectList = nlapiSearchRecord('job', '', filters);
    			for(var intPos = 0; projectList != null && intPos < projectList.length; intPos++)
    			{
    				nlapiSubmitField('job', projectList[intPos].getId(), 'custentity_upfront_billing', 'T');
    			}
    		}
    	}
    }
    //End of changes for DSG Case: 38866
}
