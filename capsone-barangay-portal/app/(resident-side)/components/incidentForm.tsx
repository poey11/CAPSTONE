"use client"
import "@/CSS/IncidentReport/IncidentReport.css";
import { ChangeEvent, useEffect, useState } from "react"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/authContext";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, doc, getDoc} from "firebase/firestore";
import { db,storage, auth } from "@/app/db/firebase";
import { getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import {isPastDate,isToday,isPastOrCurrentTime,getLocalDateString} from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";


const incidentForm:React.FC = () => {
  const router = useRouter();
  const {user} = useAuth();
  const currentUser = user?.uid || "Guest";
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const minDate = getLocalDateString(new Date());
  const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
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
    status: "Pending",
    addInfo:"",
  });


  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "ResidentUsers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIncidentReport((prev: any) => ({
            ...prev,
            firstname: data.first_name || "",
            middlename: data.middle_name || "",
            lastname: data.last_name || "",
            contactNos: data.phone || "",
          }));
        }
      }
    };

    fetchUserData();
  }, []);
  const [onlineReportCollection, setOnlineReportCollection] = useState<any[]>([]);
  useEffect(() => {
    try {
      const unsubscribe =  getAllSpecificDocument("IncidentReports", "department", "==", "Online",  setOnlineReportCollection);
      return () => {
        if (unsubscribe) {
          unsubscribe(); 
        }
      }
    } catch (error) {
      setOnlineReportCollection([]);
    }
   
  }, []);
  
  useEffect(() => {
    const getCaseNumber = () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomId = customAlphabet(alphabet, 6);
      const randomIdString = randomId();
      let formattedNumber = ""
      if(onlineReportCollection.length < 1){
        formattedNumber = String(1).padStart(4, "0");
      }
      else{
        const lastReport = onlineReportCollection[0].caseNumber.split("-");
        const number = parseInt(lastReport[lastReport.length - 1]);
        formattedNumber = String(number+1).padStart(4, "0");
      }
      const user = currentUser !== "Guest"
      ? currentUser.substring(0, 6).toUpperCase()
      : "GUEST";  
      const caseValue =`${user} - ${randomIdString} - ${formattedNumber}` ;
      console.log("Generated Case Number:", caseValue);
      setIncidentReport((prev: any) => ({
        ...prev,
        caseNumber: caseValue, // ex : "ABCDEF - ABCDEF - 0001" or "GUEST - ABCDEF - 0001"
      }));
    };

    getCaseNumber();
  },[user, onlineReportCollection]);

  
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
          reportID: currentUser,
          isRead: false,
          transactionType: "Online Incident",
          recipientRole: "LF Staff",
          incidentID: incidentID,
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
          ...(currentUser !== "Guest" && { reportID: currentUser }), // Include reportID only if currentUser is not Guest
          caseNumber: incidentReport.caseNumber,
          firstname: incidentReport.firstname,
          middlename: incidentReport.middlename,
          lastname: incidentReport.lastname,
          contactNos: incidentReport.contactNos,
          concerns: concernValue,  
          dateFiled: incidentReport.dateFiled,
          time: incidentReport.time,
          address: incidentReport.address,
          area: incidentReport.area,
          file: filename,
          department: "Online",
          status: incidentReport.status,
          isFiled: false,
          addInfo: incidentReport.addInfo,
          createdAt: new Date(),
        }];
        console.log(toAdd);
        handleReportUpload(toAdd, storageRef);
        clearForm(); // Clear the form after submission
        router.push('/IncidentReport/Notification'); 
      } else {
        form.reportValidity(); 
      }
    };




    return(
      <main className="main-container-incident-report">

    
        {errorPopup.show && (
              <div className="popup-overlay-fileincident error">
                  <div className="popup-fileincident">
                    <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                    <p>{errorPopup.message}</p>
                    <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button>
                  </div>
              </div>
        )}


        <div className="headerpic-report">
          <p>File an Incident Report</p>
        </div>

       

        <div className="register-section-incident-report">
          <h1>MINOR INCIDENT REPORT</h1>

          <hr/>
          <form className="register-form-incident-report" onSubmit={handleSubmit}> {/* Use onSubmit to trigger the redirect */}
            <div className="form-group-incident-report">
              <label htmlFor="firstname" className="form-label-incident-report">
                First Name<span className="required">*</span>
                </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                className="form-input-incident-report"
                required
                placeholder="Enter First Name"
                value={incidentReport.firstname}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group-incident-report">

              <label htmlFor="middlename" className="form-label-incident-report">
                Middle Name<span className="required">*</span>
              </label>

              
                <input
                  type="text"
                  id="middlename"
                  name="middlename"
                  className="form-input-incident-report"
                  required
                  placeholder="Enter Middle Name"
                  value={incidentReport.middlename}
                  onChange={handleFormChange}
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
                className="form-input-incident-report"
                required
                placeholder="Enter Last Name"
                value={incidentReport.lastname}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group-incident-report">
              <label htmlFor="contactNos" className="form-label-incident-report">
                Cellphone Number<span className="required">*</span>
                </label>
              <input
                type="text"
                id="contactNos"
                name="contactNos"
                className="form-input-incident-report"
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
              />
            </div>
            <div className="form-group-incident-report">
            <label htmlFor="concerns" className="form-label-incident-report">
              Concerns<span className="required">*</span>
            </label>
            <select
              id="concerns"
              name="concerns"
              className="resident-module-filter"
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
              <label htmlFor="date" className="form-label-incident-report">
                Date of Incident<span className="required">*</span>
                </label>
              <input
                type="date"
                id="dateFiled"
                name="dateFiled"
                className="form-input-incident-report"
                required
                max={minDate}
                onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                placeholder="Enter Date of Incident"
                value={incidentReport.dateFiled}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="form-group-incident-report">
              <label htmlFor="time" className="form-label-incident-report">
                Time of Incident<span className="required">*</span>
                </label>
              <input
                type="time"
                id="time"
                name="time"
                className="form-input-incident-report"
                required
                placeholder="Enter Time of Incident"
                value={incidentReport.time}
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
                className="form-input-incident-report"
                required
                placeholder="Enter Location"
                value={incidentReport.address}
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
                className="form-input-incident-report"
                required
                value={incidentReport.area}
                onChange={handleFormChange}>

                <option value="" disabled>Select Area</option>
                <option value="South Fairview">South Fairview</option>
                <option value="West Fairview">West Fairview</option>
                <option value="East Fairview">East Fairview</option>
              </select>
            </div>

            <div className="form-group-incident-report">
              <label htmlFor="addInfo" className="form-label-incident-report">
               Additional Information/Remarks Regarding the Concern<span className="required">*</span>
              </label>
              <textarea 
                id="addInfo"
                name="addInfo"
                className="form-input-incident-report resize-none"
                required
                placeholder="Enter Additonal Information/Remarks"
                value={incidentReport.addInfo}
                onChange={handleFormChange}
                rows={4} cols={50}
              
              />
            </div>
        
            <div className="signature/printedname-container">
              <label className="form-label-incident-report">Upload Proof of Incident (If Applicable)</label>
        
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
                
            {/* Submit button */}
            <button type="submit" className="submit-button-incident-report">Submit</button>
          </form>
        </div>
                
                
                
    </main>
    )
}

export default incidentForm;