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
    return (
        <div className="">


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
    );

}