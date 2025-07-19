"use client"
import "@/CSS/IncidentReport/IncidentReport.css";
import { ChangeEvent, useEffect, useState, useRef } from "react"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/authContext";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, doc, getDoc} from "firebase/firestore";
import { db,storage, auth } from "@/app/db/firebase";
import { getAllSpecificDocument, getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import {isPastDate,isToday,isPastOrCurrentTime,getLocalDateString} from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";


const incidentForm:React.FC = () => {
  const router = useRouter();
  const {user} = useAuth();
  const currentUser = user?.uid || "Guest";
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const minDate = getLocalDateString(new Date());
  const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
  const [isVerified, setIsVerified] = useState(false);



const formRef = useRef<HTMLFormElement>(null);

    /*
      For pop up overlay errors
    */
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);


    const [invalidFields, setInvalidFields] = useState<string[]>([]);
const [showSubmitPopup, setShowSubmitPopup] = useState<boolean>(false);






  const [incidentReport, setIncidentReport] = useState<any>({
    caseNumber: "",
    firstname: "",
    middlename: "",
    lastname: "",
    contactNos: "",
    concerns: "",
    otherConcern: "", 
    dateFiled: "",
    time: "",
    address: "",
    file: null,
    area:"",
    reportID: "",
    department: "",
    status: "pending",
    addInfo:"",
    reasonForLateFiling: "",
    residentid:"",
  });


  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && currentUser !== "Guest") {
        const userRef = doc(db, "ResidentUsers", currentUser);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
  
          if (userData.status === "Verified" && userData.residentId) {
            // Set verified flag
            setIsVerified(true);
  
            // Fetch from Residents table
            const residentRef = doc(db, "Residents", userData.residentId);
            const residentSnap = await getDoc(residentRef);
  
            if (residentSnap.exists()) {
              const verifiedData = residentSnap.data();
              setIncidentReport((prev: any) => ({
                ...prev,
                firstname: verifiedData.firstName || "",
                middlename: verifiedData.middleName || "",
                lastname: verifiedData.lastName || "",
                contactNos: verifiedData.contactNumber || "",
                email: verifiedData.emailAddress || "",
                address: verifiedData.address || "",
                residentId: userData.residentId || "",
              }));
            }
          } else {
            // fallback to ResidentUsers
            setIsVerified(false); // <--- not verified
            setIncidentReport((prev: any) => ({
              ...prev,
              firstname: userData.first_name || "",
              middlename: userData.middle_name || "",
              lastname: userData.last_name || "",
              contactNos: userData.phone || "",
              email: userData.email || "",
              address: userData.address || "",
            }));
          }
        }
      }
    };
  
    fetchUserData();
  }, [currentUser]);
  
    
    const [nos, setNos] = useState<number>(0); // Initialize with a default value
  
    useEffect(() => {
      if(user){;
        const fetchCount = async () => {
          try {
            const count = await getSpecificCountofCollection("IncidentReports", "reportID", user.uid);
            setNos(count || 0);
          } catch (error) {
            console.error("Error fetching count:", error);
          }
        }
        fetchCount();
      }
      else{
        const fetchCount = async () => {
          try {
            const count = await getSpecificCountofCollection("IncidentReports", "reportID", "Guest");
            setNos(count || 0);
          } catch (error) {
            console.error("Error fetching count:", error);
          }
        }
        fetchCount();
      }
  
    },[user]);
    useEffect(() => {
       const getServiceRequestId =  () => {
         const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
         const randomId = customAlphabet(alphabet, 6);
         const requestId = randomId();
         const number = String(nos+1).padStart(4, '0'); // Ensure 3 digits
         let format = `${user?.uid.substring(0,6).toUpperCase()|| "GUEST"} - ${requestId} - ${number}`;
          setIncidentReport((prev: any) => ({
            ...prev,
            caseNumber: format,
          }));
         console.log("format", format);
       }
       getServiceRequestId();
     
     }, [user,nos]);


 

  
    const clearForm = () => {
      handleFileDeleteContainer1();
      setIncidentReport({
        caseNumber: "",
        firstname: "",
        middlename: "",
        lastname: "",
        contactNos: "",
        concerns: "",
        dateFiled: "",
        time: "",
        address: "",
        area: "",
        file: null,
        reportID: "",
        department: "",
        status: "Pending",
      });
      
    }

    const handleFormChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const {name, value, type} = e.target;
      
      if(type === "file" && e.target instanceof HTMLInputElement && e.target.files){
        setIncidentReport({
          ...incidentReport,
          file: e.target.files[0],
        })
      }
      else{
        setIncidentReport({
          ...incidentReport,
          [name]: value,
        })

      }
    }

    // Handle file selection for container 1
    const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        
        if (!validImageTypes.includes(selectedFile.type)) {
          alert("Only JPG, JPEG, and PNG files are allowed.");
          return;
        }
    
        // Replace existing file instead of adding multiple
        const preview = URL.createObjectURL(selectedFile);
        setFilesContainer1([{ name: selectedFile.name, preview }]);
      }
    };

    // Handle file deletion for container 1
    const handleFileDeleteContainer1 = () => {
      setFilesContainer1([]);
  
      // Reset file input
      const fileInput = document.getElementById('file-upload1') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    };
    

    const handleReportUpload = async (key: any, storageRef: any) => {
      try {
        const docRef = collection(db, "IncidentReports");
    
        // Assuming key is an array with a single object containing all fields:
        const updates = { ...key[0] };  // No filtering, just spread the object
    
        // Upload the report to Firestore
        const newDoc = await addDoc(docRef, updates);
        const incidentID = newDoc.id;
    
        // Upload the file only if storageRef is provided
        if (storageRef) {
          await uploadBytes(storageRef, incidentReport.file);
        }
        
        // Create a notification for LF Staff
        const notificationRef = collection(db, "BarangayNotifications");
        await addDoc(notificationRef, {
          message: `New incident report filed by ${key[0].firstname} ${key[0].lastname}.`,
          timestamp: new Date(),
          isRead: false,
          transactionType: "Online Incident",
          recipientRole: "LF Staff",
          incidentID: incidentID,
          ...(currentUser !== "Guest" && { reportID: currentUser }), 
          reporterType: currentUser !== "Guest" ? "Resident" : "Guest",
        });
        
    
    
      } catch (e: any) {
        console.log("Error uploading report:", e);
      }
    };
    



    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); 

      // Validate contact number: should be 11 digits and start with "09"
      if (!/^09\d{9}$/.test(incidentReport.contactNos)) {
        setErrorPopup({
          show: true,
          message: "Invalid contact number. Format should be: 0917XXXXXXX",
        });
        return;
      }

      const form = event.target as HTMLFormElement;
      if (form.checkValidity()) {
        const dateFiled = incidentReport.dateFiled;
        const timeFiled = incidentReport.time;
        
        const dateIsPast = isPastDate(dateFiled);
        const dateIsToday = isToday(dateFiled);
        const timeIsPastOrNow = isPastOrCurrentTime(timeFiled);
        
        const isInvalid =
       !dateIsPast && // not in the past
      (!dateIsToday || !timeIsPastOrNow); // if not today, it's future — or if today but time is still in future


        if (isInvalid) {
          setErrorPopup({
              show: true,
              message: "Invalid Date/Time. Please select a past or current date and time.",
          });
          return;
        }

        let filename = "";
        let storageRef = null;
        if(incidentReport.file){
          const timeStamp = Date.now().toString();
          const fileExtention = incidentReport.file.name.split('.').pop();
          filename = `incident_report_${currentUser}.${timeStamp}.${fileExtention}`;
          storageRef = ref(storage, `IncidentReports/${filename}`);
        }

        const concernValue = incidentReport.concerns === "Other" ? incidentReport.otherConcern : incidentReport.concerns;
        console.log(currentUser);
        
        const toAdd = [{
          ...(currentUser !== "Guest" ? { reportID: currentUser } :{reportID: "Guest"}), // Include reportID only if currentUser is not Guest
          caseNumber: incidentReport.caseNumber,
          firstname: incidentReport.firstname,
          middlename: incidentReport.middlename,
          lastname: incidentReport.lastname,
          contactNos: incidentReport.contactNos,
          type: "IncidentReport",
          concerns: concernValue,  
          dateFiled: incidentReport.dateFiled,
          time: incidentReport.time,
          address: incidentReport.address,
          areaOfIncident: incidentReport.area,
          typeOfIncident: "Minor",
          file: filename,
          department: "Online",
          status: incidentReport.status,
          residentId: incidentReport.residentId || null,
          statusPriority: 1,
          isViewed: false,
          ...(incidentReport.isReportLate && { 
            isReportLate: incidentReport.isReportLate,
            reasonForLateFiling: incidentReport.reasonForLateFiling,
          }), 
          addInfo: incidentReport.addInfo,
          createdAt: new Date().toLocaleString(),
          
        }];
        console.log(toAdd);
        handleReportUpload(toAdd, storageRef);
        clearForm(); // Clear the form after submission
        router.push('/IncidentReport/Notification'); 
      } else {
        form.reportValidity(); 
      }
    };



const handleSubmitClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();

  const invalidFields: string[] = [];

  if (!incidentReport.firstname.trim()) invalidFields.push("firstname");
  if (!incidentReport.lastname.trim()) invalidFields.push("lastname");
  if (!incidentReport.contactNos.trim()) invalidFields.push("contactNos"); 
  if (!incidentReport.concerns.trim()) invalidFields.push("concerns");
  if (!incidentReport.time.trim()) invalidFields.push("time");
  if (!incidentReport.area.trim()) invalidFields.push("area");
  if (!incidentReport.dateFiled.trim()) invalidFields.push("dateFiled");
  if (!incidentReport.address.trim()) invalidFields.push("address");
  if (!incidentReport.addInfo.trim()) invalidFields.push("addInfo");


  if (invalidFields.length > 0) {
    setInvalidFields(invalidFields);
    setPopupErrorMessage("Please fill up all required fields. Check all sections");
    setShowErrorPopup(true);
    setTimeout(() => {
      setShowErrorPopup(false);
    }, 3000);
    return;
  }

  setInvalidFields([]);
  setShowSubmitPopup(true);
};



const confirmSubmit = async () => {
  setShowSubmitPopup(false);

  if (formRef.current) {
    const form = formRef.current;

    const fakeEvent = {
      preventDefault: () => {},
      target: form,
    } as unknown as React.FormEvent<HTMLFormElement>;

    await handleSubmit(fakeEvent);
  } else {
    console.error("Form reference is null");
  }
};






    const [activeSection, setActiveSection] = useState("complainant");



      const isOneDayOrMore = (
        dateFiled: string,     // e.g. "2025-07-13"
        timeFiled: string,     // e.g. "21:06" or "21:06:00"
        createdAt: string | Date
        ): boolean => {
          // Combine date + time into full ISO format
          const filedDateTime = new Date(`${dateFiled}T${timeFiled}`);
          const createdDate = new Date(createdAt);
          console.log("filedDateTime", filedDateTime);
          console.log("createdDate", createdDate);

          const diff = createdDate.getTime() - filedDateTime.getTime();

          console.log("Time difference in ms:", diff);
          

          return diff >= 24 * 60 * 60 * 1000; // 24 hours in ms
        };

      
    
      const [isIncidentLate, setIsIncidentLate] = useState(false);
    
      useEffect(() => {
        if (!incidentReport?.dateFiled) return;
    
        const dateFiled = incidentReport.dateFiled;
        const createdAt = new Date(); 
        const timeFiled = incidentReport.time;
        
    
        const isLate = isOneDayOrMore(dateFiled, timeFiled,createdAt, );
        console.log("isLate", isLate);
        setIsIncidentLate(isLate);
    
        if (isLate) {
          setIncidentReport((prev: any) => ({
            ...prev,
            isReportLate: true,
          }));
        }
      }, [incidentReport?.dateFiled, incidentReport?.time]);
    

    return(
      <main className="main-container-incident-report">

    



        <div className="headerpic-report">
          <p>File an Incident Report</p>
        </div>

       

        <div className="register-section-incident-report">
          <h1>MINOR INCIDENT REPORT</h1>

         {/* <hr/>*/} 

         <div className="register-section-upper">

           <nav className="incidents-form-info-toggle-wrapper">
                  {["complainant", "incident", "others"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "complainant" && "Complainant Info"}
                      {section === "incident" && "Incident Info"}
                      {section === "others" && "Others"}
                    </button>
                  ))}
              </nav>

         </div>

          


          <form className="register-form-incident-report" ref={formRef} > 

            {activeSection === "complainant" && (
                        <>
            <div className="incident-report-form-container">

              <div className="incident-report-container-left-side-complainant">

                      <div className="form-group-incident-report">
                        <label htmlFor="firstname" className="form-label-incident-report">
                          First Name<span className="required">*</span>
                          </label>
                        <input
                          type="text"
                          id="firstname"
                          name="firstname"
                          className={`form-input-incident-report ${invalidFields.includes("firstname") ? "input-error" : ""}`}
                          required
                          placeholder="Enter First Name"
                          value={incidentReport.firstname}
                          onChange={handleFormChange}
                          disabled={isVerified}
                        />
                      </div>

                     <div className="form-group-incident-report">

                        <label htmlFor="lastname" className="form-label-incident-report">
                          Last Name<span className="required">*</span>
                        </label>

                      
                        <input
                          type="text"
                          id="lastname"
                          name="lastname"
                             className={`form-input-incident-report ${invalidFields.includes("lastname") ? "input-error" : ""}`}
                          required
                          placeholder="Enter Last Name"
                          value={incidentReport.lastname}
                          onChange={handleFormChange}
                          disabled={isVerified}
                        />
                      </div>

              </div>

              
              <div className="incident-report-container-right-side-complainant">

                   <div className="form-group-incident-report">

                      <label htmlFor="middlename" className="form-label-incident-report">
                        Middle Name
                      </label>

                      
                        <input
                          type="text"
                          id="middlename"
                          name="middlename"
                          className="form-input-incident-report"
                          placeholder="Enter Middle Name"
                          value={incidentReport.middlename || "N/A"}
                          onChange={handleFormChange}
                          disabled={isVerified}
                        />
                    </div>


                      <div className="form-group-incident-report">
                      <label htmlFor="contactNos" className="form-label-incident-report">
                        Phone Number<span className="required">*</span>
                        </label>
                      <input
                        type="text"
                        id="contactNos"
                        name="contactNos"
                        className={`form-input-incident-report ${invalidFields.includes("contactNos") ? "input-error" : ""}`}
                        required
                        value={incidentReport.contactNos}
                        onChange={(e) => {
                          const input = e.target.value;
                          // Only allow digits and limit to 11 characters
                          if (/^\d{0,11}$/.test(input)) {
                            handleFormChange(e);
                          }
                        }}
                        maxLength={11}  
                        pattern="^[0-9]{11}$" 
                        placeholder="Please enter a valid 11-digit contact number" 
                        title="Please enter a valid 11-digit contact number. Format: 0917XXXXXXX"
                      />
                    </div>
        

              </div>

          
              </div>
                  </>
                      )}


                {activeSection === "incident" && (
                        <>
                <div className="incident-report-form-container">

                  <div className="incident-report-container-left-side ">

                      <div className="form-group-incident-report">
                          <label htmlFor="concerns" className="form-label-incident-report">
                            Concerns<span className="required">*</span>
                          </label>
                          <select
                            id="concerns"
                            name="concerns"
                               className={`form-input-incident-report ${invalidFields.includes("concerns") ? "input-error" : ""}`}
                            value={incidentReport.concerns}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">Incident Type</option>
                            <option value="Noise Complaint">Noise Complaint</option>
                            <option value="Pet-Related Issues">Pet-Related Issues</option>
                            <option value="Littering">Littering</option>
                            <option value="Obstruction of Pathways">Obstruction of Pathways</option>
                            <option value="Minor Verbal Altercation">Minor Verbal Altercation</option>
                            <option value="Lost and Found Items">Lost and Found Items</option>
                            <option value="Damaged Streetlights">Damaged Streetlights</option>
                            <option value="Unauthorized Public Gatherings">Unauthorized Public Gatherings</option>
                            <option value="Vandalism">Vandalism</option>
                            <option value="Water Leakage">Water Leakage</option>
                            <option value="Other">Other</option>
                          </select>
                          {incidentReport.concerns === "Other" && (
                            <input
                              type="text"
                              id="otherConcern"
                              name="otherConcern"
                              className="form-input-incident-report"
                              placeholder="Specify your concern"
                              value={incidentReport.otherConcern}
                              onChange={handleFormChange}
                              required
                            />
                          )}
                        </div>

                        <div className="form-group-incident-report">
                          <label htmlFor="time" className="form-label-incident-report">
                            Time of Incident<span className="required">*</span>
                            </label>
                          <input
                            type="time"
                            id="time"
                            name="time"
                            className={`form-input-incident-report ${invalidFields.includes("time") ? "input-error" : ""}`}
                            required
                            placeholder="Enter Time of Incident"
                            value={incidentReport.time}
                            onChange={handleFormChange}
                          />
                        </div>

                
                         <div className="form-group-incident-report">
                    <label htmlFor="address" className="form-label-incident-report">
                      Area of Incident <span className="required">*</span>
                      </label>

                    <select
                      id="area"
                      name="area"
                      className={`form-input-incident-report ${invalidFields.includes("area") ? "input-error" : ""}`}
                      required
                      value={incidentReport.area}
                      onChange={handleFormChange}>

                      <option value="" disabled>Select Area</option>
                      <option value="South Fairview">South Fairview</option>
                      <option value="West Fairview">West Fairview</option>
                      <option value="East Fairview">East Fairview</option>
                    </select>
                  </div>

                  { isIncidentLate && (
                    <>
                      <div className="form-group-incident-report">
                        <label htmlFor="reasonForLateFiling" className="form-label-incident-report">
                          Reason for Late Filing<span className="required">*</span>
                        </label>
                        <textarea
                          id="reasonForLateFiling"
                          name="reasonForLateFiling"
                          className={`form-input-incident-report ${invalidFields.includes("reasonForLateFiling") ? "input-error" : ""}`}
                          required
                          placeholder="Enter Reason for Late Filing"
                          value={incidentReport.reasonForLateFiling}
                          onChange={handleFormChange}
                          rows={4} cols={50}
                        />
                      </div>
                    </>    
                  )}

                  </div>


                   <div className="incident-report-container-right-side ">

                      <div className="form-group-incident-report">
                        <label htmlFor="date" className="form-label-incident-report">
                          Date of Incident<span className="required">*</span>
                          </label>
                        <input
                          type="date"
                          id="dateFiled"
                          name="dateFiled"
                          className={`form-input-incident-report ${invalidFields.includes("dateFiled") ? "input-error" : ""}`}
                          required
                          max={minDate}
                          onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                          placeholder="Enter Date of Incident"
                          value={incidentReport.dateFiled}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="form-group-incident-report">
                        <label htmlFor="address" className="form-label-incident-report">
                          Address of Incident<span className="required">*</span>
                          </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          className={`form-input-incident-report ${invalidFields.includes("address") ? "input-error" : ""}`}
                          required
                          placeholder="Enter Location"
                          value={incidentReport.address}
                          onChange={handleFormChange}
                        />
                      </div>
                    
                  <div className="form-group-incident-report">
                    <label htmlFor="addInfo" className="form-label-incident-report">
                    Additional Info Regarding the Concern<span className="required">*</span>
                    </label>
                    <textarea 
                      id="addInfo"
                      name="addInfo"
                        className={`form-input-incident-report ${invalidFields.includes("addInfo") ? "input-error" : ""}`}
                      required
                      placeholder="Enter Additonal Information/Remarks"
                      value={incidentReport.addInfo}
                      onChange={handleFormChange}
                      rows={4} cols={50}
                    
                    />
                  </div>
        
      
                  </div>


                  

                  
            

              
                  </div>
                      </>
                    )}


                  {activeSection === "others" && (
                    <>

                    <div className="incident-report-form-container">

                       <div className="signatureprintedname-container">
                          <label className="form-label-incident-report-file">Upload Proof of Incident (If Applicable)</label>
                    
                          <div className="file-upload-container-incident-report">
                            <label htmlFor="file-upload1" className="upload-link-incident-report">Click to Upload File</label>
                            <input
                              id="file-upload1"
                              type="file"
                              className="file-upload-input-incident-report"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleFileChangeContainer1(e);
                                handleFormChange(e);
                              }} // Handle file selection
                            />
                            <div className="uploadedFiles-container-incident-report">
                              {filesContainer1.length > 0 && (
                                <div className="file-name-image-display-incident-report">
                                  <ul>
                                    {filesContainer1.map((file, index) => (
                                      <div className="file-name-image-display-indiv-incident-report" key={index}>
                                        <li>
                                          {file.preview && (
                                            <div className="filename-image-container-incident-report">
                                              <img
                                                src={file.preview}
                                                alt={file.name}
                                                style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                              />
                                            </div>
                                          )}
                                          {file.name}
                                          <div className="delete-container-incident-report">
                                            <button
                                              type="button"
                                              onClick={() => handleFileDeleteContainer1()}
                                              className="delete-button-incident-report"
                                            >
                                              <img
                                                src="/images/trash.png"
                                                alt="Delete"
                                                className="delete-icon-incident-report"
                                              />
                                            </button>
                                          </div>
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
                       

                </>
              )}



          <button type="submit" className="submit-button-incident-report" onClick={handleSubmitClick}>Submit</button>

          </form>
        </div>




            {showSubmitPopup && (
            <div className="confirmation-popup-overlay-online">
                <div className="confirmation-popup-online">
                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                <p>Are you sure you want to submit?</p>
                <div className="yesno-container-add">
                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                </div>
                </div>
            </div>
            )}

              {errorPopup.show && (
                <div className="popup-overlay error">
                    <div className="popup">
                        <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                        <p>{errorPopup.message}</p>
                        <button onClick={() => setErrorPopup({ show: false, message: "" })} className="close-button">Close</button>
                    </div>
                </div>
            )}

            {showErrorPopup && (
                <div className={`error-popup-overlay-online show`}>
                    <div className="popup-ad-online">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}



                {/*
                    for wrong inputs
                */}
   
                   {errorPopup.show && (
                        <div className="popup-overlay-fileincident error">
                            <div className="popup-fileincident">
                              <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                              <p>{errorPopup.message}</p>
                              <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button>
                            </div>
                        </div>
                  )}

        
                
                
                
    </main>
    )
}

export default incidentForm;