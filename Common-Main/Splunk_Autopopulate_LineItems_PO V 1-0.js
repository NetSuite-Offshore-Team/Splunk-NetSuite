/* Validating mandatory fields on journals/PO/Vendor Bills/Credit memo 
 * Client Script - Splunk_Class&Location_Mandatory
 * @author Abith Nitin
 * @Release Date 19/12/2014  for Enhancement ENHC0050530
 * @Release Number RLSE0050289
 * @version 1.0.
 */
 
 /* Whenever a line item is entered in the PO, Location/Class/Department fields will auto populate from the employee record which is selected in the header part 
 * Client Script - Splunk_Class&Location_Mandatory
 * Function :- postSourcing_populateValues
 * @author Abith Nitin
 * @Release Date  20-March-2015 
 * @Release Number  RLSE0050335
 * @version 1.1
 */

 
function saveRecord()
{
	//  Check to see that Class/Department/Location is mandatory.
	var custform = nlapiGetFieldValue('customform');
	var rectype = nlapiGetRecordType();
	if(((rectype == 'purchaseorder') && (custform == 116)) || ((rectype == 'vendorbill') && (custform == 124))) {//check whether record type is Purchase Order or Vendor bill
		var flag1 = false;
		 
		if(nlapiGetLineItemCount('item') > 0)
			flag1 = validlines('item');
		 if(rectype == 'vendorbill' && nlapiGetLineItemCount('expense') > 0 && (flag1 || nlapiGetLineItemCount('item') == 0))
		 {
			flag1 = validlines('expense');
		 }
		if(flag1 == true){
		return true;
		}
	}
	
	else if((rectype == 'journalentry') && ((custform == 128) || (custform == 136))) { 	// If record type is Journal Entry
		var accountTypeId = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_accounttype').toString().split(',');
		var jecount = nlapiGetLineItemCount('line');
		for(var j = 1; j<= jecount; j++) {
			var accountType = nlapiGetLineItemValue('line','accounttype',j);
			var y = accountTypeId.indexOf(accountType);
			var linejeaccount = nlapiGetLineItemValue('line','account',j);
			var linejeclass = nlapiGetLineItemValue('line','class',j);
			var linejelocation = nlapiGetLineItemValue('line','location',j);
			var linejedepartment = nlapiGetLineItemValue('line','department',j);
			if (y > -1) {//Checking if the Account type ID is present or not in the Parameters.
				var message = getMessage(linejeclass,linejelocation,linejedepartment);
				if (message != '') {
					alert(message+' at line# '+j);
					return false;
					break;
				}
				else 
					return true;				
			}
			
		}
	}
	else return true;
}
function validlines(itemtype)
{
	var flag = true;
	var count = nlapiGetLineItemCount(itemtype);
	for(var i = 1; i<= count; i++) 
	{
		var classes = nlapiGetLineItemValue(itemtype,'class',i);
		var location = nlapiGetLineItemValue(itemtype,'location',i);
		var department = nlapiGetLineItemValue(itemtype,'department',i);
		var message = getMessage(classes,location,department);
	
		if (message != '') 
		{
			alert(message+' at line# '+i+' in '+itemtype+'');
			flag = false;
			break;
		}
		else 
		flag = true;
	}
	
	return flag;
}

//function to display asterisk on Mandatory fields
function setMandatory(type)
{
	var rectype = nlapiGetRecordType();
	if((nlapiGetFieldValue('customform') == 124 && rectype == 'vendorbill') || (nlapiGetFieldValue('customform') == 116 && rectype == 'purchaseorder'))
	{
		var fld_location = nlapiGetLineItemField('item','location',1);
		var fld_class = nlapiGetLineItemField('item','class',1);
		var fld_department = nlapiGetLineItemField('item','department',1);
		var fld_description = nlapiGetLineItemField('item','description',1);
		if(fld_location)
			fld_location.setMandatory(true);
		if(fld_class)	
			fld_class.setMandatory(true);
		if(fld_department)	
			fld_department.setMandatory(true);
		if (nlapiGetFieldValue('customform') == 116 && rectype == 'purchaseorder') {
			var fld_description = nlapiGetLineItemField('item','description',1);
			if(fld_description)	
			fld_description.setMandatory(true);
		}
			
		var exp_fld_location = nlapiGetLineItemField('expense','location',1);
		var exp_fld_class = nlapiGetLineItemField('expense','class',1);
		var exp_fld_department = nlapiGetLineItemField('expense','department',1);
		if(exp_fld_location)
			exp_fld_location.setMandatory(true);
		if(exp_fld_class)	
			exp_fld_class.setMandatory(true);
		if(exp_fld_department)	
			exp_fld_department.setMandatory(true);
	}
		
}


