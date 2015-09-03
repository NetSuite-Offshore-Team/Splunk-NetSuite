/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

function checkCommodityCode(type, name, linenum){
    if (name != 'custitem_commodity_code') {
        return true;
    }
    
	try {
		var commoditycode = nlapiGetFieldValue('custitem_commodity_code');
		
		if (!validateCommodityCode(commoditycode)) {
			alert('You have entered an invalid commodity code');
		}
	} catch(ex) {
		var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
		nlapiLogExecution("ERROR", "checkCommodityCode", errorMsg);
	}
	
	return true;
}

function manualCheckCommodityCode() {
	try {
		var commoditycode = nlapiGetFieldValue('custitem_commodity_code');
		if (commoditycode) {
			if (!validateCommodityCode(commoditycode)) {
				alert('You have entered an invalid commodity code');
			} else {
				alert('Commodity code is valid');
			}
		}
	} catch(ex) {
		var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
		nlapiLogExecution("ERROR", "checkCommodityCode", errorMsg);
	}
	return true;
}

function validateCommodityCode(commoditycode) {
	try {
		if (commoditycode.length > 2) {
			var searchcode = "";
			
			switch(commoditycode.length) {
				case 3:
					searchcode = "0" + commoditycode;
					break;
				case 4:
					searchcode = commoditycode;
					break;
				default: //more than 4
					searchcode = commoditycode.substring(0,4);
			}
			
			var url = 'https://www.uktradeinfo.com/TradeTools/ICN/Pages/ICNCommodityDetails.aspx?Heading=' + searchcode;
			var responseObj = nlapiRequestURL( url );
			var response = responseObj.getBody();
			
			if (response.indexOf('No data to display') > -1) {
				return false;
			} else { //Not Sorry
				var regex = new RegExp("[^0-9A-Za-z<>]", "g"); 
				var newdoc = response.replace(regex, "");
				
				var regexcode = new RegExp(commoditycode, "g"); 
				if (!regexcode.exec(newdoc)) {
					return false;
				} else {
					return true;
				}
			}
		} else {
			return false;
		}
	} catch(ex) {
		var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
		nlapiLogExecution("ERROR", "checkCommodityCode", errorMsg);
		
		return false;
	}
}
