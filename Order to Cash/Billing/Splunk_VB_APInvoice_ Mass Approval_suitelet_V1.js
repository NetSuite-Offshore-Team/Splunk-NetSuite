/**
 * This script file is used to create the Mass Approval AP Invoice page.
 * @author Abhilash Gopinathan
 * @Release Date 15th June 2014
 * @Release Number RLSE0050216
 * @Project #PRJ0050215
 * @version 1.0
 */
//Modified Script for AP Approval Phase-II
/**
 * Added new logic for Due Date sorting, added new column "Bill Received Date"  and replaced method "getperiod" to "getperiodofSubsidiary" to update Posting period for AP unlocked subsidiary
 * @author Abhilash Gopinathan
 * @Release Date 6th Oct 2014
 * @Release Number RLSE0050262
 * @Project # PRJ0050722
 * @version 1.1
 */
//Modified line of code in method getperiodofSubsidiary
/**
 * Added inline logic for year captured from Posting period name due to the issue with Vendor Bill Posting for 2016 (INC0090657)
 * @author Unitha Rangam
 * @Release Date 13th Jan 2015
 * @Release Number RLSE0050308
 * @Project # DFCT0050493
 * @version 1.2
 */
/**
 * Added logic to modify the AP Invoice mass Approval page to list the Subsidiary Specific Bills
 * @author Anchana sv
 * @Release Date: 22nd May 2015
 * @Release Number : RLSE0050369
 * @Project ENHC0051452
 * @version 1.3
 */
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
var finalApprover = nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_finalapprover');
function SuiteList(request,response)
{
	if (request.getMethod() == 'GET' )
	{

		var errorms = request.getParameter('error');
		var ref = request.getParameter('ref');
		if((!request.getParameter('error'))&&(!request.getParameter('ref')))
		{
			var pagenum = request.getParameter('pagenum');

			if(pagenum && (pagenum.search('&')>0))
			{
				pagenum = pagenum.split('&')[0];
			}
			nlapiLogExecution('DEBUG','PAG',pagenum);
			var form = nlapiCreateForm('AP Invoice Mass Approval');
			form.setScript('customscript_splunkmassapproval');
			form.addFieldGroup('custpage_fc', 'Filter Criteria');
			form.addField('custpage_vn','select','Vendor Name','vendor','custpage_fc');
			form.addField('custpage_in','text','Invoice Number',null,'custpage_fc');

			form.addField('custpage_fd','date','Bill Creation Date (From)',null,'custpage_fc');

			form.addField('custpage_td','date','Bill Creation Date (To)',null,'custpage_fc');
			form.addField('custpage_sub','multiselect','Subsidiary','subsidiary','custpage_fc'); //added for ENHC0051452
			form.addField('custpage_link','text','',null,'custpage_fc').setDisplayType('hidden');

			var tab = form.addTab('custpage_results', 'Vendor Bill List');
			var sampleSubTab = form.addSubTab('custpage_subtab', 'Approve Bills','custpage_results');
			var selectPage = form.addField('custlist_selectpage','select','Select Page',null,'custpage_subtab');
			form.addField('custpage_include','checkbox','Include Line Items',null,'custpage_subtab');
			var sublis = form.addSubList('custpage_sublist','list','Approval List','custpage_subtab');    

			sublis.addMarkAllButtons();
			sublis.addField('venapprove','checkbox','Select');
			sublis.addField('lnh','checkbox','').setDisplayType('hidden');
			sublis.addField('headerorline','text','Header & Line');

			sublis.addField('internalid','text','Internalid').setDisplayType('hidden');
			sublis.addField('tranid','text','Invoice Number');
			sublis.addField('trandate','text','Invoice Date');
			sublis.addField('name','text','Vendor Name');

			sublis.addField('duedate','text','Due Date');

			sublis.addField('amount','currency','Amount');
			sublis.addField('term','text','Payment Term');
			sublis.addField('daysoverdue','text','AP Age');
			sublis.addField('account','text','Account');
			sublis.addField('item','text','Item Name');
			sublis.addField('memo','textarea','Memo').setDisplaySize(2,1);
			sublis.addField('brd','text','Bill Received Date');
			sublis.addField('location','text','Location');
			sublis.addField('department','text','Department');
			sublis.addField('class','text','Class');
			sublis.addField('amortschedule','text','Amort Schedule');
			sublis.addField('amortstart','date','Amort Start');
			sublis.addField('amortend','date','Amort End');

			var f1 = 1;
			var f2 = 1;
			var f3 = 1;
			var f4 = 1;
			var f5 = 0;
			var vendor = request.getParameter('vendor');
			if(vendor&&(vendor.search('&')>0))
			{
				vendor = vendor.split('&')[0];
			}
			nlapiLogExecution('DEBUG','VEN',vendor);
			if((vendor == 'x')||(vendor == null)||(vendor == ''))
			{
				f1=0;
			}
			var dateto = request.getParameter('dateto');
			if(dateto &&(dateto.search('&')>0))
			{
				dateto = dateto.split('&')[0];
			}
			nlapiLogExecution('DEBUG','DAT',dateto);
			if((dateto == 'x')||(dateto == null)||(dateto == ''))
			{
				f2=0;
			}
			var datefrom = request.getParameter('datefrom');
			if(datefrom && (datefrom.search('&')>0))
			{
				datefrom = datefrom.split('&')[0];
			}
			nlapiLogExecution('DEBUG','DAF',datefrom);
			if((datefrom == 'x')||(datefrom == null)||(datefrom == ''))
			{
				f3=0;
			}
			var invoice = request.getParameter('invoice');
			nlapiLogExecution('DEBUG','INV',invoice);


			if(invoice && (invoice.search('&pagenum')>0))
			{
				invoice = invoice.split('&')[0];

			}
			if(invoice && invoice.search('coded1coded')>-1)
			{
				invoice = invoice.replace('coded1coded','#');
			}

			if((invoice == null)||(invoice == ''))
			{
				f4=0;
			}
                       /*ENHC0051452*/
			var subsidiary = request.getParameter('subsidiary');
			var subid=new Array();
			if(subsidiary){
				subid=subsidiary.split(',');
				f5=1;
				for(var i=1;i<subid.length;i++){
					if(subid[i]&&(subid[i].search('&')>0))
					{
						subid[i] = subid[i].split('&')[0];
						
					}
				}
			}
			/*ENHC0051452*/
			var mv = '';
			var main = request.getParameter('main');
			if(main && (main.search('&')>0))
			{
				main = main.split('&')[0];
			}
			nlapiLogExecution('DEBUG','MAIN',main);
			if((main == null)||(main== ''))
			{
				mv = 'T';
			}
			if((main == 'f')||(main == 'F'))
			{
				mv = 'T';
			}
			if((main == 't')||(main == 'T'))
			{
				mv = 'F';
			}
			nlapiLogExecution('DEBUG','MAINAGP',main +'::'+mv);

			var filter = new Array();
			if(mv!='F')
			{
				filter[0] = new nlobjSearchFilter('mainline',null,'is',mv);
			}
			else
			{
				filter[0] = new nlobjSearchFilter('memorized',null,'is','F');
			}
			filter[1] = new nlobjSearchFilter('approvalstatus',null,'is','1');
			filter[2] = new nlobjSearchFilter('memorized',null,'is','F');
			filter[3] = new nlobjSearchFilter('custbody_spk_inv_apvr',null,'anyof',nlapiGetUser());

			if((f1==0)&&(f2==0)&&(f3==1)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),new Date());
			}
			if((f1==0)&&(f2==0)&&(f3==0)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}
			if((f1==0)&&(f2==1)&&(f3==0)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate('01/01/1900'),nlapiStringToDate(dateto));
			}
			if((f1==0)&&(f2==1)&&(f3==1)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),nlapiStringToDate(dateto));
			}
			if((f1==1)&&(f2==0)&&(f3==0)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
			}
			if((f1==1)&&(f2==0)&&(f3==0)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}

			if((f1==1)&&(f2==0)&&(f3==1)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),new Date());
			}
			if((f1==1)&&(f2==1)&&(f3==0) &&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate('01/01/1900'),nlapiStringToDate(dateto));
			}
			if((f1==1)&&(f2==1)&&(f3==1)&&(f5==0))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),nlapiStringToDate(dateto));
			}
			if((f1==0)&&(f2==1)&&(f3==0) &&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate('01/01/1900'),nlapiStringToDate(dateto));
			}
			if((f1==0)&&(f2==0)&&(f3==1)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),new Date());
			}
			if((f1==0)&&(f2==1)&&(f3==1)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),nlapiStringToDate(dateto));
				filter[5] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}
			if((f1==1)&&(f2==0)&&(f3==1)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),new Date());
				filter[6] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}
			if((f1==1)&&(f2==1)&&(f3==0) &&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate('01/01/1900'),nlapiStringToDate(dateto));
				filter[6] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}
			if((f1==1)&&(f2==1)&&(f3==1)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),nlapiStringToDate(dateto));
				filter[6] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}

			if((f1==1)&&(f2==1)&&(f3==1)&&(f5==1))
			{
				filter[4] = new nlobjSearchFilter('entity',null,'anyof',vendor);
				filter[5] = new nlobjSearchFilter('trandate',null,'within',nlapiStringToDate(datefrom),nlapiStringToDate(dateto));
				filter[6] = new nlobjSearchFilter('subsidiary',null,'anyof',subid);
			}

			if(f4 != 0)
			{
				if((filter[4]=='')||(filter[4]==null))
				{
					filter[4] = new nlobjSearchFilter('tranid',null,'haskeywords',invoice);
				}
				else if((filter[5]=='')||(filter[5]==null))
				{
					filter[5] = new nlobjSearchFilter('tranid',null,'haskeywords',invoice);
				}
				else if((filter[6]=='')||(filter[6]==null))
				{
					filter[6] = new nlobjSearchFilter('tranid',null,'haskeywords',invoice);
				}
				else
				{
					filter[7] = new nlobjSearchFilter('tranid',null,'haskeywords',invoice);
				}
			}
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('trandate');
			columns[1] = new nlobjSearchColumn('transactionnumber');
			columns[2] = new nlobjSearchColumn('entity');
			columns[3] = new nlobjSearchColumn('memo');
			columns[4] = new nlobjSearchColumn('approvalstatus');
			columns[5] = new nlobjSearchColumn('fxamount');
			columns[6] = new nlobjSearchColumn('item');
			columns[7] = new nlobjSearchColumn('account','expensecategory');
			columns[8] = new nlobjSearchColumn('createdby');
			columns[9] = new nlobjSearchColumn('location');
			columns[10] = new nlobjSearchColumn('department');
			columns[11] = new nlobjSearchColumn('class');
			columns[12] = new nlobjSearchColumn('account');
			columns[13] = new nlobjSearchColumn('terms');
			columns[14] = new nlobjSearchColumn('revrecstartdate');
			columns[15] = new nlobjSearchColumn('revrecenddate');
			columns[16]= new nlobjSearchColumn('schedulenumber','amortizationschedule');
			columns[17] = new nlobjSearchColumn('duedate');
			//columns[17].setSort();
			columns[18] = new nlobjSearchColumn('tranid');
			columns[19] = new nlobjSearchColumn('internalid');
			columns[20] = new nlobjSearchColumn('custbody_spk_billreceiveddate');
			var searchresults = nlapiSearchRecord('vendorbill',null,filter,columns); // Searches for bills pending user's approval. 

			if(searchresults)
			{
				nlapiLogExecution('DEBUG','Z',1);
				//AP Approval Phase 2 : Start New script for Due Date sorting
				var da = new Array();
				for(var x in searchresults)
				{
					nlapiLogExecution('DEBUG','Z','x ' + x);
					if((searchresults[x].getValue('duedate')==null)||(searchresults[x].getValue('duedate')==''))
					{
						da.push(da[x-1]);
					}
					else
					{
						da.push((searchresults[x].getValue('duedate')).toString());
					}
				}
				var sv = new Array();
				nlapiLogExecution('DEBUG','Z','agp');
				for(var y in searchresults)
				{

					ress = searchresults[y];
					sv.push([ress.getValue('internalid'),ress.getValue('trandate'),nlapiStringToDate(da[y]),ress.getValue('tranid'),ress.getValue('transactionnumber'),ress.getText('entity'),ress.getValue('fxamount'),ress.getText('approvalstatus'),ress.getValue('memo'),ress.getText('item'),ress.getValue('revrecenddate'),ress.getValue('revrecstartdate'),ress.getValue('schedulenumber','amortizationschedule'),ress.getText('account','expensecategory'),ress.getText('account'),ress.getText('createdby'),ress.getText('location'),ress.getText('department'),ress.getText('class'),ress.getText('terms'),ress.getValue('custbody_spk_billreceiveddate')]);
				}
				sv.sort(function (a,b) {
					if (a[2] < b[2]) return  -1;
					if (a[2] > b[2]) return 1;
					return 0;
				});
				sv.sort(function (a,b) {
					if (a[2] < b[2]) return  -1;
					if (a[2] > b[2]) return 1;
					return 0;
				});
				nlapiLogExecution('DEBUG','Z','y');
				nlapiLogExecution('DEBUG','Z','Z');
				//AP Approval Phase 2 : End New script for Due Date sorting
				nlapiLogExecution('DEBUG','A',4);
				var length = searchresults.length;
				var s_length = 10;
				var x = 10;
				var g = 0;
				if(pagenum)
				{
					pagenum = parseInt(pagenum);
					s_length = pagenum;
					g = pagenum - x;
					if(g < 0)
					{
						g = 0;
						if(length > 10)
						{
							s_length = 10;
						}
					}
				}
				if(length <= 10)
				{
					selectPage.addSelectOption('0', '1 to '+length+' of '+length+'',true);
					s_length = length;
					g = 0;
				}
				else
				{
					var n = 1;
					var pr_value = '';
					selectPage.addSelectOption('0', '1 to '+x+' of '+length+'');

					while(x < length)
					{
						var chk = x;
						pr_value = parseInt(x) + 1;
						x = parseInt(x) + 10;
						var len = length - x;
						if(len < 10 && x > length)
						{
							x = length;
						}
						if(x == pagenum)
						{
							selectPage.addSelectOption(''+n+'', ''+pr_value+' to '+x+' of '+length+'',true);
							g = chk;
						}
						else
							selectPage.addSelectOption(''+n+'', ''+pr_value+' to '+x+' of '+length+'');
						n++;
					}
				}
				var i = 1;
				try
				{
					var prvdue = '';
					for(var k=g; k < s_length; k++)
					{
						//populating the grid with bill details.

						var id = sv[k][0];

						var rectype = 'vendorbill';
						var date = sv[k][1];
						nlapiLogExecution('DEBUG','MYVAL',sv[k][2]);
						var duedate = nlapiDateToString(sv[k][2]);

						var tranid = sv[k][3];
						var ponumber = sv[k][4];
						var names = sv[k][5];
						var Amount = sv[k][6];
						var status = sv[k][7];
						var memo = sv[k][8];
						var item = sv[k][9];
						var ed = sv[k][10];
						var sd = sv[k][11];
						var an = sv[k][12];
						var acc = sv[k][13];

						var rurl = nlapiResolveURL('RECORD','vendorbill',id);
						var url = '<a href ="'+rurl+'&whence=">'+date+'</a>';
						sublis.setLineItemValue('trandate',i,url);
						sublis.setLineItemValue('internalid',i,id);
						sublis.setLineItemValue('tranid',i,tranid);
						sublis.setLineItemValue('number',i,ponumber);
						sublis.setLineItemValue('name',i,names);
						if((names!=null)&&(names!=''))
						{
							sublis.setLineItemValue('headerorline',i,'Header');
							sublis.setLineItemValue('duedate',i,duedate);
							sublis.setLineItemValue('lnh',i,'T');
							sublis.setLineItemValue('brd',i,sv[k][20]);
						}
						else
						{
							sublis.setLineItemValue('headerorline',i,'Line');
							sublis.setLineItemValue('duedate',i,'');
							sublis.setLineItemValue('lnh',i,'F');
							sublis.setLineItemValue('brd',i,'');
						}
						sublis.setLineItemValue('amount',i,Amount);
						var cd = nlapiDateToString(new Date(),'MM/DD/YYYY');
						if((nlapiStringToDate(date)!=null)&&(nlapiStringToDate(date)!=null))
						{
							var daysopen = GetDiff(nlapiStringToDate(date),nlapiStringToDate(cd));
						}
						if((nlapiStringToDate(duedate)!=null)&&(nlapiStringToDate(duedate)!=null))
						{
							if(nlapiStringToDate(duedate) < nlapiStringToDate(cd))
							{
								sublis.setLineItemValue('daysoverdue',i,GetDiff(nlapiStringToDate(duedate),nlapiStringToDate(cd)));
							}
						}
						sublis.setLineItemValue('daysopen',i,daysopen);
						sublis.setLineItemValue('approvalstatus',i,status);

						var memoo = memo.split(' ');
						var memolen = '';
						var e = 1;
						if(memoo.length > 10)
						{
							for(var j = 0; j < memoo.length; j++)
							{
								memolen += memoo[j];
								e++;
								if(e == 10)
								{
									memolen += "\n";
									e = 0;
								}
							}
							memo = memolen;
						}
						sublis.setLineItemValue('memo',i,memo);
						if((mv != 'y')&&(mv != 'Y'))
						{
							sublis.setLineItemValue('item',i,item);
							sublis.setLineItemValue('amortschedule',i,an);
							sublis.setLineItemValue('amortstart',i,sd);
							sublis.setLineItemValue('amortend',i,ed);
							if((item==null)||(item==''))
							{
								if((acc!=null)&&(acc!=''))
								{
									sublis.setLineItemValue('account',i,acc);
									sublis.setLineItemValue('amortschedule',i,an);
									sublis.setLineItemValue('amortstart',i,sd);
									sublis.setLineItemValue('amortend',i,ed);

								}
								else
								{
									sublis.setLineItemValue('account',i,sv[k][14]);

								}
							}
							else
							{

								sublis.setLineItemValue('name',i,'');
								sublis.setLineItemValue('headerorline',i,'Line');
								sublis.setLineItemValue('duedate',i,'');

								sublis.setLineItemValue('lnh',i,'F');
								sublis.setLineItemValue('brd',i,'');
							}
							sublis.setLineItemValue('employee',i,sv[k][15]);
							sublis.setLineItemValue('location',i,sv[k][16]);
							sublis.setLineItemValue('department',i,sv[k][17]);
							sublis.setLineItemValue('class',i,sv[k][18]);
							sublis.setLineItemValue('terms',i,sv[k][19]);
						}
						i++;
					}
				}
				catch(e)
				{
					if (e instanceof nlobjError)
					{
						nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails());
						nlapiSetRedirectURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove',null,null); // changed param to nul
					}
					else
					{
						nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString());
						nlapiSetRedirectURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove',null,null); // changed param to nul
					}
				}
			}
			form.addSubmitButton('Approve');                       
			form.addButton('custpage_reset','Reset','Reset();');     
			form.addButton('custpage_Search', 'Search','Search();');
			response.writePage(form);
		}
		else if(request.getParameter('ref'))
		{
			successForm(request.getParameter('ref'),request.getParameter('val'));
		}
		else
		{
			var mess = '';
			if(errorms.search(',')>0)
			{
				mess = "The bills- " + errorms + " require Board of Director approval. Once approval is received, please mark it complete by selecting the 'Board of Director Approval' check box & then approve the bills." ;
			}
			else
			{
				mess = "The Bill- " + errorms + " requires Board of Director approval. Once approval is received, please mark it complete by selecting the 'Board of Director Approval' check box & then approve the bill." ;
			}
			var form = nlapiCreateForm('Board of Director Approval Required');
			var field = form.addField('textfield','inlinehtml', '').setDefaultValue(mess);
			var rrurl = reqUrl + nlapiResolveURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove');
			var reverseurl = '<a href ="'+rrurl+'&whence=">'+'Return to Mass Approval page' +'</a>';
			nlapiLogExecution('DEBUG','BOD',reverseurl);
			form.addField("enterempslink", "inlinehtml", '').setDefaultValue(reverseurl);

			response.writePage( form );
		}
	}
	else
	{

		var amount_BOD = nlapiGetContext().getSetting('SCRIPT', 'custscript_amount_bod_approval');
		var context = nlapiGetContext();             
		var userRole = context.getRole();
		nlapiLogExecution('DEBUG','ROLEB',userRole);
		userRole = nlapiGetRole(); // Getting the user current role
		nlapiLogExecution('DEBUG','ROLEA',userRole);
		var currentUser = context.getUser(); 
		nlapiLogExecution('DEBUG','User',currentUser);
		var error = ''; 
		var flagp = false; 
		var ids = new Array();
		var is = 0;
		var idss = new Array();
		var iss = 0;
		var flagvals = false;
		var count = request.getLineItemCount('custpage_sublist');
		if(count > 0)
		{
			var internalIds = '';
			var prm = new Array();
			prm['agp'] = '';
			var idarray = new Array();

			for(var i=1;i<parseInt(count)+1;i++)
			{
				if((request.getLineItemValue('custpage_sublist','venapprove',i)=='T')&&(idarray.indexOf(request.getLineItemValue('custpage_sublist','internalid',i))==-1))
				{

					idarray.push(request.getLineItemValue('custpage_sublist','internalid',i));

					prm['custscript_invn'] = prm['custscript_invn'] + ','+ request.getLineItemValue('custpage_sublist','internalid',i);

					ids[is] = request.getLineItemValue('custpage_sublist','internalid',i);
					is = parseInt(is) + 1;

					flagvals = true;
				}
			}

			if((flagvals == true) &&(ids.length > 10))
			{

				nlapiLogExecution('DEBUG','AAGGPP',agp);

				var tracker = nlapiCreateRecord('customrecord_matracker');
				tracker.setFieldValue('custrecord_internalids',prm['custscript_invn'].toString());
				tracker.setFieldValue('custrecord_approvednum',0);
				tracker.setFieldValue('custrecord_recnum',prm['custscript_invn'].toString().split(',').length-1);
				var rr = nlapiSubmitRecord(tracker);
				prm['custscript_invn'] = prm['custscript_invn'] + ','+rr +','+userRole+','+currentUser;
				var agp = nlapiScheduleScript('customscript_spk_approval_sc', 'customdeploy_massapproval_sc', prm);
				successForm(rr,'Please wait.');
			}
			else if((flagvals == true) &&(ids.length < 11))
			{

				for(var v in ids)
				{

					flagp = false; 
					var vbId = ids[v];
					var currentRec = nlapiLoadRecord('vendorbill', vbId);
					var invapr = currentRec.getFieldValue('custbody_spk_inv_apvr');
					if(currentUser == invapr)
					{
						var period = currentRec.getFieldText('postingperiod');   // Getting the posting period
						var periodintid = currentRec.getFieldValue('postingperiod');
						var cdate1 = new Date();
						var year = cdate1.getFullYear();
						var tranid = currentRec.getFieldValue('tranid');
						var bodApp = currentRec.getFieldValue('custbody_spk_inv_bod_apvr');
						var poId = currentRec.getFieldValue('custbody_spk_poid');
						var vbillAmount = parseFloat(currentRec.getFieldValue('custbody_spk_inv_converted_amt'));
						if(vbillAmount > amount_BOD && !poId && bodApp == 'F')
						{
							flagp = true;
						}

						var owner = currentRec.getFieldValue('custbody_spk_inv_owner');
						var custVbId = currentRec.getFieldValue('custbody_spk_vd_id');

						var lineCount = 0;
						var approvalDate = new Date();
						var apprvlDate = nlapiDateToString(approvalDate, 'datetimetz');
						// Getting the count of line items of the vendor bill
						var countr = currentRec.getLineItemCount('recmachcustrecord_spk_apvmtx_tranno');

						if(countr >0)

						{
							for(var ri=1;ri<parseInt(countr) + 1;ri++)

							{

								// Fetching status of each record one by one
								var status = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',ri);
								if(status == '4' || status == '3') // If status is "Pending Approval" or "Rejected".
								{
									// Setting the Approval Date and Approval Status
									currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',ri,apprvlDate);
									currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',ri,'2');
									lineCount = ri;
									if(ri<countr)
									{

										// Setting the Approval Date and Approval Status
										currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_reqdt',ri+1,apprvlDate);
										currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',ri+1,'4');
										var nextApprover = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvr',ri+1);
										currentRec.setFieldValue('custbody_spk_inv_apvr',nextApprover);
										currentRec.setFieldValue('approvalstatus','1');
										//*** Start setting the invoice approver field on custom vendor bill
										if(custVbId)
										{

											var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'1']);

										}
										var recId = nlapiSubmitRecord(currentRec,true,true); // Submitting the record after updating the fields.

										// Triggering workflow for sending the mails.
										nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',lineCount), 'customworkflow_spk_ap_inv_apv_ntfcn');
										nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',parseInt(lineCount)+1), 'customworkflow_spk_ap_inv_apv_ntfcn');
										break;
									}
									else
									{
										if(flagp == false)
										{

											// After Final Approval the approval status is set to "Approved" and "Fully Approved" as Next Approver. 
											currentRec.setFieldValue('approvalstatus','2');
											currentRec.setFieldValue('custbody_spk_inv_apvr',finalApprover);
											currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvdt',ri,apprvlDate);
											currentRec.setLineItemValue('recmachcustrecord_spk_apvmtx_tranno','custrecord_spk_apvmtx_apvstatus',ri,'2');
											if(custVbId)
											{
												var customVbId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,['custrecord_spk_vb_approver','custrecord_spk_vb_approvalstatus'],[nextApprover,'2']);

											}
											// Triggering workflow for sending the mails.
											//Start HERE
											/*********** Below search filter used to check user has Override Period Restrictions or not ************/                                                                                                                
											// Creating dynamic search to look for employee with Override Period Restrictions permission
											var filter = new Array();
											filter[0] = new nlobjSearchFilter('permission','role','anyof','ADMI_PERIODOVERRIDE'); // ADMI_PERIODOVERRIDE = Override Period Restrictions
											filter[1] = new nlobjSearchFilter('role',null,'anyof',userRole);
											filter[2] = new nlobjSearchFilter('internalid',null,'anyof',currentUser);
											filter[3] = new nlobjSearchFilter('level',null,'anyof',4);                   
											var result = nlapiSearchRecord('employee',null,filter);                                                                                                                   
											if(!result)
											{
												nlapiLogExecution('DEBUG', 'result not exist', 'null');
												getperiodofSubsidiary(currentRec,year,period,custVbId,periodintid); // calling function
											}
											else
											{
												if(custVbId)
												{
													var custId = nlapiSubmitField('customrecord_spk_vendorbill',custVbId,'custrecord_spk_vb_postingperiod',currentRec.getFieldValue('postingperiod'));
												}
												nlapiLogExecution('DEBUG', 'result'+result.length,'custId is'+custId);
											}
											//End HERE GL
											var vbRecId = nlapiSubmitRecord(currentRec,true,true); // Submitting the record after updating the fields.
											var custRecordId = currentRec.getLineItemValue('recmachcustrecord_spk_apvmtx_tranno','id',ri);

											nlapiInitiateWorkflow('customrecord_spk_inv_apvmtx', custRecordId, 'customworkflow_spk_ap_inv_apv_ntfcn');
										}
										else
										{
											if((error == '')||(error == ''))
											{
												error = tranid;
											}
											else
											{
												error = error + ', ' + tranid;
											}
											nlapiLogExecution('DEBUG','AGPBODER',error);
										}
									}
								}
							}
						}

					}

				}

				if((error == '')||(error == null))
				{
					var link = request.getParameter('custpage_link');


					try
					{
						var params = new Array();
						params['vendor'] = link.split('&vendor=')[1].split('&dateto=')[0];

						params['dateto'] = link.split('&dateto=')[1].split('&datefrom=')[0];

						params['datefrom'] = link.split('&datefrom=')[1].split('&subsidiary=')[0];

						params['vendor'] = link.split('&subsidiary=')[1].split('&main=')[0];

						params['main'] = 'f';

						params['invoice'] = link.split('&invoice=')[1].split('&pagenum=')[0];


						params['pagenum'] = '';

						var context = nlapiGetContext();
						var usageRemaining = context.getRemainingUsage();
						nlapiLogExecution('DEBUG','USAGE',usageRemaining);
						nlapiSetRedirectURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove',null,null); // changed param to null
					}
					catch(e)
					{

						var params = new Array();

						params['vendor'] = 'x';

						params['dateto'] = 'x';

						params['datefrom'] = 'x';

						params['subsidiary'] = 'x';

						params['main'] = 'f';

						params['invoice'] = '';

						params['pagenum'] = '';
						var context = nlapiGetContext();
						var usageRemaining = context.getRemainingUsage();
						nlapiLogExecution('DEBUG','USAGE',usageRemaining);
						if (e instanceof nlobjError)
						{
							nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails());
							nlapiSetRedirectURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove',null,null); // changed param to nul
						}
						else
						{
							nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString());
							nlapiSetRedirectURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove',null,null); // changed param to nul
						}
					}
				}
				else
				{
					var mess = '';
					if(error.search(',')>0)
					{
						mess = "The bills- " + error + " require Board of Director approval. Once approval received, please mark it complete by selecting the 'Board of Director Approval' check box & then approve the bills." ;
					}
					else
					{
						mess = "The Bill- " + error + " requires Board of Director approval. Once approval received, please mark it complete by selecting the 'Board of Director Approval' check box & then approve the bill." ;
					}


					var form = nlapiCreateForm('Board of Director Approval Required');
					var field = form.addField('textfield','inlinehtml', '').setDefaultValue(mess);
					var context = nlapiGetContext();
					var usageRemaining = context.getRemainingUsage();
					nlapiLogExecution('DEBUG','USAGE',usageRemaining);

					var rrurl = reqUrl + nlapiResolveURL('SUITELET','customscript_spk_apinvoice_massapproval','customdeploy_spk_apinvoice_massapprove');

					var reverseurl = '<a href ="'+rrurl+'&whence=">'+'Return to Mass Approval page' +'</a>';

					nlapiLogExecution('DEBUG','BOD',reverseurl);
					form.addField("enterempslink", "inlinehtml", '').setDefaultValue(reverseurl);



					response.writePage( form );
				}
			}
		}
	}
}


