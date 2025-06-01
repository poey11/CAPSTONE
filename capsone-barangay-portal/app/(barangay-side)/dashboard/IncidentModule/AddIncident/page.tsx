"use client"
import "@/CSS/IncidentModule/AddNewIncident.css";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, getDocs, query, where} from "firebase/firestore";
import { db,storage } from "@/app/db/firebase";
import {getAllSpecificDocument} from "@/app/helpers/firestorehelper";
import {isPastDate,isToday,isPastOrCurrentTime, getLocalDateString, isValidPhilippineMobileNumber, getLocalTimeString} from "@/app/helpers/helpers";
import { useSession } from "next-auth/react";
import {customAlphabet} from "nanoid";
import { useRef } from "react";



 interface userProps{
  fname: string;
  lname: string;  
  sex: string;
  age: string;
  civilStatus: string;
  address: string;
  contact: string;
  residentId: string,

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
    residentId: "",

  });
  const [respondent, setRespondent] = useState<userProps>({
    fname: "",
    lname: "",
    sex: "",
    age: "",
    contact: "",
    civilStatus: "",
    address: "",
    residentId: "",

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

  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [showComplainantResidentsPopup, setShowComplainantResidentsPopup] = useState(false);
  const [showRespondentResidentsPopup, setShowRespondentResidentsPopup] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const employerPopupRef = useRef<HTMLDivElement>(null);

  const [isComplainantResidentSelected, setIsComplainantResidentSelected] = useState(false);
  const [isRespondentResidentSelected, setIsRespondentResidentSelected] = useState(false);


  // for fetching residents
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentsCollection = collection(db, "Residents");
            const residentsSnapshot = await getDocs(residentsCollection);
            const residentsList = residentsSnapshot.docs.map(doc => {
                const data = doc.data() as {
                    residentNumber: string;
                    firstName: string;
                    middleName: string;
                    lastName: string;
                    address: string;
                    sex: string;
                    dateOfBirth: string;
                    age: number;
                    identificationFileURL: string
                };
    
                return {
                    id: doc.id,
                    ...data
                };
            });
    
            setResidents(residentsList);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
  
    fetchResidents();
  }, []);

    // Show complainant resident popup on input focus
    const handleComplainantsClick = () => {
      setShowComplainantResidentsPopup(true);
    };
  
    // Close popup when clicking outside
    useEffect(() => {
      const handleClickComplainantOutside = (event: MouseEvent) => {
        if (
          employerPopupRef.current &&
          !employerPopupRef.current.contains(event.target as Node)
        ) {
          setShowComplainantResidentsPopup(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickComplainantOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickComplainantOutside);
      };
    }, []);

    const filteredComplainantResidents = residents.filter((resident) =>
    `${resident.firstName} ${resident.middleName} ${resident.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // respondent resident search pop up
  const handleRespondentsClick = () => {
    setShowRespondentResidentsPopup(true);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickRespondentOutside = (event: MouseEvent) => {
      if (
        employerPopupRef.current &&
        !employerPopupRef.current.contains(event.target as Node)
      ) {
        setShowRespondentResidentsPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickRespondentOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickRespondentOutside);
    };
  }, []);

  const filteredRespondentResidents = residents.filter((resident) =>
  `${resident.firstName} ${resident.middleName} ${resident.lastName}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);


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
            hearing:1,
            generatedHearingSummons:0,
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
                residentId: complainant.residentId,
            },
            respondent: {
                fname: respondent.fname,
                lname: respondent.lname,
                sex: respondent.sex,
                age: respondent.age,
                contact: respondent.contact,
                civilStatus: respondent.civilStatus,
                address: respondent.address,
                residentId: respondent.residentId,
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

const delayedSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setTimeout(() => {
    handleSubmit(e);
  }, 0); 
};

