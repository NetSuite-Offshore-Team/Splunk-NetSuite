function afterSubmit(type) {
	
	if (type.toLowerCase() != 'create' && type.toLowerCase() != 'edit')
		return;

    var loadedInvoice = nlapiLoadRecord('invoice', nlapiGetRecordId());
    var lineCount = loadedInvoice.getLineItemCount('item');
    
    var summary = '';
	for ( i = 1; i <=lineCount; i++)  {
		var description = nlapiLookupField('item', loadedInvoice.getLineItemValue('item','item',i), 'salesdescription');
		if (description == null || description == '')
			description = nlapiLookupField('item', loadedInvoice.getLineItemValue('item','item',i), 'description');
		var memo = loadedInvoice.getLineItemValue('item','custcol_memo',i);
		if (memo == null || memo == '') 
		    summary = summary + '[' + loadedInvoice.getLineItemText('item','item',i) + '] [' + 
							description + '] [Qty: ' + 
							loadedInvoice.getLineItemValue('item','quantity',i) + ']';
		else
		    summary = summary + '[' + loadedInvoice.getLineItemText('item','item',i) + '] [' + 
							description + '] [Qty: ' + 
							loadedInvoice.getLineItemValue('item','quantity',i) + '] [Memo: ' + 
							memo + ']';									
		if (i < lineCount)
			summary  = summary + '\n';
	}
	
	loadedInvoice.setFieldValue('custbody_celigo_line_item_summary', summary);
	nlapiSubmitRecord(loadedInvoice, true);		
}