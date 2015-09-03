/*
* Copy of Vendor for Subsidiaries :
* @ AUTHOR : Abith Nitin
* @Release Date 9 Jan 2015
* @Release Number RLSE0050290 
* @version 1.0
 */
 var reqUrl = nlapiGetContext().getSetting('SCRIPT', 'custscript_requrl');
 //To create a Make Copy button in the vendor record and on click of button, suitelet will be called to show a mutliselect Subsidiary field
 function beforeLoad_addButton(type, form) {
	if(type == 'view') {
		var rectype = nlapiGetRecordType();
		var recId = nlapiGetRecordId();
		if(rectype == 'vendor') {
			var Url = nlapiResolveURL('SUITELET', 'customscript_splunk_copyvendor_su', 'customdeploy_splunk_copyvendor_su');
                Url += '&vendorId=' + nlapiGetRecordId()+'&rectype='+rectype;
                var copyvendor = reqUrl + Url;
			 var clickUrl = "window.open('" + copyvendor + "','_self')";
			form.addButton('custpage_buttoncopy', 'Make Copy', clickUrl);  
		}
	}
 }
 //New vendor is created for the selected subsidiaries
 function copyvendorReq(request, response) {

	if(request.getMethod() == 'GET') {// On page load Suitelet will be called to show the multiselect subsidiary.
		try {
		   var internalIds = new Array();
			var vendorId = request.getParameter('vendorId');
			var rectype = request.getParameter('rectype');
			nlapiLogExecution('DEBUG', 'rectype '+rectype, 'vendorId ' + vendorId);
			var form = nlapiCreateForm('Select Subsidiaries');
			 form.setScript('customscript_splunk_copyvendor_cs');
			var rec = nlapiLoadRecord(rectype,vendorId);  
			var selectSubsidiary = rec.getFieldValues('custentity_spk_copiedvendors');  // Get already copied subsidiary based on vendor
			var mainSubsidiary = rec.getFieldValue('subsidiary');
			if(selectSubsidiary)
			{
				for (var m=0;m<selectSubsidiary.length; m++)
				{
				   var internalId = nlapiLookupField(rectype,selectSubsidiary[m],'subsidiary');
				   nlapiLogExecution('DEBUG', 'internalId '+internalId);
				   internalIds.push(internalId);
				}
			}
			if(mainSubsidiary) // main subsidiary
			{
			internalIds.push(mainSubsidiary)
			}
			nlapiLogExecution('DEBUG', 'internalIds '+internalIds.length);
			var select = form.addField('custpage_subsidiaries','multiselect','Subsidiaries').setDisplaySize(500,10);  // multi select option
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('name');
			var filter = new Array();
			var n =0;
			if(selectSubsidiary || mainSubsidiary)  // filter by already existing subsidiary
			{
			 filter[n] = new nlobjSearchFilter('internalid',null,'noneof',internalIds);
			 n++;
			 filter[n] = new nlobjSearchFilter('isinactive',null,'is','F');
			 n++;
			 filter[n] = new nlobjSearchFilter('iselimination',null,'is','F');
			}
			var record = nlapiSearchRecord('subsidiary',null,filter,columns);  // get subsidiary 
			if(record)
			{
	            for (var i = 0 ;i<record.length; i++ )
				{
					var records = record[i];
					var internalId = records.getId();
					var name = records.getValue('name');
					select.addSelectOption(internalId,name); 

				}
			}	
			form.addField('custpage_vendor','text','Vendor').setDisplayType('hidden');
			form.getField('custpage_vendor').setDefaultValue(vendorId+"::"+rectype);
			form.addSubmitButton('Create Vendor Copies');                       
		
		response.writePage(form);
			
		}
		catch(e) {
			nlapiLogExecution('ERROR', 'Error', 'Error - Reason : ' + e.toString());
		}
	
	}
	//on click of create vendor copies button, new vendors will be copied with selected subsidiaries.
	else
	{
			var values = request.getParameterValues('custpage_subsidiaries');
			var venrec = request.getParameter('custpage_vendor');
			var vendorId = venrec.split('::')[0];
			var rectype = venrec.split('::')[1];
			var newRec = new Array();
			var oldRec = new Array()
			var finalRec = new Array()
			if(values)
			{
			
			for(var i in values)
			{
				var vendorrec = nlapiCopyRecord(rectype, parseInt(vendorId));
				var companyname = vendorrec.getFieldValue('companyname'); 
				if(companyname=='null' || companyname=='' || !companyname ) { companyname='';}
				
				
				vendorrec.setFieldValue('autoname','F');
				nlapiLogExecution('DEBUG','SUB',nlapiLookupField('subsidiary',values[i],'name'));
				var printCheck =nlapiLookupField(rectype,parseInt(vendorId),'entityid');
				vendorrec.setFieldValue('printoncheckas',printCheck);
				var subname = nlapiLookupField('subsidiary',values[i],'namenohierarchy'); 
				if(subname=='null' || subname=='' || !subname ) { subname='';}
				var type = vendorrec.getFieldValue('isperson'); 
				nlapiLogExecution('DEBUG','type',type);
				vendorrec.setFieldValue('subsidiary',values[i]);
				
				if(type =='T')
				{
				  
				  				
				  vendorrec.setFieldValue('entityid',printCheck + ' (' + subname + ')');
				}
				else
				{
				vendorrec.setFieldValue('companyname',companyname + ' (' + subname + ')');				
				vendorrec.setFieldValue('entityid',companyname + ' (' + subname + ')');
				}
				
				
				var id = nlapiSubmitRecord(vendorrec, true);
				newRec.push(id);
				
				var filters = new Array(); // get the contact records of vendor
				filters[0] = new nlobjSearchFilter('internalid','vendor','anyof',vendorId);
				
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('internalid');
				columns[1] = new nlobjSearchColumn('company');
				columns[2] = new nlobjSearchColumn('entityid');
				columns[3] = new nlobjSearchColumn('role');
				
				
				
				var contactRecord = nlapiSearchRecord('contact',null,filters,columns);
				if(contactRecord)
				{
				  for(var q=0;q<contactRecord.length;q++)
				  {
					nlapiLogExecution('DEBUG','contactRecord.length::',contactRecord.length);
					var records = contactRecord[q];
					var internalId = records.getId();
					 nlapiLogExecution('DEBUG','internalId',internalId);
					var recordType = records.getRecordType();
					var company = records.getText('company');
					var Role = records.getText('role');
					var entity = records.getValue('entityid');  
					if(internalId && Role != 'Primary Contact')
					{
						var contactrecord = nlapiCopyRecord(recordType, parseInt(internalId));  // copy the contact record
						var vendor= nlapiLoadRecord(rectype,id);
						var vendornames =vendor.getFieldValue('entityid');
						var subsidiary = vendor.getFieldText('subsidiary');
						contactrecord.setFieldValue('entityid',entity);
						contactrecord.setFieldValue('company',id);
						var contactrecordId =nlapiSubmitRecord(contactrecord);
						nlapiLogExecution('DEBUG','contactrecordId::',contactrecordId);
					}
				  }
				}
			}		
			var rec = nlapiLoadRecord(rectype,parseInt(vendorId));
			nlapiLogExecution('DEBUG','AGP','Loaded');
			oldRec = rec.getFieldValues('custentity_spk_copiedvendors');
			
				
				nlapiLogExecution('DEBUG','A',newRec.length);
			if(oldRec)
			{
				finalRec = newRec.concat(oldRec);
			}
			else
			{
			finalRec = newRec
			}
		    nlapiLogExecution('DEBUG','A',finalRec.length);
			rec.setFieldValues('custentity_spk_copiedvendors',finalRec);
			nlapiSubmitRecord(rec);
			
						
			}
          nlapiSetRedirectURL('RECORD',rectype,parseInt(vendorId));

	}
	
 }
 
 

