/******************************************************************************************************
	Script Name - 	AVA_EntityFunctions.js
	Company - 		Avalara Technologies Pvt Ltd.
******************************************************************************************************/

function AVA_EntityUseCodeList(request, response)
{
	if(AVA_CheckService('TaxSvc') == 0 && AVA_CheckSecurity( 5 ) == 0)
	{
		var AVA_EntityList = nlapiCreateList('Entity/Use Code List');
		AVA_EntityList.setStyle(request.getParameter('style'));
	
		var AVA_InternalId = nlapiGetContext().getSetting('PREFERENCE', 'EXPOSEIDS');
		if(AVA_InternalId == 'T')
		{
			AVA_EntityList.addColumn('id',	'text', 	'Internal Id', 		'LEFT');
		}
	
		var AVA_EntityId = AVA_EntityList.addColumn('custrecord_ava_entityid',		'text', 	'Entity/Use Code ID', 	'LEFT');
	    AVA_EntityId.setURL(nlapiResolveURL('SUITELET', 'customscript_avaentityuseform_suitlet', 'customdeploy_entityusecode'));
	    AVA_EntityId.addParamToURL('avaid',		'id', 	true);
	    AVA_EntityId.addParamToURL('avaedit',	'T', 	false);
		
		AVA_EntityList.addColumn('custrecord_ava_entityusedesc',	'text',		'Description', 		'LEFT');
	
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_ava_entityid');
		columns[1] = new nlobjSearchColumn('custrecord_ava_entityusedesc');
		
		AVA_EntityList.addPageLink('breadcrumb', 'Entity/Use Code List', nlapiResolveURL('SUITELET', 'customscript_avaentityuselist_suitlet', 'customdeploy_entityuselist'));

		var results = nlapiSearchRecord('customrecord_avaentityusecodes', null, null, columns);
		AVA_EntityList.addRows(results);
		
		AVA_EntityList.addButton('custombutton1','New', "window.location = '" + nlapiResolveURL('SUITELET', 'customscript_avaentityuseform_suitlet', 'customdeploy_entityusecode') + "&compid=" + nlapiGetContext().getCompany() + "&whence='");
		response.writePage(AVA_EntityList);
	}
}

function AVA_EntityUseForm(request, response)
{
	if(AVA_CheckSecurity(4) == 0)
	{
		if(request.getMethod() == 'GET')
		{
			var entityform = nlapiCreateForm('Entity/Use Code');
			entityform.setScript('customscript_avaentity_client');
			entityform.setTitle('Entity/Use Code');
			
			/* HEADER LEVEL FIELDS */
			var AVA_EntityId 		= entityform.addField('ava_entityid',		'text',			'Entity/Use Code Id');
			AVA_EntityId.setMaxLength(100);	
			AVA_EntityId.setMandatory(true);
			
			var AVA_EntityDesc 		= entityform.addField('ava_entitydesc',		'text',			'Description');
			AVA_EntityDesc.setMaxLength(200);	
	
			var AVA_EntityListURL 	= entityform.addField('ava_entitylisturl',	'text',			'URL');
			AVA_EntityListURL.setDisplayType('hidden');
			AVA_EntityListURL.setDefaultValue(nlapiResolveURL('SUITELET', 'customscript_avaentityuselist_suitlet', 'customdeploy_entityuselist'));

			var AVA_InternalID 		= entityform.addField('ava_entityinternalid',	'text',		'Internal ID');
			AVA_InternalID.setDisplayType('hidden');

			entityform.addSubmitButton('Save');
			if (request.getParameter('avaid') != null)
			{
				var record = nlapiLoadRecord('customrecord_avaentityusecodes', request.getParameter('avaid'));
				AVA_EntityId.setDefaultValue(record.getFieldValue('custrecord_ava_entityid'));
				AVA_EntityId.setDisplayType('disabled');
		
				AVA_EntityDesc.setDefaultValue(record.getFieldValue('custrecord_ava_entityusedesc'));
				AVA_InternalID.setDefaultValue(request.getParameter('avaid'));
			}

			if(request.getParameter('avaedit') == 'T')
			{	
				entityform.addButton('ava_entitydelete', 'Delete', "AVA_EntityCodeDelete()");
			}
			entityform.addResetButton('Reset');
	
			entityform.addPageLink('breadcrumb','Entity/Use Code', nlapiResolveURL('SUITELET', 'customscript_avaentityuseform_suitlet', 'customdeploy_entityusecode'));
			entityform.addPageLink('crosslink', 'List Records', nlapiResolveURL('SUITELET', 'customscript_avaentityuselist_suitlet', 'customdeploy_entityuselist'));
			response.writePage(entityform);
		}
		else
		{
			var AVA_Message = 'A Entity/Use Code record with this ID already exists. You must enter a unique Entity/Use Code ID for each record you create.';
			var AVA_EntityFlag = 'F';
			var AVA_EntitySearchId;
			var AVA_EntityId = Trim(request.getParameter('ava_entityid'));
					
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_ava_entityid', null, 'is', AVA_EntityId);
			
			var columns = new Array();
		 	columns[0] = new nlobjSearchColumn('custrecord_ava_entityid'); 
	
			var searchresult = nlapiSearchRecord('customrecord_avaentityusecodes', null, filters, columns);
			
			if ((searchresult != null) && (request.getParameter('ava_entityinternalid') == null || request.getParameter('ava_entityinternalid').length == 0))
			{
				var AVA_Notice = AVA_NoticePage(AVA_Message);
				response.write(AVA_Notice);
			}
			else
			{
				if (request.getParameter('ava_entityinternalid') != null && request.getParameter('ava_entityinternalid').length > 0)
				{
					var fields = new Array();
					fields[0] = 'name';
					fields[1] = 'custrecord_ava_entityid';
					fields[2] = 'custrecord_ava_entityusedesc';
					
					var values = new Array();
					values[0] = request.getParameter('ava_entityid');
					values[1] = request.getParameter('ava_entityid');
					values[2] = request.getParameter('ava_entitydesc');	
					
					nlapiSubmitField('customrecord_avaentityusecodes', request.getParameter('ava_entityinternalid'), fields, values);
				}
				else
				{
					var record = nlapiCreateRecord('customrecord_avaentityusecodes');
					record.setFieldValue('name', 							request.getParameter('ava_entityid'));
					record.setFieldValue('custrecord_ava_entityid', 		request.getParameter('ava_entityid'));
					record.setFieldValue('custrecord_ava_entityusedesc', 	request.getParameter('ava_entitydesc'));
					var AVA_EntityRecordId = nlapiSubmitRecord(record, false);
				}
				nlapiSetRedirectURL('SUITELET', 'customscript_avaentityuselist_suitlet', 'customdeploy_entityuselist');
			}
		}
	}
}

function AVA_EntityCodeDelete()
{
	var AVA_Exists = 'F';
	if(confirm("Are you sure you want to delete the record?") == true)
	{
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_ava_entityusemap', null, 'is', nlapiGetFieldValue('ava_entityinternalid'));
		
		var cols = new Array();
		cols[0] = new nlobjSearchColumn('custrecord_ava_entityusemap');
		
		var searchresult = nlapiSearchRecord('customrecord_avaentityusemapping', null, filters, cols);
		if(searchresult != null)
		{
			alert('The Entity/Use Code cannot be deleted as there are child records asscoiated with this code');
		}
		else
		{ 
			try
			{
				nlapiDeleteRecord('customrecord_avaentityusecodes', nlapiGetFieldValue('ava_entityinternalid'));
			}
			catch(err)
			{
				var code = err instanceof nlobjError ? err.getCode() : err.name;
				alert(code);
			}
			window.location = nlapiGetFieldValue('ava_entitylisturl');
		}
	}	
}

function AVA_CustomerEntityList(request, response)
{
	var AVA_CustomerList = nlapiCreateList('Customers');
	AVA_CustomerList.setStyle(request.getParameter('style'));
	
	var AVA_Customername = AVA_CustomerList.addColumn('entityid',	'text', 	'Customer Name', 	'LEFT');
	AVA_Customername.setURL(nlapiResolveURL('SUITELET', 'customscript_avaentitymap_suitlet', 'customdeploy_entityusemap'));
	AVA_Customername.addParamToURL('cid', 'id', true);
	
	var AVA_InternalId = nlapiGetContext().getSetting('PREFERENCE', 'EXPOSEIDS');
	if(AVA_InternalId == 'T')
	{
		AVA_CustomerList.addColumn('id',	'text', 	'Internal Id', 		'LEFT');
	}
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('isperson');
	columns[1] = new nlobjSearchColumn('firstname');
	columns[2] = new nlobjSearchColumn('middlename');
	columns[3] = new nlobjSearchColumn('lastname');
	columns[4] = new nlobjSearchColumn('companyname');
	columns[5] = new nlobjSearchColumn('entityid');
	
	var searchResult = nlapiSearchRecord('customer', null, null, columns);
	var results = new Array();
	
	for(var k=0; k != null && k < searchResult.length; k++)
	{
		results[k] = new Array();
		results[k]['entityid'] = (searchResult[k].getValue('isperson') == 'T') ? (searchResult[k].getValue('firstname') + ((searchResult[k].getValue('middlename') != null && searchResult[k].getValue('middlename').length>0)? ( ' ' + searchResult[k].getValue('middlename') + ' ' ) : ' ') + searchResult[k].getValue('lastname')) : ((searchResult[k].getValue('companyname') != null && searchResult[k].getValue('companyname').length > 0) ? searchResult[k].getValue('companyname') : searchResult[k].getValue('entityid'));	
		results[k]['id'] = searchResult[k].getId();
	}

	AVA_CustomerList.addRows(results);
	AVA_CustomerList.addPageLink('breadcrumb', 'Entity/Use Code Mapping', nlapiResolveURL('SUITELET', 'customscript_avacustomerlist_suitlet', 'customdeploy_customerlist'));
	response.writePage(AVA_CustomerList);
} 

