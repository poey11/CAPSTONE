"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";

interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const storage = getStorage();
  const db = getFirestore();

  // List of form filenames in Firebase Storage
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
      // Placeholder function (your existing report generation logic)
      setTimeout(() => {
        alert("Kasambahay Masterlist Generated!");
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Failed to generate report.");
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const file = files.find((f) => f.name.replace(".docx", "") === selectedName) || null;
    setSelectedFile(file);
  };


  return (
    <div className="report-main-container">

      <h1 className="reports-title">Reports Module</h1>

      <div className="reports-section">
        {/* Generate Reports Section 
        still havent fixed the part for signatures*/}
        <div className="report-card">
          <h2 className="report-title">Generate Reports</h2>
          <button onClick={generateKasambahayReport} disabled={loading} className="report-button">
            {loading ? "Generating..." : "Generate Kasambahay Masterlist"}
          </button>
          
        {/* di pa working to */}
        <button className="report-button">Generate Barangay Fairview Resident Masterlist</button>
          <button className="report-button">Generate East Fairview Resident List</button>
          <button className="report-button">Generate South Fairview Resident List</button>
          <button className="report-button">Generate West Fairview Resident List</button>
        </div>



        {/* Downloadable Forms Section */}
        <div className="reports-section">
            <div className="report-card">
              <h2 className="report-title">Downloadable Forms</h2>
              <div className="Option-container">
                <select
                  id="featuredStatus"
                  name="featuredStatus"
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
                  <a href={selectedFile.url} download className="download-button">
                    Download
                  </a>
                </div>
              )}
            </div>
  </div>

      </div>
    </div>
  );
};

export default ReportsPage;
