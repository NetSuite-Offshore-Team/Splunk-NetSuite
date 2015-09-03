function afterSubmit(type) {
	
	if (type.toLowerCase() != 'create' && type.toLowerCase() != 'edit')
		return;

    var salesOrderRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
    var lineCount = salesOrderRec.getLineItemCount('item');
    
    var summary = '';
	for ( i = 1; i <=lineCount; i++)  {
		var description = nlapiLookupField('item', salesOrderRec.getLineItemValue('item','item',i), 'salesdescription');
		if (description == null || description == '')
			description = nlapiLookupField('item', salesOrderRec.getLineItemValue('item','item',i), 'description');
		var memo = salesOrderRec.getLineItemValue('item','custcol_memo',i);
        //Ajit Deshpande. @added: 22Oct2013
		var numOfNodes = salesOrderRec.getLineItemValue('item','custcol_number_of_nodes',i);
		var peakDailyVol = salesOrderRec.getLineItemValue('item','custcol_peak_daily_vol_gb',i);
        
		if (memo == null || memo == '') 
		    summary = summary + '[' + salesOrderRec.getLineItemText('item','item',i) + '] [' + 
							description + '] [Qty: ' + 
							salesOrderRec.getLineItemValue('item','quantity',i) + ']';
		else
		    summary = summary + '[' + salesOrderRec.getLineItemText('item','item',i) + '] [' + 
							description + '] [Qty: ' + 
							salesOrderRec.getLineItemValue('item','quantity',i) + '] [Memo: ' + 
							memo + ']';									
	    if(numOfNodes > 0)
            summary = summary + ' [Nodes: ' + numOfNodes + ']'; 
        else if (peakDailyVol > 0.0)
        	summary = summary + ' [Peak Daily Vol: ' + peakDailyVol + ']';
    if (i < lineCount)
			summary  = summary + '\n';
	}
	
	salesOrderRec.setFieldValue('custbody_celigo_line_item_summary', summary);
	nlapiSubmitRecord(salesOrderRec, true);		
}
