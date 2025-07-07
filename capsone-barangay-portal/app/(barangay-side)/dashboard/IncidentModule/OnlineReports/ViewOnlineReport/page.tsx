"use client";
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/app/db/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, list } from "firebase/storage";


export default function ViewOnlineReports() {
  const [formData, setFormData] = useState({
    id: "",
    firstname: "",
    lastname: "",
    contactNos: "",
    areaOfIncident: "",
    address: "",
    dateFiled: "",
    addInfo: "",
    concerns: "",
    status: "",
    file: "",
    reportID: "",
    caseNumber: "",
    time: "",
    isReportLate:false,
    reasonForLateFiling:""
  });
  
  const user = useSession().data?.user;
 
  const [listOfStaffs, setListOfStaffs] = useState<any[]>([]);

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);  
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

  useEffect(() => {
    try {
      const collectionRef = query(collection(db, "BarangayUsers"), 
      where("position", "==", "LF Staff"),
      where("firstTimelogin", "==", false));
      const unsubscribe = getDocs(collectionRef).then((querySnapshot) => {
        const staffList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })); // Exclude the current user
        setListOfStaffs(staffList);
      });
      return () => {
        unsubscribe; // Clean up the subscription
      };
    } catch (error) {
      console.error("Error fetching staff list:", error);
      
    }

  }, []);


  console.log("List of Staffs:", listOfStaffs);

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
          areaOfIncident: data.areaOfIncident || "",
          address: data.address || "",
          dateFiled: data.dateFiled || "",
          addInfo:data.addInfo || "",
          concerns: data.concerns || "",
          status: data.status || "",
          file: data.file || "",
          reportID: data.reportID || "",
          caseNumber: data.caseNumber || "",
          time: data.time || "",
          isReportLate: data.isReportLate || false,
          reasonForLateFiling: data.reasonForLateFiling || "",
        });
  
        // ✅ Fetch respondent details and files as an array
        if (data.respondent) {
          const initialData = {
            respondentName: data.respondent.respondentName || "",
            investigationReport: data.respondent.investigationReport || "",
            file: Array.isArray(data.respondent.file) ? data.respondent.file : data.respondent.file ? [data.respondent.file] : [],
          };
          setInitialRespondent(initialData);
          setRespondent(initialData);
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



  const handleSMSToAssignedOfficer = async () => {
    //sends an sms to the assigned officer regarding the incident report to conduct an investigation 



  }

const handleSubmitClick = async () => {
  const { respondentName, investigationReport  } = respondent;
  console.log(respondent)
  const invalidFields: string[] = [];

  if (!respondentName.trim()) invalidFields.push("respondentName");
  if (!investigationReport.trim() && respondentName === user?.id ) invalidFields.push("investigationReport");
  //if ((!file || file.length === 0) && respondentName === user?.id ) invalidFields.push("file");
  //if(files.length === 0 && respondentName === user?.id ) invalidFields.push("file");

  if (invalidFields.length > 0) {
    setInvalidFields(invalidFields); // highlight invalid fields
    setPopupErrorMessage("Please fill up all required fields.");
    setShowErrorPopup(true);

    setTimeout(() => {
      setShowErrorPopup(false);
    }, 3000);

    return;
  }


  // Clear previous errors
  setInvalidFields([]);
  setShowConfirmation(true);
};


 
  
  const confirmSubmit = async () => {
    setShowConfirmation(false);
    
    if(formData.status === "pending" ) {
      setFormData((prevData) => ({
        ...prevData,
        status: "In - Progress", // Set status to "In - Progress" if not already set
        statusPriority: 2, // Set priority to 2 for "In - Progress"
        
      }));
      setInitialRespondent((prev) => ({
        ...prev,
        respondentName: user?.id || "", // Set the current user's ID as the respondent
      }));

    }
     else if(formData.status !== "Settled"){
      setFormData((prevData) => ({
        ...prevData,
        status: "Settled", // Set status to "Acknowledged" if not already set
        statusPriority: 3, // Set priority to 3 for "Acknowledged"
      }));

    }




      const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
      const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);


      if (!docId) {
        setPopupErrorMessage("Failed to save record.");
        setShowErrorPopup(true);
        return;
      }

      setPopupMessage("Online Report Submitted Succesfuly!!");
      setShowPopup(true);
      handleSMSToAssignedOfficer(); // Call the SMS function
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
      status: formData.status === "pending"
        ? "In - Progress"
        : formData.status === "In - Progress" &&
        "Settled", 
      statusPriority: formData.status === "pending"
        ? 2
        : formData.status === "In - Progress"
        ? 3
        : 1,
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

    if (respondent.respondentName) {
      const barangayNotificationRef = doc(collection(db, "BarangayNotifications"));
      await setDoc(barangayNotificationRef, {
        recipientRole: "LF Staff",
        respondentID: respondent.respondentName,
        message: `You have been assigned an incident (${formData.caseNumber}).`,
        timestamp: new Date(),
        isRead: false,
        incidentID: formData.id,
        transactionType: "Assigned Incident"
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

           

      <div className="main-content-view-online-report">
        <div className="section-1-online-report">
         
            <div className="section-1-online-report-left-side">
              <button type="button" onClick={() => router.back()}>
                 <img src="/images/left-arrow.png" alt="Left Arrow" className="back-button-reports"/>
              </button>
              <h1>Online Report Details</h1>
            </div>

            {formData.status !== "Settled" &&
              user?.position === "LF Staff" &&
              (
                initialRespondent.respondentName === "" ||  // No respondent assigned yet
                user?.id === respondent.respondentName      // Current user is the assigned respondent
              ) && (
                <div className="action-btn-section-online-report">
                  <button className="action-online-report" onClick={handleSubmitClick}>
                    Save
                  </button>
                </div>
            )}

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
          {["complainant", "incident"]
                .concat(
                  formData.status === "Settled" || user?.id === initialRespondent.respondentName
                    ? ["action"]
                    : []
                )
                .map((section) => (
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
                       
                            <div className="fields-section-online">
                                <p>Barangay Officer<span className="required">*</span></p>
                                <select
                                  className={`online-incident-input-field ${invalidFields.includes("respondentName") ? "input-error" : ""}`}
                                  name="respondentName" 
                                  value={respondent.respondentName}
                                  onChange={handleChange}
                                  disabled = {formData.status === "Settled" || initialRespondent.respondentName !== "" ||user?.position !== "LF Staff"}                                  
                                >
                                  <option value="" disabled>Select Officer</option>
                                  {listOfStaffs.filter(staff => !(staff.id == user?.id && respondent.respondentName =="") ) 
                                  .map((staff,index) => (
                                    <option key={index} 
                                      value={staff.id}
                                      >
                                      {staff.firstName} {staff.lastName}
                                    </option>
                                  ))}

                                </select>
                                
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
                                  value={`${formData.dateFiled} ${formData.time}${formData?.isReportLate ? " - (Late Filing)" : ""}`}
                                  disabled          
                                 />
                              </div>
                              <div className="fields-section-online">
                                <p>Area Of Incident</p>
                                 <input
                                  type="text"
                                  className="online-incident-input-field"
                                  value={formData.areaOfIncident}  
                                  disabled          
                                 />
                              </div>

                           
                         </div>

                      </div>

                      {formData?.isReportLate ? (
                        <>
                          {/* TOP: Incident Image only */}
                          <div className="online-report-top">
                            <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">Incident Image</div>
                                <div className="box-container-incidentimage-online">
                                  {imageUrl ? (
                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={imageUrl} alt="Incident Image" className="incident-img" />
                                    </a>
                                  ) : (
                                    <p className="no-image-text">No image available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BOTTOM: Summary + Reason for Late Filing */}
                          <div className="online-report-bottom">
                            <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">Summary of Concern</div>
                                <div className="box-container-investigation-report">
                                  <textarea
                                    className="investigation-report-input-field"
                                    value={formData.addInfo}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">Reason For Late Filing/Reporting</div>
                                <div className="box-container-investigation-report">
                                  <textarea
                                    className="investigation-report-input-field"
                                    value={formData.reasonForLateFiling}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* TOP: wala */}

                          {/* BOTTOM: Incident Image + Summary */}
                          <div className="online-report-bottom">
                            <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">Incident Image</div>
                                <div className="box-container-incidentimage-online">
                                  {imageUrl ? (
                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={imageUrl} alt="Incident Image" className="incident-img" />
                                    </a>
                                  ) : (
                                    <p className="no-image-text">No image available</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="online-report-box-container">
                              <div className="box-container-outer-image">
                                <div className="title-image">Summary of Concern</div>
                                <div className="box-container-investigation-report">
                                  <textarea
                                    className="investigation-report-input-field"
                                    value={formData.addInfo}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                    </>
                    )}

                      {(formData.status === "Settled" || user?.id === initialRespondent.respondentName) && (
                        <form onSubmit={handleSubmit} className="online-report-section-2">
                          {activeSection === "action" && (
                            <>
                              <div className="online-report-full-top">
                                <div className="online-report-section-left-side">

                                  {/*}
                                  <div className="fields-section-online">
                                    <p>Barangay Officer<span className="required">*</span></p>
                                    <select
                                      className={`online-incident-input-field ${invalidFields.includes("respondentName") ? "input-error" : ""}`}
                                      name="respondentName"
                                      value={respondent.respondentName}
                                      onChange={handleChange}
                                      disabled={
                                        formData.status === "Settled" ||
                                        initialRespondent.respondentName !== "" ||
                                        user?.position !== "LF Staff"
                                      }
                                    >
                                      <option value="" disabled>Select Officer</option>
                                      {listOfStaffs
                                        .filter(
                                          (staff) =>
                                            !(staff.id == user?.id && respondent.respondentName === "")
                                        )
                                        .map((staff, index) => (
                                          <option key={index} value={staff.id}>
                                            {staff.firstName} {staff.lastName}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  */}

                                  {initialRespondent.respondentName !== "" && (
                                    <div className="online-report-box-container">
                                      <div className="box-container-outer-image">
                                        <div className="title-image">Investigation Report</div>
                                        <div className={`box-container-investigation-report-action ${invalidFields.includes("investigationReport") ? "input-error" : ""}`}>
                                          <span className="required-asterisk">*</span>
                                          <textarea
                                         
                                            className ="investigation-report-input-field "  
                                            placeholder="Enter Investigation Details"
                                            name="investigationReport"
                                            value={respondent.investigationReport}
                                            onChange={handleChange}
                                            disabled={
                                              formData.status === "Settled" ||
                                              user?.id !== respondent.respondentName
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {initialRespondent.respondentName !== "" && (
                                  <div className="online-report-section-right-side">
                                    <div className="online-report-box-container">
                                      <div className="box-container-outer-image">
                                        <div className="title-image">Investigation Photo</div>
                                        <div className="box-container-investigation">
                                          <div className="file-upload-container-investigation">
                                            {formData.status !== "Settled" &&
                                              respondent.file.length === 0 && (
                                                <>
                                                  <label htmlFor="file-upload2" className="upload-link">
                                                    Click to Upload File
                                                  </label>
                                                  <input
                                                    id="file-upload2"
                                                    type="file"
                                                    name="file"
                                                    className={`file-upload-input ${invalidFields.includes("file") ? "input-error" : ""}`}
                                                    multiple
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={handleFileChange}
                                                    disabled={
                                                      formData.status === "Settled" ||
                                                      user?.id !== respondent.respondentName
                                                    }
                                                  />
                                                </>
                                              )}

                                            <div className="uploadedFiles-container">
                                              {(files.length > 0 || respondent.file.length > 0) ? (
                                                <div className="file-name-image-display">
                                                  <ul>
                                                    {respondent.file.map((url: string, index: number) => (
                                                      <div
                                                        className="file-name-image-display-indiv"
                                                        key={`existing-${index}`}
                                                      >
                                                        <li>
                                                          <div className="filename&image-container">
                                                            <img
                                                              src={url}
                                                              alt={`Investigation Photo ${index + 1}`}
                                                              style={{ width: "50px", height: "50px", marginRight: "5px" }}
                                                            />
                                                          </div>
                                                          <a href={url} target="_blank" rel="noopener noreferrer">
                                                            View
                                                          </a>
                                                        </li>
                                                      </div>
                                                    ))}

                                                    {files.map((file, index) => (
                                                      <div
                                                        className="file-name-image-display-indiv"
                                                        key={`new-${index}`}
                                                      >
                                                        <li>
                                                          {file.preview && (
                                                            <div className="filename&image-container">
                                                              <img
                                                                src={file.preview}
                                                                alt={file.name}
                                                                style={{ width: "50px", height: "50px", marginRight: "5px" }}
                                                              />
                                                            </div>
                                                          )}
                                                          {file.name}
                                                          <button
                                                            type="button"
                                                            onClick={() => handleFileDelete(file.name)}
                                                            className="delete-button"
                                                          >
                                                            <img
                                                              src="/images/trash.png"
                                                              alt="Delete"
                                                              className="delete-icon"
                                                            />
                                                          </button>
                                                        </li>
                                                      </div>
                                                    ))}
                                                  </ul>
                                                </div>
                                              ) : (
                                                <p
                                                  style={{
                                                    color: "red",
                                                    fontStyle: "italic",
                                                    textAlign: "center",
                                                    marginTop: "30%",
                                                  }}
                                                >
                                                  No image available
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </form>
                      )}



                      

                  </div>
                    
              </div>


          
        </div>
        
      </div>

    

   
    </main>
  );
}

