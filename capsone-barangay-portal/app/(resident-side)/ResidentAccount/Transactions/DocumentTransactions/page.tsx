"use client";
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "@/app/db/firebase";

interface BarangayCertificate {
    id: string;
    address?: string;
    age?: string;
    barangayIDjpg?: string[];
    birthday?: string;
    citizenship?: string;
    civilStatus?: string;
    contact?: string;
    dateOfResidency?: string;
    docType?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    requestDate?: string;
    signaturejpg?: string[];
    validIDjpg?: string[];
    endorsementLetter?: string[];
    status?: string;
}

export default function DocumentTransactionsDetails() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const referenceId = searchParams.get("id");

    const [transactionData, setTransactionData] = useState<BarangayCertificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [fileURL, setFileURL] = useState<string | null>(null);

    useEffect(() => {
        if (!referenceId) return;
    
        const fetchTransactionDetails = async () => {
          setLoading(true);
          try {
            const docRef = doc(db, "ServiceRequests", referenceId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const data = docSnap.data() as BarangayCertificate;
                setTransactionData({ ...data, id: docSnap.id });

                const storage = getStorage();
                const fileFields = ['signaturejpg', 'barangayIDjpg', 'validIDjpg', 'endorsementLetter'] as const;

                for (const field of fileFields) {
                    const fileData = data[field];
                  
                    if (typeof fileData === "string" && (fileData as string).trim() !== "") {
                      const fileName = fileData as string;
                      console.log(`Fetching file from: ServiceRequests/${fileName}`);
                      const fileRef = ref(storage, `ServiceRequests/${fileName}`);
                      const url = await getDownloadURL(fileRef);
                      setFileURL(url);
                      break;
                    }
                  
                    if (Array.isArray(fileData) && fileData.length > 0) {
                      const validFile = fileData.find((file) => typeof file === "string" && file.trim() !== "");
                      if (validFile) {
                        console.log(`Fetching file from: ServiceRequests/${validFile}`);
                        const fileRef = ref(storage, `ServiceRequests/${validFile}`);
                        const url = await getDownloadURL(fileRef);
                        setFileURL(url);
                        break;
                      }
                    }
                  }
            } else {
              console.error("No such document!");
              setTransactionData(null);
            }
          } catch (error) {
            console.error("Error fetching incident details:", error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchTransactionDetails();
      }, [referenceId]);

      const handleBack = () => {
        router.push("/ResidentAccount/Transactions");
      };
    
      if (loading) return <p>Loading...</p>;
      if (!transactionData) return <p>Document request not found.</p>;

      const barangayCertificateFields = [
        { label: "Request Date", key: "requestDate" },
        { label: "Document Type", key: "docType" },
        {
            label: "Type",
            key: "department",
            format: (value: string) => (value === "Online" ? "Online Incident" : value),
          },
        { label: "Status", key: "status" },
      ];

    return (
    <main className="incident-transaction-container">
        <div className="headerpic-specific-transactions">
            <p>TRANSACTIONS</p>
        </div>

        <div className="incident-content">
            <div className="incident-content-section-1">
                <button type="button" className="back-button" onClick={handleBack}></button>
                <p>Online Document Request Details</p>
            </div>

            {barangayCertificateFields.map((field) => (
                <div className="details-section" key={field.key}>
                    <div className="title">
                    <p>{field.label}</p>
                    </div>
                    <div className="description">
                    <p>{field.format ? field.format((transactionData as Record<string, any>)[field.key] || "N/A") : (transactionData as Record<string, any>)[field.key] || "N/A"}</p>
                    </div>
                </div>
            ))}

            {fileURL && (
                <div className="details-section">
                    <div className="title">
                    <p>Uploaded File</p>
                    </div>
                    <div className="description">
                    <a href={fileURL} target="_blank" rel="noopener noreferrer">
                        View File
                    </a>
                    <div style={{ marginTop: "0.5rem" }}>
                        <img src={fileURL} alt="Uploaded File" style={{ maxWidth: "300px", maxHeight: "300px" }} />
                    </div>
                    </div>
                </div>
            )}
        </div>

    </main>

    )
}