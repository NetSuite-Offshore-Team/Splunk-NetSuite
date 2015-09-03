/* The script works on Invoice record type. It aims for checking the invoices of the same sales order and pick invoice amounts from each 
invoices(if more than 1 exists), adds it to give the total invoice amount and then compare with the Sales amount. If the invoice Amount is LESS than Sales Amount, the Partially Billed checkbox gets checked on the invoices as well as Sales Order. And if the invoice Amount is greater than or equal to Sales Amount, the Partially Billed checkbox gets unchecked on the Sales Order. */
  
/*
 function Billstatuschecking(type) // beforesubmit function
 {
 
     if (type == 'create') // The script runs when the invoice is created
     {
         // Taking the sales order Id from the createdfrom field and loading the Sales order record.
         var id = nlapiGetFieldValue('createdfrom');
         
         nlapiLogExecution('DEBUG', 'id is', id);
         if (id != '' && id != null) {
             var SOrecord = nlapiLoadRecord('salesorder', id);
             
             // Getting the total Sales Amount from the Sales Order     
             var SOvalue = SOrecord.getFieldValue('total');
             nlapiLogExecution('DEBUG', 'SO total is', SOvalue);
             
             var totalinvoiceamount = 0;
             var invoiceamount = 0;
             
             // Creating dynamic saved search for finding the invoices of the same Sales Order
             var col = new Array();
             var filter = new Array();
             filter[0] = new nlobjSearchFilter('createdfrom', null, 'is', id);
             filter[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
             var records = nlapiSearchRecord('invoice', null, filter, col);
             
             if (records == null || records == '') {
                 var invoicevalue = parseFloat(nlapiGetFieldValue('total'));
                 nlapiLogExecution('DEBUG', 'invoice total is', invoicevalue);
                 
                 
                 // Calculating the Total Invoice Amount value  
                 totalinvoiceamount = totalinvoiceamount + invoicevalue;
                 nlapiLogExecution('DEBUG', 'total inv amnt is', totalinvoiceamount);
                 
             }
             if (records != null) {
                 var currentinvoiceval = parseFloat(nlapiGetFieldValue('total'));
                 nlapiLogExecution('DEBUG', 'currentinv amnt is', currentinvoiceval);
                 for (var i = 0; i < records.length; i++) {
                     nlapiLogExecution('DEBUG', 'create record position', 'create 1st loop');
                     
                     // Loading the invoices one by one and getting the Invoice Amount
                     var invoicerecord = nlapiLoadRecord('invoice', records[i].getId());
                     var invoicevalue = parseFloat(invoicerecord.getFieldValue('total'));
                     nlapiLogExecution('DEBUG', 'invoice total is', invoicevalue);
                     
                     
                     // Calculating the Total Invoice Amount value  
                     invoiceamount = invoiceamount + invoicevalue;
                     nlapiLogExecution('DEBUG', 'inv amnt is', invoiceamount);
                     
                 }
                 totalinvoiceamount = totalinvoiceamount + invoiceamount + currentinvoiceval;
             }
             
             // Comparing the Invoice Amount and Sales Amount and setting the Partially Billed check box true or false depending on the condition.
             
             if (parseFloat(totalinvoiceamount) < parseFloat(SOvalue)) {
                 SOrecord.setFieldValue('custbody_partiallybilled', 'T');
                 nlapiSetFieldValue('custbody_partiallybilled', 'T');
                 var id = nlapiSubmitRecord(SOrecord, true);
             }
             else {
                 nlapiLogExecution('DEBUG', 'position ', 'create reachd here');
                 
                 SOrecord.setFieldValue('custbody_partiallybilled', 'F');
                 //	nlapiSetFieldValue('custbody_partiallybilled', 'F');
                 var id = nlapiSubmitRecord(SOrecord, true);
             }
             
         }
     }
 }
*/ 

