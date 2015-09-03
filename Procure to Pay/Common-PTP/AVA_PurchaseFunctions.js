/******************************************************************************************************
	Script Name  - AVA_PurchaseFunctions.js
	Company      - Avalara Technologies Pvt Ltd.
*******************************************************************************************************/

/******************************************************************************************************/
/* Global Values Decalartion */
/******************************************************************************************************/
{
	var ResponseLineArray;
	var JournalEntryId, VendorValues;
	var ExpenseItemFlag = 'F'; // Flag to identify if there is atleast an item existing in the tab.
}
/******************************************************************************************************/

function AVA_PurchaseTransactionTabBeforeLoad(type, form)
{
	var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	
	if(AVA_ExecutionContext == 'userinterface')
	{
		var VerifyCredentials = AVA_VerifyCredentials();
		form.setScript('customscript_avapurchase_client');
		
		form.addField('custpage_ava_readconfig','longtext','ConfigRecord');
		form.getField('custpage_ava_readconfig').setDisplayType('hidden');
		
		if(VerifyCredentials == 0)
		{
			if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1)
			{
				var recordType = nlapiGetRecordType();
				if((recordType == 'purchaseorder' || recordType == 'vendorcredit' || recordType == 'vendorreturnauthorization') || (AVA_EnableBatchService == 'F' && form.getField('custbody_ava_accrueusetax') != null))
				{
					form.getField('custbody_ava_accrueusetax').setDisplayType('hidden');
				}
				
				if((recordType == 'vendorbill' || recordType == 'vendorcredit') && nlapiGetFieldValue('nexus_country') == 'US' && AVA_EnableUseTax == 'T')
				{
					form.addField('custpage_ava_context', 'text', 'AVA_ExecutionContext');
					form.getField('custpage_ava_context').setDisplayType('hidden');
					form.getField('custpage_ava_context').setDefaultValue(AVA_ExecutionContext);
					
					form.addField('custpage_ava_environment', 'text', 'AVA_Environment');
					form.getField('custpage_ava_environment').setDisplayType('hidden');
					form.getField('custpage_ava_environment').setDefaultValue(nlapiGetContext().getEnvironment());
					
					form.addField('custpage_ava_lineloc', 'checkbox', 'LineLoc');
					form.getField('custpage_ava_lineloc').setDisplayType('hidden');
					
					var DocLocation = 'F';
					
					// Update custpage_ava_lineloc based on form level fields rather than Preferences
					// Check Line level locations first
					
					if (nlapiGetLineItemField('item','location', 1) != null)
					{
						DocLocation = 'T'; //Line-level locations
						form.getField('custpage_ava_lineloc').setDefaultValue('T');
					}
	
					if (DocLocation == 'F')
					{
						if (form.getField('location') != null)
						{
							form.getField('custpage_ava_lineloc').setDefaultValue('F');
						}
						else
						{
							form.getField('custpage_ava_lineloc').setDefaultValue('F');
						}
					}
	
					form.addField('custpage_ava_taxcodestatus', 'integer', 'TaxCode Status');
					form.getField('custpage_ava_taxcodestatus').setDisplayType('hidden');
					form.getField('custpage_ava_taxcodestatus').setDefaultValue(0);
					
					form.addField('custpage_ava_headerid', 'integer', 'TaxHeader Id');
					form.getField('custpage_ava_headerid').setDisplayType('hidden');
					
					form.addField('custpage_ava_document', 'checkbox', 'AvaTax Document');
					form.getField('custpage_ava_document').setDisplayType('hidden');
					form.getField('custpage_ava_document').setDefaultValue('F');
					
					form.addField('custpage_ava_notemsg', 'longtext', 'Note Message');
					form.getField('custpage_ava_notemsg').setDisplayType('hidden');
					
					form.addField('custpage_ava_docstatus', 'text', 'Document Status');
					form.getField('custpage_ava_docstatus').setDisplayType('hidden');
					
					form.addField('custpage_ava_journalentryid', 'text', 'Journal Entry ID');
					form.getField('custpage_ava_journalentryid').setDisplayType('hidden');
					
					if(type == 'create' || type == 'edit' || type == 'copy')
					{
						form.addButton('custpage_ava_verfiytax', 'Verfiy Tax', "AVA_VerifyTax()");
						
						form.addField('custpage_ava_alllocations', 'longtext', 'All Locations');
						form.getField('custpage_ava_alllocations').setDisplayType('hidden');
						form.getField('custpage_ava_alllocations').setDefaultValue(AVA_GetAllLocations());
						
						form.addField('custpage_ava_vendorid', 'text', 'Vendor ID');
						form.getField('custpage_ava_vendorid').setDisplayType('hidden');
						
						if(nlapiGetFieldValue('entity') != null && nlapiGetFieldValue('entity').length > 0)
						{
							AVA_GetVendorDetails();
						}
					}
					
					form.addTab('custpage_avatab', 'AvaTax');
					
					form.addField('custpage_ava_accruedusetax', 'checkbox', 'Accrue Use Tax', null, 'custpage_avatab');
					if(type == 'create' || type == 'copy')
					{
						form.getField('custpage_ava_accruedusetax').setDisplayType('disabled');
					}
					form.addField('custpage_ava_avatax', 'currency', 'Tax Calculated By AvaTax', null, 'custpage_avatab').setDisplayType('inline');
					form.addField('custpage_ava_accruedtaxamount', 'currency', 'Accrued Tax Amount', null, 'custpage_avatab').setDisplayType('inline');
					
					if((type == 'edit') || (type == 'view') && nlapiGetRecordId() != null)
					{
						var cols = new Array();
						cols[0]  = new nlobjSearchColumn('custrecord_ava_docinternalid');  // NetSuite Document Internal Id
						cols[1]  = new nlobjSearchColumn('custrecord_ava_docno');          // NetSuite Document No
						cols[2]  = new nlobjSearchColumn('custrecord_ava_docdate');        // Transaction Date
						cols[3]  = new nlobjSearchColumn('custrecord_ava_docstatus');      // AvaTax Document Status
						cols[4]  = new nlobjSearchColumn('custrecord_ava_accruedusetax');  // Accrued Use Tax Flag
						cols[5]  = new nlobjSearchColumn('custrecord_avaaccruedtaxamt');   // Accrued Tax Amount
						cols[6]  = new nlobjSearchColumn('custrecord_ava_avatax');  	   // AvaTax
						cols[7]  = new nlobjSearchColumn('custrecord_ava_subid');          // Subsidiary ID
						cols[8]  = new nlobjSearchColumn('custrecord_ava_journalentryid'); // Journal Entry ID
						
						var filters = new Array();
						filters[0] = new nlobjSearchFilter('custrecord_ava_docinternalid', null, 'anyof', nlapiGetRecordId());
						
						var searchresult = nlapiSearchRecord('customrecord_avausetaxheaderdetails', null, filters, cols);

						for(var i=0; searchresult != null && i < searchresult.length; i++)
						{
							var recordid = searchresult[i].getValue('custrecord_ava_docinternalid');
							
							if(nlapiGetRecordId() == recordid)
							{
								form.getField('custpage_ava_docstatus').setDefaultValue(AVA_DocumentStatus(searchresult[i].getValue('custrecord_ava_docstatus')));
								form.getField('custpage_ava_accruedusetax').setDefaultValue(searchresult[i].getValue('custrecord_ava_accruedusetax'));
								form.getField('custpage_ava_avatax').setDefaultValue(parseFloat(searchresult[i].getValue('custrecord_ava_avatax')));
								form.getField('custpage_ava_accruedtaxamount').setDefaultValue(parseFloat(searchresult[i].getValue('custrecord_avaaccruedtaxamt')));
								form.getField('custpage_ava_journalentryid').setDefaultValue(searchresult[i].getValue('custrecord_ava_journalentryid'));
								form.getField('custpage_ava_headerid').setDefaultValue(searchresult[i].getId());
							}
						}
						
						var AVA_GlImpactList = form.addSubList ('custpage_avaglimpacttab', 'staticlist', 'GL Impact', 'custpage_avatab');
						
						AVA_GlImpactList.addField('custpage_ava_glaccount','text','Account');
						AVA_GlImpactList.addField('custpage_ava_debitamount','text','Debit');
						AVA_GlImpactList.addField('custpage_ava_creditamount','text','Credit');
						
						if(nlapiGetFieldValue('custpage_ava_journalentryid') != null && nlapiGetFieldValue('custpage_ava_journalentryid').length > 0)
						{
							var filters1 = new Array();
							filters1[0] = new nlobjSearchFilter('internalid', null, 'anyof', nlapiGetFieldValue('custpage_ava_journalentryid'));
							
							var search = nlapiSearchRecord('journalentry', null, filters1, null);
							if(search != null)
							{
								var record = nlapiLoadRecord('journalentry', nlapiGetFieldValue('custpage_ava_journalentryid'));
								if(record != null)
								{
									var DebitCreditField = (recordType == 'vendorbill') ? 'credit' : 'debit';
									var DebitCreditField1 = (recordType == 'vendorbill') ? 'debit' : 'credit';
									var DebitCreditField2 = (recordType == 'vendorbill') ? 'custpage_ava_creditamount' : 'custpage_ava_debitamount';
									var DebitCreditField3 = (recordType == 'vendorbill') ? 'custpage_ava_debitamount' : 'custpage_ava_creditamount';
									for(var i = 0; record.getLineItemCount('line') != null && i < record.getLineItemCount('line'); i++)
									{
										AVA_GlImpactList.setLineItemValue('custpage_ava_glaccount', i+1, record.getLineItemText('line', 'account', i+1));
										if(i == (record.getLineItemCount('line') - 1))
										{
											AVA_GlImpactList.setLineItemValue(DebitCreditField2, i+1, record.getLineItemValue('line', DebitCreditField, i+1));
										}
										else
										{
											AVA_GlImpactList.setLineItemValue(DebitCreditField3, i+1, record.getLineItemValue('line', DebitCreditField1, i+1));
										}
									}
								}
							}
						}
						
						var AVA_LogSubList = form.addSubList ('custpage_avanotestab', 'staticlist', 'Logs', 'custpage_avatab');
							
						AVA_LogSubList.addField('custpage_ava_datetime','text','Date');
			
						var AVA_AuthorList = AVA_LogSubList.addField('custpage_ava_author','select','Author','employee');
						AVA_AuthorList.setDisplayType('inline');
			
						AVA_LogSubList.addField('custpage_ava_title','text','Title');
						AVA_LogSubList.addField('custpage_ava_memo','textarea','Memo');
						
						var col = new Array();
						col[0]  = new nlobjSearchColumn('custrecord_ava_title');
						col[1]  = new nlobjSearchColumn('custrecord_ava_note');
						col[2]  = new nlobjSearchColumn('custrecord_ava_creationdatetime');
						col[3]  = new nlobjSearchColumn('custrecord_ava_author');
						
						var filter = new Array();
						filter[0] = new nlobjSearchFilter('custrecord_ava_transaction',  null, 'is',  nlapiGetRecordId());
						
						var searchResult1 = nlapiSearchRecord('customrecord_avatransactionlogs', null, filter, col);
						
						for(var j=0; searchResult1 != null && j < searchResult1.length; j++)
						{
							AVA_LogSubList.setLineItemValue('custpage_ava_datetime', j+1, searchResult1[j].getValue('custrecord_ava_creationdatetime'));
							AVA_LogSubList.setLineItemValue('custpage_ava_author', j+1, searchResult1[j].getValue('custrecord_ava_author'));
							AVA_LogSubList.setLineItemValue('custpage_ava_title', j+1, searchResult1[j].getValue('custrecord_ava_title'));
			
							if(searchResult1[j].getValue('custrecord_ava_note') != null && searchResult1[j].getValue('custrecord_ava_note').length > 175)
							{           
								var URL1 = nlapiResolveURL('SUITELET', 'customscript_avatransactionlog_suitelet', 'customdeploy_ava_transactionlog', false);
								URL1 = URL1 + '&noteid=' + searchResult1[j].getId();
								var FinalURL = '<a href="' + URL1 + '" target="_blank">more...</a>';
			
								AVA_LogSubList.setLineItemValue('custpage_ava_memo', j+1, searchResult1[j].getValue('custrecord_ava_note').substring(0, 175) + ' ' + FinalURL);
							}
							else
							{
								AVA_LogSubList.setLineItemValue('custpage_ava_memo', j+1, searchResult1[j].getValue('custrecord_ava_note'));
							}
						}
					}
				}
			}
		}
	}
}

