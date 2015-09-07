/*
* This script file is used to create/update Product Sync in Cloudhub
* @ AUTHOR : Vaibhav
* @Release Date: 28th Feb 2015
* @Release Number RLSE0050312
* @Project Name: Hangman
* @Project Number PRJ0050865
* @version 1.0
*/
/*
* To fix the try/catch exception handling in the script for setting Cloudhub Errors on Submit Field for respective Record Type and record ID 
* @ AUTHOR : Unitha
* @Release Date: 13th Mar 2015
* @Release Number RLSE0050322
* @Project Number DFCT0050552
* @version 1.1
*/
/*
* Script changes to sync Commodity Tax Code of NS Item record to SFDC Product Commodity Code
* @ AUTHOR : Vaibhav
* @Release Date: 18th July 2015
* @Release Number :RLSE0050406
* @Project Number ENHC0051867
* @version 1.2
*/
function itemsync(type){
                try {
                var rectype = nlapiGetRecordType();
                var recid = nlapiGetRecordId();
                                              
                if ((type == 'create') || (type == 'edit'))
                {                              
               /*----START------------Creating JSON Object to be sent to Cloudhub------------START-----*/
                var string1 = '{';
				var header = new Array();
				header['Accept'] = 'application/json';
				header['Content-Type'] = 'application/json';               

                var r = nlapiLoadRecord(rectype,nlapiGetRecordId());
                                
                var netSuiteinternalId = r.getFieldValue('id');
                                                
               /*----Start-------------------Clearing the sync Error fields-----------------Start------*/   
                          
                                                                if(r.getFieldValue('custitem_spk_item_cloudhuberror') == 'T')
                {
                var field = new Array();
                var value = new Array();
                field[0] = 'custitem_spk_item_cloudhuberror';
                field[1] = 'custitem_spk_item_cloudhuberrortxt';
                value[0] = 'F';
                value[1] = '';
                nlapiSubmitField(rectype,netSuiteinternalId,field,value);
                }
                /*----End-------------------Clearing the sync Error fields-----------------End------*/
                                                                                                
            var avaTaxCode = r.getFieldValue('custitem_ava_taxcode');
            if ((avaTaxCode == null) || (avaTaxCode == '')) { 
                avaTaxCode = '""'; 
            } 
            else {
                avaTaxCode = '"' + avaTaxCode + '"';
            }
            string1 = string1 + '"avaTaxCode" : ' + avaTaxCode;
            

            var cloudSubscription = r.getFieldValue('custitem_spk_cloudsubscription');
            if (cloudSubscription == 'T')
            {
            cloudSubscription = true;
            }
            else{
            cloudSubscription = false;
            }
            string1 = string1 + ',"cloudSubscription" : ' + cloudSubscription;
            
            /*----Start---*/
            var test = 123;
            /*---End---*/
            
            var xyz = 123;
             
    
            
            var isLicense = r.getFieldValue('custitem_is_license');
            if (isLicense == 'T')
            {
             isLicense = true;
            }
            else{
             isLicense = false;
            }                                                
            string1 = string1 + ',"isLicense" : ' +isLicense;
            
                                             
            var itemCategory = r.getFieldText('custitem_item_category'); 
            if ((itemCategory == null) || (itemCategory == '')) { 
                itemCategory = '""';
            }
            else{
            itemCategory = '"' +itemCategory+ '"';
                                                }
            string1 = string1 + ',"itemCategory" : ' + itemCategory;
            
                                                
            var isActive = r.getFieldValue('isinactive'); 
            if (isActive == 'T')
            {
            isActive = false;
            }
            else{
            isActive = true;
            }
            string1 = string1 + ',"isActive" : ' + isActive;
            
              
            var productFamily = r.getFieldText('custitem_spk_sfdc_product_family'); 
            if ((productFamily == null) || (productFamily == '')) { 
                productFamily = '""';
            } 
			else{
			productFamily = '"'+productFamily+'"';
			}
            string1 = string1 + ',"productFamily" : ' + productFamily;
            
			/* ENHC0051867 for 7/18 release  to update Commodity Tax Code*/
			var taxCommodityCode = r.getFieldValue('custitem_spk_commoditytaxcode'); 
            if ((taxCommodityCode == null) || (taxCommodityCode == '')) { 
                taxCommodityCode = '""';
            } 
			else{
			taxCommodityCode = '"'+taxCommodityCode+'"';
			}
            string1 = string1 + ',"taxCommodityCode" : ' + taxCommodityCode;
			/* ENHC0051867 for 7/18 release */
                                                  
            var maintenanceSupport = r.getFieldValue('custitem_celigo_m_s_percent'); 
            if ((maintenanceSupport == null) || (maintenanceSupport == '')) { 
                maintenanceSupport = '""';
            } 
                                                else{
                                                maintenanceSupport = '"'+maintenanceSupport+'"';
                                                }
            string1 = string1 + ',"maintenanceSupportC" : ' + maintenanceSupport;
            
                                                var maintenanceSupportR = r.getFieldValue('custitem_m_s_percentage'); 
            if ((maintenanceSupportR == null) || (maintenanceSupportR == '')) { 
                maintenanceSupportR = '""';
            } 
                                                else{
                                                maintenanceSupportR = '"'+maintenanceSupportR+'"';
                                                }
            string1 = string1 + ',"maintenanceSupportR" : ' + maintenanceSupportR;
            
            if(rectype == 'kititem')
				{
				var productName = r.getFieldValue('description');
			}
			else{	
                var productName = r.getFieldValue('salesdescription'); 
			}
            if ((productName == null) || (productName == '')) { 
                productName = '""';
            } 
                                                else{
                                                productName = '"'+productName+'"';
                                                }
            string1 = string1 + ',"productName" : ' + productName;
            
                                                
            var optOutMSR = r.getFieldValue('custitem_opt_out_ms'); 
            if (optOutMSR == 'T')
            {
            optOutMSR = true;
            }
            else{
            optOutMSR = false;
            }
            string1 = string1 + ',"optOutMSR" : ' + optOutMSR;
            
                                                
            var premiumApps = r.getFieldValue('custitem_spk_premiumapps'); 
            if (premiumApps == 'T')
            {
            premiumApps = true;
            }
            else{
            premiumApps = false;
            }
            string1 = string1 + ',"premiumApps" : ' + premiumApps;
            
                                                
                                                var productCode = r.getFieldValue('itemid'); 
            if ((productCode == null) || (productCode == '')) { 
                productCode = '""';
            } 
                                                else{
                                                productCode = '"'+productCode+'"';
                                                }
            string1 = string1 + ',"productCode" : ' + productCode;
            
                                                                                    
            var sizeGB = r.getFieldValue('custitem_size'); 
            if ((sizeGB == null) || (sizeGB == '')) { 
                sizeGB = '""';
            } 
                                                else{
                                                sizeGB = '"'+sizeGB+'"'
                                                }
            string1 = string1 + ',"sizeGB" : ' + sizeGB;
            
                                                
                                                var licenseTermDays = r.getFieldValue('custitem_term_days'); 
            if ((licenseTermDays == null) || (licenseTermDays == '')) { 
                licenseTermDays = '""';
            } 
                                                else{
                                                licenseTermDays = '"'+licenseTermDays+'"'
                                                }
            string1 = string1 + ',"licenseTermDays" : ' + licenseTermDays;
            
                                                                                             
            if ((netSuiteinternalId == null) || (netSuiteinternalId == '')) {
                netSuiteId = '""';
            } 
            else { 
                netSuiteId = '"' + netSuiteinternalId + '"';               
            }
            string1 = string1 + ',"netsuiteId" : ' + netSuiteId;
            
                                                
                                                string1 = string1 + ',"priceBookEntries": [';
                                                var count = r.getLineItemCount('price1');
            for(var i=1;i<count+1;i++)
            {
                var priceBookName = r.getLineItemValue('price1','pricelevelname',i);
                var listPrice = r.getLineItemMatrixValue('price1','price',i,1);
                string1 = string1 + '{';
                                                                
                                                                if ((priceBookName == null) || (priceBookName == '')) {
                priceBookName = '""';
                                                                } 
                                                                else { 
                priceBookName = '"' + priceBookName + '"';               
                                                                }
                                                                string1 = string1 + '"priceBookName" : ' + priceBookName;
                                                                
                                                
                                                                if ((listPrice == null) || (listPrice == '')) {
                listPrice = '"0.00"';
                                                                } 
                                                                else { 
                listPrice = '"' + listPrice + '"';               
                                                                }
                                                                string1 = string1 + ',"listPrice" : ' + listPrice;
                                                                
                                                                if (i < count){
                                                    string1 = string1 + '},';
                                                                }
                                                                if (i == (count)){
                                                    string1 = string1 + '}';
                                                                }
                                                }
                                   
                                                string1 = string1 + ']' + '}';
                                                nlapiLogExecution('DEBUG','JSON Object',string1);
                                   
/*----END------------Creating JSON Object to be sent to Cloudhub------------END-----*/
                                              
            //Getting Cloudhub URL from script parameter to which JSON object to be posted
            var url = nlapiGetContext().getSetting('SCRIPT','custscript_spk_item_cloudhub_sync');
            //Getting Authorization header from script parameter which is used when requesting URL for Authentication
            var authorizationHeader = 'Basic ' + nlapiEncrypt(nlapiGetContext().getSetting('SCRIPT', 'custscript_spk_ch_auth_test'),'base64');
            
            var header = new Array();
            header['Authorization'] = authorizationHeader; 
            header['Accept'] = 'application/json';
            header['Content-Type'] = 'application/json'; 
            var y = nlapiRequestURL(url,string1,header,'PUT'); //Posting JSON data to the Cloudhub URL
            nlapiLogExecution('DEBUG', 'URL Details', y.getBody() +'::::'+ y.getCode()); 
            
 
            /*------Start-----Checking if the request is processed successfully----------Start-------*/
                                                
            if(parseInt(y.getCode()) == 200)
                {
                                                    //Capturing SFDC object id for the record created successfully in NetSuite custom field
                nlapiSubmitField(rectype,nlapiGetRecordId(),'custitem_spk_object_id',y.getBody().toString().split('"objectId":"')[1].split('","')[0]);
                }
                                                                                                                
            /*------END-----Checking if the request is processed successfully----------END-------*/
                                                
            /*------Start-------------If the sent request failed---------------------Start-------*/                                                                                      
                                                                                                                                  
            if(parseInt(y.getCode())!= 200)//If the creation/update is not successful then populate error in custom fields in NetSuite.
                {
                var fields = new Array();
                var values = new Array();
                fields[0] = 'custitem_spk_item_cloudhuberror';
                fields[1] = 'custitem_spk_item_cloudhuberrortxt';
                values[0] = 'T';
                values[1] = y.getBody().toString();
                                                                
                nlapiSubmitField(rectype,netSuiteinternalId,fields,values);       //Capturing error message in a custom field
                }  

            /*------End-------------If the sent request failed---------------------End-------*/                           
                               
                                                               
            }
    }
	catch(e)
	{
		if (e instanceof nlobjError)
		{
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());
			var fields = new Array();
			var values = new Array();
			fields[0] = 'custitem_spk_item_cloudhuberror';
			fields[1] = 'custitem_spk_item_cloudhuberrortxt';
			values[0] = 'T';
			values[1] = e.getCode() + '\n' + e.getDetails(); 
			//DFCT0050552: To fix the try/catch exception handling for nlapiGetRecordType(),nlapiGetRecordId()
			nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);
																		
		}              
		else
		{   
			nlapiLogExecution( 'ERROR', 'unexpected error', e.toString());
			var fields = new Array();
			var values = new Array();
			fields[0] = 'custitem_spk_item_cloudhuberror';
			fields[1] = 'custitem_spk_item_cloudhuberrortxt';
			values[0] = 'T';
			values[1] = e.toString();   
			//DFCT0050552: To fix the try/catch exception handling for nlapiGetRecordType(),nlapiGetRecordId()			
			nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),fields,values);                                         
		}  
	}
}
