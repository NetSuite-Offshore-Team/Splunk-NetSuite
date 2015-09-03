

function currency(type)
{
if(type == 'create')
{
if ((nlapiGetFieldValue('nextapprover') != '') && (nlapiGetFieldValue('nextapprover') != null))
{
//To get the currency for the Vendor
var curr=nlapiGetFieldValue('currency');
nlapiLogExecution('DEBUG', 'Vendor Currency', curr);

//To get the ID of the approver's record
var ID=nlapiGetFieldValue('nextapprover');
//nlapiLogExecution('DEBUG', 'ID', ID);

//To get the total purchase amount inclusive of taxes
var amount=nlapiGetFieldValue('total');
nlapiLogExecution('DEBUG', 'Amount with nextapp', amount);

//To create an object of the approver's record 
var emp=nlapiLoadRecord('employee', ID);
//To get the currency for the Approver
var base_curr = nlapiLookupField('currency',emp.getFieldValue('currency'),'name');
nlapiLogExecution('DEBUG', 'Approver Currency', base_curr);

//This API is used to get the Exchange rate for the both the currencies
var rate=nlapiExchangeRate(curr,emp.getFieldValue('currency'));
//nlapiLogExecution('DEBUG', 'Rate', rate);

//To calculate the total amount in the currency of the approver 
var base_amount = parseFloat(amount * rate);
//Setting the value in the custom field for Approver's currency
nlapiSetFieldValue('custbody_converted_total',base_amount);
nlapiLogExecution('DEBUG', 'Approver_Amount next app present', base_amount);
}
else
{
    var amount_PO=nlapiGetFieldValue('total');
	nlapiLogExecution('DEBUG', 'Amount', amount_PO);
	
	var curr=nlapiGetFieldValue('currency');
	//To get the currency for the Vendor
	//nlapiLogExecution('DEBUG', 'Vendor Currency', curr);
	
	if((nlapiGetFieldValue('custbody_onbehalf')!= '')&& nlapiGetFieldValue('custbody_onbehalf') != null)
	{
	var custid = nlapiGetFieldValue('custbody_onbehalf');
	nlapiLogExecution('DEBUG', 'CUSTID on behalf', custid);
	var empdetail = nlapiLoadRecord('employee', custid);
	
	var approver=empdetail.getFieldValue('purchaseorderapprover');
	nlapiLogExecution('DEBUG', 'approver on behalf', approver);
	
	//To create an object of the approver's record 
	var emp=nlapiLoadRecord('employee', approver);
	//To get the currency for the Approver
	var base_curr = nlapiLookupField('currency',emp.getFieldValue('currency'),'name');
	nlapiLogExecution('DEBUG', 'Approver Currency on behalf', base_curr);

	//This API is used get the Exchange rate for the both the currencies
	var rate=nlapiExchangeRate(curr,emp.getFieldValue('currency'));
	nlapiLogExecution('DEBUG', 'Rate', rate);

	//To calculate the total amount in the currency of the approver  
	var base_amount = parseFloat(amount_PO * rate);
	//Setting the value in the custom field for Approver's currency
	nlapiSetFieldValue('custbody_converted_total',base_amount);
nlapiLogExecution('DEBUG', 'Approver_Amount', base_amount);

	}
	else
	{
	var custid = nlapiGetUser();
	nlapiLogExecution('DEBUG', 'CUSTID', custid);
	var empdetail = nlapiLoadRecord('employee', custid);
	
	var approver=empdetail.getFieldValue('purchaseorderapprover');
	nlapiLogExecution('DEBUG', 'approver ', approver);
	
	//To create an object of the approver's record 
	var emp=nlapiLoadRecord('employee', approver);
	//To get the currency for the Approver
	var base_curr = nlapiLookupField('currency',emp.getFieldValue('currency'),'name');
	nlapiLogExecution('DEBUG', 'Approver Currency', base_curr);

	//This API is used get the Exchange rate for the both the currencies
	var rate=nlapiExchangeRate(curr,emp.getFieldValue('currency'));
	nlapiLogExecution('DEBUG', 'Rate', rate);

	//To calculate the total amount in the currency of the approver  
	var base_amount = parseFloat(amount_PO * rate);
	//Setting the value in the custom field for Approver's currency
	//var convrtdtotal = base_amount+ base_curr ;
	nlapiSetFieldValue('custbody_converted_total',base_amount);
	nlapiLogExecution('DEBUG', 'Approver_Amount', base_amount);
	}
}
}
}




function currencyonedit(type)
{
if(type == 'edit' )
{
if ((nlapiGetFieldValue('nextapprover') != '') && (nlapiGetFieldValue('nextapprover') != null))
{
//To get the currency for the Vendor
var id = nlapiGetRecordId();
var POrec = nlapiLoadRecord('purchaseorder',id);
var curr=POrec.getFieldValue('currency');
nlapiLogExecution('DEBUG', 'Vendor Currency', curr);

//To get the ID of the approver's record
var ID=POrec.getFieldValue('nextapprover');
nlapiLogExecution('DEBUG', 'ID in edit', ID);

//To get the total purchase amount inclusive of taxes
var amount=POrec.getFieldValue('total');
nlapiLogExecution('DEBUG', 'Amount with nextapp', amount);

//To create an object of the approver's record 
var emp=nlapiLoadRecord('employee', ID);
//To get the currency for the Approver
var base_curr = nlapiLookupField('currency',emp.getFieldValue('currency'),'name');
nlapiLogExecution('DEBUG', 'Approver Currency', base_curr);

//This API is used to get the Exchange rate for the both the currencies
var rate=nlapiExchangeRate(curr,emp.getFieldValue('currency'));
nlapiLogExecution('DEBUG', 'Rate', rate);

//To calculate the total amount in the currency of the approver 
var base_amount = parseFloat(amount * rate);
//Setting the value in the custom field for Approver's currency
POrec.setFieldValue('custbody_converted_total',base_amount);
nlapiLogExecution('DEBUG', 'Approver_Amount', base_amount);
nlapiSubmitRecord(POrec);
}

} 
}