function AVA_PurchaseTransactionTabAfterSubmit(type)
{
	AVA_ReadConfig('1');
	
	if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1)
	{
		if((nlapiGetRecordType() == 'vendorbill' || nlapiGetRecordType() == 'vendorcredit') && nlapiGetFieldValue('nexus_country') == 'US' && nlapiGetFieldValue('custpage_ava_context') == 'userinterface' && (AVA_EnableUseTax == 'T' || AVA_EnableUseTax == true))
		{
			var JournalEntryExist = 0;
			
			if(nlapiGetFieldValue('custpage_ava_document') == 'T')
			{
				AVA_UseTaxGetNSLines();
				AVA_UseTaxGetLocations();
				AVA_UseTaxItemsLines();

				if(nlapiGetFieldValue('custpage_ava_vendorid') != null && nlapiGetFieldValue('custpage_ava_vendorid').length > 0)
				{
					VendorValues = nlapiGetFieldValue('custpage_ava_vendorid').split('+');
				}
			}
			
			if(type == 'create')
			{
				if(nlapiGetFieldValue('custpage_ava_docstatus') != 'Cancelled')
				{
					if(nlapiGetFieldValue('custpage_ava_document') == 'T')
					{
						if(AVA_CalculateUseTax() == true)
						{
							var record = nlapiCreateRecord('customrecord_avausetaxheaderdetails');
							var JournalEntryRecord = nlapiCreateRecord('journalentry');
							
							AVA_UpdateGLAccounts(JournalEntryRecord);
							AVA_UpdateUseTaxHeaderRecord(record);
						}
						else
						{
							AVA_LogTaxResponse('T');
						}
					}
					else
					{
						var record = nlapiCreateRecord('customrecord_avausetaxheaderdetails');
						AVA_UpdateUseTaxHeaderRecord(record);
						AVA_LogTaxResponse('F');
					}
				}
			}
			else if(type == 'edit')
			{
				var filters1 = new Array();
				filters1[0] = new nlobjSearchFilter('mainline', null, 'is', 'T');
				filters1[1] = new nlobjSearchFilter('internalid', null, 'anyof', nlapiGetRecordId());
				filters1[2] = new nlobjSearchFilter('voided', null, 'is' ,'T');
				
				var search1 = nlapiSearchRecord(nlapiGetRecordType(), null, filters1, null);
				if(search1 != null)
				{
					var headerid = nlapiGetFieldValue('custpage_ava_headerid');
					if(headerid != null && headerid.length > 0 && nlapiGetFieldValue('custpage_ava_docstatus') != null && nlapiGetFieldValue('custpage_ava_docstatus').length > 0)
					{
						CancelType = 'DocVoided';
						CancelStatus = 'Cancelled';
						var CancelTax = AVA_CancelTax(CancelType);
						if(CancelTax == 0)
						{
							nlapiSubmitField('customrecord_avausetaxheaderdetails', headerid, 'custrecord_ava_docstatus', AVA_DocumentStatus(CancelStatus));
						}
						
						if(nlapiGetFieldValue('custpage_ava_journalentryid') != null && nlapiGetFieldValue('custpage_ava_journalentryid').length > 0)
						{
							nlapiDeleteRecord('journalentry', parseInt(nlapiGetFieldValue('custpage_ava_journalentryid')));
							nlapiSubmitField('customrecord_avausetaxheaderdetails', headerid, 'custrecord_ava_journalentryid', '');
						}
						
						//nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), 'custbody_ava_taxtotal', 0);
					}
				}
				else
				{

					if(nlapiGetFieldValue('custpage_ava_docstatus') != 'Cancelled')
					{
						if(nlapiGetFieldValue('custpage_ava_document') == 'T')
						{
							if(AVA_CalculateUseTax() == true)
							{
								if(nlapiGetFieldValue('custpage_ava_headerid') != null && nlapiGetFieldValue('custpage_ava_headerid').length > 0)
								{
									var record = nlapiLoadRecord('customrecord_avausetaxheaderdetails', nlapiGetFieldValue('custpage_ava_headerid'));
									
									if(record.getFieldValue('custrecord_ava_journalentryid') != null && record.getFieldValue('custrecord_ava_journalentryid') > 0)
									{
										var filters = new Array();
										filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', record.getFieldValue('custrecord_ava_journalentryid'));

										var search = nlapiSearchRecord('journalentry', null, filters, null);
										if(search != null)
										{
											nlapiDeleteRecord('journalentry', parseInt(nlapiGetFieldValue('custpage_ava_journalentryid')));
										}
										//var JournalEntryRecord = nlapiCreateRecord('journalentry');
										//JournalEntryExist = 1;
									}
									//else
									//{
										var JournalEntryRecord = nlapiCreateRecord('journalentry');
									//}
								}
								else
								{
									var record = nlapiCreateRecord('customrecord_avausetaxheaderdetails');
									var JournalEntryRecord = nlapiCreateRecord('journalentry');
								}
								
								AVA_UpdateGLAccounts(JournalEntryRecord);
								AVA_UpdateUseTaxHeaderRecord(record);
							}
							else
							{
								AVA_LogTaxResponse('T');
							}
						}
						else
						{
							if(nlapiGetFieldValue('custpage_ava_headerid') != null && nlapiGetFieldValue('custpage_ava_headerid').length > 0)
							{
								var record = nlapiLoadRecord('customrecord_avausetaxheaderdetails', nlapiGetFieldValue('custpage_ava_headerid'));
							}
							else
							{
								var record = nlapiCreateRecord('customrecord_avausetaxheaderdetails');
							}
							
							AVA_UpdateUseTaxHeaderRecord(record);
							AVA_LogTaxResponse('F');
						}
					}
				}
			}
			else if(type == 'delete')
			{
				if(nlapiGetFieldValue('custpage_ava_headerid') != null && nlapiGetFieldValue('custpage_ava_headerid').length > 0 && nlapiGetFieldValue('custpage_ava_docstatus') != null && nlapiGetFieldValue('custpage_ava_docstatus').length > 0)
				{
					CancelType = 'DocVoided';
					CancelStatus = 'Cancelled';
					var CancelTax = AVA_CancelTax(CancelType);
					if(CancelTax == 0)
					{
						nlapiSubmitField('customrecord_avausetaxheaderdetails', nlapiGetFieldValue('custpage_ava_headerid'), 'custrecord_ava_docstatus', AVA_DocumentStatus(CancelStatus));
					}
					
					if(nlapiGetFieldValue('custpage_ava_journalentryid') != null && nlapiGetFieldValue('custpage_ava_journalentryid').length > 0)
					{
						nlapiDeleteRecord('journalentry', parseInt(nlapiGetFieldValue('custpage_ava_journalentryid')));
						nlapiSubmitField('customrecord_avausetaxheaderdetails', nlapiGetFieldValue('custpage_ava_headerid'), 'custrecord_ava_journalentryid', '');
					}
				}
			}
		}
	}
}

function AVA_PurchaseTransactionSave()
{
	if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
	{
		AVA_LoadValuesFromField();
	}
	
	if(nlapiGetFieldValue('custpage_ava_vendorid') != null && nlapiGetFieldValue('custpage_ava_vendorid').length > 0)
	{
		VendorValues = nlapiGetFieldValue('custpage_ava_vendorid').split('+');
	}
	
	if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1 && (AVA_EnableUseTax == 'T' || AVA_EnableUseTax == true))
	{
		try
		{
			if(nlapiGetFieldValue('nexus_country') == 'US' && nlapiGetFieldValue('custpage_ava_context') == 'userinterface' && nlapiGetFieldValue('custpage_ava_docstatus') != 'Cancelled')
			{
				nlapiSetFieldValue('custpage_ava_taxcodestatus', '0');
				if(AVA_UseTaxRequiredFields() == 0)
				{
					AVA_UseTaxItemsLines();
					if(AVA_CalculateUseTax() == false)
					{
						AVA_LogTaxResponse('T');
					}
				}	
				else
				{
					if(AVA_ShowMessages == 1 || AVA_ShowMessages == 3)
					{
						alert("This Document has not used AvaTax Services for Tax Calculation. " + AVA_ErrorCodeDesc(AVA_ErrorCode));
					}

					AVA_LogTaxResponse('F');
					nlapiSetFieldValue('custpage_ava_document', 'F');
				}
			}
			
			nlapiSetFieldValue('custpage_ava_taxcodestatus', '1');
		}
		catch(err)
		{
			alert(err);
			nlapiSetFieldValue('custpage_ava_taxcodestatus', '0');
			return false;
		}
	}
	
	return true;
}

function AVA_PurchaseTransactionFieldChange(type, name)
{
	if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
	{
		AVA_LoadValuesFromField();
	}
	
	try
	{
		if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1)
		{
			if(name == 'entity')
			{
				if (nlapiGetFieldValue('entity') != null && nlapiGetFieldValue('entity').length > 0)
				{
					AVA_GetVendorDetails();
				}
				else
				{
					nlapiSetFieldValue('custpage_ava_vendorid', '');
				}
			}
		}
	}
	catch(err)
	{
		nlapiLogExecution('DEBUG', 'AVA_PurchaseTransactionFieldChange - Error', err.message);
	}
}

