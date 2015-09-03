/*
* This script is used on After submit to calculate Tax in NS on create/update, request Sabrix through Cloudhub to return Tax Rate for each line item of Quote and Sales Order Transactions. 
* @AUTHOR : Vaibhav
* @Release Date : 18th July 2015
* @Release Number : RLSE0050406
* @Project Number : PRJ0051168
* @version 1.0
*/

var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixintegrationurl');
var authorizationHeader = 'Basic ' +  nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrix_authcode');
var sabrixTaxcode = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixtaxcode');

function sabrixintegrationUE(eventtype) {
	try {
		var callsabrix = 0;
		//Do No calculate Tax
		var donotcalculatetax = nlapiGetFieldValue('custbody_spk_donotcalculatetax');
		if(donotcalculatetax == 'T') {
			return;
		}
		//Call Sabrix request on Create and Update of Transactions
		if(eventtype == 'create' || eventtype == 'edit') {
			callsabrix = 1;
		
			var string1;
			string1 = '{ ';
			var action = '';
			var r = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
			var CustomerId = r.getFieldValue('entity');
			
			var CompanyCode = r.getFieldValue('custbody_spk_subsidiary_code');
			if(CompanyCode) {
				CompanyCode = CompanyCode;
			}
			else {
				CompanyCode = r.getFieldValue('subsidiary');
			}
			var transactionId = r.getFieldValue('id');
			nlapiLogExecution('DEBUG','Id',transactionId);
			var CompanyRole = "S";
			var DocType = r.getRecordType();
			var recType = DocType;
			
			var shiptoCustId = r.getFieldValue('custbody_end_user');
			var ShipToCustomerId = r.getFieldValue('custbody_spk_shiptocustomerid');
			var ShipToCustomerName = r.getFieldValue('custbody_spk_shiptocustomername');
			if(ShipToCustomerName) {
				ShipToCustomerName = escapeChar(r.getFieldValue('custbody_spk_shiptocustomername'));
			}
			var CustomerCode = r.getFieldValue('custbody_spk_billtocustomerid');
			var CustomerName = r.getFieldValue('custbody_spk_billtocustomername');
			if(CustomerName) {
				CustomerName = escapeChar(r.getFieldValue('custbody_spk_billtocustomername'));
			}

			var DocDateold = r.getFieldValue('trandate');
			var docdatesplit = DocDateold.split("/");
			var DocDate = docdatesplit[2]+"-"+docdatesplit[0]+"-"+docdatesplit[1];
			var FiscalDate = DocDate;
			var Client = "NetSuite";
			var DocCode = r.getFieldValue('tranid')+'_'+DocType;
			nlapiLogExecution('DEBUG','DocCode',DocCode);
			
			var Discount = r.getFieldValue('discounttotal');
			var CurrencyCode = r.getFieldText('currency');
			nlapiLogExecution('DEBUG','CurrencyCode',CurrencyCode);
			var Commit;
			if (DocType == 'salesorder' || DocType == 'Quote') {
				Commit = "N";
			}
			else {
				Commit = "Y";
			}
			var InvoiceCurrency = r.getFieldText('currency');
			var InvoiceAmount = r.getFieldValue('subtotal');
			var CustomerRegistrationNumber;
			
			var AddressCode1 = "01";
			var subsidiary = r.getFieldValue('subsidiary');
			var sub = r.getFieldValue('custbody_spk_entity_address'); // TAX ENTITY ADDRESS
			var subrec = sub.split('|');
			var subcity = subrec[0];
			var subregion = subrec[1];
			var subcountry = subrec[2];
			var subprovince = '';
			var subcode = subrec[3];
			var subcurrency = "USD" ; //subrec.getFieldValue('currency');
			nlapiLogExecution('DEBUG','subcity :'+subcity,' subregion :'+subregion+ ' subcountry :'+subcountry+ ' subprovince :'+subprovince+ ' subcode '+subcode );
			
			var AddressCode2 = "02";
			var shipaddress = r.getFieldValue('shipaddress');
			var shiptocity;
			var shiptoregion;
			var shiptocountry;
			var shiptocode;
			var shiptoprovince;
			var shipaddrsubrec = r.viewSubrecord('shippingaddress');
			if (shipaddrsubrec != null && shipaddrsubrec != '') {
				shiptocity = shipaddrsubrec.getFieldValue('city');
				shiptoregion = shipaddrsubrec.getFieldValue('state');
				shiptocountry = shipaddrsubrec.getFieldValue('country');
				shiptocode = shipaddrsubrec.getFieldValue('zip');
			}
			
			if (CompanyCode == null || CompanyCode == '') {
				CompanyCode = '""';
			}
			else {
				CompanyCode = '"'+CompanyCode+'"';
			}
			string1+= '"CompanyCode": ' +CompanyCode;
			
			if (CompanyRole == null || CompanyRole == '') {
				CompanyRole = '""';
			}
			else {
				CompanyRole = '"'+CompanyRole+'"';
			}
			string1+= ', "CompanyRole": ' +CompanyRole;
			
			if (ShipToCustomerId == null || ShipToCustomerId == '') {
					ShipToCustomerId = '""';
				}
			else {
				ShipToCustomerId = '"'+ShipToCustomerId+'"';
				}
			string1+= ', "ShipToCustomerId": ' +ShipToCustomerId;
				
			if (ShipToCustomerName == null || ShipToCustomerName == '') {
				ShipToCustomerName = '""';
				}
			else {
				ShipToCustomerName = '"'+ShipToCustomerName+'"';
				}
			string1+= ', "ShipToCustomerName": ' +ShipToCustomerName;
			
			if (DocType == null || DocType == '') {
				DocType = '""';
			}
			else {
				DocType = '"'+DocType+'"';
			}
			string1+= ', "DocType": ' +DocType;
			
			if (CustomerCode == null || CustomerCode == '') {
				CustomerCode = '""';
			}
			else {
				CustomerCode = '"'+CustomerCode+'"';
			}
			string1+= ', "CustomerCode": ' +CustomerCode;
			
			if (CustomerName == null || CustomerName == '') {
				CustomerName = '""';
			}
			else {
				CustomerName = '"'+CustomerName+'"';
			}
			string1+= ', "CustomerName": ' +CustomerName;
			
			if (DocDate == null || DocDate == '') {
				DocDate = '""';
			}
			else {
				DocDate = '"'+DocDate+'"';
			}
			string1+= ', "DocDate": ' +DocDate;
			
			if (FiscalDate == null || FiscalDate == '') {
				FiscalDate = '""';
			}
			else {
				FiscalDate = '"'+FiscalDate+'"';
			}
			string1+= ', "FiscalDate": ' +FiscalDate;
			
			if (Client == null || Client == '') {
				Client = '""';
			}
			else {
				Client = '"'+Client+'"';
			}
			string1+= ', "Client": ' +Client;
			
			if (DocCode == null || DocCode == '') {
				DocCode = '""';
			}
			else {
				DocCode = '"'+DocCode+'"';
			}
			string1+= ', "DocCode": ' +DocCode;

			if (Discount == null || Discount == '') {
				Discount = '""';
			}
			else {
				Discount = '"'+Discount+'"';
			}
			string1+= ', "Discount": ' +Discount;
			
			if (CurrencyCode == null || CurrencyCode == '') {
				CurrencyCode = '""';
			}
			else {
				CurrencyCode = '"'+CurrencyCode+'"';
			}
			string1+= ', "CurrencyCode": ' +CurrencyCode;
			
			Commit = '"'+Commit+'"';
			string1+= ', "IsCommit": ' +Commit;
			
			string1+= ', "OriginalInvoiceNumber": ""';
			string1+= ', "OriginalInvoiceDate": ""';
			
			if (InvoiceCurrency == null || InvoiceCurrency == '') {
				InvoiceCurrency = '""';
			}
			else {
				InvoiceCurrency = '"'+InvoiceCurrency+'"';
			}
			string1+= ', "InvoiceCurrency": ' +InvoiceCurrency;
		
			string1+= ', "FxRate": ""';
			
			if (InvoiceAmount == null || InvoiceAmount == '') {
				InvoiceAmount = '""';
			}
			else {
				InvoiceAmount = '"'+InvoiceAmount+'"';
			}
			string1+= ', "InvoiceAmount": ' +InvoiceAmount;

			string1+= ', "CustomerRegistrationNumber": ""';
			
			string1+= ', "Addresses": [{ '
			
			if (AddressCode1 == null || AddressCode1 == '')
				{
				AddressCode1 = '""';
				}
			else
				{
				AddressCode1 = '"'+AddressCode1+'"';
				}
			string1+= '"AddressCode": ' +AddressCode1;
				
			if (subcity == null || subcity == '')
				{
				subcity = '""';
				}
			else
				{
				subcity = '"'+subcity+'"';
				}
			string1+= ', "City": ' +subcity;
								
			if (subregion == null || subregion == '')
				{
				subregion = '""';
				}
			else
				{
				subregion = '"'+subregion+'"';
				}
			string1+= ', "Region": ' +subregion;
			
			if (subcountry == null || subcountry == '')
				{
				subcountry = '""';
				}
			else
				{
				subcountry = '"'+subcountry+'"';
				}
			string1+= ', "Country": ' +subcountry;
			
			if (subcode == null || subcode == '')
				{
				subcode = '""';
				}
			else
				{
				subcode = '"'+subcode+'"';
				}
			string1+= ', "PostalCode": ' +subcode;
			
			string1+= ', "Province": ""';
				
			string1+= ' }, { '
			
			if (AddressCode2 == null || AddressCode2 == '')
				{
				AddressCode2 = '""';
				}
			else
				{
				AddressCode2 = '"'+AddressCode2+'"';
				}
			string1+= '"AddressCode": ' +AddressCode2;
			
			if (shiptocity == null || shiptocity == '')
				{
				shiptocity = '""';
				}
			else
				{
				shiptocity = '"'+shiptocity+'"';
				}
			string1+= ', "City": ' +shiptocity;
			
			if (shiptoregion == null || shiptoregion == '')
				{
				shiptoregion = '""';
				}
			else
				{
				shiptoregion = '"'+shiptoregion+'"';
				}
			string1+= ', "Region": ' +shiptoregion;
			
			if (shiptocountry == null || shiptocountry == '')
				{
				shiptocountry = '""';
				}
			else
				{
				shiptocountry = '"'+shiptocountry+'"';
				}
			string1+= ', "Country": ' +shiptocountry;
			
				if (shiptocode == null || shiptocode == '')
				{
				shiptocode = '""';
				}
			else
				{
				shiptocode = '"'+shiptocode+'"';
				}
			string1+= ', "PostalCode": ' +shiptocode;
			
			string1+= ', "Province": ""';
			
			string1+= ' }], "Lines": [';
			
			var count = r.getLineItemCount('item');
			var isin = 0;
			for(i=1;i<count+1;i++) {
				var paramAvatax = '';
				var paramSabtax = ''
				if(sabrixTaxcode) {
					var paramTaxcode = sabrixTaxcode.split(",");
					if(paramTaxcode){
						paramSabtax = paramTaxcode[0];
						paramAvatax = paramTaxcode[1];
					}
					else {
						paramSabtax = sabrixTaxcode;
					}
				}
				
				var ItemId = r.getLineItemValue('item','item',i);
				var LastItemId = r.getLineItemValue('item','item',count);
				var TaxCode = r.getLineItemText('item','taxcode',i);
				nlapiLogExecution('DEBUG','TaxCode',TaxCode);
				
				var istax = '';
				if (ItemId != '-3' && (TaxCode == paramSabtax || TaxCode == paramAvatax))
				{
				
				nlapiLogExecution('DEBUG','type',type);
				var CommodityCode = nlapiGetLineItemValue('item','custcol_spk_commodity_taxcode',i);
				var ItemCodevalue = nlapiGetLineItemText('item','item',i);
				var itemintId = nlapiGetLineItemValue('item','item',i);
				var ItemCode = '';
				if(ItemCodevalue){
				var ItemCodeId = ItemCodevalue.split(":")[1];
				if(ItemCodeId) {
					ItemCode = ItemCodeId;
					}
				else {
					ItemCode = ItemCodevalue;
					}
				}
				var AccountingCode = nlapiGetLineItemValue('item','custcol_spk_itemincomeaccnum',i);
				var BundleFlag = r.getLineItemValue('item','custcol_bundle',i);
				var BaseBundleCode = r.getLineItemValue('item','custcol_spk_basebundlecode',i);
				var Description = r.getLineItemValue('item','description',i);
				if(Description) {
					Description = escapeChar(r.getLineItemValue('item','description',i));
				}
				var Qty = r.getLineItemValue('item','quantity',i);
				var Amount = r.getLineItemValue('item','amount',i);
				nlapiLogExecution('DEBUG','Amount',Amount);
				var DiscountAmount = r.getLineItemValue('item','custcol_salesforce_discount',i);
				var UOM = " ";
				if(isin == 1) 
					{
					istax = ' ,{ ';
					}
				else 
					{
					istax = ' { ';
					}
				isin = 1;
				var LineNo = '"'+i+'"';
				
				string1+= istax+'"LineNo": ' +LineNo;
				
				if (AccountingCode == null || AccountingCode == ''){
					AccountingCode = '""';
				}
				else{
					AccountingCode = '"'+AccountingCode+'"';
				}
				string1+= ', "AccountingCode": ' +AccountingCode;
				
				if (CommodityCode == null || CommodityCode == ''){
					CommodityCode = '""';
				}
				else{
					CommodityCode = '"'+CommodityCode+'"';
				}
				string1+= ', "TaxCode": ' +CommodityCode;
				
				if (ItemCode == null || ItemCode == ''){
					ItemCode = '""';
				}
				else{
					ItemCode = '"'+ItemCode+'"';
				}
				string1+= ', "ItemCode": ' +ItemCode;
				
				if (BundleFlag == 'T') { BundleFlag = '"Yes"'; }
					else { BundleFlag = '"No"'; }
					string1+= ', "BundleFlag": ' +BundleFlag;
				
				if (BaseBundleCode == null || BaseBundleCode == ''){
					BaseBundleCode = '""';
				}
				else{
					BaseBundleCode = '"'+BaseBundleCode+'"';
				}
				string1+= ', "BaseBundleCode": ' +BaseBundleCode;
				
				if (Description == null || Description == ''){
					Description = '""';
				}
				else{
					Description = '"'+Description+'"';
				}
				string1+= ', "Description": ' +Description;
				
				if(Qty == null || Qty == ''){
					Qty = '""';
				}
				else{
					Qty = '"'+Qty+'"';
				}
				string1+= ', "Qty": ' +Qty;

				if (Amount == null || Amount == ''){
					Amount = '""';
				}
				else{
					Amount = '"'+Amount+'"';
				}
				string1+= ', "Amount": ' +Amount;

				if (DiscountAmount) 
					{ 
					DiscountAmount = parseFloat(DiscountAmount);
					DiscountAmount = '"'+DiscountAmount+'"'; 
					}
				else 
					{ 
					DiscountAmount = '"0"';
					}
				
				string1+= ', "DiscountAmount": "0" ';
				
				if (UOM == null || UOM == ''){
					UOM = '""';
				}
				else{
					UOM = '"'+UOM+'"';
				}
				string1+= ', "UOM": ' +UOM;
				
				string1 = string1 + '}';

				}
			}
				
			string1+= ']}'
			nlapiLogExecution('DEBUG','String1',string1);
			
			var isSabrixError = r.getFieldValue('custbody_spk_sabrixtaxerrorflag');
			if(eventtype == 'edit') {
				callsabrix = changeinFields(r);
				if(isSabrixError == 'T') {
					callsabrix = 1;
				}
				nlapiLogExecution('DEBUG','callsabrix',callsabrix);
			}
			if(callsabrix == 1)	{
				//var url = "https://leadtoordersabrixstg.cloudhub.io/api/sabrix/calculateSalesTax";
				//var authorizationHeader = 'Basic Y29yZXN2Y3VzZXI6Y29yZXN2Y3B3ZCEy';

				nlapiLogExecution('DEBUG','Auth Key',authorizationHeader);
				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
				var y = nlapiRequestURL(url,string1,header,'POST');
				nlapiLogExecution('DEBUG','Response',y.getCode()+':::'+y.getBody());
				var response_obj = JSON.parse(y.getBody());
				var str = y.getBody();
				
				if(y.getCode() != '200'){
						r.setFieldValue('taxamountoverride',0);
						r.setFieldValue('custbody_spk_sabrixtaxerrorflag','T');
						r.setFieldValue('custbody_spk_sabrixtaxerrormessage',y.getBody().toString());
					}
					else if(y.getCode() == '200') {
					var CalculationDirection = response_obj.CalculationDirection;
					nlapiLogExecution('DEBUG','CalculationDirection ', CalculationDirection);	
					if(CalculationDirection == "R") {
						r.setFieldValue('taxamountoverride',0);
					}
					else {
						var spl = str.split('"LineNo":');
						var totaltax = str.split('"TotalTax":')[1].split('"')[1];
						r.setFieldValue('taxamountoverride',totaltax);
						r.setFieldValue('custbody_spk_sabrixtaxerrorflag','F');
						r.setFieldValue('custbody_spk_sabrixtaxerrormessage','');
						for(var i in spl) {
							if(i>0)
								{
								var Lineno = spl[i].split(",")[0];
								var Rate = parseFloat((spl[i].split('"Rate":')[1].split('"')[1] * 100))+'%';
								r.setLineItemValue('item','taxrate1',Lineno,Rate);
								}
						}
					}
					transactionId = nlapiSubmitRecord(r);
				}
				var ErrorRec = nlapiCreateRecord('customrecord_spk_sabrix_integration_log');
				ErrorRec.setFieldValue('custrecord_spk_trannumber',transactionId);
				ErrorRec.setFieldValue('custrecord_spk_transaction_type',recType);
				ErrorRec.setFieldValue('custrecord_spk_date_created',new Date());
				ErrorRec.setFieldValue('custrecord_spk_sabrixrequest',string1);
				ErrorRec.setFieldValue('custrecord_spk_sabrixresponse',y.getBody());
				if(y.getCode() != '200') {
					ErrorRec.setFieldValue('custrecord_spk_issabrixerror','T');
				}
				ErrorRec.setFieldValue('custrecord_spk_eventtype',eventtype);
				nlapiSubmitRecord(ErrorRec);
			}
		}
	}
	catch(e) {
		if(e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
			var syserror = e.getCode() + '\n' + e.getDetails();
			nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),['custbody_spk_sabrixtaxerrorflag','custbody_spk_sabrixtaxerrormessage'],['T', syserror]);
		}              
		else {   
			var syserror = e.getCode() + '\n' + e.getDetails();
			nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),['custbody_spk_sabrixtaxerrorflag','custbody_spk_sabrixtaxerrormessage'],['T', syserror]);                                        
		}  
	}
}

