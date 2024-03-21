public with sharing class SetUpController {
    public SetUpController() {

    }
    @AuraEnabled(cacheable=true)
    public static List<String> getAllObjectName(){
        try {
            List<String> objectNamesKey = new List<String>();
            List<String> objectNamesValues = new List<String>();
            Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
            
            for (SObjectType objectType : gd.values()) {
                objectNamesValues.add(objectType.getDescribe().getName());
            }
            
            system.debug('objectNamesValues :' + objectNamesValues);
            objectNamesValues.sort();
            return objectNamesValues;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}