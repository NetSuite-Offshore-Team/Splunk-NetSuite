/* @created by Dinanath Bablu */

function onloading(type)

{
	if (type == 'edit' || type == 'create') 
	{
		var preparerid = nlapiGetFieldValue('assigned');
		var reviewerid = nlapiGetFieldValue('custeventtask_reviewer');
		var userId = nlapiGetUser();
		nlapiDisableField('status', true);
	    nlapiDisableField('custeventtask_reviewer_status', true);

		if (preparerid == userId) 
		{
			//nlapiDisableField('preparerid',false);
			nlapiDisableField('status', false);
			
		}
		
		else if (reviewerid == userId) 
		{
				
			nlapiDisableField('custeventtask_reviewer_status', false);
				
		}
	}
}

function fieldchange(type,name)
{
	var preparerid = nlapiGetFieldValue('assigned');
	var reviewerid = nlapiGetFieldValue('custeventtask_reviewer');
	var userId = nlapiGetUser();
	nlapiDisableField('status', true);
	nlapiDisableField('custeventtask_reviewer_status', true);
	if (preparerid == userId && reviewerid == userId) 
		{
			//nlapiDisableField('preparerid',false);
			nlapiDisableField('status', false);
			nlapiDisableField('custeventtask_reviewer_status', false);
			
		}
		else if (reviewerid == userId) 
		{
				
			nlapiDisableField('custeventtask_reviewer_status', false);
				
		}
		else if (preparerid == userId) 
		{
				
			nlapiDisableField('status', false);
				
		}
	
}