function AVA_EntityMappingForm(request, response)
{
	if (request.getMethod() == 'GET')
	{
		var MapExists = 'F';

		var EntityMapForm = nlapiCreateForm('Entity/Use Code Mapping');
		EntityMapForm.setScript('customscript_avaentitymap_client');
		EntityMapForm.setTitle('Entity/Use Code Mapping');

		EntityMapForm.addField('customerid', 'text', 'Customer ID');
		
		EntityMapForm.addField('custid', 'text', 'Cust ID');
		EntityMapForm.getField('custid').setDefaultValue(request.getParameter('cid'));
		EntityMapForm.getField('custid').setDisplayType('hidden');
		
		EntityMapForm.addField('mapexists', 'checkbox', 'Map Exist');
		EntityMapForm.getField('mapexists').setDisplayType('hidden');

		var AVA_EntitySubList = EntityMapForm.addSubList('custpage_avaentitymap', 	'list', 	'AvaTax Entity/Use Mapping'); 
		AVA_EntitySubList.addField('avadeletemap', 		'checkbox', 	'Delete Mapping', 					null);
		AVA_EntitySubList.addField('avaentmap1', 		'text', 		'ID', 								null);
		AVA_EntitySubList.addField('avaentmap2', 		'text', 		'Default Shipping', 				null);
		AVA_EntitySubList.addField('avaentmap3', 		'text', 		'Default Billing',					null);
		AVA_EntitySubList.addField('avaentmap4', 		'text', 		'Residential Address', 				null);
		AVA_EntitySubList.addField('avaentmap5', 		'text', 		'Label', 							null);
		AVA_EntitySubList.addField('avaentmap6', 		'text', 		'Addressee', 						null);
		AVA_EntitySubList.addField('avaentmap7', 		'text', 		'Address1', 						null);
		AVA_EntitySubList.addField('avaentmap8', 		'text', 		'Address2', 						null);
		AVA_EntitySubList.addField('avaentmap9', 		'text', 		'City', 							null);
		AVA_EntitySubList.addField('avaentmap10', 		'text', 		'State/Province', 					null);
		AVA_EntitySubList.addField('avaentmap11', 		'text', 		'Zip', 								null);
		AVA_EntitySubList.addField('avaentmap12', 		'text', 		'Country', 							null);
		AVA_EntitySubList.addField('avaentmap13', 		'select', 		'Entity/Use Code & Description',	null);
		AVA_EntitySubList.addField('avaentmapexists', 	'checkbox', 	'Line Map Exists', 					null);
		AVA_EntitySubList.addField('avaentmapid', 		'text', 		'Entity Map Id', 					null);

		AVA_EntitySubList.getField('avaentmapexists').setDisplayType('hidden');
		AVA_EntitySubList.getField('avaentmapid').setDisplayType('hidden');
		
		EntityMapForm.addPageLink('breadcrumb', 	'Entity/Use Code Mapping', 	nlapiResolveURL('SUITELET', 'customscript_avacustomerlist_suitlet', 'customdeploy_customerlist'));
		EntityMapForm.addPageLink('crosslink', 		'Customer List', 			nlapiResolveURL('SUITELET', 'customscript_avacustomerlist_suitlet', 'customdeploy_customerlist'));
		EntityMapForm.addSubmitButton('Save');
		EntityMapForm.addResetButton('Reset');

		if(request.getParameter('cid') != null)
		{
			var record = nlapiLoadRecord('customer', request.getParameter('cid')); 
			EntityMapForm.getField('customerid').setDefaultValue(record.getFieldValue('entityid'));
			EntityMapForm.getField('customerid').setDisplayType('disabled');
			
			var AVA_EntityUseList = AVA_EntitySubList.getField('avaentmap13');
			AVA_EntityUseList.addSelectOption('', '');
			
			var cols = new Array();
			cols[0] = new nlobjSearchColumn('custrecord_ava_entityid');
			cols[1] = new nlobjSearchColumn('custrecord_ava_entityusedesc');
			
			var searchresult = nlapiSearchRecord('customrecord_avaentityusecodes', null, null, cols );
			for (var j = 0; searchresult != null && j < searchresult.length; j++)
			{
				if(searchresult[j].getValue('custrecord_ava_entityid') != null && searchresult[j].getValue('custrecord_ava_entityusedesc') != null)
				{
					AVA_EntityUseList.addSelectOption(searchresult[j].getValue('custrecord_ava_entityid'), searchresult[j].getValue('custrecord_ava_entityid') + ' - '  + searchresult[j].getValue('custrecord_ava_entityusedesc'));
				}
				else
				{
					AVA_EntityUseList.addSelectOption(searchresult[j].getValue('custrecord_ava_entityid'), searchresult[j].getValue('custrecord_ava_entityid') + ' - ');
				}
			}

			// Display all the addresses of the customer that is already saved in the customer screen
			for(var i = 0; i < record.getLineItemCount('addressbook'); i++)
			{
				nlapiSetLineItemValue('custpage_avaentitymap', 'avadeletemap', 	i+1, 	'F');
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap1', 	i+1, 	record.getLineItemValue('addressbook',	'id', i+1));

				if(record.getLineItemValue('addressbook', 'defaultshipping', i+1) == 'T')
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap2', 	i+1, 	'Yes');
				}
				else
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap2', 	i+1, 	'No');
				}

				if(record.getLineItemValue('addressbook', 'defaultbilling', i+1) == 'T')
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap3', 	i+1, 	'Yes');
				}
				else
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap3', 	i+1, 	'No');
				}
				
				if(record.getLineItemValue('addressbook', 'isresidential', i+1) == 'T')
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap4', 	i+1, 	'Yes');
				}
				else
				{
					nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap4', 	i+1, 	'No');
				}
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap5', 		i+1, 	record.getLineItemValue('addressbook',	'label',			i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap6', 		i+1, 	record.getLineItemValue('addressbook',	'addressee',		i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap7',		i+1, 	record.getLineItemValue('addressbook',	'addr1',			i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap8',		i+1, 	record.getLineItemValue('addressbook',	'addr2',			i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap9',		i+1, 	record.getLineItemValue('addressbook',	'city',				i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap10',		i+1, 	record.getLineItemValue('addressbook',	'state',			i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap11',		i+1,  	record.getLineItemValue('addressbook',	'zip',				i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap12',		i+1, 	record.getLineItemValue('addressbook',	'country',			i+1));
				nlapiSetLineItemValue('custpage_avaentitymap', 'mapexists',			i+1,	'F');
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmapid',		i+1, 	0);
				nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmapexists',	i+1,	'F');
			}

			// Verify if any mapping is existing in the custom records for the customer addresses already loaded
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custrecord_ava_customerid');
			columns[1] = new nlobjSearchColumn('custrecord_ava_addressid');
			columns[2] = new nlobjSearchColumn('custrecord_ava_entityusemap');

			var searchresult = nlapiSearchRecord('customrecord_avaentityusemapping', null, null, columns);
			for (var i=0; searchresult != null && i < searchresult.length; i++)
			{
				for (var j=0; j< nlapiGetLineItemCount('custpage_avaentitymap'); j++)
				{
					if(searchresult[i].getValue('custrecord_ava_addressid') == nlapiGetLineItemValue('custpage_avaentitymap', 'avaentmap1', j+1))
					{
						nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmap13',		j+1, searchresult[i].getValue('custrecord_ava_entityusemap'));
						nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmapid',		j+1, searchresult[i].getId());
						nlapiSetLineItemValue('custpage_avaentitymap', 'avaentmapexists',	j+1, 'T');
						EntityMapForm.getField('mapexists').setDefaultValue('T');
						MapExists = 'T';
						break;
					}
				}
			}
			// If no Mapping exists then no need to display the Delete column in the sublist
			if(MapExists == 'F')
			{
				AVA_EntitySubList.getField('avadeletemap').setDisplayType('hidden');
			}
			else
			{
				AVA_EntitySubList.addMarkAllButtons();
			}

		}			
		response.writePage(EntityMapForm);
	}
	else
	{
		var record = nlapiLookupField('customer', request.getParameter('custid'), 'entityid');
		if(record == null)
		{
			var AVA_Message = 'The selected customer has been deleted by other user(s).';
			var AVA_Notice = AVA_NoticePage(AVA_Message);
			response.write(AVA_Notice);
		}
		else
		{
			for(var i=0; i < request.getLineItemCount('custpage_avaentitymap'); i++)
			{
				var AVA_MapValue 	= request.getLineItemValue('custpage_avaentitymap', 'avaentmap13', 	i+1);
				var AVA_MapId 		= request.getLineItemValue('custpage_avaentitymap', 'avaentmapid', 	i+1);
				var AVA_DeleteMap 	= request.getLineItemValue('custpage_avaentitymap', 'avadeletemap', i+1);
				var Lineaddressid	= request.getLineItemValue('custpage_avaentitymap', 'avaentmap1', 	i+1);

				if(AVA_MapId != 0)
				{
					if ((AVA_MapValue != null) && (AVA_DeleteMap != 'T'))
					{
						var Record = nlapiLoadRecord('customrecord_avaentityusemapping', AVA_MapId);
						AVA_EntityMappingSave(Record, Lineaddressid, AVA_MapValue);
					}
					else if ((AVA_MapValue == null) || (AVA_DeleteMap == 'T'))
					{
						nlapiDeleteRecord('customrecord_avaentityusemapping', AVA_MapId);
					}
				}
				else 
				{
					if(AVA_MapValue != null)
					{
						var Record = nlapiCreateRecord('customrecord_avaentityusemapping');
						AVA_EntityMappingSave(Record, Lineaddressid, AVA_MapValue);

					}
				}
			}	
			nlapiSetRedirectURL('SUITELET', 'customscript_avacustomerlist_suitlet', 'customdeploy_customerlist');
		}
	}
}

