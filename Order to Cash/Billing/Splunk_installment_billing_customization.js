/*
* This script is used on After submit to calculate the Due date and SO Remaining Balance for Installment Billing Schedule custom record.
* This script is used on Before submit to set the Invoice Status field in Installment Billing Schedule custom record.
* This script is used on Before load to add the custom button for ivoice creation in Installment Billing Schedule custom record.
* @AUTHOR : Mukta Goyal
* @Release Date : 
* @Release Number : 
* @Project Number : 
* @version 1.0
*/
function splunk_insatllmentbilling_customization(type)
{
	var rectype = nlapiGetRecordType();
	nlapiLogExecution('DEBUG','rectype',rectype);
	nlapiLogExecution('DEBUG','type',type);
	var SOid = nlapiGetFieldValue('custrecord_spk_bs_sobookingschedule');
	nlapiLogExecution('DEBUG','SOid',SOid);
	if(SOid)
	{
	var totalamount = nlapiLookupField('salesorder',SOid,'netamountnotax');
	nlapiLogExecution('DEBUG','totalamount',totalamount);
	}
	
	if(rectype == 'customrecord_spk_bookingschedule')
	{
			if(type == 'create' || type == 'edit')
			{
				nlapiLogExecution('DEBUG','type',type);
	
				var context = nlapiGetContext();
				var strStartDate = context.getSetting('SCRIPT', 'custscript_spk_installoffsetday');
				nlapiLogExecution('DEBUG','strStartDate',strStartDate);
				nlapiSubmitField('customrecord_spk_bookingschedule',nlapiGetRecordId(),'custrecordspk_ibscript_parameter',parseInt(strStartDate));
	
				var invoicedate = nlapiGetFieldValue('custrecord_spk_bs_date');
				nlapiLogExecution('DEBUG','invoicedate',invoicedate);
				
				var customer = nlapiLookupField('salesorder', SOid, 'entity');
				
				var paymentterms = nlapiGetFieldText('custrecord_spk_bs_paymentterms');
				nlapiLogExecution('DEBUG','paymentterms',paymentterms);
				
				var inid = nlapiGetFieldValue('custrecord_spk_bs_invoiceid');
				nlapiLogExecution('DEBUG','inid',inid);
				//Calculate the due date and SO remaining balance for Installment Billing Schedule.
				var dueadte1 = calculateSOremaining(paymentterms,invoicedate);//calling The Function
				
				var uiinvoiveid = new Array();
				var uifinaltotal = 0.0;
				uiinvoiveid = calculatemanuallycreatedinvoice(SOid);//calling The Function
				nlapiLogExecution('DEBUG','uiinvoiveid',uiinvoiveid[0]);
				nlapiLogExecution('DEBUG','uiinvoiveid',uiinvoiveid[1]);
				for (var k = 0; k <uiinvoiveid.length; k++)
				{
					var uitotal = nlapiLookupField('invoice', uiinvoiveid[k],'netamountnotax');
					nlapiLogExecution('DEBUG','uitotal',uitotal);
					uifinaltotal = parseFloat(uifinaltotal) + parseFloat(uitotal);
					
				}
					var totalamount1 = 0.0;
					totalamount1 = parseFloat(totalamount) - parseFloat(uifinaltotal);
					nlapiLogExecution('DEBUG','totalamount1',totalamount1);
					updatecustomrecord(SOid,totalamount1);//calling The Function
					
					if(paymentterms)
					{
					nlapiSubmitField('customrecord_spk_bookingschedule',nlapiGetRecordId(),'custrecord_spk_bs_duedate',dueadte1);
					}
					if(inid == null || inid == '' )
					{
					//Set the invoice status field in Installment Billing Schedule.
					nlapiSubmitField('customrecord_spk_bookingschedule',nlapiGetRecordId(),'custrecord_spk_bs_invoicestatus',1);
					}
					//Set the SO Customer field in Installment Billing Schedule.
					nlapiSubmitField('customrecord_spk_bookingschedule',nlapiGetRecordId(),'custrecord_spk_bs_socustomer',customer);
			}		
	}
	
	//Set the Invoice Status field  as "Paid in Full" in Installment Billing Schedule.
	if(rectype == 'customerpayment')
	{
		if(type == 'create' || type == 'edit' )
		{
			var count = nlapiGetLineItemCount('apply');
			for ( var j = 1; j <=count; j++) 
			{
				var value = nlapiGetLineItemValue('apply','apply', j);
				if(value == 'T')
				{
					var inid1 = nlapiGetLineItemValue('apply','internalid', j);
					nlapiLogExecution('DEBUG','inid1',inid1);
					var billtype = nlapiLookupField('invoice',inid1,'custbody_spk_billingtype');
					nlapiLogExecution('DEBUG','billtype',billtype);
					if(billtype == 2)
					{
						var ibid = nlapiLookupField('invoice', inid1, 'custbody_spk_inib_id');
						nlapiLogExecution('DEBUG','ibid',ibid);
						nlapiSubmitField('customrecord_spk_bookingschedule',ibid,'custrecord_spk_bs_invoicestatus',4);	
					}
				}
			}	
		}
	}
	
	if(rectype == 'invoice')
	{
		if(type == 'create' || type == 'edit')
			{
				var totalamount2= 0.0;
				var ibilltype = nlapiGetFieldValue('custbody_spk_billingtype');
				if(ibilltype == 2)
				{
					var uiinvoiceid = new Array();
					var id = nlapiGetFieldValue('createdfrom');
					if(id)
					{
					var totalamount2 = nlapiLookupField('salesorder',id,'netamountnotax');
					nlapiLogExecution('DEBUG','totalamount2',totalamount2);
					}
					var ibid = nlapiGetFieldValue('custbody_spk_inib_id');
					nlapiLogExecution('DEBUG','ibid',ibid);
					nlapiLogExecution('DEBUG','invoiceid',id);
					var uifinaltotal = 0.0;
					uiinvoiceid = calculatemanuallycreatedinvoice(id);
					for (var k = 0; k <uiinvoiceid.length; k++)
					{
						var uitotal = nlapiLookupField('invoice', uiinvoiceid[k],'netamountnotax');
						nlapiLogExecution('DEBUG','uitotal',uitotal);
						uifinaltotal = parseFloat(uifinaltotal) + parseFloat(uitotal);
					}
					var totalamount1 = 0.0;
					totalamount1 = parseFloat(totalamount2) - parseFloat(uifinaltotal);
					nlapiLogExecution('DEBUG','totalamount1',totalamount1);
					updatecustomrecord(id,totalamount1);
				}
			}
	}
}