function validate_line(type)
{	//Making the Line item fields of PO,Journal entry and Vendor bills as mandatory.

	var rectype = nlapiGetRecordType();
	var custform = nlapiGetFieldValue('customform');

	if (((rectype == 'purchaseorder') && (custform == 116)) || ((rectype == 'vendorbill') && (custform == 124)))//check whether record type is Purchase Order or Vendor bill
	{
	    if (type == 'item')// If type is 'Item'
			{
				var lineitemclass = nlapiGetCurrentLineItemValue('item','class');
				var lineitemlocation = nlapiGetCurrentLineItemValue('item','location');
				var lineitemdepartment = nlapiGetCurrentLineItemValue('item','department');
				var message = getMessage(lineitemclass,lineitemlocation,lineitemdepartment);
						
						if (message != '')
						{
							alert(message);
							return false;
						}
						else 
							return true;	
			}
		
	if (type == 'expense')//If type is 'Expense'
		{
			var lineexpenseclass = nlapiGetCurrentLineItemValue('expense','class');
			var lineexpenselocation = nlapiGetCurrentLineItemValue('expense','location');
			var lineexpensedepartment = nlapiGetCurrentLineItemValue('expense','department');
			
					var message = getMessage(lineexpenseclass,lineexpenselocation,lineexpensedepartment);
						
						if (message != '')
						{
							alert(message);
							return false;
						}
						else 
							return true;		
			
		}
		
	}
	if ((rectype == 'journalentry') && ((custform == 128) || (custform == 136))) // If record type is Journal Entry
		{  	
			if (type == 'line')
			{				
				var accountTypeId = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_accounttype').toString().split(',');
				var accountType = nlapiGetCurrentLineItemValue('line','accounttype');
				var y = accountTypeId.indexOf(accountType);
				var linejeaccount = nlapiGetCurrentLineItemValue('line','account');
				var linejeclass = nlapiGetCurrentLineItemValue('line','class');
				var linejelocation = nlapiGetCurrentLineItemValue('line','location');
				var linejedepartment = nlapiGetCurrentLineItemValue('line','department');
				if (y > -1)//Checking if the Account type ID is present or not in the Parameters.
					{
					var message = getMessage(linejeclass,linejelocation,linejedepartment);
						
						if (message != '')
						{
							alert(message);
							return false;
						}
						else 
							return true;		
					}
						else 
							return true;
			}
		}
		return true;
}

function getMessage(lineclass,linelocation,linedepartment)
{
	var message = '';
	if ((lineclass == null) || (lineclass == ''))//If class field is empty,then pop up an alert message.
	{
		message = "Please provide a value for Class.";
	}
	if ((linelocation == null) || (linelocation == ''))//If Location field is empty,then pop up an alert message.
	{
		if(message == '')
		{
		message = "Please provide a value for Location.";
		}
		else
		{
		message = message + " and Location.";
		}
	}
	if ((linedepartment == null) || (linedepartment == ''))//If Department field is empty,then pop up an alert msg.
	{
		if(message == '')
		{
		message = "Please provide a value for Department.";
		}
		else
		{
		if((message.search('class')>-1)&&(message.search('location')>-1))
		{
		message = "Please provide values for Class, Location and Department.";
		}
		else
		{
		message = message + " and Department.";
		}
		}
	}
	return message;
}


function postSourcing_populateValues(type,name)//client script to set the class/location/department fields from the employee record.
{
var employee = nlapiGetFieldValue('employee');
var rectype = nlapiGetRecordType();
if(rectype == 'purchaseorder')
	{
	if (type == 'item' && name == 'item' && nlapiGetCurrentLineItemValue('item', 'item') && (employee))//getting the line item value and checking if employee value is present or not.
		{ 
			var ifields = ['department','class','location'];
			var poLineFields = nlapiLookupField('employee', employee, ifields); 
			nlapiSetCurrentLineItemValue('item', 'department',poLineFields.department,false);
			nlapiSetCurrentLineItemValue('item', 'class',poLineFields.class,false);
			nlapiSetCurrentLineItemValue('item', 'location',poLineFields.location,false);
			//nlapiSetCurrentLineItemValue('item','description'," "); 
		}
	}	
}
