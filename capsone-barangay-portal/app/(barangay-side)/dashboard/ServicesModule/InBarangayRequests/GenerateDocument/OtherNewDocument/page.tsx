"use client";
import { useRouter} from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
interface fieldInputs{
    name: string;
}


interface DocumentField {
    id?: string;
    title?: string;
    type?: string;
    description?: string;
    body?: string;
    fields?: fieldInputs[];
}

interface documentFields {
    name?: string;
    value?: string;
}

interface DocumentData {
    type?: string;
    purpose?: string;
    fields?: documentFields[];
}

export default function AddNewDoc() {
    const router = useRouter();
    const [data, setData] = useState<DocumentData>({});
    const [formValue, setFormValue] = useState<DocumentField[]>([]);
    
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
    
    const handleSubmit = (e: any) => {
        e.preventDefault();
        console.log("Form submitted with data:", data);
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
        
      // If the field name is "type" or "purpose", treat it as a top-level field
      if (name === "type" || name === "purpose") {
        setData((prev) => ({
          ...prev,
          [name]: value,
        }));
      } else {
        // Otherwise treat it as a dynamic field
        setData((prev) => {
          const updatedFields = prev.fields ? [...prev.fields] : [];
        
          const fieldIndex = updatedFields.findIndex((f) => f.name === name);
          if (fieldIndex !== -1) {
            updatedFields[fieldIndex].value = value;
          } else {
            updatedFields.push({ name, value });
          }
        
          return {
            ...prev,
            fields: updatedFields,
          };
        });
      }
    };
    
    console.log("Form Value:", formValue);

    
    return(
        <div className="w-full h-screen bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300">
                    Back
                </button>
                <h1 className="text-2xl font-bold mb-4">Other New Document</h1>
            </div>
           <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow-md">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Document Details</h2> 
                    <p className="text-gray-600 mb-2">Select the type of document you want to generate.</p>
                    <p className="text-gray-600 mb-2">Please fill in the details of the new document you want to generate.</p>
                </div>
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center justify-center">
                    <div className="flex items-center mt-4">
                        <label htmlFor='type' className="text-gray-700">Document Type:</label>
                        <select    
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            name="type"
                            value={data.type || ""}
                            id="type"
                            required
                            >
                            <option value="" disabled>Select Document Type</option>
                            <option value="certificate">Certificate</option>
                            <option value="clearance">Clearance</option>
                            <option value="indigency">Indigency</option>
                            <option value="id">ID</option>
                            <option value="permit">Permit</option>
                            <option value="clearance">Clearance</option>
                            <option value="jobseeker">First Time Jobseeker</option>
                            <option value="other">Other</option>
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
                                    <option key={doc.id} value={doc.title}>
                                        {doc.title}
                                    </option>
                                ))}
                        </select>
                    </div>
                    {formValue
                        .filter((doc: DocumentField) => doc.title === data.purpose)
                        .map((doc: DocumentField) =>
                            doc.fields
                                ? doc.fields.map((field: fieldInputs, index: number) => (
                                    <input
                                        key={index}
                                        type="text"
                                        name={field.name}
                                        value={data.fields?.find(f => f.name === field.name)?.value || ""}
                                        onChange={handleChange}
                                        className="w-1/2 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Enter ${field.name}`}
                                        required
                                    />
                                    ))
                                    : null
                        )
                    }
                    <textarea 
                        className="w-full mt-4 h-full bg-white p-4 rounded-lg shadow-md"  
                        placeholder="Body of the new document"
                        value={
                            formValue.find((doc: DocumentField) => doc.type === data.type && doc.title === data.purpose)?.body || ""
                        }
                        required
                        name="body"
                        disabled
                       
                    />

                    <button 
                        type="submit"
                        className="mt-4 mb-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        Submit Document Request
                    </button>
                </form>
            </div>
        </div>
    );
}