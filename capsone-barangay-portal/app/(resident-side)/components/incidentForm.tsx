"use client"
import "@/CSS/IncidentReport/IncidentReport.css";
import { ChangeEvent, useState } from "react"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/authContext";
import { deleteObject,ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, deleteDoc,doc, setDoc } from "firebase/firestore";
import { auth,db,storage } from "@/app/db/firebase";
interface reportProps {
    firstname: string;
    lastname: string;
    concerns: string;
    date: string;
    time: string;
    address: string;
    file: File | null;
    reportID: string;
    department: string;
}


const incidentForm:React.FC = () => {
  const router = useRouter();
  const {user} = useAuth();
  const currentUser = user?.uid || "Guest";
  const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
  const [incidentReport, setIncidentReport] = useState<reportProps>({
      firstname: "",
      lastname: "",
      concerns: "",
      date: "",
      time: "",
      address: "",
      file: null,
      reportID: "",
      department: "",
  });

    const clearForm = () => {
      if(filesContainer1.length > 0){
        if(filesContainer1[0].name){  
          handleFileDeleteContainer1(filesContainer1[0].name);
        }
      }
      setIncidentReport({
        firstname: "",
        lastname: "",
        concerns: "",
        date: "",
        time: "",
        address: "",
        file: null,
        reportID: "",
        department: "",
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
      const selectedFiles = event.target.files;
      if (selectedFiles) {
        const fileArray = Array.from(selectedFiles).map((file) => {
          const preview = URL.createObjectURL(file);
          return { name: file.name, preview };
        });
        setFilesContainer1((prevFiles) => [...prevFiles, ...fileArray]); // Append new files to the first container
      }
    };

    // Handle file deletion for container 1
    const handleFileDeleteContainer1 = (fileName: string) => {
      setFilesContainer1((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
    
      // Reset file input to ensure re-upload works
      const fileInput = document.getElementById('file-upload1') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    };
    

    const handleReportUpload = async (incidentReport: reportProps) => {
      try{
        let filename = "";
        if(incidentReport.file){
          const timeStamp = Date.now().toString();
          const fileExtention = incidentReport.file.name.split('.').pop();
          filename = `incident_report_${currentUser}.${timeStamp}.${fileExtention}`;
          const storageRef = ref(storage, `IncidentReports/${filename}`);
          await uploadBytes(storageRef, incidentReport.file);
        }
        
        const docRef = collection(db, "IncidentReports", );
        await addDoc(docRef, {
          firstname: incidentReport.firstname,
          lastname: incidentReport.lastname,
          concerns: incidentReport.concerns,
          date: incidentReport.date,
          time: incidentReport.time,
          address: incidentReport.address,
          file: filename,
          reportID: currentUser, 
        });
        
        alert("Incident Report Submitted!");

      }
      catch(e:string|any){
        console.log(e);
      }
     
    }


    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); 
      const form = event.target as HTMLFormElement;
      if (form.checkValidity()) {
        handleReportUpload(incidentReport);
        clearForm(); // Clear the form after submission
        router.push('/IncidentReport/Notification'); 
      } else {
        form.reportValidity(); 
      }
    };




    return(
      <main className="main-container">
        <div className="Page">
          <p>File an Incident Report</p>
        </div>

        <div className="register-section">
          <h1>Minor Incident Report</h1>
          <form className="register-form" onSubmit={handleSubmit}> {/* Use onSubmit to trigger the redirect */}
            <div className="form-group">
              <label htmlFor="firstname" className="form-label">First Name</label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                className="form-input"
                required
                placeholder="Enter First Name"
                value={incidentReport.firstname}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="form-group">
              <label htmlFor="lastname" className="form-label">Last Name</label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                className="form-input"
                required
                placeholder="Enter Last Name"
                value={incidentReport.lastname}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="form-group">
              <label htmlFor="concerns" className="form-label">Concerns</label>
              <input
                type="text"
                id="concerns"
                name="concerns"
                className="form-input"
                required
                placeholder="Enter your concerns"
                value={incidentReport.concerns}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="form-group">
              <label htmlFor="date" className="form-label">Date of Incident</label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-input"
                required
                placeholder="Enter Date of Incident"
                value={incidentReport.date}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="form-group">
              <label htmlFor="time" className="form-label">Time of Incident</label>
              <input
                type="time"
                id="time"
                name="time"
                className="form-input"
                required
                placeholder="Enter Time of Incident"
                value={incidentReport.time}
                onChange={handleFormChange}
              />
            </div>


            <div className="form-group">
              <label htmlFor="address" className="form-label">Address of Incident</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-input"
                required
                placeholder="Enter Location"
                value={incidentReport.address}
                onChange={handleFormChange}
              />
            </div>
        
            <div className="signature/printedname-container">
              <label className="form-label">Upload Proof of Incident (If Applicable)</label>
        
              <div className="file-upload-container">
                <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  className="file-upload-input"
                  multiple
                  accept=".jpg,.jpeg,.png"
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
                
            {/* Submit button */}
            <button type="submit" className="submit-button">Submit</button>
          </form>
        </div>
                
                
                
    </main>
    )
}

export default incidentForm;