"use client"
import "@/CSS/IncidentModule/ViewIncident.css";
import { useRouter,useSearchParams  } from "next/navigation"; // Use 'next/navigation' in Next.js 13+ (App Router)
import { useEffect, useState } from "react";
import { db,storage } from "@/app/db/firebase";
import {  collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";






export default  function ViewLupon() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const docId = searchParam.get("id");
  const [reportData, setReportData] = useState<any>();
  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [LTreportImageUrl, setLTreportImageUrl] = useState<string | null>(null);
  const [LTreportData, setLTReportData] = useState<any>();

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

        const LTreportRef = collection(reportRef, "LTAssignedInfo");
        const LTreportCollectionSnapshot = await getDocs(LTreportRef);
        
        if (LTreportCollectionSnapshot.empty) {
          console.log("No matching document.");
          setLTReportData(null);
          return;
        }
        const LTdata = LTreportCollectionSnapshot.docs[0].data();
        setLTReportData(LTdata);
  
       

      } catch (error: any) {
        console.error("Error fetching report:", error.message);
      }
    };
    fetchReport();
  }, [docId]);

  useEffect(() => {
    const fetchImage = async () => {
      try{
         // 🔹 Fetch Download URL if file exists
         if (reportData?.file) {
          const filePath = reportData.file.startsWith("IncidentReports/")
            ? reportData.file
            : `IncidentReports/${reportData.file}`;
  
          const fileRef = ref(storage, filePath);
          const url = await getDownloadURL(fileRef);
          setconcernImageUrl(url);
        }
  
        if (LTreportData?.file) {
          const filePath = LTreportData.file.startsWith("IncidentReports/LTAssignedInfo/")
            ? LTreportData.file
            : `IncidentReports/LTAssignedInfo/${LTreportData.file}`;
  
          const fileRef = ref(storage, filePath);
          const url = await getDownloadURL(fileRef);
          setLTreportImageUrl(url);
        }
  
      }
      catch (error: any) {
        console.error("Error fetching image:", error.message);
      }
    }
    fetchImage();
  }, [reportData, LTreportData]);


  const status = reportData?.status; // Example status
  


  const complainantsData = reportData?.reportID != "Guest" ? {
    account: "Resident User",
    name: reportData?.firstname + " " + reportData?.lastname,
    contact: reportData?.contactNos,
  }:{
    account: "Guest User",
    name: reportData?.firstname + " " + reportData?.lastname,
    contact: reportData?.contactNos,
  };
  const respondentsData = LTreportData == null ? {
    LTUserId: "No LT Staff Assigned",
    name: "No LT Staff Assigned",
    contact: "No LT Staff Assigned",
    report: "No LT Staff Assigned",
    image: "",
  } : {
    LTUserId: LTreportData?.LTUserId,
    name: LTreportData?.Fname + " " + LTreportData?.Lname,
    contact: LTreportData?.phone,
    report: LTreportData?.report,
    image: LTreportImageUrl,
  };

 


  const otherinformation = {
    nature: reportData?.nature,
    date:  reportData?.date + " " + reportData?.time,
    location: reportData?.address,
    concern: reportData?.concerns,
    image: concernImageUrl, 
  };

  const complainantsFields = [
    { label: "Account Type", key: "account" },
    { label: "Name", key: "name" },
    { label: "Contact No", key: "contact" },
  ];

  const LtFields = [
    { label: "User ID", key: "LTUserId" },
    { label: "Name", key: "name" },
    { label: "Contact", key: "contact" },
    { label: "Report", key: "report" },
    { label: "Image", key: "image" },
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
      router.back();
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
          <p>LT Staff in Charge</p>
        </div>

        {LtFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              {field.key === "image" ? (
                respondentsData.image ? ( // ✅ Check if image exists
                  <>
                    <a href={respondentsData.image} target="_blank" rel="noopener noreferrer">
                      <img
                        src={respondentsData.image}
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
                <p>{respondentsData[field.key as keyof typeof respondentsData]}</p>
              )}
            </div>
          </div>
       ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>Incident Information</p>
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
