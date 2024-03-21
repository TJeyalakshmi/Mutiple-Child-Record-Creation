import { LightningElement, wire } from 'lwc';
import getAllObjectName from  '@salesforce/apex/SetUpController.getAllObjectName';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class SetUpComp extends LightningElement {

    selectedObject;
    relObj;
    objectOptions = [];
    relObjName=[];

    @wire(getAllObjectName)
    objectNames({error, data}) {
        if(data) {
            // Process data and populate combobox options
            this.objectOptions = data.map(objName => ({
                label: objName,
                value: objName
            }));
        } else if(error) {
            console.error('Error fetching object names:', error);
        }
    }

    @wire(getObjectInfo, {objectApiName : '$selectedObject'})
    ObjectInfo({error,data}){
        if(data){
            console.log('In Data :' + JSON.stringify(data));
            console.log('In Data.RELATEDLIST  :' + JSON.stringify(data.childRelationships));
            console.log('relObjName :' + JSON.stringify(this.relObjName));
            this.relObj = data.childRelationships;
        } else if(error){
            console.log('In error :' + JSON.stringify(error));
        }
    }

    getChildObjectNames(){

        for (let index = 0; index < this.relObj.length; index++) {
            this.relObjName.push({label : Object.values(this.relObj[index])[0], 
                        value : Object.values(this.relObj[index])[0]});
        }
        console.log('relObjName 11:' + JSON.stringify(this.relObjName));
    }

    handleChange(event) {
        console.log('Name:' + event.target.name);
        console.log('Label:' + event.target.label);
        if(event.target.name == 'objName'){
            this.selectedObject = event.detail.value;
            this.getChildObjectNames();
        }
        
        if(event.target.name == 'Related Object'){
            
        }
        
    }

}