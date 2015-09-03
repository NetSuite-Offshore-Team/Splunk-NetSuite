/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Mar 2013     cvandemore
 * 1.20       29 Oct 2013     cvandemore       variable shceules excluded
 * 1.30       27 Nov 2013     cvandemore       catch all errors and ignore
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	
	try{
	
		// look at the current record

		var transactionRecord = nlapiGetNewRecord();
		var transactionAccountingPeriod = transactionRecord.getFieldValue('postingperiod');

		var searchId = 'customsearch_transaction_rev_rec_schedul';

		var searchFilters = new Array();
		searchFilters.push(new nlobjSearchFilter('internalid', null, 'is', transactionRecord.getId()));

		var searchColumns = new Array();

		var searchResults = new Array();
		searchResults = nlapiSearchRecord('transaction', searchId, searchFilters, searchColumns);

		for (var sr in searchResults){

			var revRecScheduleId = searchResults[sr].getText('internalid', 'revrecschedule');

			catchUpRevRecSchedule(revRecScheduleId, transactionAccountingPeriod);
		}
	
	}catch (e) {
		nlapiLogExecution ('DEBUG', 'Unhandled Exception', '');
		//create an email and send it
		
		/* if (error.code == 'CC_PROCESSOR_ERROR')
{
logger.debug('Logged in User:', stEmpId + 'Failure Notification email:'+ emailaddr);
logger.error('CREDIT CARD ERROR', 'PROCESSING CREDIT CARD FAILED ON Order Recurrence Record # ' + stNewSalesId);
var message = 'Credit card authorization failed on Recurrence Record #. ' + stNewSalesId +'\n'+ error.getDetails();
nlapiSendEmail(stEmpId, emailaddr, 'Credit Card Processing Failed',message); 
}
*/
	}
}

function catchUpRevRecSchedule(revRecScheduleId, catchUpToPeriod){
	
	var needsSubmit = false;
	
	var revRecSchedule = nlapiLoadRecord('revrecschedule', revRecScheduleId);
	var numberOfRecurrences = revRecSchedule.getLineItemCount('recurrence');
	
	var revRecScheduleStatus = revRecSchedule.getFieldText('status');
	nlapiLogExecution ('DEBUG', 'Schedule Status', revRecScheduleStatus);
	
	var revRecScheduleType = revRecSchedule.getFieldValue('amortizationtype');
	nlapiLogExecution ('DEBUG', 'Schedule Type', revRecScheduleType);
	
	if (('Not Started' == revRecScheduleStatus) && ('VARIABLE' != revRecScheduleType)){
		
	
		nlapiLogExecution('DEBUG', 'scheduleId:', revRecScheduleId);
		nlapiLogExecution('DEBUG', 'catchUpToPeriod:', catchUpToPeriod);
	
		for (var i = 1; i <= numberOfRecurrences; i++){
			var lineAccountingPeriod = revRecSchedule.getLineItemValue('recurrence', 'postingperiod', i);
			nlapiLogExecution('DEBUG', 'Line ' + i, lineAccountingPeriod);
			
			if (earlierAccountingPeriod(lineAccountingPeriod, catchUpToPeriod)){
				revRecSchedule.setLineItemValue('recurrence', 'postingperiod', i, catchUpToPeriod);
				needsSubmit = true;
			}
		}
	}
	
	if (needsSubmit) nlapiSubmitRecord(revRecSchedule);
}

function earlierAccountingPeriod(accountingPeriodIdA, accountingPeriodIdB){
	nlapiLogExecution('DEBUG', 'A:', accountingPeriodIdA);
	nlapiLogExecution('DEBUG', 'B:', accountingPeriodIdB);
	return accountingPeriodIdA < accountingPeriodIdB;
}