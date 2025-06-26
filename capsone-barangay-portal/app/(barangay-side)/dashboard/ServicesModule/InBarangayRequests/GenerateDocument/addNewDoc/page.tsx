"use client";
import React, { useState, ChangeEvent } from "react";
import { addDoc, collection, getDocs} from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useRouter } from "next/navigation";
import "@/CSS/barangaySide/ServicesModule/GenerateDocument.css";

interface DocumentField {
    title?: string;
    type?: string;
    body?: string;
    forResidentOnly?: boolean;
}

interface FieldInputs {
    name?: string;   
}



export default function AddNewDoc() {

    const router = useRouter();
    const [formValue, setFormValue] = useState<DocumentField>(
        {
            title: "",
            type: "",
            body: "",
            forResidentOnly: false,
        }
    );
    const [newField, setNewField] = useState<string>("");
    const [fields, setFields] = useState<FieldInputs[]>([]); 

    const [newImageField, setnewImageField] = useState<string>("");

    const [imageFields, setImageFields] = useState<FieldInputs[]>([]);

    const instruction = `
    Please fill in the details for the new document you want to add.
    You may include custom fields and image fields as needed.

    To insert dynamic values into the document body, use the following format:
    {day}, {month}, {year}, {name}, and {requestor}.
    These placeholders will be automatically replaced with the actual values.
        
    If you add your own fields (e.g., a field named "address"), you can include them in the document body using the same format: {address}.`;

    const handleAddField = () => {
        if (newField.trim() === "") return; // prevent adding empty fields
        setFields([...fields, { name: newField }]);
        setNewField(""); // clear input after adding
    };

    const handleAddImageField = () => {
        if( newImageField.trim() === "") return; // prevent adding empty fields
        setImageFields([...imageFields, { name:  newImageField }]);
        setnewImageField(""); // clear input after adding
    };

    const handleRemoveImageField = (index: number) => {
        const updatedImageFields = [...imageFields];
        updatedImageFields.splice(index, 1);
        setImageFields(updatedImageFields);
    };

    const handleChangeImageField = (index: number, value: string) => {
        const updatedImageFields = [...imageFields];
        updatedImageFields[index] = { name: value };
        setImageFields(updatedImageFields);
    };

    const handleRemoveField = (index: number) => {
        const updatedFields = [...fields];
        updatedFields.splice(index, 1);
        setFields(updatedFields);
    };

    const handleFieldChange = (index: number, value: string) => {
        const updatedFields = [...fields];
        updatedFields[index] = { name: value };
        setFields(updatedFields);
    };

    const handleChange=(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value } = e.target;
        setFormValue((prev) => {
            if(name==="type"){
                return{
                    ...prev,
                    type: value,
                    purpose:""
                }
            }
            return {
                ...prev,
                [name]: value,
            };
        });
    }
    const newFields = [...fields, { name: "name" }, { name: "requestor" }];

    

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        
        const docRef = collection(db, "OtherDocuments");
        const docData = {
            ...formValue,
            fields:newFields,
            imageFields: imageFields,

        }
        console.log("Document submitted with fields:", fields);
        console.log("Document body:", formValue);
        console.log("Document data:", docData);
        const doc = await addDoc(docRef, docData) 
        console.log("Document written with ID: ", doc.id);
        alert("Document added successfully!");
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    }
    const handleBack = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    };

    const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const togglePredefinedOpen = () => {
        setIsPredefinedOpen(prev => !prev);
    };

    const toggleNotesOpen = () => {
        setIsNotesOpen(prev => !prev);
    };

    return(
        <main className="addNewDoc-main-container">
            {/* NEW */}
            <form onSubmit={handleSubmit}>
                <div className="addNewDoc-inbrgy-main-content">
                    <div className="addNewDoc-inbrgy-main-section1">
                        <div className="addNewDoc-inbrgy-main-section1-left">
                            <button onClick={handleBack}>
                                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                            </button>

                            <h1> Add New Document </h1>
                        </div>

                        <div className="action-btn-section">
                            <button type="submit" className="action-add-new-doc">
                                Save New Document
                            </button>
                        </div>
                    </div>

                    <div className="addNewDoc-info-main-container">
                        <div className="addNewDoc-info-top-section">
                            <h1>* Please fill in the details of the new document you want to add. *</h1>
                        </div>
                        <div className="addNewDoc-info-bottom-section">
                            <div className="addNewDoc-left-section">
                                <div className="addNewDoc-fields-section">
                                    <p>Document Title<span className="required">*</span></p>
                                    <input
                                        type="text"
                                        name="title"
                                        onChange={handleChange}
                                        value={formValue?.title || ""}
                                        className="addNewDoc-input-field" 
                                        placeholder="Enter Document Title"
                                        required
                                    />
                                </div>
                                <div className="addNewDoc-fields-section">
                                    <p>Document Type<span className="required">*</span></p>
                                    <select  
                                        name="type"
                                        className="addNewDoc-input-field" 
                                        value={formValue?.type || ""}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>Select Document Type</option>
                                        <option value="Barangay Certificate">Certificate</option>
                                        <option value="Barangay Clearance">Clearance</option>
                                        <option value="Barangay Indigency">Indigency</option>
                                        <option value="Barangay ID">ID</option>
                                        <option value="Barangay Permit">Permit</option>
                                        <option value="First Time Jobseeker">First Time Jobseeker</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="addNewDoc-checkbox-container">
                                    <label className="addNewDoc-checkbox-label" htmlFor="forResidentOnly" >
                                        <p>Is the document only for Residents?<span className="required">*</span></p> 
                                    </label>
                                    <input 
                                        type="checkbox" 
                                        name="forResidentOnly"  
                                        checked={formValue?.forResidentOnly || false}
                                        onChange={(e) => setFormValue({ ...formValue, forResidentOnly: e.target.checked })}
                                    />  
                                </div>
                                
                                <div className="box-container-outer-doc-fields">
                                    <div className="title-doc-fields">
                                        Document Fields
                                    </div>

                                    
                                    <div className="box-container-doc-fields">
                                        <div className="instructions-container">
                                            <h1>* Enter the fields needed for the document. No need to input pre-defined fields. *</h1>
                                        </div>
                                        <span className="required-asterisk">*</span>
                                        <div className="add-doc-field-container">
                                            <div className="add-doc-field-row">
                                                <div className="row-title-section">
                                                    <h1>Add Field:</h1>
                                                </div>
                                                <div className="row-input-section">
                                                    <input 
                                                        type="text" 
                                                        id="newField"
                                                        value={newField}
                                                        onChange={(e) => setNewField(e.target.value)}
                                                        className="add-doc-field-input"
                                                        placeholder={`Enter Field Name`}
                                                    />
                                                </div>
                                                <div className="row-button-section">
                                                    <button
                                                        type="button"
                                                        className="doc-field-add-button"
                                                        onClick={handleAddField}
                                                        >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="added-doc-field-container">
                                            {fields.map((field, index) => (
                                                <div key={`field-${index}`} className="added-doc-field-row">
                                                    <div className="row-input-section-added">
                                                        <input 
                                                            type="text"
                                                            id={`field-${index}`}
                                                            className="added-doc-field-input"
                                                            placeholder={`${field || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                                            value={field.name || ""}
                                                            disabled
                                                            onChange={(e) => handleFieldChange(index, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="row-button-section">
                                                        <button 
                                                            type="button"
                                                            className="doc-field-remove-button"
                                                            onClick={() => handleRemoveField(index)}
                                                        >
                                                            -
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>

                                <div className="box-container-outer-doc-reqs">
                                    <div className="title-doc-reqs">
                                        Requirements Fields
                                    </div>
                                    <div className="box-container-doc-reqs">
                                        <div className="instructions-container">
                                            <h1>* Enter the requirements needed for this document. *</h1>
                                        </div>
                                        <span className="required-asterisk">*</span>
                                        <div className="add-doc-field-container">
                                            <div className="add-doc-field-row">
                                                <div className="row-title-section">
                                                    <h1>Add Field:</h1>
                                                </div>
                                                <div className="row-input-section">
                                                    <input 
                                                        type="text" 
                                                        id="newField"
                                                        value={newImageField}
                                                        onChange={(e) => setnewImageField(e.target.value)}
                                                        className="add-doc-field-input"
                                                        placeholder={`Enter Requirements Field`}
                                                    />
                                                </div>
                                                <div className="row-button-section">
                                                    <button
                                                        type="button"
                                                        className="doc-field-add-button"
                                                        onClick={handleAddImageField}
                                                        >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="added-doc-field-container">
                                            {imageFields.map((field, index) => (
                                                <div key={`field-${index}`} className="added-doc-field-row">
                                                    
                                                    <div className="row-input-section-added">
                                                        <input 
                                                            type="text"
                                                            id={`field-${index}`}
                                                            className="added-doc-field-input"
                                                            placeholder={`${field || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                                            value={field.name || ""}
                                                            disabled
                                                            onChange={(e) => handleChangeImageField(index, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="row-button-section">
                                                        <button 
                                                            type="button"
                                                            className="doc-field-remove-button"
                                                            onClick={() => handleRemoveImageField(index)}
                                                        >
                                                            -
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="addNewDoc-right-section">
                                <div className="predefined-fields-notes-container">
                                    <div className="predefined-fields-notes-container-tile" style={{cursor: 'pointer'}} onClick={togglePredefinedOpen}>
                                        <div className="predefined-fields-title">
                                            <h1>Pre-defined Fields</h1>
                                        </div>
                                        <div className="predefined-fields-button-section">
                                            <button
                                                type="button"
                                                className="toggle-btn-predefined-fields"
                                                aria-label={isPredefinedOpen ? 'Hide details' : 'Show details'}
                                            >
                                            <img
                                                src={isPredefinedOpen ? '/Images/up.png' : '/Images/down.png'}
                                                alt={isPredefinedOpen ? 'Hide details' : 'Show details'}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            </button>
                                        </div>                                        
                                    </div>

                                
                                    {isPredefinedOpen && (
                                        <div className="predefined-fields-content">
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>1. Field Name: 'name'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display who the document is for*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>2. Field Name: 'requestor'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the name of requestor*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>3. Field Name: 'day'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the day today*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>4. Field Name: 'month'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the month today*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>5. Field Name: 'year'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the year today*</h1>
                                                </div>
                                            </div>    
                                        </div>
                                    )}
                                </div>

                                <div className="notes-container">
                                    <div className="notes-container-tile" style={{cursor: 'pointer'}} onClick={toggleNotesOpen}>
                                        <div className="notes-title">
                                            <h1>Notes</h1>
                                        </div>
                                        <div className="notes-button-section">
                                            <button
                                                type="button"
                                                className="toggle-btn-predefined-fields"
                                                aria-label={isNotesOpen ? 'Hide details' : 'Show details'}
                                            >
                                            <img
                                                src={isNotesOpen ? '/Images/up.png' : '/Images/down.png'}
                                                alt={isNotesOpen ? 'Hide details' : 'Show details'}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            </button>
                                        </div>                                        
                                    </div>

                                    {isNotesOpen && (
                                        <div className="notes-content">
                                            <div className="notes-row">
                                                <h1>
                                                    To insert dynamic values into the document body, use the following format: {'{day}'}, {'{month}'}, {'{year}'}, {'{name}'}, and {'{requestor}'}.
                                                </h1>
                                            </div>
                                            <div className="notes-row">
                                                <h1>
                                                    These placeholders will be automatically replaced with the actual values.
                                                </h1>
                                            </div>
                                            <div className="notes-row">
                                                <h1>
                                                    If you add your own fields (e.g., a field named "address"), you can include them in the document body using the same format: {`{address}`}.
                                                </h1>
                                            </div>
                                            <div className="notes-row-sample">
                                                <h2>
                                                    Sample Body:
                                                </h2>
                                                <h1>
                                                    This is to certify that {`{name}`} is a resident of Barangay Fairview. <br/>
                                                </h1>
                                                <h1>
                                                    This document is issued upon the request of {`{requestor}`}.
                                                </h1>
                                                <h1>
                                                    Issued on {`{month}`} {`{day}`}, {`{year}`}.
                                                </h1>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="box-container-outer-body">
                                    <div className="title-body">
                                        Document Body
                                    </div>
                                    
                                    <div className="box-container-body">
                                        <span className="required-asterisk">*</span>
                                        <textarea 
                                            className="body-input-field"
                                            placeholder="Enter Body of Document"
                                            onChange={handleChange}
                                            value={formValue?.body || ""}
                                            name="body"
                                            required
                                        />
                                    </div>

                                </div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>
            </form>
            


            {/* OLD */}
{/*

            <div className="w-full h-screen bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300">
                    Back
                </button>
                <h1 className="text-2xl font-bold mb-4">Add New Document</h1>
            </div>
           <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow-md">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Document Details</h2> 
                    <p className="text-gray-600 mb-2">Select the type of document you want to add to the system.</p>
                    <p className="text-gray-600 mb-2">Please fill in the details of the new document you want to add.</p>
                </div>
                <form onSubmit={handleSubmit} className="w-full h-screen flex flex-col items-center justify-center">
                    <input 
                        type="text" 
                        className="w-1/2  p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        name="title"
                        onChange={handleChange}
                        value={formValue?.title || ""}
                        required
                        placeholder="Document Title"
                    />
                    <div className="flex items-center mt-4">
                        <label className="text-gray-700">Document Type:</label>
                        <select    
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            name="type"
                            value={formValue?.type || ""}
                            required
                            >
                            <option value="" disabled>Select Document Type</option>
                            <option value="Barangay Certificate">Certificate</option>
                            <option value="Barangay Clearance">Clearance</option>
                            <option value="Barangay Indigency">Indigency</option>
                            <option value="Barangay ID">ID</option>
                            <option value="Barangay Permit">Permit</option>
                            <option value="First Time Jobseeker">First Time Jobseeker</option>
                            <option value="Other">Other</option>
                        </select>
                        
                        <div className="flex items-center ">

                            <label htmlFor="forResidentOnly" className="ml-2">Is the document only for Resident?</label>
                            <input 
                                type="checkbox" 
                                name="forResidentOnly"
                                checked={formValue?.forResidentOnly || false}
                                onChange={(e) => setFormValue({ ...formValue, forResidentOnly: e.target.checked })}
                                className="ml-2 mr-2"
                            />
                            <span className="text-gray-700">Yes</span>
                        </div>
                    </div>
                    {/* Dynamic Fields for Input Names */}

{/*
                    Document field
                    {fields.map((field, index) => (
                          <input 
                            key={index}
                            type="text"
                            id={`field-${index}`}
                            className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`${field || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                            value={field.name || ""}
                            disabled
                            onChange={(e) => handleFieldChange(index, e.target.value)}
                          />
                    ))}

                    <div className="flex items-center mt-2">
                        <label className="text-gray-700">Add Field:</label>
                        <input 
                                type="text" 
                                id="newField"
                                value={newField}
                                onChange={(e) => setNewField(e.target.value)}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Field Name`}
                            />
                        {fields.length > 0 && (
                        <button 
                            type="button"
                            className=" ml-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors duration-300"
                            onClick={() => handleRemoveField(fields.length - 1)}
                            >
                            -
                        </button>
                        )}
                        <button
                            type="button"
                            className=" ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors duration-300"
                            onClick={handleAddField}
                            >
                            +
                        </button>
                    </div>

                    Image  field
                    {imageFields.map((field, index) => (

                        <input 
                            key={index}
                            type="text"
                            id={`field-${index}`}
                            className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`${field || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                            value={field.name || ""}
                            disabled
                            onChange={(e) => handleChangeImageField(index, e.target.value)}
                          />

                    ))}
                    
                    <div className="flex items-center mt-2">
                        <label className="text-gray-700">Add Image Field:</label>
                        <input 
                                type="text" 
                                id="newField"
                                value={newImageField}
                                onChange={(e) => setnewImageField(e.target.value)}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Field Name`}
                            />
                        {imageFields.length > 0 && (
                        <button 
                            type="button"
                            className=" ml-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors duration-300"
                            onClick={() => handleRemoveImageField(imageFields.length - 1)}
                            >
                            -
                        </button>
                        )}
                        <button
                            type="button"
                            className=" ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors duration-300"
                            onClick={handleAddImageField}
                            >
                            +
                        </button>
                    </div>
                    <div className="w-1/2 mt-4">
                        <p className="text-gray-600 mt-4">Add pre-set field names:</p>
                        <p>Use 'day' to include the day today.</p>
                        <p>Use 'month' to include the month today.</p>
                        <p>Use 'year' to include the year today.</p>

                        <p>Use 'name' to include the name for the document.</p>
                        <p>Use 'requestor' to include the requestor's name.</p>
                    </div>
                    <textarea  
                        className="w-full mt-4 h-1/2 bg-white p-4 rounded-lg shadow-md"  
                        placeholder={instruction}
                        onChange={handleChange}
                        value={formValue?.body || ""}
                        required
                        name="body"
                        
                        />
                    <button 
                        type="submit"
                        className="mt-4 mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        Save Document
                    </button>
                </form>
            </div>
        </div>

        */}

        </main>
        
    );
}