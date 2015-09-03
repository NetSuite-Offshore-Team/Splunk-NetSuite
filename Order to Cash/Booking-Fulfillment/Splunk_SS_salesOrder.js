/* When the user is not admin and trying to change the license delivery status from "error" to "completed", user should not 
 *  be able to do that.
 * @author Dinanath Bablu
 * @Release Date 10/11/2013  for defect DFCT0050118
 * @Release Number RLSE0050007
 * @version 2.0. The existing script has been modified and replaced.
 */
/* When the SO is created with Premiumapps/cloud Subscription products,the Delivery Status is set to Pending in After Submit function (afterSubmitSO)
 * @author Abith Nitin
 * @Release Date 12/05/2014  for Enhancement ENHC0051264
 * @Release Number 
 * @version 3.0. The existing script has been modified and replaced.
 */
var adminRoles = ['3']; // Defining admin role
function beforeLoadSO(type, form){ // before load function
    if (type == 'edit' && nlapiGetContext().getExecutionContext() == 'userinterface') {
        var currRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId()); // Loading the current record
        var orderStatus = currRec.getFieldValue('orderstatus');
        if (!findValueInList(adminRoles, nlapiGetContext().getRole())) // Current role of the user is not admin
		{
            if (orderStatus != 'A' && (currRec.getFieldValue('custbody_license_delivery_status') == '1' ||
            currRec.getFieldValue('custbody_license_delivery_status') == '4')) // if Order Status not equal to Pending Approval and License Delivery Status = Pending or Completed
            {
                throw nlapiCreateError('User Defined', 'An Approved Sales Order with a License Delivery Status of either "Pending" or "Complete" cannot be edited', true);
            }
        }
    }
}

function beforeSubmitSO(type, form){  // Before submit function
    nlapiLogExecution('Error', 'Checking-1', 'Before Submit - Type : ' + type);    
    if (type == "approve") // This function will act only after approving the Sales order.
	{
        var currRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());  ; // Loading the current record
        var licenseStatus = currRec.getFieldValue('custbody_license_delivery_status'); // Getting the license delivery status field value
        nlapiLogExecution('Error', 'Checking-1', 'Before Submit - licenseStatus : ' + licenseStatus);
        if (!findValueInList(adminRoles, nlapiGetContext().getRole())) // Current role of the user is not admin
		{
            if (licenseStatus == '2') //License Delivery Status = Error
            {
                throw nlapiCreateError('User Defined', 'Sales Order with a License Delivery Status of "Error" cannot be approved');
            }
        }
    }
}

function afterSubmitSO(type)
{
    nlapiLogExecution('Error', 'Checking-1', 'After Submit - Type : ' + type);
    var currentContext = nlapiGetContext();
    if (type == 'create' || type == 'edit') {
        var currRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
        var orderStatus = currRec.getFieldValue('orderstatus'); // Getting the order status value
        nlapiLogExecution('Error', 'order status', orderStatus);
        var licenseStatus = currRec.getFieldValue('custbody_license_delivery_status'); // getting the license delivery status
        var role = nlapiGetRole(); // Determing the role of the user making the change
        nlapiLogExecution('Error', 'role is', role);
        if (orderStatus == 'A' && licenseStatus != '2') //Pending Approval
        {            
			var premiumApps = 'F';
			var cloudSubscription = 'F';
			var isLicenseItem = 'F';
			var fields = ['custitem_spk_premiumapps', 'custitem_spk_cloudsubscription','custitem_is_license'];//part of version 3.0
            for(var intPos = 1; intPos <= currRec.getLineItemCount('item'); intPos++) {
                var itemId = currRec.getLineItemValue('item', 'item', intPos);
              	var columns = nlapiLookupField('item', itemId, fields);//part of version 3.0
				premiumApps = columns.custitem_spk_premiumapps;//part of version 3.0
				cloudSubscription = columns.custitem_spk_cloudsubscription;//part of version 3.0
				isLicenseItem = columns.custitem_is_license;
                
                if (isLicenseItem == 'T' || premiumApps == 'T' || cloudSubscription == 'T') //part of version 3.0(Included condition for Premium Apps& Cloud Subscription)
				{
                    break;
                }
            }
			// If the item is a "license-term" or premiumApps or cloudSubscription item.
            if (isLicenseItem == 'T' || premiumApps == 'T' || cloudSubscription == 'T' )//part of version 3.0 
			{
                currRec.setFieldValue('custbody_license_delivery_status', '4'); // Delivery Status is set to Pending
			}
            else {
                currRec.setFieldValue('custbody_license_delivery_status', '3'); //Delivery Status is set to Not Applicable
            }
            var retVal = nlapiSubmitRecord(currRec, true);
        }
        
        if (type == 'create') 
		{
            nlapiLogExecution('Error', 'Checking', 'licenseStatus ' + licenseStatus);
            if (licenseStatus == '2') // Order created with License Delivery Status = Error
            {
                var records = new Object();
                records['transaction'] = currRec.getId();                
                var newEmail = nlapiSendEmail(7842, 'itbizapps@splunk.com', 'Error occurred in License Integration', 'Error occurred in License Integration when updating Sales Order : ' + currRec.getFieldValue('tranid'), null, null, records, null);
            }
        }
        else if (type == 'edit') {
			var oldRec = nlapiGetOldRecord(); // Getting the old entry of the record
			var oldLicenseStatus = oldRec.getFieldValue('custbody_license_delivery_status');   //   getting the old license delivery status          
			nlapiLogExecution('Error', 'Checking', 'oldLicenseStatus ' + oldLicenseStatus);
			nlapiLogExecution('Error', 'Checking', 'licenseStatus ' + licenseStatus);
			
			if (licenseStatus != oldLicenseStatus && licenseStatus == '2') // Status changed to Error
			{
				var records = new Object();
				records['transaction'] = currRec.getId();     
			   // Sending the mail               
				var newEmail = nlapiSendEmail(7842, 'itbizapps@splunk.com', 'Error occurred in License Integration', 'Error occurred in License Integration when updating Sales Order : ' + currRec.getFieldValue('tranid'), null, null, records, null);
				nlapiLogExecution('DEBUG', 'IN', newEmail);
			}
			// Checking if the user is not admin and trying to change the license delivery status from "error" to "completed". The user should not be able to change
			else if (nlapiGetRole() != '3' && oldLicenseStatus == '2' && licenseStatus == '1') 
			{
				currRec.setFieldValue('custbody_license_delivery_status','2');
				nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(),'custbody_license_delivery_status','2');
				throw nlapiCreateError('User Defined', 'You cannot update the License Delivery Status from Error to Completed. Please contact your Administrator.');              
			}
		}
    }
}


function findValueInList(inputList, val)
{
    for (var intPos = 0; inputList != null && intPos < inputList.length; intPos++)  
	{
        if (inputList[intPos] == val) 
		{
            return true;
        }
    }
    return false;
}
