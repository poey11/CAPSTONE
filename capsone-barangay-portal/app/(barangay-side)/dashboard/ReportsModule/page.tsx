"use client";

import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

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

  return (
    <div className="main-container">
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
        <div className="report-card">
          <h2 className="report-title">Downloadable Forms</h2>
          <ul className="download-list">
            {files.length > 0 ? (
              files.map((file, index) => (
                <li key={index} className="download-item">
                  <span className="download-text">{file.name.replace(".docx", "")}</span>
                  <a href={file.url} download className="download-button">Download</a>
                </li>
              ))
            ) : (
              <li>Loading files...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
