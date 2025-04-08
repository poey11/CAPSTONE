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
    const [fileURLs, setFileURLs] = useState<{ field: string; url: string }[]>([]);

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

                const urls: { field: string; url: string }[] = [];

                for (const field of fileFields) {
                    const fileData = data[field as keyof BarangayCertificate];

                    // Handle string (single file)
                    if (typeof fileData === "string" && fileData.trim() !== "") {
                        const fileRef = ref(storage, `ServiceRequests/${fileData}`);
                        const url = await getDownloadURL(fileRef);
                        urls.push({ field, url });
                    }

                    // Handle array of files
                    if (Array.isArray(fileData)) {
                        for (const file of fileData as string[]) {
                            if (typeof file === "string" && file.trim() !== "") {
                                const fileRef = ref(storage, `ServiceRequests/${file}`);
                                const url = await getDownloadURL(fileRef);
                                urls.push({ field, url });
                            }
                        }
                    }
                }

                // Update the fileURLs state after fetching all URLs
                setFileURLs(urls);
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

            <div className="details-section">
                <div className="title">
                    <p>Signature</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "signaturejpg").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "signaturejpg").map(({ url }, index) => (
                                <div key={index} style={{ marginBottom: "1rem" }}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        View File
                                    </a>
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <img src={url} alt="Signature - Uploaded File" style={{ maxWidth: "300px", maxHeight: "300px" }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>

            <div className="details-section">
                <div className="title">
                    <p>Barangay ID</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "barangayIDjpg").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "barangayIDjpg").map(({ url }, index) => (
                                <div key={index} style={{ marginBottom: "1rem" }}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        View File
                                    </a>
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <img src={url} alt="Barangay ID - Uploaded File" style={{ maxWidth: "300px", maxHeight: "300px" }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>

            <div className="details-section">
                <div className="title">
                    <p>Valid ID</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "validIDjpg").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "validIDjpg").map(({ url }, index) => (
                                <div key={index} style={{ marginBottom: "1rem" }}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        View File
                                    </a>
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <img src={url} alt="Valid ID - Uploaded File" style={{ maxWidth: "300px", maxHeight: "300px" }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>

            <div className="details-section">
                <div className="title">
                    <p>Endorsement Letter</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "endorsementLetter").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "endorsementLetter").map(({ url }, index) => (
                                <div key={index} style={{ marginBottom: "1rem" }}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        View File
                                    </a>
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <img src={url} alt="Endorsement Letter - Uploaded File" style={{ maxWidth: "300px", maxHeight: "300px" }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>

        </div>
    </main>

    )
}