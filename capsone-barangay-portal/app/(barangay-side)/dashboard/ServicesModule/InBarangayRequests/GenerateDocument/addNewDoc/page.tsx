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

    const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

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

    /*
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
    */

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
    
        setFormValue((prev) => {
            if (name === "type") {
                const isResidentDoc =
                    value === "Barangay Certificate" ||
                    value === "Barangay Clearance" ||
                    value === "Barangay Indigency";
    
                return {
                    ...prev,
                    type: value,
                    forResidentOnly: isResidentDoc ? true : prev.forResidentOnly,
                    purpose: "",
                };
            }
    
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const preDefinedFields: FieldInputs[] = [
        { name: "requestorFname" },
        { name: "requestorMrMs" },
        { name: "dateOfResidency" },
        { name: "address" },
      ];
      
      const preDefinedRequirements: FieldInputs[] = [
        { name: "signaturejpg" },
        { name: "barangayIDjpg" },
        { name: "validIDjpg" },
        { name: "letterjpg" },
      ];


    

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        
        const docRef = collection(db, "OtherDocuments");
        const docData = {
            ...formValue,
            fields: [...preDefinedFields, ...fields],
            imageFields: [...preDefinedRequirements, ...imageFields],
            newDoc: true,
        };
        console.log("Document submitted with fields:", fields);
        console.log("Document body:", formValue);
        console.log("Document data:", docData);
        const doc = await addDoc(docRef, docData) 
        console.log("Document written with ID: ", doc.id);

        setPopupMessage("New Document added successfully!");
        setShowPopup(true);
    
        // Hide the popup after 3 seconds
        setTimeout(() => {
        setShowPopup(false);
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
        }, 3000);
    }
    const handleBack = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    };

    const togglePredefinedOpen = () => {
        setIsPredefinedOpen(prev => !prev);
    };

    const toggleNotesOpen = () => {
        setIsNotesOpen(prev => !prev);
    };

    return(
        <main className="addNewDoc-main-container">
            {/* NEW */}
            <form onSubmit={handleSubmit} className="addNewDoc-inbrgy-main-content">
              
                    <div className="addNewDoc-inbrgy-main-section1">
                        <div className="addNewDoc-inbrgy-main-section1-left">
                            <button type="button" onClick={handleBack}>
                                <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
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
                            <div className="add-resident-bottom-section-scroll"> 
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
                                        <option value="Barangay Permit">Permit</option>
                                        <option value="Other Documents">Other</option>
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
                                        disabled={
                                            formValue.type === "Barangay Certificate" ||
                                            formValue.type === "Barangay Clearance" ||
                                            formValue.type === "Barangay Indigency"
                                         }
                                        onChange={(e) => setFormValue({ ...formValue, forResidentOnly: e.target.checked })}
                                    />    
                                </div>
                                
                                <div className="box-container-outer-doc-fields">
                                    <div className="title-doc-fields">
                                        Document Fields
                                    </div>

                                    
                                    <div className="box-container-doc-fields">
                                        <div className="instructions-container">
                                            <h1>* Enter the fields needed for the document. No need to input pre-defined fields. FORMAT: sample_field *</h1>
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
                                            <h1>* Enter the requirements needed for this document. FORMAT: sample_field *</h1>
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
                                                    <h1>1. Field Name: 'requestorFname'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the requestor's name*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>2. Field Name: 'requestorMrMs'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the requestor's title*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>3. Field Name: 'address'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the requestor's address*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>4. Field Name: 'dateOfResidency'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the requestor's dateOfResidency*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>5. Field Name: 'day'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the day today*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>6. Field Name: 'month'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the month today*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>7. Field Name: 'year'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Use this field to display the year today*</h1>
                                                </div>
                                            </div>  

                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>8. Field Name: 'signaturejpg'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Requirements field for Signature requirement*</h1>
                                                </div>
                                            </div>    
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>9. Field Name: 'barangayIDjpg'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Requirements field for Barangay ID requirement*</h1>
                                                </div>
                                            </div>  
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>10. Field Name: 'validIDjpg'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Requirements field for Valid ID requirement*</h1>
                                                </div>
                                            </div>
                                            <div className="predefined-field-row">
                                                <div className="predefined-field-name">
                                                    <h1>11. Field Name: 'letterjpg'</h1>
                                                </div>
                                                <div className="predefined-field-description">
                                                    <h1>*Requirements field for Endorsement Letter requirement*</h1>
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
                                                    To insert dynamic values into the document body, use the following format: <strong>{'{requestorFname}'}</strong>.
                                                </h1>
                                            </div>
                                            <div className="notes-row">
                                                <h1>
                                                    These placeholders will be automatically replaced with the actual values.
                                                </h1>
                                            </div>
                                            <div className="notes-row">
                                                <h1>
                                                    If you add your own fields (e.g., a field named "businessName"), you can include them in the document body using the same format: {`{businessName}`}.
                                                </h1>
                                            </div>
                                            <div className="notes-row-sample">
                                                <h2>
                                                    Sample Body:
                                                </h2>
                                                <h1>
                                                    This is to certify that {`{requestorFname}`} from {`{address}`} is a resident of Barangay Fairview. <br/>
                                                </h1>
                                                <h1>
                                                    This document is issued upon the request of {`{requestorMrMs}`} {`{requestorFname}`}.
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

            {showPopup && (
                <div className={`popup-overlay-add-new-doc show`}>
                    <div className="popup-add-new-doc">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}
        </main>
        
    );
}