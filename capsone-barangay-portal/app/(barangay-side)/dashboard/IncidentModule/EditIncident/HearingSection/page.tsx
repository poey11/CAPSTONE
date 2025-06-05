"use client";
import "@/CSS/IncidentModule/HearingSection.css";
import Hearing from "@/app/(barangay-side)/components/hearingForm";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"

export default function HearingSection() {

    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>()
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const [loading , setLoading] = useState(true);

    useEffect(() => {
        if(docId){
          getSpecificDocument("IncidentReports", docId, setReportData).then(() => setLoading(false));
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
      },[reportData]);


      const handleBack = () => {
        router.back();
      };


  const [activeSection, setActiveSection] = useState("complainant");

    return (
        <main className="main-container-hearing">

            <div className="hearing-section-main-content">



            <div className="hearing-section-main-section1">
                
                <div className="hearing-section-main-section-1-left ">
                    <button onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-hearing"/> 
                    </button>

                    <h1> Edit Incident </h1>
                </div>

                <button type="submit" className="action-view-edit"> {/*onClick={handleSubmit}*/}
                        {loading ? "Saving..." : "Save"}
                </button>


            </div>

            <div className="hearing-section-header-body">

                <div className="hearing-section-body-top-section">

                    <div className="hearing-section-info-toggle-wrapper">
                    {["complainant", "respondent", "incident"  ].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "complainant" && "Complainant"}
                      {section === "respondent" && "Respondent"}
                      {section === "incident" && "Incident"}
                    </button>
                  ))}
                    </div>

                </div>


                <div className="hearing-section-header-body-bottom-section">

                    <div className="hearing-section-info-main-container">

                        <div className="hearing-section-info-container-scrollable">

                                {/*
                                {Array.from({ length: reportData.hearing }, (_, i) => (
                            <Hearing key={i}  index={i} generatedHearingSummons={reportData?.generatedHearingSummons} id={docId||""}/>
                                ))}
                                */}

                                {reportData?.hearing && Array.from({ length: reportData.hearing }, (_, i) => (
                                <Hearing
                                    key={i}
                                    index={i}
                                    generatedHearingSummons={reportData.generatedHearingSummons}
                                    id={docId || ""}
                                />
                                ))}

                        </div>

                    </div>

                    

                </div>

            </div>



            </div>
        </main>
    );

}