
public with sharing class FieldSetController {
    
    //To fetch all fields
    @AuraEnabled(cacheable=true)
    public static List<String> getAllFields(String childObjectApiName) {
        List<String> fieldNames = new List<String>();
        try {
        
            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(childObjectApiName).getDescribe();
            for (Schema.SObjectField field : describeResult.fields.getMap().values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                if ((fieldDescribe.getType() != Schema.DisplayType.REFERENCE)  && 
                    (fieldDescribe.isUpdateable()) &&
                    (!fieldDescribe.isCalculated())) {
                    fieldNames.add(field.getDescribe().getName());
                }
            }
        } catch(Exception e) {

            System.debug('Error fetching fields for object ' + childObjectApiName + ': ' + e.getMessage());
        }
        fieldNames.sort();
        system.debug('fieldNames :' + fieldNames);
        return fieldNames;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getChildObjectLookupFields(String childObjectName, String parentObjectName) {
        List<String> lookupFields = new List<String>();
        
        // Get the describe information of the child object
        Schema.DescribeSObjectResult childObjectDescribe = Schema.getGlobalDescribe().get(childObjectName).getDescribe();
        
        // Iterate over all fields of the child object
        for (Schema.SObjectField field : childObjectDescribe.fields.getMap().values()) {
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            
            // Check if it's a lookup field and references the parent object
            if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE &&
                fieldDescribe.isUpdateable() &&
                !fieldDescribe.isCalculated()) {
                
                // Get the referenced object names
                Set<String> referenceToNames = new Set<String>();
                for (Schema.SObjectType objType : fieldDescribe.getReferenceTo()) {
                    referenceToNames.add(objType.getDescribe().getName());
                }
                
                // Check if it references the parent object
                if (referenceToNames.contains(parentObjectName)) {
                    lookupFields.add(fieldDescribe.getName());
                }
            }
        }
        system.debug('lookupFields :' + lookupFields);
        return lookupFields;
    }
    
    @AuraEnabled
    public static String createFieldSet(String parObjectName, List<String> lookUpField, String objectApiName, List<String> fields){
        String message;
        String lookFieldName;
        Boolean parFieldPresent = false;
        system.debug('lookUpField :' + lookUpField);
        try {
            system.debug('parObjectName :' + parObjectName);
            system.debug('objectApiName :' + objectApiName);

            List<CustomFieldSet__c> cusFieldSet = new List<CustomFieldSet__c>();

            List<CustomFieldSet__c> lstCusFS = [SELECT Id,ParentObjectName__c, ObjectName__c
                                                FROM CustomFieldSet__c
                                                WHERE ParentObjectName__c = :parObjectName
                                                AND ObjectName__c = :objectApiName
                                                ];

            if(lstCusFS.size() > 0) {
                delete lstCusFS;
            }         
            
            for(String s: fields){
                CustomFieldSet__c cfs = new CustomFieldSet__c();
                cfs.ParentObjectName__c = parObjectName;
                cfs.ObjectName__c = objectApiName;
                cfs.ObjFieldName__c = s;
                cusFieldSet.add(cfs);
            }
            
            if(cusFieldSet.size() > 0){
                CustomFieldSet__c cfs = new CustomFieldSet__c();
                cfs.ParentObjectName__c = parObjectName;
                cfs.ObjectName__c = objectApiName;
                cfs.ObjFieldName__c = lookUpField[0];
                cfs.IsParLookUpField__c = 'Yes';
                cusFieldSet.add(cfs);
            }
            
            system.debug('cusFieldSet :' + cusFieldSet);
            if(cusFieldSet.size() > 0){
                Database.SaveResult[] srs = Database.insert(cusFieldSet, false);
                // Iterate through each returned result
                for (Database.SaveResult sr : srs) {
                    if (sr.isSuccess()) {
                        System.debug('Successfully inserted Custom Field Set: ' + sr.getId());
                        message = 'Successfully created Custom Field Set Records';
                    }
                    else {
                        // Operation failed, so get all errors                
                        for(Database.Error err : sr.getErrors()) {
                            System.debug('The following error has occurred.');                    
                            System.debug(err.getStatusCode() + ': ' + err.getMessage());
                            System.debug('Fields that affected this error: ' + err.getFields());
                        }
                        message = 'Error in creating  Custom Field Set Records';
                    }
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return message;
    }
}