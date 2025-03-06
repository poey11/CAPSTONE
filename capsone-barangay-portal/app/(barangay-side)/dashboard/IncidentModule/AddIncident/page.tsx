"use client"
import "@/CSS/IncidentModule/AddNewIncident.css";
import { ChangeEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ref, uploadBytes } from "firebase/storage";
import { addDoc, collection} from "firebase/firestore";
import { db,storage } from "@/app/db/firebase";

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

  const caseNumber = `${departmentId}-2025-0001`;

  const [reportInfo, setReportInfo] = useState<any>({
    caseNumber: caseNumber,
    dateFiled: "",
    timeFiled: "",
    location: "",
    nature: "",
    concern: "",
    status: "Pending",
    receivedBy: "",
    dateRecieved: "",
    timeRecieved: "",
    file: null,
  });

  const [deskStaff, setdeskStaff] = useState<any>({
    fname: "",
    lname: "",
  })

  
  
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

     // Handle file deletion for container 1
  const handleFileDeleteContainer1 = (fileName: string) => {
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

        // Add document to IncidentReports collection
        const docRef = await addDoc(collection(db, "IncidentReports"), {
            caseNumber: reportInfo.caseNumber,
            dateFiled: reportInfo.dateFiled,
            timeFiled: reportInfo.timeFiled,
            location: reportInfo.location,
            nature: reportInfo.nature,
            concern: reportInfo.concern,
            status: "Pending",
            receivedBy: `${deskStaff.fname} ${deskStaff.lname}`,
            dateRecieved: reportInfo.dateRecieved,
            timeRecieved: reportInfo.timeRecieved,
            file: filename,
            department:departmentId,
        });

        // Add subcollection "Complainant"
        await addDoc(collection(docRef, "Complainant"), {
            // Add fields related to the complainant
            fname: complainant.fname,
            lname: complainant.lname,
            sex: complainant.sex,
            age: complainant.age,
            contact: complainant.contact,
            civilStatus: complainant.civilStatus,
            address: complainant.address,
            
        });

        // Add subcollection "Respondent"
        await addDoc(collection(docRef, "Respondent"), {
            // Add fields related to the respondent
            fname: respondent.fname,
            lname: respondent.lname,
            sex: respondent.sex,
            age: respondent.age,
            contact: respondent.contact,
            civilStatus: respondent.civilStatus,
            address: respondent.address,
        });

        alert("Incident Report Submitted!");
    } catch (e: any) {
        console.log(e);
    }
};



      // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    console.log("complainant", complainant);
    console.log("respondent", respondent);
    console.log("reportInfo", reportInfo);
    console.log("deskStaff", deskStaff);
    // Manually trigger form validation
    const form = event.target as HTMLFormElement;
    if (form.checkValidity()) {
      // Redirect to the Notification page after form submission if validation is successful
      handleUpload();
      deleteForm();
      router.push(`/dashboard/IncidentModule/Department?id=${departmentId}`);
    } else {
      // If the form is invalid, trigger the validation
      form.reportValidity(); // This will show validation messages for invalid fields
    }
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
  
    if (type === "file" && e.target instanceof HTMLInputElement && e.target.files) {
      setReportInfo({
        ...reportInfo,
        file: e.target.files[0],
      });
    } else {
      // Check which state to update based on input field "id"
      const { id } = e.target;
  
      if (id === "complainant") {
        setComplainant({
          ...complainant,
          [name]: value,
        });
      } else if (id === "respondent") {
        setRespondent({
          ...respondent,
          [name]: value||"",
        });
      } else if (id === "staff") {
        setdeskStaff({
          ...deskStaff,
          [name]: value,
        });
      } else {
        setReportInfo({
          ...reportInfo,
          [name]: value,
        });
      }
    }
  };
  
  const deleteForm = () => {
    
    setReportInfo({
        caseNumber: caseNumber,
        dateFiled: "",
        timeFiled: "",
        location: "",
        nature: "",
        concern: "",
        status: "",
        receivedBy: "",
        dateRecieved: "",
        timeRecieved: "",
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
      setdeskStaff({
        fname: "",
        lname: "",
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
    <main className="main-container">
        <div className="main-content">

        <button type="submit" className="back-button" onClick={handleBack}></button>

        <form onSubmit={handleSubmit}>
            <div className="section-1">
                <p className="NewOfficial"> New Incident</p>

                    <div className="actions">
                        <button  type="button" onClick={deleteForm} className="action-delete">Delete</button>
                        <button type="submit" className="action-view">Save</button>
                    </div>
                
             </div>
             <input 
                    type="text" 
                    className="search-bar" 
                    value={reportInfo.caseNumber}
                    name="caseNumber"
                    id="caseNumber"
                    disabled
                    
                    />

             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>First Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
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
                    className="search-bar" 
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
                    className="featuredStatus" 
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
                    className="search-bar" 
                    placeholder="Enter Age" 
                    value={complainant.age}
                    name="age"
                    id="complainant"
                    onChange={handleFormChange}
                    required
                    />

                    <p>Civil Status</p>
                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Civil Status" 
                    value={complainant.civilStatus}
                    name="civilStatus"
                    id="complainant"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
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
                    className="search-bar" 
                    placeholder="Enter Contact Number" 
                    value={complainant.contact}
                    name="contact"
                    id="complainant"
                    required
                    onChange={handleFormChange}
                    />

                </div>
              
                <div className="section-2-right-side">
                  
                <p >Respondent's Information</p>
                    <p>First Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
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
                    className="search-bar" 
                    placeholder="Enter Respondent's First Name" 
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
                    className="featuredStatus" 
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
                    className="search-bar" 
                    placeholder="Enter Age" 
                    value={respondent.age}
                    name="age"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Civil Status</p>
                    <input 
                    type="text" 
                    id="respondent"
                    className="search-bar" 
                    placeholder="Enter Civil Status" 
                    value={respondent.civilStatus}
                    name="civilStatus"
                    required
                    onChange={handleFormChange}
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    id="respondent"
                    className="search-bar" 
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
                    className="search-bar" 
                    placeholder="Enter Contact Number" 
                    value={respondent.contact}
                    name="contact"
                    required
                    onChange={handleFormChange}
                    />
                

                </div>

            </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                
                <div className="bars">
                    <div className="input-group">
                        <p>Nature of Complaint</p>
                        <input type="text" className="search-bar" placeholder="Enter Nature of Complaint"  id="nature" name="nature" 
                        value = {reportInfo.nature} onChange={handleFormChange} required/>
                    </div>

                    <div className="input-group">
                        <p>Date Filed</p>
                        <input type="date" className="search-bar" placeholder="Enter Date" id="dateFiled" name="dateFiled" 
                        value = {reportInfo.dateFiled} onChange={handleFormChange} required/>
                    </div>

                    <div className="input-group">
                        <p>Time Filed</p>
                        <input type="time" className="search-bar" placeholder="Enter Time" id="timeFiled" name="timeFiled" 
                        value = {reportInfo.timeFiled} onChange={handleFormChange} required />
                    </div>

                    <div className="input-group">
                        <p>Location</p>
                        <input type="text" className="search-bar" placeholder="Enter Location" id="location" name="location" 
                        value = {reportInfo.location} onChange={handleFormChange} required />
                    </div>
                </div>
                
                <p className="title">Complainant/s Recieved By</p>
                <div className="bars">
                
                  <div className="input-group">

                    <p>Desk Officer First Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Desk Officer First Name" 
                    id="staff"
                    required
                    name="fname"
                    value = {deskStaff.fname} onChange={handleFormChange}
                    />

                  </div>

                   <div className="input-group">

                    <p>Desk Officer Last Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Desk Officer Last Name" 
                    id="staff"
                    required
                    name="lname"
                    value = {deskStaff.lname} onChange={handleFormChange}
                    />

                  </div> 
                            
                  <div className="input-group">
                    <p>Date Signed</p>

                    <input 
                    type="Date" 
                    className="search-bar" 
                    id="dateRecieved"
                    name="dateRecieved"
                    required
                    value = {reportInfo.dateRecieved} onChange={handleFormChange}
                    /> 
                  </div>

                  <div className="input-group">
                    <p>Time Signed</p>

                    <input 
                    type="time" 
                    className="search-bar" 
                    required
                    id="timeRecieved"
                    name="timeRecieved"
                    value = {reportInfo.timeRecieved} onChange={handleFormChange}
                    /> 
                  </div>

                </div>
                   
            </div>



            <div className="section-4">

                <div className="section-4-left-side">

                  <div className="fields-section">
                              <p>Nature of Facts</p>
                                  <textarea 
                                      className="description" 
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

            <div className="section-4-right-side">

              <div className="title">
                    <p> Photo (If Applicable)</p>
              </div> 
            
              <div className="file-upload-container">
              <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
                 <input
                   id="file-upload1"
                   type="file"
                   className="file-upload-input"
                   accept=".jpg,.jpeg,.png"
                   value={reportInfo.file?.name || ""}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                     handleFileChangeContainer1(e);
                      handleFormChange(e);
                   }} // Handle file selection
                 />
                 <div className="uploadedFiles-container">
                   {filesContainer1.length > 0 && (
                     <div className="file-name-image-display">
                       <ul>
                         {filesContainer1.map((file, index) => (
                           <div className="file-name-image-display-indiv" key={index}>
                             <li>
                               {file.preview && (
                                 <div className="filename-image-container">
                                   <img
                                     src={file.preview}
                                     alt={file.name}
                                     style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                   />
                                 </div>
                               )}
                               {file.name}
                               <div className="delete-container">
                                 <button
                                   type="button"
                                   onClick={() => handleFileDeleteContainer1(file.name)}
                                   className="delete-button"
                                 >
                                   <img
                                     src="/images/trash.png"
                                     alt="Delete"
                                     className="delete-icon"
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

    
    </main>
  );
}
