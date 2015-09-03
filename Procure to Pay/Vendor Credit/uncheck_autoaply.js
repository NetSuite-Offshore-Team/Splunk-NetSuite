/*
* At the BillCredit Record creation time Auto apply field shows only checked
* but will do uncheck Record creation time always.
* @author : D.Sreenivasulu
* @Release Date
* @Release Number
* @Project ENHC0051795 
* @version 1.0
*/

//ClientScript PageInit function will uncheck Auto Apply field at page loading time.Auto Apply field is uncheck at Bill Credit Record creation time and copy  bills ,import csv files.
  

function uncheck_autoapply()
	{
         if ( (nlapiGetFieldValue('autoapply') == 'T')){
	nlapiSetFieldValue('autoapply', 'F');
      return true;
	}
    }			