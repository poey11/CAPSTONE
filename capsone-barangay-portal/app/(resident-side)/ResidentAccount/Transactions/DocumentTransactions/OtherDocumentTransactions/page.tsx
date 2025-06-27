"use client";


import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";


interface fieldsProps {
  name?: string;
  value?: string; // or `file?: File` if used before uploading
}

interface ServiceRequest {
  accID?: string;
  createdAt?: string; // or `Date` if you're storing actual Date objects
  docType?: string;
  fields?: fieldsProps[];
  imageFields?: fieldsProps[];
  purpose?: string;
  requestId?: string;
  requestor?: string;
  status?: string; // you can also make this: "Pending" | "Completed" | "Rejected" | etc.
  type?: string; // could be enum-like: "OtherDocument" | ...
}


export default function OtherDocumentTransactions() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");
    const [documentData, setDocumentData] = useState<ServiceRequest>({});

    useEffect(() =>{    
        const fetchDocumentData = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "ServiceRequests", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setDocumentData({
                        ...data,
                    });
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error fetching document data:", error);
            }
        };

        fetchDocumentData();

    },[])
    console.log(documentData);

    return (
        <div className="flex flex-col items-center bg-[#f9f9f9] z-10 ml-8 p-[30px]">
            <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
                <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => router.back()}
                >Back</button>
                <h1 className="text-2xl font-bold mb-4">Document Details</h1>
                {documentData ? (
                    <div>
                        <p><strong>Date Requested:</strong> {documentData.createdAt}</p>
                        <p><strong>Document ID:</strong> {documentData.requestId}</p>
                        <p><strong>Status:</strong> {documentData.status}</p>
                        <p><strong>Type:</strong> {documentData.docType}</p>
                        <p><strong>Purpose:</strong> {documentData.purpose}</p>
                        <h2 className="text-xl font-semibold mt-4">Fields</h2>
                        <ul className="list-disc pl-5">
                            {documentData.fields?.map((field, index) => (
                                <li key={index}>
                                    <strong>{field.name}:</strong> {field.value}
                                </li>
                            ))}
                        </ul>
                        <h2 className="text-xl font-semibold mt-4">Image Fields</h2>
                        <ul className="list-disc pl-5">
                            {documentData.imageFields?.map((field, index) => (
                                <li key={index}>
                                    <strong>{field.name}:</strong> 
                                    {field.value ? (
                                        <img
                                            src={field.value}
                                            alt={field.name}
                                            className="w-32 h-32 object-cover mt-2"
                                        />                                            
                                    ) : "No image available"}
                                </li>
                            ))}
                        </ul>
                    </div>

                ) : (
                    <p>Loading document details...</p>
                )}
            </div>        
        </div>

    )
}