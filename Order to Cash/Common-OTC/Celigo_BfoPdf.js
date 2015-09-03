/*
    Celigo - generate custom PDF statement with attached T&C

*/

// this is the from field email employee, accounting@splunk.com
// var fromEmailId = 26872;
var fromEmailId = 2182064;//35102;

//var BLANK_TC_INV_ID = 2;
//var BLANK_TC_QT_ID = 3;

var BLANK_TC_INV_ID = 2;
var BLANK_TC_QT_ID = 1;

var generatedTCFolderId = 18;


/*
    convert text type to tx lookup ID
 */

var txTypeIdMap = {
    'estimate' : 6,
    'invoice' : 7
};

function onAfterSubmit_bfo(type) {



    try {
        /* if saved with "Save & Email" Bunddle */
        var order = nlapiGetNewRecord();

        if(order.getFieldValue('custpage_is_print_bundle') == 'T' && order.getFieldValue('custbody_celigo_tc_type') != null) {

            var fileName = "Order " + order.getFieldValue('tranid');
            var subject = "Splunk Order " + order.getFieldValue('tranid');
            var body = "Please open the attached file to view your Order."; 
            if(order.getRecordType() == 'invoice') {
                body = "Please open the attached file to view your Invoice.";
                fileName = "Invoice " + order.getFieldValue('tranid') + ".pdf";
                subject = "Splunk - " + "Invoice " + order.getFieldValue('tranid');
            } else if(order.getRecordType() == 'estimate') {
                fileName = "Quote " + order.getFieldValue('tranid') + ".pdf";
                subject = "Splunk - " + "Quote " + order.getFieldValue('tranid');
                body = "Please open the attached file to view your Quote.";
            }
            body += "\n\nIf you don't have it yet, visit Adobe's Web site http://www.adobe.com/products/acrobat/readstep.html to download it.\n\n";

            var email = nlapiLookupField('customer',order.getFieldValue('entity'),'email');

            var pdfFile = genPdf(order);
            pdfFile.setName(fileName);
            pdfFile.setFolder(generatedTCFolderId);
            var fileId = nlapiSubmitFile(pdfFile);
            pdfFile = nlapiLoadFile(fileId);

            nlapiLogExecution('DEBUG', 'pdfFile', "pdfFile "+fileId);

            nlapiSendEmail(fromEmailId,
                    email,
                    subject,
                    body,
                    null,
                    null,
                    null,
                    pdfFile);
            // Now mail it attaching message to order
            nlapiAttachRecord('file',pdfFile.getId(),order.getRecordType(),order.getId());

            pdfFile.setName(fileName + " " + nlapiDateToString(new Date(), 'datetime'));
            nlapiSubmitFile(pdfFile);

//            nlapiSendEmail(fromEmailId,
//                    order.getFieldValue('entity'),
//                    subject,
//                    body,
//                    null,null,
//                    {'transaction' : order.getId()},
//                    pdfFile);
        }
    } catch (err) {
        nlapiLogExecution('ERROR', 'onAfterSubmit_bfo', err.toString());
    }
}

/*
    add button to invoke pdf suitelet
 */

function onBeforeLoad_bfo(type,form,request) {

    try {
        if(type == 'view') {
            var rec = nlapiGetNewRecord();
            var tcType = rec.getFieldValue('custbody_celigo_tc_type');
           
            var txId = rec.getId();
            var custId =  rec.getFieldValue('entity');
            var url = nlapiResolveURL('SUITELET', 'customscript_celigo_bfo_pdf_suitelet', 'customdeploy_celigo_bfo_pdf_suitelet_dp', false);
            var script = "window.open('" + url + "&tx_type=" + rec.getRecordType() + "&tx_id=" + rec.getId() +
                      "','PRINT', 'scrollbars=yes, location=no, toolbar=no, width=500, height=550, resizable=yes');";
            form.addButton("custpage_bfo_print","Print Bundle",script);
        }

        if(type == 'create' || type == 'edit' || type == 'copy') {

            /* add save & email button to edit form */

            var rec = nlapiGetNewRecord();
            var tcType = rec.getFieldValue('custbody_celigo_tc_type');
            if(tcType == null || tcType == '') {
                var blankTcId = getBlankTcId(rec);
                if(blankTcId != null) {
                    rec.setFieldValue('custbody_celigo_tc_type',blankTcId);
                }
            }
            var fld = form.addField('custpage_is_print_bundle','checkbox','Is Save & Print Bundle');
            fld.setDefaultValue('F');
            fld.setDisplayType('hidden');
            form.addButton("custpage_bfo_save_email","Save & Email Bundle","nlapiSetFieldValue('custpage_is_print_bundle','T'); var frm = document.forms['main_form']; if(!frm.onsubmit || frm.onsubmit()) {frm.submit();} ");
        }
    } catch (err) {
        nlapiLogExecution('ERROR', 'onAfterSubmit_bfo', err.toString());
    }

}


