"use client"
import "@/CSS/IncidentModule/ViewIncident.css";
import { useRouter,useSearchParams  } from "next/navigation"; // Use 'next/navigation' in Next.js 13+ (App Router)
import { useEffect, useState } from "react";
import { db,storage } from "@/app/db/firebase";
import {  doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";


interface reportProps {
  firstname: string;
  lastname: string;
  contactNos: string;
  concerns: string;
  date: string;
  time: string;
  address: string;
  file: File | null;
  reportID: string;
  department: string;
  status: string;
  id: string;
}




export default  function ViewLupon() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const docId = searchParam.get("id");
  const [reportData, setReportData] = useState<any>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);


  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!docId) {
          console.log("No document ID provided.");
          setReportData(null);
          return;
        }
  
        // Fetch Firestore document
        const reportRef = doc(db, "IncidentReports", docId);
        const reportSnapshot = await getDoc(reportRef);
  
        if (!reportSnapshot.exists()) {
          console.log("No matching document.");
          setReportData(null);
          return;
        }
  
        const data = reportSnapshot.data();
        setReportData(data);
  
        // 🔹 Fetch Download URL if file exists
        if (data?.file) {
          const filePath = data.file.startsWith("IncidentReports/")
            ? data.file
            : `IncidentReports/${data.file}`;
  
          const fileRef = ref(storage, filePath);
          const url = await getDownloadURL(fileRef);
          setDownloadUrl(url);
        }
      } catch (error: any) {
        console.error("Error fetching report:", error.message);
      }
    };
  
    fetchReport();
  }, []);

  const status = reportData?.status; // Example status
  
  let accountType = "Guest User";
  if(reportData?.reportID != "Guest"){
    accountType = "Resident User";
  }

  const complainantsData = {
    account: accountType,
    name: reportData?.firstname + " " + reportData?.lastname,
    contact: reportData?.contactNos,
  };

  const respondentsData = {
    /* which lupon officer who handled this case, will follow up on this after doing edit page*/
    name: "Jonnell Quebal",
    sex: "Male",
    age: 33,
    civilStatus: "Single",
    contact: "09171218101",
  };


  const otherinformation = {
    nature: reportData?.nature,
    date:  reportData?.date + " " + reportData?.time,
    location: reportData?.address,
    concern: reportData?.concerns,
    image: downloadUrl, 
  };

  const complainantsFields = [
    { label: "Account Type", key: "account" },
    { label: "Name", key: "name" },
    { label: "Contact No", key: "contact" },
  ];

  const respondentsFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Contact", key: "contact" },
  ];

  const otherinformationFields = [
    { label: "Nature", key: "nature" },
    { label: "Date & Time", key: "date" },
    { label: "Location", key: "location" },
    { label: "Concern", key: "concern" },
    { label: "Image", key: "image" },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "Resolved":
        return "resolved";
      case "Settled":
        return "settled";
      case "Archived":
        return "archived";
      default:
        return "";
    }
  };


    const handleViewLupon = () => {
      router.push("/dashboard/IncidentModule/Lupon");
    };

  return (
    <main className="main-container">

          <div className="status-section">
          <p className={`status-badge ${getStatusClass(status)}`}>{status}</p> 
          </div>

     
      <div className="main-content">
        <div className="section-1">
    
            <button type="submit" className="back-button" onClick={handleViewLupon}></button>
  
          <p>Complainant's Details</p>
        </div>

        {complainantsFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{complainantsData[field.key as keyof typeof complainantsData]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>LF Staff in Charge</p>
        </div>

        {respondentsFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{respondentsData[field.key as keyof typeof respondentsData]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>Other's Information</p>
        </div>

        {otherinformationFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              {field.key === "image" ? (
                otherinformation.image ? ( // ✅ Check if image exists
                  <>
                    <a href={otherinformation.image} target="_blank" rel="noopener noreferrer">
                      <img
                        src={otherinformation.image}
                        alt="Incident Image"
                        style={{ cursor: "pointer" }}
                      />
                    </a>
                  </>
                ) : (
                  // ✅ Show fallback text when no image is available
                  <p style={{ color: "gray", fontStyle: "italic" }}>No image available</p>
                )
              ) : (
                <p>{otherinformation[field.key as keyof typeof otherinformation]}</p>
              )}
            </div>
          </div>
       ))}
      </div>

        

    </main>
  );
}
