function myPageInit(type)
{
        initAmount=nlapiGetFieldValue('total');
}


function mySaveRecord()
{
       var lastAmount=nlapiGetFieldValue('total');
       if((nlapiGetFieldValue('custbody_supervisor_approved') == 'T') && (nlapiGetRole()=='1022'||nlapiGetRole()=='1067'))
       {
           if(lastAmount-initAmount==0)
           {
               return true;
           }
           alert('The quantity and/or amount of the PO cannot be modified. If additional funds or line items are required, please submit a new PO for the additional funds or line items to be added to this PO.');
           return false;
       }
       return true;
}
