function beforeSubmit(type) {

	if (type.toLowerCase() != 'create')
		return;
	
	if (nlapiGetContext().getExecutionContext() != 'webservices')
		return;
	
	var order = nlapiGetNewRecord();
	
	if (order.getFieldValue('department') != '' && order.getFieldValue('department') != null)
		return;
	
	if (order.getFieldValue('salesrep') == null)
		return;
	
	order.setFieldValue('department', nlapiLookupField('employee', order.getFieldValue('salesrep'), 'department'));
	order.setFieldValue('location', nlapiLookupField('employee', order.getFieldValue('salesrep'), 'location'));

}