function splunk_insatllmentbilling_cust_beforesub(type)
{
	var rectype = nlapiGetRecordType();
		//Set the Invoice Status field on deletion of invoice in Installment Billing Schedule.
		if(rectype == 'invoice')
		{
			nlapiLogExecution('DEBUG','type',type);
			if(type == 'delete')
			{
				var old_record = nlapiGetOldRecord();
				var ibilltype = old_record.getFieldValue('custbody_spk_billingtype');
				var inid3 = old_record.getFieldValue('custbody_spk_inib_id');
				nlapiLogExecution('DEBUG','inid3',inid3);
				nlapiLogExecution('DEBUG','ibilltype',ibilltype);
				if(ibilltype == 2)
				{
					nlapiLogExecution('DEBUG','ibilltype',ibilltype);
					if(inid3!= null)
					{
					nlapiSubmitField('customrecord_spk_bookingschedule',inid3,'custrecord_spk_bs_invoicestatus',1);
					}
							
				}
			}
		}
		//Update  booking schedule remaining amount when invoice will get created manually.
		if(rectype == 'invoice')
		{
			//Set the Invoice Status field on edit of invoice in Installment Billing Schedule.
			nlapiLogExecution('DEBUG','type',type);
			if(type == 'edit' )
			{
				var status = nlapiGetFieldValue('approvalstatus');
				nlapiLogExecution('DEBUG','status',status);
				var ibid = nlapiGetFieldValue('custbody_spk_inib_id');
				nlapiLogExecution('DEBUG','ibid',ibid);
				if(ibid)
				{
					if(status == 1)
					{
					nlapiSubmitField('customrecord_spk_bookingschedule',ibid,'custrecord_spk_bs_invoicestatus',2);
					}
					if(status == 2)
					{
					nlapiSubmitField('customrecord_spk_bookingschedule',ibid,'custrecord_spk_bs_invoicestatus',3);
					}
				}
						
			}
		}
		
					
}
			
						
function splunk_insatllmentbilling_cust_beforelod(type,form)
{
	var rectype = nlapiGetRecordType();
	//Add the Custom Button "Create Invoice" on Installment Billing Schedule to manually create the Invoice.
	if(rectype == 'customrecord_spk_bookingschedule')
		{
		var status = nlapiGetFieldValue('custrecord_spk_bs_invoicestatus');
		if(status == 1)
			{
				nlapiLogExecution('DEBUG','status',status);
				form.setScript('customscript_spk_idinvoicemanlly');
				form.addButton('custpage_cbutton','Create Invoice','splunk_invoicecreationmanually();');
			}
		}

}

//*******************************************************************************************************************************************************//

