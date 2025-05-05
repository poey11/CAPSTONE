"use client"
import "@/CSS/IncidentModule/AddNewIncident.css";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection} from "firebase/firestore";
import { db,storage } from "@/app/db/firebase";
import {getAllSpecificDocument} from "@/app/helpers/firestorehelper";
import {isPastDate,isToday,isPastOrCurrentTime, getLocalDateString, isValidPhilippineMobileNumber, getLocalTimeString} from "@/app/helpers/helpers";
import { useSession } from "next-auth/react";
import {customAlphabet} from "nanoid";


 interface userProps{
  fname: string;
  lname: string;  
  sex: string;
  age: string;
  civilStatus: string;
  address: string;
  contact: string;
}



export default function AddIncident() {
  const router = useRouter();
  const user = useSession().data?.user;

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  const currentDate = getLocalDateString(new Date());
  const currentTime = getLocalTimeString(new Date());
  const searchParam = useSearchParams();
  const departmentId = searchParam.get("departmentId");
  const [complainant, setComplainant] = useState<userProps>({
    fname: "",
    lname: "",
    sex: "",
    age: "",
    contact: "",
    civilStatus: "",
    address: "",
  });
  const [respondent, setRespondent] = useState<userProps>({
    fname: "",
    lname: "",
    sex: "",
    age: "",
    contact: "",
    civilStatus: "",
    address: "",
  });
  const [reportInfo, setReportInfo] = useState<any>({
    caseNumber: "",
    dateFiled: "",
    timeFiled: "",
    location: "",
    nature: "",
    specifyNature: "",
    concern: "",
    status: "Pending",
    receivedBy: "",
    dateReceived: currentDate,
    timeReceived: currentTime,
    nosofMaleChildren: "",
    nosofFemaleChildren: "",
    file: null,
  });
  const [deskStaff, setdeskStaff] = useState<any>({
    fname: "",
    lname: "",
  })

  useEffect(() => {
    if(!user) return;
    setdeskStaff({
      fname: user.fullName.split(" ")[0],
      lname: user.fullName.split(" ")[1],
    })
  },[user]);
 


  const [reportCollection, setReportCollection] = useState<any[]>([]);
 
  useEffect(() => {
    if (!departmentId) return; 
    try {
      const unsubscribe =  getAllSpecificDocument("IncidentReports", "department", "==", departmentId,  setReportCollection);
      return () => {
        if (unsubscribe) {
          unsubscribe(); 
        }
      }
    } catch (error) {
       setReportCollection([]);
    }
   
  }, [departmentId]);

  useEffect(() => { 
    const getCaseNumber = () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomIdString = customAlphabet(alphabet, 6);
      const randomId = randomIdString();
      let id ="";
      let formattedNumber ="";
      if(departmentId === "Lupon") id = "LPN";
      else if(departmentId === "GAD") id = "GAD";
      else if(departmentId === "BCPC") id = "BCPC";
      else if(departmentId === "VAWC") id = "VAWC";

      if(reportCollection.length < 1) {
         formattedNumber = String(1).padStart(4, "0");
      }
      else{
        const lastestReport = reportCollection[0].caseNumber.split(" - ");
        const lastCaseNumber = parseInt(lastestReport[lastestReport.length - 1]);
        formattedNumber = String(lastCaseNumber+1).padStart(4, "0");
      }
      const caseValue =`${id} - ${randomId} - ${formattedNumber}` ;
      setReportInfo((prev: any) => ({ ...prev, caseNumber: caseValue }));
      return;


    }
      getCaseNumber();
  },[reportCollection])
  


  
  const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
 
 

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

  const handleFileDeleteContainer1 = () => {
    setFilesContainer1([]);

    // Reset file input
    const fileInput = document.getElementById('file-upload1') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUpload = async () => {
    try {
        let filename = "";
        if (reportInfo.file) {
            const timeStamp = Date.now().toString();
            const fileExtension = reportInfo.file.name.split('.').pop();
            filename = `${reportInfo.caseNumber}.${timeStamp}.${fileExtension}`;
            const storageRef = ref(storage, `IncidentReports/${filename}`);
            await uploadBytes(storageRef, reportInfo.file);
        }
        // Prepare the incident report data
        const reportData: Record<string, any> = {
            caseNumber: reportInfo.caseNumber,
            dateFiled: reportInfo.dateFiled,
            timeFiled: reportInfo.timeFiled,
            location: reportInfo.location,
            nature: reportInfo.nature,
            specifyNature: reportInfo.specifyNature,
            concern: reportInfo.concern,
            status: "Pending",
            receivedBy: `${deskStaff.fname} ${deskStaff.lname}`,
            dateReceived: reportInfo.dateReceived,
            timeReceived: reportInfo.timeReceived,
            file: filename,
            department: departmentId,
            staffId: user?.id,
            isDialogue: false,
            nosHearing:1,
            createdAt: new Date(),
            ...(departmentId === "GAD" && { 
              nosofMaleChildren: reportInfo.nosofMaleChildren,
              nosofFemaleChildren: reportInfo.nosofFemaleChildren,
            }),
            complainant: {
                fname: complainant.fname,
                lname: complainant.lname,
                sex: complainant.sex,
                age: complainant.age,
                contact: complainant.contact,
                civilStatus: complainant.civilStatus,
                address: complainant.address,
            },
            respondent: {
                fname: respondent.fname,
                lname: respondent.lname,
                sex: respondent.sex,
                age: respondent.age,
                contact: respondent.contact,
                civilStatus: respondent.civilStatus,
                address: respondent.address,
            }
        };

        // 🔥 Remove fields with empty values ("" or null)
        const filteredData = Object.fromEntries(
            Object.entries(reportData).filter(([_, value]) => 
                value !== "" && value !== null
            )
        );

        // 🔥 Recursively filter empty fields from nested objects
        const deepFilter = (obj: any): any => {
            return Object.fromEntries(
                Object.entries(obj).filter(([_, value]) => 
                    value !== "" && value !== null
                ).map(([key, value]) => 
                    [key, typeof value === 'object' && !Array.isArray(value) ? deepFilter(value) : value]
                )
            );
        };

        // 🔥 Apply deep filtering for nested objects (complainant & respondent)
        filteredData.complainant = deepFilter(filteredData.complainant);
        filteredData.respondent = deepFilter(filteredData.respondent);

        // Save filtered data to Firestore
     //   await addDoc(collection(db, "IncidentReports"), filteredData);


       setShowSubmitPopup(false);
            // Save filtered data to Firestore and get the reference
        const docRef = await addDoc(collection(db, "IncidentReports"), filteredData);

 
    router.push(`/dashboard/IncidentModule/Department?id=${departmentId}&highlight=${docRef.id}`);


      
  


    } catch (e: any) {
        console.log(e);
    }
};

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); 


 
    const form = event.target as HTMLFormElement;
    if (form.checkValidity()) {
      if(!isValidPhilippineMobileNumber(complainant.contact)|| !isValidPhilippineMobileNumber(respondent.contact)){
        setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
      const dateFiled = reportInfo.dateFiled;
      const dateReceived = reportInfo.dateReceived;
      const timeFiled = reportInfo.timeFiled;
      const timeReceived = reportInfo.timeReceived;

      const dateIsFiledToday= isToday(dateFiled);
      const timeIsFiledPastOrNow = isPastOrCurrentTime(timeFiled);
      const dateFiledIsPast = isPastDate(dateFiled);

      const isInvalid = !dateFiledIsPast &&(!dateIsFiledToday || !timeIsFiledPastOrNow);
      if (isInvalid) {
        setPopupErrorMessage("Date and/or Time in Filed Section is Invalid.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }

      const dateIsReceivedToday = isToday(dateReceived);
      const timeIsRecievedPastOrNow = isPastOrCurrentTime(timeReceived);
      const dateReceivedIsPast = isPastDate(dateReceived);
      const isInvalidReceived = !dateReceivedIsPast &&(!dateIsReceivedToday || !timeIsRecievedPastOrNow);
      if (isInvalidReceived) {
        setPopupErrorMessage("Date and/or Time in Received Section is Invalid.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }


    
        setShowSubmitPopup(true);
     
    } else {
     
      form.reportValidity();
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      await handleUpload(); // Save to Firestore only when confirmed
  
      setPopupMessage("Incident Successfully Submitted!");
      setShowPopup(true);

  
      setTimeout(() => {
        setShowPopup(false);
        
      }, 3000);
  
    } catch (error) {
      console.error("Error saving incident:", error);
      setPopupErrorMessage("Error saving incident. Please try again.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    }
  };
  

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, id } = e.target;

    // Handle file input separately
    if (type === "file" && e.target instanceof HTMLInputElement && e.target.files) {
        setReportInfo((prev:any) => ({
            ...prev,
            file: (e.target as HTMLInputElement).files?.[0] || null,
        }));
        return;
    }

    // Prevent negative numbers for numeric inputs
    let updatedValue: string | number = value;
    if (type === "number") {
        updatedValue = Number(value);
        if (updatedValue < 0) updatedValue = 0;
    }

    // Update respective state based on the "id" of the field
    if (id === "complainant") {
        setComplainant((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    } else if (id === "respondent") {
        setRespondent((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    } else if (id === "staff") {
        setdeskStaff((prev:any) => ({
            ...prev,
            [name]: updatedValue,
        }));
    } else {
        setReportInfo((prev:any) => ({
            ...prev,
            [name]: updatedValue,
        }));
    }
};

  
  const deleteForm = () => {
    handleFileDeleteContainer1();
    setReportInfo({
        dateFiled: "",
        timeFiled: "",
        location: "",
        nature: "",
        concern: "",
        status: "",
        specifyNature: "",
        receivedBy: "",
        dateReceived: "",
        timeReceived: "",
        file: null,
      });
      setComplainant({
        fname: "",
        lname: "",
        sex: "",
        age: "",
        contact: "",
        civilStatus: "",
        address: "",
      });
      setRespondent({
        fname: "",
        lname: "",
        sex: "",
        age: "",
        contact: "",
        civilStatus: "",
        address: "",
      });
  }

  const handleBack = () => {
    router.back();
  };



  return (
    <main className="main-container-add">
      


        <div className="main-content-add">

        <button type="button" className="back-button-add" onClick={handleBack}></button>

        <form onSubmit={handleSubmit}>
            <div className="section-1-add">
                <p className="NewOfficial-add"> New Incident</p>

                    <div className="actions-add">
                        <button  type="button" onClick={deleteForm} className="action-delete-add">Delete</button>
                        <button type="submit" className="action-view-add" >Save</button>
                    </div>
                
             </div>
             <input 
                    type="text" 
                    className="search-bar-add" 
                    value={reportInfo.caseNumber}
                    name="caseNumber"
                    id="caseNumber"
                    disabled
                    
                    />

             <div className="section-2-add">

                <div className="section-2-left-side-add">

                    <p >Complainant's Information</p>
                    <p>First Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Complaint's First Name" 
                    value={complainant.fname}
                    name="fname"
                    id="complainant"
                    onChange={handleFormChange}
                    required
                    />
                  <p>Last Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Complaint's First Name" 
                    value={complainant.lname}
                    name="lname"
                    id="complainant"
                    onChange={handleFormChange}
                    required
                    />

                  <p>Sex</p>
                  <select 
                    name="sex" 
                    className="featuredStatus-add" 
                    required
                    id="complainant"
                    value={complainant.sex}
                    onChange={handleFormChange}
                    >
                    <option value="" disabled>Choose A Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>


                    <p>Age</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Age" 
                    value={complainant.age}
                    name="age"
                    id="complainant"
                    onChange={handleFormChange}
                    required
                    />

                    <p>Civil Status</p>
                 
                    <select   className="search-bar-add"    
                    value={complainant.civilStatus} 
                    name="civilStatus"
                    id="complainant"
                    onChange={handleFormChange}
                    required>
                      <option value="" disabled>Choose A Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      
                    </select>

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Address" 
                    value={complainant.address}
                    name="address"
                    id="complainant"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Contact Number" 
                    value={complainant.contact}
                    name="contact"
                    id="complainant"
                    required
                    onChange={handleFormChange}
                    />

                </div>
              
                <div className="section-2-right-side-add">
                  
                <p >Respondent's Information</p>
                    <p>First Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Respondent's First Name" 
                    value={respondent.fname}
                    name="fname"
                    id="respondent"  
                    required
                    onChange={handleFormChange}
                    />
                  <p>Last Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Respondent's Last Name" 
                    value={respondent.lname}
                    name="lname"
                    id="respondent"
                    required
                    onChange={handleFormChange}
                    />

                  <p>Sex</p>
                  <select 
                    id="respondent"
                    name="sex" 
                    className="featuredStatus-add" 
                    required
                    value={respondent.sex}
                    onChange={handleFormChange}
                    >
                    <option value="" disabled>Choose A Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>


                    <p>Age</p>

                    <input 
                    type="text" 
                    id="respondent"
                    className="search-bar-add" 
                    placeholder="Enter Age" 
                    value={respondent.age}
                    name="age"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Civil Status</p>

                    <select   className="search-bar-add"    
                    value={respondent.civilStatus} 
                    name="civilStatus"
                    id="respondent"
                    onChange={handleFormChange}
                    required>
                      <option value="" disabled>Choose A Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      
                    </select>

                    <p>Address</p>

                    <input 
                    type="text" 
                    id="respondent"
                    className="search-bar-add" 
                    placeholder="Enter Address" 
                    value={respondent.address}
                    name="address"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    id="respondent"
                    className="search-bar-add" 
                    placeholder="Enter Contact Number" 
                    value={respondent.contact}
                    name="contact"
                    required
   
                    onChange={handleFormChange}
                    />
                

                </div>

            </div>


              <div className="section-3-add">
                <p className="title-add">Other Information</p>
                
                <div className="bars-add">
                  
                <div className="input-group-add">
                    <p>Nature of Complaint</p>
                    <select 
                    className="featuredStatus-add" 
                    required
                    id="nature" name="nature" 
                    value={reportInfo.nature}
                    onChange={handleFormChange}
                    >
                    <option value="" disabled>Choose A Nature of Incident</option>
                    {departmentId === "Lupon" ? 
                    (<>
                      <option value="Conciliation">Conciliation</option>
                      <option value="Mediation">Mediation</option>
                      <option value="Arbitration">Arbitration</option>
                      <option value="Others">Others</option>
                    </>): 
                    departmentId === "GAD" ?
                    (<>
                      <option value="Physical Abuse">Physical Abuse</option>
                      <option value="Sexual Abuse">Sexual Abuse</option>
                      <option value="Psychological, Enviromental, Verbal Abuse">Psychological, Enviromental, Verbal Abuse</option>
                      <option value="Economic, Financial Abuse">Economic, Financial Abuse</option>
                      <option value="Public Space Sexual Harassment">Public Space Sexual Harassment</option>
                      <option value="Others">Others: (Trafficking, Prostitution, Violaiton of RA9208)</option>
                    </>):
                    departmentId === "BCPC" ? 
                    (<>
                      <option value="Child Abuse">Child Abuse</option>
                      <option value="Child Exploitation">Child Exploitation</option>
                      <option value="Child Trafficking">Child Trafficking</option>
                      <option value="Child Labor">Child Labor</option>
                      <option value="Child Neglect">Child Neglect</option>
                      <option value="Child Abandonment">Child Abandonment</option>
                      <option value="Child Sexual Abuse">Child Sexual Abuse</option>
                      <option value="Child Physical Abuse">Child Physical Abuse</option>
                      <option value="Child Psychological Abuse">Child Psychological Abuse</option>
                      <option value="Child Bullying">Child Bullying</option>
                      <option value="Child Prostitution">Child Prostitution</option>
                      <option value="Others">Others</option>
                    </>):
                    departmentId === "VAWC" && 
                    (<>
                      <option value="Physical Abuse">Physical Abuse</option>
                      <option value="Sexual Abuse">Sexual Abuse</option>
                      <option value="Psychological, Enviromental, Verbal Abuse">Psychological, Enviromental, Verbal Abuse</option>
                      <option value="Economic, Financial Abuse">Economic, Financial Abuse</option>
                      <option value="Public Space Sexual Harassment">Public Space Sexual Harassment</option>
                      <option value="Others">Others: (Trafficking, Prostitution, Violaiton of RA9208)</option>
                    </>)}
                  </select>
                    

                  </div>
                   {reportInfo.nature === "Others" && 
                   (<>
                    <div className="input-group-add">
                        <p>Specify Nature of Complaint</p>
                        <input type="text" className="search-bar-add" placeholder="Enter Nature of Complaint" id="specifyNature" name="specifyNature" 
                        value = {reportInfo.specifyNature} onChange={handleFormChange} required/>
                    </div>
                   </>)}

                    <div className="input-group-add">
                        <p>Date Filed</p>
                        <input type="date" className="search-bar-add" max={currentDate} id="dateFiled" name="dateFiled" 
                        value = {reportInfo.dateFiled} onChange={handleFormChange} required/>
                    </div>

                    <div className="input-group-add">
                        <p>Time Filed</p>
                        <input type="time" className="search-bar-add" id="timeFiled" name="timeFiled" 
                        value = {reportInfo.timeFiled} onChange={handleFormChange} required />
                    </div>

                    <div className="input-group-add">
                        <p>Location</p>
                        <input type="text" className="search-bar-add" placeholder="Enter Location" id="location" name="location" 
                        value = {reportInfo.location} onChange={handleFormChange} required />
                    </div>

                    {departmentId === "GAD" && (
                      <div>
                        <div className="input-group-add">
                          <p>Nos of Male Children Victim/s</p>
                          <input type="number" 
                          className="search-bar-add"
                          min="0"
                          value={reportInfo.nosofMaleChildren}
                          name="nosofMaleChildren"
                          onChange={handleFormChange}
                          required />    
                        </div>

                        <div className="input-group-add">
                          <p>Nos of Female Children Victim/s</p>
                          <input type="number"
                            className="search-bar-add"
                            min="0"
                            value={reportInfo.nosofFemaleChildren}
                            name="nosofFemaleChildren"
                            onChange={handleFormChange}
                            required />    
                        </div>

                      </div>
                    )}
                </div>
                
                <p className="title-add">Complainant/s Recieved By</p>
                <div className="bars-add">
                
                  <div className="input-group-add">

                    <p>Desk Officer First Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Desk Officer First Name" 
                    id="staff"
                    disabled
                    name="fname"
                    value = {deskStaff.fname} onChange={handleFormChange}
                    />

                  </div>

                   <div className="input-group-add">

                    <p>Desk Officer Last Name</p>

                    <input 
                    type="text" 
                    className="search-bar-add" 
                    placeholder="Enter Desk Officer Last Name" 
                    id="staff"
                    disabled
                    name="lname"
                    value = {deskStaff.lname} onChange={handleFormChange}
                    />

                  </div> 
                            
                  <div className="input-group-add">
                        <p>Date Received</p>
                        <input type="date" className="search-bar-add" max={currentDate}  id="dateReceived" name="dateReceived" 
                        value = {reportInfo.dateReceived} onChange={handleFormChange} disabled/>
                    </div>

                    <div className="input-group-add">
                        <p>Time Received</p>
                        <input type="time" className="search-bar-add" id="timeReceived" name="timeReceived" 
                        value = {reportInfo.timeReceived} onChange={handleFormChange} disabled />
                    </div>


                </div>
                   
            </div>



            <div className="section-4-add">

                <div className="section-4-left-side-add">

                  <div className="fields-section-add">
                              <p>Nature of Facts</p>
                                  <textarea 
                                      className="description-add" 
                                      required
                                      placeholder="Enter Nature of Facts of the Complaint"
                                      value={reportInfo.concern}
                                      id="concern"
                                      name="concern"
                                      onChange={handleFormChange}
                                      rows={15}
                               ></textarea>
                    </div>

                 </div>

            <div className="section-4-right-side-add">
              
              
            <div className="title-add">
                     <p> Photo of the Incident (if Applicable)</p>
               </div> 
 
               <div className="file-upload-container-add">
                 <label htmlFor="file-upload1" className="upload-link-add">Click to Upload File</label>
                 <input
                   id="file-upload1"
                   type="file"
                   className="file-upload-input-add"
                   accept=".jpg,.jpeg,.png"
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                     handleFileChangeContainer1(e);
                     handleFormChange(e);
                   }} // Handle file selection
                 />
                 <div className="uploadedFiles-container-add">
                    {filesContainer1.length > 0 && (
                      <div className="file-name-image-display-add">
                        <ul>
                          {filesContainer1.map((file, index) => (
                            <div className="file-name-image-display-indiv-add" key={index}>
                              <li>
                                {file.preview && (
                                  <div className="filename-image-container-add">
                                    <img
                                      src={file.preview}
                                      alt={file.name}
                                      style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                    />
                                  </div>
                                )}
                                {file.name}
                                <div className="delete-container-add">
                                  <button
                                    type="button"
                                    onClick={() => handleFileDeleteContainer1()}
                                    className="delete-button-add"
                                  >
                                    <img
                                      src="/images/trash.png"
                                      alt="Delete"
                                      className="delete-icon-add"
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
           



        </form>

        </div> 

        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={handleConfirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}


    
    </main>
  );
}
