/*
* This script is used on before submit to handle exceptions to avoid any error that occurs to calculate Tax in NS on create/update, request Sabrix through Cloudhub to return Tax Rate for each line item of Invoice, Cash Sale, Credit Memo and Cash Refund Transactions. 
* @AUTHOR : Unitha Rangam
* @Release Date : 18th July 2015
* @Release Number : RLSE0050406
* @Project Number : PRJ0051168
* @version 1.0
*/
/*
* Script changes on before submit to calculate and set Tax in NS on create/update. 
* DFCT0050827 - The cash sales created with credit card to be charged on before submit for cybersource processing.
* ENHC0051967 - Make the script parameter for tax codes editable.
* @AUTHOR : Unitha Rangam
* @Release Date : 21st Aug 2015
* @Release Number : RLSE0050414
* @Project Number : ENHC0051967, DFCT0050827
* @version 1.1
*/
var sabrixurl = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixintegrationurl');
var authorizationHeader = 'Basic ' +  nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrix_authcode');
var sabrixTaxcode = nlapiGetContext().getSetting('SCRIPT','custscript_spk_sabrixtaxcode');

function sabrixBeforeSubmit(eventtype) {
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
			
			var shiptoCustId = nlapiGetFieldValue('custbody_end_user');
			var CustomerId = nlapiGetFieldValue('entity');
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
			
			var createdfrom = nlapiGetFieldValue('createdfrom');
			nlapiLogExecution('DEBUG','createdfrom',createdfrom);
		
			var ExemptionNo = nlapiGetFieldValue('tranid');

			var FxRate = nlapiGetFieldValue('exchangerate');
			//For Non-US country, we need to consider Customer Registration Number for VAT calculation
			var CustomerRegistrationNumber = "";
			
			//Ship From : Subsidiary Address
			var AddressCode1 = "01";
			var subsidiary = nlapiGetFieldValue('subsidiary');
			var sub = nlapiGetFieldValue('custbody_spk_entity_address'); // TAX ENTITY ADDRESS
			var subrec = sub.split('|');
			var subcity = subrec[0];
			var subregion = subrec[1];
			var subcountry = subrec[2];
			var subprovince = '';
			var subcode = subrec[3];
			var subcurrency = "USD" ; //subrec.getFieldValue('currency');
			nlapiLogExecution('DEBUG','subcity :'+subcity,' subregion :'+subregion+ ' subcountry :'+subcountry+ ' subprovince :'+subprovince+ ' subcode '+subcode );
			
			//Ship TO : Customer/Invoice Shipping Address
			var AddressCode2 = "02";
			var shipaddress = nlapiGetFieldValue('shipaddress');
			nlapiLogExecution('DEBUG','shipaddress',shipaddress);
			
			var shiptocity = '';
			var shiptoregion = '';
			var shiptocountry = '';
			var shiptocode = '';
			var shiptoprovince = '';
			shiptocity = nlapiGetFieldValue('shipcity');
			shiptoregion = nlapiGetFieldValue('shipstate');
			shiptocountry = nlapiGetFieldValue('shipcountry');
			shiptocode = nlapiGetFieldValue('shipzip');
			nlapiLogExecution('DEBUG','shiptocity1 :'+shiptocity,' shiptoregion :'+shiptoregion+ ' shiptocountry :'+shiptocountry+ ' shiptocode :'+shiptocode+ ' shiptoprovince '+shiptoprovince );
			
			var CompanyCode = nlapiGetFieldValue('custbody_spk_subsidiary_code');
			if(CompanyCode) {
				CompanyCode = CompanyCode;
			}
			else {
				CompanyCode = nlapiGetFieldValue('subsidiary');
			}
			if(CompanyCode) { CompanyCode = '"'+CompanyCode+'"';}
			else { CompanyCode = '""'; }
			string1+= '"CompanyCode": ' +CompanyCode;
			
			var CompanyRole = "S";
			if(CompanyRole) { CompanyRole = '"'+CompanyRole+'"';}
			else { CompanyRole = '""'; }
			string1+= ', "CompanyRole": ' +CompanyRole;
			
			if (ShipToCustomerId) { ShipToCustomerId = '"'+ShipToCustomerId+'"'; }
			else { ShipToCustomerId = '""'; }
			string1+= ', "ShipToCustomerId": ' +ShipToCustomerId;
			
			if (ShipToCustomerName) { ShipToCustomerName = '"'+ShipToCustomerName+'"'; }
			else { ShipToCustomerName = '""'; }
			string1+= ', "ShipToCustomerName": ' +ShipToCustomerName;
			
			var DocType = nlapiGetRecordType();
			if (DocType) { DocType = '"'+DocType+'"'; }
			else { DocType = '""'; }
			string1+= ', "DocType": ' +DocType;
			
			if (CustomerCode) { CustomerCode = '"'+CustomerCode+'"'; }
			else { CustomerCode = '""'; }
			string1+= ', "CustomerCode": ' +CustomerCode;

			if (CustomerName) { CustomerName = '"'+CustomerName+'"'; }
			else { CustomerName = '""'; }
			string1+= ', "CustomerName": ' +CustomerName;
			
			var DocDateold = nlapiGetFieldValue('trandate');
			var DocDate = '';
			if(DocDateold){
				var docdatesplit = DocDateold.split("/");
				DocDate = docdatesplit[2]+"-"+docdatesplit[0]+"-"+docdatesplit[1];
			}
			if (DocDate) { DocDate = '"'+DocDate+'"'; }
			else { DocDate = '""'; }
			string1+= ', "DocDate": ' +DocDate;
			
			//Fiscal Date is same as DocDate
			string1+= ', "FiscalDate": '+DocDate;
			
			var Client = "NetSuite";
			if (Client) { Client = '"'+Client+'"'; }
			else { Client = '""'; }
			string1+= ', "Client": ' +Client;
			
			// Invoice Number
			var DocCode = nlapiGetFieldValue('tranid'); 
			if (DocCode) { DocCode = '"'+DocCode+'_'+nlapiGetRecordType()+'"'; }
			else { DocCode = '""'; }
			string1+= ', "DocCode": ' +DocCode;
			
			var Discount = nlapiGetFieldValue('discounttotal');
			if (Discount) { Discount = '"'+Discount+'"'; }
			else { Discount = '"0"'; }
			string1+= ', "Discount": ' +Discount;
			
			var CurrencyCode = subcurrency;
			if (CurrencyCode) { CurrencyCode = '"'+CurrencyCode+'"'; }
			else { CurrencyCode = '""'; }
			string1+= ', "CurrencyCode": ' +CurrencyCode;
			
			//Before Submit set Is committed to NO, so that the TranId is not created and submitted in Sabrix
			var IsAudited = "commit";
			string1+= ', "IsCommit": ' +'"N"';
			
			var OriginalInvoiceNumber = '';
			var OriginalInvoiceDate = '';
			nlapiLogExecution('DEBUG', 'createdfrom1 '+createdfrom, 'DocType ' +DocType);
			if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
			
				var refundRec = '';
				if(createdfrom && nlapiGetRecordType() == 'creditmemo') {
					refundRec = nlapiLoadRecord('invoice', createdfrom);
				}
				if(createdfrom && nlapiGetRecordType() == 'cashrefund') {
					refundRec = nlapiLoadRecord('cashsale', createdfrom);
				}
				nlapiLogExecution('DEBUG', 'createdfrom '+createdfrom, 'refundRec ' +refundRec);
				if(refundRec) {
					OriginalInvoiceNumber = refundRec.getFieldValue('tranid');
					var orgtranDate = refundRec.getFieldValue('trandate');
					nlapiLogExecution('DEBUG', 'createdfrom '+createdfrom, 'OriginalInvoiceNumber ' +OriginalInvoiceNumber+ ' orgtranDate '+orgtranDate);
					if(orgtranDate) {
						var orgtranDateSplit = orgtranDate.split("/");
						var OrgInvDate = orgtranDateSplit[2]+"-"+orgtranDateSplit[0]+"-"+orgtranDateSplit[1];
						OriginalInvoiceDate = OrgInvDate;
					}
				}
			}
			if (OriginalInvoiceNumber) { OriginalInvoiceNumber = '"'+OriginalInvoiceNumber+'"'; }
			else { OriginalInvoiceNumber = '""'; }
			string1+= ', "OriginalInvoiceNumber": ' +OriginalInvoiceNumber;
			
			if (OriginalInvoiceDate) { OriginalInvoiceDate = '"'+OriginalInvoiceDate+'"'; }
			else { OriginalInvoiceDate = '""'; }
			string1+= ', "OriginalInvoiceDate": ' +OriginalInvoiceDate;
			
			var InvoiceCurrency = nlapiGetFieldText('currency');
			if (InvoiceCurrency) { InvoiceCurrency = '"'+InvoiceCurrency+'"'; }
			else { InvoiceCurrency = '""'; }
			string1+= ', "InvoiceCurrency": ' +InvoiceCurrency;
			
			if (FxRate) { FxRate = '"'+FxRate+'"'; }
			else { FxRate = '""';}
			string1+= ', "FxRate": ' +FxRate;
			
			var InvoiceAmount = nlapiGetFieldValue('subtotal');
			if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
				InvoiceAmount = parseFloat(InvoiceAmount * -1);
			}
			else {
				InvoiceAmount = InvoiceAmount;
			}
			if (InvoiceAmount) { InvoiceAmount = '"'+InvoiceAmount+'"'; }
			else { InvoiceAmount = '"0"'; }
			string1+= ', "InvoiceAmount": ' +InvoiceAmount;
			
			if (CustomerRegistrationNumber){ CustomerRegistrationNumber = '"'+CustomerRegistrationNumber+'"'; }
			else { CustomerRegistrationNumber = '""'; }
			string1+= ', "CustomerRegistrationNumber": ' +CustomerRegistrationNumber;
			
			string1+= ', "Addresses": [{ '
			
			//Ship From : Subsidiary Address
			if (AddressCode1){ AddressCode1 = '"'+AddressCode1+'"'; }
			else{ AddressCode1 = '""'; }
			string1+= '"AddressCode": ' +AddressCode1;
				
			if (subcity){ subcity = '"'+subcity+'"'; }
			else{ subcity = '""'; }
			string1+= ', "City": ' +subcity;
			
			if (subregion){ subregion = '"'+subregion+'"'; }
			else{ subregion = '""'; }
			string1+= ', "Region": ' +subregion;
			
			if (subcountry){ subcountry = '"'+subcountry+'"'; }
			else { subcountry = '""'; }
			string1+= ', "Country": ' +subcountry;
			
			if (subcode){ subcode = '"'+subcode+'"'; }
			else { subcode = '""'; }
			string1+= ', "PostalCode": ' +subcode;
			
			string1+= ', "Province": "" ' ;
			string1+= ' }, { '
			
			//Ship To : Invoice shipping Address
			if (AddressCode2){ AddressCode2 = '"'+AddressCode2+'"'; }
			else{ AddressCode2 = '""'; }
			string1+= '"AddressCode": ' +AddressCode2;
			
			if (shiptocity){ shiptocity = '"'+shiptocity+'"'; }
			else{ shiptocity = '""'; }
			string1+= ', "City": ' +shiptocity;
			
			if (shiptoregion){ shiptoregion = '"'+shiptoregion+'"'; }
			else{ shiptoregion = '""'; }
			string1+= ', "Region": ' +shiptoregion;
			
			if (shiptocountry){ shiptocountry = '"'+shiptocountry+'"'; }
			else{ shiptocountry = '""'; }
			string1+= ', "Country": ' +shiptocountry;
			
			if (shiptocode){ shiptocode = '"'+shiptocode+'"'; }
			else { shiptocode = '""'; }
			string1+= ', "PostalCode": ' +shiptocode;
			
			string1+= ', "Province": "" ' ;

			string1+= ' }], "Lines": [';
			//Tax calls should be made for rebillable expense invoices , checking item count- if zero then do not call sabrix request : Begin
			var count = nlapiGetLineItemCount('item');
			if(count == 0 ) {
				callsabrix = 0;
			} // End
			else {
				var isin = 0;
				for(i = 1;i < count+1; i++) {
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
					//nlapiLogExecution('DEBUG','TaxCode '+TaxCode, ' sabrixTaxcode '+sabrixTaxcode+ ' paramAvatax '+paramAvatax+ 'paramSabtax '+paramSabtax );
					nlapiLogExecution('DEBUG','TaxCode '+TaxCode, ' sabrixTaxcode '+sabrixTaxcode+ ' isparamtaxcode '+isparamtaxcode);
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
					var istax = '';
					//if (ItemCode != "Description" && (TaxCode == paramSabtax || TaxCode == paramAvatax)) {
					if (ItemCode != "Description" && isparamtaxcode == 1 ) {
						var CommodityCode = nlapiGetLineItemValue('item','custcol_spk_commodity_taxcode',i);
						var AccountingCode = nlapiGetLineItemValue('item','custcol_spk_itemincomeaccnum',i);
						nlapiLogExecution('DEBUG','CommodityCode',CommodityCode);
						var BundleFlag = nlapiGetLineItemValue('item','custcol_bundle',i);
						var BaseBundleCode = nlapiGetLineItemValue('item','custcol_spk_basebundlecode',i);
						var Description = nlapiGetLineItemValue('item','description',i);
						if(Description) {
							Description = escapeChar(nlapiGetLineItemValue('item','description',i));
						}
						var Qty = nlapiGetLineItemValue('item','quantity',i);
						var UOM = " ";
						if(isin == 1) {
						istax = ' ,{ ';
						}else {
							istax = ' { ';
						}
						isin = 1;
						var LineNo = '"'+i+'"';
						string1+= istax+'"LineNo": ' +LineNo;
						
						if (AccountingCode){ AccountingCode = '"'+AccountingCode+'"'; }
						else{ AccountingCode = '""'; }
						string1+= ', "AccountingCode": ' +AccountingCode;
						
						if (CommodityCode){ CommodityCode = '"'+CommodityCode+'"'; }
						else{ CommodityCode = '""'; }
						string1+= ', "TaxCode": ' +CommodityCode;
						
						if (ItemCode){ ItemCode = '"'+ItemCode+'"'; }
						else{ ItemCode = '""'; }
						string1+= ', "ItemCode": ' +ItemCode;
						
						
						if (BundleFlag == 'T') { BundleFlag = '"Yes"'; }
						else { BundleFlag = '"No"'; }
						string1+= ', "BundleFlag": ' +BundleFlag;
						
						if (BaseBundleCode){ BaseBundleCode = '"'+BaseBundleCode+'"'; }
						else{ BaseBundleCode = '""'; }
						string1+= ', "BaseBundleCode": ' +BaseBundleCode;
						
						if (Description){ Description = '"'+Description+'"'; }
						else{ Description = '""'; }
						string1+= ', "Description": ' +Description;
						
						if(Qty){ Qty = '"'+Qty+'"'; }
						else{ Qty = '"0"'; }
						string1+= ', "Qty": ' +Qty;

						var Amount = nlapiGetLineItemValue('item','amount',i);
						var sfdcunitCost = nlapiGetLineItemValue('item','custcol_spk_sfdc_unit_cost',i);
						if(sfdcunitCost) {
							Amount = parseFloat(sfdcunitCost*Qty);
						}
						
						if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
							Amount = parseFloat(Amount * -1);
						}
						else {
							Amount = Amount;
						}
						if (Amount){ Amount = '"'+Amount+'"'; }
						else { Amount = '"0"'; }
						string1+= ', "Amount": ' +Amount;
						
						string1+= ', "DiscountAmount": "0" ';
						
						if (UOM){ UOM = '"'+UOM+'"'; }
						else{ UOM = '""'; }
						string1+= ', "UOM": ' +UOM;
						
						string1 = string1 + '}';
					}
				}
			}
			
			string1+= ']}'
			nlapiLogExecution('DEBUG','String1',string1);

			if(callsabrix == 1) {
				nlapiLogExecution('DEBUG','Before Submit current time Sabrix request', new Date());
				//var sabrixurl = "https://leadtoordersabrixstg.cloudhub.io/api/sabrix/calculateSalesTax";
				//var authorizationHeader = 'Basic Y29yZXN2Y3VzZXI6Y29yZXN2Y3B3ZCEy';		
				
				nlapiLogExecution('DEBUG','Auth Key '+authorizationHeader,' sabrixurl '+sabrixurl);
				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
				var response = nlapiRequestURL(sabrixurl,string1,header,'POST');
				nlapiLogExecution('DEBUG','Response',response.getCode()+':::'+response.getBody());
				nlapiLogExecution('DEBUG','Before Submit current time Sabrix Response', new Date());
				var response_obj = JSON.parse(response.getBody());
				var statuserrormsg = '';
				if(response.getCode() != '200'){
					statuserrormsg = response.getBody();
					CreateSabrixLog(nlapiGetRecordType(),eventtype,string1,response.getBody(),nlapiGetRecordId(),response.getCode(), 'F');
					var err = nlapiCreateError('Sabrix Error Message :',statuserrormsg);
					throw err;
					return false;
				}
				//DFCT0050827 – Cybersource to charge the credit card with the tax amount on before submit successful sabrix response - Begin
				if(response.getCode() == '200'){
					var successstr = response.getBody();
					nlapiLogExecution('DEBUG','successstr',successstr);
					if(successstr) {
						var CalculationDirection = response_obj.CalculationDirection;
						nlapiLogExecution('DEBUG','CalculationDirection ', CalculationDirection);	
						if(CalculationDirection == "R") {
							nlapiSetFieldValue('taxamountoverride',0);
						}
						else {
							var TotalTax = '';
							if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
								TotalTax = parseFloat(response_obj.TotalTax  * -1);
							}
							else {
								TotalTax = response_obj.TotalTax;
							}
							var TaxRate ='';
							var Taxableamt = '';
							if(response_obj.TaxLines) {
								for(j=0; j < response_obj.TaxLines.length; j++) {
									var taxLinesobj = response_obj.TaxLines[j];
									var LineNo = taxLinesobj.LineNo;
									TaxRate = taxLinesobj.Rate;
									Taxableamt = taxLinesobj.Taxable;
									nlapiLogExecution('DEBUG','TaxRate '+TaxRate, ' Taxableamt '+Taxableamt);	
									nlapiSetLineItemValue('item','taxrate1',LineNo, parseFloat(TaxRate * 100));
								}
							}
							nlapiSetFieldValue('taxamountoverride',TotalTax);
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrorflag','F');
							nlapiSetFieldValue('custbody_spk_sabrixtaxerrormessage','');
						}
					}
				}
				//DFCT0050827 – End
			}
		}
	}
	catch(e) {
		var syserror = '';
		if(e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
			syserror = e.getCode() + '\n' + e.getDetails();
		}              
		else {   
			syserror = e.getCode() + '\n' + e.getDetails();
		} 
		CreateSabrixLog(nlapiGetRecordType(),eventtype,string1,syserror,nlapiGetRecordId(),500, 'F');
		var err = nlapiCreateError('Sabrix Error Message :', syserror);
		throw err;
	}
}