function AVA_GetVendorDetails()
{
	var cols = new Array();
	cols[cols.length] = new nlobjSearchColumn('isperson');
	cols[cols.length] = new nlobjSearchColumn('firstname');
	cols[cols.length] = new nlobjSearchColumn('middlename');
	cols[cols.length] = new nlobjSearchColumn('lastname');
	cols[cols.length] = new nlobjSearchColumn('companyname');
	cols[cols.length] = new nlobjSearchColumn('entityid');
	cols[cols.length] = new nlobjSearchColumn('vatregnumber');
	cols[cols.length] = new nlobjSearchColumn('shipaddress1');
	cols[cols.length] = new nlobjSearchColumn('shipaddress2');
	cols[cols.length] = new nlobjSearchColumn('shipcity');
	cols[cols.length] = new nlobjSearchColumn('shipstate');
	cols[cols.length] = new nlobjSearchColumn('shipzip');
	cols[cols.length] = new nlobjSearchColumn('shipcountrycode');
	cols[cols.length] = new nlobjSearchColumn('custentity_ava_usetaxassessment');
	
	var filters = new Array();
	filters[filters.length] = new nlobjSearchFilter('internalid', null, 'anyof', nlapiGetFieldValue('entity'));

	var searchResult = nlapiSearchRecord('vendor', null, filters, cols);
	if(searchResult != null && searchResult.length > 0)
	{
		var str = searchResult[0].getValue('isperson') + '+' + searchResult[0].getValue('firstname') + '+' + searchResult[0].getValue('middlename') + '+' + searchResult[0].getValue('lastname') + '+' + searchResult[0].getValue('companyname') + '+' + searchResult[0].getValue('entityid') + '+' + searchResult[0].getValue('vatregnumber') + '+';
		str += searchResult[0].getValue('shipaddress1') + '+' + searchResult[0].getValue('shipaddress2') + '+' + searchResult[0].getValue('shipcity') + '+' + searchResult[0].getValue('shipstate') + '+' + searchResult[0].getValue('shipzip') + '+' + searchResult[0].getValue('shipcountrycode') + '+' + searchResult[0].getValue('custentity_ava_usetaxassessment');
		nlapiSetFieldValue('custpage_ava_vendorid', str);
	}
}

function AVA_VerifyTax()
{
	nlapiSetFieldValue('custpage_ava_taxcodestatus', '0');
	nlapiSetFieldValue('custpage_ava_notemsg', '');
	
	if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
	{
		AVA_LoadValuesFromField();
	}
	
	if(nlapiGetFieldValue('custpage_ava_vendorid') != null && nlapiGetFieldValue('custpage_ava_vendorid').length > 0)
	{
		VendorValues = nlapiGetFieldValue('custpage_ava_vendorid').split('+');
	}
	
	if(AVA_UseTaxRequiredFields() == 0)
	{
		AVA_UseTaxItemsLines();
		AVA_CalculateUseTax();
	}	
	else
	{
		if(AVA_ShowMessages == 1 || AVA_ShowMessages == 3)
		{
			alert("This Document has not used AvaTax Services for Tax Calculation. " + AVA_ErrorCodeDesc(AVA_ErrorCode));
		}
	}
}

function AVA_UseTaxRequiredFields()
{
	// 1. Check if AvaTax is enabled
	if(AVA_DisableTax == 'T' || AVA_DisableTax == true)
	{
		AVA_ErrorCode = 1;
		return 1;
	}
	
	// 2. Check if UseTax is enabled
	if(AVA_EnableUseTax == 'F' || AVA_EnableUseTax == false)
	{
		AVA_ErrorCode = 28;
		return 1;
	}

	// 3. Check if the Environment is correct
	if(nlapiGetFieldValue('custpage_ava_environment') != 'PRODUCTION' && AVA_ServiceUrl.search('development') == -1)
	{
		AVA_ErrorCode = 19;
		return 1;
	}
	
	// 4. Check for Vendor
	if (nlapiGetFieldValue('entity') == null || nlapiGetFieldValue('entity').length == 0)
	{
		AVA_ErrorCode = 25;
		return 1;
	}
	
	// 5. Check if UseTax Assessment is enabled for Vendor
	if(VendorValues[13] == null || VendorValues[13] == 'F')
	{
		AVA_ErrorCode = 29;
		return 1;
	}
	
	// 6. Check if Lines exist
	if(nlapiGetFieldValue('haslines') == 'F')
	{
		AVA_ErrorCode = 2;
		return 1;
	}

	// 7. Check for VendorCode in AVACONFIG record
	if (AVA_VendorCode != null && AVA_VendorCode > 2)
	{
		AVA_ErrorCode = 26;
		return 1;
	}

	// 8. Check for Date
	if (nlapiGetFieldValue('trandate') == null || nlapiGetFieldValue('trandate').length == 0)
	{
		AVA_ErrorCode = 4;
		return 1;
	}
	
	AVA_UseTaxGetNSLines();
	
	AVA_UseTaxGetLocations();
	
	// 9. Check if Inventory Items Type exist
	var ItemsExist = 'F';
	for(var i =0; i< nlapiGetLineItemCount('item'); i++)
	{
		var LineType = nlapiGetLineItemValue('item','itemtype',i+1);
		switch(LineType)
		{
			case 'Discount':
			case 'Markup':
			case 'Description':
			case 'Subtotal':
			case 'Group':
			case 'EndGroup':
				break;

			default:
				ItemsExist = 'T';
				break;
		}
	}
	
	if(ItemsExist == 'F' && ExpenseItemFlag == 'F')
	{		
		AVA_ErrorCode = 15;
		return 1;
	}
	
	// 10. Check for Vendor's Tax amount
	/*if (nlapiGetFieldValue('custbody_ava_taxtotal') == null || nlapiGetFieldValue('custbody_ava_taxtotal').length == 0)
	{
		AVA_ErrorCode = 27;
		nlapiSetFieldValue('custpage_ava_document', 'F');
		return 1;
	}*/

	// 11. Check for Invalid DocType
	if(AVA_RecordType() == 0)
	{
		AVA_ErrorCode = 23;
		return 1;
	}
	
	return 0;
}

function AVA_UseTaxGetNSLines()
{
	var TabType;
	AVA_NS_Lines = new Array();
	
	ExpenseItemFlag = 'F';
	
	for(var tab = 0 ; tab < 2 ; tab++)
	{
		TabType = (tab == 0) ? 'item' : 'expense';
		
		for(var line = 0 ; line < nlapiGetLineItemCount(TabType) ; line++)
		{
			var ArrIndex = AVA_NS_Lines.length;						
			
			AVA_NS_Lines[ArrIndex] = new Array();
			AVA_NS_Lines[ArrIndex][0] = TabType;
			AVA_NS_Lines[ArrIndex][1] = parseFloat(line+1);
			
			if(TabType == 'expense')
			{
				ExpenseItemFlag = 'T';
			}
		}
	}
}

function AVA_UseTaxGetLocations()
{
	if(nlapiGetFieldValue('custpage_ava_lineloc') == 'F')
	{
		AVA_HeaderLocation = new Array();
		if(nlapiGetFieldValue('location') != null && nlapiGetFieldValue('location').length > 0)
		{
			AVA_HeaderLocation = AVA_GetAddresses(nlapiGetFieldValue('location'), 2);
		}
	}
	else
	{
		var TabType, TabCount;
		AVA_LocationArray = new Array();
		
		for(var line = 0 ; AVA_NS_Lines != null && line < AVA_NS_Lines.length ; line++)
		{

			var AVA_ExistFlag = 'F'; // Flag to check if an address already exists in the Location Array
			var AVA_LocArrIndex; // Index whose location details need to be copied into a different Array item
			var AVA_LocArrLen = (AVA_LocationArray != null) ? AVA_LocationArray.length : 0; //Length of Location Array
			var AVA_LocationID = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'location', AVA_NS_Lines[line][1]); // Location internal ID of a line item.
			
			// Loop to find if the current line location internal id exists in the location array						
			for(var locCtr = 0 ; locCtr < AVA_LocArrLen ; locCtr++)
			{
				if(AVA_LocationArray[locCtr][0] != null && AVA_LocationID == AVA_LocationArray[locCtr][0])
				{
					AVA_ExistFlag = 'T';
					AVA_LocArrIndex = locCtr;
					break;
				}
			}
			
			AVA_LocationArray[AVA_LocArrLen] = new Array();

			if(AVA_LocationID != null && AVA_LocationID.length > 0)
			{					
				AVA_LocationArray[AVA_LocArrLen][0] = AVA_LocationID;
									
				if(AVA_ExistFlag == 'T')
				{
					// Location Details exists in Location Array, so copy the details
					AVA_LocationArray[AVA_LocArrLen][1] = new Array();
					AVA_LocationArray[AVA_LocArrLen][1] = AVA_LocationArray[AVA_LocArrIndex][1];
				}
				else
				{
					AVA_LocationArray[AVA_LocArrLen][1] = new Array();
					AVA_LocationArray[AVA_LocArrLen][1] = AVA_GetAddresses(AVA_LocationID, 2);
				}
			}
			else
			{
				AVA_LocationArray[AVA_LocArrLen][0] = null;
				AVA_LocationArray[AVA_LocArrLen][1] = null;
			}
		}
	}
}