function getBlankTcId(rec) {

    var columns = [];
    columns.push(new nlobjSearchColumn("name"));
    columns.push(new nlobjSearchColumn("custrecord_celigo_tc_type"));

    var filters = [];

    filters.push(new nlobjSearchFilter('name',null,'is','Blank T&C'));
    filters.push(new nlobjSearchFilter('custrecord_celigo_pdf_tx_type',null,'anyof',[txTypeIdMap[rec.getRecordType()]]));

    var srs = nlapiSearchRecord('customrecord_celigo_pdf_config',null,filters,columns);
    if(srs == null) {
        return null;
    }
    return srs[0].getValue('custrecord_celigo_tc_type');
}



function excapeXML(s) {
    if(s == null) {
        return null;
    }
    return s.replace(/<br>/g,"\n").replace(/&amp;/g,'&').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g,"&#39;").replace(/\n/g,"<br/>");
}

/*
    convert T&C text to XML
 */

function formatTandC(text) {

    if(text == null) {
        return '';
    }
    
    var escaped = excapeXML(text);
    
    
    //escaped = escaped.replace(/&lt;columns&gt;/g,"<table><tr>").replace(/&lt;\/columns&gt;/g,"</tr></table>");
    //escaped = escaped.replace(/&lt;column&gt;/g,"<td>").replace(/&lt;\/column&gt;/g,"</td>");
    
    
    escaped = "<p>" + escaped.replace(/(<br\/>\W*<br\/>)/g,"</p>\n<p>") + "</p>";
    return escaped ;
}



/*
    generate PDF file for order.  Load config settings and BFO
    xml.  Run thru tempalate processor trimpath for final xml.
    Put that into nlapiXMLToPDF to generate final PDF
 */

