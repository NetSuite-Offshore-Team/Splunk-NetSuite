// Currently, this file just hides the revenue recognition ID if the revenue recognition feature is disabled.

function journalBeforeLoadSS(type, form)
{
	var nlobjContext = nlapiGetContext();
	if (nlobjContext.getSetting('FEATURE', 'REVENUERECOGNITION') != 'T')
	{
		var journal_field = form.getField('custbody_oa_rev_rec_id');
		if (journal_field != null)
			journal_field.setDisplayType('hidden');
	}
}