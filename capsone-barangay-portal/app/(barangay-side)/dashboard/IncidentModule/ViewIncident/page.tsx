"use client"
import "@/CSS/IncidentModule/ViewIncident.css";
import { useRouter,useSearchParams  } from "next/navigation"; // Use 'next/navigation' in Next.js 13+ (App Router)
import {  useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "@/app/helpers/firestorehelper";

export default  function ViewLupon() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const docId = searchParam.get("id");
  const [reportData, setReportData] = useState<any>();
  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [investgatedImageUrl, setInvestigatedImageUrl] = useState<string | null>(null);
 
  

  useEffect(() => {
    if(docId){
      getSpecificDocument("IncidentReports", docId, setReportData);
    }
    else{
      console.log("No document ID provided.");
      setReportData(null);
    }
  }, [docId]);

  useEffect(() => {
    if(reportData?.file){
      generateDownloadLink(reportData?.file, "IncidentReports").then(url => {
        if (url) setconcernImageUrl(url);
      });
    }
    if(reportData?.investigator?.investigatedFile){
      generateDownloadLink(reportData?.investigator.investigatedFile, "IncidentReports/Investigator").then(url => {
        if (url) setInvestigatedImageUrl(url);
      });
    }
  },[reportData]);


  const status = reportData?.status; // Example status
 
  const complainantsData  ={
    name: reportData?.complainant.fname + " " + reportData?.complainant.lname,
    contact: reportData?.complainant.contact,
    address:reportData?.complainant.address,
    civilStatus: reportData?.complainant.civilStatus,
    sex: reportData?.complainant.sex,
    age: reportData?.complainant.age,
  }

  const respondent =  {
    name: reportData?.respondent.fname + " " + reportData?.respondent.lname,
    contact: reportData?.respondent.contact,
    address:reportData?.respondent.address,
    civilStatus: reportData?.respondent.civilStatus,
    sex: reportData?.respondent.sex,
    age: reportData?.respondent.age,
  }


  const deskOfficerData =  {
    name: reportData?.receivedBy,
    dateTimeReceived:  reportData?.dateReceived + " " + reportData?.timeReceived,
  };

  const otherinformation = {
    nature: reportData?.nature,
    date:  reportData?.dateFiled + " " + reportData?.timeFiled,
    location: reportData?.location,
    concern: reportData?.concern,
    image: concernImageUrl, 
  };

  const investigateData = !reportData?.investigator || reportData?.investigator === "" ? { 
    name: "No Investigator Assigned",
    dateTimeInvestigated: "Not Yet Investigated",
    report: "No Report Available",
    image: "No Image Available"
  } : {
    name: reportData.investigator?.fullname || "No Name Provided",
    report: reportData.investigator?.investigationReport || "No Report Available",
    dateTimeInvestigated: reportData.investigator?.dateInvestigated && reportData.investigator?.timeInvestigated
      ? `${reportData.investigator.dateInvestigated} ${reportData.investigator.timeInvestigated}`
      : "Not Yet Investigated",
    image: investgatedImageUrl || "No Image Available"
  };
  

  const complainantsFields = [
    {label: "Name", key: "name" },
    {label: "Civil Status", key: "civilStatus"},
    {label: "Age", key: "age"},
    {label: "Sex", key: "sex"},
    {label: "Address", key: "address"},
    {label: "Contact No", key: "contact" }
  ];
  const respondentsField = [
    { label: "Name", key: "name" },
    {label: "Civil Status", key: "civilStatus"},
    {label:"Age", key: "age"},
    {label:"Sex", key: "sex"},
    {label: "Address", key: "address"},
    { label: "Contact No", key: "contact" }
  ];
  const deskOfficerFields = [
    { label: "Name", key: "name" },
    { label: "Date & Time Signed", key: "dateTimeReceived" },
    
  ];

  const investigatorFields = [
    { label: "Name", key: "name" },
    { label: "Date & Time Investigated", key: "dateTimeInvestigated" },
    { label: "Investigation Report", key: "report" },
    { label: "Investigated Image", key: "image" },
    
  ];

  const otherinformationFields = [
    { label: "Nature", key: "nature" },
    { label: "Date & Time", key: "date" },
    { label: "Location", key: "location" },
    { label: "Nature of Facts", key: "concern" },
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
          <p>Respondent's Details</p>
        </div>

        {respondentsField.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{respondent[field.key as keyof typeof respondent]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>Barangay Desk Officer's Details</p>
        </div>

        {deskOfficerFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{deskOfficerData[field.key as keyof typeof deskOfficerData]}</p>
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
                        style={{ cursor: "pointer" , width: '30%', height: '100%', marginRight: '5px' }}
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

      <div className="main-content">
        <div className="section-1">
          <p>Investigator's Details</p>
        </div>

        {investigatorFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{investigateData[field.key as keyof typeof investigateData]}</p>
            </div>
          </div>
       ))}
      </div>
        

    </main>
  );
}
