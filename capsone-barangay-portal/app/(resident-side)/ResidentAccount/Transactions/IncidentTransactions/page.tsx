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
  area?: string;
  addInfo?: string;
  contactNos?: string;
  
}

export default function IncidentTransactionsDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceId = searchParams.get("id");

  const [transactionData, setTransactionData] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [respondentFileURLs, setRespondentFileURLs] = useState<string[]>([]);


   const [activeSection, setActiveSection] = useState("info");

  
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



  /*
  added for respondennt image
  */
useEffect(() => {
  const fetchRespondentFiles = async () => {
    if (transactionData?.respondent?.file) {
      const storage = getStorage();
      const fileList = Array.isArray(transactionData.respondent.file)
        ? transactionData.respondent.file
        : [transactionData.respondent.file];

      try {
        const urls = await Promise.all(
          fileList.map(async (fileName) => {
            if (fileName.startsWith("http")) {
              // Already a valid URL, use it directly
              return fileName;
            }
            const fileRef = ref(storage, `IncidentReports/${fileName}`);
            return await getDownloadURL(fileRef);
          })
        );

        setRespondentFileURLs(urls);
      } catch (error) {
        console.error("Error fetching respondent file URLs:", error);
        setRespondentFileURLs([]);
      }
    }
  };

  fetchRespondentFiles();
}, [transactionData]);




  const handleBack = () => {
    router.push("/ResidentAccount/Transactions");
  };



  const incidentFields = [
    { label: "ID", key: "caseNumber" },
    { label: "Name", key: "fullName" },
    { label: "Date and Time of Incident", key: "dateTime" },
    { label: "Location", key: "address" },
    { label: "Area in Fairview", key: "area" },
    { label: "Concern", key: "concerns" },
    { label: "Additional Information", key: "addInfo" },
    { label: "Contact Number", key: "contactNos" },
  ];




  /*
updated
  */
 
  const respondentFields = [
  { label: "Respondent Name", key: "respondentName" },
  { label: "Investigation Report", key: "investigationReport" },
  {
    label: "Uploaded Investigation Files",
    key: "file",
    render: () => {
      if (respondentFileURLs.length === 0) {
        return <p style={{ color: 'red', fontWeight: 'bold' }}>No files uploaded.</p>;
      }
      return respondentFileURLs.map((url, index) => (
        <div key={index} className="proof-incident-transactions">
          <img
            src={url}
            alt={`Respondent File ${index + 1}`}
            className="proofOfIncident-image"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <p>
            <a href={url} target="_blank" rel="noopener noreferrer">
              View Full Image {index + 1}
            </a>
          </p>
        </div>
      ));
    },
  },
];

{/*}

  if (loading) return <p>Loading...</p>;
  if (!transactionData) return <p>Incident report not found.</p>;
*/}

if (loading || !transactionData) {
  return (
    <main className="incident-transaction-container">
      <div className="headerpic-specific-transactions">
        <p>TRANSACTIONS</p>
      </div>
      <div className="incident-content">
        <div className="loading-or-error-container">
          {loading ? <p className="loading-text">Loading document details...</p> : <p className="error-text">Document request not found.</p>}
        </div>
      </div>
    </main>
  );
}

  return (
    <main className="incident-transaction-container">
      <div className="headerpic-specific-transactions">
        <p>TRANSACTIONS</p>
      </div>

      <div className="incident-content">
        <div className="incident-content-section-1">
          <div className="section-1-left">
              <button type="button" className="back-button" onClick={handleBack}></button>
              <h1>Online Incident Report</h1>
          </div>
        
          <div className="status-container">
            <p className={`status-dropdown-transactions ${transactionData.status?.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
              {transactionData.status || "N/A"}
            </p> 
          </div>
        </div>

        <div className="incident-main-content">

          <div className="incident-main-content-upper">

            <nav className="incidents-transactions-info-toggle-wrapper">
              <button
                type="button"
                className={`info-toggle-btn ${activeSection === "info" ? "active" : ""}`}
                onClick={() => setActiveSection("info")}
              >
                Report Info
              </button>

              {transactionData?.status === "Settled" && (
                <button
                  type="button"
                  className={`info-toggle-btn ${activeSection === "barangay" ? "active" : ""}`}
                  onClick={() => setActiveSection("barangay")}
                >
                  Barangay Response
                </button>
              )}
            </nav>


          </div>
      
      <div className="incident-main-content-lower">


          {activeSection === "info" && (
                        <>
        <div className="incident-main-container">

          <div className="incident-container-upper">

               <div className="incident-main-left">
                {incidentFields
                  .filter((_, index) => index % 2 === 0)
                  .map((field) => (
                    <div className="details-section" key={field.key}>
                      <div className="title">
                        <p>{field.label}</p>
                      </div>
                      <div className="description">
                        <p>{(extendedData as Record<string, any>)[field.key] || "N/A"}</p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="incident-main-right">
                {incidentFields
                  .filter((_, index) => index % 2 !== 0)
                  .map((field) => (
                    <div className="details-section" key={field.key}>
                      <div className="title">
                        <p>{field.label}</p>
                      </div>
                      <div className="description">
                        <p>{(extendedData as Record<string, any>)[field.key] || "N/A"}</p>
                      </div>
                    </div>
                  ))}
              </div>
              

          </div>

          <div className="incident-container-lower">

                <div className="details-section-upload">
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
                        <p style={{ color: 'red', fontWeight: 'bold' }}>No proof uploaded.</p>

                      )}
                    </div>
                  </div>

          </div>


           

        </div>

        
                </>
                      )}

              {activeSection === "barangay" && (
                <>
                  <div className="incident-main-container-incident-response">
                    {transactionData?.status === "Settled" && (
                      <>
                        {respondentFields
                          .filter((field) => field.key !== "file")
                          .map((field) => (
                            <div className="details-section-response" key={field.key}>
                              <div className="title">
                                <p>{field.label}</p>
                              </div>
                              <div className="description">
                                {transactionData?.respondent?.[field.key as keyof Respondent] || "N/A"}
                              </div>
                            </div>
                        ))}

                        <div className="details-section-response-upload">
                          <div className="title">
                            <p>Uploaded Investigation Files</p>
                          </div>
                          <div className="description">
                            {respondentFileURLs.length === 0 ? (
                              <p style={{ color: "red", fontWeight: "bold" }}>No files uploaded.</p>
                            ) : (
                              respondentFileURLs.map((url, index) => (
                                <div key={index} className="proof-incident-transactions">
                                  <img
                                    src={url}
                                    alt={`Respondent File ${index + 1}`}
                                    className="proofOfIncident-image"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                  />
                                  <p>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                      View Full Image {index + 1}
                                    </a>
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

        
    </div>

    


   


            

        </div>

  
{/*


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

       */}
      </div>

   



{/*



      <div className="incident-content">
        <div className="incident-content-section-1">
          <button type="button" className="back-button" onClick={handleBack}></button>
          <h1>Online Incident Report</h1>
          <div className="status-container">
            <p className={`status-dropdown-transactions ${transactionData.status?.toLowerCase() || ""}`}>
              {transactionData.status || "N/A"}
            </p> 
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

        
*/}
    </main>
  );
}
