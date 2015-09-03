/*
* This script is to create a button "Calculate Tax" which is to calculate Tax in NS on edit, request Sabrix through Cloudhub to return Tax Rate for each line item of Quote, Sales Order, Invoice, Cash Sale, Credit Memo & Cash Refund Transactions. 
* @AUTHOR : Vaibhav
* @Release Date : 18th July 2015
* @Release Number : RLSE0050406
* @Project Number : PRJ0051168
* @version 1.0
*/
/*
* Script changes on calculate button click to set Tax on transaction. ENHC0051967 - Make the script parameter for tax codes editable.
* @AUTHOR : Unitha Rangam
* @Release Date : 21st Aug 2015
* @Release Number : RLSE0050414
* @Project Number : ENHC0051967
* @version 1.1
*/
var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixintegrationurl');
var authorizationHeader = 'Basic ' +  nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrix_authcode');
var sabrixTaxcode = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixtaxcode');

function sabrixintegrationclient()
	{
	var donotcalculatetax = nlapiGetFieldValue('custbody_spk_donotcalculatetax');
	if(donotcalculatetax == 'F') 
        {
		//Since ID is not generated, not commiting the record and hence passing dummy value for Id.
		var id = "To be Generated";
		var customer = nlapiGetFieldText('entity');
		//Popping an alert if customer is not selected.
		if (customer == null || customer == '')
			{
			alert("Please select the customer.");
			}
		else
			{
			//Retrieving Subsidiary address info from the custom field created.
			var subsidiaryaddr = nlapiGetFieldValue('custbody_spk_entity_address').split("|");
			var subcity = subsidiaryaddr[0];
			var subregion = subsidiaryaddr[1];
			var subcountry = subsidiaryaddr[2];
			var subprovince = subsidiaryaddr[1];
			var subcode = subsidiaryaddr[3];
			var AddressCode1 = "01";
			var AddressCode2 = "02";
			var CompanyRole = "S";
			var DocType = nlapiGetRecordType();
			//Getting customer number by breaking entity value.
			var transactionId = nlapiGetRecordId();
			//Getting Customer name by breating entity value.
			
			var ShipToCustomerId = nlapiGetFieldValue('custbody_spk_shiptocustomerid');
			var ShipToCustomerName = nlapiGetFieldValue('custbody_spk_shiptocustomername');
			if(ShipToCustomerName) {
				ShipToCustomerName = escapeChar(nlapiGetFieldValue('custbody_spk_shiptocustomername'));
			}
			var CustomerCode = nlapiGetFieldValue('custbody_spk_billtocustomerid');
			var CustomerName = nlapiGetFieldValue('custbody_spk_billtocustomername');
			if(CustomerName) {
				CustomerName = escapeChar(nlapiGetFieldValue('custbody_spk_billtocustomername'));
			}
			var CompanyCode = nlapiGetFieldValue('custbody_spk_subsidiary_code');
			if(CompanyCode) {
				CompanyCode = CompanyCode;
			}
			else {
				CompanyCode = nlapiGetFieldValue('subsidiary');
			}
			var DocDateold = nlapiGetFieldValue('trandate');
			var docdatesplit = DocDateold.split("/");
			var DocDate = docdatesplit[2]+"-"+docdatesplit[0]+"-"+docdatesplit[1];
			var FiscalDate = DocDate;
			var Client = "NetSuite";
			var DocCode = nlapiGetFieldValue('tranid')+'_'+DocType;
			var Discount = nlapiGetFieldValue('discounttotal');
			var CurrencyCode = nlapiGetFieldText('currency');
			//Passing Commit Flag as "N" as we do not want a document to be created in Sabrix for the client script
			var Commit = '';
			if (DocType == 'salesorder' || DocType == 'Quote') {
				Commit = "N";
			}
			else {
				Commit = "Y";
			}
			var InvoiceCurrency = nlapiGetFieldText('currency');
			var InvoiceAmount = nlapiGetFieldValue('subtotal');
			var CustomerRegistrationNumber = "1234567";
			var shiptoregion = nlapiGetFieldValue('shipstate');
			var shiptocountry = nlapiGetFieldValue('shipcountry');
			var shiptocode = nlapiGetFieldValue('shipzip');
			var shiptoprovince = nlapiGetFieldValue('shipstate');
			
			var createdfrom = nlapiGetFieldValue('createdfrom');

			var OriginalInvoiceNumber = '';
			var OriginalInvoiceDate = '';
			
			if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
		  
			var refundRec = '';
			if(createdfrom && nlapiGetRecordType() == 'creditmemo') {
			  refundRec = nlapiLoadRecord('invoice', createdfrom);
			}
			if(createdfrom && nlapiGetRecordType() == 'cashrefund') {
			  refundRec = nlapiLoadRecord('cashsale', createdfrom);
			}
			if(refundRec) {
				OriginalInvoiceNumber = refundRec.getFieldValue('tranid');
				var orgtranDate = refundRec.getFieldValue('trandate');
			
				if(orgtranDate) {
					var orgtranDateSplit = orgtranDate.split("/");
					var OrgInvDate = orgtranDateSplit[2]+"-"+orgtranDateSplit[0]+"-"+orgtranDateSplit[1];
					OriginalInvoiceDate = OrgInvDate;
					}
				}
			}

			//Checking that the Ship to address is present.
			if ((shiptoregion == '' || shiptoregion == null) || (shiptocode == '' || shiptocode == null))
				{
				alert('Shipping State/Zip Code is missing in the address. Please complete the same.');
				}
			else
				{
				var shipadr = nlapiGetFieldValue('shipaddress');
				var shipadr1 = shipadr.split("\n");
				var srtlen = shipadr1.length;
				//Getting the city selected for shipping
				var shiptocity = shipadr1[srtlen-1].split(shiptocode)[0].split(shiptoregion)[0];
				var string1;
				
				//Creating JSON header info part to send all the header level JSON info
				string1 = '{ ';
				
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
			
				if (OriginalInvoiceNumber) { OriginalInvoiceNumber = '"'+OriginalInvoiceNumber+'"'; }
				else { OriginalInvoiceNumber = '""'; }
				string1+= ', "OriginalInvoiceNumber": ' +OriginalInvoiceNumber;

				if (OriginalInvoiceDate) { OriginalInvoiceDate = '"'+OriginalInvoiceDate+'"'; }
				else { OriginalInvoiceDate = '""'; }
				string1+= ', "OriginalInvoiceDate": ' +OriginalInvoiceDate;
				
				if (InvoiceCurrency == null || InvoiceCurrency == '') {
					InvoiceCurrency = '""';
				}
				else {
					InvoiceCurrency = '"'+InvoiceCurrency+'"';
				}
				string1+= ', "InvoiceCurrency": ' +InvoiceCurrency;
			
				string1+= ', "FxRate": ""';
				
				if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund')
					{
					InvoiceAmount = parseFloat(InvoiceAmount * -1);
					}
				
				if (InvoiceAmount == null || InvoiceAmount == '') {
					InvoiceAmount = '""';
				}
				else {
					InvoiceAmount = '"'+InvoiceAmount+'"';
				}
				string1+= ', "InvoiceAmount": ' +InvoiceAmount;
				
				if (CustomerRegistrationNumber == null || CustomerRegistrationNumber == ''){
					CustomerRegistrationNumber = '""';
				}
				else {
					CustomerRegistrationNumber = '"'+CustomerRegistrationNumber+'"';
				}
				string1+= ', "CustomerRegistrationNumber": ' +CustomerRegistrationNumber;
				
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
				
				string1+= ', "Province": ' +subregion;
					
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
				
				string1+= ', "Province": ' +shiptoregion;
				
				string1+= ' }], "Lines": [';
				//End of JSON created to collect header level info.
				
				var count = nlapiGetLineItemCount('item');
				var isin = 0;
				if (count == null || count == '')
					{
					alert("Please select the item to calculate tax");
					}
				else
					{
					for(i=1;i<count+1;i++) {
						var TaxCode = nlapiGetLineItemText('item','taxcode',i);
						// ENHC0051967- Dynamic validation of script parameters for tax codes editable - Begin
						var isparamtaxcode = 0;
						if(sabrixTaxcode) {
							var paramTaxcode = sabrixTaxcode.split(",");
							for(var y = 0; y<=paramTaxcode.length; y++) {
								if(TaxCode == paramTaxcode[y]) {
									isparamtaxcode = 1;
								}
							}
						}
						// ENHC0051967- End
						var ItemId = nlapiGetLineItemValue('item','item',i);
						var ItemCodevalue = nlapiGetLineItemText('item','item',i);
						var ItemType = nlapiGetLineItemValue('item','itemtype',i);
						var ItemCode = '';
						if(ItemCodevalue) {
							var ItemCodeId = ItemCodevalue.split(":")[1];
							if(ItemCodeId) {
								ItemCode = ItemCodeId;
							}
							else {
								ItemCode = ItemCodevalue;
							}
						}
						// ENHC0051967- End
						nlapiLogExecution('DEBUG','TaxCode '+TaxCode, ' sabrixTaxcode '+sabrixTaxcode+ ' isparamtaxcode '+isparamtaxcode);
						if (ItemType != 'Description' && isparamtaxcode == 1)
							{
							var CommodityCode = nlapiGetLineItemValue('item','custcol_spk_commodity_taxcode',i);;
							var AccountingCode = "";
							var BundleFlag = nlapiGetLineItemValue('item','custcol_bundle',i);
							var BaseBundleCode = nlapiGetLineItemValue('item','custcol_spk_basebundlecode',i);
							var Description = nlapiGetLineItemValue('item','description',i);
							if(Description) {
								Description = escapeChar(nlapiGetLineItemValue('item','description',i));
							}
							var Qty = nlapiGetLineItemValue('item','quantity',i);
							var DiscountAmount = nlapiGetLineItemValue('item','custcol_salesforce_discount',i);
							var Amount = nlapiGetLineItemValue('item','amount',i);
							
							var sfdcunitCost = nlapiGetLineItemValue('item','custcol_spk_sfdc_unit_cost',i);
							if(sfdcunitCost) {
								Amount = parseFloat(sfdcunitCost*Qty);
							}
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
							
							//Creating and appending JSON to collect line items info.
							string1+= istax+'"LineNo": ' +LineNo;
							
							if (AccountingCode == null || AccountingCode == '')
								{
								AccountingCode = '""';
								}
							else
								{
								AccountingCode = '"'+AccountingCode+'"';
								}
							string1+= ', "AccountingCode": ' +AccountingCode;
							
							if (CommodityCode == null || CommodityCode == '')
								{
								CommodityCode = '""';
								}
							else
								{
								CommodityCode = '"'+CommodityCode+'"';
								}
							string1+= ', "TaxCode": ' +CommodityCode;
							
							if (ItemCode == null || ItemCode == '')
								{
								ItemCode = '""';
								}
							else
								{
								ItemCode = '"'+ItemCode+'"';
								}
							string1+= ', "ItemCode": ' +ItemCode;
							
							if (BundleFlag == 'T') { BundleFlag = '"Yes"'; }
							else { BundleFlag = '"No"'; }
							string1+= ', "BundleFlag": ' +BundleFlag;
							
							if (BaseBundleCode == null || BaseBundleCode == '')
								{
								BaseBundleCode = '""';
								}
							else
								{
								BaseBundleCode = '"'+BaseBundleCode+'"';
								}
							string1+= ', "BaseBundleCode": ' +BaseBundleCode;
							
							if (Description == null || Description == '')
								{
								Description = '""';
								}
							else
								{
								Description = '"'+Description+'"';
								}
							string1+= ', "Description": ' +Description;
							
							if (Qty == null || Qty == '')
								{
								Qty = '""';
								}
							else
								{
								Qty = '"'+Qty+'"';
								}
							string1+= ', "Qty": ' +Qty;
							
							if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
								Amount = parseFloat(Amount * -1);
								}
					

							if (Amount == null || Amount == '')
								{
								Amount = '"0"';
								}
							else
								{
								Amount = '"'+Amount+'"';
								}
							string1+= ', "Amount": ' +Amount;
							
							if (DiscountAmount) 
								{ 
								DiscountAmount = parseFloat(DiscountAmount);
								DiscountAmount = '"'+DiscountAmount+'"'; 
								}
							else { 
								DiscountAmount = '"0"';
								}
							string1+= ', "DiscountAmount": "0" ' ;
							
							if (UOM == null || UOM == '')
								{
								UOM = '""';
								}
							else
								{
								UOM = '"'+UOM+'"';
								}
							string1+= ', "UOM": ' +UOM;
							
							string1 = string1 + '}';

							}
						}	
					string1+= ']}';
					//JSON file created and ready to sent to cloudhub
					nlapiLogExecution('DEBUG','string1',string1);
					
					//var url = "https://leadtoordersabrixstg.cloudhub.io/api/sabrix/calculateSalesTax";
					//var authorizationHeader = 'Basic Y29yZXN2Y3VzZXI6Y29yZXN2Y3B3ZCEy';
					var header = new Array();
					header['Authorization'] = authorizationHeader;
					header['Accept'] = 'application/json';
					header['Content-Type'] = 'application/json';
					//Posting the JSON with header params to Cloudhub
					var y = nlapiRequestURL(url,string1,header,'POST');
					var n = y.getCode();
					var str = y.getBody();
					nlapiLogExecution('DEBUG','str',str);
					
					var response_obj = JSON.parse(y.getBody());
					//If there is no error setting the Tax rate as calculated to the respective lines
					if(n == 200)
					{
						var CalculationDirection = response_obj.CalculationDirection;
						if(CalculationDirection == "R") 
						{
							nlapiSetFieldValue('taxamountoverride',0);
						}
						else {
							var spl = str.split('"LineNo":');
							var totaltax = str.split('"TotalTax":')[1].split('"')[1];
							if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund')
							{
							totaltax = parseFloat(totaltax * -1);
							}
							nlapiSetFieldValue('taxamountoverride',totaltax);
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrorflag','F');
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrormessage','');
							var TaxHeader = nlapiGetFieldValue('taxamountoverride');
							for(var i in spl)
							{
							if(i>0)
								{
								var Lineno = spl[i].split(",")[0];
								var Rate = parseFloat((spl[i].split('"Rate":')[1].split('"')[1] * 100))+'%';
								nlapiSelectLineItem('item',Lineno);
								nlapiSetCurrentLineItemValue('item','taxrate1',Rate,true,true);
								nlapiCommitLineItem('item');
								}
							}
						}
					}
					
					//If there is an error, showing a pop up to user with the error message as received					
					else
						{
						if(n != 200)
							{
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrorflag','T');
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrormessage',str);
							var statuserrormsg = str.split('"systemErrorMessage":')[1].split('"')[1] + str.split('"systemErrorMessage":')[1].split('"statusMessage":')[1].split('"')[1]; 
							alert(statuserrormsg);
							}
						}
					}
				}
			}
		}
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