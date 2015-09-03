/**
* This script populates the custom fields on the line items level when user creates/edits the Invoice form and saves it 
* @param (string) stEventType After Submit
* @author Dinanath Bablu
* @Release Date 10/18/2013 for ENHC0010498
* @Release Number RLSE0050063
* @version 1.0
*/

function onInvoiceSubmit(type) // After Submit Function
{
    if (type == 'create' || type == 'edit') 
	{
        try 
		{
            var invid = nlapiGetRecordId();
            var invrec = nlapiLoadRecord('invoice', invid);
            // Checking the posting period of the invoice
            var currentperiod = invrec.getFieldText('postingperiod');
            nlapiLogExecution('DEBUG', 'period val is', currentperiod);
            var periodsplit = currentperiod.split(' ');
            var yearvalue = periodsplit[1]; // Taking the year of posting period in a variable
            var monthvalue = periodsplit[0]; // Taking the month of posting period in a variable
            // Determining the last day of the previous period
            if (monthvalue == 'Jan') 
			{
                var previousperiod = 'FY' + ' ' + (yearvalue - 1);
                var lastdayofthisperiod = 1 + '/' + '31' + '/' + (yearvalue - 1);
                var lastday = nlapiStringToDate(lastdayofthisperiod, 'mm/dd/yyyy');
                var lastdayval = lastday.getTime();
                var currentPeriodYear = yearvalue;
            }
            else 
			{
                var previouspp = 'FY' + ' ' + (yearvalue);
                var lastdayofthisperiod = 1 + '/' + '31' + '/' + (yearvalue);
                var lastday = nlapiStringToDate(lastdayofthisperiod, 'mm/dd/yyyy');
                var lastdayval = lastday.getTime();
                var currentPeriodYear = parseInt(yearvalue) + 1;
            }
            var count = invrec.getLineItemCount('item');
            for (var i = 1; i <= count; i++) 
			{				
                // Fetching the amount, rev rec start and end date of the line items
                var amount = invrec.getLineItemValue('item', 'amount', i);
                nlapiLogExecution('DEBUG', 'amount is ', amount);
                var schedulevalue = invrec.getLineItemValue('item', 'revrecschedule', i);
                var revrecstartdate = invrec.getLineItemValue('item', 'revrecstartdate', i);
                var startdate = nlapiStringToDate(revrecstartdate, 'mm/dd/yyyy');
                if (revrecstartdate != null && revrecstartdate != '') 
				{
                    var splitStartDate = revrecstartdate.split('/');
                    var month_startdate = splitStartDate[0];
                    if (month_startdate > 1) 
					{
                        var year_startdate = parseInt(splitStartDate[2]) + 1;
                    }
                    else 
					{
                        var year_startdate = splitStartDate[2];
                    }
                }
                
                nlapiLogExecution('DEBUG', 'startdate is ', startdate);
                var revrecenddate = invrec.getLineItemValue('item', 'revrecenddate', i);
                var enddate = nlapiStringToDate(revrecenddate, 'mm/dd/yyyy');
                nlapiLogExecution('DEBUG', 'enddate is ', enddate);
                
                // Determining the Duration value        
                if ((startdate != '' && startdate != null) && (enddate != '' && enddate != null)) {
                    var oneDay = 1000 * 60 * 60 * 24;
                    var startdate_ms = startdate.getTime();
                    var enddate_ms = enddate.getTime();
                    var difference = invrec.getLineItemValue('item', 'revrecterminmonths', i);
                    nlapiLogExecution('DEBUG', 'diff is', difference);
                   
                    var duration = Math.round((Math.ceil(enddate_ms - startdate_ms)) / (365 * oneDay));
                    nlapiLogExecution('DEBUG', 'Duration is ', duration);
                    invrec.setLineItemValue('item', 'custcol_duration', i, duration);
                }
                else 
				{
                    var duration = '';
                    var startdate_ms = '';
                    var enddate_ms = '';
                    var difference = '';
                    invrec.setLineItemValue('item', 'custcol_duration', i, duration);
                }
                
                // checking if the item category is license-perpetual or "Other".     
                var itemcategory = invrec.getLineItemText('item', 'custcol_item_category', i);
                if (itemcategory == 'Other') 
				{
                    invrec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, 'Maintenance (Credit)');
                }
                else 
                    if ((itemcategory == 'License - Perpetual') && schedulevalue != '' && schedulevalue != null && difference > 1) 
					{                       
                        invrec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, 'License - Perpetual Ratable');
                    }
                    else 
					{
                        invrec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, itemcategory);
                    }
                // Checking for the carveout feature 
                if (startdate_ms != '' && startdate_ms != null) 
				{
                    if ((startdate_ms - lastdayval) / oneDay > 0 && year_startdate > currentPeriodYear) 
					{
                        invrec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'T');
                    }
                    else {
                        if (duration > 1) 
						{
                            invrec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'T');
                        }
                        else 
						{
                            invrec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'F');
                        }
                    }
                    
                }
                else 
				{
                    invrec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'F');
                }
                
                // Setting the 'Multiyear Amount' on the Transaction line level 
                var val = invrec.getLineItemValue('item', 'custcol_carveoutvalue', i);
                if (invrec.getLineItemValue('item', 'custcol_carveoutvalue', i) == 'T' && year_startdate > currentPeriodYear) 
				{
                    invrec.setLineItemValue('item', 'custcol_multiyearamount', i, parseFloat(amount));
                }
                else 
                    if (invrec.getLineItemValue('item', 'custcol_carveoutvalue', i) == 'T') 
					{
                        if (duration > 1) 
						{
                            var oneyearamount = amount * (1 / duration);
                            nlapiLogExecution('DEBUG', 'oneyearamnt is ', oneyearamount);
                            var multiyearamnt = parseFloat(amount - oneyearamount);
                            nlapiLogExecution('DEBUG', 'multiyearamnt is ', multiyearamnt);
                            invrec.setLineItemValue('item', 'custcol_multiyearamount', i, multiyearamnt);
                        }
                        else 
						{
                            invrec.setLineItemValue('item', 'custcol_multiyearamount', i, parseFloat(amount));
                        }
                    }
                    else 
					{
                        invrec.setLineItemValue('item', 'custcol_multiyearamount', i, '');
                    }
            }
            var recId = nlapiSubmitRecord(invrec, true);
            nlapiLogExecution('DEBUG', 'rec id is ', recId);
        } 
        catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
}
