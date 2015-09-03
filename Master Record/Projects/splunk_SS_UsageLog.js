/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Mar 2014     Hari Gaddipati	DSG Case 38408 LMS 4 EDU - fields/script/workflow
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type)
{
	if (type == 'create')
	{
		try
		{
			//Now call suitelet to submit project save so user event script to update percent complete fires
			var suiteletUrl = nlapiResolveURL('SUITELET', 'customscript_update_project_edu', 'customdeploy_update_project_edu', true);
			suiteletUrl += '&recId=' + nlapiGetRecordId();
			nlapiRequestURL(suiteletUrl);
		}
		catch(er)
		{
			er = nlapiCreateError(er);
		}
	}
}

function updateProject(request, response)
{
	var recId = request.getParameter('recId');
	
	if(recId == null || recId == '')
	{
		response.write('Error: Missing required argument.');
		return;
	}

	try
	{
		var recUsage = nlapiLoadRecord('customrecord_usage_log', recId);
		var recProject = nlapiLoadRecord('job', recUsage.getFieldValue('custrecord_project'));
		
		var newProjectStatus  = '';
		var project_EDU_used = recProject.getFieldValue('custentity_project_edu_used');
		var project_EDU_credits = recProject.getFieldValue('custentity_project_edu_credits');
		var project_dollar_complete = recProject.getFieldValue('custentity_dollar_complete');
		var project_cost_per_credit = recProject.getFieldValue('custentity_cost_per_credit');

		project_EDU_used = project_EDU_used == null || project_EDU_used == '' ? 0 : parseFloat(project_EDU_used);
		project_EDU_credits = project_EDU_credits == null || project_EDU_credits == '' ? 0 : parseFloat(project_EDU_credits);
		project_dollar_complete = project_dollar_complete == null || project_dollar_complete == '' ? 0 : parseFloat(project_dollar_complete);
		project_cost_per_credit = project_cost_per_credit == null || project_cost_per_credit == '' ? 0 : parseFloat(project_cost_per_credit);
		
		var oldProject_EDU_used = project_EDU_used;
		var newProject_EDU_used = project_EDU_used + parseFloat(recUsage.getFieldValue('custrecord_edu_amount'));
		if (parseFloat(newProject_EDU_used) > 0)
		{
			if ( parseFloat(newProject_EDU_used) == parseFloat(project_EDU_credits) )
			{
				newProjectStatus = 'Complete';
			}
			else
			{
				if (parseFloat(oldProject_EDU_used) == 0)
				{
					newProjectStatus = 'In Progress';
				}
			}
		}

		var projectEDU_PercentComplete = (parseFloat(newProject_EDU_used) / parseFloat(project_EDU_credits)) * 100;
			projectEDU_PercentComplete = parseFloat(projectEDU_PercentComplete);
			projectEDU_PercentComplete = projectEDU_PercentComplete.toFixed(2);

		project_dollar_complete += parseFloat(recUsage.getFieldValue('custrecord_edu_amount')) * parseFloat(project_cost_per_credit);

		if (newProjectStatus != '' && newProjectStatus != null)
		{
			recProject.setFieldText('entitystatus', newProjectStatus);
		}
		recProject.setFieldValue('custentity_project_edu_pct_complete', projectEDU_PercentComplete);
		recProject.setFieldValue('custentity_project_edu_used', newProject_EDU_used);
		recProject.setFieldValue('custentity_dollar_complete', project_dollar_complete);

		nlapiSubmitRecord(recProject);
	}
	catch(er)
	{
		response.write('Error: ' + er.toString());
		nlapiLogExecution('Error', 'Checking', 'Error occured while submitting the Record - ' + rec.getFieldValue('tranid') + '. Details - ' + er.getDetails());
	}

	response.write('Success');
}