function genPdf(order){

	var tcType = order.getFieldValue('custbody_celigo_tc_type');
	var recType = order.getRecordType();

	var recTypeId = txTypeIdMap[recType];

	if (recTypeId == null) {
		return;
	}

	var searchFilters = [];
	var filterIdx = 0;
	searchFilters[filterIdx++] = new nlobjSearchFilter('custrecord_celigo_pdf_tx_type', null, 'anyof', [recTypeId]);
	/* Celigo - csnelson 5/9/2013 added default value for tcType Start*/
	if(!tcType)
		tcType = 2;
	/* Celigo - csnelson 5/9/2013 added default value for tcType End*/
	searchFilters[filterIdx++] = new nlobjSearchFilter('custrecord_celigo_tc_type', null, 'anyof', [tcType]);

	var searchColumns = [];
	var columnIdx = 0;
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_celigo_pdf_tx_type');
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_celigo_bfo_template');
	searchColumns[columnIdx++] = new nlobjSearchColumn('custrecord_celigo_tc_type');
	var searchResults = nlapiSearchRecord('customrecord_celigo_pdf_config', null, searchFilters, searchColumns);

	if (searchResults == null) {
        nlapiLogExecution('ERROR', 'onAfterSubmit_bfo', 'PDF Configuration record not found for selected T&C Type');
		throw "PDF Configuration record not found for selected T&C Type";// error
	}
	if (searchResults.length > 1) {
		nlapiLogExecution('ERROR',  "Mutiple PDF configuration record not found for selected T&C Type, only one may be defined");// error
		throw "Mutiple PDF configuration record not found for selected T&C Type, only one may be defined";// error
	}
	var bfoFileId = searchResults[0].getValue('custrecord_celigo_bfo_template');
	
	var tcType = searchResults[0].getValue('custrecord_celigo_tc_type');
	
	nlapiLogExecution('DEBUG', "T&C Type: " + tcType, "");

    var tcRec = nlapiLoadRecord('customrecord_celigo_tc_type', tcType);

	var repName = '';
	var repEmail = '';
	var repPhone = '';

	if (order.getFieldValue('salesrep') != null && order.getFieldValue('salesrep') != '') {
		var repRec = nlapiLoadRecord('employee', order.getFieldValue('salesrep'));
		repName = repRec.getFieldValue('firstname');
		if (repName != null) {
			repName = '' + repName + ' ';
		}
		else {
			repName = '';
		}
		var repLastName = repRec.getFieldValue('lastname');
		if (repLastName != null) {
			repName = '' + repName + repLastName;
		}

		repEmail = repRec.getFieldValue('email');
		if (repEmail == null) {
			repEmail = '';
		}
		repPhone = repRec.getFieldValue('phone');
		if (repPhone == null) {
			repPhone = '';
		}
	}

	var lines = [];
	/* Splunk - pliu 09/01/2010 Bundle variables Start */
	var bundle = {};
	var amount = 0;
	var licensedesc = '';
	/* Splunk - pliu 09/01/2010 Bundle variables End */
	
	/* Celigo - csnelson 04/04/2013 Bundle variable start */
	var isCeligoBundle = false;
	var pdfLineNum = 0;
	var pdfItems = [];
	/* Celigo - csnelson 04/04/2013 Bundle variable end */
	var lineIdx = 1;
	/* Splunk - adeshpande 10/15/2013 isNodeLicense? */
	var containsNodesLicense = false;
	var containsVolLicense = false;
       /*Splunk - jbalaji 09/16/2014 isMintLicense */
        var containsMintSKU = false;
	for (lineIdx = 1; lineIdx <= order.getLineItemCount('item'); lineIdx++) {
		var line = {};
		//line.qty = parseInt(order.getLineItemValue('item', 'quantity', lineIdx));
                line.qty = parseFloat(order.getLineItemValue('item', 'quantity', lineIdx));
		if (isNaN(line.qty)) {
			line.qty = '';
		}
		line.itemname = excapeXML(order.getLineItemValue('item', 'custcol_ava_item', lineIdx));
		if (line.itemname == null) {
			line.itemname = '';
		}
       /*Splunk - jbalaji 09/16/2014 isMintLicense */
       if(line.itemname != null){
    	  if (line.itemname.substring(0, 2) == 'MI'){
            containsMintSKU = true;
          }
        }
       line.isMint = containsMintSKU;
      //end change for Mint SKUs - jbalaji

		line.desc = excapeXML(order.getLineItemValue('item', 'description', lineIdx));
		if (line.desc == null) {
			line.desc = '';
		}
		line.memo = excapeXML(order.getLineItemValue('item', 'custcol_memo', lineIdx));
		if (line.memo == null) {
			line.memo = '';
		}
		line.rate = excapeXML(order.getLineItemValue('item', 'rate', lineIdx));
		if (line.rate == null) {
			line.rate = '';
		}
		/* Begin Splunk - adeshpande 1/2/2014 New Start/End date fields */
		line.license_start_date = excapeXML(order.getLineItemValue('item', 'custcol_license_start_date', lineIdx));
		if (line.license_start_date == null) {
			line.license_start_date = '';
		}
		line.license_end_date = excapeXML(order.getLineItemValue('item', 'custcol_license_end_date', lineIdx));
		if (line.license_end_date == null) {
			line.license_end_date = '';
		}
		/* Finish Splunk - adeshpande 1/2/2014 New Start/End date fields */
//		else {
			line.rate = CommaFormatted(nlapiFormatCurrency(line.rate));
//		}
		line.sku = order.getLineItemValue('item', 'custcol_ava_item', lineIdx);
		/*Celigo - csnelson 9/9/2013 added Size GB field*/
		if(order.getLineItemValue('item', 'custcol_peak_daily_vol_gb', lineIdx))
		    line.gb = CommaFormatted(excapeXML(order.getLineItemValue('item', 'custcol_peak_daily_vol_gb', lineIdx)));
		/*Splunk - adeshpande 01/29/2014 Retention days for Cloud */
            line.retdays =  excapeXML(order.getLineItemValue('item', 'custcol_retention_days', lineIdx));
            if (line.retdays == null) {
			    line.retdays = 0 ;
		    }
		/*Splunk - adeshpande 10/15/2013 logic for Number of nodes field*/
		if(order.getLineItemValue('item', 'custcol_number_of_nodes', lineIdx))
		    line.nodes = parseInt(excapeXML(order.getLineItemValue('item', 'custcol_number_of_nodes', lineIdx)));
		if(order.getLineItemValue('item', 'custitem_is_node', lineIdx))
		    line.isNodesLic = excapeXML(order.getLineItemValue('item', 'custitem_is_node', lineIdx)) ;
		    if (line.isNodesLic) {
		        containsNodesLicense = true;
		    } else {
			containsVolLicense = true;
		    } 
		line.amount = excapeXML(order.getLineItemValue('item', 'amount', lineIdx));
		if (line.amount == null) {
			line.amount = '';
			line.bundleamount = line.amount;
		}
		else {
			line.amount = nlapiFormatCurrency(line.amount);
			line.bundleamount = line.amount;
			line.amount = CommaFormatted(line.amount);
		}
/* Celigo before 09/01
		lines[lineIdx - 1] = line;
	}
*/
		/*Celigo - csnelson 04/04/2013 Celigo Bundle Update start*/
		var partOfBundle = false;
		if(isCeligoBundle && !order.getLineItemValue('item', 'item', lineIdx) || order.getLineItemValue('item', 'item', lineIdx) === '0')
			continue;
		if(order.getLineItemValue('item', 'custcol_celigo_group_item_internal_id', lineIdx)){
			isCeligoBundle = true;
			partOfBundle = true;
			for(var k=0; k<pdfItems.length; k++){
				if(pdfItems[k] !== order.getLineItemValue('item', 'custcol_celigo_group_item_internal_id', lineIdx))
					continue;
				
				var thisAmount = lines[k].bundleamount;
				if(!thisAmount || thisAmount === '')
					thisAmount = 0.0;
				if(line.bundleamount){
					lines[k].bundleamount= parseFloat(thisAmount) + parseFloat(line.bundleamount);
					lines[k].amount = CommaFormatted(nlapiFormatCurrency(lines[k].bundleamount));
				}
				/* Celigo - csnelson 05/29/13 Bundle Comment Change START */
				var extDesc = lines[k].desc;
				if(!extDesc)
					extDesc = '';
				if(line.desc){
					if(!extDesc)
						lines[k].desc = line.desc;
					else
						lines[k].desc = extDesc + ' + ' + line.desc;
				}

				var extMemo = lines[k].memo;

				if(!extMemo)
					extMemo = '';
				if(line.Memo){
					if(!extMemo)
						lines[k].memo = line.memo;
					else
						lines[k].memo = extMemo+ ' + ' + line.memo;
				}
				/* Celigo - csnelson 05/29/13 Bundle Comment Change END */
			}
		}
		/*Celigo - csnelson 04/04/2013 Celigo Bundle Update end*/
/* Splunk - pliu 09/01/2010 Bundle code Start */
		line.bundle = excapeXML(order.getLineItemValue('item', 'custcol_bundle', lineIdx));
		if (!isCeligoBundle && line.bundle == 'T') { /*Celigo - csnelson 04/04/2013 added !isCeligoBundle check */
			if (line.qty == '1') {
				if (line.itemname.substring(0, 2) == 'SE') {
					if (licensedesc == '')
						licensedesc = line.desc;
					else
						licensedesc = licensedesc + " + " + line.desc;
				}
				else {
					if (bundle.desc == null)
						bundle.desc = line.desc;
					else
						bundle.desc = bundle.desc + " + " + line.desc;
				}
			}
			else {
				if (line.itemname.substring(0, 2) == 'SE') {
					if (licensedesc == '')
						licensedesc = line.qty + " x " + line.desc;
					else
						licensedesc = licensedesc + " + " + line.qty + " x " + line.desc;
				}
				else {
					if (bundle.desc == null)
						bundle.desc = line.qty + " x " + line.desc;
					else
						bundle.desc = bundle.desc + " + " + line.qty + " x " + line.desc;
				}
			}
			if (bundle.memo == null) {
				if (line.memo != null)
					bundle.memo = line.memo;
			}
			else {
				if (line.memo != null)
					bundle.memo = bundle.memo + " " + line.memo;
			}
			amount = amount + parseFloat(line.bundleamount);
		}/*Celigo - csnelson 04/04/2013 new else start*/
		else{
			if(partOfBundle)
				continue;
			lines[pdfLineNum] = line;
			pdfItems[pdfLineNum] = order.getLineItemValue('item', 'item', lineIdx);
			pdfLineNum++;
		}/*Celigo - csnelson 04/04/2013 new else end*/
		/* Celigo - csnelson 04/04/2013 old value 
		else
			lines[lineIdx - 1] = line;
			*/
		/*Celigo - ctran 07/14/2014*/		
		line.itemcategory = excapeXML(order.getLineItemValue('item', 'custcol_item_category', lineIdx));
		if (line.itemcategory == null) {
			line.itemcategory = '';
		}
		if (line.itemcategory === '2') {
			if (recType === 'invoice') {
				if (line.license_start_date !== '' && line.license_end_date !== '')
					line.memo = '(License Term : ' + line.license_start_date + '-' + line.license_end_date + ') ' + line.memo;
			}
			else if (recType === 'estimate')
				if (line.license_start_date === '' && line.license_end_date === '')
					line.memo = 'Start on Delivery.' + line.memo;
				else if (line.license_start_date === '' && line.license_end_date !== '')
					line.memo = '(License Term : Start on Delivery-' + line.license_end_date + ') ' + line.memo;
				else if (line.license_start_date !== '' && line.license_end_date !== '')
					line.memo = '(License Term : ' + line.license_start_date + '-' + line.license_end_date + ') ' + line.memo;
		}
		/*Celigo - ctran 07/14/2014*/
	}
	if (licensedesc != '') {
		if (bundle.desc == null)
			bundle.desc = licensedesc;
		else
			bundle.desc = licensedesc + " + " + bundle.desc;
	}
	if (bundle.desc != null) {
		bundle.qty = '1';
		bundle.rate = CommaFormatted(nlapiFormatCurrency(amount));
		bundle.amount = bundle.rate;
		/*Celigo - csnelson 04/24/2013 Old Value
		lines[0] = bundle;
		*/
		/*Celigo - csnelson 04/24/2013 Start new*/
		lines[pdfLineNum] = bundle;
		pdfLineNum++;
		/*Celigo - csnelson 04/24/2013 End new*/
	}
/*Splunk - pliu 09/01/2010 Bundle End */

    var obj = {};
    obj.lines = lines;
    obj.containsNodesLicense = containsNodesLicense;
    obj.containsVolLicense = containsVolLicense;
    obj.tranId = excapeXML(order.getFieldValue('tranid'));
    obj.tranDate = excapeXML(order.getFieldValue('trandate'));
    obj.dueDate = excapeXML(order.getFieldValue('duedate'));
    obj.repName = excapeXML(repName);
    obj.repEmail = repEmail;
    obj.repPhone = repPhone;
    obj.type = order.getRecordType();
    if(obj.type == 'invoice') {
        obj.terms = excapeXML(order.getFieldText('terms'));    // terms
        if(obj.terms == null) {
            obj.terms = '';
        }
        obj.poNumber = excapeXML(order.getFieldValue('otherrefnum'));
        if(obj.poNumber == null) {
            obj.poNumber = '';
        }

    }

    obj.message = excapeXML(order.getFieldValue('message'));

    var billAddress = order.getFieldValue('billaddress');
    var billAddressLines = [""];
    if(billAddress != null) {
        billAddressLines = billAddress.split("\n");
    }
    for(var i = 0; i < 7; i++) {
        if(i < billAddressLines.length) {
            obj['billAddr'+(i+1)] = excapeXML(billAddressLines[i]);
        }
    }
    var shipAddress = order.getFieldValue('shipaddress');
    var shipAddressLines = [""];
    if(shipAddress != null) {
        shipAddressLines = shipAddress.split("\n");
    }
    for(var i = 0; i < 7; i++) {
        if(i < shipAddressLines.length) {
            obj['shipAddr'+(i+1)] = excapeXML(shipAddressLines[i]);
        }
    }

    var orderTotal = parseFloat(order.getFieldValue('total'));
    if(!isNaN(orderTotal)) {
		obj.total = CommaFormatted(nlapiFormatCurrency(orderTotal));
    } else {
        obj.total = '';
    }

    var subTotal = parseFloat(order.getFieldValue('subtotal'));
    if(!isNaN(subTotal)) {
        obj.subTotal = CommaFormatted(nlapiFormatCurrency(subTotal));
    } else {
        obj.subTotal = '';
    }

    var taxTotal = parseFloat(order.getFieldValue('taxtotal'));
    if(!isNaN(subTotal)) {
        obj.taxTotal = CommaFormatted(nlapiFormatCurrency(taxTotal));
    } else {
        obj.taxTotal = '';
    }

    var discountTotal = parseFloat(order.getFieldValue('discounttotal'));
    if(!isNaN(discountTotal)) {
            obj.discountTotal = nlapiFormatCurrency(discountTotal);
    } else {
        obj.discountTotal = '';
    }

    var handlingCost = parseFloat(order.getFieldValue('althandlingcost'));
    if(!isNaN(discountTotal)) {
            obj.handlingCost = nlapiFormatCurrency(handlingCost);
    } else {
        obj.handlingCost = '';
    }
    var shippingCost = parseFloat(order.getFieldValue('altshippingcost'));
    if(!isNaN(discountTotal)) {
            obj.shippingCost = nlapiFormatCurrency(shippingCost);
    } else {
        obj.shippingCost = '';
    }

    if(obj.type == 'invoice') {
        obj.licAggreement = '';
    } else {
        obj.licAggreement = formatTandC(tcRec.getFieldValue('custrecord_celigo_tc_desc'));
    }
    
    
    if (tcType == '5') {
    	obj.licAggreement = obj.licAggreement.split("&lt;columnbreak /&gt;");
    	if (obj.licAggreement.length > 2) {
    		
    	obj.licAggreement[0] = obj.licAggreement[0] + "</p>";
    	obj.licAggreement[1] = "<p>" + obj.licAggreement[1] + "</p>";
    	obj.licAggreement[2] = "<p>" + obj.licAggreement[2];
    	
    	obj.columnFormat = true;
    	}
    }
    
    var data = {};
    data.order = obj;

    var file = nlapiLoadFile(bfoFileId);
    var template = file.getValue();
    var xmlResult = template.process(data);

    nlapiLogExecution('DEBUG', 'XML:', xmlResult);

    
//    response.setContentType('PLAINTEXT','result.txt');
//    response.write(xmlResult );

    
    return nlapiXMLToPDF( xmlResult );
}

