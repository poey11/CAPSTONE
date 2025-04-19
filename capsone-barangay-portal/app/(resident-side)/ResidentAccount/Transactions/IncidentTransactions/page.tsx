"use client";
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "@/app/db/firebase";

interface Respondent {
  respondentName?: string;
  investigationReport?: string;
  file?: string[];
}

interface IncidentReport {
  id: string;
  dateFiled?: string;
  caseNumber?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string;
  department?: string;
  concerns?: string;
  address?: string;
  status?: string;
  file?: string;
  respondent?: Respondent;
  time?: string;
}

export default function IncidentTransactionsDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceId = searchParams.get("id");

  const [transactionData, setTransactionData] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileURL, setFileURL] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceId) return;

    const fetchTransactionDetails = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "IncidentReports", referenceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as IncidentReport;
          setTransactionData({ ...data, id: docSnap.id });

          if (data.file) {
            const storage = getStorage();
            const fileRef = ref(storage, `IncidentReports/${data.file}`);
            const url = await getDownloadURL(fileRef);
            setFileURL(url);
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

  const [extendedData, setExtendedData] = useState<any>({});
  useEffect(() => {
    if(!transactionData) return;
    setExtendedData({
      ...transactionData,
      fullName: `${transactionData.firstname || ""} ${transactionData.middlename || ""} ${transactionData.lastname || ""}`,
      caseNumber: `${transactionData.caseNumber?.split(" - ")[1] || ""} - ${transactionData.caseNumber?.split(" - ")[2] || ""}`,
      dateTime: `${transactionData.dateFiled || "N/A"} ${transactionData.time || ""}`,
    });
  }, [transactionData]);

  const handleBack = () => {
    router.push("/ResidentAccount/Transactions");
  };

  if (loading) return <p>Loading...</p>;
  if (!transactionData) return <p>Incident report not found.</p>;

  const incidentFields = [
    { label: "ID", key: "caseNumber" },
    { label: "Date and Time of Incident", key: "dateTime" },
    { label: "Name", key: "fullName" },
    { label: "Location", key: "address" },
    { label: "Concern", key: "concerns" },
    { label: "Additional Information", key: "addInfo" },
  ];

  const respondentFields = [
    { label: "Respondent Name", key: "respondentName" },
    { label: "Investigation Report", key: "investigationReport" },
    {
      label: "Uploaded Investigation Files",
      key: "file",
      render: (files?: string[] | string) => {
        if (!files) return <p>No files uploaded.</p>;
        const fileArray = Array.isArray(files) ? files : [files];
        return fileArray.map((fileUrl, index) => (
          <p key={index}>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              View File {index + 1}
            </a>
          </p>
        ));
      },
    },
  ];

  return (
    <main className="incident-transaction-container">
      <div className="headerpic-specific-transactions">
        <p>TRANSACTIONS</p>
      </div>

      <div className="incident-content">
        <div className="incident-content-section-1">
          <button type="button" className="back-button" onClick={handleBack}></button>
          <p>Online Incident Report Details</p>
          <div className="status-section-view">
            <p className={`status-badge-view ${transactionData.status}`}>{transactionData.status|| "N/A"}</p> 
          </div>
        </div>

        {incidentFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{(extendedData as Record<string, any>)[field.key] || "N/A"}</p>
            </div>
          </div>
        ))}

        <div className="details-section">
          <div className="title">
            <p>Proof of Incident</p>
          </div>
          <div className="description">
            {fileURL ? (
              <div className="proof-incident-transactions">
                <img src={fileURL} alt="Proof of Incident" className="proofOfIncident-image" onError={(e) => (e.currentTarget.style.display = "none")} />
                <p>
                  <a href={fileURL} target="_blank" rel="noopener noreferrer">View Full Image</a>
                </p>
              </div>
            ) : (
              <p>No proof uploaded.</p>
            )}
          </div>
        </div>

       
      </div>

      {transactionData?.status === "Acknowledged" && (
          <div className="incident-content">
            <div className="incident-content-section-1">
              <p>Respondent Report Details</p>
            </div>
            {respondentFields.map((field) => (
              <div className="details-section" key={field.key}>
                <div className="title">
                  <p>{field.label}</p>
                </div>
                <div className="description">
                  {field.render ? field.render(transactionData?.respondent?.[field.key as keyof Respondent]) : transactionData?.respondent?.[field.key as keyof Respondent] || "N/A"}
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
