"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";
import { motion } from "framer-motion";

interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");

  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const storage = getStorage();

  const formFiles = [
    "Fairview ECA Form.docx",
    "KASAMBAHAY PROGRAM COMPONENTS FORM.docx",
    "Barangay Kontra Gutom(Hapag sa Barangay).docx",
  ];

  useEffect(() => {
    const fetchDownloadLinks = async () => {
      try {
        const urls = await Promise.all(
          formFiles.map(async (file) => {
            const fileRef = ref(storage, `ReportsModule/${file}`);
            const url = await getDownloadURL(fileRef);
            return { name: file, url };
          })
        );
        setFiles(urls);
      } catch (error) {
        console.error("Error fetching file URLs:", error);
      }
    };

    fetchDownloadLinks();
  }, []);

  const generateKasambahayReport = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setPopupMessage("Kasambahay Masterlist Generated!");
        setShowSuccessPopup(true);
        setLoading(false);

         // Hide the popup after 3 seconds
         setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      }, 2000);
    } catch (error) {
      console.error("Unexpected error:", error);
      setPopupMessage("Failed to generate report.");
      setShowErrorPopup(true);
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const file = files.find((f) => f.name.replace(".docx", "") === selectedName) || null;
    setSelectedFile(file);
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModule(e.target.value);
  };


  const handleDownload = (file: FileData) => {
    setPopupMessage(`${file.name.replace(".docx", "")} downloaded!`);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  return (
    <div className="report-main-container">
      <h1 className="reports-title">Reports Module</h1>

      <div className="reports-section">
        <div className="report-card">
          <h2 className="report-title">Generate Reports</h2>
          <div className="Option-container">
            <select
              className="featuredStatus"
              onChange={handleModuleChange}
              required
            >
              <option value="">Select Module...</option>
              <option value="Resident Module">Resident Module</option>
              <option value="Incident Module">Incident Module</option>
              <option value="Services Module">Services Module</option>
              <option value="Programs Module">Programs Module</option>
            </select>
          </div>

          {selectedModule === "Resident Module" && (
            <>
              <button onClick={generateKasambahayReport} disabled={loading} className="report-button">
                {loading ? "Generating..." : "Generate Kasambahay Masterlist"}
              </button>
              <button className="report-button">Generate Barangay Fairview Resident Masterlist</button>
              <button className="report-button">Generate East Fairview Resident List</button>
              <button className="report-button">Generate South Fairview Resident List</button>
              <button className="report-button">Generate West Fairview Resident List</button>
            </>
          )}

          {selectedModule === "Incident Module" && (
            <>
              <button className="report-button">Summary of Incidents</button>
              <button className="report-button">Incident Status Summary</button>
            </>
          )}

          {selectedModule === "Services Module" && (
            <>
              <button className="report-button">Most Requested Services Lists</button>
            </>
          )}

          {selectedModule === "Programs Module" && (
            <>
              <button className="report-button">Program Participation Report</button>
              <button className="report-button">Program Completion Status Report</button>
            </>
          )}
        </div>

        <div className="report-card">
          <h2 className="report-title">Downloadable Forms</h2>
          <div className="Option-container">
            <select
              className="featuredStatus"
              onChange={handleSelectChange}
              required
            >
              <option value="">Select a form...</option>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <option key={index} value={file.name.replace(".docx", "")}> 
                    {file.name.replace(".docx", "")}
                  </option>
                ))
              ) : (
                <option>Loading files...</option>
              )}
            </select>
          </div>

          {selectedFile && (
            <div className="download-item">
              <span className="download-text">{selectedFile.name.replace(".docx", "")}</span>
              <a href={selectedFile.url} download className="download-button" onClick={() => handleDownload(selectedFile)}>
                Download
              </a>
            </div>
          )}
        </div>
        
      </div>

      {/* Success Pop-up */}
      {showSuccessPopup && (
        <div className={`popup-overlay show`}>
          <div className="popup">
              <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {/* Error Pop-up */}
      {showErrorPopup && (
        <div className={`popup-overlay show`}>
          <div className="popup">
              <p>{popupMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