/*
* This script is used on After submit to calculate Tax in NS on create/update, request Sabrix through Cloudhub to return Tax Rate for each line item of Invoice, Cash Sale, Credit Memo and Cash Refund Transactions. 
* @AUTHOR : Unitha Rangam
* @Release Date : 18th July 2015
* @Release Number : RLSE0050406
* @Project Number : PRJ0051168
* @version 1.0
*/
/*
* Script changes on After submit to calculate and set Tax in NS on create/update. 
* ENHC0051967 - Make the script parameter for tax codes editable.
* @AUTHOR : Unitha Rangam
* @Release Date : 21st Aug 2015
* @Release Number : RLSE0050414
* @Project Number : ENHC0051967
* @version 1.1
*/

function sabrixAfterSubmit(eventtype) {
	try {
		var callsabrix = 0;
		if(eventtype == 'create' || eventtype == 'edit') {
			
			var rec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
			//Do No calculate Tax
			var donotcalculatetax = rec.getFieldValue('custbody_spk_donotcalculatetax');
			if(donotcalculatetax == 'T') {
				return;
			}
			callsabrix = 1;
			var string1;
			string1 = '{ ';
			
			var shiptoCustId = rec.getFieldValue('custbody_end_user');
			var CustomerId = rec.getFieldValue('entity');
			var ShipToCustomerId = rec.getFieldValue('custbody_spk_shiptocustomerid');
			var ShipToCustomerName = rec.getFieldValue('custbody_spk_shiptocustomername');
			if(ShipToCustomerName) {
				ShipToCustomerName = escapeChar(rec.getFieldValue('custbody_spk_shiptocustomername'));
			}
			var CustomerCode = rec.getFieldValue('custbody_spk_billtocustomerid');
			var CustomerName = rec.getFieldValue('custbody_spk_billtocustomername');
			if(CustomerName) {
				CustomerName = escapeChar(rec.getFieldValue('custbody_spk_billtocustomername'));
			}
			
			var createdfrom = rec.getFieldValue('createdfrom');
			nlapiLogExecution('DEBUG','createdfrom',createdfrom);
		
			var ExemptionNo = rec.getFieldValue('tranid');

			var FxRate = rec.getFieldValue('exchangerate');
			//For Non-US country, we need to consider Customer Registration Number for VAT calculation
			var CustomerRegistrationNumber = "";
			
			//Ship From : Subsidiary Address
			var AddressCode1 = "01";
			var subsidiary = rec.getFieldValue('subsidiary');
			var sub = rec.getFieldValue('custbody_spk_entity_address'); // TAX ENTITY ADDRESS
			var subrec = sub.split('|');
			var subcity = subrec[0];
			var subregion = subrec[1];
			var subcountry = subrec[2];
			var subprovince = '';
			var subcode = subrec[3];
			var subcurrency = "USD" ; //subrec.getFieldValue('currency');
			nlapiLogExecution('DEBUG','subcity :'+subcity,' subregion :'+subregion+ ' subcountry :'+subcountry+ ' subprovince :'+subprovince+ ' subcode '+subcode );
			
			//Ship TO : Customer/Invoice Shipping Address
			var AddressCode2 = "02";
			var shipaddress = rec.getFieldValue('shipaddress');
			var shiptocity = '';
			var shiptoregion = '';
			var shiptocountry = '';
			var shiptocode = '';
			var shiptoprovince = '';
			shiptocity = rec.getFieldValue('shipcity');
			shiptoregion = rec.getFieldValue('shipstate');
			shiptocountry = rec.getFieldValue('shipcountry');
			shiptocode = rec.getFieldValue('shipzip');
			nlapiLogExecution('DEBUG','shiptocity1 :'+shiptocity,' shiptoregion :'+shiptoregion+ ' shiptocountry :'+shiptocountry+ ' shiptocode :'+shiptocode+ ' shiptoprovince '+shiptoprovince );
			
			var CompanyCode = rec.getFieldValue('custbody_spk_subsidiary_code');
			if(CompanyCode) {
				CompanyCode = CompanyCode;
			}
			else {
				CompanyCode = rec.getFieldValue('subsidiary');
			}
			if(CompanyCode) { CompanyCode = '"'+CompanyCode+'"';}
			else { CompanyCode = '""'; }
			string1+= '"CompanyCode": ' +CompanyCode;
			
			var CompanyRole = "S";
			if(CompanyRole) { CompanyRole = '"'+CompanyRole+'"';}
			else { CompanyRole = '""'; }
			string1+= ', "CompanyRole": ' +CompanyRole;

			if (ShipToCustomerId) { ShipToCustomerId = '"'+ShipToCustomerId+'"'; }
			else { ShipToCustomerId = '""'; }
			string1+= ', "ShipToCustomerId": ' +ShipToCustomerId;

			if (ShipToCustomerName) { ShipToCustomerName = '"'+ShipToCustomerName+'"'; }
			else { ShipToCustomerName = '""'; }
			string1+= ', "ShipToCustomerName": ' +ShipToCustomerName;
			
			var DocType = nlapiGetRecordType();
			if (DocType) { DocType = '"'+DocType+'"'; }
			else { DocType = '""'; }
			string1+= ', "DocType": ' +DocType;
			
			if (CustomerCode) { CustomerCode = '"'+CustomerCode+'"'; }
			else { CustomerCode = '""'; }
			string1+= ', "CustomerCode": ' +CustomerCode;

			if (CustomerName) { CustomerName = '"'+CustomerName+'"'; }
			else { CustomerName = '""'; }
			string1+= ', "CustomerName": ' +CustomerName;
			
			var DocDateold = rec.getFieldValue('trandate');
			var DocDate = '';
			if(DocDateold){
				var docdatesplit = DocDateold.split("/");
				DocDate = docdatesplit[2]+"-"+docdatesplit[0]+"-"+docdatesplit[1];
			}
			if (DocDate) { DocDate = '"'+DocDate+'"'; }
			else { DocDate = '""'; }
			string1+= ', "DocDate": ' +DocDate;
			
			//Fiscal Date is same as DocDate
			string1+= ', "FiscalDate": '+DocDate;
			
			var Client = "NetSuite";
			if (Client) { Client = '"'+Client+'"'; }
			else { Client = '""'; }
			string1+= ', "Client": ' +Client;
			
			// Invoice Number
			var DocCode = rec.getFieldValue('tranid'); 
			if (DocCode) { DocCode = '"'+DocCode+'_'+nlapiGetRecordType()+'"'; }
			else { DocCode = '""'; }
			string1+= ', "DocCode": ' +DocCode;
			
			var Discount = rec.getFieldValue('discounttotal');
			if (Discount) { Discount = '"'+Discount+'"'; }
			else { Discount = '"0"'; }
			string1+= ', "Discount": ' +Discount;
			
			var CurrencyCode = subcurrency;
			if (CurrencyCode) { CurrencyCode = '"'+CurrencyCode+'"'; }
			else { CurrencyCode = '""'; }
			string1+= ', "CurrencyCode": ' +CurrencyCode;
			
			//After Submit set Is committed to Yes, so that the  Unique TranId is created and submitted in Sabrix
			var IsAudited = "commit";
			string1+= ', "IsCommit": ' +'"Y"';
			
			var OriginalInvoiceNumber = '';
			var OriginalInvoiceDate = '';
			nlapiLogExecution('DEBUG', 'createdfrom1 '+createdfrom, 'DocType ' +DocType);
			if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
			
				var refundRec = '';
				if(createdfrom && nlapiGetRecordType() == 'creditmemo') {
					refundRec = nlapiLoadRecord('invoice', createdfrom);
				}
				if(createdfrom && nlapiGetRecordType() == 'cashrefund') {
					refundRec = nlapiLoadRecord('cashsale', createdfrom);
				}
				nlapiLogExecution('DEBUG', 'createdfrom '+createdfrom, 'refundRec ' +refundRec);
				if(refundRec) {
					OriginalInvoiceNumber = refundRec.getFieldValue('tranid');
					var orgtranDate = refundRec.getFieldValue('trandate');
					nlapiLogExecution('DEBUG', 'createdfrom '+createdfrom, 'OriginalInvoiceNumber ' +OriginalInvoiceNumber+ ' orgtranDate '+orgtranDate);
					if(orgtranDate) {
						var orgtranDateSplit = orgtranDate.split("/");
						var OrgInvDate = orgtranDateSplit[2]+"-"+orgtranDateSplit[0]+"-"+orgtranDateSplit[1];
						OriginalInvoiceDate = OrgInvDate;
					}
				}
			}
			if (OriginalInvoiceNumber) { OriginalInvoiceNumber = '"'+OriginalInvoiceNumber+'"'; }
			else { OriginalInvoiceNumber = '""'; }
			string1+= ', "OriginalInvoiceNumber": ' +OriginalInvoiceNumber;
			
			if (OriginalInvoiceDate) { OriginalInvoiceDate = '"'+OriginalInvoiceDate+'"'; }
			else { OriginalInvoiceDate = '""'; }
			string1+= ', "OriginalInvoiceDate": ' +OriginalInvoiceDate;
			
			var InvoiceCurrency = rec.getFieldText('currency');
			if (InvoiceCurrency) { InvoiceCurrency = '"'+InvoiceCurrency+'"'; }
			else { InvoiceCurrency = '""'; }
			string1+= ', "InvoiceCurrency": ' +InvoiceCurrency;
			
			if (FxRate) { FxRate = '"'+FxRate+'"'; }
			else { FxRate = '""';}
			string1+= ', "FxRate": ' +FxRate;
			
			var InvoiceAmount = rec.getFieldValue('subtotal');
			if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
				InvoiceAmount = parseFloat(InvoiceAmount * -1);
			}
			else {
				InvoiceAmount = InvoiceAmount;
			}
			if (InvoiceAmount) { InvoiceAmount = '"'+InvoiceAmount+'"'; }
			else { InvoiceAmount = '"0"'; }
			string1+= ', "InvoiceAmount": ' +InvoiceAmount;
			
			if (CustomerRegistrationNumber){ CustomerRegistrationNumber = '"'+CustomerRegistrationNumber+'"'; }
			else { CustomerRegistrationNumber = '""'; }
			string1+= ', "CustomerRegistrationNumber": ' +CustomerRegistrationNumber;
			
			string1+= ', "Addresses": [{ '
			
			//Ship From : Subsidiary Address
			if (AddressCode1){ AddressCode1 = '"'+AddressCode1+'"'; }
			else{ AddressCode1 = '""'; }
			string1+= '"AddressCode": ' +AddressCode1;
				
			if (subcity){ subcity = '"'+subcity+'"'; }
			else{ subcity = '""'; }
			string1+= ', "City": ' +subcity;
			
			if (subregion){ subregion = '"'+subregion+'"'; }
			else{ subregion = '""'; }
			string1+= ', "Region": ' +subregion;
			
			if (subcountry){ subcountry = '"'+subcountry+'"'; }
			else { subcountry = '""'; }
			string1+= ', "Country": ' +subcountry;
			
			if (subcode){ subcode = '"'+subcode+'"'; }
			else { subcode = '""'; }
			string1+= ', "PostalCode": ' +subcode;
			
			string1+= ', "Province": "" ' ;
			string1+= ' }, { '
			
			//Ship To : Invoice shipping Address
			if (AddressCode2){ AddressCode2 = '"'+AddressCode2+'"'; }
			else{ AddressCode2 = '""'; }
			string1+= '"AddressCode": ' +AddressCode2;
			
			if (shiptocity){ shiptocity = '"'+shiptocity+'"'; }
			else{ shiptocity = '""'; }
			string1+= ', "City": ' +shiptocity;
			
			if (shiptoregion){ shiptoregion = '"'+shiptoregion+'"'; }
			else{ shiptoregion = '""'; }
			string1+= ', "Region": ' +shiptoregion;
			
			if (shiptocountry){ shiptocountry = '"'+shiptocountry+'"'; }
			else{ shiptocountry = '""'; }
			string1+= ', "Country": ' +shiptocountry;
			
			if (shiptocode){ shiptocode = '"'+shiptocode+'"'; }
			else { shiptocode = '""'; }
			string1+= ', "PostalCode": ' +shiptocode;
			
			string1+= ', "Province": "" ' ;

			string1+= ' }], "Lines": [';
			//Tax calls should be made for rebillable expense invoices ,  checking item count- if zero then do not call sabrix request : Begin
			var count = rec.getLineItemCount('item');
			if(count == 0 ) {
				callsabrix = 0;
			} // End
			else {
				var isin = 0;
				for(i = 1;i < count+1; i++) {
					var TaxCode = rec.getLineItemText('item','taxcode',i);
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
					//nlapiLogExecution('DEBUG','TaxCode '+TaxCode, ' sabrixTaxcode '+sabrixTaxcode+ ' paramAvatax '+paramAvatax+ 'paramSabtax '+paramSabtax );
					nlapiLogExecution('DEBUG','TaxCode '+TaxCode, ' sabrixTaxcode '+sabrixTaxcode+ ' isparamtaxcode '+isparamtaxcode);
					var ItemCodevalue = rec.getLineItemText('item','item',i);
					var itemintId = rec.getLineItemValue('item','item',i);
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
					var istax = '';
					if (ItemCode != "Description" && isparamtaxcode == 1 ) {
						var CommodityCode = rec.getLineItemValue('item','custcol_spk_commodity_taxcode',i);
						var AccountingCode = rec.getLineItemValue('item','custcol_spk_itemincomeaccnum',i);
						nlapiLogExecution('DEBUG','CommodityCode',CommodityCode);
						var BundleFlag = rec.getLineItemValue('item','custcol_bundle',i);
						var BaseBundleCode = rec.getLineItemValue('item','custcol_spk_basebundlecode',i);
						var Description = rec.getLineItemValue('item','description',i);
						if(Description) {
							Description = escapeChar(rec.getLineItemValue('item','description',i));
						}
						var Qty = rec.getLineItemValue('item','quantity',i);
						var Amount = rec.getLineItemValue('item','amount',i);
						
						var UOM = " ";
						if(isin == 1) {
						istax = ' ,{ ';
						}else {
							istax = ' { ';
						}
						isin = 1;
						var LineNo = '"'+i+'"';
						string1+= istax+'"LineNo": ' +LineNo;
						
						if (AccountingCode){ AccountingCode = '"'+AccountingCode+'"'; }
						else{ AccountingCode = '""'; }
						string1+= ', "AccountingCode": ' +AccountingCode;
						
						if (CommodityCode){ CommodityCode = '"'+CommodityCode+'"'; }
						else{ CommodityCode = '""'; }
						string1+= ', "TaxCode": ' +CommodityCode;
						
						if (ItemCode){ ItemCode = '"'+ItemCode+'"'; }
						else{ ItemCode = '""'; }
						string1+= ', "ItemCode": ' +ItemCode;
						
						
						if (BundleFlag == 'T') { BundleFlag = '"Yes"'; }
						else { BundleFlag = '"No"'; }
						string1+= ', "BundleFlag": ' +BundleFlag;
						
						if (BaseBundleCode){ BaseBundleCode = '"'+BaseBundleCode+'"'; }
						else{ BaseBundleCode = '""'; }
						string1+= ', "BaseBundleCode": ' +BaseBundleCode;
						
						if (Description){ Description = '"'+Description+'"'; }
						else{ Description = '""'; }
						string1+= ', "Description": ' +Description;
						
						if(Qty){ Qty = '"'+Qty+'"'; }
						else{ Qty = '"0"'; }
						string1+= ', "Qty": ' +Qty;
						
						
						var sfdcunitCost = rec.getLineItemValue('item','custcol_spk_sfdc_unit_cost',i);
						if(sfdcunitCost) {
							Amount = parseFloat(sfdcunitCost*Qty);
						}
						
						if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
							Amount = parseFloat(Amount * -1);
						}
						else {
							Amount = Amount;
						}
						if (Amount){ Amount = '"'+Amount+'"'; }
						else { Amount = '"0"'; }
						string1+= ', "Amount": ' +Amount;
						
						string1+= ', "DiscountAmount": "0" ';
						
						if (UOM){ UOM = '"'+UOM+'"'; }
						else{ UOM = '""'; }
						string1+= ', "UOM": ' +UOM;
						string1 = string1 + '}';
					}
				}
			}
			
			string1+= ']}'
			
			var isSabrixError = rec.getFieldValue('custbody_spk_sabrixtaxerrorflag');
			var traninternalId = ''
			nlapiLogExecution('DEBUG','String1',string1);
			
			//On edit call Sabrix Request to calculate tax only if certain fields are changed
			if(eventtype == 'edit') {
				callsabrix = changeinFields(rec);
				if(isSabrixError == 'T') {
					callsabrix = 1;
				}
				nlapiLogExecution('DEBUG','callsabrix',callsabrix);
			}
			if(DocType == 'invoice' && count == 0) {
				callsabrix = 0;
			}
			 if(callsabrix == 1) {
				nlapiLogExecution('DEBUG','After Submit current time Sabrix Request', new Date());
				//var sabrixurl = "https://leadtoordersabrixstg.cloudhub.io/api/sabrix/calculateSalesTax";
				//var authorizationHeader = 'Basic Y29yZXN2Y3VzZXI6Y29yZXN2Y3B3ZCEy';		
		
				nlapiLogExecution('DEBUG','Auth Key '+authorizationHeader,' sabrixurl '+sabrixurl);
				var header = new Array();
				header['Authorization'] = authorizationHeader;
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';
				var response = nlapiRequestURL(sabrixurl,string1,header,'POST');
				nlapiLogExecution('DEBUG','Response',response.getCode()+':::'+response.getBody());
				nlapiLogExecution('DEBUG','After Submit current time Sabrix Response', new Date());
				var response_obj = JSON.parse(response.getBody());
				var statuserrormsg = '';
				if(response.getCode() != '200'){
					rec.setFieldValue('custbody_spk_sabrixtaxerrorflag','T');
					rec.setFieldValue('custbody_spk_sabrixtaxerrormessage',response.getBody());
				}
				if(response.getCode() == '200'){
					var successstr = response.getBody();
					if(successstr) {
						var CalculationDirection = response_obj.CalculationDirection;
						nlapiLogExecution('DEBUG','CalculationDirection ', CalculationDirection);	
						if(CalculationDirection == "R") {
							rec.setFieldValue('taxamountoverride',0);
						}
						else {
							var TotalTax = '';
							if(nlapiGetRecordType() == 'creditmemo' || nlapiGetRecordType() == 'cashrefund') {
								TotalTax = parseFloat(response_obj.TotalTax  * -1);
							}
							else {
								TotalTax = response_obj.TotalTax;
							}
							var TaxRate ='';
							var Taxableamt = '';
							if(response_obj.TaxLines) {
								for(j=0; j < response_obj.TaxLines.length; j++) {
									var taxLinesobj = response_obj.TaxLines[j];
									var LineNo = taxLinesobj.LineNo;
									TaxRate = taxLinesobj.Rate;
									Taxableamt = taxLinesobj.Taxable;
									nlapiLogExecution('DEBUG','TaxRate '+TaxRate, ' Taxableamt '+Taxableamt);	
									rec.setLineItemValue('item','taxrate1',LineNo, parseFloat(TaxRate * 100));
								}
							}
							rec.setFieldValue('taxamountoverride',TotalTax);
							rec.setFieldValue('custbody_spk_sabrixtaxerrorflag','F');
							rec.setFieldValue('custbody_spk_sabrixtaxerrormessage','');
						}
					}
				}
				traninternalId = nlapiSubmitRecord(rec);
				nlapiLogExecution('DEBUG','traninternalId ', traninternalId);	
				//Submit the Sabrix Integration Log Custom Record to keep track of Request and Response
				CreateSabrixLog(nlapiGetRecordType(),eventtype,string1,response.getBody(),traninternalId,response.getCode(),'T');
			} 
			
		}
	}
	catch(e) {
		var syserror = '';
		if(e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
			syserror = e.getCode() + '\n' + e.getDetails();
		}              
		else {   
			syserror = e.getCode() + '\n' + e.getDetails();
		}
		nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),['custbody_spk_sabrixtaxerrorflag','custbody_spk_sabrixtaxerrormessage'],['T', syserror]);
		CreateSabrixLog(nlapiGetRecordType(),eventtype,string1,response.getBody(),nlapiGetRecordId(),500, 'T');
		var err = nlapiCreateError('Sabrix Error :', syserror);
		throw err;
	}
}
//Submit the Sabrix Integration Log Custom Record to keep track of Request and Response
function CreateSabrixLog(recType,eventtype,reqstring,respstring,traninternalId,respcode,iscommittran) {
	var sabrixlogRec = nlapiCreateRecord('customrecord_spk_sabrix_integration_log');
	if(recType){
		sabrixlogRec.setFieldValue('custrecord_spk_transaction_type',recType);
	}
	if(eventtype) {
		sabrixlogRec.setFieldValue('custrecord_spk_eventtype',eventtype);
	}
	if(reqstring) {
		sabrixlogRec.setFieldValue('custrecord_spk_sabrixrequest',reqstring);
	}
	if(respstring) {
		sabrixlogRec.setFieldValue('custrecord_spk_sabrixresponse',respstring);
	}
	sabrixlogRec.setFieldValue('custrecord_spk_date_created',new Date());
	if(traninternalId) {
		sabrixlogRec.setFieldValue('custrecord_spk_trannumber',traninternalId);
	}
	if(respcode != '200'){
		sabrixlogRec.setFieldValue('custrecord_spk_issabrixerror','T');
	}
	if(iscommittran == 'T'){
		sabrixlogRec.setFieldValue('custrecord_spk_iscommit',iscommittran);
	}
	
	var sabrixloglId = nlapiSubmitRecord(sabrixlogRec, true);
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
//Function used to replace special characters for any string having these chars  ","",\n,\r,\\,\t.
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