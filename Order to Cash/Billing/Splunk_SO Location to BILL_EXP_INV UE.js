/*
 * Script is used to uncheck the Combined Straight-line on the Sales Order, Invoice and on any related Projects when the Combined Services End Date on the Sales Order and Invoice is reached.
 * and check off the 'EXCLUDE FROM CS SCRIPTS'checkbox on sales order, invoice and related projects.
 * @author : Jitendra Singh
 * @Release Date
 * @Release Number
 * @Project ENHC0051272 
 * @version 1.0
 */

function locationSOtoInvAfterSubmit(type){
	try
	{
		if(type == 'create' || type == 'edit')
		{
			nlapiLogExecution('DEBUG', '***START***');
			
//			var InvIntID = nlapiGetRecordId();
//			var invRec = nlapiLoadRecord('invoice', InvIntID);
//			nlapiLogExecution('DEBUG', 'InvIntID', InvIntID);
			
			var billExpCount = nlapiGetLineItemCount('expcost');
			for(var billExpIndex=1;billExpIndex<=billExpCount;billExpIndex++)
			{
				var apply = nlapiGetLineItemValue('expcost', 'apply', billExpIndex);
				if(apply == 'T')
				{
					var job = nlapiGetLineItemValue('expcost', 'job', billExpIndex);
					nlapiLogExecution('DEBUG', 'job', job);
					if(job)
					{
						var soRecIntId = nlapiLookupField('job', job, 'custentity_project_sales_order');
						nlapiLogExecution('DEBUG', 'soRecIntId', soRecIntId);
						if(soRecIntId)
						{
							var soLocation = nlapiLookupField('salesorder', soRecIntId, 'location');
							nlapiLogExecution('DEBUG', 'soLocation', soLocation);
							if(soLocation)
							{
								nlapiSetFieldValue('location', soLocation);
//								nlapiSetFieldvalue('invoice', InvIntID, 'location', soLocation);
//								invRec.setFieldValue('location', soLocation);
//								nlapiSubmitRecord(invRec);
							}
						}
					}
					break;
				}
			}
			nlapiLogExecution('DEBUG', '***END***');
		}
	}
	catch (e) 
	{
		nlapiLogExecution('ERROR', e.getCode(), e.getDetails());
	}
}
