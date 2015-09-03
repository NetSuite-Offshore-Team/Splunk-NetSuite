
function afterSubmit(type) {
	if (nlapiGetFieldValue('custbody_celigo_ns_sfdc_sync_celigo_up') == 'T')
		return;
		
	if (nlapiGetFieldValue('memdoc') != null)
		return;
		
	if (checkIfShouldRunItemGroupCode(type)) {
		try {
			nlapiLogExecution('debug',nlapiGetRecordType(), nlapiGetRecordId() );
			var ig = new ItemGroupEnhance(nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId(), {recordmode: 'dynamic'}));
			nlapiLogExecution('debug','start processing item group', '...');
			ig.handle();
	
		} catch(e) {
			try {nlapiDeleteRecord(nlapiGetRecordType(),nlapiGetRecordId());} catch (e2){}
			throw e;
		}
	}
		
	tranSync(type);
		
	try {
		closeEstimates(type);
	} catch (e) {
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
	
}

function checkIfShouldRunItemGroupCode(type) {
	//should only take effect on ws api
	if (nlapiGetContext().getExecutionContext() !== 'webservices') {
		return false;
	}
	//should only take effect on creat/edit action types
	if (type.toLowerCase() != 'create' && type.toLowerCase() != 'edit') {
		return false;
	}
	//should only take effect on estimate / sales order
	if (nlapiGetRecordType().toLowerCase() != 'estimate' && nlapiGetRecordType().toLowerCase() != 'salesorder') {
		return false;
	}
	
	var runItemGroupFieldValue = nlapiGetNewRecord().getFieldValue('custbody_celigo_run_item_group');
	if (runItemGroupFieldValue != 'T') {
		return false;
	}
	return true;
}

function tranSync(type) {

	var entitySfdcIdField = 'custentity_celigo_ns_sfdc_sync_id';
	
	var newRecord;
	if (type.toLowerCase() == 'delete')
		newRecord = nlapiGetNewRecord();
	else {
		try {
			newRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		} catch (e) { return; }
	}
	
	if (newRecord.getRecordType() == 'itemfulfillment') {
		if (newRecord.getFieldValue('createdfrom') != null && newRecord.getFieldValue('createdfrom') != '')
			newRecord = nlapiLoadRecord('salesorder', newRecord.getFieldValue('createdfrom'));
		else
			return;
	
	}
	
	if (newRecord.getFieldValue('entity') != null && newRecord.getFieldValue('entity') != '') {
		var sfdcId = nlapiLookupField('customer', newRecord.getFieldValue('entity'), entitySfdcIdField);
		if (sfdcId == null || sfdcId == '')
			return;
	} else if (newRecord.getFieldValue('customer') != null && newRecord.getFieldValue('customer') != '') {
		var sfdcId = nlapiLookupField('customer', newRecord.getFieldValue('customer'), entitySfdcIdField);
		if (sfdcId == null || sfdcId == '')
			return;
	}
	
	tranSyncHelper(newRecord, type);
}

function tranSyncHelper(newRecord, type) {
	
	var id = nlapiGetContext().getSetting('SCRIPT', 'custscript_celigo_integration_id');
	if (id != null && id != '') {
		if (nlapiGetContext().getEnvironment().toLowerCase() == 'sandbox' || nlapiGetContext().getEnvironment().toLowerCase() == 'beta')
			id = id + nlapiGetContext().getEnvironment().toLowerCase();
		else;
	} else;
	var host = nlapiGetContext().getSetting('SCRIPT', 'custscript_celigo_integration_host');
	if (id == null || host == null)
		return;
			
	var url = host + '/axon/sync/' + nlapiGetContext().getCompany() + '/' + id + '/sfdc/transactionSync';
	
	var array = new Array();
	array['id'] = newRecord.getId();
	nlapiLogExecution('DEBUG', 'Requesting', url);	
	
	var response = null;
	try {
		response = sendToIntegrator(type, newRecord, url, array);
	} catch (e) {
		try {
			response = sendToIntegrator(type, newRecord, url, array);
		} catch (e2) {
			response = sendToIntegrator(type, newRecord, url, array);
		}
	}
	
	if (response.getHeader('SyncStatus') == null ||
		response.getHeader('SyncStatus') == '' ||
		response.getHeader('SyncStatus').toLowerCase() != 'true')
		throw "Cannot Sync with SFDC.  Integration server failed to persist event.  Please try again.";
}

