/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Apr 2014     Hari Gaddipati	DSG Case: 38866
 *												Project update script copied from existing script Splunk_Pliu_SetSalesOrderOnProject.js
 *												Script has been updated for standards 
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */

function beforeSubmitProject(type)
{
	if (type.toLowerCase() != 'create' && type.toLowerCase() != 'edit')
		return;
		
	var logger = new Logger(false);
	var MSG_TITLE = 'beforeSubmitProject';
	logger.enableDebug(); //comment this line to disable debug
	logger.debug(MSG_TITLE, '======Start======');
	
	var recProject = nlapiGetNewRecord();
	var endDate = recProject.getFieldValue('enddate');
	if (endDate == '' && endDate == null)
	{
		var projectStartDate = recProject.getFieldValue('startdate');
		if (projectStartDate != '' && projectStartDate != null)
		{
			projectStartDate = nlapiStringToDate(projectStartDate);
			var projectEndDate = nlapiAddMonths(projectStartDate, 12);
				projectEndDate = nlapiAddDays(projectEndDate, -1);
				projectEndDate = nlapiDateToString(projectEndDate);

			recProject.setFieldValue('enddate', projectEndDate);
		}
	}

	var projectName = recProject.getFieldValue('companyname');
	if (projectName.indexOf("(") > 0 && projectName.indexOf(")") > 0) {
		var salesOrder = projectName.substring(projectName.indexOf("(") + 1, projectName.indexOf(")"));		
		
		var isCashSale = false;
		if (salesOrder.indexOf('C') != -1)
		{
			isCashSale = true;
			var cashSaleNum = salesOrder.substring(salesOrder.indexOf('C') + 1, salesOrder.length);
		}
			
		var columns = new Array();
    	columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('custbody_end_user'));
		columns.push(new nlobjSearchColumn('custbody_celigo_ns_sfdc_sync_id'));
		columns.push(new nlobjSearchColumn('salesrep'));
		columns.push(new nlobjSearchColumn('custbodycombined_services')); //DSG Case: 37979
    	
		var srcTranType = '';
		var filters = new Array();
		filters.push(new nlobjSearchFilter('mainline', '', 'is', 'T'));

		if (isCashSale)
		{
			filters.push(new nlobjSearchFilter('tranid', null, 'is', cashSaleNum));
			srcTranType = 'cashsale';
		}
		else
		{
			filters.push(new nlobjSearchFilter('tranid', null, 'is', salesOrder));
			srcTranType = 'salesorder';
		}
		
		var srcTranList = nlapiSearchRecord(srcTranType, null, filters, columns);
    	if (srcTranList != null && srcTranList.length > 0) 
    	{
			var endUser = srcTranList[0].getValue('custbody_end_user');
			recProject.setFieldValue('custentity_project_sales_order', srcTranList[0].getValue('internalid'));
			recProject.setFieldValue('custentity_project_ship_to_customer', endUser);
			recProject.setFieldValue('custentity_project_sfdc_opportunity_id', srcTranList[0].getValue('custbody_celigo_ns_sfdc_sync_id'));
			recProject.setFieldValue('custentity_project_sales_rep', srcTranList[0].getValue('salesrep'));
			recProject.setFieldValue('custentitycombined_services', srcTranList[0].getValue('custbodycombined_services'));  //DSG Case: 37979
			
			if (endUser != '' && endUser != null)
			{
				var sfdcAcctId = nlapiLookupField('customer', endUser, 'custentity_celigo_ns_sfdc_sync_id');
				if (sfdcAcctId != null)
					recProject.setFieldValue('custentity_project_sfdc_account_id',sfdcAcctId);
			}
			
			var parentId = recProject.getFieldValue('parent');
			if (parentId != '' && parentId != null)
			{
				var sfdcPartnerId = nlapiLookupField('customer', parentId, 'custentity_celigo_ns_sfdc_sync_id');
				var channelTier =  nlapiLookupField('customer', parentId, 'custentity_customer_channel_tier');
				if (sfdcPartnerId != null && channelTier == 2)
					recProject.setFieldValue('custentity_project_sfdc_partner_acct_id', sfdcPartnerId);
			}

			logger.debug(MSG_TITLE, 'SalesOrder: ' + salesOrder);
		}	
	}

	var dollarcomplete = recProject.getFieldValue('custentity_dollar_complete');
		dollarcomplete = dollarcomplete == null || dollarcomplete == '' ? 0 : parseFloat(dollarcomplete);
	if (dollarcomplete > 0) 
	{
		var estimatedrevenue = recProject.getFieldValue('estimatedrevenue');
			estimatedrevenue = estimatedrevenue == null || estimatedrevenue == '' ? 0 : parseFloat(estimatedrevenue);
		
		var old_percentcomplete = recProject.getFieldValue('percentcomplete');
		
		var old_dollarremaining = recProject.getFieldValue('custentity_dollar_remaining');
			old_dollarremaining = old_dollarremaining == null || old_dollarremaining == '' ? 0 : parseFloat(old_dollarremaining);
		
		if (parseFloat(estimatedrevenue) > 0)
		{
			var percentcomplete = (dollarcomplete / estimatedrevenue) * 100;
			var dollarremaining = estimatedrevenue - dollarcomplete;

			if (old_percentcomplete != percentcomplete) 
				recProject.setFieldValue('percentcomplete', percentcomplete);
			if (old_dollarremaining != dollarremaining) 
				recProject.setFieldValue('custentity_dollar_remaining', dollarremaining);
		}
	}
	
	var psPercentComplete = recProject.getFieldValue('custentity_ps_pct_complete');
		psPercentComplete = psPercentComplete == null || psPercentComplete == '' ? 0 : parseFloat(psPercentComplete);
	if (parseFloat(psPercentComplete) > 0)
	{
		var old_percentcomplete = recProject.getFieldValue('percentcomplete');
			old_percentcomplete = old_percentcomplete == null || old_percentcomplete == '' ? 0 : parseFloat(old_percentcomplete);
		if (parseFloat(psPercentComplete) != parseFloat(old_percentcomplete))
		{
			recProject.setFieldValue('percentcomplete', psPercentComplete);
		}
	}
	
    logger.debug(MSG_TITLE, '=======End=======');	
}