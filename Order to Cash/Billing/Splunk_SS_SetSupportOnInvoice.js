function beforeSubmit_setSupportOnInvoice(stType){
	
	if (stType.toLowerCase() != 'create' && stType.toLowerCase() != 'edit')
		return;	
	//Item categories.
	// 3 = Maintenance - New, 4 = Maintenance - Renewal
	var ARRITEMCATS = ['3', '4'];
	var logger = new Logger(false);
	var MSG_TITLE = 'beforeSubmit_setSupportOnInvoice';
	logger.enableDebug(); //comment this line to disable debug
	logger.debug(MSG_TITLE, '======Start======');
	
	var recTran = nlapiGetNewRecord();

	recTran.setFieldValue('custbody_splunk_support_invoice', 'F');
    var lineCount = recTran.getLineItemCount('item');
	logger.debug(MSG_TITLE, 'lineCount: ' + lineCount);		
    for (var i = 1; i <= lineCount; i++) {
		var stItemCat = recTran.getLineItemValue('item', 'custcol_item_category', i);
		logger.debug(MSG_TITLE, 'stItemCat: ' + stItemCat);
		if (isRecordType(stItemCat, ARRITEMCATS))
			recTran.setFieldValue('custbody_splunk_support_invoice', 'T');
	}
    logger.debug(MSG_TITLE, '=======End=======');
}

