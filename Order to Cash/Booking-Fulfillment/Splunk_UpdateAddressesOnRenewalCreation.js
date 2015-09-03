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
 
/** 
 * The purpose of this script is to copy the Ship and Bill Adrress from Original SO to the Renewal SO
 *
 * @param (string) <varname> <desc>
 * @return <desc>
 * @type int
 * @author Ruel Dizon
 * @version 1.0
 */
function afterSubmit_updateAddressesOnRenewal(stType) 
{
    var logger = new Logger(false);
    var MSG_TITLE = 'afterSubmit_updateAddressesOnRenewal';
    logger.enableDebug(); //comment this line to disable debug

    logger.debug(MSG_TITLE, '======Start======');

    logger.debug(MSG_TITLE, 'stType: '+stType);
    if (stType != 'create') 
    {
        logger.debug(MSG_TITLE, 'Script Exit');
        return true;
    }

    var stTranId = nlapiGetRecordId();
    logger.debug(MSG_TITLE, 'stTranId: '+stTranId);
    var stTranType = nlapiGetRecordType();
    logger.debug(MSG_TITLE, 'stTranType: '+stTranType);

    var recTran = nlapiLoadRecord(stTranType,stTranId);

    logger.debug(MSG_TITLE, '(Current) recTran.shipaddress: '+recTran.getFieldValue('shipaddress'));            
    logger.debug(MSG_TITLE, '(Current) recTran.billaddress: '+recTran.getFieldValue('billaddress')); 
    
    var itemCount = recTran.getLineItemCount('item');
    logger.debug(MSG_TITLE, 'itemCount: '+itemCount);

    var stOrigSOId = '';

    for (var i=1; i<=itemCount; i++) 
    {
        var stItemInstallBaseId = recTran.getLineItemValue('item','custcol_created_from_installbase',i);

        if (stItemInstallBaseId) 
        {
            stOrigSOId = nlapiLookupField('customrecord_install_base',stItemInstallBaseId,'custrecord_original_transaction');
            logger.debug(MSG_TITLE, '('+i+') stOrigSOId: '+stOrigSOId);
            break;
        }
    }

    if (stOrigSOId) 
    {
        var arAddresses = nlapiLookupField('salesorder',stOrigSOId,['shipaddress','billaddress','salesrep']);

        if (arAddresses) 
        {
            logger.debug(MSG_TITLE, 'arAddresses.shipaddress: '+arAddresses.shipaddress);            
            logger.debug(MSG_TITLE, 'arAddresses.billaddress: '+arAddresses.billaddress); 
            logger.debug(MSG_TITLE, 'arAddresses.salesrep: '+arAddresses.salesrep); 
            
            recTran.setFieldValue('billaddress',arAddresses.billaddress);
            recTran.setFieldValue('shipaddress',arAddresses.shipaddress);
            recTran.setFieldValue('salesrep',arAddresses.salesrep);

            var stUpdatedTranId = nlapiSubmitRecord(recTran);
            logger.debug(MSG_TITLE, '(Updated) stUpdatedTranId: '+stUpdatedTranId); 
        }
    }

    logger.debug(MSG_TITLE, '=======End=======');
}