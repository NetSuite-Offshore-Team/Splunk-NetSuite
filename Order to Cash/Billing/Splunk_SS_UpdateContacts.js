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
{
   var logger = new Logger(true);
   logger.enableDebug(); //comment this line to disable debug
}
/** 
 * Computes the no. of contacts field on the customer record.
 * 
 * @param (string) stEventType Type of operation submitted 
 * @author Roberto R. Palacios
 * @version 1.0
 */
function afterSubmit_UpdateContacts(stEventType) 
{
    var MSG_TITLE = 'Before Submit Update Contact #';
    logger.debug(MSG_TITLE, '=====Start afterSubmit_UpdateContacts=====');     
    logger.debug(MSG_TITLE, 'Event Type: ' + stEventType);
    
    if ( stEventType != 'create')  
    {
       logger.debug(MSG_TITLE, 'Script Exiting... Event is unsupported.');
       logger.debug(MSG_TITLE, '=====End afterSubmit_UpdateContacts=====');     
       return true;
    }
   
    var recType  = nlapiGetRecordType();
    var recId    = nlapiGetRecordId();
    var recSO    = nlapiLoadRecord(recType,recId);
    var stCustomerId = recSO.getFieldValue('entity');
    var intLineItemCount = recSO.getLineItemCount('item');
    var intContactsSum = 0;

    for( var i = 1; i <= intLineItemCount; i++) {
        var noPerLine = recSO.getLineItemValue('item', 'custcolsup_contacts_order', i);    
        if( isValueEmpty(noPerLine) ) 
        {
            noPerLine = 0;
        }
        intContactsSum += parseInt(noPerLine);   
        logger.debug(MSG_TITLE, 'Contacts Per Line: ' + intContactsSum);     
        logger.debug(MSG_TITLE, 'Sum: ' + intContactsSum);     
    }
    
    var intCustomerContactsCount = nlapiLookupField('customer', stCustomerId, 'custentitysup_contacts');
    //I experienced a problem here where the value was appended. A good practise if you are sure
    // it is an integer value is to use parseInt   
    if( isValueEmpty(intCustomerContactsCount) ) 
    {
        intCustomerContactsCount = 0;
    }
    
    var intTotal = parseInt(intCustomerContactsCount) + intContactsSum;
    nlapiSubmitField('customer', stCustomerId, 'custentitysup_contacts' , intTotal );
    
    logger.debug(MSG_TITLE, 'New Total: ' + intTotal);     
    logger.debug(MSG_TITLE, '=====End afterSubmit_UpdateContacts=====');     
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