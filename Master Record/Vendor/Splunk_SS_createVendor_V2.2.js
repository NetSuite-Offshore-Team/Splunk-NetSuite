/**
 *	09/18/2012 Kalyani Chintala, DSG Case 29164
 * 	11/16/2012 Kalyani Chintala, DSG - Made changes to include individual type vendors
 * 	12/30/2013 Kalyani Chintala, DSG Case 37350
 *	10/28/2014 Rachael Tauber, Service Now ENHC0050171
 */

/*
 * @ Description: Setting the Default Payable accounts for vendors which are created from Pending Vendor custom record
 * @ AUTHOR : Abith Nitin
 * @Release Date : 10 April 2015
 * @Release Number : RLSE0050352 for Enhancement ENHC0050087 
 * @version 1.1
 */

/**
 * Added code to set the two newly added Custom Field(custrecord_spk_federal_tax_class & custrecord_spk_pvendor_w2doc ) values  to the vendor record.
 * @author Anchana sv
 * @Release Date 29th May 2015
 * @Release Number RLSE0050372
 * @Project ENHC0051561
 * @version 1.2
 */
/**
 * Added code to set the newly added Custom Field(custrecord_spk_federal_tax_class_other) value to the pending vendor record.
 * @author Anchana sv
 * @Release Date 26 June 2015
 * @Release Number :RLSE0050392
 * @Project ENHC0051862
 * @version 1.3
 */
 
 /**
 * Added code to set the Custom Fields value to the vendor record from pending vendor.
 * Added the Field changed function for the client script 'Pending Vendor Record Approval'.
 * @author Mukta Goyal/Anchana 
 * @Release Date
 * @Release Number 
 * @Project ENHC0051905
 * @version 1.4
 */



function beforeLoad(type, form, request)
{
	if(type == 'view')
	{
		if(nlapiGetFieldValue('custrecord_pvendor_vendor_id') == null || nlapiGetFieldValue('custrecord_pvendor_vendor_id') == '')
		{
			var filters = new Array();
			filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
			filters.push(new nlobjSearchFilter('custrecord_pvendor_approver_id', null, 'anyof', nlapiGetUser()));

			var results = nlapiSearchRecord('customrecord_pvendor_approver', null, filters);
			if(results != null && results != '')
			{
				form.addButton('custpage_approve', 'Approve', 'callCreateVendorSuitelet(' + nlapiGetRecordId() + ')');
				form.setScript('customscript_pending_vendor_rec_approval');
			}
		}
	}
}

function callCreateVendorSuitelet(id)
{
	if(id == null || id == '')
	{
		alert('You must page Id of Pending Vendor record!');
		return;
	}

	var url = nlapiResolveURL('SUITELET', 'customscript_create_vendor_frm_pvendor', 'customdeploy_create_vendor_frm_pvendor');
	url += '&pvendorid=' + id;
	var response = nlapiRequestURL(url);
	var body = response.getBody();
	if(body == null || body == '' || body.indexOf('Error') > -1)
	{
		alert('Cannot create Vendor record from this pending vendor. ' + body);
		return;
	}
	var url = nlapiResolveURL('RECORD', 'vendor', body);
	window.location = url;
}

