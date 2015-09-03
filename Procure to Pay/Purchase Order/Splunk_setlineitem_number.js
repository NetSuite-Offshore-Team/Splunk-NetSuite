/* Whenever a PO is created and after saving the PO, the line column field should update the line number sequentially. 
 * User Event Script - Splunk_Set LineItem Number
 * @author Abith Nitin
 * @Release Date  20-March-2015 
 * @Release Number 
 * @version 1.0
 */

function beforeSubmitSOLineNo(type,form)//User event script to trigger line numbers when the record is saved.
{
	if (type == 'create') //Script will get triggered only on create of PO and not on edit.
	{
		var itemcount = nlapiGetLineItemCount('item');
		nlapiLogExecution('DEBUG','itemcount',itemcount);	
		for (var g = 1; g <= itemcount; g++)
		{
		nlapiSetLineItemValue('item','custcol_po_line_no',g,g);//setting the line number for all the line items sequentially.
		}
	}
}
