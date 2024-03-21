import { LightningElement, api, wire } from 'lwc';

import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { refreshApex } from "@salesforce/apex";
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

import getFieldNames from '@salesforce/apex/mulChildRecorCrController.getFieldNames';   
import createChildRecords from '@salesforce/apex/mulChildRecorCrController.createChildRecords';

import mulChildRecordCreation from './mulChildRecordCreation.html';
import mulChildRecordCreationA from './mulChildRecordCreationA.html';
import mulChildRecordCreationB from './mulChildRecordCreationB.html';

const templateNameA = 'templateA';
const templateNameB = 'templateB';

export default class MulChildRecordCreation extends LightningElement {
    //records = records;
    //columns1 = columns1;
    @api objectApiName;
    @api recordId;
    relObj=[];
    relObjName=[];
    isShow=true;
    templateName;
    templateNameA = templateNameA;
    templateNameB = templateNameB;
    selObjectName;
    lstFields=[];
    columns=[];
    childRecords=[];
    emptyRecords=[];
    recordCount=2; // Default 2 records
    addOneRec=1;
    childRecFieldNames=[];
    saveDraftValues=[];
    savedChildRecords=[];
    showRecordCreated=false;
    disCreate=true;

    render(){
        switch(this.templateName){
            case templateNameA :
                return mulChildRecordCreationA;
                
            case templateNameB :
                return mulChildRecordCreationB;
            
            default:
                return mulChildRecordCreation;
        }
    }

    @wire(getObjectInfo, {objectApiName : '$objectApiName'})
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
    
    handleClick(event){
        console.log(event);
        relObjName
        this.isShow=false;
    }

    getChildObjectNames(){

        for (let index = 0; index < this.relObj.length; index++) {
            this.relObjName.push({label : Object.values(this.relObj[index])[0], 
                        value : Object.values(this.relObj[index])[0]});
        }
        console.log('relObjName 11:' + JSON.stringify(this.relObjName));
    }

    handleChange(event){
        console.log('In Handle Change :');
        this.selObjectName = event.target.value;
        console.log('Selected Value :' + this.selObjectName);
    }

    handleNext(){
        console.log('In Handle Next');
        this.templateName = this.templateNameA;
        console.log('templateName :' + this.templateName);
        this.getDisplayFields();
    }

    handleCancel(){
        console.log('In Handle Cancel :');
        this.isShow = true;
        this.templateName ='';
    }

    handleDone(){
        console.log('In Handle Done :');
        this.isShow = true;
        this.savedChildRecords = [];
        this.showRecordCreated = false;
        this.templateName =''; 
    }

    handleAddRow(){
        console.log('In Handle Add Row');

        this.createEmptyRecords(this.addOneRec);
        console.log(' Add Row Empty Record :' + JSON.stringify(this.emptyRecords));
        console.log('BF CR :' + JSON.stringify(this.childRecords));
        this.childRecords.push(this.emptyRecords);
        console.log('AF CR :' + JSON.stringify(this.childRecords));
        this.childRecords = [...this.childRecords];
   
    }

    getDisplayFields(){
        console.log('objectApiName :' + this.objectApiName);
        console.log('In getDisplayFields :' + this.selObjectName);
        getFieldNames({objectName : this.selObjectName})
        .then((data)=>{
            this.lstFields = data;
            console.log('lstFields :' + JSON.stringify(this.lstFields));
           
            for (let index = 0; index < this.lstFields.length; index++) { 
                this.childRecFieldNames.push(Object.values(this.lstFields[index])[0]);
            }
            
            this.columns = this.lstFields.map(field => {
                const fldName = Object.values(field)[0];  
                const label = Object.keys(field)[0];  
                return {
                  label: label,
                  fieldName: fldName,
                  editable: true
                };
            });

            console.log('columns :' + JSON.stringify(this.columns));
            console.log('childRecFieldNames ' + this.childRecFieldNames);
            this.createEmptyRecords(this.recordCount); 
            this.childRecords = this.emptyRecords;
        })
        .catch(error=>{
            console.log('In error :' + JSON.parse(error));
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading fieldName Details',
                    message,
                    variant: 'error',
                }),
            );
        })  
    }

    createEmptyRecords(recordCount){
        console.log('In CreateEmptyRecords');
        this.emptyRecords=[];
        this.emptyRecords = Array.from({ length: recordCount }, () => {
            const row = {};
            this.childRecFieldNames.forEach(field => {
                 row[field] = '';
            });
        return row;
        });
        console.log('emptyRecords :' + JSON.stringify(this.emptyRecords));
    }

    handleDTSave(event){
        this.saveDraftValues = event.detail.draftValues;
        console.log('draftValues :' + JSON.stringify(this.saveDraftValues));
        this.disCreate = false;
    }

    handleCreate(){
        console.log('In Handle Create');

        createChildRecords({lstChildRecords : this.saveDraftValues, ObjectName : this.selObjectName, parRecordId : this.recordId})
        .then(response=>{
            this.savedChildRecords = response;
            console.log('After Apex Call :' + JSON.stringify(this.savedChildRecords));
            this.saveDraftValues=[];
            this.showRecordCreated = true;
        })
        .catch(error=>{
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error in saving the Product Details',
                message,
                variant: 'error',
            }),
        );
        })
    }

}