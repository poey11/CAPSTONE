"use client";
import React from "react";
import { useAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, onSnapshot,addDoc, doc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import { customAlphabet } from "nanoid";


interface documentFieldsProps{
    name?: string;
    value?: string;
}
interface imageFieldsProps{
    name?: string;
    value?: File | null; // Changed to File or null for image uploads
}

interface otherDocumentProps{
    id?: string;
    requestId?: string;
    forResidentOnly?: boolean;
    title?: string;
    type?: string;
    fields?: documentFieldsProps[];
    imageFields?: documentFieldsProps[];
    body?: string;
}

interface documentProps {
    requestId?: string;
    docType?: string;
    purpose?: string;
    fields?: documentFieldsProps[];
    imageFields?: imageFieldsProps[];
}

export default function OtherDocuments() {
    const user = useAuth().user;
    const router = useRouter();
    const isGuest = !user;
    const [otherDoc, setOtherDoc] = useState<otherDocumentProps[]>([]);
    const [doc, setDoc] = useState<documentProps>({});
    const [number, setNumber] = useState(0);

    useEffect(() => {
        if (!user) {
            const fetchCount = async () => {
                try {
                  const count = await getSpecificCountofCollection("ServiceRequests", "accID", "Guest");
                  setNumber(count || 1);
                } catch (error) {
                  console.error("Error fetching count:", error);
                }
            }   
            fetchCount();
            return;
        }
        else{
            const fetchCount = async () => {
                try {
                  const count = await getSpecificCountofCollection("ServiceRequests", "accID", user?.uid);
                  setNumber(count || 1);
                } catch (error) {
                  console.error("Error fetching count:", error);
                }
            }
            fetchCount();
            return;
        }

    },[ user]);




    
    useEffect(() => {
      const getServiceRequestId =  () => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomId = customAlphabet(alphabet, 6);
        const requestId = randomId();
        const count = String(number+1).padStart(4, '0'); // Ensure 3 digits
        let format = `${user?.uid.substring(0,6).toUpperCase()|| "GUEST"} - ${requestId} - ${count}`;
        setDoc((prev: any) => ({
          ...prev,
          requestId: format,
        }));
        console.log("format", format);
      }
      getServiceRequestId();

    }, [user,number]);
    
    
    useEffect(() => {
        const collectionRef = collection(db, "OtherDocuments");

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const documents: otherDocumentProps[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as otherDocumentProps[];

            setOtherDoc(documents);
            console.log("Fetched documents:", documents);
        });

        return () => unsubscribe();

    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLSelectElement>) => {
        const { name, value,files,type } = e.target as HTMLInputElement ;
        if(name === "docType"){
            setDoc((prevDoc) => ({
                ...prevDoc,
                docType: value,
                purpose: "", // Reset purpose when type changes
                fields:[],
                imageFields:[],
            }));
            return;
        }
        if(name === "purpose"){
            setDoc((prevDoc) => ({
                ...prevDoc,
                purpose: value, // Reset purpose when type changes
                fields:[],
                imageFields:[],
            }));
            return;
        }
        if(type === "file" && files && files.length > 0) {
            const file = files[0];
            setDoc((prevDoc) => {
                const existingImageFields = prevDoc.imageFields ? [...prevDoc.imageFields] : [];
                const imageFieldIndex = existingImageFields.findIndex((f) => f.name === name);
                if (imageFieldIndex > -1) {
                    existingImageFields[imageFieldIndex].value = file;
                }
                else {
                    existingImageFields.push({ name, value: file });
                }
                return{
                    ...prevDoc,
                    imageFields: existingImageFields,
                }
            });
            return;
        }
        else{
            setDoc((prevDoc) => {
                const existingField = prevDoc.fields ? [...prevDoc.fields] : [];
                const fieldIndex = existingField.findIndex((f) => f.name === name);
                if (fieldIndex > -1) {
                    existingField[fieldIndex].value = value;
                }
                else {
                    existingField.push({ name, value });
                }
                return{
                    ...prevDoc,
                    fields: existingField,
                }
            });
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Submitting document:", doc);

        const requestorField = doc.fields?.find((field) => field.name === "requestor");
        const body = otherDoc.find(
          (prop) => prop.type === doc.docType && prop.title === doc.purpose
        )?.body || "";

        const uploadImageUrls = await Promise.all(
            (doc.imageFields || []).map(async (imageField) => {
                if (imageField.value instanceof File) {
                    const storageRef = ref(storage, `ServiceRequests/${doc.requestId}/${imageField.name}`);
                    await uploadBytes(storageRef, imageField.value);
                    const downloadURL = await getDownloadURL(storageRef);
                    return { name: imageField.name, value: downloadURL };
                }
                return { name: imageField.name, value: null };
            })
        );


        const validImage = uploadImageUrls.filter((image) => image.value !== null);

        const docData = {
            ...doc,
            accID: user?.uid || "Guest",
            requestor: requestorField ? requestorField.value : user?.displayName || "Guest",
            fields: doc.fields || [],
            imageFields: validImage,
            requestId: doc.requestId || "",
            status: "Pending",
            statusPriority: 1, // Assuming 1 is the highest priority
            purpose: doc.purpose || "",
            createdAt: new Date().toLocaleString(),
            type: "OtherDocument",
            body: body
        };

        const docRef = await addDoc(collection(db, "ServiceRequests"), docData);
        console.log("Document written with ID: ", docRef.id);
        router.push(`/services`);
        console.log("docData", docData);
    }
    
    return(
        <div className="flex flex-col items-center bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="flex flex-row justify-between items-center w-full align-center mb-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors" onClick={() => router.back()}>
                    Back
                </button>
                <h1 className="text-2xl font-bold">Other Documents</h1>
                <p className="text-gray-500">Request other documents from the barangay</p>
            </div>
                <div className="flex col items-center mt-4">
                    <label htmlFor='docType' className="text-gray-700">Document Type:</label>
                    <select    
                        className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange}
                        name="docType"
                        value={doc.docType || ""}
                        id="docType"
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
                        value={doc.purpose || ""}
                        id="purpose"

                        >
                        <option value="" disabled>Select Document Purpose</option>
                            {otherDoc.filter((prop:otherDocumentProps)=> prop.type === doc.docType).
                            map((prop: otherDocumentProps) => (
                                <option   disabled={prop.forResidentOnly && isGuest}  key={prop.id} value={prop.title}>
                                    {prop.title} {prop.forResidentOnly ? "(Residents Only)" : ""}
                                </option>
                            ))}
                    </select>
                </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center">
                Document Fields:
                {doc.docType && doc.purpose && otherDoc.
                filter((prop)=> prop.type === doc.docType && prop.title === doc.purpose)
                .flatMap((prop)=> prop.fields?.map((field,index)=>(
                    <div key={index} className="flex items-center mt-2">
                        <label htmlFor={`field-${index}`} className="text-gray-700">{field.name}:</label>
                        <input
                            type="text"
                            id={`field-${index}`}
                            name={field.name}
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            value={
                                    doc.fields?.find((f) => f.name === field.name)?.value || ""
                            }
                            placeholder={`Enter ${field.name} Value`}
                            onChange={handleChange}
                        />
                    </div> 
                ))||[])}

                Image Fields:
                {doc.docType && doc.purpose && otherDoc.
                filter((prop)=> prop.type === doc.docType && prop.title === doc.purpose)
                .flatMap((prop)=> prop.imageFields?.map((field,index)=>(
                    <div key={index} className="flex items-center mt-2">
                        <label htmlFor={`field-${index}`} className="text-gray-700">{field.name}:</label>
                        <input
                            key={index}
                            type="file"
                            id={`field-${index}`}
                            name={field.name}
                            accept="image/*"
                            onChange={handleChange}
                            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div> 
                ))||[])}

                <button
                    type="submit"
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Submit
                </button>
            </form>
        </div>
    )
}