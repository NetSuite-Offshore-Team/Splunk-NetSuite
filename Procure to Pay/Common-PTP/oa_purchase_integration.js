// This script file is used with the NetSuite/OpenAir Purchase Order integration
// There is a general custom preference to enable the integration
// Then there is a user-level preference which enables the integration validation to be run
// in two modes: 
// 1) If the user has the user-level preference enabled, validation occurs for the purchase order lines. This requires access to view projects and items
// 2) If the user does not have the user-level preference enabled, the validation does not occur. This does not require view access to projects and items. 
// Either mode will allow users to create purchase orders and vendor bills that are exportable to OpenAir.

function validatePOLine(){

    // do we have the PO or vendor bill to OA PO integration enabled?
    // if not, return true and do not validate any of this
    var po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_po_integration');
    var vb_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
    var recType = nlapiGetRecordType();
    
    if ((recType == 'purchaseorder' && po_integration != 'T') || (recType == 'vendorbill' && vb_integration != 'T')) {
        return true;
    }
    
    // does this user want to use script to validate the line? this is a user custom preference
    var user_po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_user_create_po');
    
    var item_id = nlapiGetCurrentLineItemValue('item', 'item');
    var oa_rate = nlapiGetCurrentLineItemValue('item', 'rate');
    var tax_amt = nlapiGetCurrentLineItemValue('item', 'tax1amt');
    var job_id = nlapiGetCurrentLineItemValue('item', 'customer');
    var export_to_oa_line = nlapiGetCurrentLineItemValue('item', 'custcol_oa_export_to_openair');
    
    // check for project in the header when dealing with purchase orders
    // purchase orders can have the project in the header or the line level 
    if (job_id.length < 1 && recType == 'purchaseorder') {
        job_id = nlapiGetFieldValue('shipto');
    }
    
    // if the line is flagged export, populate the custom fields 
    if (export_to_oa_line == 'T') {
    
        // set the OA rate and tax custom columns to workaround currency revalue in advanced search
        nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_rate', oa_rate);
        if (tax_amt != null) {
            nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_line_tax', tax_amt);
        }
        
        // do we have an item picked? 
        if (item_id.length < 1) {
            alert('This line is marked export to OpenAir but an item has not been selected');
            return false;
        }
        
        // did we pick a project? 
        if (job_id.length < 1) {
            alert('This line is marked export to OpenAir but a project has not been selected');
            return false;
        }
        
        // check the line - do not allow export if project or item is not exportable
        if (user_po_integration == 'T') {
        
            // item export field
            var fields = ['custitem_oa_export_to_openair_product'];
            var values = nlapiLookupField('item', item_id, fields, false);
            
            // project export field
            var project_fields = ['custentity_oa_export_to_openair'];
            var project_values = nlapiLookupField('job', job_id, project_fields, false);
            
            if (project_values != null) {
                if (values.custitem_oa_export_to_openair_product != 'T' || project_values.custentity_oa_export_to_openair != 'T') {
                    alert('This line cannot be exported to OpenAir because either the item or the project is not marked export to OpenAir');
                    return false;
                }
            }
            else {
                alert('This line cannot be exported to OpenAir because either the item or the project is not marked export to OpenAir');
                return false;
            }
        }
    }
    
    return true;
}


