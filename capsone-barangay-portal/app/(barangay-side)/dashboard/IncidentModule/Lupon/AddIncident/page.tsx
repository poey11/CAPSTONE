"use client"
import "@/CSS/IncidentModule/AddNewIncident.css";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface ComplainantProps{
  name: string;
  sex: string;
  age: string;
  contact: string;
}

interface reportInfoProps{
  caseNumber: string;
  date: string;
  time: string;
  location: string;
  nature: string;
  concern: string;
  file:File | null;
}



export default function AddLuponIncident() {
  const [complainant, setComplainant] = useState<ComplainantProps>({
    name: "",
    sex: "",
    age: "",
    contact: "",
  });

  const [reportInfo, setReportInfo] = useState<reportInfoProps>({
    caseNumber: "",
    date: "",
    time: "",
    location: "",
    nature: "",
    concern: "",
    file: null,
  });

  const [staff, setStaff] = useState<ComplainantProps>({
    name: "",
    sex: "",
    age: "",
    contact: "",  
  })

  const router = useRouter();
 
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

      // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission
      console.log("complaint info",complainant)
      console.log("report info", reportInfo)
      console.log("lf info", staff)
      // Manually trigger form validation
      // const form = event.target as HTMLFormElement;
      // if (form.checkValidity()) {
      //   // Redirect to the Notification page after form submission if validation is successful
      // } else {
      //   // If the form is invalid, trigger the validation
      //   form.reportValidity(); // This will show validation messages for invalid fields
      // }
    };

     const handleFormChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      if(type === "file" && e.target instanceof HTMLInputElement && e.target.files){
        setReportInfo({
          ...reportInfo,
          file: e.target.files[0]
        })
      }
      else{
        setReportInfo({
          ...reportInfo,
          [name]: value
        })
        setComplainant({
          ...complainant,
          [name]: value
        })
      }

    }

    const deleteForm = () => {
      setReportInfo({
        caseNumber: "",
        date: "",
        time: "",
        location: "",
        nature: "",
        concern: "",
        file: null,
      });
      setComplainant({
        name: "",
        sex: "",
        age: "",
        contact: "",
      });
      setStaff({
        name: "",
        sex: "",
        age: "",
        contact: "",
      });
    }

    const handleAddLupon = () => {
      router.push("/dashboard/IncidentModule/Lupon");
    };
  

  return (
    <main className="main-container">

        
        <div className="main-content">
            

        <button type="submit" className="back-button" onClick={handleAddLupon}></button>

        <form onSubmit={handleSubmit}>
            <div className="section-1">
                <p className="NewOfficial"> New Incident</p>

                    <div className="actions">
                        <button onClick={deleteForm} className="action-delete">Delete</button>
                        <button type="submit" className="action-view">Save</button>
                    </div>
                
             </div>
             <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Incident Case #" 
                    value={reportInfo.caseNumber}
                    name="caseNumber"
                    onChange={handleFormChange}
                    />

             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Complaint's Name" 
                    value={complainant.name}
                    name="name"
                    onChange={handleFormChange}
                    />

                  <p>Sex</p>
                  <select 
                    id="sex" 
                    name="sex" 
                    className="featuredStatus" 
                    required
                    value={complainant.sex}
                    onChange={handleFormChange}
                    >
                    <option value="" disabled>Choose</option>
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
                    onChange={handleFormChange}
                    />

                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Contact Number" 
                    value={complainant.contact}
                    name="contact"
                    onChange={handleFormChange}
                    />

                    


                </div>

                <div className="section-2-right-side">
                <p>Assigned LF Staff's Information</p>
                <p>LT Staff Assigned:</p>
                   {/* The first option should be the first assigned LT staff*/}
                   <select 
                   id="featuredStatus" 
                   name="featuredStatus" 
                   className="featuredStatus" 
                   >
                      {/* <option value="" disabled>Change LT Assigned</option>  
                      {listofLT.map((LT, index) => (
                        <option key={index} value={LT.userid}>{LT.userid} {LT.firstName} {LT.lastName}</option>
                      ))} */}
                     
                   </select>

                  
                  <p>LT Staff User ID</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="LT Staff ID" 
                  disabled
                  />

                  <p>LT Staff Name</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Enter Official Name" 
                  disabled
                  />

  

                  <p>Contact Information</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Enter Contact Number" 
                  disabled
                  />
                   

                </div>

            </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                
                <div className="bars">
                    <div className="input-group">
                        <p>Nature of Complaint</p>
                        <input type="text" className="search-bar" placeholder="Enter Nature of Complaint"  id="nature" name="nature" value = {reportInfo.nature} onChange={handleFormChange} />
                    </div>

                    <div className="input-group">
                        <p>Date Filed</p>
                        <input type="date" className="search-bar" placeholder="Enter Date and Time" id="date" name="date" value = {reportInfo.date} onChange={handleFormChange} />
                    </div>

                    <div className="input-group">
                        <p>Time Filed</p>
                        <input type="time" className="search-bar" placeholder="Enter Time" id="time" name="time" value = {reportInfo.time} onChange={handleFormChange} />
                    </div>

                    <div className="input-group">
                        <p>Location</p>
                        <input type="text" className="search-bar" placeholder="Enter Location" id="location" name="location" value = {reportInfo.location} onChange={handleFormChange} />
                    </div>
                </div>
            </div>



            <div className="section-4">

                <div className="section-4-left-side">

                  <div className="fields-section">
                              <p>Complaint's Concern</p>
                                  <textarea 
                                      className="description" 
                                      placeholder="Enter Complaint's Concern"
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
                    <p> Photo</p>
              </div> 
            
              <div className="file-upload-container">
              <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
                 <input
                   id="file-upload1"
                   type="file"
                   className="file-upload-input"
                   accept=".jpg,.jpeg,.png"
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                     handleFileChangeContainer1(e);
                    
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