function Billstatusonviewedit(type) // aftersubmit function
 {
 
     if (type == 'view' || type == 'edit' || type == 'create') 
	 {
         nlapiLogExecution('DEBUG', ' I am in', 'edit');
                  var id = nlapiGetFieldValue('createdfrom');
         nlapiLogExecution('DEBUG', 'id is', id);
         if (id != '' && id != null) 
		 {
          var invid = nlapiGetRecordId();
         var invrec = nlapiLoadRecord('invoice', invid);
         
  	 var SOrecord = nlapiLoadRecord('salesorder', id);
             
             // Getting the total Sales Amount from the Sales Order     
             var SOvalue = SOrecord.getFieldValue('total');
             nlapiLogExecution('DEBUG', 'SO edit total is', SOvalue);
             
             var totalinvoiceamount = 0;
             var onetimeinvoiceamnt = 0;
             
             
             // Creating dynamic saved search for finding the invoices of the same Sales Order
             var col = new Array();
             var filter = new Array();
             filter[0] = new nlobjSearchFilter('createdfrom', null, 'is', id);
             filter[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
             var records = nlapiSearchRecord('invoice', null, filter, col);
             
             if (records != null) {
                 for (var i = 0; i < records.length; i++) {
                     nlapiLogExecution('DEBUG', 'code is here', 'edit 1st loop');

                     // Loading the invoices one by one and getting the Invoice Amount
                     if (records[i].getId() == invid) {
                         var invtotal = parseFloat(invrec.getFieldValue('total'));
                         nlapiLogExecution('DEBUG', 'onetime invoice is ', invtotal);
                         
                         
                         totalinvoiceamount = totalinvoiceamount + invtotal;
                         nlapiLogExecution('DEBUG', 'onetimetotalinvoiceamnt  is ', totalinvoiceamount);
                         
                         onetimeinvoiceamnt = onetimeinvoiceamnt + invtotal;
                         nlapiLogExecution('DEBUG', 'onetimeinvoiceamnt  is ', onetimeinvoiceamnt);
                         
                         
                     }
                     else {
                         var invoicerecord = nlapiLoadRecord('invoice', records[i].getId());
                         var invoicevalue = parseFloat(invoicerecord.getFieldValue('total'));
                         nlapiLogExecution('DEBUG', 'invoice edit total is', invoicevalue);
                         
                         
                         // Calculating the Total Invoice Amount value  
                         totalinvoiceamount = totalinvoiceamount + invoicevalue;
                         nlapiLogExecution('DEBUG', 'total inv amnt is', totalinvoiceamount);
                     }
                 }
             }
             
             // Comparing the Invoice Amount and Sales Amount and setting the Partially Billed check box true or false depending on the condition.
             
             if (parseFloat(onetimeinvoiceamnt) >= parseFloat(SOvalue)) {
                 SOrecord.setFieldValue('custbody_partiallybilled', 'F');
                 nlapiLogExecution('DEBUG', 'IN', 'HERE');
                 invrec.setFieldValue('custbody_partiallybilled', 'F');
                nlapiSubmitField('invoice',invid,'custbody_partiallybilled', 'F');

                }
             
             else 
                 if ((parseFloat(onetimeinvoiceamnt) < parseFloat(SOvalue)) && (parseFloat(totalinvoiceamount) > parseFloat(SOvalue))) {
                     SOrecord.setFieldValue('custbody_partiallybilled', 'F');
                     invrec.setFieldValue('custbody_partiallybilled', 'T');
                     nlapiSubmitField('invoice',invid,'custbody_partiallybilled', 'T');

                     nlapiLogExecution('DEBUG', 'IN', 'T');
                //     var id = nlapiSubmitRecord(SOrecord, true);
                 }
                 
                 
                 
                 else {
                     if (parseFloat(totalinvoiceamount) < parseFloat(SOvalue)) {
                         nlapiLogExecution('DEBUG', 'current pos', 'edit 2nd loop');
                         SOrecord.setFieldValue('custbody_partiallybilled', 'T');
                         invrec.setFieldValue('custbody_partiallybilled', 'T');
                         nlapiSubmitField('invoice',invid,'custbody_partiallybilled', 'T');

                      //   var id = nlapiSubmitRecord(SOrecord, true);
                     }
                     else {
                         nlapiLogExecution('DEBUG', 'position ', 'edit reachd here');
                         
                         SOrecord.setFieldValue('custbody_partiallybilled', 'F');
                         //nlapiSetFieldValue('custbody_partiallybilled', 'F');
                        // var id = nlapiSubmitRecord(SOrecord, true);
                     }
                 }
nlapiSubmitRecord(SOrecord);
               }

     }
 }
