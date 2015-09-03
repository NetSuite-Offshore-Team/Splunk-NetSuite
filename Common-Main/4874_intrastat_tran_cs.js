/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

var VAT;
if (!VAT) VAT = {};
VAT.taxtrantype = "BILL";

VAT.LogError = function (ex, functionname) {
	var errorMsg = ex.getCode != null ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message != null ? ex.message : ex);
	nlapiLogExecution("ERROR", functionname, errorMsg);
};

//Business Logic Functions
//Setting the nexus NOTC
VAT.NexusNOTC = function () {
	this.run = function(mode) {
		if (VAT.taxtrantype != "RETURN" && VAT.taxtrantype != "RCPT" &&  VAT.taxtrantype != "CHK" && VAT.taxtrantype != "CREDMEM" &&  
				VAT.taxtrantype != "INV" && VAT.taxtrantype != "SALESORD" && VAT.taxtrantype != "BILL" && VAT.taxtrantype != "BILLCRED") {return;}
		
		initNexusNOTC(mode);
	};
	
	function initNexusNOTC(mode) {
		try {
			if (mode == 'edit') { //Intrastat
				var nexus_notc = nlapiGetFieldValue('custpage_temp_nexus_notc');
				
				if (nexus_notc) {
					nlapiSetFieldValue('custbody_nexus_notc', nexus_notc);
				}
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NexusNOTC.initNexusNOTC");}
	}
};

//Non-Deductible Tax Codes
VAT.NonDeductible = function (sublistid) { //needs nexus check!!!
	var taxCodeCache = {};
	var fieldCache = {};
	var nondeductiblecodes = {};
	var runstatus = false;
	var numberofnondeductiblelines = 0; 
	var numberofprocessedlines = 0;
	var lastProcessingIndex = 1;
	var isNonDeductible = nlapiGetFieldValue("custpage_isnondeductible");
	
	try {
		if (isNonDeductible && isNonDeductible == "T") {
			var taxcodecachestr = nlapiGetFieldValue("custpage_taxcodecache"); 
			taxCodeCache = Ext.util.JSON.decode(taxcodecachestr);
			
			var fieldcachestr = nlapiGetFieldValue("custpage_fieldcache"); 
			fieldCache = Ext.util.JSON.decode(fieldcachestr);
			
			var nondeductiblestr = nlapiGetFieldValue("custpage_nondeductiblecodes"); 
			nondeductiblecodes = Ext.util.JSON.decode(nondeductiblestr);
		}
	} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.initialize");}

	/*Begin pageinit functions*/
	this.initialize = function (mode) {
		if (mode == "copy") {
			nlapiSetFieldValue("custbody_nondeductible_processed", "F");
			nlapiSetFieldValue("custbody_nondeductible_ref_genjrnl", "");
			nlapiSetFieldValue("custbody_nondeductible_ref_tran", "");
		}
		return ;
	};
	
	/*End pageinit functions*/

	
	/*onsave functions*/
	function checkUnprocessedSublist(sublistid) {
		var hasUnprocessedSublist = false;
		try {
			var sublistcount = parseInt(nlapiGetLineItemCount(sublistid));
			for(var iline = 1; iline<=sublistcount; iline++) {
				var taxcodeid = nlapiGetLineItemValue(sublistid, "taxcode", iline);
				
				if (taxCodeCache[taxcodeid] && iline == sublistcount) { //last item not processed
					hasUnprocessedSublist = true;
					break;
				} else if (taxCodeCache[taxcodeid]) { //mid item
					if (VAT.taxtrantype != "GENJRNL") {
						var nondeductibleid = nlapiGetLineItemValue(sublistid, "taxcode", iline+1);
						if (!nondeductiblecodes[nondeductibleid]) {
							hasUnprocessedSublist = true;
							break;
						}
					} else {
						var accountid = nlapiGetLineItemValue(sublistid, "account", iline+1);
						if (taxCodeCache[taxcodeid].account != accountid) {
							hasUnprocessedSublist = true;
							break;
						}
					}
				}
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.checkUnprocessedSublist");}
		return hasUnprocessedSublist;
	}
	
	this.checkLineItems = function() {
		try {
			if (VAT.taxtrantype != "BILL" && VAT.taxtrantype != "CHK" && VAT.taxtrantype != "BILLCRED" &&
				VAT.taxtrantype != "EXPREPT" && VAT.taxtrantype != "GENJRNL"
			) {return true;}
			
			
			if (nlapiGetFieldValue("custpage_checkpref") == "F") {
				return true;
			}

			var hasUnprocessedItem = false;
			var hasUnprocessedExpense = false;
			var hasUnprocessedLine = false;
			
			switch (VAT.taxtrantype) {
				case "BILL": case "CHK": case "BILLCRED":
					hasUnprocessedExpense = checkUnprocessedSublist("expense"); 
					hasUnprocessedItem = checkUnprocessedSublist("item") 
					break;
				case "GENJRNL":
					if (nlapiGetFieldValue("void") == "T") { //voided
						hasUnprocessedLine = false;
					} else {
						hasUnprocessedLine = checkUnprocessedSublist("line");	
					}
					break;
				case "EXPREPT":
					hasUnprocessedExpense = checkUnprocessedSublist("expense");
					break;
			}
			
			if (hasUnprocessedItem || hasUnprocessedExpense || hasUnprocessedLine) {
				var msg = [];
				
				msg.push("There are line items with unapplied non-deductible tax amounts.\n"); 
				msg.push("Click OK to save this transaction without applying the non-deductible tax amounts.\n"); 
				msg.push("Or click Cancel to go back to the transaction form.\n");
				msg.push("You can recalculate the tax amounts by clicking the Calculate Non-Deductible Tax button on the form");
				
				return (confirm(msg.join("")));
			} else {
				return true;
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.checkLineItems");}
	};
	/*End onsave functions*/
	
	this.getRunStatus = function () {return runstatus;};
	
	this.countNonDeductibleLines = function () {
		try {
			var sublistcount = parseInt(nlapiGetLineItemCount(sublistid));
			for(var iline = 1; iline <= sublistcount; iline++) {
				var taxcodeid = nlapiGetLineItemValue(sublistid, "taxcode", iline);
				var unprocessed = false;
				if (sublistcount == iline) {
					unprocessed = true;
				} else {
					if (VAT.taxtrantype != "GENJRNL") {
						var nexttaxcodeid = nlapiGetLineItemValue(sublistid, "taxcode", iline+1);
						if (!nondeductiblecodes[nexttaxcodeid]) {
							unprocessed = true;
						}
					} else {
						var accountid = nlapiGetLineItemValue(sublistid, "account", iline+1);
						if (taxCodeCache[taxcodeid].account != accountid) {
							unprocessed = true;
						}
					}
				}
				
				if (taxCodeCache[taxcodeid] && unprocessed) {
					numberofnondeductiblelines++;
				}
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.countNonDeductibleLines");}
		
		return numberofnondeductiblelines;
	};
	
	this.countProcessedLines = function() { return numberofprocessedlines;};
	
	this.getLastProcessingIndex = function() {return lastProcessingIndex;};
	
	this.hasUnprocessedLine = function() {return numberofprocessedlines != numberofnondeductiblelines;};
	
	this.run = function () {
		try {
			if (VAT.taxtrantype != "BILL" && VAT.taxtrantype != "CHK" && VAT.taxtrantype != "BILLCRED" &&
				VAT.taxtrantype != "EXPREPT" && VAT.taxtrantype != "GENJRNL"
			) {return true;} 
			runstatus = true;
			createNonDeductibleLineItem();
			numberofprocessedlines++;
			runstatus = false;
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.run");}
	};
	
	function copyNonDeductibleLine(linenum, sublistcount) {
		var currentline = {};
		try {
			var cacheList = [];
			switch (sublistid) {
				case "item":
					cacheList = fieldCache.item;
					break;
				case "expense":
					cacheList = fieldCache.expense;
					break;
				case "line":
					cacheList = fieldCache.line;
					break;
			}
			var copy = false;
			
			if (sublistcount == linenum) {//last line item or tax amount intact
				copy = true;
			} else {//mid item
				var taxcodeid = nlapiGetLineItemValue(sublistid, "taxcode", linenum);
				
				if (VAT.taxtrantype != "GENJRNL") {
					var nondeductibleid = nlapiGetLineItemValue(sublistid, "taxcode", linenum+1);
					if (!nondeductiblecodes[nondeductibleid]) {
						copy = true;
					}
				} else {
					var accountid = nlapiGetLineItemValue(sublistid, "account", linenum+1);
					if (taxCodeCache[taxcodeid].account != accountid) {
						copy = true;
					}
				}
			}
			
			if (!copy) {return;}
			
			for(var ifield = 0; ifield < cacheList.length; ifield++) {
				var fieldname = cacheList[ifield];
				currentline[fieldname] = {value: nlapiGetLineItemValue(sublistid, fieldname, linenum), 
						text: nlapiGetLineItemText(sublistid, fieldname, linenum)};				
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.copySubListLine");}
		return currentline;
	}
	
	function getNonDeductibleLine() { //One line only
		var lineToInsert = [];
		try {
			var sublistcount = parseInt(nlapiGetLineItemCount(sublistid));
			for(var iline = lastProcessingIndex; iline <= sublistcount; iline++) {
				var taxcodeid = nlapiGetLineItemValue(sublistid, "taxcode", iline);
				
				if (taxCodeCache[taxcodeid]) {
					var lineitem = copyNonDeductibleLine(iline, sublistcount); 
					
					if (lineitem) {
						lineToInsert.push({"lineid": iline, "lineobj": lineitem});
						lastProcessingIndex = iline;
						break;
					}
				}
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.getSublistNonDeductibleLine");}
		
		return lineToInsert;
	}
	
	function createNonDeductibleLineItem() {
		try {
			if (sublistid == "item") {
				processItem();
			} else if (sublistid == "expense") { //One version for bill, another for expense report
				processExpense();
			} else if (sublistid == "line") {
				processJournalLine("line");
			}
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.calculateNonDeductible");}
	}
	
	function processItem() {
		try {
			var lineToInsert = getNonDeductibleLine();
			if (lineToInsert.length == 0) {
				return true;
			}
			
			var linenum = parseInt(lineToInsert[0].lineid);
			var currentline = lineToInsert[0].lineobj;
			var currentSublistCount = parseInt(nlapiGetLineItemCount(sublistid));

			var taxcodeid = currentline["taxcode"].value;
			var taxamount = currentline["tax1amt"].value;
			var grossamount = currentline["grossamt"].value;

			var reclaimablevat = nlapiFormatCurrency((taxCodeCache[taxcodeid].reclaimablerate * parseFloat(taxamount))/100);
			var nondeductiblevat = nlapiFormatCurrency(parseFloat(taxamount) - parseFloat(reclaimablevat));
			var revisedgrossamount = nlapiFormatCurrency(parseFloat(grossamount) - parseFloat(nondeductiblevat));

			if ((linenum+1) > currentSublistCount) {
				nlapiSelectNewLineItem(sublistid);
			} else {
				nlapiSelectLineItem(sublistid, linenum+1);
				nlapiInsertLineItem(sublistid, linenum+1);
			}
		
			var lineToUpdate = {nondeductiblevat: nondeductiblevat, referenceline: (linenum),
				reclaimablevat:reclaimablevat, revisedgrossamount: revisedgrossamount}; 
				
			for(var ifield = 0; ifield < fieldCache.item.length; ifield++) {
				var currentfield = fieldCache.item[ifield];
				
				if (!currentline[currentfield].value && currentfield!= "custcol_nondeductible_account") {continue;}
				switch(currentfield) {
					case "item":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, true, true);
						break;
					case "taxcode":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, taxCodeCache[taxcodeid].taxcodeid, true, true);
						break;
					case "quantity": case "amount":  
						nlapiSetCurrentLineItemValue(sublistid, currentfield, 0, true, true);
						break;
					case "tax1amt": case "grossamount": 
						nlapiSetCurrentLineItemValue(sublistid, currentfield, nondeductiblevat, true, true);
						break;
					case "custcol_nondeductible_account":
						nlapiSetCurrentLineItemValue(sublistid, "custcol_nondeductible_account", taxCodeCache[taxcodeid].account, false, false);
						break;
					case "location": case "class": case "department": case "customer":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, true, false);
						break;
					default:
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, false, false);
				}
			};
			nlapiCommitLineItem(sublistid);
			nlapiSetLineItemValue(sublistid, "tax1amt", linenum, reclaimablevat);
			nlapiSetLineItemValue(sublistid, "grossamt", linenum, revisedgrossamount);
			nlapiSetLineItemValue(sublistid, "grossamt", linenum+1, nondeductiblevat);
			nlapiSelectLineItem(sublistid, linenum);
			nlapiCommitLineItem(sublistid);
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.processItems");}
	}
	
	function processExpense() {
		try {
			var lineToInsert = getNonDeductibleLine();
			if (lineToInsert.length == 0) {
				return true;
			}
			
			var linenum = parseInt(lineToInsert[0].lineid);
			var currentline = lineToInsert[0].lineobj;
			var currentSublistCount = parseInt(nlapiGetLineItemCount(sublistid));
				
			var taxcodeid = currentline["taxcode"].value;
			var taxamount = currentline["tax1amt"].value;
			var grossamount = currentline["grossamt"].value;
				
			var reclaimablevat = nlapiFormatCurrency((taxCodeCache[taxcodeid].reclaimablerate * parseFloat(taxamount))/100);
			var nondeductiblevat = nlapiFormatCurrency(parseFloat(taxamount) - parseFloat(reclaimablevat));
			var revisedgrossamount = nlapiFormatCurrency(parseFloat(grossamount) - parseFloat(nondeductiblevat));
			
			nlapiSetLineItemValue(sublistid, "tax1amt", linenum, reclaimablevat);
			nlapiSetLineItemValue(sublistid, "grossamt", linenum, revisedgrossamount);
			
			if ((linenum+1) > currentSublistCount) {
				nlapiSelectNewLineItem(sublistid);
			} else {
				nlapiSelectLineItem(sublistid, linenum+1);
				nlapiInsertLineItem(sublistid, linenum+1);
			}

			for(var ifield = 0; ifield < fieldCache.expense.length; ifield++) {
				var currentfield = fieldCache.expense[ifield];
				if (!currentline[currentfield].value && currentfield!= "custcol_nondeductible_account") {continue;}
				
				switch(currentfield) {
					case "grossamt": break;
					case "account": case "category":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, true, true);
						break;
					case "taxcode": 
						nlapiSetCurrentLineItemValue(sublistid, currentfield, taxCodeCache[taxcodeid].taxcodeid, true, true);
						break;
					case "amount":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, 0, true, true);
						break;
					case "tax1amt": 
						nlapiSetCurrentLineItemValue(sublistid, currentfield, nondeductiblevat, true, true);
						break;
					case "location": case "class": case "department": case "customer":
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, true, false);
					case "custcol_nondeductible_account":
						nlapiSetCurrentLineItemValue(sublistid, "custcol_nondeductible_account", taxCodeCache[taxcodeid].account, false, false);
						break;
					default:
						nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, false, false);
				}
			}
			nlapiCommitLineItem(sublistid);
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.processBillExpense");}
	}
	
	function processJournalLine() {
		try {
			var lineToInsert = getNonDeductibleLine(sublistid);
			if (lineToInsert.length == 0) {
				return true;
			}
			
			var linenum = parseInt(lineToInsert[0].lineid);
			var currentline = lineToInsert[0].lineobj;
			var currentSublistCount = parseInt(nlapiGetLineItemCount(sublistid));
				
			var taxcodeid = currentline["taxcode"].value;
			var taxamount = currentline["tax1amt"].value;
			var grossamount = currentline["grossamt"].value;
			
			var reclaimablevat = nlapiFormatCurrency((taxCodeCache[taxcodeid].reclaimablerate * parseFloat(taxamount))/100);
			var nondeductiblevat = nlapiFormatCurrency(parseFloat(taxamount) - parseFloat(reclaimablevat));
			var revisedgrossamount = nlapiFormatCurrency(parseFloat(grossamount) - parseFloat(nondeductiblevat));
			
			nlapiSetLineItemValue(sublistid, "tax1amt", (linenum), reclaimablevat);
			nlapiSetLineItemValue(sublistid, "grossamt", (linenum), revisedgrossamount);
			nlapiSetLineItemValue(sublistid, "custcol_nondeductible_account", (linenum), taxCodeCache[taxcodeid].account);

			if ((linenum+1) > currentSublistCount) {
				nlapiSelectNewLineItem(sublistid);
			} else {
				nlapiSelectLineItem(sublistid, linenum+1);
				nlapiInsertLineItem(sublistid, linenum+1);
			}
			
			for(var ifield = 0; ifield < fieldCache.line.length; ifield++) {
				var currentfield = fieldCache.line[ifield];
				if (currentline[currentfield].value) {
					switch(currentfield) {
						case "taxcode": case "tax1amt": case "grossamt": break;
						case "account":
							nlapiSetCurrentLineItemValue(sublistid, currentfield, taxCodeCache[taxcodeid].account, true, true);
							break;
						case "credit":
							nlapiSetCurrentLineItemValue(sublistid, currentfield, nondeductiblevat, true, true);
							break;
						case "debit":
							nlapiSetCurrentLineItemValue(sublistid, currentfield, nondeductiblevat, true, true);
							break;
						case "location": case "class": case "department": case "entity":
							nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, true, true);
							break;
						default:
							nlapiSetCurrentLineItemValue(sublistid, currentfield, currentline[currentfield].value, false, false);
							if (currentline[currentfield].text) {
								nlapiSetCurrentLineItemText(sublistid, currentfield, currentline[currentfield].text, false, false);	
							}
					}
				}
			}
			nlapiSetCurrentLineItemValue(sublistid, "memo", "Adjustment for non-deductible tax", true, true);
			nlapiCommitLineItem(sublistid);
		} catch (ex) {VAT.LogError(ex, "VAT.NonDeductible.processJournalLines");}
	}
};


//Declared Functions
function onPageInit(mode) {
	try {
		var currentcontext = nlapiGetContext().getExecutionContext();
		var executioncontext = VAT.Constants.ScriptMap["customscript_tax_tran_cs"].executioncontext;
		var clientcontext = executioncontext ? executioncontext.join(",") : "";
		if (clientcontext.indexOf(currentcontext) == -1) {return true;}

		//populate the tran VAT.taxtrantype
		var trantype = nlapiGetFieldValue("type");
		
		for(var imap in VAT.Constants.TransactionMap) {
			if (VAT.Constants.TransactionMap[imap].alternatecode == trantype) {
				VAT.taxtrantype = imap;
				break;
			}
		}
		
		new VAT.NexusNOTC().run(mode);
		new VAT.NonDeductible().initialize(mode);
	} catch(ex) {VAT.LogError(ex, "onPageInit");}
	return true;
}

function onSaveRecord() {
	try {
		var currentcontext = nlapiGetContext().getExecutionContext();
		var executioncontext = VAT.Constants.ScriptMap["customscript_tax_tran_cs"].executioncontext;
		var clientcontext = executioncontext ? executioncontext.join(",") : "";
		if (clientcontext.indexOf(currentcontext) == -1) {return true;}
		
		return new VAT.NonDeductible().checkLineItems();
	} catch (ex) {
		VAT.LogError(ex, "onSaveRecord");
	}
	return true;
}
function onValidateField(sublistid, fieldid, linenum) {return true;}
function onFieldChanged(sublistid, fieldid, linenum) {}
function onPostSourcing (sublistid, fieldid) {return true;}
function onLineInit(sublistid) {}

function runNonDeductibleItem() {
	try {
		var itemND = new VAT.NonDeductible("item");
		var nondeductiblelinecount = itemND.countNonDeductibleLines(); 
		
		var task = {
			run: function() {
				if (!itemND.getRunStatus() && itemND.hasUnprocessedLine()) { // run again
					Ext.MessageBox.updateProgress(itemND.countProcessedLines()/nondeductiblelinecount, 
							["Item ", (itemND.countProcessedLines() + 1), "of", nondeductiblelinecount].join(" "));
					itemND.run();
				} else {
					runner.stop(task);
					Ext.MessageBox.hide();
				}
			},
			interval: 1000
		};
		
		if (nondeductiblelinecount > 0) {
			Ext.MessageBox.show({
				 title: 'Calculating Non-Deductible Tax...',
				 msg: 'Creating  ...',
				 progressText: 'Initializing...',
				 width:300,
				 progress:true,
				 modal: false
			});
			
			var runner = new Ext.util.TaskRunner();
			runner.start(task);
		} else {
			alert("There are no lines to process");
		}
	} catch (ex) {VAT.LogError(ex, "runNonDeductibleItem");}
}

function runNonDeductibleExpense() {
	try {
		var expenseND = new VAT.NonDeductible("expense");
		var nondeductiblelinecount = expenseND.countNonDeductibleLines(); 
		
		var task = {
			run: function() {
				if (!expenseND.getRunStatus() && expenseND.hasUnprocessedLine()) { // run again
					Ext.MessageBox.updateProgress(expenseND.countProcessedLines()/nondeductiblelinecount, 
							["Item ", (expenseND.countProcessedLines() + 1), "of", nondeductiblelinecount].join(" "));
					expenseND.run();
				} else {
					runner.stop(task);
					Ext.MessageBox.hide();
				}
			},
			interval: 1000
		};
		
		if (nondeductiblelinecount > 0) {
			Ext.MessageBox.show({
				 title: 'Calculating Non-Deductible Tax...',
				 msg: 'Creating  ...',
				 progressText: 'Initializing...',
				 width:300,
				 progress:true,
				 modal: false
			});
			
			var runner = new Ext.util.TaskRunner();
			runner.start(task);
		} else {
			alert("There are no lines to process");
		}
	} catch (ex) {VAT.LogError(ex, "runNonDeductibleExpense");}
}

function runNonDeductibleLine() {
	try {
		var lineND = new VAT.NonDeductible("line");
		var nondeductiblelinecount = lineND.countNonDeductibleLines();
		
		var task = {
			run: function() {
				if (!lineND.getRunStatus() && lineND.hasUnprocessedLine()) { // run again
					Ext.MessageBox.updateProgress(lineND.countProcessedLines()/nondeductiblelinecount, 
							["Item ", (lineND.countProcessedLines() + 1), "of", nondeductiblelinecount].join(" "));
					lineND.run();
				} else {
					runner.stop(task);
					Ext.MessageBox.hide();
				}
			},
			interval: 1000
		};
			
		if (nondeductiblelinecount > 0) {
			Ext.MessageBox.show({
				 title: 'Calculating Non-Deductible Tax...',
				 msg: 'Creating  ...',
				 progressText: 'Initializing...',
				 width:300,
				 progress:true,
				 modal: false
			});
			
			var runner = new Ext.util.TaskRunner();
			runner.start(task);
		} else {
			alert("There are no lines to process");
		}
	} catch (ex) {VAT.LogError(ex, "runNonDeductibleLine");}
}