function AVA_UseTaxItemsLines()
{
	var prev_lineno =0;
	var Itemtype, Itemid, amount, cnt=0, cnt1=0;
	var AVA_ItemTaxable, AVA_GroupBegin, AVA_GroupStart, AVA_GroupEnd, TaxFlag;
	
	AVA_LineNames   = new Array(); // Stores the line names
	AVA_LineType    = new Array(); // Stores the Line Type
	AVA_LineAmount  = new Array(); // Stores the Line amounts 
	AVA_TaxLines    = new Array(); // Stores the value 'T' for Item Type and 'F' for Non-Item Type like discount, payment, markup, description, subtotal, groupbegin and endgroup
	AVA_Taxable     = new Array(); // Stores the value 'T' if line is taxable else 'F'
	AVA_LineQty     = new Array(); // Stores the Line Qty
	AVA_LineTab     = new Array(); // Stores the tab name to which the line item belongs
	AVA_LineNum     = new Array(); // Stores line number of items in each tab

	for(var i=0 ; i<nlapiGetLineItemCount('item') ; i++)
	{
		AVA_LineTab[i] = 'item';
		AVA_LineNum[i] = parseFloat(i+1);
		
		AVA_LineType[i]     = nlapiGetLineItemValue('item','itemtype',i+1);

		if(AVA_LineType[i] != 'EndGroup')
		{
			if(nlapiGetContext().getFeature('barcodes') == true && (AVA_EnableUpcCode == 'T' || AVA_EnableUpcCode == true) && (nlapiGetLineItemValue('item','custcol_ava_upccode',i+1) != null && nlapiGetLineItemValue('item','custcol_ava_upccode',i+1).length > 0))
			{
				AVA_LineNames[i]  =  'UPC:' + nlapiGetLineItemValue('item','custcol_ava_upccode',i+1).substring(0,45);
			}
			else
			{
				AVA_LineNames[i]  = (nlapiGetLineItemValue('item','custcol_ava_item',i+1) != null && nlapiGetLineItemValue('item','custcol_ava_item',i+1).length > 0) ? nlapiGetLineItemValue('item','custcol_ava_item',i+1).substring(0,49) : '';
			}
		}
		else
		{
			AVA_LineNames[i] = 'End Group';
		}

		if(AVA_LineType[i] == 'Payment')
		{
			AVA_LineQty[i] = 1;
		}
		else
		{
			AVA_LineQty[i] = nlapiGetLineItemValue('item','quantity',i+1);
		}
		
		AVA_LineAmount[i]     = nlapiGetLineItemValue('item','amount',i+1);
		
		if(i == (AVA_GroupBegin-1))
		{
			for(var k=i; k<=AVA_GroupEnd ; k++)
			{
				AVA_LineType[k]     = nlapiGetLineItemValue('item','itemtype',k+1);

				if(AVA_LineType[k] != 'EndGroup')
				{
					if(nlapiGetContext().getFeature('barcodes') == true && (AVA_EnableUpcCode == 'T' || AVA_EnableUpcCode == true) && (nlapiGetLineItemValue('item','custcol_ava_upccode',k+1) != null && nlapiGetLineItemValue('item','custcol_ava_upccode',k+1).length > 0))
					{
						AVA_LineNames[k]  =  'UPC:' + nlapiGetLineItemValue('item','custcol_ava_upccode',k+1).substring(0,45);
					}
					else
					{
						AVA_LineNames[k]  = (nlapiGetLineItemValue('item','custcol_ava_item',k+1) != null && nlapiGetLineItemValue('item','custcol_ava_item',k+1).length > 0) ? nlapiGetLineItemValue('item','custcol_ava_item',k+1).substring(0,49) : '';
					}
				}
				else
				{
					AVA_LineNames[k] = 'End Group';
				}
				
				if(AVA_LineType[k] == 'Payment')
				{
					AVA_LineQty[k] = 1;
				}
				else
				{
					AVA_LineQty[k] = nlapiGetLineItemValue('item','quantity',k+1);
				}
				
				AVA_LineAmount[k]     = nlapiGetLineItemValue('item','amount',k+1);
				
				switch(AVA_LineType[k])
				{
					case 'Discount':
					case 'Markup':
						AVA_TaxLines[k] = 'F';
						AVA_Taxable [k] = 'F';
						var discountItem = nlapiGetLineItemValue('item','amount',k+1);//here current lines discount is fetched
						if(discountItem.indexOf('%') != -1)
						{
							discountItem = discountItem.substring(0,discountItem.indexOf('%'));
						}
					
						if(discountItem != 0)
						{
							if(k==i)//when there is no preceeding Inv Item before a Discount item
							{
								AVA_LineQty[k] = 1;
								AVA_LineAmount[k] = discountItem;
								AVA_TaxLines[k] = 'T';//This section's discount will be sent as Line exempt
								
							}
							else
							{   
								var totallines = 0;
								for(var prev = k; AVA_LineType[prev] != 'InvtPart' && AVA_LineType[prev] != 'Subtotal' && AVA_LineType[prev] != 'Kit' && AVA_LineType[prev] != 'Assembly' && AVA_LineType[prev] != 'NonInvtPart' && AVA_LineType[prev] != 'OthCharge' && AVA_LineType[prev] != 'Service' && AVA_LineType[prev] != 'Group' && AVA_LineType[prev] != 'GiftCert' && AVA_LineType[prev] != 'DwnLdItem'; prev--); //searches for the preceeding Inv Item, subtotal or Kit item
								var prevItemAmt = AVA_LineAmount[prev];//this fetches the preceeding InvItem's amount
								AVA_LineAmount[k] = discountItem;
											
				
								if(AVA_LineType[prev] == 'Group')
								{
									AVA_LineQty[k] = 1;
									AVA_LineAmount[k] = discountItem;
									AVA_TaxLines[k]='T';
								}
								
								if((AVA_LineType[prev] == 'InvtPart' || AVA_LineType[prev] == 'Kit' || AVA_LineType[prev] == 'Assembly' || AVA_LineType[prev] == 'NonInvtPart' || AVA_LineType[prev] == 'OthCharge' || AVA_LineType[prev] == 'Service' || AVA_LineType[prev] == 'GiftCert' || AVA_LineType[prev] == 'DwnLdItem') && AVA_Taxable[prev] == 'T')//when the preceeding item is Inventory and is taxable
								{
									AVA_LineAmount[prev] = parseFloat(prevItemAmt) + parseFloat(discountItem);//as we wud hve set some value earlier for the Inv item, that's why when Discount is identified below it, the Inv item's amount is exchanged with the discounted amt
								}
								
								if((AVA_LineType[prev] == 'InvtPart' || AVA_LineType[prev] == 'Kit' || AVA_LineType[prev] == 'Assembly' || AVA_LineType[prev] == 'NonInvtPart' || AVA_LineType[prev] == 'OthCharge' || AVA_LineType[prev] == 'Service' || AVA_LineType[prev] == 'GiftCert' || AVA_LineType[prev] == 'DwnLdItem') && AVA_Taxable[prev] == 'F')//when the preceeding item is Inventory but is not taxable
								{
									AVA_LineQty[k] = 1;
									AVA_LineAmount[k] = discountItem;
									AVA_TaxLines[k]='T';
								}
								
								if(AVA_LineType[prev] == 'Subtotal')//when the preceeding item is a Subtotal item
								{
									var totalamt = 0;//to get total of all taxable items
									for(var j = prev-1; AVA_LineType[j] != 'Subtotal' && AVA_LineType[j] != 'Group' ; j--)//finds the last subtotal line, so that the discount can be divided among the taxable items which appears between these two subtotals   
									{
										if(AVA_LineType[j] != 'Description' && AVA_LineType[j] != 'Discount' && AVA_LineType[j] != 'Markup' && AVA_LineType[j] != 'Group' && AVA_LineType[j] != 'EndGroup' && AVA_LineType[j] != 'Subtotal')
										{
											var lineAmt = (AVA_LineAmount[j] == null || (AVA_LineAmount[j] != null && AVA_LineAmount[j].length == 0)) ? 0 : AVA_LineAmount[j];
											totalamt += parseFloat(lineAmt);
											totallines++;
										}
									}
									
									var totalDiscount = 0, lines = 1;
									for(j=j+1 ;j!=prev; j++)//to add part of discount to all taxable items which appears between two subtotal items(this doesn't include subtotal which appear in a group item)
									{
										if(AVA_LineType[j] != 'Description' && AVA_LineType[j] != 'Discount' && AVA_LineType[j] != 'Markup' && AVA_LineType[j] != 'Group' && AVA_LineType[j] != 'EndGroup' && AVA_LineType[j] != 'Subtotal')
										{
											var lineAmt = (AVA_LineAmount[j] == null || (AVA_LineAmount[j] != null && AVA_LineAmount[j].length == 0)) ? 0 : AVA_LineAmount[j];
											if(lines == totallines)
											{
												var discAmt = parseFloat(discountItem) + totalDiscount;
											}
											else
											{
												var discAmt = (parseFloat(discountItem / totalamt.toFixed(2)) * parseFloat(lineAmt));
											}
											AVA_LineAmount[j] = parseFloat(lineAmt) + parseFloat(discAmt);
											totalDiscount += (discAmt.toFixed(2) * -1);
											lines++;
										}
									}
	
									if(totallines == 0 )
									{
										AVA_LineQty[k] = 1;
										AVA_LineAmount[k] = discountItem;
										AVA_TaxLines[k]='T';
									}
								}     
							}
						}
						break;
						
					case 'Description': 
					case 'Subtotal':
						AVA_TaxLines[k] = 'F';
						break;
						
					case 'Payment':
						AVA_TaxLines[k] = 'T';
						AVA_Taxable[k] = 'F';
						break;
					
					case 'EndGroup':
						AVA_LineNames[k]  = 'EndGroup'
						AVA_LineType[k]   = 'EndGroup';
						AVA_LineAmount[k]   = nlapiGetLineItemValue('item','amount',k+1);
						AVA_TaxLines[k]   = 'F';
						AVA_Taxable[k]    = 'F';
						break;

					default:
						AVA_TaxLines[k] = 'T';
						//EndGroup Item from Webservice call
						if(nlapiGetLineItemValue('item','item',k+1) == 0)
						{
							AVA_LineNames[k]  = 'EndGroup'
							AVA_LineType[k]   = 'EndGroup';
							AVA_LineAmount[k]   = nlapiGetLineItemValue('item','amount',k+1);
							AVA_TaxLines[k] = 'F';
							AVA_Taxable[k]    = 'F';
						}	
						break;  
				}
			}
			i = k-1;//as i would be incremented when the loop ends, that's why deducted 1 so that i be equal to the End of Group line
		}
			
		switch(AVA_LineType[i])
		{
			case 'Discount':
			case 'Markup':
				var discountItem = nlapiGetLineItemValue('item','amount',i+1);//here current lines discount is fetched
				if(discountItem.indexOf('%') != -1)
				{
					discountItem = discountItem.substring(0,discountItem.indexOf('%'));
				}
				if(discountItem != 0)
				{
					if(i==0)
					{
						AVA_LineQty[i] = 1;
						AVA_LineAmount[i] = discountItem;
						AVA_TaxLines[i]='T';
					}
					else
					{ 
						var totallines = 0;
						AVA_TaxLines[i]='F';
						for(var prev = i-1; AVA_LineType[prev] != 'InvtPart' && AVA_LineType[prev] != 'EndGroup' && AVA_LineType[prev] != 'Subtotal' && AVA_LineType[prev] != 'Kit' && AVA_LineType[prev] != 'Assembly' && AVA_LineType[prev] != 'NonInvtPart' && AVA_LineType[prev] != 'OthCharge' && AVA_LineType[prev] != 'Service' && AVA_LineType[prev] != 'GiftCert' && AVA_LineType[prev] != 'DwnLdItem' && prev>=0; prev--);//checks whether the prev item is an Inv Item, a Group or a Subtotal  
								
						if(prev < 0)
						{
							AVA_LineQty[i] = 1;
							AVA_LineAmount[i] = discountItem;
							AVA_TaxLines[i]='T';
						}
						
						if(AVA_LineType[prev] == 'EndGroup')//if prev item is a Group item
						{ 
							var totalamt = 0; // this var will save the total of taxable items' amounts so that we can divide the discount amount proportionately
							for(var j = prev-1; AVA_LineType[j] != 'Group'; j--)//it finds the start of the Group
							{ 
								if(AVA_LineType[j] != 'Description' && AVA_LineType[j] != 'Discount' && AVA_LineType[j] != 'Markup' && AVA_LineType[j] != 'Group' && AVA_LineType[j] != 'EndGroup' && AVA_LineType[j] != 'Subtotal')
								{
									var lineAmt = (AVA_LineAmount[j] == null || (AVA_LineAmount[j] != null && AVA_LineAmount[j].length == 0)) ? 0 : AVA_LineAmount[j];
									totalamt += parseFloat(lineAmt);
									totallines++;
								}
							}
							
							var totalDiscount = 0, lines = 1;
							for(var m = j+1; m != prev; m++)
							{
								if(AVA_LineType[m] != 'Description' && AVA_LineType[m] != 'Discount' && AVA_LineType[m] != 'Markup' && AVA_LineType[m] != 'Group' && AVA_LineType[m] != 'EndGroup' && AVA_LineType[m] != 'Subtotal')
								{
									var lineAmt = (AVA_LineAmount[m] == null || (AVA_LineAmount[m] != null && AVA_LineAmount[m].length == 0)) ? 0 : AVA_LineAmount[m];
									if(lines == totallines)
									{
										var discAmt = parseFloat(discountItem) + totalDiscount;
									}
									else
									{
										var discAmt = (parseFloat(discountItem / totalamt.toFixed(2)) * parseFloat(lineAmt));
									}
									AVA_LineAmount[m] = parseFloat(lineAmt) + parseFloat(discAmt);
									totalDiscount += (discAmt.toFixed(2) * -1);
									lines++;
								}
							}
						}
							
						if(AVA_LineType[prev] == 'Subtotal')//if prev item is a Subtotal
						{
							var totalamt = 0;//to get total of all taxable items
							var groupFlag = 0;//to avoid those subtotal items which appear in a group item
							var subtotalFlag = 0;
							
							for(var j = prev-1; j>=0 ; j--)//finds the last subtotal line, so that the discount can be divided among the taxable items which appears between these two subtotals    
							{
								if(AVA_LineType[j] == 'EndGroup')
								{
									 groupFlag = 1; 
								}
								
								if(AVA_LineType[j] == 'Group')
								{
									 groupFlag = 0; 
								}
								
								if(AVA_LineType[j] == 'Subtotal' && groupFlag == 0)
								{
									if(subtotalFlag == 0)
									{
										for(var n = j-1; n >= 0 ; n--)
										{
											if(AVA_LineType[n] == 'EndGroup')
											{
												 groupFlag = 1; 
											}
											
											if(AVA_LineType[n] == 'Group')
											{
												 groupFlag = 0; 
											}
											
											if(AVA_LineType[n] != 'Description' && AVA_LineType[n] != 'Discount' && AVA_LineType[n] != 'Markup' && AVA_LineType[n] != 'Group' && AVA_LineType[n] != 'EndGroup' && AVA_LineType[n] != 'Subtotal')
											{
												var lineAmt = (AVA_LineAmount[n] == null || (AVA_LineAmount[n] != null && AVA_LineAmount[n].length == 0)) ? 0 : AVA_LineAmount[n];
												totalamt += parseFloat(lineAmt);
												totallines++;
											}
											else if(AVA_LineType[n] == 'Subtotal' && groupFlag == 0)//for scenario where subtotal is not inside a group item
											{
												break;
											}
											
										}
										
										var totalDiscount = 0, lines = 1;
										for(n = n+1 ; n != j ; n++)
										{
											if(AVA_LineType[n] != 'Description' && AVA_LineType[n] != 'Discount' && AVA_LineType[n] != 'Markup' && AVA_LineType[n] != 'Group' && AVA_LineType[n] != 'EndGroup' && AVA_LineType[n] != 'Subtotal')
											{
												if(lines == totallines)
												{
													var discAmt = parseFloat(discountItem) + totalDiscount;
												}
												else
												{
													var discAmt = (parseFloat(discountItem / totalamt.toFixed(2)) * parseFloat(AVA_LineAmount[n]));
												}
												AVA_LineAmount[n] = parseFloat(AVA_LineAmount[n]) + parseFloat(discAmt);
												totalDiscount += (discAmt.toFixed(2) * -1);
												lines++;
											}
										}
										break;
									}
									else
									{
										break;
									}  
								}
								else
								{
									if(AVA_LineType[j] != 'Description' && AVA_LineType[j] != 'Discount' && AVA_LineType[j] != 'Markup' && AVA_LineType[j] != 'Group' && AVA_LineType[j] != 'EndGroup' && AVA_LineType[j] != 'Subtotal')
									{
										subtotalFlag = 1
										totalamt += parseFloat(AVA_LineAmount[j]);
										totallines++;
									}
								}
							}
							
							var totalDiscount = 0, lines = 1;
							for(j=j+1 ;j!=prev; j++)//to add part of discount to all taxable items which appears between two subtotal items(this doesn't include subtotal which appear in a group item)
							{
								if(AVA_LineType[j] != 'Description' && AVA_LineType[j] != 'Discount' && AVA_LineType[j] != 'Markup' && AVA_LineType[j] != 'Group' && AVA_LineType[j] != 'EndGroup' && AVA_LineType[j] != 'Subtotal')
								{
									if(lines == totallines)
									{
										var discAmt = parseFloat(discountItem) + totalDiscount;
									}
									else
									{
										var discAmt = (parseFloat(discountItem / totalamt.toFixed(2)) * parseFloat(AVA_LineAmount[j]));
									}
									AVA_LineAmount[j] = parseFloat(AVA_LineAmount[j]) + parseFloat(discAmt);
									totalDiscount += (discAmt.toFixed(2) * -1);
									lines++;
								}
							}
						}
	
						if((AVA_LineType[prev] == 'Subtotal' || AVA_LineType[prev] == 'EndGroup') && totallines == 0 )
						{
							AVA_LineQty[i] = 1;
							AVA_LineAmount[i] = discountItem;
							AVA_TaxLines[i]='T';
						}
						
						if(AVA_LineType[prev] == 'InvtPart' || AVA_LineType[prev] == 'Kit' || AVA_LineType[prev] == 'Assembly' || AVA_LineType[prev] == 'NonInvtPart' || AVA_LineType[prev] == 'OthCharge' || AVA_LineType[prev] == 'Service' || AVA_LineType[prev] == 'GiftCert' || AVA_LineType[prev] == 'DwnLdItem')//if prev item is an Inventory
						{
							var invItem = AVA_LineAmount[prev];//this fetches the preceeding InvItem's amount
							AVA_LineAmount[prev] = parseFloat(invItem) + parseFloat(discountItem);//as we wud hve set some value earlier for the Inv item, that's why when Discount is identified below it, the Inv item's amount is exchanged with the discounted amt
						}       
					}
				}
				break;
			
			case 'Description':
			case 'Subtotal':
				AVA_TaxLines[i] = 'F';
				break;

			case 'Group':
				AVA_GroupBegin = i+2;//will save the item line num of the first member of group
				for(var k=AVA_GroupBegin; nlapiGetLineItemValue('item','itemtype',k) != 'EndGroup' && nlapiGetLineItemValue('item','item',k) != 0; k++)
				{					
					AVA_GroupEnd = k;	
				}
				i = AVA_GroupBegin-2;
				AVA_TaxLines[i] = 'F';
				AVA_Taxable[i]  = 'F';
				continue;

			case 'EndGroup':
				AVA_LineNames[i]  = 'EndGroup'
				AVA_LineType[i]   = 'EndGroup';
				AVA_LineAmount[i]   = nlapiGetLineItemValue('item','amount',i+1);
				AVA_TaxLines[i] = 'F';
				AVA_Taxable[i]    = 'F';
				break;
				
			case 'Payment':
				prev_lineno = i;
				AVA_TaxLines[i] = 'T';
				AVA_Taxable[i] = 'F';
				break;
							
			default:
				prev_lineno = i;
				AVA_TaxLines[i] = 'T';
				//EndGroup Item from Webservice call
				if(nlapiGetLineItemValue('item','item',i+1) == 0)
				{
					AVA_LineNames[i]  = 'EndGroup'
					AVA_LineType[i]   = 'EndGroup';
					AVA_LineAmount[i]   = nlapiGetLineItemValue('item','amount',i+1);
					AVA_TaxLines[i] = 'F';
					AVA_Taxable[i]    = 'F';
				}				
				break;
		}
	}
	
	AVA_GetExpenseItems(); //to get items from Expense subtabs of a transaction
}

