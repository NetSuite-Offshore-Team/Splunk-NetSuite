/**
 * Copyright (c) 1998-2008 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */
/*
* This script has been modified to update start and end dates only if Order Type is not 'Web Sales'.
* Added lines 55, 56, 57, and 66. It contains an if loop and updates the start and end dates only if the Order Type is not Web Sales.
* @ AUTHOR : Abhilash
* @Release Date 22nd Nov 2014
* @Project Number PRJ0050845
*/

/*
* On record Sales order create, set Order Type "Renewal-Manual", if Order type is "Renewal", as part of CPQ-346 JIRA request
* @ AUTHOR : Rahul
* @Release Date 28th Feb 2015
* @Release Number RLSE0050312
* @Project Number PRJ0010731 
* @version 2.0
 */
/*
* Include Web Sales in Opportunity Type List and use it instead of Web Sales Values in Order Type to convert E-Commerce SOs To Cash Sales.
* @ AUTHOR : Rahul
* @Release Date 21st May 2015 
* @Release Number RLSE0050339
* @Project Number ENHC0051769 
* @version 3.0
 */
{
   var logger = new Logger(true);
   logger.enableDebug(); //comment this line to disable debug
   
   var INVALID_ORDER_TYPES = new Array();
   INVALID_ORDER_TYPES[0] = 'Renewal - Manual';
   INVALID_ORDER_TYPES[1] = 'Renewal';
   
}
/** 
 * Computes Dates
 * 
 * @param (string) stEventType Type of operation submitted 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function beforeSubmit_UpdateDates(stEventType) 
{
    var recSO = nlapiGetNewRecord();
    var stOrderType = recSO.getFieldText('custbody_order_type');
    var MSG_TITLE = 'Before Submit Update Dates';
    logger.debug(MSG_TITLE, '=====Start beforeSubmit_UpdateDates=====');     
    logger.debug(MSG_TITLE, 'Event Type: ' + stEventType);
    
    if ( stEventType != 'create') 
    {
        logger.debug(MSG_TITLE, 'Script Exit. Event is unsupported.');
        return true;
    }
	//Modified for CPQ-346, if SO OrderType is 'Renewal' then set  OrderType to Renewal - Manual(6 internal ID): Begin
    if(stOrderType == 'Renewal') {
		 recSO.setFieldValue('custbody_order_type', 6); //set 6:Renewal - Manual
	}
	//End
	
    if( isRecordType(stOrderType,INVALID_ORDER_TYPES)) {
        logger.debug(MSG_TITLE, 'Script Exit. Order type is not Renewal');
        logger.debug(MSG_TITLE, '=====End beforeSubmit_UpdateDates=====');     
        return true;     
    } else {
	
		 var opportunityType = nlapiGetFieldValue('custbody_opportunity_type'); 	
		 var ordertype = nlapiGetFieldText('custbody_order_type');//Fetching the Order type. Part of Project PRJ0050845.
		 if((ordertype=='')||(ordertype==null)||(ordertype.search('Web Sales')==-1)||(opportunityType=='')||(opportunityType==null)||(opportunityType!=18))//Verifying that Order type is not 'Web Sales'. Part of Project PRJ0050845.
		 //Verifying if the Opportunity type is not 'Web Sales'-ENHC0051769.
		 {
		  // 1. Sets the Start Date
		 // Start: If condition added as part of SFDC sync issue of overriden start and end dates
         setStartDate(recSO);
         
		
		 // 2. Sets the End Date    
         computeEndDate(recSO);
		 
		 }
		  // End: If condition added as part of SFDC sync issue of overriden start and end dates
         // 3. Sets the Rev Rec Start and End Dates    
         setRevRecStartDate(recSO);
    }
    logger.debug(MSG_TITLE, '=====End beforeSubmit_UpdateDates=====');     
}

/** 
 * Sets the Start Date
 * 
 * @param (Object) Sales Order object 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function setStartDate(recSO)
{
    var MSG_TITLE = 'Default Start Dates';   
    logger.debug(MSG_TITLE, '=====Start=====');
    var stTranDate = recSO.getFieldValue('trandate');
    
    if (isValueEmpty(stTranDate))
    {
        stTranDate = nlapiDateToString(new Date());
        recSO.setFieldValue('startdate', stTranDate);
    }
    
    var dtStartDate = nlapiStringToDate(stTranDate);
    logger.debug(MSG_TITLE, 'Start Date =' + dtStartDate);
    
    recSO.setFieldValue('startdate', nlapiDateToString(dtStartDate));
    logger.debug(MSG_TITLE, '======End======');  
}

/** 
 * Computes the End Date
 * 
 * @param (Object) Sales Order object 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function computeEndDate(recSO)
{
    var MSG_TITLE = 'Compute End Dates';
    logger.debug(MSG_TITLE, '=====Start=====');     
    
    /* Update End Date if Term in Months or Start Date changed */
    var iTerm = recSO.getFieldValue('custbody_tran_term_in_months'); 
    
    logger.debug(MSG_TITLE, 'Term:' + iTerm);
    
    if (isValueEmpty(iTerm)) 
    {
        iTerm = 12;
    }
    
    iTerm = parseInt(iTerm);
    
    var stStartDate = nlapiGetFieldValue('trandate');
    var stEndDate   = nlapiDateToString(nlapiAddDays(nlapiAddMonths(nlapiStringToDate(stStartDate), iTerm), -1));
    
    logger.debug(MSG_TITLE, 'Start Date:' + stStartDate);    
    recSO.setFieldValue('enddate', stEndDate);
    logger.debug(MSG_TITLE, 'End Date:' + nlapiDateToString(nlapiAddMonths(nlapiStringToDate(stStartDate), iTerm)));
    
    logger.debug(MSG_TITLE, '======End======');
}