function sendToIntegrator(type, newRecord, url, array) {
	try {
		var attachPdf = nlapiGetContext().getSetting('SCRIPT', 'custscript_celigo_ns_sfdc_attach_pdf');
		if (attachPdf == 'T' && type.toLowerCase() != 'delete' && newRecord.getRecordType().toLowerCase() == nlapiGetRecordType().toLowerCase()) {
			var pdf = nlapiPrintRecord('TRANSACTION', newRecord.getId(), 'PDF', null);
			var t1 = new Date().getTime();
			response = nlapiRequestURL(url, pdf.getValue(), array, null);
			var t2 = new Date().getTime();
			nlapiLogExecution('DEBUG', 'nlapiRequestURL (POST) perf audit', ((1*t2) - (1*t1)));
		} else {
			var t1 = new Date();
			response = nlapiRequestURL(url, null, array, null);
			var t2 = new Date().getTime();
			nlapiLogExecution('DEBUG', 'nlapiRequestURL (GET) perf audit', ((1*t2) - (1*t1)));
		}
		return response;
	} catch (e) {
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
		throw e;
	}
}

function closeEstimates(type) {

	if (type.toLowerCase() != 'create')
		return;
		
	var newRecord = nlapiGetNewRecord();
	
	if (newRecord.getRecordType().toLowerCase() != 'salesorder')
		return;
	
	if (newRecord.getFieldValue('custbody_celigo_ns_sfdc_sync_id') == null || 
			newRecord.getFieldValue('custbody_celigo_ns_sfdc_sync_id') == '')
		return;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custbody_celigo_ns_sfdc_sync_id', null, 'is', newRecord.getFieldValue('custbody_celigo_ns_sfdc_sync_id'), null);
	filters[1] = new nlobjSearchFilter('mainline', null, 'is', 'T', null);
	var columns = new Array();
	
	var searchresults = nlapiSearchRecord('estimate', null, filters, columns);
	
	if (searchresults == null || searchresults.length == 0)
		return;

	for (var i=0; i<searchresults.length; i++) { 
		var update = nlapiLoadRecord(searchresults[i].getRecordType(), searchresults[i].getId());
		update.setFieldValue('probability', '100');
		nlapiSubmitRecord(update, true);
		tranSyncHelper(update, 'edit');
	}
}

 function ItemGroupEnhance(record) {
	
	//private prop
	var
	that = this,
	r,//the ns record object
	gs,//obj, props are group item ids, values are group item quantities
	gis,//obj, props are group item ids, values are arrays of the sublist line items that falls under each group
	offset,//int offset to value to dynamically adjust the index when removing line item in place
	trim = function(s) {
		if(typeof s === 'string')
			return s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
	};
	
	//public prop
	this.isDebug = true;
	this.rt = record.getRecordType();//ns record type
	this.st = 'item';//ns sublist type
	
	
	if (record && typeof record === 'object') {
		r = record;
		gs = {};
		gis = {};
		offset = 0;
	}else{
		throw new Error('The given argument is not a nlobjRecord.');
	}
	
	//public methods
	this.handle = function(){
		//first iteration, get all group items, take note of the groups, copy group items, remove them from the list
		for (var l = 1; l <= r.getLineItemCount(this.st); l = l + 1 - offset) {
			//get line in dynamic mode
			r.selectLineItem(this.st,l);
			//reset offset
			offset = 0;
			//get the group id
			var gid = r.getCurrentLineItemValue(this.st, 'custcol_celigo_group_item_internal_id');
			if (typeof gid === 'string' && trim(gid) !== '') {
				var gq = r.getCurrentLineItemValue(this.st, 'custcol_celigo_group_item_quantity');
				//check if the group quantity is in place if not simply set it
				if (gq) {
					if (!gs[gid])
						gs[gid] = gq;
					else {
						//if they are equal and the item is not in gis[gid], do nothing
						//otherwise throw an error multi-instances of same group is not supported
						if (!(gs[gid] === gq && !isItemInArray(r.getCurrentLineItemValue(this.st, 'item'), gis[gid])))
							throw new Error('multi-instances of same group is not supported');
					}
				}

				//now that this is a line item that needs to go into a group,make a copy of the line item in gis
				if (!gis[gid]) 
					gis[gid] = [];

				gis[gid].push(copyLineItem_d());
				
				//delete the line item, set the offset
				r.removeLineItem(this.st, l);
				nlapiLogExecution('debug', 'removed original line #'+l);
				nlapiLogExecution('debug', 'current item list length '+ r.getLineItemCount(this.st));
				offset = 1;
			}
		}
		
		//insert all groups into the first line
		insertGroups_d();
		
		//reload the record in standard mode, if in dynamic mode, the sequence of setting fields is important and very difficult to ensure
		nlapiSubmitRecord(r, true, false);
		r = nlapiLoadRecord(this.rt, nlapiGetRecordId());
		
		//iterate gis and the sublist again,find starting and ending line of each group
		//remove in list members
		//add gis[gid] members into the list
		for (var g in gis) {
			//skip any wrapped in functions within the obj
			if (typeof gis[g] === 'function') 
				continue;
			//an entry of a group
			var list = gis[g];
			var del = false;
			//iterate the sublist
			for (var l = 1; l <= r.getLineItemCount(this.st); l = l + 1 - offset) {
				//found starting line of the group
				if (r.getLineItemValue(this.st, 'item', l) === g && r.getLineItemValue(this.st, 'itemtype', l) === 'Group') {
					del = true;
					offset = 0;
				}else if (r.getLineItemValue('item', 'item', l) === '0' && r.getLineItemValue('item', 'itemtype', l) === 'EndGroup') {
					if (del) {
						//del flag is gonna change from true to false, this is the ending line of a group new lines should be insert here
						insertLineItems(list, l);
						offset = 0 - list.length;
					}
					del = false;
					offset = 0;
				//default exploded items by the system, if del flag is set then remove
				}else {
					if (del) {
						var item = r.getLineItemValue('item', 'item', l);
						//this is a record exploded by netsuite, remove
						r.removeLineItem('item', l);
						nlapiLogExecution('debug', 'removed ns exploded line #'+l);
						offset = 1;
					}else 
						offset = 0;
				}
			}
		}
		
		debug('final submit','');
		logRecord(r);
		//submit
		nlapiSubmitRecord(r, true, false);
	}
	
	//private methods
	function debug(title,msg){
		if(that.isDebug) nlapiLogExecution('DEBUG',title,msg);
	}
	
	function logRecord(){
		debug('Id', r.getId());
		debug('entity',r.getFieldText('entity'));
		for (var lineNum = 1; lineNum <= r.getLineItemCount(that.st); lineNum++) {
			var item = r.getLineItemValue(that.st, 'item', lineNum);
			var type = r.getLineItemValue(that.st, 'itemtype', lineNum);
			var quan = r.getLineItemValue(that.st, 'quantity', lineNum);
			var amount = r.getLineItemValue(that.st, 'amount', lineNum);
			var groupid = r.getLineItemValue(that.st, 'custcol_celigo_group_item_internal_id', lineNum);
			debug('lineitem'+lineNum, item+','+type+','+quan+','+amount+','+groupid);
		}
	}
	
	//copy the CURRENT line item and return an obj containing all the value with fld name as associatives
	//must work in DYNAMIC mode
	function copyLineItem_d(){
		var tgt = {};
		var flds = r.getAllLineItemFields(that.st);
		for (var j = 0; j < flds.length; j++) {
			tgt[flds[j]] = r.getCurrentLineItemValue(that.st, flds[j]);
		}
		return tgt;
	}
	
	//copy the line item on the given line and return an obj containing all the value with fld name as associatives
	function copyLineItem(linenum){
		var tgt = {};
		var flds = r.getAllLineItemFields(that.st);
		for (var j = 0; j < flds.length; j++) {
			tgt[flds[j]] = r.getLineItemValue(that.st, flds[j],linenum);
		}
		return tgt;
	}
	
	function isItemInArray(item,array){
		if(item==null||item===''||item===0)return false;
		for(var i=0;i<array.length;i++){
			if(array[i]['item']===item)return true;
		}
		return false;
	}
	
	//insert the groups in gs into the head of the sublist
	//MUST work in dynmic mode
	function insertGroups_d(){		
		for (var g in gs) {
		    nlapiLogExecution('debug', 'inserting item group '+g, 'quantity is '+gs[g]);
			if (typeof gs[g] != 'function') {
				r.insertLineItem(that.st, 1);
				r.selectLineItem(that.st, 1);
				r.setCurrentLineItemValue(that.st, 'item', g);
				r.setCurrentLineItemValue(that.st, 'quantity', gs[g] || 1);
				r.commitLineItem(that.st);
			}
		}
	}
	
	//insert stored line items in list onto line#l
	//MUST work in STANDARD mode
	function insertLineItems(list,l){
		for(var i = list.length - 1; i >= 0; i--) {
			var lineitem = list[i];
			//add a new line
			r.insertLineItem(that.st, l);
			debug('inserting new line on#'+l,lineitem['item']+','+lineitem['quantity']);
			for (var prop in lineitem){
				if (typeof lineitem[prop] != 'function' && prop !== 'line') {
					r.setLineItemValue(that.st, prop, l, lineitem[prop]);
				}
			}
			//insert default price if price has not been set
			if( !r.getLineItemValue(that.st, 'rate', l))
				r.setLineItemValue(that.st, 'rate', l, 0.00);
		}	
	}

	//constructor state
	return true;
}