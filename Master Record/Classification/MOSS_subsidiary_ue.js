/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!VAT) { var VAT = {}; }
VAT.MOSS = VAT.MOSS || {};

VAT.MOSS.afterSubmitSubsidiary = function afterSubmitSubsidiary(type) {
    if (type == 'edit') {
        var newRecord = nlapiGetNewRecord();
        var oldRecord = nlapiGetOldRecord();
        
        if (newRecord.getFieldValue('mossapplies') == 'T' &&
            newRecord.getFieldValue('mossnexus') &&
            newRecord.getFieldValue('mossnexus') != oldRecord.getFieldValue('mossnexus')) {
            var nexus = new VAT.DAO.NexusDAO().getById(newRecord.getFieldValue('mossnexus'));
            
            var scheduler = new VAT.MOSS.Scheduler();
            var queue = new VAT.DAO.MossProvisioningStatusDAO();
            var queueManager = new VAT.TaxRecord.QueueManager(scheduler, queue);
            
            var provisioningStatusManager = new VAT.MOSS.ProvisioningStatusManager(queueManager);
            provisioningStatusManager.provision(nexus);
        }
    }
}