/** 
 * Sets the Rev-Rec Start Date and Rev-Rec End Date of Line Items.
 * 
 * @param (Object) Sales Order object 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function setRevRecStartDate(recSO)
{ 
    //Item categories.
    // 2 = License Term, 3 = Maintenance - New, 4 =Maintenance Renewal
    var ARRITEMCATS = ['2','3', '4'];
    var MSG_TITLE = 'Set Revenue Rec Dates';
    logger.debug(MSG_TITLE, '=====Start=====');     
    
    var stStartDate     = recSO.getFieldValue('startdate');
    var stEndDate       = recSO.getFieldValue('enddate');
    var iTermInMonths   = recSO.getFieldValue('custbody_tran_term_in_months');
    
    logger.debug(MSG_TITLE, 'Start Date =' + stStartDate);
    logger.debug(MSG_TITLE, 'Term in Months =' + iTermInMonths);
    
    if (isValueEmpty(stStartDate)) { 
        stStartDate = nlapiDateToString(new Date());
    }
    
    if (isValueEmpty(iTermInMonths)) {
        iTermInMonths = 12;
    }
    
    var intItemLineCount = recSO.getLineItemCount('item');		
    for (var i = 1; i <= intItemLineCount; i++) 
    {
        var stOldTermInMonths    = recSO.getLineItemValue('item', 'revrecterminmonths',i);
        var stOldRevRecStartDate = recSO.getLineItemValue('item', 'revrecstartdate',i);
        var stOldRevRecEndDate   = recSO.getLineItemValue('item', 'revrecenddate',i);     
        
        var stItemCat = recSO.getLineItemValue('item', 'custcol_item_category',i);  
        
        if( !(isRecordType(stItemCat,ARRITEMCATS )) )
        {
            continue;
        }   
           
        if (isValueEmpty(stOldRevRecStartDate)) {
            logger.debug(MSG_TITLE, 'Setting Rev Rec Start Date');       
            recSO.setLineItemValue('item', 'revrecterminmonths', i,'');
            recSO.setLineItemValue('item', 'revrecenddate', i,'');
            recSO.setLineItemValue('item', 'revrecstartdate',i, '');
            recSO.setLineItemValue('item', 'revrecstartdate', i, stStartDate);
        } else {
            recSO.setLineItemValue('item', 'revrecstartdate', i, stStartDate);
            recSO.setLineItemValue('item', 'revrecenddate', i, stEndDate);
        }
        
        if (isValueEmpty(stOldTermInMonths)) {
            logger.debug(MSG_TITLE, 'Setting Rev Rec Term In Months');
            recSO.setLineItemValue('item', 'revrecterminmonths',i, iTermInMonths);
        } else {
            recSO.setLineItemValue('item', 'revrecterminmonths',i, stOldTermInMonths);
        }
        
        
    }     
    logger.debug(MSG_TITLE, '======End======');
    return true;
}

/** 
 * Check if value is not empty
 * 
 * @param (string) value
 * @author Roberto R. Palacios
 * @version 1.0
 */
function isValueEmpty(stValue)
{
    if ( stValue != null && stValue != undefined && stValue != '')
    {
        return false;
    }
    return true;
}