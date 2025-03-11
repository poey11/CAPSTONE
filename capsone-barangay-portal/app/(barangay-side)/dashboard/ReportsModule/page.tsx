"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";

interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {
  const [loadingKasambahay, setLoadingKasambahay] = useState(false); 
  const [loadingJobSeeker, setLoadingJobSeeker] = useState(false);    
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);


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
        const formFiles = [
          "Fairview ECA Form.docx",
          "KASAMBAHAY PROGRAM COMPONENTS FORM.docx",
          "Barangay Kontra Gutom(Hapag sa Barangay).docx",
        ];

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${uuidv4()}_${file.name}`;
      const fileRef = ref(storage, `ReportsModule/${fileName}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFiles([...files, { name: fileName, url }]);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileName: string) => {
    setDeleting(true);
    try {
      const fileRef = ref(storage, `ReportsModule/${fileName}`);
      await deleteObject(fileRef);
      setFiles(files.filter((file) => file.name !== fileName));
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file.");
    } finally {
      setDeleting(false);
    }
  };

  const generateKasambahayReport = async () => {
    setLoadingKasambahay(true);
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
        setLoadingKasambahay(false);
        return;
      }
  
      newMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));
  
      const storage = getStorage();
      const templateRef = ref(storage, "ReportsModule/Kasambahay Masterlist Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow === 0);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= 186);
  
      const footerStartRow = 187; 
  
      worksheet.spliceRows(footerStartRow, 0, ...new Array(newMembers.length + 2).fill([]));
  
      headerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow = 0;
      
        if (drawing.range?.br) {
          drawing.range.br.nativeRow = 0;
        }
      });
      
            
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
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 20 };
        });
  
        row.commit();
        insertionRow++;
      });
  
footerDrawings.forEach((drawing) => {
  const newRow = (drawing.range?.tl?.nativeRow || 186) + newMembers.length + 2;

  if (drawing.range?.tl) drawing.range.tl.nativeRow = newRow;

  if (drawing.range?.br) {
    drawing.range.br.nativeRow = newRow + 1;
  }
});
   
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
      setLoadingKasambahay(false);
    }
  };

  
  const generateFirstTimeJobSeekerReport = async () => {
    setLoadingJobSeeker(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  
      const jobSeekerRef = collection(db, "JobSeekerList");
      const q = query(jobSeekerRef);
      const querySnapshot = await getDocs(q);
  
      let jobSeekers = querySnapshot.docs.map((doc) => doc.data());
  
      if (jobSeekers.length === 0) {
        alert("No first-time job seekers found.");
        setLoadingJobSeeker(false);
        return;
      }
  
      jobSeekers.sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime());
  
      const templateRef = ref(storage, "ReportsModule/First Time Job Seeker Record.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0]; 
  
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
  
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow === 0);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= 186);
  
      const dataStartRow = 8; 
      const footerStartRow = 13; 
  
      worksheet.spliceRows(dataStartRow + jobSeekers.length, 0, ...new Array(footerDrawings.length).fill([])); 
  
      let insertionRow = dataStartRow;
  
      jobSeekers.forEach((seeker) => {
        const row = worksheet.getRow(insertionRow);
  
        const cells = [
          seeker.dateApplied ? new Date(seeker.dateApplied).toLocaleDateString("en-US") : "",
          seeker.lastName || "",
          seeker.firstName || "",
          seeker.middleName || "",
          seeker.age || "",
          seeker.monthOfBirth ? monthNames[parseInt(seeker.monthOfBirth, 10) - 1] : "",
          seeker.dayOfBirth || "",
          seeker.yearOfBirth || "",
          seeker.sex === "M" ? "*" : "",
          seeker.sex === "F" ? "*" : "",
          seeker.remarks || ""
        ];
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 20 };
        });
  
        row.commit();
        insertionRow++;
      });
  
      footerDrawings.forEach((drawing) => {
        const newRow = (drawing.range?.tl?.nativeRow || 186) + jobSeekers.length + 1;
        if (drawing.range?.tl) drawing.range.tl.nativeRow = newRow;
        if (drawing.range?.br) drawing.range.br.nativeRow = newRow + 1;
      });
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `FirstTimeJobSeekers_${currentMonthYear}.xlsx`);
  
      alert("First-Time Job Seeker Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate First-Time Job Seeker Report.");
    } finally {
      setLoadingJobSeeker(false);
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
              <button onClick={generateKasambahayReport} disabled={loadingKasambahay} className="report-button">
                {loadingKasambahay ? "Generating..." : "Generate Kasambahay Masterlist"}
              </button>
              <button onClick={generateFirstTimeJobSeekerReport} disabled={loadingJobSeeker} className="report-button">
                {loadingJobSeeker ? "Generating..." : "Generate First-Time Job Seeker List"}
              </button>       
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
