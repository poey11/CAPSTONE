"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import * as XLSX from "xlsx";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";

interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");

  const storage = getStorage();
  const db = getFirestore();

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
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  
      const db = getFirestore();
      const kasambahayRef = collection(db, "KasambahayList");
      const q = query(
        kasambahayRef,
        where("createdAt", ">=", `${year}-${month}-01`),
        where("createdAt", "<=", `${year}-${month}-31`)
      );
  
      const querySnapshot = await getDocs(q);
      let newMembers = querySnapshot.docs.map((doc) => doc.data());
  
      if (newMembers.length === 0) {
        alert("No new members found for the current month.");
        setLoading(false);
        return;
      }
  
      newMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));
  
      // Fetch template from Firebase Storage
      const storage = getStorage();
      const templateRef = ref(storage, "ReportsModule/Kasambahay Masterlist Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Identify last filled row before the footer
      let lastDataRow = worksheet.lastRow?.number || 1;
      const footerStartRow = 187; // Update this if your footer starts at a different row
  
      if (lastDataRow >= footerStartRow) {
        lastDataRow = footerStartRow - 1; // Ensure we don't overwrite the footer
      }
  
      // Insert new rows before the footer
      worksheet.spliceRows(footerStartRow, 0, ...new Array(newMembers.length + 2).fill([]));
  
      // Insert header for new members
      const headerRow = worksheet.getRow(footerStartRow);
      headerRow.getCell(1).value = `NEW MEMBERS (${currentMonthYear})`;
      headerRow.font = { name: "Calibri", size: 20, bold: true, italic: true, color: { argb: "FFFF0000" } };
  
      // Insert new members starting from the row after the header
      let insertionRow = footerStartRow + 1;
  
      newMembers.forEach((member) => {
        const row = worksheet.getRow(insertionRow);
        
        const cells = [
          member.registrationControlNumber, member.lastName, member.firstName, 
          member.middleName, member.homeAddress, member.placeOfBirth, 
          member.dateOfBirth, member.sex, member.age, member.civilStatus, 
          member.educationalAttainment, member.natureOfWork, 
          member.employmentArrangement, member.salary, 
          member.sssMember ? "YES" : "NO", 
          member.pagibigMember ? "YES" : "NO", 
          member.philhealthMember ? "YES" : "NO", 
          member.employerName, member.employerAddress
        ];
  
        // Apply font settings to each cell
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 20 };
        });
  
        row.commit();
        insertionRow++;
      });
  
      // Generate and download the updated report
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      saveAs(blob, `Kasambahay_Masterlist_${currentMonthYear}.xlsx`);
      alert("Kasambahay Masterlist Report generated successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Failed to generate Kasambahay Masterlist Report.");
    } finally {
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
              <button className="report-button">Generate Barangay Fairview Resident Masterlist</button>
              <button className="report-button">Generate East Fairview Resident List</button>
              <button className="report-button">Generate South Fairview Resident List</button>
              <button className="report-button">Generate West Fairview Resident List</button>
              <button onClick={generateKasambahayReport} disabled={loading} className="report-button">
                {loading ? "Generating..." : "Generate Kasambahay Masterlist"}
              </button>
              {/* <button onClick={generateFirstTimeJobSeekerReport} disabled={loading} className="report-button">
                {loading ? "Generating..." : "Generate First-Time Job Seeker List"}
              </button>             */}
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
              <a href={selectedFile.url} download className="download-button">
                Download
              </a>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ReportsPage;
