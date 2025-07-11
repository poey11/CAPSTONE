"use client";
import { useRouter} from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot,addDoc, doc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db,storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import {customAlphabet} from "nanoid";

//documentField interface
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
  imageFields: fieldInputs[];
  forResidentOnly?: boolean;
}

//data interace
interface dataFields {
    name?: string;
    value?: string;
}
interface imageFields{
    name?: string;
    file?: File;

}
interface  data {
    type?: string;
    purpose?: string;
    fields?: dataFields[];
    body?: string;
    imageFields?: imageFields[];
}

export default function AddNewDoc() {
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const [data, setData] = useState<data>({});
    const [formValue, setFormValue] = useState<DocumentField[]>([]);
    const [day, setDay] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const extraData = {
        day: day,
        month: month,
        year: year,
    };

    useEffect(() => {
        const selectedDoc = formValue.find(
          (doc) => doc.type === data.type && doc.title === data.purpose
        );
      
        if (selectedDoc?.body) {
          const replaced = replacePlaceholders(
            selectedDoc.body,
            data.fields || [],
            extraData
          );
        
          setData((prev) => ({
            ...prev,
            body: replaced,
          }));
        }
    }, [data.fields, data.type, data.purpose, formValue]);

    
    const getMonthName = (monthNumber:number) => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
    
      if (monthNumber >= 1 && monthNumber <= 12) {
        return monthNames[monthNumber - 1];
      } else {
        return "Invalid month number";
      }
    }

    function getOrdinal(n: number): string {
      const suffixes = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    const today = new Date();
    
    
    useEffect(() => {
        const day = getOrdinal(today.getDate());
        const month = getMonthName(today.getMonth() + 1);
        const year = today.getFullYear();
        setDay(day);
        setMonth(month);
        setYear(year.toString());
    }, []);
    

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

    const [number,setNumber] = useState(0);
        useEffect(() => {
            const fetchNumber = async () => {
                try {
                    const count = await getSpecificCountofCollection("ServiceRequests",  "accID", "INBRGY-REQ");
                    setNumber(count || 0);
                } catch (error) {
                    console.error("Error fetching number:", error);
                }
            }
            fetchNumber();
    
        },[])

        const [reqID, setReqID] = useState<string>("");
    
        useEffect(() => {
            const getRequestId = () => {
                const alphabet =  `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
                const randomId = customAlphabet(alphabet, 6);
                const requestId = randomId();
                const nos = String(number+1).padStart(4, '0'); // Ensure the number is 4 digits
                let format = `${requestId} - ${nos}`;
                setReqID(format);
            }
            getRequestId();
    
        }, [number]);

    
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      console.log("Form submitted with data:", data);

      const requestorField = data.fields?.find(
        (f) => f.name?.toLowerCase() === "requestor"
      );

      // 1. Upload images to Firebase Storage
      const uploadedImageUrls = await Promise.all(
        (data.imageFields || []).map(async (imgField) => {
          if (!imgField.file || !imgField.name) return null;

          const fileName = `${reqID}-${imgField.name}-${Date.now()}`;
          const storageRef = ref(storage, `ServiceRequests/${fileName}`);

          await uploadBytes(storageRef, imgField.file);
          const downloadURL = await getDownloadURL(storageRef);

          return {
            name: imgField.name,
            url: downloadURL,
          };
        })
      );

      // 2. Filter out null entries
      const validImages = uploadedImageUrls.filter((img) => img !== null);

      // 3. Prepare Firestore document data
      const docData = {
        accID: "INBRGY-REQ",
        reqType: "Other Documents",
        docType: data.type,
        requestId: reqID,
        createdAt: new Date().toLocaleString(),
        requestor: requestorField ? requestorField.value : "",
        purpose: data.purpose,
        status: "Pending",
        statusPriority: 1,
        body: data.body,
        createdBy: user?.id || "",
        fields: data.fields,
        imageFields: validImages, // Save download URLs, not File objects
      };

      // 4. Save to Firestore
      const docRef = collection(db, "ServiceRequests");
      const success = await addDoc(docRef, docData);

      console.log("Request submitted successfully.");

      console.log("Document data to be saved:", docData);
    router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/OtherNewDocument/view?id="+ success.id);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, files, type } = e.target as HTMLInputElement;
      
         // When document type is changed
        if (name === "type") {
          setData((prev) => ({
            ...prev,
            type: value,
            purpose: "",           // 🔁 reset purpose
            fields: [],            // reset dynamic fields
            imageFields: [],       // reset uploaded files
          }));
          return;
        }
      
         // When purpose is changed
        if (name === "purpose") {
          setData((prev) => ({
            ...prev,
            purpose: value,
            fields: [],            // reset fields when purpose changes
            imageFields: [],       // reset imageFields when purpose changes
          }));
          return;
        }
      
         // File upload
        if (type === "file" && files && files.length > 0) {
          const file = files[0];
          setData((prev) => {
            const updatedImages = prev.imageFields ? [...prev.imageFields] : [];
            const existingIndex = updatedImages.findIndex((img) => img.name === name);
          
            if (existingIndex !== -1) {
              updatedImages[existingIndex].file = file;
            } else {
              updatedImages.push({ name, file });
            }
          
            return {
              ...prev,
              imageFields: updatedImages,
            };
          });
        } else {
          // Text input
          setData((prev) => {
            const updatedFields = prev.fields ? [...prev.fields] : [];
            const existingIndex = updatedFields.findIndex((f) => f.name === name);
          
            if (existingIndex !== -1) {
              updatedFields[existingIndex].value = value;
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





    function replacePlaceholders(
      body: string,
      fields: dataFields[] = [],
      extra: Record<string, string> = {}
    ): string {
      return body.replace(/\{(\w+)\}/g, (_, key) => {
        const fromFields = fields.find(f => f.name === key)?.value;
        const fromExtra = extra[key];
        return fromFields || fromExtra || `{${key}}`; // fallback to placeholder
      });
    }

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
                    <h2 className="text-xl font-semibold mb-4">Document Details: {reqID}</h2> 
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
                            
                            >
                            <option value="" disabled>Select Document Purpose</option>
                                {formValue.filter((doc:DocumentField)=> doc.type === data.type).
                                map((doc: DocumentField) => (
                                    <option key={doc.id} value={doc.title}>
                                        {doc.title}
                                    </option>
                                ))}
                        </select>
                        {formValue.some(
                          (doc: DocumentField) =>
                            doc.type === data.type &&
                            doc.title === data.purpose &&
                            doc.forResidentOnly === true
                        ) && (
                          <p className="text-red-500 ml-4">This document is for residents only.</p>
                        )}

                    </div>
                    Document Fields:
                    {data.type && data.purpose && formValue
                      .filter((doc) => doc.type === data.type && doc.title === data.purpose)
                      .flatMap((doc) =>
                        doc.fields?.map((field, index) => (
                            <div key={index} className="flex items-center w-full justify-center">
                                <input
                                  key={index}
                                  type="text"
                                  name={field.name}
                                  value={
                                    data.fields?.find((f) => f.name === field.name)?.value || ""
                                  }
                                  onChange={handleChange}
                                  className="w-1/8 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Enter ${field.name}`}
                                  required
                                />
                            </div>
                          )) || []
                          
                        )
                      
                      }

                    Image Fields:
                    {data.type && data.purpose && formValue
                      .filter((doc) => doc.type === data.type && doc.title === data.purpose)
                      .flatMap((doc) =>
                        doc.imageFields?.map((field, index) => (
                            <div key={index} className="flex items-center w-full justify-center">
                                <label htmlFor={field.name} className="w-1/8 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  {field.name}:
                                </label>
                                <input
                                  key={index}
                                  type="file"
                                  name={field.name}
                                    accept="image/*"
                                  onChange={handleChange}
                                  className="w-1/8 mt-4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                            </div>
                          )) || []
                          
                        )
                      
                      }

                    <textarea 
                      className="w-full mt-4 h-96 bg-white p-4 rounded-lg shadow-md"  
                      placeholder="Body of the new document"
                      value={
                        replacePlaceholders(
                          formValue.find(
                            (doc: DocumentField) => doc.type === data.type && doc.title === data.purpose
                          )?.body || "",
                          data.fields || [],
                            extraData
                        )
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