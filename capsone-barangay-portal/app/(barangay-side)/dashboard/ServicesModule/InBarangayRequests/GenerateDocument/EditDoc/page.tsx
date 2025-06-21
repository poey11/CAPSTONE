"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot,updateDoc, doc,deleteDoc} from "firebase/firestore";
import { db,storage } from "@/app/db/firebase";

//formValue interface
interface DocumentField {
    id?: string;
    title?: string;
    type?: string;
    body?: string;
    fields?: FieldInputs[];
    imageFields?: FieldInputs[];
    purpose?: string;
}

interface FieldInputs {
    name?: string;   
}

//data interface Data 
interface dataFields {
    name?: string;
    value?: string;
}
interface imageFields{
    name?: string;
}
interface  data {
    type?: string;
    purpose?: string;
    fields?: dataFields[];
    body?: string;
    imageFields?: imageFields[];
}

export default function EditDoc() {
    const router = useRouter();
    const [formValue, setFormValue] = useState<DocumentField[]>([]);
    const [data, setData] = useState<data>({});

    const [activeFields, setActiveFields] = useState<dataFields[]>([]);
    const [activeImageFields, setActiveImageFields] = useState<imageFields[]>([]);
    const [docId, setDocId] = useState<string>("");

    const [newField, setNewField] = useState<dataFields[]>([]);
    const [newImageField, setNewImageField] = useState<imageFields[]>([])

    const [newFieldName, setNewFieldName] = useState<string>("");
    const [newImageFieldName, setNewImageFieldName] = useState<string>("");
    const instruction = `
    Please fill in the details for the new document you want to add.
    You may include custom fields and image fields as needed.

    To insert dynamic values into the document body, use the following format:
    {day}, {month}, {year}, {name}, and {requestor}.
    These placeholders will be automatically replaced with the actual values.
        
    If you add your own fields (e.g., a field named "address"), you can include them in the document body using the same format: {address}.`;
    
    const handleDeleteDocument = async () => {
        const selectedDoc = formValue.find(
            (doc) => doc.type === data.type && doc.title === data.purpose
        );

        if (!selectedDoc) {
            alert("Document not found");
            return;
        }

        if (!selectedDoc.id) {
            alert("Document ID is missing");
            return;
        }

        const docRef = doc(db, "OtherDocuments", selectedDoc.id); // Now you have the ID

        try {
            await deleteDoc(docRef);
            alert("Document deleted successfully");
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document");
        }

    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const updatedFields = [...activeFields, ...newField]
        const updatedImageFields = [...activeImageFields, ...newImageField];
        const selectedDoc = formValue.find(
          (doc) => doc.type === data.type && doc.title === data.purpose
        );

        if (!selectedDoc) {
          alert("Document not found");
          return;
        }

        if (!selectedDoc.id) {
          alert("Document ID is missing");
          return;
        }
        const docRef = doc(db, "OtherDocuments", selectedDoc.id); // Now you have the ID

        const docData = {
          body: data.body || "",
          fields: updatedFields,
          imageFields: updatedImageFields,
        }
      
        const success = await updateDoc(docRef, docData);
        // You can now update or set data using docRef
        console.log("Document reference ready:", docRef);
        console.log("Document data to be saved:", docData);
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");

    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData((prevData) => {
            if (name === "type") {
                return {
                    ...prevData,
                    type: value,
                    purpose: "", // Reset purpose when type changes
                };
            }
            return {
                ...prevData,
                [name]: value,
            };
        });
    }
    

    const handleRemoveFormValueField = (index: number) => {
        setActiveFields((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveFormValueImageField = (index: number) => {
        setActiveImageFields((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddField = () => {
        if (newFieldName.trim() === "") return; // Prevent adding empty fields
        if(!data.type || !data.purpose ) {
            return alert("Please select a document type and purpose before adding fields.");
        }
        setNewField((prev) => [
            ...prev,
            { name: newFieldName.trim() },
        ]);
        setNewFieldName(""); // Clear input after adding
    }
    const handleRemoveField = (index: number) => {
        const updatedFields = [...newField];
        updatedFields.splice(index, 1);
        setNewField(updatedFields);
    }



    const handleAddImageField = () => {
        if (newImageFieldName.trim() === "") return; // Prevent adding empty fields
        if(!data.type || !data.purpose ) {
            return alert("Please select a document type and purpose before adding fields.");
        }
        setNewImageField((prev) => [
            ...prev,
            { name: newImageFieldName.trim() },
        ]);
        setNewImageFieldName(""); // Clear input after adding
    }
    const handleRemoveImageField = (index: number) => {
        const updatedFields = [...newImageField];
        updatedFields.splice(index, 1);
        setNewImageField(updatedFields);
    }





    useEffect(() => {
        const collectionRef = collection(db, "OtherDocuments");

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const documents: DocumentField[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as DocumentField[];

            setFormValue(documents);
            console.log("Fetched documents:", documents);
        });

        return () => unsubscribe();

    }, []);

    useEffect(() => {
      const selectedDoc = formValue.find(
        (doc) => doc.type === data.type && doc.title === data.purpose
      );
      if (selectedDoc?.fields) {
        setActiveFields([...selectedDoc.fields]); // Deep copy for safe editing
      } else {
        setActiveFields([]);
      }
    }, [data.type, data.purpose, formValue]);


    useEffect(() => {
      const selectedDoc = formValue.find(
        (doc) => doc.type === data.type && doc.title === data.purpose
      );
      if (selectedDoc?.body) {
        setData((prevData) => ({
          ...prevData,
          body: selectedDoc.body,
        }));

    } else {
        setData((prevData) => ({
          ...prevData,
          body: "",
        }));
      }
    }, [data.type, data.purpose, formValue]);


    useEffect(() => {
      const selectedDoc = formValue.find(
        (doc) => doc.type === data.type && doc.title === data.purpose
      );
      if (selectedDoc?.imageFields) {
        setActiveImageFields([...selectedDoc.imageFields]); // Deep copy for safe editing
      } else {
        setActiveImageFields([]);
      }
    }, [data.type, data.purpose, formValue]);

    return(
        <div className="w-full h-screen bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300">
                    Back
                </button>
                <h1 className="text-2xl font-bold mb-4">Edit New Document</h1>
            </div>
           <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow-md">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Document Details</h2> 
                    <p className="text-gray-600 mb-2">Select the type of document you want to modify in the system.</p>
                    <p className="text-gray-600 mb-2">Please fill in the details of the new document you want to modify.</p>
                </div>
                <form onSubmit={handleSubmit} className="w-full h-screen flex flex-col items-center justify-center">
                    <div className="flex items-center mt-4">
                        <label className="text-gray-700">Document Type:</label>
                        <select    
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            name="type"
                            value={data.type || ""}
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
                    <div className="flex items-center mt-4">
                        <label htmlFor='purpose' className="text-gray-700">Document Purpose:</label>
                        <select    
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            name="purpose"
                            value={data.purpose || ""}
                            id="purpose"
                            required
                            >
                            <option value="" disabled>Select Document Purpose</option>
                                {formValue.filter((doc:DocumentField)=> doc.type === data.type).
                                map((doc: DocumentField) => (
                                    <option  key={doc.id} value={doc.title}>
                                        {doc.title}
                                    </option>
                                ))}
                        </select>
                    </div>
                    {/* Dynamic Fields for Input Names */}
                    
                    <div  className="flex flex-col items-start mt-4">
                        <p className="text-gray-600 mb-2">Document Fields:</p>
                             { activeFields.map((field, index) => (
                                <div className="flex items-center" key={index}>
                                    <input 
                                        key={index}
                                        type="text"
                                        id={`field-${index}`}
                                        className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`${field.name || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                        value={field.name || ""}
                                        disabled
                                        onChange={(e) => handleChange(e)}
                                    />
                                    <button 
                                        type="button"
                                        className="mt-2 ml-2 bg-red-600 text-white px-4 py-2 
                                        rounded-md hover:bg-red-800 transition-colors duration-300"
                                        onClick={() => handleRemoveFormValueField(index)}
                                    >-</button>
                                </div>    
                            ))}
                            {newField.map((field, index) => (
                                <input 
                                    key={index}
                                    type="text"
                                    id={`new-field-${index}`}
                                    className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`${field.name || `New Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                    value={field.name || ""}
                                    disabled
                                />
                            ))}
                    </div>
                    <div className="flex items-center mt-2">
                        <label className="text-gray-700">Add Field:</label>
                        <input 
                                type="text" 
                                id="newField"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Field Name`}
                            />
                        
                        {newField && newField .length > 0 && (
                            <button 
                                type="button"
                                className=" ml-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors duration-300"
                                onClick={() => handleRemoveField(newField.length - 1)}
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

                    <div className="flex flex-col items-start mt-4">
                        <p className="text-gray-600 mb-2">Image Fields:</p>
                        { activeImageFields.map((field, index) => (
                            <div className="flex items-center" key={index}>
                                <input 
                                key={index}
                                type="text"
                                id={`field-${index}`}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${field.name || `Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                value={field.name || ""}
                                disabled
                                onChange={(e) => handleChange(e)} />
                                <button 
                                    type="button"
                                    className="mt-2 ml-2 bg-red-600 text-white px-4 py-2 
                                    rounded-md hover:bg-red-800 transition-colors duration-300"
                                    onClick={() => handleRemoveFormValueImageField(index)}
                                >-</button>
                            </div>
                        ))}

                        {newImageField.map((field, index) => (
                            <input 
                                key={index}
                                type="text"
                                id={`new-field-${index}`}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${field.name || `New Field Name ${index + 1}`}`} // fallback placeholder if field is empty
                                value={field.name || ""}
                                disabled
                            />
                        ))}
                    </div>
                
                    <div className="flex items-center mt-2">
                        <label className="text-gray-700">Add Image Field:</label>
                        <input 
                                type="text" 
                                id="newImageFieldName"
                                value={newImageFieldName}
                                onChange={(e) => setNewImageFieldName(e.target.value)}
                                className="mt-2 w-1/8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Field Name`}
                            />
                        {newImageField && newImageField.length > 0 && (
                            <button 
                                type="button"
                                className=" ml-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors duration-300"
                                onClick={() => handleRemoveImageField(newImageField.length - 1)}
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
                        className="w-full mt-4 h-full bg-white p-4 rounded-lg shadow-md"  
                        placeholder={instruction}
                        onChange={handleChange}
                        value={data.body || ""}
                        required
                        name="body"
                    />
                    <button 
                        type="submit"
                        className="mt-4 mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        Save Document
                    </button>
                    
                    <button 
                        type="button"
                        className="mt-4 mb-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300"
                        onClick={handleDeleteDocument}
                    >
                        Delete Document
                    </button>
                </form>
            </div>
        </div>
    );
}