function AVA_GetExpenseItems()
{
	var line = nlapiGetLineItemCount('item');
	
	for( ; AVA_NS_Lines != null && line < AVA_NS_Lines.length ; line++)
	{
		if(nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'category_display', AVA_NS_Lines[line][1]) != null && nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'category_display', AVA_NS_Lines[line][1]).length > 0)
		{
			var LineName = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'category_display', AVA_NS_Lines[line][1]);
		}
		else
		{
			var LineName = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'account_display', AVA_NS_Lines[line][1]);
		}
		
		AVA_LineNames[line] = LineName;
		AVA_LineQty[line] = 1;
		AVA_LineAmount[line] = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'amount', AVA_NS_Lines[line][1]);
		AVA_TaxLines[line] = 'T';
	}
}

function AVA_CalculateUseTax()
{
	var Multiplier = (nlapiGetRecordType() == 'vendorbill') ? 1 : -1;
	var security = AVA_TaxSecurity(AVA_AccountValue, AVA_LicenseKey);
	var headers = AVA_TaxHeader(security);
	var body = AVA_GetUseTaxBody();
	var soapPayload = AVA_GetTaxEnvelope(headers + body);
	
	var soapHead = {};
	soapHead['Content-Type'] = 'text/xml';
	soapHead['SOAPAction'] = 'http://avatax.avalara.com/services/GetTax';
	
	try
	{
		var StartTime = new Date();
		var response = nlapiRequestURL(AVA_ServiceUrl + '/tax/taxsvc.asmx' , soapPayload, soapHead);
		
		if (response.getCode() == 200)
		{
			var soapText = response.getBody();
			var soapXML = nlapiStringToXML(soapText);
			
			var GetTaxResult = nlapiSelectNode(soapXML, "//*[name()='GetTaxResult']");
			AVA_ResultCode = nlapiSelectValue( GetTaxResult, "//*[name()='ResultCode']");
			
			if(AVA_ResultCode == 'Success') 
			{
				AVA_DocStatus = nlapiSelectValue( GetTaxResult, "//*[name()='DocStatus']");
				
				if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0)
				{
					AVA_TotalTax = nlapiSelectValue( GetTaxResult, "//*[name()='TotalTax']");
					
					//if(parseFloat(AVA_TotalTax) > parseFloat(nlapiGetFieldValue('custbody_ava_taxtotal')))
					//{
						//var AccruedTax = parseFloat(AVA_TotalTax) - parseFloat(nlapiGetFieldValue('custbody_ava_taxtotal'));
						//var msg = 'Your Vendor has charged you:\t$' + nlapiGetFieldValue('custbody_ava_taxtotal') + ' in Taxes\n\n';
						var msg = 'AvaTax calculated use tax:\t$' + (nlapiFormatCurrency(AVA_TotalTax) * Multiplier) + '\n\n';
						msg += 'Vendor charged tax:\t\t$0.00\n\n';
						//msg += 'Do you want to accrue:\t\t$' + AccruedTax.toFixed(2) + ' as Self-Assessed Use Tax';
						if(nlapiGetRecordType() == 'vendorbill')
						{
							msg += 'Do you want to accrue:\t$' + (nlapiFormatCurrency(AVA_TotalTax) * Multiplier) + ' as Self-Assessed Use Tax?\n\n';
							msg += 'Note: It will not increase your vendor payment liability. Accrual amount will be credited to use tax payable account.\n\n';
						}
						else
						{
							msg += 'Do you want to post:\t\t$' + (nlapiFormatCurrency(AVA_TotalTax) * Multiplier) + ' as use tax accrual reversal?\n\n';
							msg += 'Note: Accrual amount will be reversed from use tax payable account and AvaTax.\n\n';
						}
						msg += 'Click "OK" if you want to accrue the use tax, click "Cancel", if you don\'t want to do it now.';
						if(confirm(msg))
						{
							nlapiSetFieldValue('custpage_ava_accruedusetax', 'T');
							nlapiSetFieldValue('custpage_ava_avatax', AVA_TotalTax);
							//nlapiSetFieldValue('custpage_ava_accruedtaxamount', AccruedTax.toFixed(2));
							nlapiSetFieldValue('custpage_ava_accruedtaxamount', AVA_TotalTax);
							nlapiSetFieldValue('custpage_ava_document', 'T');
						}
						else
						{
							nlapiSetFieldValue('custpage_ava_accruedusetax', 'F');
							nlapiSetFieldValue('custpage_ava_avatax', AVA_TotalTax);
							//nlapiSetFieldValue('custpage_ava_accruedtaxamount', AccruedTax.toFixed(2));
							nlapiSetFieldValue('custpage_ava_accruedtaxamount', AVA_TotalTax);
							nlapiSetFieldValue('custpage_ava_document', 'F');
						}
	
						nlapiGetField('custpage_ava_accruedusetax').setDisplayType('normal');
					/*}
					else if(parseFloat(AVA_TotalTax) < parseFloat(nlapiGetFieldValue('custbody_ava_taxtotal'))) 
					{
						var msg = '\t\t\tVendor overcharged\n\n';
						msg += 'Your Vendor has charged you:\t$' + nlapiGetFieldValue('custbody_ava_taxtotal') + ' in Taxes\n\n';
						msg += 'Whereas AvaTax calculates:\t$' + AVA_TotalTax + ' in Taxes\n\n';
						alert(msg);
						nlapiSetFieldValue('custpage_ava_avatax', AVA_TotalTax);
						nlapiSetFieldValue('custpage_ava_accruedtaxamount', 0);
						nlapiSetFieldValue('custpage_ava_accruedusetax', 'F');
						nlapiGetField('custpage_ava_accruedusetax').setDisplayType('disabled');
						nlapiSetFieldValue('custpage_ava_document', 'F');
					}
					else
					{
						alert('Vendor has charged you correct tax.');
						nlapiSetFieldValue('custpage_ava_avatax', AVA_TotalTax);
						nlapiSetFieldValue('custpage_ava_accruedtaxamount', 0);
						nlapiSetFieldValue('custpage_ava_accruedusetax', 'F');
						nlapiGetField('custpage_ava_accruedusetax').setDisplayType('disabled');
						nlapiSetFieldValue('custpage_ava_document', 'F');
					}*/
				}
				else
				{
					ResponseLineArray = new Array();
					ResponseLineArray = nlapiSelectNodes(GetTaxResult, "//*[name()='TaxLine']");
				}
				
				AVA_LogTaxResponse('T', response, StartTime);
				return true;
			}
			else if(AVA_ResultCode == 'Warning')
			{
				nlapiSetFieldValue('custpage_ava_document', 'F');
				if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0 && (AVA_ShowMessages == 1 || AVA_ShowMessages == 3))
				{
					AVA_ErrorCode = 'Warning';
					alert('Warning');
				}
				else
				{
					AVA_ErrorCode = 'Warning';
					nlapiLogExecution('DEBUG', 'Warning');
				}
				
				AVA_LogTaxResponse('T', response, StartTime);
				return true;
			}
			else if (AVA_ResultCode == 'Error')
			{
				nlapiSetFieldValue('custpage_ava_document', 'F');
				var AVA_Messages = nlapiSelectNode( GetTaxResult, "//*[name()='Messages']");
				var AVA_Message = nlapiSelectValue( AVA_Messages, "//*[name()='Summary']");
				if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0 && (AVA_ShowMessages == 2 || AVA_ShowMessages == 3))
				{
					AVA_ErrorCode = AVA_Message;
					alert("This Document has used AvaTax Services. " + AVA_Message);
				}
				else
				{
					AVA_ErrorCode = AVA_Message;
					nlapiLogExecution('DEBUG', 'Error Message', AVA_Message);
					nlapiLogExecution('DEBUG', 'Error', response.getCode());
				}
				
				return false;
			}
			else if(AVA_ResultCode == 'Exception')
			{
				nlapiSetFieldValue('custpage_ava_document', 'F');
				var AVA_Messages = nlapiSelectNode( GetTaxResult, "//*[name()='Messages']");
				var AVA_Message = nlapiSelectValue( AVA_Messages, "//*[name()='Summary']");
	
				if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0 && (AVA_ShowMessages == 2 || AVA_ShowMessages == 3))
				{
					AVA_ErrorCode = AVA_Message;
					alert("This Document has used AvaTax Services. " + AVA_Message);
				}
				else
				{
					AVA_ErrorCode = AVA_Message;
					nlapiLogExecution('DEBUG', 'Exception', AVA_Message); 
					nlapiLogExecution('DEBUG', 'Exception', response.getCode());  
				}
				
				return false;
			}
		}
		else
		{
			nlapiSetFieldValue('custpage_ava_document', 'F');
			AVA_ErrorCode = "Tax Calculation call to AvaTax Service failed. Please contact the Administrator.";
			if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0 && (AVA_ShowMessages == 2 || AVA_ShowMessages == 3))
			{
				alert("Tax Calculation call to AvaTax Service failed. Please contact the Administrator.");
			}
			else
			{
				nlapiLogExecution('DEBUG', 'Please contact the administrator');
				nlapiLogExecution('DEBUG', 'Response Code', response.getCode());
			}
			
			return false;
		}
	}
	catch(err)
	{
		nlapiSetFieldValue('custpage_ava_document', 'F');
		if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0 && (AVA_ShowMessages == 2 || AVA_ShowMessages == 3))
		{
			alert("Please contact the administrator");
			
			try
			{
				AVA_ErrorCode = 'Please contact the Administrator. ' + err.getDetails();
			}
			catch(e)
			{
				AVA_ErrorCode = 'Please contact the Administrator';
			}
			
			AVA_LogTaxResponse('T');
		}
		else
		{
			nlapiLogExecution('DEBUG', 'Please contact the administrator');
			
			try
			{
				nlapiLogExecution('DEBUG', 'Try/Catch Error', err.getDetails());
				AVA_ErrorCode = 'Please contact the Administrator. ' + err.getDetails();
			}
			catch(e)
			{
				AVA_ErrorCode = 'Please contact the Administrator';
			}
			
			AVA_LogTaxResponse('T');
		}
		
		return false;
	}
	
	AVA_LogTaxResponse('T', response, StartTime);
	return true;
}

