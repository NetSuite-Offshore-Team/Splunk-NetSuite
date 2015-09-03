/* Updates the salesOrder number value in the "Created From" custom field available on sales order,
 *  sales invoice, revenue commitment, revenue commitment reversal, return authorization, and 
 *  credit memo forms.
 */

function FieldUpdateOnSubmit(type, form)
{
    if (type == 'create' || type == 'edit') 
    {
        var rectype = nlapiGetRecordType();  // Getting the record type of the Current Record
        nlapiLogExecution('DEBUG', 'rec type is', rectype);
        var recId = nlapiGetRecordId(); // Getting the record ID of the Current Record
        nlapiLogExecution('DEBUG', 'rec val is', recId);
        var rec = nlapiLoadRecord(rectype, recId); // Loading the record
        var createdfrom = rec.getFieldText('createdfrom'); // Fetching the Created From Text
        if (createdfrom != '' && createdfrom != null) 
       {
            rec.setFieldValue('custbody_createdfrom', createdfrom); // Setting the value in custom Created From field
        }
        else 
            rec.setFieldValue('custbody_createdfrom', '');
        
        try 
       {
            var recid = nlapiSubmitRecord(rec, true); // Submitting the record
        } 
        catch (e) 
       {
            nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
        }
        
    }
}