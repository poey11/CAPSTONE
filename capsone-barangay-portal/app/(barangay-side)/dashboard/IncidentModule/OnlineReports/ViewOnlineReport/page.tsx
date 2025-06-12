"use client";
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/app/db/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";

const statusOptions = ["Acknowledged", "Pending"];

export default function ViewOnlineReports() {
  const [formData, setFormData] = useState({
    id: "",
    firstname: "",
    lastname: "",
    contactNos: "",
    area: "",
    address: "",
    dateFiled: "",
    addInfo: "",
    concerns: "",
    status: "",
    file: "",
    reportID: "",
    caseNumber: "",
    time: "",
  });
  
  

  const [respondent, setRespondent] = useState<{
    respondentName: string;
    investigationReport: string;
    file: string[]; 
  }>({
    respondentName: "",
    investigationReport: "",
    file: [],  // Default to an empty array
  });

  const [initialRespondent, setInitialRespondent] = useState(respondent);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);





  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<{ file: File; name: string; preview: string | undefined }[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const incidentId = searchParams.get("id");

  useEffect(() => {
    if (incidentId) {
      fetchIncidentData(incidentId);
    }
  }, [incidentId]);

  

  const fetchIncidentData = async (id: string) => {
    try {
      const docRef = doc(db, "IncidentReports", id);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
  
        // Set form data
        setFormData({
          id,
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          contactNos: data.contactNos || "",
          area: data.area || "",
          address: data.address || "",
          dateFiled: data.dateFiled || "",
          addInfo:data.addInfo || "",
          concerns: data.concerns || "",
          status: data.status || "",
          file: data.file || "",
          reportID: data.reportID || "",
          caseNumber: data.caseNumber || "",
          time: data.time || "",
        });
  
        // ✅ Fetch respondent details and files as an array
        if (data.respondent) {
          const initialData = {
            respondentName: data.respondent.respondentName || "",
            investigationReport: data.respondent.investigationReport || "",
            file: Array.isArray(data.respondent.file) ? data.respondent.file : data.respondent.file ? [data.respondent.file] : [],
          };
          setRespondent(initialData);
          setInitialRespondent(initialData);
        }
  
        // ✅ Fetch the incident proof photo (if available)
        if (data.file) {
          const storage = getStorage();
          const fileRef = ref(storage, `IncidentReports/${data.file}`);
          const url = await getDownloadURL(fileRef);
          setImageUrl(url);
        }
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching incident data:", error);
    }
  };
  
  
  const hasRespondentChanged = () => {
    return (
      initialRespondent.respondentName !== respondent.respondentName ||
      initialRespondent.investigationReport !== respondent.investigationReport ||
      JSON.stringify(initialRespondent.file) !== JSON.stringify(respondent.file)
    );
  };
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    if (name === "respondentName" || name === "investigationReport") {
      setRespondent((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  
  
  

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const storage = getStorage();
      const uploadedFiles = await Promise.all(
        Array.from(selectedFiles).map(async (file) => {
          const fileRef = ref(storage, `IncidentReports/Respondents/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return { file, name: file.name, preview: url }; // ✅ Include `file` in object
        })
      );
      setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
    }
  };
  
  

  const handleFileDelete = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };



    const [activeSection, setActiveSection] = useState("complainant");




const handleSubmitClick = async () => {
  const { respondentName, investigationReport, file } = respondent;

  const invalidFields: string[] = [];

  if (!respondentName.trim()) invalidFields.push("respondentName");
  if (!investigationReport.trim()) invalidFields.push("investigationReport");
 // if (!file || file.length === 0) invalidFields.push("file");

  if (invalidFields.length > 0) {
    setInvalidFields(invalidFields); // highlight invalid fields
    setPopupErrorMessage("Please fill up all required fields.");
    setShowErrorPopup(true);

    setTimeout(() => {
      setShowErrorPopup(false);
    }, 3000);

    return;
  }

    setFormData((prevData) => ({
    ...prevData,
    status: "Acknowledged",
  }));


  // Clear previous errors
  setInvalidFields([]);
  setShowConfirmation(true);
};


    
  
  const confirmSubmit = async () => {
  setShowConfirmation(false);

 // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

    
    if (!docId) {
      setPopupErrorMessage("Failed to save record.");
      setShowErrorPopup(true);
      return;
    }
    
    setPopupMessage("Online Report Submitted Succesfuly!!");
    setShowPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/IncidentModule/OnlineReports`);
    }, 3000);

};

const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null = null): Promise<string | undefined> => {
  if (e) e.preventDefault();

  if (!formData.id) {
    alert("Error: Missing incident ID.");
    return;
  }

  try {
    const incidentRef = doc(db, "IncidentReports", formData.id);
    const storage = getStorage();

    const uploadedFileUrls = await Promise.all(
      files.map(async ({ file }) => {
        const fileRef = ref(storage, `IncidentReports/Respondents/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      })
    );

    await updateDoc(incidentRef, {
      status: formData.status,
      respondent: {
        respondentName: respondent.respondentName,
        investigationReport: respondent.investigationReport,
        file: uploadedFileUrls,
      },
    });

    const notificationRef = doc(collection(db, "Notifications"));
    await setDoc(notificationRef, {
      residentID: formData.reportID,
      incidentID: formData.id,
      message: `Your incident report (${formData.caseNumber}) has been updated to "${formData.status}".`,
      timestamp: new Date(),
      transactionType: "Online Incident",
      isRead: false,
    });

    if (hasRespondentChanged()) {
      const respondentNotificationRef = doc(collection(db, "Notifications"));
      await setDoc(respondentNotificationRef, {
        residentID: formData.reportID,
        incidentID: formData.id,
        message: `Respondent information for your incident report (${formData.caseNumber}) has been updated.`,
        timestamp: new Date(),
        transactionType: "Online Incident",
        isRead: false,
      });
    }

  //  alert("Incident status and respondent info updated!");
   // router.push("/dashboard/IncidentModule/OnlineReports");

    return formData.id; // ✅ Return document ID
  } catch (error) {
    console.error("Error during submission:", error);
    alert("Failed to update incident.");
    return; // Return undefined on error
  }
};



  return (
    <main className="main-container-view-report">

        {showConfirmation && (
            <div className="confirmation-popup-overlay-online-reports">
                             <div className="confirmation-popup-online-reports">
                                 <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup-online-reports" />          
                            <p>Are you sure you want to submit?</p>
                                   <div className="yesno-container-add">
                                 <button onClick={() => setShowConfirmation(false)} className="no-button-add">No</button>
                                     <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                               </div> 
                            </div>
                  </div>
          )}


{/*
NOTE: SAME YUNG 2ND DIV NG ERROR AT SHOWPOPUP LANH
*/}
          {showErrorPopup && (
                <div className={`error-popup-overlay-online-report show`}>
                    <div className="popup-online-report">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}

            {showPopup && (
                <div className={`popup-overlay-online-report show`}>
                    <div className="popup-online-report">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}



      {/*}
        <div className="letters-content-edit">
                      
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={`status-badge-view ${formData.status.toLowerCase()}`}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>


        
          </div>
*/}

      <div className="main-content-view-online-report">
        <div className="section-1-online-report">
         
            <div className="section-1-online-report-left-side">
              <button type="button" onClick={() => router.back()}>
                 <img src="/images/left-arrow.png" alt="Left Arrow" className="back-button-reports"/>
              </button>
              <h1>Online Report Details</h1>
            </div>

            <div className="action-btn-section-online-report">
                <button className="action-online-report" onClick={handleSubmitClick} >Save</button>                                                 
            </div>
        </div>

          <div className="section-1-reports-title">
            <input 
                            type="text" 
                            className="search-bar-reports-case" 
                            value= {formData.caseNumber}
                            name="caseNumber"
                            id="caseNumber"
                            disabled
                            
                      />
          
        </div>

        <div className="online-report-incident-bottom-section">

              <nav className="online-report-info-toggle-wrapper">
                {["complainant", "incident", "action"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn-online-report ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "complainant" && "Basic Info"}
                      {section === "incident" && "Incident Info"}
                       {section === "action" && "Action Details*"}
                 
                    </button>
                  ))}
                </nav>

              <div className="online-report-bottom-section-scroll">

                  <div className="online-report-section-2">


                {activeSection === "complainant" && (
                <>

                    <div className="online-report-full-top">

                          <div className="online-report-section-left-side">

                              <div className="fields-section-online">
                                <p>First Name</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.firstname}  
                                  disabled          
                                 />
                              </div>

                              
                              <div className="fields-section-online">
                                <p>Contact Number</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.contactNos}  
                                  disabled          
                                 />
                              </div>

                             

                          </div>

                          
                          <div className="online-report-section-right-side">

                               <div className="fields-section-online">
                                <p>Last Name</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.lastname}  
                                  disabled          
                                 />
                              </div>

                                 <div className="fields-section-online">
                                <p>Status</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.status}  
                                  disabled          
                                 />
                              </div>

                              


                          </div>


                    </div>

                    <div className="online-report-section-bottom-side-2">

                        <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">
                                  Summary of Concern
                                </div>

                                <div className="box-container-investigation-report">
                                   <textarea   
                                     className= "investigation-report-input-field"
                                    value={formData.addInfo} 
                                     disabled    
                                    />
                                     
                                </div>

                              </div>
                            </div>                        

                    </div>

                

                    </>
                      )}


                   {activeSection === "incident" && (
                    <>

                      <div className="online-report-full-top">

                         <div className="online-report-section-left-side">
                            <div className="fields-section-online">
                                <p>Concern</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.concerns}  
                                  disabled          
                                 />
                              </div>

                               <div className="fields-section-online">
                                <p>Address Of Incident</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.address}  
                                  disabled          
                                 />
                              </div>

                         </div>

                         <div className="online-report-section-right-side">
                             <div className="fields-section-online">
                                <p>Date and Time Of Incident</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={`${formData.dateFiled} ${formData.time}`}
                                  disabled          
                                 />
                              </div>

                              <div className="fields-section-online">
                                <p>Area Of Incident</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.area}  
                                  disabled          
                                 />
                              </div>

                           
                         </div>

                      </div>

                        <div className="online-report-section-bottom-side-2">

                      {/*
                        ADD YUNG VIEW FOR IMAGE

                        <div className="online-report-details-section">
                          <div className="title-section"><p>Proof Photo</p></div>
                          <div className="description-section">
                            {imageUrl ? (
                              <>
                                <img src={imageUrl} alt="Proof Photo" className="detail-section-image" />
                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="view-full-image">View full image</a>
                              </>
                            ) : (
                              <p>No file uploaded</p>
                            )}
                          </div>
                        </div>
                      */}

                      <div className="online-report-box-container">
                        <div className="box-container-outer-image">
                          <div className="title-image">
                            Incident Image
                          </div>

                          <div className="box-container-incidentimage-online">
                                {formData.file ? (
                                  <img
                                    src={formData.file}
                                    alt="Incident Image"
                                    style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "10px" }}
                                  />
                                ) : (
                                  <p style={{ color: "red", fontStyle: "italic", textAlign: "center", marginTop: "30%" }}>No image available</p>
                                )}
                          </div>

                        </div>


                      </div>

                    </div>

                    </>
                    )}

              <form onSubmit={handleSubmit} className="online-report-section-2">
                    {activeSection === "action" && (
                    <>

                      <div className="online-report-full-top">

                        <div className="online-report-section-left-side">

                          <div className="fields-section-online">
                                <p>Barangay Officer<span className="required">*</span></p>
                                <input 
                                type="text" 
                              className={`online-incident-input-field ${invalidFields.includes("respondentName") ? "input-error" : ""}`} 
                                placeholder="Enter Respondent Officer Name"
                                 name="respondentName" value={respondent.respondentName}
                                onChange={handleChange} 
                                   disabled = {formData.status === "Acknowledged"}
                                  />
                            </div>

                        
                          <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">
                                  Investigation Report
                                </div>

                                <div className="box-container-investigation-report">
                                   <textarea   className={`investigation-report-input-field ${invalidFields.includes("investigationReport") ? "input-error" : ""}`}  placeholder="Enter Investigation Details" name="investigationReport" value={respondent.investigationReport} onChange={handleChange} disabled = {formData.status === "Acknowledged"} />
                                     
                                </div>

                              </div>
                            </div>
                            

                        </div>

                        <div className="online-report-section-right-side">

                           <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">
                                    Investigation Photo
                                </div>

                                <div className="box-container-investigation">

                                    <div className="file-upload-container-investigation">
                                      <label htmlFor="file-upload2" className="upload-link">Click to Upload File</label>
                                        <input
                                          id="file-upload2"
                                          type="file"
                                          className="file-upload-input"
                                          multiple
                                          accept=".jpg,.jpeg,.png"
                                          onChange={handleFileChange}
                                          disabled = {formData.status === "Acknowledged"}
                                        />
                                         <div className="uploadedFiles-container">
                                        {(files.length > 0 || respondent.file.length > 0) && (
                                          <div className="file-name-image-display">
                                            <ul>
                                              {/* Display existing respondent files */}
                                                {respondent.file.map((url: string, index: number) => (
                                                  <div className="file-name-image-display-indiv" key={`existing-${index}`}> 
                                                    <li>
                                                      <div className="filename&image-container">
                                                        <img src={url} alt={`Investigation Photo ${index + 1}`} style={{ width: '50px', height: '50px', marginRight: '5px' }} />
                                                      </div>
                                                      <a href={url} target="_blank" rel="noopener noreferrer">View</a>
                                                    </li>
                                                  </div>
                                                ))}


                                              {/* Display newly uploaded files */}
                                              {files.map((file, index) => (
                                                <div className="file-name-image-display-indiv" key={`new-${index}`}> 
                                                  <li>
                                                    {file.preview && (
                                                      <div className="filename&image-container">
                                                        <img src={file.preview} alt={file.name} style={{ width: '50px', height: '50px', marginRight: '5px' }} />
                                                      </div>
                                                    )}
                                                    {file.name}
                                                    <button type="button" onClick={() => handleFileDelete(file.name)} className="delete-button">
                                                      <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                                    </button>
                                                  </li>
                                                </div>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>

                                      
                                      
                                          
                                    </div>

                                </div>

                              </div>


                            </div>

                          
                        </div>
                    
                    

                      </div>


                      </>
                    )}
                    </form>


                      

                  </div>
                    
              </div>


          
        </div>
        
      </div>

    

   
    </main>
  );
}