function AVA_GetUseTaxBody()
{
	var soap = null, LocationCode;
	
	var AVA_Date = AVA_ConvertDate(nlapiGetFieldValue('trandate'));
	
	soap = '\t<soap:Body>\n';
	soap += '\t\t<GetTax xmlns="http://avatax.avalara.com/services">\n';
		soap += '\t\t\t<GetTaxRequest>\n';
			soap += '\t\t\t\t<CompanyCode><![CDATA[' + nlapiGetFieldValue('subsidiary') + ']]></CompanyCode>\n';
			
			if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0)
			{
				soap += '\t\t\t\t<DocType>PurchaseOrder</DocType>\n';
				soap += '\t\t\t\t<DocCode><![CDATA[' + ((Date() != null) ? Date().substring(0, 24) : '') + ']]></DocCode>\n';
			}
			else
			{
				soap += '\t\t\t\t<DocType>PurchaseInvoice</DocType>\n';
				soap += '\t\t\t\t<DocCode><![CDATA[' + nlapiGetRecordId() + ']]></DocCode>\n';
			}
			
			soap += '\t\t\t\t<DocDate>' + AVA_Date + '</DocDate>\n';
			
			switch(AVA_VendorCode)
			{
				case '0':
					var CustCode = VendorValues[5];
					soap += '\t\t\t\t<CustomerCode><![CDATA[' + ((CustCode != null && CustCode.length > 0) ? CustCode.substring(0,49) : '') + ']]></CustomerCode>\n';
					break;

				case '1':
					var CustCode = (VendorValues[0] == 'T') ? (VendorValues[1] + ((VendorValues[2] != null && VendorValues[2].length > 0) ? ( ' ' + VendorValues[2]) : ' ') + ((VendorValues[3] != null && VendorValues[3].length > 0) ? ( ' ' + VendorValues[3]) : '')) : (VendorValues[4]);
					soap += '\t\t\t\t<CustomerCode><![CDATA[' + ((CustCode != null && CustCode.length > 0) ? CustCode.substring(0,49) : '') + ']]></CustomerCode>\n';
					break;
					
				case '2':
					soap += '\t\t\t\t<CustomerCode><![CDATA[' + nlapiGetFieldValue('entity') + ']]></CustomerCode>\n';
					break;
					
				default :
					break;
			}
			
			soap += '\t\t\t\t<SalespersonCode/>\n';
			soap += '\t\t\t\t<CustomerUsageType/>\n';
			soap += '\t\t\t\t<Discount>0</Discount>\n';
			soap += '\t\t\t\t<PurchaseOrderNo/>\n';
			soap += '\t\t\t\t<OriginCode>Vendor Address</OriginCode>\n';
			
			if(nlapiGetFieldValue('custpage_ava_lineloc') == 'F')
			{
				if(AVA_HeaderLocation.length == 0)
				{
					soap += '\t\t\t\t<DestinationCode><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryaddressee') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryaddressee').substring(0,49) : '') + ']]></DestinationCode>\n';
				}
				else
				{
					soap += '\t\t\t\t<DestinationCode><![CDATA[' + ((AVA_HeaderLocation[0] !=null ) ? AVA_HeaderLocation[0].substring(0,49) : '') + ']]></DestinationCode>\n';
				}
			}
			else
			{
				var AVA_LineLocation = 'F';
				for(var i=0; AVA_LocationArray != null && i < AVA_LocationArray.length ; i++)
				{
					if(AVA_LocationArray[i][1] != null && AVA_LocationArray[i][1].length > 0 && AVA_LocationArray[i][1][0] != null)
					{
						AVA_LineLocation = 'T';
						if(AVA_LocationArray[i][1][0].length > 0)
						{
							soap += '\t\t\t\t<DestinationCode><![CDATA[' + AVA_LocationArray[i][1][0].substring(0,49) + ']]></DestinationCode>\n';
						}
						else
						{
							soap += '\t\t\t\t<DestinationCode><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryaddressee') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryaddressee').substring(0,49) : '') + ']]></DestinationCode>\n';
						}
						break;
					}
				}
				
				if(AVA_LineLocation == 'F')
				{
					soap += '\t\t\t\t<DestinationCode><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryaddressee') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryaddressee').substring(0,49) : '') + ']]></DestinationCode>\n';
				}
			}
			
			var AddressLines = AVA_UseTaxAddressLines();
			soap += AddressLines;
			var TaxLines = AVA_UseTaxGetLines();
			soap += TaxLines;

			if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 0)
			{
				soap += '\t\t\t\t<DetailLevel><![CDATA[Document]]></DetailLevel>\n';
				soap += '\t\t\t\t<Commit>0</Commit>\n';
			}
			else
			{
				soap += '\t\t\t\t<DetailLevel><![CDATA[Line]]></DetailLevel>\n';
				soap += '\t\t\t\t<Commit>1</Commit>\n';
			}
			
			if(nlapiGetFieldValue('currencysymbol') != null && nlapiGetFieldValue('currencysymbol').length > 0)
			{
				soap += '\t\t\t\t<CurrencyCode>' + nlapiGetFieldValue('currencysymbol') + '</CurrencyCode>\n';
				soap += '\t\t\t\t<ExchangeRate>' + nlapiGetFieldValue('exchangerate') + '</ExchangeRate>\n';
				soap += '\t\t\t\t<ExchangeRateEffDate>' + AVA_ConvertDate(nlapiGetFieldValue('trandate')) + '</ExchangeRateEffDate>\n';
			}
			else
			{
				soap += '\t\t\t\t<CurrencyCode/>\n'
			}
			
			if(nlapiGetFieldValue('custpage_ava_taxcodestatus') == 1)
			{
				soap += '\t\t\t\t<TaxOverride>\n';
					soap += '\t\t\t\t\t<TaxOverrideType>TaxAmount</TaxOverrideType>\n';
					//soap += '\t\t\t\t\t<TaxAmount>' + nlapiGetFieldValue('custpage_ava_accruedtaxamount') + '</TaxAmount>\n';
					soap += '\t\t\t\t\t<TaxAmount>0</TaxAmount>\n';
					soap += '\t\t\t\t\t<Reason>UseTax Override</Reason>\n';
				soap += '\t\t\t\t</TaxOverride>\n';
			}
			
			if(VendorValues[6] != null && VendorValues[6].length > 0)
			{
				soap += '\t\t\t\t<BusinessIdentificationNo><![CDATA[' + VendorValues[6].substring(0, 24) + ']]></BusinessIdentificationNo>\n';
			}
		soap += '\t\t\t</GetTaxRequest>\n'; 
	soap += '\t\t</GetTax>\n';
	soap += '\t</soap:Body>\n';

	return soap;
}

