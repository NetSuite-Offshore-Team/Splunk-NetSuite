// Currently, this file just hides the custentity_oa_sfa_id field when the 3-way integration is disabled.

function custjobBeforeLoadSS(type, form)
{
	var nlobjContext = nlapiGetContext();

	var scriptval = nlobjContext.getSetting('SCRIPT', 'custscript_oa_sfa_intg_enabled');
	if (scriptval != 'T')
	{
		var sfa_field = form.getField('custentity_oa_sfa_id');
		if (sfa_field != null)
			sfa_field.setDisplayType('hidden');
	}
}