//This function is to round the amount upto two places.
function round(value, decimals) 
{
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

//Update the Installment Billing Schedule for sales order
function updatecustomrecord(SOid,totalamount1)
{
	var reamount = 0;
	var columns = new Array();
	var filter = new Array();
	
	filter[0] = new nlobjSearchFilter('custrecord_spk_bs_sobookingschedule', null,'is',SOid);
	columns[0] = new nlobjSearchColumn('custrecord_spk_bs_installmentcycle');
	columns[1] = new nlobjSearchColumn('custrecord_spk_bs_amount');
	columns[2] = new nlobjSearchColumn('custrecord_spk_bs_invoicestatus');
	var oldamount = parseInt(totalamount1);
	var results = nlapiSearchRecord('customrecord_spk_bookingschedule',null, filter,columns);
	
	nlapiLogExecution('DEBUG','results',results.length);
	if(results)
	{
		nlapiLogExecution('DEBUG','oldamount',oldamount);
		for ( var i = 0; i <results.length; i++) 
		{
			var result1=results[i];
			var id = result1.getId();
			nlapiLogExecution('DEBUG','id',id);
			var column1=result1.getAllColumns();
			var cycle =result1.getValue(column1[0]);
			var amount =result1.getValue(column1[1]);
			var status =result1.getValue(column1[2]);
			nlapiLogExecution('DEBUG','cycle',cycle);
			reamount = parseFloat(totalamount1) - parseFloat(amount);
			nlapiLogExecution('DEBUG','reamount',reamount);
			if(id)
			{
			//Set the SO Remaining balance field in Installment Billing Schedule.
			var reamount1 =  round(reamount,2);//calling The Function
			nlapiSubmitField('customrecord_spk_bookingschedule',id,'custrecord_spk_soremainingbalance',reamount1);
			}
			var famount = parseFloat(reamount1);
			nlapiLogExecution('DEBUG','reamount',famount);
			if(famount < 0)
			{
				nlapiLogExecution('DEBUG','reamount',famount);
				throw nlapiCreateError('IB:','Installment Billing Schedule Amount is greater than SO Amount.Please Change the Payment Amount');
				
			}
			oldamount = reamount1;
			totalamount1 = oldamount;	
			
		}
	}
}

//Calculate the duedate field value for Installment Billing Schedule.
function calculateSOremaining(paymentterms,invoicedate)
{
	var dueadte1;
	var invoicedate1 = nlapiStringToDate(invoicedate);
	var days = paymentterms.split(' ')[1];
	nlapiLogExecution('DEBUG','days',days);
	var intdays = parseInt(days);
	nlapiLogExecution('DEBUG','intdays',intdays);
	var duedate = nlapiAddDays(invoicedate1, intdays);
	nlapiLogExecution('DEBUG','duedate',duedate);
	var day = duedate.getDate();
	var month = duedate.getMonth();
	var month1 = month+1;
	var year = duedate.getFullYear();
	dueadte1 = month1+'/'+day+'/'+year;
	nlapiLogExecution('DEBUG','duedate1',dueadte1);
	
	return dueadte1;
}

//Search the invoice which is created via UI or Open Air.
function calculatemanuallycreatedinvoice(soid)
{
	var uiinvoiveid = new Array();
	var uiinviocefinalid = new Array();
	 var currentContext = nlapiGetContext();   
	 var cashSaleSearch = nlapiSearchRecord('invoice', null,
		[
		 new nlobjSearchFilter('mainline', null, 'is', 'T'),
		 new nlobjSearchFilter('createdfrom', null, 'anyof',soid)
		]
	); 
	

	if(cashSaleSearch)
	{
		nlapiLogExecution('DEBUG','cashSaleSearch',cashSaleSearch.length);
		try
		{
			for (var i = 0; i<cashSaleSearch.length; i++) 
			{
				var result1=cashSaleSearch[i];
				var id = result1.getId();
				nlapiLogExecution('DEBUG','id',id);
				var tid = nlapiLookupField('invoice', id, 'tranid');
				nlapiLogExecution('DEBUG','tid',tid);
				uiinvoiveid = searchcontext(tid);
				
					if(uiinvoiveid == tid)
					{
						uiinviocefinalid.push(id);	
					}
			}
		}
		catch(e)
		{
			nlapiLogExecution('DEBUG','error',e.message);
		}
	
	}	
	
	return uiinviocefinalid;
}

function searchcontext(tid)
{
	var invoiceid = new Array();
	try
	{
		var search =  nlapiSearchRecord('customrecord_spk_bookingschedule',null, 
				[
				 new nlobjSearchFilter('custrecord_spk_bs_invoiceid', null, 'is',tid),
				], null
				 );
		if(search)
			{
				nlapiLogExecution('DEBUG','search',search.length);
			}
		else
			{
				invoiceid.push(tid);
				nlapiLogExecution('DEBUG','invoiceid',invoiceid[0]);
			}
	}
	catch(e)
	{
		nlapiLogExecution('DEBUG','error',e.message);
	}
	
	return invoiceid;
}