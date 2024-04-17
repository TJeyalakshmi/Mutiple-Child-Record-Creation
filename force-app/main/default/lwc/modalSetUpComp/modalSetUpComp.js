import { LightningElement, api, track, wire } from 'lwc';
import getAllFields from '@salesforce/apex/FieldSetController.getAllFields';
import getChildObjectLookupFields from '@salesforce/apex/FieldSetController.getChildObjectLookupFields';
import createFieldSet from '@salesforce/apex/FieldSetController.createFieldSet';

import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class SetUpCompModal extends LightningElement {

    @api showModal = false;
    @api selectedParentObject;
    @api selectedChildObject;
    @track modalClass = 'modal';

    fieldOptions =[];
    selectedFields =[];
    lookUpfieldOptions = [];
    selectedLookUpField = '';


    connectedCallback(){
        console.log("In Child Component - ");
    } 

    @wire(getChildObjectLookupFields, { childObjectName: '$selectedChildObject', parentObjectName: '$selectedParentObject'  })
    wiredObjectInfo({ error, data }) {
        if (data) {
            console.log('Data LookUp Fields - ', JSON.stringify(data));
        
            this.lookUpfieldOptions = data.map(fields => ({ label: fields, value: fields }));
            this.getAllOtherFields();
        } else if (error) {
            console.log('Error fetching object info', JSON.stringify(error));
        }
    }
    getAllOtherFields(){
        getAllFields({childObjectApiName: this.selectedChildObject})
        .then(response=>{
            this.fieldOptions = response.map(fields => ({ label: fields, value: fields }));
            console.log('fieldOptions :' + JSON.stringify(this.fieldOptions));
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

    handleFieldChange(event){
        this.selectedFields = event.detail.value;
        console.log('selectedFields in dualBox - ', this.selectedFields);

    }

    handleFieldCh(event){
        this.selectedLookUpField = event.detail.value;
        console.log('selectedLookUpField in dualBox - ', this.selectedLookUpField);
    }


    handleCreateFieldSet(){
        createFieldSet({ parObjectName: this.selectedParentObject, lookUpField:this.selectedLookUpField, objectApiName: this.selectedChildObject, fields: this.selectedFields })
        .then(result => {
            console.log('Field set created:', result);
            let messageResult = result;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: JSON.stringify(messageResult),
                    variant: 'success',
                }),
            );
            this.dispatchEvent(new CustomEvent('modalsuccess'));
        })
        .catch(error => {
            console.error('Error creating field set:', JSON.stringify(error));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: JSON.stringify(error),
                    variant: 'error',
                }),
            );
        });
    }


    get modalClass() {
        return this.showModal ? 'modal show-modal' : 'modal';
    }


    handleModalCancel(){
        this.dispatchEvent(new CustomEvent('modalcancel')); 
    }
}