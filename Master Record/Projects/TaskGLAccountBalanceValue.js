/*ENHC0010701: All the tasks created with the task area = 2 Reconciliation Checklist Inc and GL Account field, BALANCE AFTER RECON custom field will be populated with the GL account balance during task creation and BALANCE AFTER PERIOD CLOSE  custom field will get populate after the  review completion and closing the fiscal period.
 * @author Mukta Goyal
 * @Release Date  :13-July-2015  
 * @Release Number :RLSE0050396
 * @version 1.0
 */

function taskGlAccountBalance(type)
{
	try
	{
		nlapiLogExecution('DEBUG', 'Task IntID',nlapiGetRecordId());
		var checkbox = nlapiGetFieldValue('custevent_spk_task_overridebalance');
		nlapiLogExecution('DEBUG', 'checkbox',checkbox);
		if(checkbox!= 'T')
		{
			var status = nlapiGetFieldValue('custeventtask_reviewer_status');
			nlapiLogExecution('DEBUG', 'status',status);
			var task= nlapiGetFieldValue('custeventtask_task_area');
			var account=nlapiGetFieldValue('custevent_gl_account');
			var fiscalPeriod=nlapiGetFieldValue('custeventtask_fiscal_period');
			nlapiLogExecution('DEBUG', 'fiscalPeriod',fiscalPeriod);
			var prepstatus = nlapiGetFieldText('status');
			nlapiLogExecution('DEBUG', 'prepstatus',prepstatus);

			/*Start-Code is added for handling the task edit from Inline editing by Jitendra on 22nd June 2015*/
			if(type == 'xedit')
			{
				var recId = nlapiGetRecordId();
				var record = nlapiLoadRecord('task', recId);

				status = record.getFieldValue('custeventtask_reviewer_status');
				task = record.getFieldValue('custeventtask_task_area');
				account=record.getFieldValue('custevent_gl_account');
				fiscalPeriod = record.getFieldValue('custeventtask_fiscal_period');
				prepstatus = record.getFieldText('status');

				// call nlapiGetNewRecord to get the fields that were inline edited
				var fields = nlapiGetNewRecord().getAllFields()

				// loop through the returned fields
				for (var i = 0; i < fields.length; i++)
				{
					if (fields[i] == 'custeventtask_reviewer_status')
					{
						status = nlapiGetFieldValue('custeventtask_reviewer_status');
					}
					if (fields[i] == 'custeventtask_task_area')
					{
						task = nlapiGetFieldValue('custeventtask_task_area');
					}
					if (fields[i] == 'custevent_gl_account')
					{
						account = nlapiGetFieldValue('custevent_gl_account');
					}
					if (fields[i] == 'custeventtask_fiscal_period')
					{
						fiscalPeriod = nlapiGetFieldValue('custeventtask_fiscal_period');
					}
					if (fields[i] == 'status')
					{
						prepstatus = nlapiGetFieldText('status');
					}
				}
				nlapiLogExecution('DEBUG', 'Inside xedit');
				nlapiLogExecution('DEBUG', 'account:status:fiscalPeriod:prepstatus',account+':'+status+':'+fiscalPeriod+':'+prepstatus);
			}
			/*End-Code is added for handling the task edit from Inline editing.*/

			var creditamount1= '';
			var debitamount1= '';
			var total= 0.0;
			var total2= 0.0;
			var total4=0.0;
			var totalamount = 0.0;
			var totalamount1 = 0.0;

			var creditamount3='';
			var debitamount3='';
			var total5=0.0;
			var filter1= new Array();
			var filter2 = new Array();
			var filter3 = new Array();

			var postingperiodstatus='';
			var transtotal = new Array();
			var finaltotal = 0.0;

			var transtotal3 = new Array();
			var finaltotal3 = 0.0;

			if(account)
			{
				filter1[0] =  new nlobjSearchFilter('account',null,'anyof',account);
				filter2[0] =  new nlobjSearchFilter('account',null,'anyof',account);
				filter3[0] =  new nlobjSearchFilter('internalid',null,'anyof',fiscalPeriod);
				filter3[1] =  new nlobjSearchFilter('closed',null,'is','T');

				var revresults= nlapiSearchRecord('transaction','customsearch_spk_taskglaccountssearch', filter1,null);
				var revresults2 = nlapiSearchRecord('transaction','customsearch_spk_taskglaccountssearch2',filter2,null);
				
				//Added for searching the Accounting Period that is closed or not.By Jitendra on 25th June 2015				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('internalid', null, null);
				columns[1] = new nlobjSearchColumn('closed', null, null);
				var revresults3 = nlapiSearchRecord('accountingperiod', null, filter3, columns );
			}

			if(revresults)
			{
				nlapiLogExecution('DEBUG', 'revresults.length',revresults.length);
				for(var z1=0; z1<revresults.length; z1++)
				{
					var result1=revresults[z1];
					var column1=result1.getAllColumns();
					totalamount =result1.getValue(column1[0]);
					creditamount1 =result1.getValue(column1[2]);
					debitamount1 = result1.getValue(column1[3]);
					period =result1.getValue(column1[7]);

					if(period <= parseInt(fiscalPeriod))
					{
						if(debitamount1 == '')
						{
							debitamount1= 0.0;
						}
						if(creditamount1 == '')
						{
							creditamount1= 0.0;
						}

						total4 =  parseFloat(total4) + parseFloat(totalamount);
					}
				}
				nlapiLogExecution('DEBUG', 'total4',total4);
			}

			if(revresults2)
			{
				nlapiLogExecution('DEBUG', 'revresults2.length',revresults2.length);
				for(var z1=0; z1<revresults2.length; z1++)
				{

					var result1=revresults2[z1];
					var column1=result1.getAllColumns();
					totalamount1 =result1.getValue(column1[1]);
					creditamount3 =result1.getValue(column1[2]);
					debitamount3 = result1.getValue(column1[3]);

					period =result1.getValue(column1[7]);

					if(period <= parseInt(fiscalPeriod))
					{
						if(debitamount3 == '')
						{
							debitamount3= 0.0;
						}
						if(creditamount3 == '')
						{
							creditamount3= 0.0;
						}
						total5 =  parseFloat(total5) + parseFloat(totalamount1);
					}
				}
				nlapiLogExecution('DEBUG', 'total5',total5);
			}
			
			if(revresults3)
			{
				nlapiLogExecution('DEBUG', 'revresults3.length',revresults3.length);
				for(var z1=0; z1<revresults3.length; z1++)
				{
					var result1=revresults3[z1];
					var column1=result1.getAllColumns();
					var closedPeriodIntId = result1.getValue(column1[0]);
					postingperiodstatus = result1.getValue(column1[1]);
					nlapiLogExecution('DEBUG', 'closedPeriodIntId:postingperiodstatus',closedPeriodIntId+':'+postingperiodstatus);
				}
			}

			if(task =='2')
			{
				nlapiLogExecution('DEBUG', 'task',task);
				if(type=='create' || type=='copy')
				{
					nlapiLogExecution('DEBUG', 'account',account);
					if(account!='1')
					{
						if(postingperiodstatus!='T')
						{
							if(prepstatus == 'Completed')
							{

								nlapiSetFieldValue('custevent_spk_balanceuponcreation', total4);
							}
							else
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation',null);
							}
						}
						//Added for populating "Balance After Period Close" upon period close even if the Reviewer Status != Completed by Jitendra on 24th June 2015
						if(postingperiodstatus == 'T')
						{
							nlapiSetFieldValue('custevent_spk_balanceafterreview', total4);
						}
					}
					else
					{
						if(postingperiodstatus!='T')
						{
							if(prepstatus == 'Completed')
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation', total5);
							}
							else
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation',null);
							}
						}
						//Added for populating "Balance After Period Close" upon period close even if the Reviewer Status != Completed by Jitendra on 24th June 2015
						if(postingperiodstatus == 'T')
						{
							nlapiSetFieldValue('custevent_spk_balanceafterreview', total5);
						}
					}
				}

				if(type=='edit' || type=='xedit')// Added the type==xedit for inline editing process by jitendra on 22nd June 2015
				{
					nlapiLogExecution('DEBUG', 'account',account);
					if(account!='1')
					{
						if(postingperiodstatus == 'T')
						{
							//Condition is commented for 'Balance After Period Close' auto-populate upon period close, even if the Reviewer Status != Completed
							//on 22nd June 2015 by Jitendra
//							if(status == 3) // Status = 1 for Not Started, 2 for In Progress, 3 for Completed
//							{

							nlapiSetFieldValue('custevent_spk_balanceafterreview', total4);
//							}
						}
						//Clear the field BALANCE AFTER PERIOD CLOSE if period changed to any open period.by Jitendra on 25th June 2015
						else
						{
							nlapiSetFieldValue('custevent_spk_balanceafterreview', null);
						}
					}
					else
					{
						if(postingperiodstatus == 'T')
						{
							//Condition is commented for 'Balance After Period Close' auto-populate upon period close, even if the Reviewer Status != Completed
							//on 22nd June 2015 by Jitendra
//							if(status == 3) // Status = 1 for Not Started, 2 for In Progress, 3 for Completed
//							{
							nlapiSetFieldValue('custevent_spk_balanceafterreview', total5);
//							}
						}
						//Clear the field BALANCE AFTER PERIOD CLOSE if period changed to any open period by Jitendra on 25th June 2015
						else
						{
							nlapiSetFieldValue('custevent_spk_balanceafterreview', null);
						}
					}

					if(account!='1')
					{
						if(postingperiodstatus!='T')
						{
							if(prepstatus == 'Completed')
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation', total4);
							}
							//Clear the field BALANCE AFTER RECON if Preparer Status changed to other than Completed.by Jitendra on 25th June 2015
							else
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation',null);
							}
						}
						else
						{
							//Clear the field BALANCE AFTER RECON if Period Closed and Preparer Status changed to other than Completed.by Jitendra on 25th June 2015
							if(prepstatus != 'Completed')
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation', null);
							}
						}
					}
					else
					{
						if(postingperiodstatus!= 'T')
						{
							if(prepstatus == 'Completed')
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation', total5);
							}
							//Clear the field BALANCE AFTER RECON if Preparer Status changed to other than Completed.by Jitendra on 25th June 2015
							else
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation',null);
							}
						}
						else
						{
							//Clear the field BALANCE AFTER RECON if Period Closed and Preparer Status changed to other than Completed.by Jitendra on 25th June 2015
							if(prepstatus != 'Completed')
							{
								nlapiSetFieldValue('custevent_spk_balanceuponcreation', null);
							}
						}
					}
				}
			}
			//If the task Area is other than '2 Reconciliation Checklist Inc' then clear both Balance fields.by Jitendra on 25th June 2015
			else
			{
				nlapiSetFieldValue('custevent_spk_balanceuponcreation', null);
				nlapiSetFieldValue('custevent_spk_balanceafterreview', null);
			}
		}   
	}
	catch(e)
	{
		nlapiLogExecution('ERROR', e.getCode(), e.getDetails());
	}
}
