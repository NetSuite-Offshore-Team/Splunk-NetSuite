/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

var vatvalns = vatvalns || {};
vatvalns.Class = {};

var _clientSideObject;

function pageInit(type) {
	try {
		_clientSideObject = new vatvalns.Class.MainApp();
	} catch (ex) {
		var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
		nlapiLogExecution("ERROR", "pageInit", errorMsg);
	}
}

function validateField(type, name, linenum) {
	try {
		if (_clientSideObject == null) {
			return true;
		}
		return (_clientSideObject.validateField(type, name, linenum));
	} catch (ex) {
		var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
		alert(errorMsg);
		nlapiLogExecution("ERROR", "validateField", errorMsg);
	}
}

vatvalns.Class.MainApp = function() {
	this.validateField = function(type, name, linenum) {
		try {
			if (name == 'vatregnumber') {
				// check for a default billing address's country.
				var addressesCtr = nlapiGetLineItemCount('addressbook');
				var countryCode = "";
				for (var i = 0; i < addressesCtr; i++) {
					var defaultBillingAddressTag = nlapiGetLineItemValue('addressbook', 'defaultbilling', i + 1);
					if (defaultBillingAddressTag != 'T') {
						continue;
					}
					nlapiSelectLineItem('addressbook', i + 1);
					countryCode = nlapiGetCurrentLineItemValue('addressbook', 'country');
					break;
				}

				// if countryCode at this point is still empty...rely on the vatregno format to get country...
				var vatprefix = '';
				var regno = trim(nlapiGetFieldValue(name));
				if (regno != null && regno != "") {
					vatprefix = trim(regno.substr(0, 2)).toUpperCase();
					if (countryCode == "" || countryCode != vatprefix) {
						countryCode = vatprefix;
					}

					// must depend on the vatregnumber format expected by the field. 
					// it is assume that the customer followed the suggestion of netsuite in the proper format of vatregnumber
					//
					/*
					 * NOTE: The line below is a default netsuite notice for the vatregnumber format. after providing the said message, netsuite still allow
					 * the user to move to the next field even if the vatregno is NOT valid.
						The VAT registration number you have entered is invalid. 
						Please make sure you have entered a valid VAT registration number beginning with your country prefix.
					*/

					if (VAT.Constants.EUNexuses[countryCode]) {
						var vatno = trim(regno.substr(2));
						var url = ['http://ec.europa.eu/taxation_customs/vies/vatResponse.html?memberStateCode='];
						url.push(countryCode);
						url.push('&number=' + vatno);
						url.push('&traderName=&traderStreet=&traderPostalCode=&traderCity=&requesterMemberStateCode=&requesterNumber=&action=check&check=Verify');

						var taxsiteurl = url.join("");
						//"http://isvat.appspot.com/"+countryCode+"/"+vatno+"/";

						var respObject = nlapiRequestURL(taxsiteurl);
						var response = respObject.getBody();

						if (response.indexOf('invalidStyle') > -1) {
							alert("VAT Registration number " + regno + " is NOT valid.");
						}
					}
				}
			}

			return true;
		} catch (ex) {
			var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
			nlapiLogExecution("ERROR", "vatvalns.Class.MainApp.validateField", errorMsg);
		}
	}
}