function validateExportField(type, name){

    // do we have this integration enabled?
    // if not, return true and do not validate any of this
    var po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_po_integration');
    var vb_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
    var recType = nlapiGetRecordType();
    if ((recType == 'purchaseorder' && po_integration != 'T') || (recType == 'vendorbill' && vb_integration != 'T')) {
        return true;
    }
    
    // does this user want to use script to validate the line? this is a user custom preference
    var user_po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_user_create_po');
    
    // if the project is in the header, set the custom field
    if (name == 'shipto' && recType == 'purchaseorder') {
        var job_id = nlapiGetFieldValue('shipto');
        nlapiSetFieldValue('custbody_oa_purchase_project_id', job_id);
    }
    
    if (type == 'item' && name == 'customer' && user_po_integration == 'T') {
        var item_id = nlapiGetCurrentLineItemValue('item', 'item');
        var job_id = nlapiGetCurrentLineItemValue('item', 'customer');
        
        if (item_id != null && item_id.length > 0 && job_id != null && job_id.length > 0) {
            var fields = ['custitem_oa_export_to_openair_product'];
            var values = nlapiLookupField('item', item_id, fields, false);
            
            var project_fields = ['custentity_oa_export_to_openair'];
            var project_values = nlapiLookupField('job', job_id, project_fields, false);
            
            if (project_values != null) {
                if (values.custitem_oa_export_to_openair_product == 'T' && project_values.custentity_oa_export_to_openair == 'T') {
                    nlapiSetCurrentLineItemValue('item', 'custcol_oa_export_to_openair', 'T');
                }
            }
        }
    }
    else 
        if (type == 'item' && name == 'item' && user_po_integration == 'T') {
            var item_id = nlapiGetCurrentLineItemValue('item', 'item');
            var export_to_oa = nlapiGetCurrentLineItemValue('item', 'custcol_oa_export_to_openair');
            var job_id = nlapiGetFieldValue('shipto');
            
            if (item_id != null && item_id.length > 0 && job_id != null && job_id.length > 0) {
                var fields = ['custitem_oa_export_to_openair_product'];
                var values = nlapiLookupField('item', item_id, fields, false);
                
                var project_fields = ['custentity_oa_export_to_openair'];
                var project_values = nlapiLookupField('job', job_id, project_fields, false);
                
                if (project_values != null) {
                    if (values.custitem_oa_export_to_openair_product == 'T' && project_values.custentity_oa_export_to_openair == 'T') {
                        nlapiSetCurrentLineItemValue('item', 'custcol_oa_export_to_openair', 'T');
                    }
                }
                else {
                // do we need some autologic not to mark this export? 
                }
            }
            else 
                if (export_to_oa == 'T' && recType == 'purchaseorder') {
                
                    // only relevant when dealing with purchase orders and project is in header
                    alert('This line cannot be exported to OpenAir because either the item or the project is not marked export to OpenAir');
                }
        }
        else 
            if (type == 'item' && name == 'custcol_oa_export_to_openair') {
                var export_to_oa = nlapiGetCurrentLineItemValue('item', 'custcol_oa_export_to_openair');
                
                if (export_to_oa == 'T' && user_po_integration != 'T') {
                    // alert user to make sure project and item are exportable
                    alert('Make sure that the project and item on this line are marked Export to OpenAir.');
                }
            }
    
    return true;
}


