public with sharing class mulChildRecorCrController {
public mulChildRecorCrController() {

}

@AuraEnabled(cacheable=true)
    public static List<Map<String,String>> getFieldNames(String objectName){
    try {
        system.debug('Get FieldSet List '); 

        List<Map<String,String>> lstFS = new List<Map<String,String>>();
        String fieldSet = objectName + '_FieldSet';
        
        Schema.DescribeSObjectResult objdesc = Schema.getGlobalDescribe().get(objectName).getDescribe();
        List<Schema.FieldSetMember> conFSM = objdesc.fieldSets.getMap().get(fieldSet).getFields();
        system.debug('conFSM :' + conFSM);
        
        for(Schema.FieldSetMember fsm : conFSM ){
            Map<String,String> fsMap= new Map<String,String>();
            fsMap.put(fsm.getFieldPath(),fsm.getFieldPath());
            lstFS.add(fsMap);
        }
        system.debug('lstFS :' + lstFS);
        return lstFS;

    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

@AuraEnabled
public static List<SObject> createChildRecords(List<Map<String,String>> lstChildRecords, String ObjectName, string parRecordId){
    try {
        system.debug('lstChildRecords :' + lstChildRecords);
        system.debug('Object Name :' + ObjectName);
        system.debug('Sobject Name : ' + Schema.getGlobalDescribe().get(objectName).newSObject());
        system.debug('parRecordId :' + parRecordId);

        String parfieldSet = objectName + '_Parent_FieldSet';
        Schema.DescribeSObjectResult objdesc = Schema.getGlobalDescribe().get(objectName).getDescribe();
        system.debug('objdesc :' + objdesc);
        List<Schema.FieldSetMember> conparFSM = objdesc.fieldSets.getMap().get(parfieldSet).getFields();
        String conparField = conparFSM[0].getFieldPath();
        system.debug('conparFSM :' + conparField);
        
        
        List<SObject> recsToInsert = new List<SObject>();
        for(Map<String,String> childRecord :lstChildRecords ){
            system.debug('childRecord :' + childRecord);
            SObject recToInsert = (SObject)Type.forName(ObjectName).newInstance();
            for (String fieldName : childRecord.keySet()) {
                if (recToInsert.getSObjectType().getDescribe().fields.getMap().containsKey(fieldName)) {
                    if(fieldName != 'id'){
                        recToInsert.put(fieldName, childRecord.get(fieldName));
                    }   
                } else {
                    System.debug('Field ' + fieldName + ' does not exist on object ' + objectName);
                }
                recToInsert.put(conparField, parRecordId);
            }
            recsToInsert.add(recToInsert);
        }
        system.debug('recsToInsert :' + recsToInsert);

        if (!recsToInsert.isEmpty()) {
            Database.SaveResult[] saveResults = Database.insert(recsToInsert, false);
        
            for (Database.SaveResult saveResult : saveResults) {
                if (!saveResult.isSuccess()) {
                    for (Database.Error error : saveResult.getErrors()) {
                        System.debug('Error inserting record: ' + error.getMessage());
                    }
                }
            }
            system.debug('recsToInsert :' + recsToInsert); 
        }

        return recsToInsert;
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}
    
}