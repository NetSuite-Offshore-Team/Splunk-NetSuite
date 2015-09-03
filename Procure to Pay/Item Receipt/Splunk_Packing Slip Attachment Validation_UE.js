/**
* This script file is used for validating if any packing slip documents has been attached. 
* @author Dinanath Bablu
* @Release Date 15th June 2014
* @Release Number RLSE0050216
* @Project #PRJ0050215
* @version 1.0
*/

function validateFileOnSave() // Checking for the attachment saved on a record.
{
	var fileId = nlapiGetFieldValue('custbody_spk_attach_file');
	if(!fileId) 
	{
		// Alert a pop up if there is no file attached while saving
		alert('Please attach a receipt confirmation document before saving the Item Receipt.');  
		return false;
	}
    return true;
}

function attachFileOnSubmit(type,form) // Saving the file selected for attaching.
{
	try
	{
		var fileId = nlapiGetFieldValue('custbody_spk_attach_file');
		if(fileId)
		{
			//Attaching the file to the record after saving the record.
			nlapiAttachRecord('file', fileId, nlapiGetRecordType(),nlapiGetRecordId()); 
		}
	} 
	catch (e) 
	{
		nlapiLogExecution('DEBUG', e.name || e.getCode(), e.message || e.getDetails());
	}
}