function GetDiff(x,y)
{
	var one_day=1000*60*60*24;
	var date1_ms = x.getTime();
	var date2_ms = y.getTime();
	var difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms/one_day); 
}

/* Below function creates the waiting page*/
function successForm(rr,val)
{

	var form = nlapiCreateForm("Approval Process In Progress");
	form.setScript('customscript_mass_client_support');

	form.addField("message", "inlinehtml", '');
	form.addField("enterempslink", "inlinehtml", '');
	form.addField("internalidrec", "inlinehtml", '').setDisplayType('hidden').setDefaultValue(rr);

	form.addField("wait", "inlinehtml", '').setDefaultValue(' ');
	var html = '<p style="color:red; font-size:12px; font-weight:bold;">Please do not refresh or leave this page. You will be redirected to Mass Approval page once all the selected AP Invoices are processed. </p>';
	form.addField("stop", "inlinehtml", '').setDefaultValue(html);

	response.writePage(form);
}

/*This function gets the appropriate posting period depending on the role of the user*/
function getperiod(rec,year,period,custVbId)
{
	var filter = new Array();
	var column = new Array();
	filter[0] = new nlobjSearchFilter('periodname',null,'is',period);
	filter[1] = new nlobjSearchFilter('aplocked',null,'is','F');
	column[0] = new nlobjSearchColumn('internalid');
	var result = nlapiSearchRecord('accountingperiod',null,filter, column);
	if(result)
	{                             
		var intid = result[0];
		var id = intid.getValue('internalid');
		nlapiLogExecution('DEBUG', 'id', id);
		if(custVbId)
		{
			nlapiSubmitField('customrecord_spk_vendorbill',custVbId,'custrecord_spk_vb_postingperiod',id);
		}
		rec.setFieldValue('postingperiod',id);                    
	}
	else
	{                                                             
		var txtPeriod = period.split(' ');                                                                 
		var monthIndex = monthNames.indexOf(txtPeriod[0]);               
		monthIndex = monthIndex + 1;               
		nlapiLogExecution('DEBUG', 'monthIndex', monthIndex +'monthNames[monthIndex]'+ monthNames[monthIndex]);
		if(monthIndex == 12)
		{
			monthIndex = 0;
		}
		var periodname = monthNames[monthIndex] +' '+ year;
		//var periodinternalid = parseInt(perintid) + parseInt(1);
		nlapiLogExecution('DEBUG', 'periodname', periodname);
		//nlapiLogExecution('DEBUG', 'periodinternalid', periodinternalid);
		getperiod(rec,year,periodname,custVbId,periodinternalid);                        
	}             
}
/*This function gets the appropriate posting period depending on the role of the user*/
function getperiodofSubsidiary(rec,year,period,custVBId,perintid)
{
	/**** Creating search for finding the open posting period ****/
	var istrue = 0;
	var subsidiary = rec.getFieldValue('subsidiary');
	nlapiLogExecution('DEBUG', 'year '+year, ' period '+ period+' subsidiary '+subsidiary+' PeriodIntid '+perintid);
	var filter = new Array();
	var column = new Array();
	filter[0] = new nlobjSearchFilter('subsidiary',null,'anyof',subsidiary);
	//filter[1] = new nlobjSearchFilter('periodname','accountingperiod','is',period);
	filter[1] = new nlobjSearchFilter('internalid',null,'is',perintid);
	filter[2] = new nlobjSearchFilter('inprogress',null,'is','F');
	column[0] = new nlobjSearchColumn('internalid');
	var result = nlapiSearchRecord(null,'customsearch_spk_periodsubsidiarysearc_3',filter, column);
	if(result) {
		for(var x=0; x<result.length;x++) {
			var intid = result[x];
			var id = intid.getValue('internalid');
			nlapiLogExecution('DEBUG', 'AccountPeriod id '+id,'result '+result.length);

			var filter1 = new Array();
			var column1 = new Array();

			filter1[0] = new nlobjSearchFilter('internalid',null,'anyof',id);
			column1[0] = new nlobjSearchColumn('internalid');
			var Accresult = nlapiSearchRecord('accountingperiod',null,filter1, column1);
			if(Accresult) {
				var accid = Accresult[0].getValue('internalid');
				nlapiLogExecution('DEBUG', 'accid '+accid,' Accresult '+Accresult.length);
				if(custVBId) {
					nlapiSubmitField('customrecord_spk_vendorbill',custVBId,'custrecord_spk_vb_postingperiod',accid);
				}
				rec.setFieldValue('postingperiod',accid); 	// Setting of the posting period in bill record.
				istrue = 1;
			}
		}
	}
	if(istrue == 0) {			
		
		var txtPeriod = period.split(' ');					
		var monthIndex = monthNames.indexOf(txtPeriod[0]);	
//		Added line of code logic for year captured from Posting period name due to the issue with Vendor Bill Posting for 2016 (INC0090657) ie was due to current system year	: Begin	
		year = parseInt(txtPeriod[1]);
		//END		
		monthIndex = monthIndex + 1;
		nlapiLogExecution('DEBUG', 'monthIndex', monthIndex +'monthNames[monthIndex]'+ monthNames[monthIndex]+' year  '+year); 
		if(monthIndex == 12)
		{
			monthIndex = 0;
			year = parseInt(year+1);
		}
		var periodname = monthNames[monthIndex] +' '+ year;
		var periodinternalid = parseInt(perintid) + parseInt(1);
		nlapiLogExecution('DEBUG', 'periodname', periodname); 
		nlapiLogExecution('DEBUG', 'periodinternalid', periodinternalid);
		getperiodofSubsidiary(rec,year,periodname,custVBId,periodinternalid);		
	}	
}


function sortFunction(a, b) {
	if (a[2] === b[2]) {
		return 0;
	}
	else {
		return (a[2] < b[2]) ? -1 : 1;
	}
}