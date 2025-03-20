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
    date: "",
    concerns: "",
    status: "",
    file: "",
    reportID: "",
    caseNumber: "",
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
          date: data.date || "",
          concerns: data.concerns || "",
          status: data.status || "",
          file: data.file || "",
          reportID: data.reportID || "",
          caseNumber: data.caseNumber || "",
        });
  
        // ✅ Fetch respondent details and files as an array
        if (data.respondent) {
          setRespondent({
            respondentName: data.respondent.respondentName || "",
            investigationReport: data.respondent.investigationReport || "",
            file: Array.isArray(data.respondent.file) ? data.respondent.file : data.respondent.file ? [data.respondent.file] : [],
          });
          
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

  const handleSave = async () => {
    if (!formData.id) {
      alert("Error: Missing incident ID.");
      return;
    }
  
    try {
      const incidentRef = doc(db, "IncidentReports", formData.id);
      const storage = getStorage();
  
      // Upload files and get their URLs
      const uploadedFileUrls = await Promise.all(
        files.map(async ({ file }) => { 
          const fileRef = ref(storage, `IncidentReports/Respondents/${file.name}`);
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        })
      );
  
      // Update the IncidentReports document
      await updateDoc(incidentRef, {
        status: formData.status,
        respondent: {  
          respondentName: respondent.respondentName,
          investigationReport: respondent.investigationReport,
          file: uploadedFileUrls,
        },
      });
  
      // 🔔 Create a notification for the resident
      const notificationRef = doc(collection(db, "Notifications"));
      await setDoc(notificationRef, {
        residentID: formData.reportID, // reportID == user id
        incidentID: formData.id,
        message: `Your incident report (${formData.caseNumber}) has been updated to "${formData.status}".`,
        timestamp: new Date(),
        transactionType: "Online Incident",
        isRead: false,
      });
  
      alert("Incident status and respondent info updated!");
      router.push("/dashboard/IncidentModule/OnlineReports");
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update incident.");
    }
  };
  
  
  

  return (
    <main className="main-container-report">

      
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


      <div className="main-content-view-online-report">
        <div className="section-1-online-report">
          <div className="section-1-online-report-left-side">
            <button type="button" className="back-button" onClick={() => router.back()}></button>
            <p>Online Report Details</p>
          </div>
        </div>

        <div className="online-report-details-section">
          <div className="title-section"><p>First Name</p></div>
          <div className="description-section">
            <p>{formData.firstname}</p>
          </div>
        </div>

        <div className="online-report-details-section">
          <div className="title-section"><p>Last Name</p></div>
          <div className="description-section">
            <p>{formData.lastname}</p>
          </div>
        </div>

        <div className="online-report-details-section">
          <div className="title-section"><p>Date Of Incident</p></div>
          <div className="description-section">
            <p>{formData.date}</p>
          </div>
        </div>

        <div className="online-report-details-section">
          <div className="title-section"><p>Concern</p></div>
          <div className="description-section">
            <p>{formData.concerns}</p>
          </div>
        </div>

    

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
      </div>

      {/* Respondent's Information Section */}
      <div className="main-content-response-section">
        <div className="title-section-response-section">
          <h1 className="title-response-section">Respondent's Information</h1>
        </div>

        <div className="main-section-response-section">
          <div className="section-1-response">
            <div className="official-section-online-report">
              <p>Respondent Officer</p>
              <input type="text" className="online-report-input-field" placeholder="Enter Respondent Officer Name" name="respondentName" value={respondent.respondentName} onChange={handleChange} />
            </div>

            <div className="fields-section-online-report">
              <p>Investigation Report</p>
              <textarea className="online-report-input-field" placeholder="Enter Investigation Details" name="investigationReport" value={respondent.investigationReport} onChange={handleChange} rows={15} />
            </div>
          </div>

          <div className="section-2-response">
  <p>Investigation Photo</p>
  <div className="file-upload-container">
    <label htmlFor="file-upload2" className="upload-link">Click to Upload File</label>
    <input
      id="file-upload2"
      type="file"
      className="file-upload-input"
      multiple
      accept=".jpg,.jpeg,.png"
      onChange={handleFileChange}
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

        <div className="submit-response-section">
          <button className="save-btn-online-report-response-section" onClick={handleSave}>Save</button>
        </div>
      </div>
    </main>
  );
}