function AVA_EntityMappingSave(Record, Lineaddressid, Entitymapid)
{
	Record.setFieldValue('custrecord_ava_customerid', 	request.getParameter('custid'));
	Record.setFieldValue('custrecord_ava_addressid', 	Lineaddressid);
	Record.setFieldValue('custrecord_ava_entityusemap', Entitymapid);
	var emid = nlapiSubmitRecord(Record);
}

function AVA_EntityMapSave()
{
	var AVA_Return;
	// If Mapping is already existing then the delete checkbox is visible 
	// Perform necessary checking else return true flag 
	if (nlapiGetFieldValue('mapexists') == 'T')
	{
		var AVA_MapExists = 'F';
		
		// Check if delete checkbox is marked, then break from loop by setting the mapexists flag to 'true'
		for(var i=0; i < nlapiGetLineItemCount('custpage_avaentitymap'); i++)
		{
			if(nlapiGetLineItemValue('custpage_avaentitymap', 'avadeletemap', i+1) == 'T')
			{
				AVA_MapExists = 'T';
				break;	
			}
		}
		
		if(AVA_MapExists == 'T')
		{
			// mapping done throw confirmation message and set the return flag 
			if(confirm('Are you sure you want to delete the mapping for selected Address ID?') == true)
			{
				AVA_Return = 'T';
			}
			else
			{
				AVA_Return = 'F';
			}
		}
		else
		{
			AVA_Return = 'T';
		}
	}
	else
	{
		// Mapping is not done so return true flag
		AVA_Return = 'T';
	}
	
	if(AVA_Return == 'T')
	{
		return true;
	}
	else
	{
		return false;
	}
}

function AVA_CustomerBeforeLoad(type, form) //TaxSvc
{
	var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	if(AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet' || AVA_ExecutionContext == 'webstore')
	{
		if(nlapiGetField('custpage_ava_readconfig') == null)
		{
			form.addField('custpage_ava_readconfig','longtext','ConfigRecord');
			form.getField('custpage_ava_readconfig').setDisplayType('hidden');
			AVA_ReadConfig('1');	
		}
		else
		{
			if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
			{
				var LoadValues = AVA_LoadValuesFromField();
			}
		}
		
		form.setScript('customscript_avaentity_client');		
		if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1 && (AVA_DisableTax == 'F' || AVA_DisableTax == false))
		{
			var AddressTab = form.getSubList('addressbook');
			if(AddressTab != null)
			{
				AddressTab.addField('custpage_ava_entityusecode','select','Entity/Use Code','customrecord_avaentityusecodes');
			}
			else
			{		
				AddressTab = form.getTab('address');
				if(AddressTab != null)
				{
					form.addField('custpage_ava_entityusecode', 'select', 'Entity/Use Code', 'customrecord_avaentityusecodes');			
				}
			}
		
			form.addTab('custpage_avatab', 'AvaTax');
			
			form.addField('custpage_ava_exemption', 	'text', 	'Exemption Certificate No.',  null, 'custpage_avatab');
			form.getField('custpage_ava_exemption').setMaxLength(25);
		
			form.addField('custpage_ava_exemptionid', 	'text', 	'Exemption ID',  				null, 'custpage_avatab');
			form.getField('custpage_ava_exemptionid').setDisplayType('hidden');
		
			if(type == 'edit' || type == 'view')
			{
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ava_exemptcustomerid', null, 'anyof', nlapiGetRecordId());
				
				var cols = new Array();
				cols[0] = new nlobjSearchColumn('custrecord_ava_exemptno');
				cols[1] = new nlobjSearchColumn('custrecord_ava_exemptcustomerid');
				
				var searchresult = nlapiSearchRecord('customrecord_avacustomerexemptmapping', null, filters, cols);		
				for(var i=0; searchresult != null && i < searchresult.length; i++)
				{
					form.getField('custpage_ava_exemption').setDefaultValue(searchresult[i].getValue('custrecord_ava_exemptno'));
					form.getField('custpage_ava_exemptionid').setDefaultValue(searchresult[i].getId());
				}
				
				if(type == 'edit')
				{
					form.addField('custpage_ava_exemptno', 'longtext', 'Exempt No');
					form.getField('custpage_ava_exemptno').setDisplayType('hidden');
					if(searchresult != null && searchresult.length > 0)
					{
						form.getField('custpage_ava_exemptno').setDefaultValue(JSON.stringify(searchresult));
					}
				}
				
				if(AddressTab != null)
				{
					var filters = new Array();
					filters[0] = new nlobjSearchFilter('custrecord_ava_customerid', null, 'anyof', nlapiGetRecordId());
					
					var cols = new Array();
					cols[0] = new nlobjSearchColumn('custrecord_ava_entityusemap');
					cols[1] = new nlobjSearchColumn('custrecord_ava_addressid');
					cols[2] = new nlobjSearchColumn('custrecord_ava_customerid');
					
					var searchresult = nlapiSearchRecord('customrecord_avaentityusemapping', null, filters, cols);		
					for(var k=0; k < nlapiGetLineItemCount('addressbook') && searchresult != null && searchresult.length > 0 ; k++)
					{
						var AddId = nlapiGetLineItemValue('addressbook', 'id', k+1);
						
						for(var m=0; m<searchresult.length; m++)
						{
							if(searchresult[m].getValue('custrecord_ava_addressid') == AddId)
							{
								nlapiSetLineItemValue('addressbook', 'custpage_ava_entityusecode', k+1, searchresult[m].getValue('custrecord_ava_entityusemap'));
							}
						}
					}
					
					if(type == 'edit')
					{
						form.addField('custpage_ava_entityusecodelist', 'longtext', 'Entity Use Code');
						form.getField('custpage_ava_entityusecodelist').setDisplayType('hidden');
						if(searchresult != null && searchresult.length > 0)
						{
							form.getField('custpage_ava_entityusecodelist').setDefaultValue(JSON.stringify(searchresult));
						}
					}	
				}			
			}
		}
	}	
}