function zeroPad(d,n) {
    var s = '' + n;
    while(s.length < d) {
        s = '0' + d;
    }
    if(n < 10) {
        return '0' + n;
    }
    return '' + n;
}

function makeDateIdBase() {
    var today = new Date();

    var y = today.getFullYear() - 2000;
	var m = today.getMonth() + 1;
	var d = today.getDate();
	var h = today.getHours();

    return '' + zeroPad(2,y) + zeroPad(2,m) + zeroPad(2,d) + zeroPad(2,h);
}


/*
    public APIs

    This is call by SF integration piece

/*
    called as lib function
 */

function printWithTC(txType, txId) {
    var order = nlapiLoadRecord(txType,txId);
    return genPdf(order);
}

/*
    invoked from form button
 */

function genPdfServlet(request,response) {
    var txId = request.getParameter('tx_id');
    var txType = request.getParameter('tx_type');
    var disposition =  nlapiGetContext().getSetting('SCRIPT', 'custscript_bfo_disposition');
    if(disposition != 'inline') {
        disposition = 'attachment';
    }
    var order = nlapiLoadRecord(txType,txId);
    var tcPdf = genPdf(order);
    var fileName = "Order " + order.getFieldValue('tranid');
    if(txType == 'invoice') {
        fileName = "Invoice " + order.getFieldValue('tranid') + ".pdf";
    } else if(txType == 'estimate') {
        fileName = "Quote " + order.getFieldValue('tranid') + ".pdf";
    }
    response.setContentType('PDF', fileName, disposition);
    response.write( tcPdf.getValue() );
}

function CommaFormatted(amount)
{
	var delimiter = ","; // replace comma if desired
	var a = amount.split('.',2);
	var d = a[1];
	var i = parseInt(a[0]);
	if(isNaN(i)) { return ''; }
	var minus = '';
	if(i < 0) { minus = '-'; }
	i = Math.abs(i);
	var n = new String(i);
	var a = [];
	while(n.length > 3)
	{
		var nn = n.substr(n.length-3);
		a.unshift(nn);
		n = n.substr(0,n.length-3);
	}
	if(n.length > 0) { a.unshift(n); }
	n = a.join(delimiter);
	if(d.length < 1) { amount = n; }
	else { amount = n + '.' + d; }
	amount = minus + amount;
	return amount;
}
// end of function CommaFormatted()