function validateSavePOToOpenAir(){
    // do we have this integration enabled?
    // if not, return true and do not validate any of this
    var po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_po_integration');
    var vb_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
    var recType = nlapiGetRecordType();
    if ((recType == 'purchaseorder' && po_integration != 'T') || (recType == 'vendorbill' && vb_integration != 'T')) {
        return true;
    }
    
    // does this user want to use script to validate the line? this is a user custom preference
    var user_po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_user_create_po');
    
    var lineItemCount = nlapiGetLineItemCount('item');
    
    // throw an alert if a line isn't flagged export but item and project are export to OA
    for (var linenum = 1; linenum <= lineItemCount; linenum++) {
        var oa_rate = nlapiGetLineItemValue('item', 'rate', linenum);
        var tax_amt = nlapiGetLineItemValue('item', 'tax1amt', linenum);
        var item_id = nlapiGetLineItemValue('item', 'item', linenum);
        var export_to_oa = nlapiGetLineItemValue('item', 'custcol_oa_export_to_openair', linenum);
        
        // check for project in the header
        var job_id = nlapiGetFieldValue('shipto');
        if (job_id == null || job_id.length < 1) {
            job_id = nlapiGetLineItemValue('item', 'customer', linenum);
        }
        
        // look at the item and project
        var item_fields = ['custitem_oa_export_to_openair_product'];
        var project_fields = ['custentity_oa_export_to_openair'];
        var item_values;
        var project_values;
        if (item_id != null && item_id.length > 0 && job_id != null && job_id.length > 0 && user_po_integration == 'T') {
            item_values = nlapiLookupField('item', item_id, item_fields, false);
            project_values = nlapiLookupField('job', job_id, project_fields, false);
        }
        
        // validate the line 
        // this line is flagged export to OpenAir
        if (export_to_oa == 'T') {
        
            // if we've set the user preference, assumes this user has access to jobs and items and validate export
            if (user_po_integration == 'T') {
                // these lines are marked export to OA
                // missing either a project or item
                if (item_id == null || item_id.length < 1 || job_id == null || job_id.length < 1) {
                    alert('Line ' + linenum + ' marked export to OpenAir but no project or item selected.');
                    return false;
                }
                else 
                    if (item_values == null || project_values == null) {
                        // either item or project cannot be found
                        alert('Line ' + linenum + ' marked export to OpenAir but required item or project export to OpenAir custom fields are missing.');
                        return false;
                    }
                    else {
                        if (item_values.custitem_oa_export_to_openair_product != 'T' || project_values.custentity_oa_export_to_openair != 'T') {
                            // A line is marked export to OA but the corresponding item and/or project is not marked export to OA
                            alert('Line ' + linenum + ' is marked export to OpenAir but either the item or project is not marked export to OpenAir');
                            return false;
                        }
                    }
            }
            
            // make sure that the rate and tax are copied to custom fields
            //nlapiSetLineItemValue('item', 'custcol_oa_po_rate', linenum, oa_rate);			
            nlapiSelectLineItem('item', linenum);
            nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_rate', oa_rate);
            
            if (tax_amt != null) {
                //	nlapiSetLineItemValue('item', 'custcol_oa_po_line_tax', linenum, tax_amt);
                nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_line_tax', tax_amt);
            }
            
            nlapiCommitLineItem('item');
        }
        else 
            if (user_po_integration == 'T' &&
            ((po_integration == 'T' && vb_integration != 'T') || (po_integration != 'T' && vb_integration == 'T'))) {
                // Give warning that line is not flagged export to OpenAir when it could be 
                // Only PO integration is enabled OR 
                // Only VB integration is enabled 
                if (item_values != null && item_values.custitem_oa_export_to_openair_product == 'T' && project_values != null && project_values.custentity_oa_export_to_openair == 'T') {
                    // A line is marked export to OA but the corresponding item and/or project is not marked export to OA
                    alert('Line ' + linenum + ' is not marked export to OpenAir but the project and item are marked export to OpenAir. Make sure this is correct.');
                }
            }
    }
    
    return true;
}


function beforeSubmitPOToOpenAir(type){

    // do we have this integration enabled?
    // if not, return true and do not validate any of this
    var po_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_po_integration');
    var vb_integration = nlapiGetContext().getSetting('SCRIPT', 'custscript_oa_vb_oa_po_export');
    var recType = nlapiGetRecordType();
    if ((recType == 'purchaseorder' && po_integration != 'T') || (recType == 'vendorbill' && vb_integration != 'T')) {
        return true;
    }
    
    // if the project field is in the header, make sure this is set
    var job_id = nlapiGetFieldValue('shipto');
    if (job_id != null && job_id.length > 0 && recType == 'purchaseorder') {
        nlapiSetFieldValue('custbody_oa_purchase_project_id', job_id);
    }
    
    var set_export_to_oa = 0;
    var lineItemCount = nlapiGetLineItemCount('item');
    for (var linenum = 1; linenum <= lineItemCount; linenum++) {
        var oa_rate = nlapiGetLineItemValue('item', 'rate', linenum);
        var tax_amt = nlapiGetLineItemValue('item', 'tax1amt', linenum);
        var export_to_oa = nlapiGetLineItemValue('item', 'custcol_oa_export_to_openair', linenum);
        
        if (export_to_oa == 'T') {
            // set the export field at the header if we need to
            if (set_export_to_oa == 0) {
                nlapiSetFieldValue('custbody_oa_export_to_openair', 'T');
                set_export_to_oa = 1;
            }
            
            // set the line-level fields
            nlapiSelectLineItem('item', linenum);
            nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_rate', oa_rate);
            
            if (tax_amt != null) {
                nlapiSetCurrentLineItemValue('item', 'custcol_oa_po_line_tax', tax_amt);
            }
            nlapiCommitLineItem('item');
        }
    }
    
    if (set_export_to_oa == 0) {
        nlapiSetFieldValue('custbody_oa_export_to_openair', 'F');
    }
    
    return true;
}