const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault(); 

  console.log("Complainant at submit:", complainant);
  console.log("Respondent at submit:", respondent);
  console.log("Report at submit:", reportInfo);
  console.log("desk staff at submit:", deskStaff);

  setShowFieldErrors(true);


  const form = event.target as HTMLFormElement;
  if (form.checkValidity()) {

    setShowFieldErrors(true); // Activate red borders for invalid fields

    // Helper to check if a value is empty (null, undefined, or empty string)
    const isEmpty = (value: any) =>
    value === null || value === undefined || value.toString().trim() === "";
  
  const isValidPerson = (person: typeof complainant | typeof respondent) =>
    !isEmpty(person.fname) &&
    !isEmpty(person.lname) &&
    !isEmpty(person.sex) &&
    !isEmpty(person.age) &&
    !isEmpty(person.civilStatus) &&
    !isEmpty(person.address) &&
    !isEmpty(person.contact);
  
  // Validate Complainant
  if (!isValidPerson(complainant)) {
    setPopupErrorMessage("Please fill out all required complainant fields.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }
  
  // Validate Respondent
  if (!isValidPerson(respondent)) {
    setPopupErrorMessage("Please fill out all required respondent fields.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }
  
  
    // Validate Report Info
    if (
      isEmpty(reportInfo.caseNumber) ||
      isEmpty(reportInfo.dateFiled) ||
      isEmpty(reportInfo.timeFiled) ||
      isEmpty(reportInfo.location) ||
      isEmpty(reportInfo.nature) ||
      isEmpty(reportInfo.concern) ||
      isEmpty(reportInfo.status) ||
      isEmpty(reportInfo.dateReceived) ||
      isEmpty(reportInfo.timeReceived)
    ) {
      setPopupErrorMessage("Please fill out all required fields.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }
  
    // If nature is "Other", make sure specifyNature is filled
    if (reportInfo.nature === "Other" && isEmpty(reportInfo.specifyNature)) {
      setPopupErrorMessage("Please specify the nature of the concern.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }
  
    // Validate GAD-specific child counts
    if (reportInfo.departmentId === "GAD") {
      if (isEmpty(reportInfo.nosofMaleChildren) || isEmpty(reportInfo.nosofFemaleChildren)) {
        setPopupErrorMessage("Please provide the number of children for GAD reports.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
    }
  
    // Validate Desk Staff
    if (isEmpty(deskStaff.fname) || isEmpty(deskStaff.lname)) {
      setPopupErrorMessage("Please provide the desk staff's full name.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }

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
        residentId: "",
      });
      setRespondent({
        fname: "",
        lname: "",
        sex: "",
        age: "",
        contact: "",
        civilStatus: "",
        address: "",
        residentId: "",
      });
  }

  const handleBack = () => {
    router.back();
  };

  const [activeSection, setActiveSection] = useState("complainant");


  return (
    <main className="main-container-add">
      


        <div className="main-content-add">

       

        <form onSubmit={delayedSubmit}>

            <div className="section-1-add">

              <div className="section-1-left-side-add">

                <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-add"/> 
                </button>

                <h1> Add New Incident </h1>
              </div>

                <div className="actions-add">
                   <button  type="button" onClick={deleteForm} className="action-delete-add">Delete</button>
                   <button type="submit" className="action-view-add" >Save</button>
                 </div>
          
             </div>


             <input 
                    type="text" 
                    className="search-bar-add-case" 
                    value={reportInfo.caseNumber}
                    name="caseNumber"
                    id="caseNumber"
                    disabled
                    
              />
              
            
            <div className="add-incident-bottom-section">

       
                <nav className="add-incident-info-toggle-wrapper">
                {["complainant", "respondent", "others","desk"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn-add ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "complainant" && "Complainant Info"}
                      {section === "respondent" && "Respondent Info"}
                      {section === "others" && "Other Info"}
                      {section === "desk" && "Desk Officer Info"}
                    </button>
                  ))}
                </nav>


            <div className="add-incindent-bottom-section-scroll">

            <div className="add-incident-section-2">


            {activeSection === "complainant" && (
             <>

              <div className="add-incident-section-top-side">

                  <div className="fields-section-add">
                      <input type="text"  className="select-resident-input-field" placeholder="Select Complainant" onClick={handleComplainantsClick} />
                  </div>

                          {/* button to clear if the complainant is from residents */}
                          {isComplainantResidentSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          setComplainant({
                            residentId: '',
                            fname: '',
                            lname: '',
                            sex: '',
                            age: '',
                            civilStatus: '',
                            address: '',
                            contact: '',
                          });
                          setIsComplainantResidentSelected(false);
                        }}
                        className="clear-button-add"
                      >
                        Clear Complainant
                      </button>
                    )}
              </div>

            <div className="add-incident-full-top">

  

  
                <div className="add-incident-section-left-side">
         
                  <div className="fields-section-add">
                     <p>Last Name<span className="required">*</span></p>
                      <input 
                      type="text" 
                      className={`add-incident-input-field ${showFieldErrors && !complainant.lname.trim() ? "input-error" : ""}`}
                      placeholder="Enter Complaint's Last Name" 
                      value={complainant.lname}
                      name="lname"
                      id="complainant"
                      onChange={handleFormChange}
                      required
                      disabled={isComplainantResidentSelected}
                      />
                 </div>

                  <div className="fields-section-add">
                    <p>Sex<span className="required">*</span></p>
                      <select 
                      name="sex" 
                      className={`add-incident-input-field ${showFieldErrors && !complainant.sex.trim() ? "input-error" : ""}`}
                      required
                      id="complainant"
                      value={complainant.sex}
                      onChange={handleFormChange}
                      disabled={isComplainantResidentSelected}
                      >
                      <option value="" disabled>Choose A Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="fields-section-add">
                      <p>Civil Status<span className="required">*</span></p>              
                      <select   
                      className={`add-incident-input-field  ${showFieldErrors && !complainant.civilStatus.trim() ? "input-error" : ""}`}   
                      value={complainant.civilStatus} 
                      name="civilStatus"
                      id="complainant"
                      onChange={handleFormChange}
                      disabled={isComplainantResidentSelected}
                      required>
                        <option value="" disabled>Choose A Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Divorced">Divorced</option>
                        
                      </select>

                  </div>

                  <div className="fields-section-add">
                       <p>Contact Information<span className="required">*</span></p>
                       <input 
                        type="text" 
                        className={`add-incident-input-field ${showFieldErrors && !complainant.contact.trim() ? "input-error" : ""}`}   
                        placeholder="Enter Contact Number" 
                        value={complainant.contact}
                        name="contact"
                        id="complainant"
                        required
                        onChange={handleFormChange}
                        disabled={isComplainantResidentSelected}
                        />
                  </div>

                </div>

                <div className="add-incident-section-right-side">

                  <div className="fields-section-add">
                       <p>First Name<span className="required">*</span></p>
                       <input 
                        type="text" 
                        className={`add-incident-input-field ${showFieldErrors && !complainant.fname.trim() ? "input-error" : ""}`}
                        placeholder="Enter Complaint's First Name" 
                        value={complainant.fname}
                        name="fname"
                        id="complainant"
                        onChange={handleFormChange}
                        required
                        disabled={isComplainantResidentSelected}
                        />
                  </div>

                  <div className="fields-section-add">
                       <p>Age<span className="required">*</span></p>
                       <input 
                        type="number" 
                        className={`add-incident-input-field`}
                        placeholder="Enter Age" 
                        value={complainant.age}
                        name="age"
                        id="complainant"
                        onChange={handleFormChange}
                        required
                        disabled={isComplainantResidentSelected}
                        />
                  </div>

                  <div className="fields-section-add">
                       <p>Address<span className="required">*</span></p>
                       <input 
                        type="text" 
                        className={`add-incident-input-field ${showFieldErrors && !complainant.address.trim() ? "input-error" : ""}`}    
                        placeholder="Enter Address" 
                        value={complainant.address}
                        name="address"
                        id="complainant"
                        required
                        onChange={handleFormChange}
                        disabled={isComplainantResidentSelected}
                        />
                  </div>

                </div>

                </div>
                </>
                      )}


            {activeSection === "respondent" && (
             <>
              <div className="add-incident-section-top-side">

                  <div className="fields-section-add">
                      <input type="text"  className="select-resident-input-field" placeholder="Select Respondent" onClick={handleRespondentsClick} />
                  </div>

                    {/* button to clear if the respondent is from residents */}
                    {isRespondentResidentSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          setRespondent({
                            residentId: '',
                            fname: '',
                            lname: '',
                            sex: '',
                            age: '',
                            civilStatus: '',
                            address: '',
                            contact: '',
                          });
                          setIsRespondentResidentSelected(false);
                        }}
                        className="clear-button-add"
                      >
                        Clear Respondent
                      </button>
                    )}

              </div>


                <div className="add-incident-full-top">



                    <div className="add-incident-section-left-side">

                      <div className="fields-section-add">
                        <p>Last Name<span className="required">*</span></p>
                          <input 
                            type="text" 
                            className={`add-incident-input-field ${showFieldErrors && !respondent.lname.trim() ? "input-error" : ""}`}   
                            placeholder="Enter Respondent's Last Name" 
                            value={respondent.lname}
                            name="lname"
                            id="respondent"
                            required
                            onChange={handleFormChange}
                            disabled={isRespondentResidentSelected}
                            />
                      </div>

                      <div className="fields-section-add">
                         <p>Sex<span className="required">*</span></p>
                         <select 
                          id="respondent"
                          name="sex" 
                          className={`add-incident-input-field ${showFieldErrors && !respondent.sex.trim() ? "input-error" : ""}`}   
                          required
                          value={respondent.sex}
                          onChange={handleFormChange}
                          disabled={isRespondentResidentSelected}
                          >
                          <option value="" disabled>Choose A Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>

                      </div>

                      <div className="fields-section-add">
                          <p>Civil Status<span className="required">*</span></p>
                          <select   
                          className={`add-incident-input-field ${showFieldErrors && !respondent.civilStatus.trim() ? "input-error" : ""}`}   
                          value={respondent.civilStatus} 
                          name="civilStatus"
                          id="respondent"
                          onChange={handleFormChange}
                          required
                          disabled={isRespondentResidentSelected}
                          >
                            <option value="" disabled>Choose A Civil Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                            <option value="Divorced">Divorced</option>
                            
                          </select>
                      </div>

                      <div className="fields-section-add">
                          <p>Contact Information<span className="required">*</span></p>
                          <input 
                          type="text" 
                          id="respondent"
                          className={`add-incident-input-field ${showFieldErrors && !respondent.contact.trim() ? "input-error" : ""}`}   
                          placeholder="Enter Contact Number" 
                          value={respondent.contact}
                          name="contact"
                          required
        
                          onChange={handleFormChange}
                          disabled={isRespondentResidentSelected}

                          />

                      </div>

                    </div>


                    <div className="add-incident-section-right-side">

                      <div className="fields-section-add">
                         <p>First Name<span className="required">*</span></p>
                         <input 
                          type="text" 
                          className={`add-incident-input-field ${showFieldErrors && !respondent.fname.trim() ? "input-error" : ""}`}   
                          placeholder="Enter Respondent's First Name" 
                          value={respondent.fname}
                          name="fname"
                          id="respondent"  
                          required
                          onChange={handleFormChange}
                          disabled={isRespondentResidentSelected}
                          />
                      </div>

                      <div className="fields-section-add">
                          <p>Age<span className="required">*</span></p>
                          <input 
                            type="number" 
                            id="respondent"
                            className={`add-incident-input-field`}   
                            placeholder="Enter Age" 
                            value={respondent.age}
                            name="age"
                            required
                            onChange={handleFormChange}
                            disabled={isRespondentResidentSelected}

                            />
                      </div>

                      <div className="fields-section-add">
                          <p>Address<span className="required">*</span></p>
                          <input 
                            type="text" 
                            id="respondent"
                            className={`add-incident-input-field ${showFieldErrors && !respondent.address.trim() ? "input-error" : ""}`}   
                            placeholder="Enter Address" 
                            value={respondent.address}
                            name="address"
                            required
                            onChange={handleFormChange}
                            disabled={isRespondentResidentSelected}
                            />


                      </div>
                        
                        
                    </div>



                </div>
              </>
            )}

              

        {activeSection === "others" && (
          <>

          <div className="add-incident-full-top">
            

          <div className="add-incident-section-left-side">

              <div className="fields-section-add">
                  <p>Nature of Complaint<span className="required">*</span></p>

                  <select 
                    className="add-incident-input-field" 
                    required
                    id="nature" name="nature" 
                    value={reportInfo.nature}
                    onChange={handleFormChange}
                    >
                    <option value="" disabled>Choose A Nature of Incident</option>
                    {departmentId === "Lupon" ? 
                    (<>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
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
                  
                  <div className="fields-section-add">
                      <p>Specify Nature of Complaint<span className="required">*</span></p>
                      <input type="text" className="add-incident-input-field" placeholder="Enter Nature of Complaint" id="specifyNature" name="specifyNature" 
                      value = {reportInfo.specifyNature} onChange={handleFormChange} required/>
                  </div>
                       
                   </>)}

                   <div className="fields-section-add">
                        <p>Time Filed<span className="required">*</span></p>
                        <input type="time" className="add-incident-input-field" id="timeFiled" name="timeFiled" 
                        value = {reportInfo.timeFiled} onChange={handleFormChange} required />
                   </div>


                   <div className="fields-section-add">
                  <p>Date Filed<span className="required">*</span></p>
                  <input type="date" className="add-incident-input-field" max={currentDate} id="dateFiled" name="dateFiled" 
                    value = {reportInfo.dateFiled} onChange={handleFormChange} required/>
              </div>

              <div className="fields-section-add">
                  <p>Location<span className="required">*</span></p>
                  <input type="text" className="add-incident-input-field" placeholder="Enter Location" id="location" name="location" 
                  value = {reportInfo.location} onChange={handleFormChange} required />

              </div>


          
          </div>


          <div className="add-incident-section-right-side">


          <div className="box-container-outer-proof">
                    <div className="title-proof">
                          Proof of Incident
                    </div>

                    <div className="box-container-proof">

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

          </div>

          </div>


        {departmentId === "GAD" && (
                  <div className="add-incident-GAD-section">
            
                                <div className="fields-section-add">
                                  <p>Nos of Male Children Victim/s<span className="required">*</span></p>
                                  <input type="number" 
                                  className="add-incident-input-field"
                                  min="0"
                                  value={reportInfo.nosofMaleChildren}
                                  name="nosofMaleChildren"
                                  onChange={handleFormChange}
                                  required />    
                                </div>

                                <div className="fields-section-add">
                                  <p>Nos of Female Children Victim/s<span className="required">*</span></p>
                                  <input type="number"
                                    className="add-incident-input-field"
                                    min="0"
                                    value={reportInfo.nosofFemaleChildren}
                                    name="nosofFemaleChildren"  
                                    onChange={handleFormChange}
                                    required />    
                                </div>
                  </div>
        )}


          <div className="add-incident-section-bottom-side">

            <div className="box-container-outer-resclassification-add">
                    <div className="title-remarks-add">
                        <p>Nature of Facts<span className="required">*</span></p>
                    </div>

                    <div className="box-container-remarks-add">
                    <textarea 
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
                  

            </div>



          </>
        )}

      {activeSection === "desk" && (
          <>

      <div className="add-incident-full-top">

          <div className="add-incident-section-left-side">

              <div className="fields-section-add">
                  <p>Desk Officer First Name<span className="required">*</span></p>
                  <input 
                    type="text" 
                    className="add-incident-input-field" 
                    placeholder="Enter Desk Officer First Name" 
                    id="staff"
                    disabled
                    name="fname"
                    value = {deskStaff.fname} onChange={handleFormChange}
                    />

              </div>

              <div className="fields-section-add">
                  <p>Date Received<span className="required">*</span></p>                    
                  <input type="date" className="add-incident-input-field" max={currentDate}  id="dateReceived" name="dateReceived" 
                  value = {reportInfo.dateReceived} onChange={handleFormChange} disabled/>

              </div>

          </div>


            <div className="add-incident-section-right-side">

                <div className="fields-section-add">
                    <p>Desk Officer Last Name<span className="required">*</span></p>
                    <input 
                    type="text" 
                    className="add-incident-input-field" 
                    placeholder="Enter Desk Officer Last Name" 
                    id="staff"
                    disabled
                    name="lname"
                    value = {deskStaff.lname} onChange={handleFormChange}
                    />

                </div>


                <div className="fields-section-add">
                     <p>Time Received<span className="required">*</span></p>
                     <input type="time" className="add-incident-input-field" id="timeReceived" name="timeReceived" 
                        value = {reportInfo.timeReceived} onChange={handleFormChange} disabled />
                </div>

            </div>


      </div>


        </>
        )}
              
      
  
          
           
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


 {/* for complainant search popup */}
{showComplainantResidentsPopup && (
      <div className="kasambahay-employer-popup-overlay">
        <div className="kasambahay-employer-popup" ref={employerPopupRef}>
          <h2>Residents List</h2>
          <h1>* Please select Resident's Name *</h1>

          <input
            type="text"
            placeholder="Search Resident's Name"
            className="employer-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="employers-list">
            {residents.length === 0 ? (
              <p>No residents found.</p>
            ) : (
              <table className="employers-table">
                <thead>
                  <tr>
                    <th>Resident Number</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                  </tr>
                </thead>
                <tbody>
                {filteredComplainantResidents.map((resident) => (
            <tr
              key={resident.id}
              className="employers-table-row"
              onClick={async () => {
                try {
                  
                  setComplainant({
                    ...complainant,
                    residentId: resident.id,
                    lname: resident.lastName || '',
                    fname: resident.firstName || '',
                    sex: resident.sex || '',
                    age: resident.age || '',
                    civilStatus: resident.civilStatus || '',
                    address: resident.address || '',
                    contact: resident.contactNumber || '',
                  });
                  setIsComplainantResidentSelected(true);
                  setShowComplainantResidentsPopup(false);

                  setTimeout(() => {
                    console.log("Complainant updated:", resident);
                  }, 0);
                } catch (error) {
                  setPopupErrorMessage("An error occurred. Please try again.");
                  setShowErrorPopup(true);
                  setTimeout(() => {
                    setShowErrorPopup(false);
                  }, 3000);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <td>{resident.residentNumber}</td>
              <td>{resident.firstName}</td>
              <td>{resident.middleName}</td>
              <td>{resident.lastName}</td>
            </tr>
          ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}

 {/* for respondent search popup */}
      {showRespondentResidentsPopup && (
      <div className="kasambahay-employer-popup-overlay">
        <div className="kasambahay-employer-popup" ref={employerPopupRef}>
          <h2>Residents List</h2>
          <h1>* Please select Respondent's Name *</h1>

          <input
            type="text"
            placeholder="Search Resident's Name"
            className="employer-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="employers-list">
            {residents.length === 0 ? (
              <p>No residents found.</p>
            ) : (
              <table className="employers-table">
                <thead>
                  <tr>
                    <th>Resident Number</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                  </tr>
                </thead>
                <tbody>
                {filteredRespondentResidents.map((resident) => (
            <tr
              key={resident.id}
              className="employers-table-row"
              onClick={async () => {
                try {
                  
                  setRespondent({
                    ...respondent,
                    residentId: resident.id,
                    lname: resident.lastName || '',
                    fname: resident.firstName || '',
                    sex: resident.sex || '',
                    age: resident.age || '',
                    civilStatus: resident.civilStatus || '',
                    address: resident.address || '',
                    contact: resident.contactNumber || '',
                  });
                  setIsRespondentResidentSelected(true);
                  setShowRespondentResidentsPopup(false);

                  setTimeout(() => {
                    console.log("Respondent updated:", resident);
                  }, 0);
                } catch (error) {
                  setPopupErrorMessage("An error occurred. Please try again.");
                  setShowErrorPopup(true);
                  setTimeout(() => {
                    setShowErrorPopup(false);
                  }, 3000);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <td>{resident.residentNumber}</td>
              <td>{resident.firstName}</td>
              <td>{resident.middleName}</td>
              <td>{resident.lastName}</td>
            </tr>
          ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}
      

    
    </main>
  );
}
