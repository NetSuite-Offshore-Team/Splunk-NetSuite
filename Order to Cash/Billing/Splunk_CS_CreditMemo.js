/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Apr 2014     Hari Gaddipati	DSG Case: 38877
 *												Validate invoice rebill number only has numeric values
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(type, name, linenum)
{
	if (name == 'custbody_rebill_inv_number')
	{
		var rebillInvNumber = nlapiGetFieldValue('custbody_rebill_inv_number');
		if (rebillInvNumber != '' && rebillInvNumber != null)
		{
			if (!(/^\d+$/.test(rebillInvNumber)))
			{
				alert('You may only enter numbers in this field.');
				return false;			
			}
		}
	}
    return true;
}