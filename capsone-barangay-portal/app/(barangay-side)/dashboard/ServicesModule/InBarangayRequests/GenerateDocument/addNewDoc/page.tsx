"use client";
import React, { useState, ChangeEvent } from "react";
import { addDoc, collection, getDocs} from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useRouter } from "next/navigation";

interface DocumentField {
    title?: string;
    type?: string;
    description?: string;
    body?: string;
}


export default function AddNewDoc() {

    const router = useRouter();
    const [formValue, setFormValue] = useState<DocumentField>();
    const [newField, setNewField] = useState<string>("");
    const [fields, setFields] = useState<string[]>([]); 
    const handleAddField = () => {
        if (newField.trim() === "") return; // prevent adding empty fields
        setFields([...fields, newField]);
        setNewField(""); // clear input after adding
    };
    const handleRemoveField = (index: number) => {
        const updatedFields = [...fields];
        updatedFields.splice(index, 1);
        setFields(updatedFields);
    };

    const handleFieldChange = (index: number, value: string) => {
        const updatedFields = [...fields];
        updatedFields[index] = value;
        setFields(updatedFields);
    };

    const handleChange=(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value } = e.target;
        setFormValue((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        const docRef = collection(db, "OtherDocuments");
        const docData = {
            ...formValue,
            fields:{
                ...fields
            }
        }
        console.log("Document submitted with fields:", fields);
        console.log("Document body:", formValue);
        console.log("Document data:", docData);
        const doc = await addDoc(docRef, docData) 
        console.log("Document written with ID: ", doc.id);
    }

    return(
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
                        className="w-1/2 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        name="title"
                        onChange={handleChange}
                        value={formValue?.title || ""}
                        required
                        placeholder="Document Title"
                    />
                    <div className="flex items-center w-1/2 mt-4">
                        <label className="text-gray-700">Document Type:</label>
                        <select    
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            name="type"
                            value={formValue?.type || ""}
                            required
                            >
                            <option value="" disabled>Select Document Type</option>
                            <option value="certificate">Certificate</option>
                            <option value="clearance">clearance</option>
                            <option value="indigency">Indigency</option>
                            <option value="id">ID</option>
                            <option value="permit">Permit</option>
                            <option value="clearance">Clearance</option>
                            <option value="jobseeker">First Time Jobseeker</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <input 
                        type="text" 
                        className="w-1/2 ml-1 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Document Description"
                    />
                    {/* Dynamic Fields for Input Names */}
                    {fields.map((field, index) => (
                          <input 
                            key={index}
                            type="text"
                            id={`field-${index}`}
                            className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`${field || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                            value={field}
                            disabled
                            onChange={(e) => handleFieldChange(index, e.target.value)}
                          />
                    ))}
                    <div className="flex items-center mt-2">
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
                    <div className="w-1/2 mt-4">
                        <p className="text-gray-600 mt-4">Add the body of the document below:</p>
                        <p>Use 'day' to include the day today.</p>
                        <p>Use 'month' to include the month today.</p>
                        <p>Use 'year' to include the year today.</p>
                    </div>
                    <textarea  
                        className="w-full mt-4 h-1/2 bg-white p-4 rounded-lg shadow-md"  
                        placeholder="Body of the new document"
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
    );
}