/**
 * Copyright (c) 1998-2009 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/** 
 * Adds Bundled Items.
 * 
 * @param (string) stEventType Type of operation submitted 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function afterSubmit_AddBundleItems( stEventType)
{
    nlapiLogExecution(DEBUG,ENTRY_LOG, 'Entered afterSubmit_AddBundleItems Event.');
    nlapiLogExecution(DEBUG,ENTRY_LOG, 'Event Type: ' + stEventType);	
    
    if( stEventType == 'delete')  {
         return false;
    }   
     
    try
    { 
        var recType        = nlapiGetRecordType();
        var recId          = nlapiGetRecordId();
        var recEstimate    = nlapiLoadRecord(recType,recId);
        var itemList       = new Array(); 
        var intCustomerId  = recEstimate.getFieldValue(ENTITY);   
        var stEmpTaxCode   = getCustomerTaxCode(intCustomerId);      
        if (stEventType != CREATE) {
			nlapiLogExecution(DEBUG,EXIT_LOG, 'Type of Operation Unsupported.  afterSubmit_AddBundleItems Successfully.');
            return;
        }              
        
        //Set to always 1 to FIFO
        var COUNTER = 1;
        
    	if( recType == ESTIMATE )  
        {           	
            var intItemLineCount = recEstimate.getLineItemCount(ITEM); 
            // For each line on the sales quote.       	
            for (var i = 1; i <= intItemLineCount; i++) 
			{	        
                //Obtain common variables.
                var	stItemId   	    =	recEstimate.getLineItemValue(ITEM, ITEM,COUNTER);	
                var intRevRec       =   recEstimate.getLineItemValue(ITEM, REVREC, COUNTER)
                var stItemJob       =   recEstimate.getLineItemValue(ITEM, JOB, COUNTER);      
                var isBundledItem   = 	recEstimate.getLineItemValue(ITEM, COLBUNDLEITEM, COUNTER);	
                var flDiscount      =   recEstimate.getLineItemValue(ITEM, COLDISCOUNT, COUNTER);	
                var	intQty   	    =	recEstimate.getLineItemValue(ITEM, QUANTITY,COUNTER);	 
                var stTaxCode       =   recEstimate.getLineItemValue(ITEM, TAXCODE,COUNTER);    
                var stOrigAmt       =   recEstimate.getLineItemValue(ITEM, AMOUNT,COUNTER);  
                var stMemo          =   recEstimate.getLineItemValue(ITEM, MEMO,COUNTER); 
                var sfDiscount      =   recEstimate.getLineItemValue(ITEM, COLSFDISC,COUNTER);     
                var flRate          =   recEstimate.getLineItemValue(ITEM, RATE,COUNTER);           
                // If is bundle item is checked.            
                if( isBundledItem == TRUE ) 
                {    
                    // Search for Bundled Items custom record entries where Parent Item = Parent Item 
                    // in Bundled Item  custom record, returning member item and budnle item price fields.    
                    var searchResults =  getBundledItems( stItemId );                  
                    for (var x = 0; searchResults != null && x < searchResults.length; x++)  
                    {
                        var stMemberItemId    = searchResults[x].getValue('custrecord_member_item');     
    	                var stBundlePrice     = searchResults[x].getValue('custrecord_bundle_item_price');  
                        var bundleItem        = new BundleItem(stItemId,stMemberItemId,stTaxCode,flDiscount,stBundlePrice,intQty,stOrigAmt,isBundledItem,TRUE,stMemo,sfDiscount,stItemJob,intRevRec);  
                        itemList.push(bundleItem);   
                    }    	                    
                } 
                else 
                {
                    var regularItem  = new RegularItem(stItemId,-1,stTaxCode,flDiscount,stBundlePrice,intQty,stOrigAmt,isBundledItem,FALSE,stMemo,sfDiscount,flRate,stItemJob,intRevRec );  
                    itemList.push(regularItem);
                }    
     
                recEstimate.removeLineItem(ITEM,COUNTER);	            
            }	  
            var process = checkBundleItems(itemList);
            if( process == FALSE) 
            {
               	nlapiLogExecution(DEBUG,EXIT_LOG, 'No Bundled items to process. afterSubmit_AddBundleItems Successfully.');
                return;     
            }
            // For each record found by the search.
            for ( var z = 0; itemList != null && z < itemList.length; z++ ) 
            {
                var objItem = itemList[z];
                var lineCounter = z+1;
                if ( typeof objItem == 'object' && getObjectName(objItem) == 'BundleItem') 
                {
                    // 1. Add the member item to list of items to be added to the quote. 
                    recEstimate.setLineItemValue(ITEM, ITEM,     lineCounter, objItem.MemberID);
                    // 2. Set the bundle item custom field  to the original item.
                    recEstimate.setLineItemValue(ITEM, COLORIGITEM, lineCounter, objItem.ParentID);
                    // 3. Set the bundle price custom field to the amount from the original line
                    recEstimate.setLineItemValue(ITEM, COLBUNDLEPRICE,   lineCounter, objItem.amount); 
                    // 4. Set the rate for the member item as ( Bundle Item Price * Discount % from the line ).
                    recEstimate.setLineItemValue(ITEM, RATE,     lineCounter, objItem.rate);  
                    recEstimate.setLineItemValue(ITEM, TAXCODE,  lineCounter, objItem.taxcode);                 
                    recEstimate.setLineItemValue(ITEM, QUANTITY, lineCounter, objItem.qty); 
                    //Set the isBundled Item to False after processing.
                    recEstimate.setLineItemValue(ITEM, COLBUNDLEITEM, lineCounter, FALSE);
                    recEstimate.setLineItemValue(ITEM, COLDISCOUNT, lineCounter, objItem.discount);  
                    recEstimate.setLineItemValue(ITEM, MEMO, lineCounter, objItem.memo);   
                    recEstimate.setLineItemValue(ITEM, COLSFDISC,lineCounter, objItem.sfdiscount);  
                    recEstimate.setLineItemValue(ITEM, JOB,lineCounter, objItem.job);            
                     recEstimate.setLineItemValue(ITEM, REVREC,lineCounter, objItem.revrec);                          
                } 
                else 
                {
                    recEstimate.setLineItemValue(ITEM, ITEM, lineCounter, objItem.ParentID); 
                    recEstimate.setLineItemValue(ITEM, RATE,     lineCounter, objItem.rate);  
                    //recEstimate.setLineItemValue(ITEM, COLBUNDLEPRICE,   lineCounter, objItem.amount);
                    recEstimate.setLineItemValue(ITEM, TAXCODE,  lineCounter, objItem.taxcode);                   
                    recEstimate.setLineItemValue(ITEM, QUANTITY, lineCounter, objItem.qty); 
                    recEstimate.setLineItemValue(ITEM, MEMO, lineCounter, objItem.memo)   
                    recEstimate.setLineItemValue(ITEM, COLSFDISC,lineCounter, objItem.sfdiscount)   
                    recEstimate.setLineItemValue(ITEM, JOB,lineCounter, objItem.job)  
                    recEstimate.setLineItemValue(ITEM, REVREC,lineCounter, objItem.revrec);              
                }
                     
            }           
            nlapiSubmitRecord(recEstimate,true,true);              
		}
	}	 
	catch (error)
    {
        if (error.getDetails != undefined) 
        {
            nlapiLogExecution(ERROR,PROCESS_ERROR,  error.getCode() + ': ' + error.getDetails());
            throw error;
        }
        else 
        {
            nlapiLogExecution(ERROR,UNEXPECTED_ERROR, error.toString()); 
            throw nlapiCreateError('99999', error.toString());
        }
    }   
    nlapiLogExecution(DEBUG,EXIT_LOG, 'Exited afterSubmit_AddBundleItems Successfully.');
}


/** 
 * Checks for bundle items.
 * 
 * @param (Object) arrBundleItems 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function checkBundleItems(arrBundleItems) 
{
    for ( var m = 0; arrBundleItems != null && m < arrBundleItems.length; m++ ) 
    {
        var objBundleItem = arrBundleItems[m];
        if ( typeof objBundleItem == 'object' && getObjectName(objBundleItem) == 'BundleItem') 
        { 
           if( objBundleItem.isbundled == TRUE ) 
           {
               return TRUE;    
           }           
        }
    }   
    return FALSE;              
}

/** 
 * BundleItem object used to hold bundle item data.
 * 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function BundleItem( parentId, memberId,taxcode,discount,price,qty,amount,isBundled,hasMember,stMemo,sfDiscount,stItemJob,intRevRec )
{
    this.ParentID   = parentId;
    this.MemberID   = memberId;
    this.taxcode    = taxcode;
    this.discount   = discount;
    this.price      = price;
    this.qty        = qty;
    this.amount     = amount;
    this.isbundled  = isBundled
    this.hasmember  = hasMember
    this.memo       = stMemo;
    this.sfdiscount = sfDiscount;
    this.job        = stItemJob;
    this.revrec     = intRevRec;
    this.rate       = forceFloatPercent( discount ) * currencyValue( price );
}

/** 
 * RegularItem object used to hold regular item data.
 * 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function RegularItem( parentId, memberId,taxcode,discount,price,qty,amount,isBundled,hasMember,stMemo,sfDiscount,rate,stItemJob,intRevRec )
{
    this.ParentID   = parentId;
    this.MemberID   = memberId;
    this.taxcode    = taxcode;
    this.discount   = discount;
    this.price      = price;
    this.qty        = qty;
    this.amount     = amount;
    this.isbundled  = isBundled
    this.hasmember  = hasMember
    this.memo       = stMemo;
    this.sfdiscount = sfDiscount;
    this.rate       = rate;
    this.revrec     = intRevRec;
    this.job        = stItemJob;
}

/** 
 * Gets bundled items.
 *
 * @param (string) stItemId 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function getBundledItems(stItemId) 
{
    var searchResults;
    var itemFilters = [   
        new nlobjSearchFilter('isinactive', '', 'is', FALSE),
    	new nlobjSearchFilter('custrecord_parent_item', '', 'is', stItemId)	
    ];
    var itemColumns = [
        new nlobjSearchColumn('custrecord_member_item'),
        new nlobjSearchColumn('custrecord_bundle_item_price')
    ]; 	
    return searchResults = nlapiSearchRecord('customrecord_bundled_items', null, itemFilters,itemColumns);   
}
