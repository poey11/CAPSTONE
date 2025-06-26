"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState,useEffect } from 'react';
import { getDownloadURL, ref } from "firebase/storage";
import {storage,db} from "@/app/db/firebase";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { getSpecificDocument } from '@/app/helpers/firestorehelper';
import "@/CSS/barangaySide/ServicesModule/ViewNewDocRequests.css";

interface dataFields {
    name?: string;
    value?: string;
}

interface imageFields{
    name?: string;
    url?: string;

}

interface  data {
    purpose?: string;
    fields?: dataFields[];
    body?: string;
    docType?: string;
    requestId?: number;
    imageFields?: imageFields[];
     createdAt?: string; 
}


export default function view() {
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<data>({}) 
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState("full");

    console.log(id);

    useEffect(() => {
        if(!id) return
        getSpecificDocument("ServiceRequests", id, setData);
        setLoading(false);   
        console.log(id);    
    }, [id]);
    

    console.log(data);

    useEffect(() => {
      if (!data?.docType || !data?.body) return; // only run when data is ready
        
      const handlePrintDocument = async () => {
        try {
          const response = await fetch('/api/dynamicPDF', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: data.docType,
              body: data.body,
            }),
          });
      
          if (!response.ok) {
            console.error("Failed to generate PDF");
            return;
          }
      
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error("Error generating or previewing PDF:", error);
        }
      };
  
      handlePrintDocument();
  
      // Optional: cleanup URL when component unmounts or data changes
      return () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      };
    }, [data]);

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
    }   


    const handdlePrintDocument = async () => {
        const response = await fetch('/api/dynamicPDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: data.docType,
                body: data.body,
            }),
        });
        if (!response.ok) {
            console.error("Failed to generate PDF");
            return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download=`${data?.docType}${`_${data?.purpose}` || ""}_certificate.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
    }

        const handleBack = () => {
        router.back();
    };

    function sortFieldsPriority(fields: dataFields[] = []): dataFields[] {
  return [...fields].sort((a, b) => {
    const getPriority = (field?: dataFields) => {
      if (!field?.name) return 3;
      const id = field.name.toLowerCase();
      if (id === "requestor") return 0;
      if (id.includes("name")) return 1;
      return 2;
    };
    return getPriority(a) - getPriority(b);
  });
}

    


    return(
        <div className="main-container-services-newdoc">
            <div className="newdoc-redirection-section">

              {/*
                ADD SEND SMS button for admins?

                add rbac para kungs sino mga dadaanan na departments before ma generate
              */}
               

                <button
                    className="newdoc-redirection-buttons"
                    onClick={handdlePrintDocument}
                    >
                 <div className="newdoc-redirection-icons">
                     <img src="/images/generatedoc.png" alt="user info" className="newdoc-redirection-icons-info" />
                 </div>
                  <h1> Generate Document</h1>
                </button>
           
            </div>       

            <div className="newdoc-main-content">

                <div className="newdoc-main-section1">

                  <div className="newdoc-main-section1-left">
                     <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                      </button>

                      <h1> {data.purpose} Request Details   </h1>
                  </div>

                </div>

                <div className= "newdoc-header-body">

                  <div className="newdoc-header-body-top-section">

                    <div className="newdoc-info-toggle-wrapper">
                            {[ "full", "others" ].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`newdoc-info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                            
                                {section === "full" && "Full Information"}
                                {section === "others" && "Other Information"}
                                </button>
                            ))}
                        </div> 

                    </div>

                    <div className="newdoc-header-body-bottom-section">
                      <div className= "newdoc-main-details-container">
                        <div className= "newdoc-main-details-section">
                          <div className="newdoc-main-details-topsection">
                              <h1>{data.requestId}</h1>
                          </div>

                          <div className="newdoc-main-details-statussection">
                            <h1> Status </h1>

                            <div className= "newdoc-main-details-status-section-view">

                              {/*
                                Add functionality for status (added na css)
                              */}
                              <select
                                id = "status"
                                className=""
                              >
                                 <option value="Pending">Pending</option>
                                  <option value="Pick-up">Pick-up</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Rejected" disabled>Rejected</option>
                              </select>

                            </div>

                          </div>

                          <div className= "newdoc-main-details-description">
                              <div className= "newdoc-purpose-section">
                                  <div className= "newdoc-purpose-topsection">
                                    
                                  <div className= "newdoc-main-details-icon-section">
                                    <img src="/Images/purpose.png" alt="description icon" className="newdoc-type-section-icon" />
                                  </div>
                                  
                                  <div className= "newdoc-main-details-title-section">
                                    <h1> Document Type</h1>
                                  </div>
                                    
                                  </div>

                                  <p>{data.docType}</p>

                              </div>

                              <div className= "newdoc-purpose-section">
                                  <div className= "newdoc-purpose-topsection">
                                    
                                  <div className= "newdoc-main-details-icon-section">
                                    <img src="/Images/purpose.png" alt="description icon" className="newdoc-type-section-icon" />
                                  </div>
                                  
                                  <div className= "newdoc-main-details-title-section">
                                    <h1>Purpose</h1>
                                  </div>
                                    
                                  </div>

                                  <p>{data.purpose}</p>

                              </div>

                              <div className= "newdoc-date-section">
                                <div className= "newdoc-date-topsection">
                                  <div className= "newdoc-main-details-icon-section">
                                     <img src="/Images/calendar.png" alt="calendar icon" className="newdoc-calendar-section-icon" />
                                  </div>

                                  <div className= "newdoc-main-details-title-section">
                                    <h1>Date Requested</h1>
                                  </div>

                                </div>

                                  <p>{data.createdAt}</p>

                              </div>


                          </div>     


                        </div>

                      </div>


                      <div className= "newdoc-info-main-container">
                          
                          <div className= "newdoc-info-container-scrollable">
                  {activeSection === "full" && (
                        <>
                    <div className="newdoc-info-main-content">
                      <div className="newdoc-content-left-side">
                        {sortFieldsPriority(data.fields)?.map((field, index) => {
                          if (index % 2 === 0) {
                            return (
                              <div key={index} className="newdoc-fields-section">
                                <p>{field.name}</p>
                                <input
                                  type="text"
                                  className="newdoc-input-field"
                                  value={field.value}
                                  readOnly
                                />
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <div className="newdoc-content-right-side">
                        {sortFieldsPriority(data.fields)?.map((field, index) => {
                          if (index % 2 !== 0) {
                            return (
                              <div key={index} className="newdoc-fields-section">
                                <p>{field.name}</p>
                                <input
                                  type="text"
                                  className="newdoc-input-field"
                                  value={field.value}
                                  readOnly
                                />
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                              
                          </>
                        )}


                       {activeSection === "others" && (
                        <>
                          <div className="newdoc-info-main-content">
                            {data.imageFields?.map((img, index) => (
                              <div key={index} className="newdoc-verification-requirements-section">
                                <span className="newdoc-verification-requirements-label">
                                  {img.name}
                                </span>

                                <div className="newdoc-verification-requirements-container flex justify-center items-center">
                                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="uploaded-picture"
                                    />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>


                             {/* Render the PDF preview if available */}

                             
                    {pdfUrl && (
                      <div className="newdoc-verification-requirements-section">
                        <span className="newdoc-verification-requirements-label">
                          Generated PDF
                        </span>

                        <div className="newdoc-verification-requirements-container">
                          <iframe
                            src={pdfUrl}
                            width="100%"
                            height="100%"
                            className="border-none w-full h-full"
                            title="Generated PDF"
                          />
                        </div>
                      </div>
                    )}
                        </>
                      )}

                    

                            
                          </div>
                          

                      </div>

                    </div>
                        
                </div>

            </div>



    {/*

    OLD CODE
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Document Type: {data.docType}</h2>
                <p className="mb-2"><strong>Purpose:</strong> {data.purpose}</p>
                <p className="mb-4"><strong>Body:</strong> {data.body}</p>
                <h3 className="text-lg font-semibold mb-2">Document Fields:</h3>
                <ul className="list-disc pl-5">
                    {data.fields?.map((field, index) => (
                        <li key={index} className="mb-1">
                            <strong>{field.name}:</strong> {field.value}
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold mb-2">Images Fields:</h3>
                <ul className="list-disc pl-5">
                    {data.imageFields?.map((img, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <p className="mb-2 text-sm font-medium">{img.name}</p>
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-40 h-40 object-cover border rounded shadow-md"
                        />
                      </div>
                    ))}
                </ul>
            </div>

           
            {pdfUrl && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Generated PDF:</h3>
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="1150px"
                        className="border border-gray-300 rounded-lg"
                        title="Generated PDF"
                        
                    />
                </div>
                )}

                 */}
        </div>
    )

}