function AVA_UseTaxAddressLines()
{
	var soap;
	var Locations = new Array();
	
	soap = '\t\t\t\t<Addresses>\n';
	soap += '\t\t\t\t\t<BaseAddress>\n';
	soap += '\t\t\t\t\t\t<AddressCode>Vendor Address</AddressCode>\n';
	soap += '\t\t\t\t\t\t<Line1><![CDATA[' + (VendorValues[7] != null ? VendorValues[7] : '') + ']]></Line1>\n';
	soap += '\t\t\t\t\t\t<Line2><![CDATA[' + (VendorValues[8] != null ? VendorValues[8] : '') + ']]></Line2>\n';
	soap += '\t\t\t\t\t\t<Line3/>\n'; 
	soap += '\t\t\t\t\t\t<City><![CDATA[' + (VendorValues[9] != null ? VendorValues[9] : '') + ']]></City>\n';
	soap += '\t\t\t\t\t\t<Region><![CDATA[' + (VendorValues[10] != null ? VendorValues[10] : '') + ']]></Region>\n';
	soap += '\t\t\t\t\t\t<PostalCode><![CDATA[' + (VendorValues[11] != null ? VendorValues[11] : '') + ']]></PostalCode>\n';
	var ReturnCountryName = (VendorValues[12] != null ? AVA_CheckCountryName(VendorValues[12]) : '');
	soap += '\t\t\t\t\t\t<Country><![CDATA[' + ReturnCountryName[1] + ']]></Country>\n';
	soap += '\t\t\t\t\t</BaseAddress>\n';
	
	if(nlapiGetFieldValue('custpage_ava_lineloc') == 'F')
	{
		if(nlapiGetFieldValue('location') != null && nlapiGetFieldValue('location').length == 0)
		{
			Locations[0] = nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
		}
		else
		{
			Locations[0] = (AVA_HeaderLocation != null && AVA_HeaderLocation.length > 0) ? AVA_HeaderLocation : nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
		}
	}
	else
	{
		var LocationName, AVA_Flag;
		
		for(var i=0; AVA_TaxLines != null && i < AVA_TaxLines.length ; i++)
		{
			if(AVA_TaxLines[i] == 'T')
			{
				LocationName = (AVA_LocationArray[i] != null && AVA_LocationArray[i][0] != null && AVA_LocationArray[i][0].length > 0 && AVA_LocationArray[i][1] != null && AVA_LocationArray[i][1][0] != null && AVA_LocationArray[i][1][0].length > 0) ? AVA_LocationArray[i][1][0] : null;
				
				if(Locations.length == 0)
				{
					Locations[0] = (LocationName != null && LocationName.length > 0)? AVA_LocationArray[i][1] : nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
				}
				else
				{
					for(var k=0; k < Locations.length ; k++)
					{
						if(LocationName != null)
						{
							if(Locations[k][0] == LocationName)
							{
								AVA_Flag = 'T'
								break;
							}
							else
							{
								AVA_Flag = 'F';
							}
						}       
						else
						{
							if(Locations[k] == nlapiGetFieldValue('custbody_ava_subsidiaryaddressee'))
							{
								AVA_Flag = 'T';
								break;
							}
							else
							{
								AVA_Flag = 'F';
							}           
						} 
					}
				
					if(AVA_Flag == 'F')
					{
						Locations[Locations.length] = (LocationName != null && LocationName.length > 0)? AVA_LocationArray[i][1] : nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
					}
				}
			}
			
		}
	}
	
	for(var i=0; Locations != null && i < Locations.length; i++)
	{
		soap += '\t\t\t\t\t<BaseAddress>\n';
		if(Locations[i] == nlapiGetFieldValue('custbody_ava_subsidiaryaddressee'))
		{
			soap += '\t\t\t\t\t\t<AddressCode><![CDATA[' + ((nlapiGetFieldValue('custbody_ava_subsidiaryaddressee') != null) ? nlapiGetFieldValue('custbody_ava_subsidiaryaddressee').substring(0,49) : '') + ']]></AddressCode>\n';
			soap += '\t\t\t\t\t\t<Line1><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryaddress1') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryaddress1') : '') + ']]></Line1>\n';
			soap += '\t\t\t\t\t\t<Line2><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryaddress2') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryaddress2') : '') + ']]></Line2>\n';
			soap += '\t\t\t\t\t\t<Line3/>\n'; 
			soap += '\t\t\t\t\t\t<City><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiarycity') != null ? nlapiGetFieldValue('custbody_ava_subsidiarycity') : '') + ']]></City>\n';
			soap += '\t\t\t\t\t\t<Region><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiarystate') != null ? nlapiGetFieldValue('custbody_ava_subsidiarystate') : '') + ']]></Region>\n';
			soap += '\t\t\t\t\t\t<PostalCode><![CDATA[' + (nlapiGetFieldValue('custbody_ava_subsidiaryzip') != null ? nlapiGetFieldValue('custbody_ava_subsidiaryzip') : '') + ']]></PostalCode>\n';
			var ReturnCountryName = (nlapiGetFieldValue('custbody_ava_subsidiarycountry') != null ? AVA_CheckCountryName(nlapiGetFieldValue('custbody_ava_subsidiarycountry')) : '')
			soap += '\t\t\t\t\t\t<Country><![CDATA[' + ReturnCountryName[1] + ']]></Country>\n';
		}
		else
		{
			var AVA_ShipToAddress = Locations[i];
			soap += '\t\t\t\t\t\t<AddressCode><![CDATA[' + (AVA_ShipToAddress[0] != null ? AVA_ShipToAddress[0].substring(0,49) : '') + ']]></AddressCode>\n';
			soap += '\t\t\t\t\t\t<Line1><![CDATA[' + (AVA_ShipToAddress[1] != null ? AVA_ShipToAddress[1] : '') + ']]></Line1>\n';
			soap += '\t\t\t\t\t\t<Line2><![CDATA[' + (AVA_ShipToAddress[2] != null ? AVA_ShipToAddress[2] : '') + ']]></Line2>\n';
			soap += '\t\t\t\t\t\t<Line3/>\n'; 
			soap += '\t\t\t\t\t\t<City><![CDATA[' + (AVA_ShipToAddress[4] != null ? AVA_ShipToAddress[4] : '') + ']]></City>\n';
			soap += '\t\t\t\t\t\t<Region><![CDATA[' + (AVA_ShipToAddress[5] != null ? AVA_ShipToAddress[5] : '') + ']]></Region>\n';
			soap += '\t\t\t\t\t\t<PostalCode><![CDATA[' + (AVA_ShipToAddress[6] != null ? AVA_ShipToAddress[6] : '') + ']]></PostalCode>\n';
			soap += '\t\t\t\t\t\t<Country><![CDATA[' + (AVA_ShipToAddress[7] != null ? AVA_ShipToAddress[7] : '') + ']]></Country>\n';
		}
		soap += '\t\t\t\t\t</BaseAddress>\n';
	}
	
	soap += '\t\t\t\t</Addresses>\n';
	return soap;
}