function AVA_CustomerBeforeLoad_Address(type, form) //AddressSvc
{
	var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	if(AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet')		
	{	
		if(nlapiGetField('custpage_ava_readconfig') == null)
		{
			form.addField('custpage_ava_readconfig','longtext','ConfigRecord');
			form.getField('custpage_ava_readconfig').setDisplayType('hidden');
			AVA_ReadConfig('1');	
		}
		else
		{
			if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
			{
				var LoadValues = AVA_LoadValuesFromField();
			}
		}
		
		form.setScript('customscript_avaentity_client');		
		var BaseRecordType = nlapiGetFieldValue('baserecordtype');
		
		if(BaseRecordType == 'vendor' && (AVA_EnableUseTax == true || AVA_EnableUseTax == 'T'))
		{
			form.getField('custentity_ava_usetaxassessment').setDisplayType('normal');
		}
		
		if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('AddressSvc') != -1 && (AVA_DisableAddValidation == false || AVA_DisableAddValidation == 'F'))
		{
			var AddressTab = form.getSubList('addressbook');
			if(AddressTab != null)
			{
				AddressTab.addButton('custpage_ava_validateaddress','Validate Address', "AVA_ValidateAddress(0)");
				if(AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T')
				{
					AddressTab.addField('custpage_ava_addval', 'checkbox', 'Validated').setDisplayType('disabled');
				}
				if(BaseRecordType != 'vendor')
				{
					AddressTab.addField('custpage_ava_latitude',	 'text',  'Latitude');
					AddressTab.addField('custpage_ava_longitude',	 'text',  'Longitude');
				}
			}
			else
			{		
				AddressTab = form.getTab('address');
				if(AddressTab != null)
				{
					form.addButton('custpage_ava_validateaddress','Validate Address',"AVA_ValidateAddress(1)");
					if(AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T')
					{
						form.addField('custpage_ava_addval', 'checkbox', 'Validated').setDisplayType('disabled');
					}
					if(BaseRecordType != 'vendor')
					{
						form.addField('custpage_ava_latitude',	 'text',  'Latitude');
						form.addField('custpage_ava_longitude',	 'text',  'Longitude');
					}
				}
			}
			if(type == 'edit' || type == 'view')
			{
				if(AddressTab != null && BaseRecordType != 'vendor')
				{
					var filters = new Array();
					filters[0] = new nlobjSearchFilter('custrecord_ava_custid', null, 'anyof', nlapiGetRecordId());
					
					var cols = new Array();
					cols[0] = new nlobjSearchColumn('custrecord_ava_addid');
					cols[1] = new nlobjSearchColumn('custrecord_ava_latitude');
					cols[2] = new nlobjSearchColumn('custrecord_ava_longitude');
					cols[3] = new nlobjSearchColumn('custrecord_ava_custid');
					
					var searchresult = nlapiSearchRecord('customrecord_avacoordinates', null, filters, cols);		
					for(var k=0; k < nlapiGetLineItemCount('addressbook') && searchresult != null && searchresult.length > 0 ; k++)
					{
						var AddId = nlapiGetLineItemValue('addressbook', 'id', k+1);
						
						for(var m=0; m<searchresult.length; m++)
						{
							if(searchresult[m].getValue('custrecord_ava_addid') == AddId)
							{
								nlapiSetLineItemValue('addressbook', 'custpage_ava_latitude', k+1, searchresult[m].getValue('custrecord_ava_latitude'));
								nlapiSetLineItemValue('addressbook', 'custpage_ava_longitude', k+1, searchresult[m].getValue('custrecord_ava_longitude'));
							}
						}
					}
					
					if(type == 'edit')
					{
						form.addField('custpage_ava_coordinates', 'longtext', 'Coordinates');
						form.getField('custpage_ava_coordinates').setDisplayType('hidden');
						if(searchresult != null && searchresult.length > 0)
						{
							form.getField('custpage_ava_coordinates').setDefaultValue(JSON.stringify(searchresult));
						}
					}
				}
				
				if(AddressTab != null && (AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T'))
				{
					var filters = new Array();
					if(BaseRecordType == 'vendor')
					{
						filters[0] = new nlobjSearchFilter('custrecord_avavendorid', null, 'anyof', nlapiGetRecordId());
					}
					else
					{
						filters[0] = new nlobjSearchFilter('custrecord_avacustid', null, 'anyof', nlapiGetRecordId());
					}
					
					var cols = new Array();
					cols[0] = new nlobjSearchColumn('custrecord_ava_address_id');
					cols[1] = new nlobjSearchColumn('custrecord_ava_addressvalidated');
					cols[2] = new nlobjSearchColumn('custrecord_ava_custvendinternalid');
					
					var searchresult = nlapiSearchRecord('customrecord_avaaddvalflag', null, filters, cols);
					for(var k=0; k < nlapiGetLineItemCount('addressbook') && searchresult != null && searchresult.length > 0 ; k++)
					{
						var AddId = nlapiGetLineItemValue('addressbook', 'id', k+1);
						
						for(var m=0; m<searchresult.length; m++)
						{
							if(searchresult[m].getValue('custrecord_ava_address_id') == AddId)
							{
								nlapiSetLineItemValue('addressbook', 'custpage_ava_addval', k+1, searchresult[m].getValue('custrecord_ava_addressvalidated'));
							}
						}
					}
					
					if(type == 'edit')
					{
						form.addField('custpage_ava_addressvalidated', 'longtext', 'Address Validated');
						form.getField('custpage_ava_addressvalidated').setDisplayType('hidden');
						if(searchresult != null && searchresult.length > 0)
						{
							form.getField('custpage_ava_addressvalidated').setDefaultValue(JSON.stringify(searchresult));
						}
					}
				}
			}
		}
	}	
}

function AVA_CustomerBeforeLoad_Certs(type, form) //Certs
{
	var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	if(AVA_ExecutionContext == 'userinterface')		
	{
		if(nlapiGetField('custpage_ava_readconfig') == null)
		{
			form.addField('custpage_ava_readconfig','longtext','ConfigRecord');
			form.getField('custpage_ava_readconfig').setDisplayType('hidden');
			AVA_ReadConfig('1');	
		}
		else
		{
			if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
			{
				var LoadValues = AVA_LoadValuesFromField();
			}
		}
		
		form.setScript('customscript_avaentity_client');
		if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('AvaCert2Svc') != -1)
		{
			var AddressTab = form.getSubList('addressbook');
			if(AddressTab != null)
			{
				AddressTab.addField('custpage_ava_email', 'email', 'Email');
				
				if(type == 'edit' || type == 'view')
				{
					var filters = new Array();
					if(nlapiGetRecordType() == 'partner')
					{
						filters[0] = new nlobjSearchFilter('custrecord_avapartnerid', null, 'anyof', nlapiGetRecordId());
					}
					else
					{
						filters[0] = new nlobjSearchFilter('custrecord_avacustomerid', null, 'anyof', nlapiGetRecordId());
					}
					
					var cols = new Array();
					cols[0] = new nlobjSearchColumn('custrecord_ava_email');
					cols[1] = new nlobjSearchColumn('custrecord_avaaddressid');
					
					var searchresult = nlapiSearchRecord('customrecord_avacertemail', null, filters, cols);	
					
					if(type == 'edit')
					{
						var flag = 0; //Flag is declared to hide and show the button on Partner Record.
						if(nlapiGetRecordType() == 'partner' && AVA_CustomerCode != null && (AVA_CustomerCode == 0 || AVA_CustomerCode == 1 || AVA_CustomerCode == 2 || AVA_CustomerCode == 6))
						{
							flag = 1;
						}
						if(flag == 0)
						{
							AddressTab.addButton('custpage_ava_createcustomer','Add customer to CertCapture', "AVA_CreateCustomerAvaCert()");	
							AddressTab.addButton('custpage_ava_initiateexempt','Request exemption certificate', "AVA_InitiateExemptCert()");
							AddressTab.addButton('custpage_ava_getcertificates','Retrieve Certificate(s)', "AVA_GetCertificates()");
							AddressTab.addButton('custpage_ava_getcertificatestatus','Retrieve Certificate(s) Status', "AVA_CertificatesStatus()");
							
							var SelectCriteria = AddressTab.addField('custpage_ava_communicationmode','select','Communication Mode');
							SelectCriteria.addSelectOption('0','');
							SelectCriteria.addSelectOption('EMAIL','Email');
							SelectCriteria.addSelectOption('FAX','Fax');
							SelectCriteria.addSelectOption('MAIL','Mail');
							SelectCriteria.setDefaultValue('0');
			
							AddressTab.addField('custpage_ava_custommessage','textarea','Custom Message');
							
							form.addField('custpage_ava_emaillist', 'longtext', 'Email list');
							form.getField('custpage_ava_emaillist').setDisplayType('hidden');
							if(searchresult != null && searchresult.length > 0)
							{
								form.getField('custpage_ava_emaillist').setDefaultValue(JSON.stringify(searchresult));
							}
						}
					}
						
					for(var k=0; k < nlapiGetLineItemCount('addressbook') && searchresult != null && searchresult.length > 0 ; k++)
					{
						var AddId = nlapiGetLineItemValue('addressbook', 'id', k+1);
						
						for(var m=0; m<searchresult.length; m++)
						{
							if(searchresult[m].getValue('custrecord_avaaddressid') == AddId)
							{
								nlapiSetLineItemValue('addressbook', 'custpage_ava_email', k+1, searchresult[m].getValue('custrecord_ava_email'));
							}
						}
					}
				}
			}	
		}	
	}	
}

function AVA_CustomerBeforeSubmit(type)
{  
	if(nlapiGetFieldValue('custpage_ava_readconfig') == null)
	{
		AVA_ReadConfig('1');
	}
	else
	{
		if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
		{
			AVA_LoadValuesFromField();
		}
	}

	if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1)
	{	
		var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();			
	
		if ((type == 'create' || type == 'edit' || type == 'copy') && (AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet' || AVA_ExecutionContext == 'webstore'))
		{
			//Set Taxability of the Customer
			if(AVA_MarkCustTaxable != null && AVA_MarkCustTaxable != 0)
			{
				if(AVA_MarkCustTaxable == 1 || ((type == 'create' || type == 'copy') && AVA_MarkCustTaxable == 2) || (type == 'edit' && AVA_MarkCustTaxable == 3))
				{							
					nlapiSetFieldValue('taxable', 'T');
				}
			}					
			
			if(nlapiGetFieldValue('taxitem') == null || (nlapiGetFieldValue('taxitem') != null && nlapiGetFieldValue('taxitem').length <= 0))
			{
				//Set Customer TaxItem field	
				var AVA_DefaultOption = AVA_DefaultCustomerTaxcode;
	
				if(AVA_DefaultCustomerTaxcode != null && AVA_DefaultCustomerTaxcode != 0)
				{
					var AVA_SubsidiaryID = nlapiGetFieldValue('subsidiary');
					
					var filter = new Array();
					filter[0] = new nlobjSearchFilter('custrecord_ava_subsidiary', null, 'anyof', AVA_SubsidiaryID);
								
					var cols = new Array();
					cols[0] = new nlobjSearchColumn('custrecord_ava_subdeftaxcode');			
								
					var searchSub = nlapiSearchRecord('customrecord_avasubsidiaries', null, filter, cols);
					
					var TaxCodeID;
					if(searchSub != null)
					{
						for(var i = 0; i < Math.min(1, searchSub.length); i++)
						{
							TaxCodeID = searchSub[i].getValue('custrecord_ava_subdeftaxcode');
							break;
						}
					}
					
					TaxCodeID = (TaxCodeID != null && TaxCodeID.lastIndexOf('+') != -1) ? TaxCodeID.substring(parseFloat(TaxCodeID.lastIndexOf('+') + 1), TaxCodeID.length) : null;
					
					if(TaxCodeID != null)
					{
						if(AVA_DefaultCustomerTaxcode == 1 || ((type == 'create' || type == 'copy') && AVA_DefaultCustomerTaxcode == 2) || (type == 'edit' && AVA_DefaultCustomerTaxcode == 3))
						{
							nlapiSetFieldValue('taxitem', TaxCodeID);
						}
					}
				}						
				
			}						
		}				
	}
}

function AVA_CustomerAfterSubmit(type)
{
	if(nlapiGetFieldValue('custpage_ava_readconfig') == null)
	{
		AVA_ReadConfig('1');
	}
	else
	{
		if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
		{
			AVA_LoadValuesFromField();
		}
	}
	
	if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('TaxSvc') != -1)
	{	
		var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	
		if(AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet' || AVA_ExecutionContext == 'webstore')
		{
			if (type == 'create')
			{
				AVA_CreateExemptRecord();
				
				var CustRec = nlapiLoadRecord('customer',nlapiGetRecordId());
				
				if(nlapiGetFieldValue('target') == 'main:entity')
				{
					var UseCode = nlapiGetFieldValue('custpage_ava_entityusecode');
					if(UseCode != null && UseCode.length > 0 && CustRec.getLineItemValue('addressbook','id',1) != null && CustRec.getLineItemValue('addressbook','id',1).length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avaentityusemapping');
						record.setFieldValue('custrecord_ava_customerid', nlapiGetRecordId());
						record.setFieldValue('custrecord_ava_addressid', CustRec.getLineItemValue('addressbook','id',1));
						record.setFieldValue('custrecord_ava_entityusemap', UseCode);
						record.setFieldValue('custrecord_ava_custinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
				
				//var CustRec = nlapiLoadRecord('customer',nlapiGetRecordId());
				for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
				{
					var UseCode = nlapiGetLineItemValue('addressbook','custpage_ava_entityusecode',i+1);
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					
					if(UseCode != null && UseCode.length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avaentityusemapping');
						record.setFieldValue('custrecord_ava_customerid', nlapiGetRecordId());
						record.setFieldValue('custrecord_ava_addressid', AddId);
						record.setFieldValue('custrecord_ava_entityusemap', UseCode);
						record.setFieldValue('custrecord_ava_custinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
			}
			else if(type == 'edit')
			{		
				var searchresult;
				if(nlapiGetFieldValue('custpage_ava_entityusecodelist') != null && nlapiGetFieldValue('custpage_ava_entityusecodelist').length > 0)
				{
					searchresult = JSON.parse(nlapiGetFieldValue('custpage_ava_entityusecodelist'));
					for(var i = 0; searchresult != null && i < searchresult.length;)
					{
						var AVA_AddressIdDelete = 'F';
						for(var j=0; j < nlapiGetLineItemCount('addressbook'); j++)
						{
							if (searchresult[i].columns['custrecord_ava_addressid'] == nlapiGetLineItemValue('addressbook','id', j+1))
							{
								AVA_AddressIdDelete = 'T';	
								break;
							}
						}
						if(AVA_AddressIdDelete == 'F')
						{
							nlapiDeleteRecord('customrecord_avaentityusemapping', searchresult[i].id);
							searchresult.splice(i, 1);
							continue;
						}
						i++;
					}
				}
		
				var ExemptFlag = 'F';
				if(nlapiGetFieldValue('custpage_ava_exemptno') != null && nlapiGetFieldValue('custpage_ava_exemptno').length > 0)
				{
					var searchresult1 = JSON.parse(nlapiGetFieldValue('custpage_ava_exemptno'));
					var ExemptNo = nlapiGetFieldValue('custpage_ava_exemption');
					if(ExemptNo != null && ExemptNo.length > 0)
					{
						nlapiSubmitField('customrecord_avacustomerexemptmapping', searchresult1[0].id, 'custrecord_ava_exemptno', nlapiGetFieldValue('custpage_ava_exemption'));
						ExemptFlag = 'T';
					}
					else
					{
						nlapiDeleteRecord('customrecord_avacustomerexemptmapping', searchresult1[0].id);
						ExemptFlag = 'T';
					}
				}
				
				if(ExemptFlag == 'F')
				{
					AVA_CreateExemptRecord();			
				}
				
				var CustRec = nlapiLoadRecord('customer',nlapiGetRecordId());
				for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
				{
					var record, AVA_ExistFlag = 'F', AVA_ChangeFlag = 0, AVA_DelRecId;
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					var UseCode = nlapiGetLineItemValue('addressbook','custpage_ava_entityusecode', i+1);
					
					for(var customRec=0; searchresult != null && customRec < searchresult.length ; customRec++)
					{
						if(searchresult[customRec].columns['custrecord_ava_addressid'] == AddId)
						{
							if(UseCode != null && UseCode.length > 0)
							{
								if(searchresult[customRec].columns['custrecord_ava_entityusemap'] != UseCode)
								{															
									nlapiSubmitField('customrecord_avaentityusemapping', searchresult[customRec].id, 'custrecord_ava_entityusemap', UseCode);
									AVA_ChangeFlag = 1;//Record exisits but value changed
								}
								else
								{
									AVA_ChangeFlag = 2;//Record exisits but value is not changed
								}
							}
							else
							{
								AVA_DelRecId = searchresult[customRec].id;
								AVA_ChangeFlag = 3;//Record exists with blank value
							}
							
							AVA_ExistFlag = 'T';
							break;
						}
					}					
					
					if(UseCode != null && UseCode.length > 0)
					{
						if(AVA_ExistFlag == 'F' && AVA_ChangeFlag == 0)
						{
							record = nlapiCreateRecord('customrecord_avaentityusemapping');	
							record.setFieldValue('custrecord_ava_customerid', nlapiGetRecordId());
							record.setFieldValue('custrecord_ava_addressid', AddId);
							record.setFieldValue('custrecord_ava_entityusemap', UseCode);
							record.setFieldValue('custrecord_ava_custinternalid', nlapiGetRecordId());
							var recid = nlapiSubmitRecord(record);						
						}
					}
					else
					{						
						if(AVA_ExistFlag == 'T' && AVA_ChangeFlag == 3)
						{
							//Fix for Ticket 20060: In case of Scheculed scripts and Suitelet UseCode value is returning as null, as a result, mappings get deleted
							//which were done from UI, adding the if check to allow deletion to be done only when changes are being done from UI.
							if(AVA_ExecutionContext == 'userinterface')
							{							
								nlapiDeleteRecord('customrecord_avaentityusemapping', AVA_DelRecId);
							}
						}						
					}															
				}			
			
			}	
			else if(type == 'delete')
			{
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ava_custinternalid', null, 'is', nlapiGetRecordId());
		
				var searchresult = nlapiSearchRecord('customrecord_avaentityusemapping', null, filters, null);		
				for(var i=0; searchresult != null && i < searchresult.length; i++)
				{
					nlapiDeleteRecord('customrecord_avaentityusemapping', searchresult[i].getId());
				}
		
				var Exemptid = nlapiGetFieldValue('custpage_ava_exemptionid');
				if(Exemptid != null && Exemptid.length > 0)
				{
					nlapiDeleteRecord('customrecord_avacustomerexemptmapping', Exemptid);
				}
			}
		}
	}
}

function AVA_CustomerAfterSubmit_Address(type) //AddressSvc
{
	if(nlapiGetFieldValue('custpage_ava_readconfig') == null)
	{
		AVA_ReadConfig('1');
	}
	else
	{
		if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
		{
			AVA_LoadValuesFromField();
		}
	}

	if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('AddressSvc') != -1)
	{
		var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
		var BaseRecordType = nlapiGetFieldValue('baserecordtype');
		if(BaseRecordType != 'vendor' && (AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet'))
		{	
			if (type == 'create')
			{
				var CustRec = nlapiLoadRecord('customer', nlapiGetRecordId());
				if(nlapiGetFieldValue('target') == 'main:entity')
				{
					var Latitude = nlapiGetFieldValue('custpage_ava_latitude');
					var Longitude = nlapiGetFieldValue('custpage_ava_longitude');
					if(Latitude != null && Latitude.length > 0 && Longitude != null && Longitude.length > 0 && CustRec.getLineItemValue('addressbook','id',1) != null && CustRec.getLineItemValue('addressbook','id',1).length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avacoordinates');
						record.setFieldValue('custrecord_ava_custid', nlapiGetRecordId());
						record.setFieldValue('custrecord_ava_addid', CustRec.getLineItemValue('addressbook','id',1));
						record.setFieldValue('custrecord_ava_latitude', Latitude);
						record.setFieldValue('custrecord_ava_longitude', Longitude);
						record.setFieldValue('custrecord_ava_customerinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
				else
				{
					for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
					{
						var Latitude = nlapiGetLineItemValue('addressbook', 'custpage_ava_latitude', i+1);
						var Longitude = nlapiGetLineItemValue('addressbook','custpage_ava_longitude', i+1);
						var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
						
						if(Latitude != null && Latitude.length > 0 && Longitude != null && Longitude.length > 0)
						{
							var record = nlapiCreateRecord('customrecord_avacoordinates');
							record.setFieldValue('custrecord_ava_custid', nlapiGetRecordId());
							record.setFieldValue('custrecord_ava_addid', AddId);
							record.setFieldValue('custrecord_ava_latitude', Latitude);
							record.setFieldValue('custrecord_ava_longitude', Longitude);
							record.setFieldValue('custrecord_ava_customerinternalid', nlapiGetRecordId());
							var recid = nlapiSubmitRecord(record);
						}
					}
				}
			}
			else if(type == 'edit')
			{
				var searchresult;
				if(nlapiGetFieldValue('custpage_ava_coordinates') != null && nlapiGetFieldValue('custpage_ava_coordinates').length > 0)
				{
					searchresult = JSON.parse(nlapiGetFieldValue('custpage_ava_coordinates'));
					for(var i = 0; searchresult != null && i < searchresult.length;)
					{
						var AVA_AddressIdDelete = 'F';
						for(var j=0; j < nlapiGetLineItemCount('addressbook'); j++)
						{
							if (searchresult[i].columns['custrecord_ava_addid'] == nlapiGetLineItemValue('addressbook','id', j+1))
							{
								AVA_AddressIdDelete = 'T';	
								break;
							}
						}
						if(AVA_AddressIdDelete == 'F')
						{
							nlapiDeleteRecord('customrecord_avacoordinates', searchresult[i].id);
							searchresult.splice(i, 1);
							continue;
						}
						i++;
					}
				}
				
				var CustRec = nlapiLoadRecord('customer',nlapiGetRecordId());			
				for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
				{
					var record, AVA_ExistFlag = 'F', AVA_ChangeFlag = 0, AVA_DelRecId;
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					var Latitude = nlapiGetLineItemValue('addressbook','custpage_ava_latitude',i+1);
					var Longitude = nlapiGetLineItemValue('addressbook','custpage_ava_longitude',i+1);

					for(var customRec=0; searchresult != null && customRec < searchresult.length ; customRec++)
					{
						if(searchresult[customRec].columns['custrecord_ava_addid'] == AddId)
						{
							if(Latitude != null && Latitude.length > 0 && Longitude != null && Longitude.length > 0)
							{
								if(searchresult[customRec].columns['custrecord_ava_latitude'] != Latitude)
								{															
									nlapiSubmitField('customrecord_avacoordinates', searchresult[customRec].id, 'custrecord_ava_latitude', Latitude);
									AVA_ChangeFlag = 1;//Record exists but value changed
								}
								else
								{
									AVA_ChangeFlag = 2;//Record exisits but value is not changed
								}

								if(searchresult[customRec].columns['custrecord_ava_longitude'] != Longitude)
								{															
									nlapiSubmitField('customrecord_avacoordinates', searchresult[customRec].id, 'custrecord_ava_longitude', Longitude);
									AVA_ChangeFlag = 1;//Record exists but value changed
								}
								else
								{
									AVA_ChangeFlag = 2;//Record exisits but value is not changed
								}
							}
							else
							{
								AVA_DelRecId = searchresult[customRec].id;
								AVA_ChangeFlag = 3;//Record exists with blank value
							}
							
							AVA_ExistFlag = 'T';
							break;
						}
					}
					
					if(Latitude != null && Latitude.length > 0 && Longitude != null && Longitude.length > 0)
					{
						if(AVA_ExistFlag == 'F' && AVA_ChangeFlag == 0)
						{
							record = nlapiCreateRecord('customrecord_avacoordinates');	
							record.setFieldValue('custrecord_ava_custid', nlapiGetRecordId());
							record.setFieldValue('custrecord_ava_addid', AddId);
							record.setFieldValue('custrecord_ava_latitude', Latitude);
							record.setFieldValue('custrecord_ava_longitude', Longitude);
							record.setFieldValue('custrecord_ava_customerinternalid', nlapiGetRecordId());
							var recid = nlapiSubmitRecord(record);						
						}
					}
					else
					{						
						if(AVA_ExistFlag == 'T' && AVA_ChangeFlag == 3)
						{
							//Fix for Ticket 20060: In case of Scheculed scripts and Suitelet UseCode value is returning as null, as a result, mappings get deleted
							//which were done from UI, adding the if check to allow deletion to be done only when changes are being done from UI.
							if(AVA_ExecutionContext == 'userinterface')
							{							
								nlapiDeleteRecord('customrecord_avacoordinates', AVA_DelRecId);
							}
						}						
					}	
				}
			}	
			else if(type == 'delete')
			{
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ava_customerinternalid', null, 'is', nlapiGetRecordId());
		
				var searchresult = nlapiSearchRecord('customrecord_avacoordinates', null, filters, null);		
				for(var i=0; searchresult != null && i < searchresult.length; i++)
				{
					nlapiDeleteRecord('customrecord_avacoordinates', searchresult[i].getId());
				}
			}
		}
		
		if((AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T') && (AVA_ExecutionContext == 'userinterface' || AVA_ExecutionContext == 'userevent' || AVA_ExecutionContext == 'webservices' || AVA_ExecutionContext == 'csvimport' || AVA_ExecutionContext == 'scheduled' || AVA_ExecutionContext == 'suitelet'))
		{
			if(type == 'create')
			{
				var CustRec = nlapiLoadRecord(BaseRecordType, nlapiGetRecordId());
				
				if(nlapiGetFieldValue('target') == 'main:entity')
				{
					if(CustRec.getLineItemValue('addressbook','id',1) != null && CustRec.getLineItemValue('addressbook','id',1).length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avaaddvalflag');
						if(BaseRecordType == 'vendor')
						{
							record.setFieldValue('custrecord_avavendorid', nlapiGetRecordId());
						}
						else
						{
							record.setFieldValue('custrecord_avacustid', nlapiGetRecordId());
						}
						record.setFieldValue('custrecord_ava_address_id', CustRec.getLineItemValue('addressbook','id',1));
						record.setFieldValue('custrecord_ava_addressvalidated', nlapiGetFieldValue('custpage_ava_addval'));
						record.setFieldValue('custrecord_ava_custvendinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
				
				for(var i = 0; i < nlapiGetLineItemCount('addressbook'); i++)
				{
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					
					var record = nlapiCreateRecord('customrecord_avaaddvalflag');
					if(BaseRecordType == 'vendor')
					{
						record.setFieldValue('custrecord_avavendorid', nlapiGetRecordId());
					}
					else
					{
						record.setFieldValue('custrecord_avacustid', nlapiGetRecordId());
					}
					record.setFieldValue('custrecord_ava_address_id', CustRec.getLineItemValue('addressbook','id',i+1));
					record.setFieldValue('custrecord_ava_addressvalidated', nlapiGetLineItemValue('addressbook','custpage_ava_addval',i+1));
					record.setFieldValue('custrecord_ava_custvendinternalid', nlapiGetRecordId());
					var recid = nlapiSubmitRecord(record);
				}
			}
			else if (type == 'edit')
			{
				var searchresult;
				if(nlapiGetFieldValue('custpage_ava_addressvalidated') != null && nlapiGetFieldValue('custpage_ava_addressvalidated').length > 0)
				{
					searchresult = JSON.parse(nlapiGetFieldValue('custpage_ava_addressvalidated'));
					for(var i = 0; searchresult != null && i < searchresult.length;)
					{
						var AVA_AddressIdDelete = 'F';
						for(var j=0; j < nlapiGetLineItemCount('addressbook'); j++)
						{
							if(searchresult[i].columns['custrecord_ava_address_id'] == nlapiGetLineItemValue('addressbook','id', j+1))
							{
								AVA_AddressIdDelete = 'T';	
								break;
							}
						}
						if(AVA_AddressIdDelete == 'F')
						{
							nlapiDeleteRecord('customrecord_avaaddvalflag', searchresult[i].id);
							searchresult.splice(i, 1);
							continue;
						}
						i++;
					}
				}
				
				var CustRec = nlapiLoadRecord(BaseRecordType, nlapiGetRecordId());
				for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
				{
					var record, AVA_ExistFlag = 'F', AVA_ChangeFlag = 0, AVA_DelRecId;
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					
					for(var customRec=0; searchresult != null && customRec < searchresult.length ; customRec++)
					{
						if(searchresult[customRec].columns['custrecord_ava_address_id'] == AddId)
						{
							nlapiSubmitField('customrecord_avaaddvalflag', searchresult[customRec].id, 'custrecord_ava_addressvalidated', nlapiGetLineItemValue('addressbook','custpage_ava_addval',i+1));
							AVA_ExistFlag = 'T';
							break;
						}						
					}
					
					if(AVA_ExistFlag == 'F')
					{
						record = nlapiCreateRecord('customrecord_avaaddvalflag');	
						if(BaseRecordType == 'vendor')
						{
							record.setFieldValue('custrecord_avavendorid', nlapiGetRecordId());
						}
						else
						{
							record.setFieldValue('custrecord_avacustid', nlapiGetRecordId());
						}
						record.setFieldValue('custrecord_ava_address_id', AddId);
						record.setFieldValue('custrecord_ava_addressvalidated', nlapiGetLineItemValue('addressbook','custpage_ava_addval',i+1));
						record.setFieldValue('custrecord_ava_custvendinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);						
					}													
				}
			}
			else if(type == 'delete')
			{
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_ava_custvendinternalid', null, 'is', nlapiGetRecordId());
		
				var searchresult = nlapiSearchRecord('customrecord_avaaddvalflag', null, filters, null);		
				for(var i=0; searchresult != null && i < searchresult.length; i++)
				{
					nlapiDeleteRecord('customrecord_avaaddvalflag', searchresult[i].getId());
				}
			}
		}
	}
}

function AVA_CustomerAfterSubmit_Certs(type) //AvaCert2Svc
{
	var AVA_ExecutionContext = nlapiGetContext().getExecutionContext();
	if(AVA_ExecutionContext == 'userinterface')		
	{
		if(nlapiGetFieldValue('custpage_ava_readconfig') == null)
		{
			AVA_ReadConfig('1');
		}
		else
		{
			if(nlapiGetFieldValue('custpage_ava_readconfig') != null && nlapiGetFieldValue('custpage_ava_readconfig').length > 0)
			{
				AVA_LoadValuesFromField();
			}
		}
		
		if(AVA_ServiceTypes != null && AVA_ServiceTypes.search('AvaCert2Svc') != -1)
		{
			if(type == 'create')
			{
				var CustRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
				
				if(nlapiGetFieldValue('target') == 'main:entity')
				{
					var Email = nlapiGetFieldValue('custpage_ava_email');
					if(Email != null && Email.length > 0 && CustRec.getLineItemValue('addressbook','id',1) != null && CustRec.getLineItemValue('addressbook','id',1).length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avacertemail');
						if(nlapiGetRecordType() == 'partner')
						{
							record.setFieldValue('custrecord_avapartnerid', nlapiGetRecordId());
						}
						else
						{
							record.setFieldValue('custrecord_avacustomerid', nlapiGetRecordId());
						}
						record.setFieldValue('custrecord_avaaddressid', CustRec.getLineItemValue('addressbook','id',1));
						record.setFieldValue('custrecord_ava_email', Email);
						record.setFieldValue('custrecord_avacustinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
				
				for(var i = 0; i < nlapiGetLineItemCount('addressbook'); i++)
				{
					var Email = nlapiGetLineItemValue('addressbook', 'custpage_ava_email', i+1);
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					
					if(Email != null && Email.length > 0)
					{
						var record = nlapiCreateRecord('customrecord_avacertemail');
						if(nlapiGetRecordType() == 'partner')
						{
							record.setFieldValue('custrecord_avapartnerid', nlapiGetRecordId());
						}
						else
						{
							record.setFieldValue('custrecord_avacustomerid', nlapiGetRecordId());
						}
						record.setFieldValue('custrecord_avaaddressid', AddId);
						record.setFieldValue('custrecord_ava_email', Email);
						record.setFieldValue('custrecord_avacustinternalid', nlapiGetRecordId());
						var recid = nlapiSubmitRecord(record);
					}
				}
			}
			else if (type == 'edit')
			{
				var searchresult;
				if(nlapiGetFieldValue('custpage_ava_emaillist') != null && nlapiGetFieldValue('custpage_ava_emaillist').length > 0)
				{
					searchresult = JSON.parse(nlapiGetFieldValue('custpage_ava_emaillist'));
					for(var i = 0; searchresult != null && i < searchresult.length;)
					{
						var AVA_AddressIdDelete = 'F';
						for(var j=0; j < nlapiGetLineItemCount('addressbook'); j++)
						{
							if(searchresult[i].columns['custrecord_avaaddressid'] == nlapiGetLineItemValue('addressbook','id', j+1))
							{
								AVA_AddressIdDelete = 'T';	
								break;
							}
						}
						if(AVA_AddressIdDelete == 'F')
						{
							nlapiDeleteRecord('customrecord_avacertemail', searchresult[i].id);
							searchresult.splice(i, 1);
							continue;
						}
						i++;
					}
				}
				
				var CustRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
				for(var i=0; i<nlapiGetLineItemCount('addressbook'); i++)
				{
					var record, AVA_ExistFlag = 'F', AVA_ChangeFlag = 0, AVA_DelRecId;
					var AddId = CustRec.getLineItemValue('addressbook','id',i+1);
					var Email = nlapiGetLineItemValue('addressbook','custpage_ava_email', i+1);
					
					for(var customRec=0; searchresult != null && customRec < searchresult.length ; customRec++)
					{
						if(searchresult[customRec].columns['custrecord_avaaddressid'] == AddId)
						{
							if(Email != null && Email.length > 0)
							{
								if(searchresult[customRec].columns['custrecord_ava_email'] != Email)
								{															
									nlapiSubmitField('customrecord_avacertemail', searchresult[customRec].id, 'custrecord_ava_email', Email);
									AVA_ChangeFlag = 1;//Record exisits but value changed
								}
								else
								{
									AVA_ChangeFlag = 2;//Record exisits but value is not changed
								}
							}
							else
							{
								AVA_DelRecId = searchresult[customRec].id;
								AVA_ChangeFlag = 3;//Record exists with blank value
							}
							
							AVA_ExistFlag = 'T';
							break;
						}						
					}					
					
					if(Email != null && Email.length > 0)
					{
						if(AVA_ExistFlag == 'F' && AVA_ChangeFlag == 0)
						{
							record = nlapiCreateRecord('customrecord_avacertemail');	
							if(nlapiGetRecordType() == 'partner')
							{
								record.setFieldValue('custrecord_avapartnerid', nlapiGetRecordId());
							}
							else
							{
								record.setFieldValue('custrecord_avacustomerid', nlapiGetRecordId());
							}	
							record.setFieldValue('custrecord_avaaddressid', AddId);
							record.setFieldValue('custrecord_ava_email', Email);
							record.setFieldValue('custrecord_avacustinternalid', nlapiGetRecordId());
							var recid = nlapiSubmitRecord(record);						
						}
					}
					else
					{						
						if(AVA_ExistFlag == 'T' && AVA_ChangeFlag == 3)
						{					
							nlapiDeleteRecord('customrecord_avacertemail', AVA_DelRecId);
						}						
					}															
				}
			}
			else if(type == 'delete')
			{
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_avacustinternalid', null, 'is', nlapiGetRecordId());
		
				var searchresult = nlapiSearchRecord('customrecord_avacertemail', null, filters, null);		
				for(var i=0; searchresult != null && i < searchresult.length; i++)
				{
					nlapiDeleteRecord('customrecord_avacertemail', searchresult[i].getId());
				}
			}
		}
	}
}

function AVA_CreateExemptRecord()
{
	var ExemptNo = nlapiGetFieldValue('custpage_ava_exemption');
	if(ExemptNo != null && ExemptNo.length > 0)
	{
		var record = nlapiCreateRecord('customrecord_avacustomerexemptmapping');
		record.setFieldValue('custrecord_ava_exemptcustomerid', nlapiGetRecordId());
		record.setFieldValue('custrecord_ava_exemptno', nlapiGetFieldValue('custpage_ava_exemption'));
		var exemptid = nlapiSubmitRecord(record);
	}
}

function AVA_ValidateAddress(mode)
{
	if (AVA_EvaluateAddress(mode) == 1)
	{
		alert('Address Validation cannot be done. [Line1/Line2 and ZipCode] or [Line1/Line2, City, and State] is required.');
		return;
	}

	var config = nlapiGetFieldValue('custpage_ava_readconfig') == null ? AVA_ReadConfig('1') : AVA_LoadValuesFromField();  
	var webstoreFlag = (nlapiGetFieldValue('custpage_ava_context') == 'webstore') ? true : false;
	
	var response ;
	var security = AVA_TaxSecurity(AVA_AccountValue, AVA_LicenseKey);
	var headers = AVA_Header(security);
	var body = AVA_ValidateShipFromAddressBody(mode);
	var soapPayload = AVA_BuildEnvelope(headers + body);
	
	var soapHead = {};
	soapHead['Content-Type'] = 'text/xml';
	soapHead['SOAPAction'] = '"http://avatax.avalara.com/services/Validate"';
	
	try
	{		
		response = nlapiRequestURL(AVA_ServiceUrl + '/address/addresssvc.asmx', soapPayload, soapHead);
		
		if(response.getCode() == 200)
		{
			var soapText = response.getBody();
		    var soapXML = nlapiStringToXML(soapText);
	
			var ValidateResult = nlapiSelectNode(soapXML, "//*[name()='ValidateResult']");
			var ResultCode = nlapiSelectValue(ValidateResult, "//*[name()='ResultCode']");
			
			if(ResultCode == 'Success')
			{		
				var Line1 		= nlapiSelectValues( soapXML, "//*[name()='Line1']");
				var Line2 		= nlapiSelectValues( soapXML, "//*[name()='Line2']");
				var City  		= nlapiSelectValues( soapXML, "//*[name()='City']");
				var Region  	= nlapiSelectValue( soapXML, "//*[name()='Region']");
				var PostalCode  = nlapiSelectValues( soapXML, "//*[name()='PostalCode']");
				var Country  	= nlapiSelectValues( soapXML, "//*[name()='Country']");

				var StateCheck = AVA_CheckCountryName(Region);
				Country = (StateCheck[0] == 0 ? Region : Country);
				
				var confirmMsg = 'The Validated Address is: \n';
				confirmMsg += '\n' + Line1;
				confirmMsg += ((Line2[0] != null && Line2[0].length > 0) ? ('\n' + Line2) : Line2);
				confirmMsg += '\n' + City;
				confirmMsg += '\n' + Region;
				confirmMsg += '\n' + PostalCode;
				confirmMsg += '\n' + Country + '\n';
				confirmMsg += '\n Accept Validated Address?';
				
				if(confirm(confirmMsg))
				{
					if(mode == 0)
					{
						nlapiSetCurrentLineItemValue('addressbook', 'country', Country.toString());
						nlapiSetCurrentLineItemValue('addressbook', 'addr1', Line1.toString()); 
						nlapiSetCurrentLineItemValue('addressbook', 'addr2', Line2.toString());
						nlapiSetCurrentLineItemValue('addressbook', 'city', City.toString());
						nlapiSetCurrentLineItemValue('addressbook', 'zip', PostalCode.toString());
						nlapiSetCurrentLineItemValue('addressbook', 'state', Region.toString());
						if(AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T')
						{
							nlapiSetCurrentLineItemValue('addressbook', 'custpage_ava_addval', 'T');
						}
					}
					else if(mode == 1)
					{
						nlapiSetFieldValue('addr1', Line1);
						nlapiSetFieldValue('addr2', Line2);
						nlapiSetFieldValue('city', City);
						nlapiSetFieldValue('country', Country);
						nlapiSetFieldValue('zip', PostalCode);
						nlapiSetFieldValue('state', Region);
						if(AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T')
						{
							nlapiSetFieldValue('custpage_ava_addval', 'T');
						}
					}
					else if(mode == 2)
					{
						if(nlapiGetFieldValue('billaddresslist') != null && nlapiGetFieldValue('billaddresslist').length > 0)
						{
							var response = nlapiRequestURL( nlapiResolveURL('SUITELET', 'customscript_ava_recordload_suitelet', 'customdeploy_ava_recordload', webstoreFlag) + '&type=customeraddr&id=' + nlapiGetFieldValue('entity') + '&addid=' + nlapiGetFieldValue('billaddresslist') + '&line1=' + Line1 + '&line2=' + Line2 + '&city=' + City + '&zipcode=' + PostalCode + '&state=' + Region + '&country=' + Country, null, null );
							AVA_ValidFlag = 'T';
							nlapiSetFieldValue('billaddresslist', nlapiGetFieldValue('billaddresslist'), true);
							
							if(nlapiGetFieldValue('shipaddresslist') == nlapiGetFieldValue('billaddresslist'))
							{
								nlapiSetFieldValue('shipaddresslist',nlapiGetFieldValue('shipaddresslist'), true);
							}
					        AVA_ValidFlag = 'F';							
						}
						else
						{
							//For Custom Address
							nlapiSetFieldValue('billaddr1', Line1);
							nlapiSetFieldValue('billaddr2', Line2);
							nlapiSetFieldValue('billcity', City);
							nlapiSetFieldValue('billcountry', Country);
							nlapiSetFieldValue('billzip', PostalCode);
							nlapiSetFieldValue('billstate', Region);	

							var sbilladdress = (nlapiGetFieldValue('billattention') != null && nlapiGetFieldValue('billattention').length > 0) ? nlapiGetFieldValue('billattention') : '';
							sbilladdress += (nlapiGetFieldValue('billaddressee') != null && nlapiGetFieldValue('billaddressee').length > 0) ? (sbilladdress.length > 0) ? ('\n' + nlapiGetFieldValue('billaddressee')) : nlapiGetFieldValue('billaddressee') : '';
							sbilladdress += (sbilladdress.length > 0) ? ('\n' + Line1) : Line1;
							sbilladdress += ((Line2[0] != null && Line2[0].length > 0) ? ('\n' + Line2) : Line2);
							sbilladdress += '\n' + City + ' ' + Region + ' ' + PostalCode;
							sbilladdress += '\n' + Country;
							nlapiSetFieldValue('billaddress', sbilladdress);
						}
					}
					else if(mode == 3)
					{
						if(nlapiGetFieldValue('shipaddresslist') != null && nlapiGetFieldValue('shipaddresslist').length > 0)
						{
							var response = nlapiRequestURL( nlapiResolveURL('SUITELET', 'customscript_ava_recordload_suitelet', 'customdeploy_ava_recordload', webstoreFlag) + '&type=customeraddr&id=' + nlapiGetFieldValue('entity') + '&addid=' + nlapiGetFieldValue('shipaddresslist') + '&line1=' + Line1 + '&line2=' + Line2 + '&city=' + City + '&zipcode=' + PostalCode + '&state=' + Region + '&country=' + Country, null, null );
							AVA_ValidFlag = 'T';
							nlapiSetFieldValue('shipaddresslist', nlapiGetFieldValue('shipaddresslist'), true);

							if(nlapiGetFieldValue('billaddresslist') == nlapiGetFieldValue('shipaddresslist'))
							{
								nlapiSetFieldValue('billaddresslist',nlapiGetFieldValue('billaddresslist'), true);
							}
					        AVA_ValidFlag = 'F';							
						}
						else
						{
							nlapiSetFieldValue('shipaddr1', Line1);
							nlapiSetFieldValue('shipaddr2', Line2);
							nlapiSetFieldValue('shipcity', City);
							nlapiSetFieldValue('shipcountry', Country);
							nlapiSetFieldValue('shipzip', PostalCode);
							nlapiSetFieldValue('shipstate', Region);							
							
							//For Custom Address
							var sshipaddress = (nlapiGetFieldValue('shipattention') != null && nlapiGetFieldValue('shipattention').length > 0) ? nlapiGetFieldValue('shipattention') : '';
							sshipaddress += (nlapiGetFieldValue('shipaddressee') != null && nlapiGetFieldValue('shipaddressee').length > 0) ? (sshipaddress.length > 0) ? ('\n' + nlapiGetFieldValue('shipaddressee')) :  nlapiGetFieldValue('shipaddressee') : '';
							sshipaddress += (sshipaddress.length > 0) ? ('\n' + Line1) : Line1;
							sshipaddress += ((Line2[0] != null && Line2[0].length > 0) ? ('\n' + Line2) : Line2);
							sshipaddress += '\n' + City + ' ' + Region + ' ' + PostalCode;
							sshipaddress += '\n' + Country;
							nlapiSetFieldValue('shipaddress', sshipaddress);
						}
					}
				}
				else
				{
					if(AVA_EnableAddValFlag == true || AVA_EnableAddValFlag == 'T')
					{
						if(mode == 0)
						{
							nlapiSetCurrentLineItemValue('addressbook', 'custpage_ava_addval', 'F');
						}
						else if(mode == 1)
						{
							nlapiSetFieldValue('custpage_ava_addval', 'F');
						}
					}
				}
			}
			else
			{
				alert(nlapiSelectValue( ValidateResult, "//*[name()='Summary']"));
			}
		}	
	}
	catch(err)
	{
		alert('Address Validation was not Successful');
	}
}

function AVA_EvaluateAddress(mode)
{
	var AVALine1, AVALine2, AVACity, AVAState, AVAZip, AVACountry;
	if (mode == 0 || mode == 1)
	{
		AVALine1 = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','addr1') : nlapiGetFieldValue('addr1'));
		AVALine2 = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','addr2') : nlapiGetFieldValue('addr2'));
		AVACity  = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','city') : nlapiGetFieldValue('city'));
		AVAState = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','state') : nlapiGetFieldValue('state')); 
		AVAZip   = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','zip') : nlapiGetFieldValue('zip'));
		AVACountry = (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','country') : nlapiGetFieldValue('country'));
	}
	else
	{
		//Mode - 2 - Transaction Bill-To Address
		//Mode - 3 - Transaction Ship-To Address
		AVALine1 = (mode == 2 ? nlapiGetFieldValue('billaddr1') : nlapiGetFieldValue('shipaddr1'));
		AVALine2 = (mode == 2 ? nlapiGetFieldValue('billaddr2') : nlapiGetFieldValue('shipaddr2'));
		AVACity  = (mode == 2 ? nlapiGetFieldValue('billcity') : nlapiGetFieldValue('shipcity'));
		AVAState = (mode == 2 ? nlapiGetFieldValue('billstate') : nlapiGetFieldValue('shipstate'));
		AVAZip   = (mode == 2 ? nlapiGetFieldValue('billzip') : nlapiGetFieldValue('shipzip'));
		AVACountry = (mode == 2 ? nlapiGetFieldValue('billcountry') : nlapiGetFieldValue('shipcountry'));
	}

	if (AVACountry != null && AVACountry.length > 0 && (AVACountry == 'US' || AVACountry == 'CA'))
	{
		var bOption1 = (((AVALine1 != null && AVALine1.length > 0) || (AVALine2 != null && AVALine2.length > 0)) && (AVAZip != null && AVAZip.length > 0)) ? true : false;
		var bOption2 = (((AVALine1 != null && AVALine1.length > 0) || (AVALine2 != null && AVALine2.length > 0)) && (AVACity != null && AVACity.length > 0) && (AVAState != null && AVAState.length > 0)) ? true : false;

		if(bOption1 || bOption2)
		{
			return 0;
		}
		else
		{
			return 1;
		}
	}
	else
	{
		return 0;
	}
}

function AVA_ValidateShipFromAddressBody(mode)
{
 	var soap = null;
 	soap = '\t<soap:Body>\n';
 		soap += '\t\t<Validate xmlns="http://avatax.avalara.com/services">\n';
 			soap += '\t\t\t<ValidateRequest>\n';
 				soap += '\t\t\t\t<Address>\n';
 					soap += '\t\t\t\t\t<AddressCode>1</AddressCode>\n';
					if (mode == 0 || mode == 1)
					{
						soap += '\t\t\t\t\t<Line1><![CDATA[' + (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','addr1') : nlapiGetFieldValue('addr1')) + ']]></Line1>\n';
						soap += '\t\t\t\t\t<Line2><![CDATA[' + (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','addr2') : nlapiGetFieldValue('addr2')) + ']]></Line2>\n';
						soap += '\t\t\t\t\t<Line3/>\n';
						soap += '\t\t\t\t\t<City><![CDATA[' + (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','city') : nlapiGetFieldValue('city')) + ']]></City>\n';
						soap += '\t\t\t\t\t<Region><![CDATA[' + (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','state') : nlapiGetFieldValue('state')) + ']]></Region>\n';
						soap += '\t\t\t\t\t<PostalCode><![CDATA[' + (mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','zip') : nlapiGetFieldValue('zip')) + ']]></PostalCode>\n';
						var ReturnCountryName = AVA_CheckCountryName((mode == 0 ? nlapiGetCurrentLineItemValue('addressbook','country') : nlapiGetFieldValue('country')));
						soap += '\t\t\t\t\t<Country><![CDATA[' + ReturnCountryName[1] + ']]></Country>\n';
					}
					else
					{
						//Mode - 2 - Transaction Bill-To Address
						//Mode - 3 - Transaction Ship-To Address
						soap += '\t\t\t\t\t<Line1><![CDATA[' + (mode == 2 ? nlapiGetFieldValue('billaddr1') : nlapiGetFieldValue('shipaddr1')) + ']]></Line1>\n';
						soap += '\t\t\t\t\t<Line2><![CDATA[' + (mode == 2 ? nlapiGetFieldValue('billaddr2') : nlapiGetFieldValue('shipaddr2')) + ']]></Line2>\n';
						soap += '\t\t\t\t\t<Line3/>\n';
						soap += '\t\t\t\t\t<City><![CDATA[' + (mode == 2 ? nlapiGetFieldValue('billcity') : nlapiGetFieldValue('shipcity')) + ']]></City>\n';
						soap += '\t\t\t\t\t<Region><![CDATA[' + (mode == 2 ? nlapiGetFieldValue('billstate') : nlapiGetFieldValue('shipstate')) + ']]></Region>\n';
						soap += '\t\t\t\t\t<PostalCode><![CDATA[' + (mode == 2 ? nlapiGetFieldValue('billzip') : nlapiGetFieldValue('shipzip')) + ']]></PostalCode>\n';
						var ReturnCountryName = AVA_CheckCountryName((mode == 2 ? nlapiGetFieldValue('billcountry') : nlapiGetFieldValue('shipcountry')));
						soap += '\t\t\t\t\t<Country><![CDATA[' + ReturnCountryName[1] + ']]></Country>\n';
					}
 				soap += '\t\t\t\t</Address>\n';
				soap += '\t\t\t\t<TextCase>' + ((AVA_AddUpperCase == true || AVA_AddUpperCase == 'T') ? 'Upper' : 'Default') + '</TextCase>\n';
 				soap += '\t\t\t\t<Coordinates>false</Coordinates>\n';
 			soap += '\t\t\t</ValidateRequest>\n';
 		soap += '\t\t</Validate>\n';
 	soap += '\t</soap:Body>\n';
 	
 	return soap;
}

function AVA_EntitySave()
{
	//Check for required fields
	if (nlapiGetFieldValue('custrecord_ava_entityid') == null || nlapiGetFieldValue('custrecord_ava_entityid').length == 0)
	{
		alert('Required fields are not entered');
		return false;
	}
	
	//Check for name field, if blank populate Entity/Use Code ID before save
	if (nlapiGetFieldValue('name') != null && nlapiGetFieldValue('name').length > 0)
	{
		//Check if Name field equals Entity/Use Code ID
		if (nlapiGetFieldValue('name') != nlapiGetFieldValue('custrecord_ava_entityid'))
		{
			var retVal = confirm('Name field must be same as Entity/Use Code ID. Press Ok to change and save the record.');
			if (retVal == true)
			{
				nlapiSetFieldValue('name', nlapiGetFieldValue('custrecord_ava_entityid'));
			}
			else
			{
				return false;
			}
		}
	}
	else
	{
		nlapiSetFieldValue('name', nlapiGetFieldValue('custrecord_ava_entityid'));
	}

	//Check if the record already exists
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_ava_entityid', null, 'is', nlapiGetFieldValue('custrecord_ava_entityid'));
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_ava_entityid'); 

	var searchresult = nlapiSearchRecord('customrecord_avaentityusecodes', null, filters, columns);
	if (searchresult != null && searchresult.length > 0)
	{
		alert('The Entity/Use Code ID already exists. You must enter a unique Entity/Use Code ID for each record you create.');
		return false;
	}
	return true;
}