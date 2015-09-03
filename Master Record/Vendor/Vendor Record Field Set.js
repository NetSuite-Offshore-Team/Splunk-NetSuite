var Vendoraddressline_id ="";
function testsubrecordvendor(type){

	if(type== 'addressbook'){
		var recID=nlapiGetRecordId();
		if(recID == "" && Vendoraddressline_id == ""){
			var id = nlapiGetCurrentLineItemValue('addressbook', 'id');
			var def_Bill = nlapiGetCurrentLineItemValue('addressbook', 'defaultbilling');
			if(def_Bill=='T'){
				var addrSubrecord = nlapiViewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
				var country_code= addrSubrecord.getFieldValue('country');
				var country_id= countries_code_list[country_code];
				var addresse = addrSubrecord.getFieldValue('addressee');
				var address1 = addrSubrecord.getFieldValue('addr1');
				var address2 = addrSubrecord.getFieldValue('addr2');
				var city= addrSubrecord.getFieldValue('city');
				var state= addrSubrecord.getFieldValue('state');
				var zip= addrSubrecord.getFieldValue('zip');

				nlapiSetFieldValue('custentity_vendorcountrycode',country_id);
				nlapiSetFieldValue('custentity_vendorname',addresse);
				nlapiSetFieldValue('custentity_vendoraddline1',address1);
				nlapiSetFieldValue('custentity_vendoraddline2',address2);
				nlapiSetFieldValue('custentity_vendorstateprovince',state);
				nlapiSetFieldValue('custentity_vendorcity',city);
				nlapiSetFieldValue('custentity_vendorpostalcode',zip);
			}
		}
		if(recID == "" && Vendoraddressline_id != ""){
			var def_Bill = nlapiGetCurrentLineItemValue('addressbook', 'defaultbilling');
			if(def_Bill=='T'){
				alert("Please update the VPM Vendor Address fields if necessary")
			}
		}
		if(recID != ""&& Vendoraddressline_id != ""){
			var def_Bill = nlapiGetCurrentLineItemValue('addressbook', 'defaultbilling');
			if(def_Bill=='T'){
				alert("Please update the VPM Vendor Address fields if necessary")
			}
		}
	}
	return true;
}
function lineinitVendorAddress(type){
	if(type== 'addressbook'){
		var recID=nlapiGetRecordId();
		if(recID == ""){
			Vendoraddressline_id = nlapiGetCurrentLineItemIndex('addressbook');
		}
	}
}

function clientFieldChanged(type, name, linenum)
{  
	var recID=nlapiGetRecordId();
	if(recID == ""){  
		if(name == 'custentity_paymentmethod')
		{
			var paymentmethod= nlapiGetFieldText('custentity_paymentmethod');

			if(paymentmethod == 'IAC' ||  paymentmethod == 'IWI')
			{
				nlapiSetFieldValue('custentity_forex_ref_type',1);
			}
			else if(paymentmethod != 'IAC' ||  paymentmethod != 'IWI')
			{
				nlapiSetFieldValue('custentity_forex_ref_type',"");
			}
			if(paymentmethod == 'IAC')
			{
				nlapiSetFieldValue('custentity_interpayformat','DEP');
				nlapiSetFieldValue('custentity_paymentformat',5);
			}
			else if(paymentmethod != 'IAC') 
			{
				nlapiSetFieldValue('custentity_interpayformat',"");
			}
			if(paymentmethod == 'DAC')
			{
				nlapiSetFieldValue('custentity_paymentformat',4);
			}
			else if(paymentmethod != 'DAC' && paymentmethod != 'IAC')
			{
				nlapiSetFieldValue('custentity_paymentformat',"");
       
			}
		}

		if(name == 'custentity_forex_ref_type')
		{
			var forexreftype = nlapiGetFieldText('custentity_forex_ref_type');
			if(forexreftype == 'FI')
			{
				nlapiSetFieldValue('custentity_forex_ref_id','FV');
			}
			else
			{
				nlapiSetFieldValue('custentity_forex_ref_id',null);
			}
		}
		if (name == 'subsidiary')
		{
			var linevalue = nlapiGetFieldText('subsidiary');
			nlapiSetFieldValue('custentity_currency',linevalue);
		}	
		if (name == 'currency')
		{
			var linevalue = nlapiGetFieldText('currency');
			nlapiSetFieldValue('custentity_currency',linevalue);
		}
	}
}