function createVendor(request, response)
{
	var id = request.getParameter('pvendorid');
	if(id == null || id == '')
	{
		response.write('Error: You must pass Id of Pending Vendor record!');
		return;
	}

	try
	{
		nlapiLogExecution('Error', 'Checking', 'Starting......');
		var pVendor = nlapiLoadRecord('customrecord_pending_vendor', id);
		var vendorRec = nlapiCreateRecord('vendor');
		var cName = '';
		var pVType = pVendor.getFieldText('custrecord_pvendor_cidentity');
		if(pVType == 'Individual/Sole Proprietor')
		{
			vendorRec.setFieldValue('isperson', 'T');
			vendorRec.setFieldValue('firstname', pVendor.getFieldValue('custrecord_pvendor_fname'));
			vendorRec.setFieldValue('lastname', pVendor.getFieldValue('custrecord_pvendor_lname'));
			cName = pVendor.getFieldValue('custrecord_pvendor_fname') + ' ' + pVendor.getFieldValue('custrecord_pvendor_lname');
		}
		else
		{
			cName = pVendor.getFieldValue('custrecord_pvendor_cname') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_cname');
			vendorRec.setFieldValue('isperson', 'F');
			vendorRec.setFieldValue('companyname', cName);
		}

		vendorRec.setFieldValue('payablesaccount', 117);//ENHC0050087 Enhancement
		/*vendorRec.setFieldValue('isperson', 'F');
		vendorRec.setFieldValue('companyname', pVendor.getFieldValue('custrecord_pvendor_cname') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_cname'));*/
		vendorRec.setFieldValue('phone', pVendor.getFieldValue('custrecord_pvendor_phone') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_phone'));
		vendorRec.setFieldValue('subsidiary', pVendor.getFieldValue('custrecord_pvendor_subsidiary') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_subsidiary'));
		vendorRec.setFieldValue('email', pVendor.getFieldValue('custrecord_pvendor_email') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_email'));
		vendorRec.setFieldValue('printoncheckas', pVendor.getFieldValue('custrecord_pvendor_printoncheckas') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_printoncheckas'));
		vendorRec.setFieldValue('globalsubscriptionstatus', pVendor.getFieldValue('custrecord_pvendor_global_sub_status') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_global_sub_status'));
		vendorRec.setFieldValue('emailtransactions', pVendor.getFieldValue('custrecord_send_tx_via_email') == null ? '' : pVendor.getFieldValue('custrecord_send_tx_via_email'));
		vendorRec.setFieldValue('custentity_payment_type', pVendor.getFieldValue('custrecord20') == null ? '' : pVendor.getFieldValue('custrecord20'));
		vendorRec.setFieldValue('custentity_bank_information_if_wire', pVendor.getFieldValue('custrecord21') == null ? '' : pVendor.getFieldValue('custrecord21'));
		vendorRec.setFieldValue('custentity_beneficiary_name', pVendor.getFieldValue('custrecord22') == null ? '' : pVendor.getFieldValue('custrecord22'));
		vendorRec.setFieldValue('custentity_beneficiary_address', pVendor.getFieldValue('custrecord23') == null ? '' : pVendor.getFieldValue('custrecord23'));
		vendorRec.setFieldValue('custentity_bank_name', pVendor.getFieldValue('custrecord24') == null ? '' : pVendor.getFieldValue('custrecord24'));
		vendorRec.setFieldValue('custentity_bank_account_number', pVendor.getFieldValue('custrecord25') == null ? '' : pVendor.getFieldValue('custrecord25'));
		vendorRec.setFieldValue('custentity_bank_address', pVendor.getFieldValue('custrecord26') == null ? '' : pVendor.getFieldValue('custrecord26'));
		vendorRec.setFieldValue('custentity_aba_number', pVendor.getFieldValue('custrecord27') == null ? '' : pVendor.getFieldValue('custrecord27'));
		vendorRec.setFieldValue('custentity_bank_swift_code', pVendor.getFieldValue('custrecord28') == null ? '' : pVendor.getFieldValue('custrecord28'));
		vendorRec.setFieldValue('custentity_sort_routing_code', pVendor.getFieldValue('custrecord29') == null ? '' : pVendor.getFieldValue('custrecord29'));
		vendorRec.setFieldValue('custentity_remit_address1', pVendor.getFieldValue('custrecord33') == null ? '' : pVendor.getFieldValue('custrecord33'));
		vendorRec.setFieldValue('custentity_remit_address2', pVendor.getFieldValue('custrecord34') == null ? '' : pVendor.getFieldValue('custrecord34'));
		vendorRec.setFieldValue('custentity_remit_city', pVendor.getFieldValue('custrecord35') == null ? '' : pVendor.getFieldValue('custrecord35'));
		vendorRec.setFieldValue('custentity_remit_city_prov', pVendor.getFieldValue('custrecord36') == null ? '' : pVendor.getFieldValue('custrecord36'));
		vendorRec.setFieldValue('custentity_remit_country', pVendor.getFieldValue('custrecord37') == null ? '' : pVendor.getFieldValue('custrecord37'));
		
		
		/*ENHC0051905**********Start*/
		vendorRec.setFieldValue('custentity_bankstate', pVendor.getFieldValue('custrecord_addl_bank_4') == null ? '' : pVendor.getFieldValue('custrecord_addl_bank_4'));
		vendorRec.setFieldValue('custentity_bankcountrycode', pVendor.getFieldValue('custrecord_pvendor_bankcountrycode') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_bankcountrycode'));
		vendorRec.setFieldValue('custentity_bankpostcode', pVendor.getFieldValue('custrecord_addl_bank_3') == null ? '' : pVendor.getFieldValue('custrecord_addl_bank_3'));
		vendorRec.setFieldValue('custentity_bankcity', pVendor.getFieldValue('custrecord_addl_bank_2') == null ? '' : pVendor.getFieldValue('custrecord_addl_bank_2'));
		vendorRec.setFieldValue('custentity_bankname', pVendor.getFieldValue('custrecord24') == null ? '' : pVendor.getFieldValue('custrecord24'));
		vendorRec.setFieldValue('custentity_bankaddressline1', pVendor.getFieldValue('custrecord_addl_bank_1') == null ? '' : pVendor.getFieldValue('custrecord_addl_bank_1'));
		vendorRec.setFieldValue('custentity_vendorcity', pVendor.getFieldValue('custrecord35') == null ? pVendor.getFieldValue('custrecord_pvendor_city') : pVendor.getFieldValue('custrecord35'));
		vendorRec.setFieldValue('custentity_vendoraddline2', pVendor.getFieldValue('custrecord34') == null ? pVendor.getFieldValue('custrecord_pvendor_addr2') : pVendor.getFieldValue('custrecord34'));
		vendorRec.setFieldValue('custentity_vendorpostalcode', pVendor.getFieldValue('custrecord38') == null ? pVendor.getFieldValue('custrecord_pvendor_zip') : pVendor.getFieldValue('custrecord38'));
		vendorRec.setFieldValue('custentity_vendorcountrycode', pVendor.getFieldValue('custrecord37') == null ? pVendor.getFieldValue('custrecord_pvendor_country') : pVendor.getFieldValue('custrecord37'));		
		vendorRec.setFieldValue('custentity_vendoraddline1', pVendor.getFieldValue('custrecord33') == null ? pVendor.getFieldValue('custrecord_pvendor_addr1') : pVendor.getFieldValue('custrecord33'));
		vendorRec.setFieldValue('custentity_vendorstateprovince', pVendor.getFieldValue('custrecord36') == null ? pVendor.getFieldValue('custrecord_pvendor_state') : pVendor.getFieldValue('custrecord36'));
		vendorRec.setFieldValue('custentity_currency', pVendor.getFieldValue('custrecord_pvendor_currency') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_currency'));
		vendorRec.setFieldValue('custentity_recbankprimid', pVendor.getFieldValue('custrecord27') == null ? pVendor.getFieldValue('custrecord28') : pVendor.getFieldValue('custrecord27'));
		vendorRec.setFieldValue('custentity_recpartyaccount', pVendor.getFieldValue('custrecord25') == null ? pVendor.getFieldValue('custrecord_iban') : pVendor.getFieldValue('custrecord25'));
		vendorRec.setFieldValue('custentity_vendorbranchbankircid', pVendor.getFieldValue('custrecord29') == null ? '' : pVendor.getFieldValue('custrecord29'));
        vendorRec.setFieldValue('custentity_vendorname', pVendor.getFieldValue('custrecord_pvendor_printoncheckas') == null ? pVendor.getFieldValue('custrecord_pvendor_contact_name') : pVendor.getFieldValue('custrecord_pvendor_printoncheckas')); // Added by Anchana Sv
		var pvpaymenttype = pVendor.getFieldText('custrecord20');
		var pvcurrency = pVendor.getFieldText('custrecord_pvendor_currency');
		var pabano = pVendor.getFieldValue('custrecord27');
		var swiftcode = pVendor.getFieldValue('custrecord28');
		if(pabano != null && swiftcode == null)
		{
			vendorRec.setFieldValue('custentity_recbankprimidtype',1);
			
			
		}
		if(pabano == null && swiftcode != null)
		{
			vendorRec.setFieldValue('custentity_recbankprimidtype',2);
			
			
		}
		if(pvpaymenttype == 'Check')
		{
			vendorRec.setFieldValue('custentity_paymentmethod',6);
		}
		if(pvpaymenttype == 'Wire Transfer' && pvcurrency == 'USD')
		{
			vendorRec.setFieldValue('custentity_paymentmethod',4);
		}
		if(pvpaymenttype == 'Wire Transfer' && pvcurrency != 'USD')
		{
			vendorRec.setFieldValue('custentity_paymentmethod',5);
		}
		if(pvpaymenttype == 'ACH' && pvcurrency == 'USD')
		{
			vendorRec.setFieldValue('custentity_paymentmethod',1);
			var forexreftype = vendorRec.setFieldValue('custentity_forex_ref_type',1);
			vendorRec.setFieldValue('custentity_paymentformat',4);
		}
		if(pvpaymenttype == 'ACH' && pvcurrency != 'USD')
		{
			vendorRec.setFieldValue('custentity_paymentmethod',3);
			vendorRec.setFieldValue('custentity_forex_ref_type',1);
			vendorRec.setFieldValue('custentity_interpayformat','DEP');
			vendorRec.setFieldValue('custentity_paymentformat',5);
		}
		else if(pvpaymenttype != 'ACH' ){
			vendorRec.setFieldValue('custentity_forex_ref_type',null);
			//vendorRec.setFieldValue('custentity_interpayformat',"");
		}
		if(vendorRec.getFieldValue('custentity_paymentmethod') == 'IAC'){
			vendorRec.setFieldValue('custentity_interpayformat','DEP');
		}if(vendorRec.getFieldValue('custentity_paymentmethod') != 'IAC'){
				vendorRec.setFieldValue('custentity_interpayformat',"");
		}
		
		var forexreftype = vendorRec.getFieldValue('custentity_forex_ref_type')
		if(forexreftype == 1)
			{
			vendorRec.setFieldValue('custentity_forex_ref_id','FV');
			
		}
		else {
			vendorRec.setFieldValue('custentity_forex_ref_id',"");
		}
	   
			
		
		/*ENHC0051905***********End*/
		
		/*ENHC0051561 Added by Anchana SV for setting the two newly added custom fields in the pending Vendor Record*/
		vendorRec.setFieldValue('custentity_spk_federal_tax_class', pVendor.getFieldValue('custrecord_spk_federal_taxclassification') == null ? '' : pVendor.getFieldValue('custrecord_spk_federal_taxclassification'));
		vendorRec.setFieldValue('custentity_spk_financial_w2_document', pVendor.getFieldValue('custrecord_spk_pvendor_w2doc') == null ? '' : pVendor.getFieldValue('custrecord_spk_pvendor_w2doc'));
		/*ENHC0051561 Added by Anchana SV for setting the two newly added custom fields in the pending Vendor Record*/
		/*ENHC0051862 Added by Anchana SV for setting the newly added 'other' custom field in the pending Vendor Record*/
		vendorRec.setFieldValue('custentity_spk_federal_tax_other', pVendor.getFieldValue('custrecord_spk_federal_tax_class_other') == null ? '' : pVendor.getFieldValue('custrecord_spk_federal_tax_class_other'));	
		/*ENHC0051862 Added by Anchana SV for setting the newly added 'other' custom field in the pending Vendor Record*/		
		vendorRec.setFieldValue('custentity_accounting_contact_name', pVendor.getFieldValue('custrecord39') == null ? '' : pVendor.getFieldValue('custrecord39'));
		vendorRec.setFieldValue('custentity_print_on_check_as', pVendor.getFieldValue('custrecord_pvendor_printoncheckas') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_printoncheckas'));
		vendorRec.setFieldValue('custentity_iat_sec_code', pVendor.getFieldValue('custrecord_iat_sec_code') == null ? '' : pVendor.getFieldValue('custrecord_iat_sec_code'));
		vendorRec.setFieldValue('custentity_iban', pVendor.getFieldValue('custrecord_iban') == null ? '' : pVendor.getFieldValue('custrecord_iban'));
		vendorRec.setFieldValue('custentity_vendorselected', pVendor.getFieldValue('custrecord41') == null ? '' : pVendor.getFieldValue('custrecord41'));
		vendorRec.setFieldValue('custentity_diverse_supplier', pVendor.getFieldValue('custrecord_diverse_supplier') == null ? '' : pVendor.getFieldValue('custrecord_diverse_supplier'));
		vendorRec.setFieldValue('url', pVendor.getFieldValue('custrecord_webaddress') == null ? '' : pVendor.getFieldValue('custrecord_webaddress'));
		vendorRec.setFieldValue('custentity_vendorrequestor', pVendor.getFieldValue('custrecord18') == null ? '' : pVendor.getFieldValue('custrecord18'));
		vendorRec.setFieldValue('category', pVendor.getFieldValue('custrecord_vendorcat') == null ? '' : pVendor.getFieldValue('custrecord_vendorcat'));
		vendorRec.setFieldValue('terms', pVendor.getFieldValue('custrecord52') == null ? '' : pVendor.getFieldValue('custrecord52'));
		vendorRec.setFieldValue('custentity_related_third_party', pVendor.getFieldValue('custrecord_related_third_party') == null ? '' : pVendor.getFieldValue('custrecord_related_third_party'));
		vendorRec.selectNewLineItem('addressbook');

		//vendorRec.setCurrentLineItemValue('addressbook', 'addressee', pVendor.getFieldValue('custrecord_pvendor_addressee') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_addressee'));
		vendorRec.setCurrentLineItemValue('addressbook', 'addressee', cName == null ? '' : cName);
		vendorRec.setCurrentLineItemValue('addressbook', 'addr1', pVendor.getFieldValue('custrecord_pvendor_addr1') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_addr1'));
		vendorRec.setCurrentLineItemValue('addressbook', 'addr2', pVendor.getFieldValue('custrecord_pvendor_addr2') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_addr2'));
		vendorRec.setCurrentLineItemValue('addressbook', 'city', pVendor.getFieldValue('custrecord_pvendor_city') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_city'));
		vendorRec.setCurrentLineItemText('addressbook', 'country', pVendor.getFieldValue('custrecord_pvendor_country') == null ? '' : pVendor.getFieldText('custrecord_pvendor_country'));
		vendorRec.setCurrentLineItemText('addressbook', 'state', pVendor.getFieldValue('custrecord_pvendor_state') == null ? '' : pVendor.getFieldText('custrecord_pvendor_state'));
		vendorRec.setCurrentLineItemValue('addressbook', 'zip', pVendor.getFieldValue('custrecord_pvendor_zip') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_zip'));
		vendorRec.commitLineItem('addressbook');

		vendorRec.setFieldValue('currency', pVendor.getFieldValue('custrecord_pvendor_currency') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_currency'));
		vendorRec.setFieldValue('taxidnum', pVendor.getFieldValue('custrecord_pvendor_federal_taxid') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_federal_taxid'));
		nlapiLogExecution('Error', 'Checking', 'Submitting Vendor Rec');
		var vId = nlapiSubmitRecord(vendorRec, true, true);
		nlapiLogExecution('Error', 'Checking', 'Vendor Rec Id - ' + vId);
		nlapiSubmitField('customrecord_pending_vendor', id, ['custrecord_pvendor_vendor_id', 'isinactive'], [vId, 'T']);

		//Adding files from Pending Vendor
		var filters = new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', pVendor.getId()));
		filters.push(new nlobjSearchFilter('internalid', 'file', 'noneof', '@NONE@'));

		var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid', 'file'));

		var files = nlapiSearchRecord('customrecord_pending_vendor', null, filters, columns);
		nlapiLogExecution('Error', 'Checking', 'Files - ' + files);
		if(!(files == null || files == ''))
		{
			nlapiLogExecution('Error', 'Checking', 'Files Count - ' + files.length);
			for(var i=0; i < files.length; i++)
			{
				var fileId = files[i].getValue('internalid', 'file');
				nlapiLogExecution('Error', 'Checking', 'File Id - ' + fileId);
				nlapiAttachRecord('file', fileId, 'vendor', vId);
			}
		}

		if(pVType != 'Individual/Sole Proprietor')
		{
			nlapiLogExecution('Error', 'Checking', 'Starting Contact');
			if(cName != null && cName != '')
			{
				var contact = nlapiCreateRecord('contact');
				contact.setFieldValue('entityid', pVendor.getFieldValue('custrecord_pvendor_contact_name') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_contact_name'));
				contact.setFieldValue('subsidiary', pVendor.getFieldValue('custrecord_pvendor_subsidiary') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_subsidiary'));
				contact.setFieldValue('phone', pVendor.getFieldValue('custrecord_pvendor_phone') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_phone'));
				contact.setFieldValue('email', pVendor.getFieldValue('custrecord_pvendor_email') == null ? '' : pVendor.getFieldValue('custrecord_pvendor_email'));
				nlapiLogExecution('Error', 'Checking', 'Setting Company Fld!');
				contact.setFieldValue('company', vId);
				nlapiLogExecution('Error', 'Checking', 'Submitting Contact!');
				nlapiSubmitRecord(contact, true, true);
			}
		}
		response.write(vId);
		return;
	}
	catch(er)
	{
		nlapiLogExecution('Error', 'Checking', 'Error: ' + er.toString());
		var error = '';
		nlapiLogExecution('Error', 'Checking', typeof(er));
		if(er instanceof nlobjError)
			error += 'Error: ' + er.getDetails();
		else
			error += 'Error: ' + (er == null ? 'Unexpected error occured!' : er.toString());

		response.write(error);
		return;
	}
}

function customOnSave()
{
	var pVType = nlapiGetFieldValue('custrecord_pvendor_cidentity');
	var error = new Array();
	if(pVType == '2')
	{
		var fname = nlapiGetFieldValue('custrecord_pvendor_fname');
		var lname = nlapiGetFieldValue('custrecord_pvendor_lname');
		if(fname == null || fname == '')
			error[error.length] = 'First Name if Individual\n';
		if(lname == null || lname == '')
			error[error.length] = 'Last Name if Individual\n';
	}
	else
	{
		var cname = nlapiGetFieldValue('custrecord_pvendor_cname');
		if(cname == null || cname == '')
			error[error.length] = 'Name if Company\n';
	}
	if(error.length > 0)
	{
		var er = 'You must enter values for following fields\n';
		for(var i=0; i < error.length; i++)
			er += error[i];
		alert(er);
		return false;
	}
	return true;
}

//To block duplicate Pending Vendor Approver record creation
function customOnSaveApprover()
{
	
	if(nlapiGetRecordId() == null || nlapiGetRecordId() == '')
	{
		var appr = nlapiGetFieldValue('custrecord_pvendor_approver_id');
		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_pvendor_approver_id', null, 'anyof', appr));
		filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

		var results = nlapiSearchRecord('customrecord_pvendor_approver', null, filters);
		if(results != null && results != '')
		{
			alert('Approver record with this Approver is already created, no need for new one.');
			return false;
		}
	}
	return true;
}
/*ENHC0051905**********Start*/
/*This function mainly used for disable and enable the ABN NUMBER,BANK SWIFT CODE custom fields*/
function SP_FinancialInfo(type,name)
{
	if (name == 'custrecord27')
	{
		var linevalue = nlapiGetFieldValue('custrecord27');
		if (linevalue)
		{
			nlapiDisableField('custrecord28',true);
		}
		else
		{ nlapiDisableField('custrecord28',false);}
	}
	if (name == 'custrecord28')
	{
		var linevalue1 = nlapiGetFieldValue('custrecord28');
		if (linevalue1)
		{
			nlapiDisableField('custrecord27',true);
		}
		else{
			nlapiDisableField('custrecord27',false);}
	}
}
/*ENHC0051905***********End*/