//function to call Sabrix Request to calculate tax only if below fields are changed
function changeinFields(currRecord) {
	var flag = 0;
	var oldrecord = nlapiGetOldRecord(); 
	nlapiLogExecution('DEBUG','customer ', currRecord.getFieldText('entity')+ ' : diff : '+oldrecord.getFieldText('entity'));
	if(currRecord.getFieldText('entity') != oldrecord.getFieldText('entity'))
	{ return flag = 1; }
	
	//nlapiLogExecution('DEBUG','exchangerate ', currRecord.getFieldValue('exchangerate')+ ' : diff : '+oldrecord.getFieldValue('exchangerate'));
	if(currRecord.getFieldValue('exchangerate') != oldrecord.getFieldValue('exchangerate')) 
	{ return flag = 1; }
	
	nlapiLogExecution('DEBUG','shipaddress ', currRecord.getFieldValue('shipaddress')+ ' : diff : '+oldrecord.getFieldValue('shipaddress'));
	if(currRecord.getFieldValue('shipaddress') != oldrecord.getFieldValue('shipaddress')) 
	{ return flag = 1; }
	
	//nlapiLogExecution('DEBUG','trandate ', currRecord.getFieldValue('trandate')+ ' : diff : '+oldrecord.getFieldValue('trandate'));
	if(currRecord.getFieldValue('trandate') != oldrecord.getFieldValue('trandate')) 
	{ return flag = 1; }
	
	//nlapiLogExecution('DEBUG','discounttotal ', currRecord.getFieldValue('discounttotal')+ ' : diff : '+oldrecord.getFieldValue('discounttotal'));
	if(currRecord.getFieldValue('discounttotal') != oldrecord.getFieldValue('discounttotal')) 
	{ return flag = 1; }
	
	nlapiLogExecution('DEBUG','subtotal ', currRecord.getFieldValue('subtotal')+ ' : diff : '+oldrecord.getFieldValue('subtotal'));
	if(currRecord.getFieldValue('subtotal') != oldrecord.getFieldValue('subtotal')) 
	{ return flag = 1; }
	
	nlapiLogExecution('DEBUG','itemcount ', currRecord.getLineItemCount('item')+ ' : diff : '+oldrecord.getLineItemCount('item'));
	if(currRecord.getLineItemCount('item') != oldrecord.getLineItemCount('item')) 
	{ return flag = 1; }
	
	if(currRecord.getLineItemCount('item') == oldrecord.getLineItemCount('item')) { //if count of old record and current record lines are same then compare their field values
		for( var n = 1; n <= currRecord.getLineItemCount('item'); n++) {
			var itemintId = currRecord.getLineItemValue('item','item',n);
			var olditemintId = oldrecord.getLineItemValue('item','item',n);
			nlapiLogExecution('DEBUG','itemintId ', itemintId+ ' : diff : '+olditemintId);
			if(itemintId != olditemintId) 
			{ return flag = 1; }
			var ItemCode = currRecord.getLineItemText('item','item',n);
			var oldItemCode = oldrecord.getLineItemText('item','item',n);
			if(ItemCode != 'Description'  && oldItemCode != 'Description') {
				var CommodityCode = currRecord.getLineItemValue('item','custcol_spk_commodity_taxcode',n);
				var oldCommodityCode = oldrecord.getLineItemValue('item','custcol_spk_commodity_taxcode',n);
				if(CommodityCode != oldCommodityCode) { return flag = 1; }
				
				var TaxCode = currRecord.getLineItemValue('item','taxcode',n);
				var oldTaxCode = oldrecord.getLineItemValue('item','taxcode',n);
				nlapiLogExecution('DEBUG','TaxCode ', TaxCode+ ' : diff : '+oldTaxCode);
				if(TaxCode != oldTaxCode) { return flag = 1; }
				
				var AccountingCode = currRecord.getLineItemValue('item','custcol_spk_itemincomeaccnum',n);
				var oldAccountingCode = oldrecord.getLineItemValue('item','custcol_spk_itemincomeaccnum',n);
				if(AccountingCode != oldAccountingCode) { return flag = 1; }
				
				var BundleFlag = currRecord.getLineItemValue('item','custcol_bundle',n);
				var oldBundleFlag = oldrecord.getLineItemValue('item','custcol_bundle',n);
				if(BundleFlag != oldBundleFlag) { return flag = 1; }
				
				var BaseBundleCode = currRecord.getLineItemValue('item','custcol_spk_basebundlecode',n);
				var oldBaseBundleCode = oldrecord.getLineItemValue('item','custcol_spk_basebundlecode',n);
				if(BaseBundleCode != oldBaseBundleCode) { return flag = 1; }
				
				var Amount = currRecord.getLineItemValue('item','amount',n);
				var oldAmount = oldrecord.getLineItemValue('item','amount',n);
				if(Amount != oldAmount) { return flag = 1; }
				
				//nlapiLogExecution('DEBUG','ItemCode :'+ItemCode,' CommodityCode :'+CommodityCode+ ' Amount :'+Amount+ ' BundleFlag :'+BundleFlag+' BaseBundleCode :'+BaseBundleCode);
				//nlapiLogExecution('DEBUG','oldItemCode :'+oldItemCode,' oldCommodityCode :'+oldCommodityCode+ ' oldAmount :'+oldAmount+ ' oldBundleFlag :'+oldBundleFlag+' oldBaseBundleCode :'+oldBaseBundleCode);
			}
		}
	}
	return flag;
}
//Function used to replace special characters for any string having these chars ","",\n,\r,\\,\t.
function escapeChar(s) {
	var val = '';
  if(s) {
		val =  s.replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/g," ").replace(/\\/g,"\\\\").replace(/\t/g, " ");
		return val;
	}
	else {
		return val;
	}
}