function AVA_UseTaxGetLines()
{
	var soap, soapLine = 1, Locat;
	AVA_TaxRequestLines = new Array();
	var Multiplier = (nlapiGetRecordType() == 'vendorbill') ? 1 : -1;
	
	soap = '\t\t\t\t<Lines>\n';
	
	for(var line = 0 ; AVA_TaxLines != null && line < AVA_TaxLines.length ; line++)
	{
		if(AVA_TaxLines[line] == 'T')
		{
			soap += '\t\t\t\t\t<Line>\n';
			soap += '\t\t\t\t\t\t<No><![CDATA[' + parseInt(soapLine) + ']]></No>\n';
			
			if(nlapiGetFieldValue('custpage_ava_lineloc') == 'F')
			{
				if(AVA_HeaderLocation != null && AVA_HeaderLocation.length > 0)
				{
					Locat = AVA_HeaderLocation[0];
				}
				else
				{
					Locat = nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
				}
			}
			else
			{
				var AVA_LineLocation = 'F';
				if(nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'location', AVA_NS_Lines[line][1]) != null)
				{
					Locat = (AVA_LocationArray[line] != null && AVA_LocationArray[line][0] != null && AVA_LocationArray[line][1] != null && AVA_LocationArray[line][1][0] != null && AVA_LocationArray[line][1][0].length > 0) ? AVA_LocationArray[line][1][0] : null;
					Locat = (Locat != null && Locat.length > 0) ? Locat : nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
					AVA_LineLocation = 'T';
				}

				if(AVA_LineLocation == 'F')
				{
					Locat = nlapiGetFieldValue('custbody_ava_subsidiaryaddressee');
				}
			}
			
			soap += '\t\t\t\t\t\t<OriginCode>Vendor Address</OriginCode>\n';
			soap += '\t\t\t\t\t\t<DestinationCode><![CDATA[' + Locat + ']]></DestinationCode>\n';
			
			soap += '\t\t\t\t\t\t<ItemCode><![CDATA[' + ((AVA_LineNames[line] != null) ? AVA_LineNames[line].substring(0,49) : '') + ']]></ItemCode>\n';
			
			AVA_TaxRequestLines[soapLine-1] = new Array();
			AVA_TaxRequestLines[soapLine-1][0] = AVA_NS_Lines[line][0]; // Tab name
			AVA_TaxRequestLines[soapLine-1][1] = ((AVA_LineNames[line] != null) ? AVA_LineNames[line].substring(0,50) : '');
			AVA_TaxRequestLines[soapLine-1][2] = AVA_NS_Lines[line][1]; // Line Number
			
			if(AVA_TaxCodeMapping == 'T' || AVA_TaxCodeMapping == true)
			{
				var TaxCode = null;
				
				if(AVA_NS_Lines[line][0] == 'item')
				{
					TaxCode = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'custcol_ava_taxcodemapping', AVA_NS_Lines[line][1]);
				}
				
				if(TaxCode != null && TaxCode != '')
				{
					soap += '\t\t\t\t\t\t<TaxCode><![CDATA[' + TaxCode.substring(0,24) + ']]></TaxCode>\n';
				}
				else
				{
					soap += '\t\t\t\t\t\t<TaxCode/>\n';
				}
			}
			else
			{
				soap += '\t\t\t\t\t\t<TaxCode/>\n';
			}
			
			var qty = (AVA_LineQty[line] > 0) ? AVA_LineQty[line] : (AVA_LineQty[line] * -1);
			soap += '\t\t\t\t\t\t<Qty>' + qty + '</Qty>\n';
			
			var amount = (AVA_LineAmount[line] * Multiplier);
			soap += '\t\t\t\t\t\t<Amount>' + amount + '</Amount>\n';
			soap += '\t\t\t\t\t\t<Discounted>0</Discounted>\n';
			
			if(AVA_ItemAccount == 'T' || AVA_ItemAccount == true)
			{
				if(AVA_NS_Lines[line][0] == 'item')
				{
					var ItemAccount = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'custcol_ava_incomeaccount', AVA_NS_Lines[line][1]);
				}
				else
				{
					var ItemAccount = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'account_display', AVA_NS_Lines[line][1]);
				}
				
				if(ItemAccount != null && ItemAccount.length != 0)
				{
					soap += '\t\t\t\t\t\t<RevAcct><![CDATA[' + ItemAccount.substring(0,49) + ']]></RevAcct>\n';
				}
				else
				{
					soap += '\t\t\t\t\t\t<RevAcct/>\n';
				}
			}
			else
			{
				soap += '\t\t\t\t\t\t<RevAcct/>\n';
			}
			
			if(AVA_UDF1 == 'T' || AVA_UDF1 == true)
			{
				var Udf = null;
				
				if(AVA_NS_Lines[line][0] == 'item')
				{
					Udf = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'custcol_ava_udf1', AVA_NS_Lines[line][1]);
				}	
				
				if(Udf != null && Udf != '')
				{
					soap += '\t\t\t\t\t\t<Ref1><![CDATA[' + Udf.substring(0,249) + ']]></Ref1>\n';
				}
				else
				{
					soap += '\t\t\t\t\t\t<Ref1/>\n';
				}
			}
			else
			{
				soap += '\t\t\t\t\t\t<Ref1/>\n';
			}
			
			if(AVA_UDF2 == 'T' || AVA_UDF2 == true)
			{
				var Udf = null;
				
				if(AVA_NS_Lines[line][0] == 'item')
				{
					Udf = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'custcol_ava_udf2', AVA_NS_Lines[line][1]);
				}	
				
				if(Udf != null && Udf != '')
				{
					soap += '\t\t\t\t\t\t<Ref2><![CDATA[' + Udf.substring(0,249) + ']]></Ref2>\n';
				}
				else
				{
					soap += '\t\t\t\t\t\t<Ref2/>\n';
				}
			}
			else
			{
				soap += '\t\t\t\t\t\t<Ref2/>\n';
			}
			
			soap += '\t\t\t\t\t\t<ExemptionNo/>\n';
			soap += '\t\t\t\t\t\t<CustomerUsageType/>\n';
			
			var AVA_Description = '';
			if(AVA_NS_Lines[line][0] == 'item')
			{
				var Itemdesc = nlapiGetLineItemValue(AVA_NS_Lines[line][0], 'description', AVA_NS_Lines[line][1]);
				
				for (var ii = 0 ; Itemdesc != null && ii < Itemdesc.length  ; ii++)
				{
					if (Itemdesc.charCodeAt(ii) != 5)
					{
						AVA_Description = AVA_Description + Itemdesc.charAt(ii);
					}
				}
			}
			else
			{
				AVA_Description = (AVA_LineNames[line] != null) ? AVA_LineNames[line].substring(0,255) : '';
			}
			
			if(AVA_Description != null && AVA_Description.length != 0)
			{
				soap += '\t\t\t\t\t\t<Description><![CDATA[' + AVA_Description.substring(0,255) + ']]></Description>\n';
			}
			else
			{
				soap += '\t\t\t\t\t\t<Description><![CDATA[' + ((AVA_LineNames[line] != null) ? AVA_LineNames[line].substring(0,255) : '') + ']]></Description>\n';
			}
			
			soap += '\t\t\t\t\t</Line>\n';
			soapLine++;
		}
	}
	
	soap += '\t\t\t\t</Lines>\n';   
	return soap;
}

function AVA_UpdateGLAccounts(record, JournalEntryExist)
{
	var i;
	//if(JournalEntryExist == 0)
	//{
		record.setFieldValue('subsidiary', nlapiGetFieldValue('subsidiary'));
	//}
	
	if(AVA_GlAccounts == 'glaccount')
	{
		record.setLineItemValue('line', 'account', 1, AVA_UseTaxDebit);
		record.setLineItemValue('line', 'debit',   1, nlapiGetFieldValue('custpage_ava_accruedtaxamount'));
		record.setLineItemValue('line', 'memo',    1, (nlapiGetRecordId() + ' - Use Tax'));
		record.setLineItemValue('line', 'account', 2, AVA_UseTaxCredit);
		record.setLineItemValue('line', 'credit',  2, nlapiGetFieldValue('custpage_ava_accruedtaxamount'));
		record.setLineItemValue('line', 'memo',    2, (nlapiGetRecordId() + ' - Use Tax'));
	}
	else
	{
		for(i=0; AVA_TaxRequestLines != null && i < AVA_TaxRequestLines.length ; i++)
		{
			if(AVA_TaxRequestLines[i][0] == 'item')
			{
				record.setLineItemValue('line', 'account', i + 1, nlapiGetLineItemValue(AVA_TaxRequestLines[i][0], 'custcol_ava_assetaccount', AVA_TaxRequestLines[i][2]));
			}
			else
			{
				record.setLineItemValue('line', 'account', i + 1, nlapiGetLineItemValue(AVA_TaxRequestLines[i][0], 'account', AVA_TaxRequestLines[i][2]));
			}
			record.setLineItemValue('line', 'debit',   i + 1, nlapiFormatCurrency(nlapiSelectValue(ResponseLineArray[i], "./*[name()='TaxCalculated']")));
			record.setLineItemValue('line', 'memo',    i + 1, (nlapiGetRecordId() + ' - Use Tax'));
		}
		record.setLineItemValue('line', 'account', i + 1, AVA_UseTaxCredit);
		record.setLineItemValue('line', 'credit',  i + 1, nlapiGetFieldValue('custpage_ava_accruedtaxamount'));
		record.setLineItemValue('line', 'memo',    i + 1, (nlapiGetRecordId() + ' - Use Tax'));
	}
	
	JournalEntryId = nlapiSubmitRecord(record, true);
}

function AVA_UpdateUseTaxHeaderRecord(record)
{
	record.setFieldValue('custrecord_ava_docinternalid',  nlapiGetRecordId());
	record.setFieldValue('custrecord_ava_docno',          nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'transactionnumber'));
	record.setFieldValue('custrecord_ava_docdate',        AVA_DateFormat(nlapiGetContext().getSetting('PREFERENCE', 'DATEFORMAT'), AVA_ConvertDate(nlapiGetFieldValue('trandate'))));
	record.setFieldValue('custrecord_ava_accruedusetax',  nlapiGetFieldValue('custpage_ava_document'));
	record.setFieldValue('custrecord_avaaccruedtaxamt',   nlapiFormatCurrency(nlapiGetFieldValue('custpage_ava_accruedtaxamount')));
	record.setFieldValue('custrecord_ava_avatax',         nlapiFormatCurrency(nlapiGetFieldValue('custpage_ava_avatax')));
	record.setFieldValue('custrecord_ava_subid',          nlapiGetFieldValue('subsidiary'));
	if(nlapiGetFieldValue('custpage_ava_document') == 'T')
	{
		record.setFieldValue('custrecord_ava_docstatus',      AVA_DocumentStatus(AVA_DocStatus));
		record.setFieldValue('custrecord_ava_journalentryid', JournalEntryId);
	}
	
	var headerid = nlapiSubmitRecord(record, false);
}