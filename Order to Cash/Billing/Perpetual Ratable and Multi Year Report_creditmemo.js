/**
 * This script populates the custom fields on the line items level when user creates/edits the credit memo and saves it
 * @param (string) stEventType After Submit
 * @author Dinanath Bablu
 * @Release Date 10/18/2013 for ENHC0010498
 * @Release Number RLSE0050063
 * @version 1.0
 */
function onMemoSubmit(type) // After Submit function
{
    if (type == 'create' || type == 'edit') 
	{
        try 
		{        
            var memoid = nlapiGetRecordId();
            var memorec = nlapiLoadRecord('creditmemo', memoid);
            // Checking the posting period of the credit memo
            var currentperiod = memorec.getFieldText('postingperiod');
            nlapiLogExecution('DEBUG', 'period val is', currentperiod);
            var periodsplit = currentperiod.split(' ');
            var yearvalue = periodsplit[1]; // Taking the year of posting period in a variable
            var monthvalue = periodsplit[0]; // Taking the month of posting period in a variable
            // Determining the last day of the previous period
            if (monthvalue == 'Jan') 
			{
                var previousperiod = 'FY' + ' ' + (yearvalue - 1);
                nlapiLogExecution('DEBUG', 'prvs period_jan', previousperiod);
                var lastdayofthisperiod = 1 + '/' + '31' + '/' + (yearvalue - 1);
                var lastday = nlapiStringToDate(lastdayofthisperiod, 'mm/dd/yyyy');
                var lastdayval = lastday.getTime();
                var currentPeriodYear = yearvalue;
            }
            else 
			{
                var previouspp = 'FY' + ' ' + (yearvalue);
                nlapiLogExecution('DEBUG', 'prvs period is', previouspp);
                var lastdayofthisperiod = 1 + '/' + '31' + '/' + (yearvalue);
                var lastday = nlapiStringToDate(lastdayofthisperiod, 'mm/dd/yyyy');
                var lastdayval = lastday.getTime();
                var currentPeriodYear = parseInt(yearvalue) + 1;
            }
            var count = memorec.getLineItemCount('item');
            for (var i = 1; i <= count; i++) 
			{
                // Fetching the amount, rev rec start and end date of the line items
                var amount = memorec.getLineItemValue('item', 'amount', i);
                nlapiLogExecution('DEBUG', 'amount is ', amount);
                var schedulevalue = memorec.getLineItemValue('item', 'revrecschedule', i);
                var revrecstartdate = memorec.getLineItemValue('item', 'revrecstartdate', i); // Rev rec start date
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
                var revrecenddate = memorec.getLineItemValue('item', 'revrecenddate', i); // Rev rec end date
                var enddate = nlapiStringToDate(revrecenddate, 'mm/dd/yyyy');
                nlapiLogExecution('DEBUG', 'enddate is ', enddate);
                
                // Determining the Duration value         
                if ((startdate != '' && startdate != null) && (enddate != '' && enddate != null)) 
				{
                    var oneDay = 1000 * 60 * 60 * 24;
                    var startdate_ms = startdate.getTime();
                    var enddate_ms = enddate.getTime();
                    var difference = memorec.getLineItemValue('item', 'revrecterminmonths', i);
                    var duration = Math.round((Math.ceil(enddate_ms - startdate_ms)) / (365 * oneDay));
                    nlapiLogExecution('DEBUG', 'Duration is ', duration);
                    memorec.setLineItemValue('item', 'custcol_duration', i, duration);
                }
                else 
				{
                    var duration = '';
                    var startdate_ms = '';
                    var enddate_ms = '';
                    var difference = '';
                    memorec.setLineItemValue('item', 'custcol_duration', i, duration);
                }
                
                // checking if the item category is license-perpetual or "Other".      
                var itemcategory = memorec.getLineItemText('item', 'custcol_item_category', i);
                if (itemcategory == 'Other') 
				{
                    memorec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, 'Maintenance (Credit)');
                }
                else 
                    if ((itemcategory == 'License - Perpetual') && schedulevalue != '' && schedulevalue != null && difference > 1) 
					{
                        memorec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, 'License - Perpetual Ratable');
                    }
                    else 
					{
                        memorec.setLineItemValue('item', 'custcol_itemcategory_splunk', i, itemcategory);
                    }
                // Checking for the carveout feature             
                if (startdate_ms != '' && startdate_ms != null) 
				{
                    if ((startdate_ms - lastdayval) / oneDay > 0 && year_startdate > currentPeriodYear) 
					{
                        memorec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'T');
                    }
                    else 
					{
                        if (duration > 1) 
						{
                            memorec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'T');
                        }
                        else 
						{
                            memorec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'F');
                        }
                    }
                    
                }
                else 
				{
                    memorec.setLineItemValue('item', 'custcol_carveoutvalue', i, 'F');
                }
                
                // Setting the 'Multiyear Amount' on the Transaction line level                
                if (memorec.getLineItemValue('item', 'custcol_carveoutvalue', i) == 'T' && year_startdate > currentPeriodYear) 
				{
                    memorec.setLineItemValue('item', 'custcol_multiyearamount', i, parseFloat(amount));
                }
                else 
                    if (memorec.getLineItemValue('item', 'custcol_carveoutvalue', i) == 'T') 
					{
                        if (duration > 1) 
						{
                            var oneyearamount = amount * (1 / duration);
                            nlapiLogExecution('DEBUG', 'oneyearamnt is ', oneyearamount);
                            var multiyearamnt = parseFloat(amount - oneyearamount);
                            nlapiLogExecution('DEBUG', 'multiyearamnt is ', multiyearamnt);
                            memorec.setLineItemValue('item', 'custcol_multiyearamount', i, multiyearamnt);
                        }
                        else 
						{
                            memorec.setLineItemValue('item', 'custcol_multiyearamount', i, parseFloat(amount));
                        }
                    }
                    else 
					{
                        memorec.setLineItemValue('item', 'custcol_multiyearamount', i, '');
                    }
            }
            var recId = nlapiSubmitRecord(memorec, true);
            nlapiLogExecution('DEBUG', 'rec id is ', recId);
        } 
        catch (e) 
		{
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
    }
}
