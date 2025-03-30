"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
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
  const [loadingResident, setLoadingResident] = useState(false);    
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);


  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const storage = getStorage();
  const db = getFirestore();


  const fetchDownloadLinks = async () => {
    try {
      const folderRef = ref(storage, "ReportsModule/");
      const fileList = await listAll(folderRef);
  
      const urls = await Promise.all(
        fileList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url };
        })
      );
  
      setFiles(urls);
    } catch (error) {
      console.error("Error fetching file URLs:", error);
    }
  };
  

  useEffect(() => {
    fetchDownloadLinks();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedUploadFile(event.target.files[0]);
    }
  };

   // Function to remove the selected file
   const onDeleteFile = () => {
    setSelectedUploadFile(null);
};

  const uploadFile = async () => {
    if (!selectedUploadFile) return;
    const fileRef = ref(storage, `ReportsModule/${selectedUploadFile.name}`);
    try {
      await uploadBytes(fileRef, selectedUploadFile);
      alert("File uploaded successfully!");
      setSelectedUploadFile(null);
      fetchDownloadLinks(); 
    } catch (error) {
      console.error("Upload failed:", error);
    }

    window.location.reload();

  };

  const deleteFile = async (fileName: string) => {
    const fileRef = ref(storage, `ReportsModule/${fileName}`);
    try {
      await deleteObject(fileRef);
      alert("File deleted successfully!");
      setFiles(files.filter(file => file.name !== fileName));
    } catch (error) {
      console.error("Delete failed:", error);
    }
    window.location.reload();

  };

  const generateKasambahayReport = async () => {
    setLoadingKasambahay(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const currentMonthYear = currentDate
        .toLocaleString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
  
      // for the previous month
      const previousMonth = currentDate.getMonth();
      const previousYear = previousMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      const previousMonthName = String(previousMonth === 0 ? 12 : previousMonth).padStart(2, "0");
      const previousMonthYear = new Date(previousYear, previousMonth, 1)
        .toLocaleString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
  
      const kasambahayRef = collection(db, "KasambahayList");
  
      // Fetch all records before current month
      const qOldRecords = query(
        kasambahayRef,
        where("createdAt", "<", `${year}-${month}-01`)
      );
      const oldRecordsSnapshot = await getDocs(qOldRecords);
      let oldMembers = oldRecordsSnapshot.docs.map((doc) => doc.data());
  
      // Fetch records for the current month
      const qCurrentMonthRecords = query(
        kasambahayRef,
        where("createdAt", ">=", `${year}-${month}-01`),
        where("createdAt", "<=", `${year}-${month}-31`)
      );
      const currentMonthSnapshot = await getDocs(qCurrentMonthRecords);
      let currentMonthMembers = currentMonthSnapshot.docs.map((doc) => doc.data());
  
      if (oldMembers.length === 0 && currentMonthMembers.length === 0) {
        alert("No new members found.");
        setLoadingKasambahay(false);
        return;
      }
  
      oldMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));
      currentMonthMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));
  
      const templateRef = ref(storage, "ReportsModule/Kasambahay Masterlist Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow === 0);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= 5);
  
      const footerStartRow = 6; 
      worksheet.spliceRows(footerStartRow, 0, ...new Array(oldMembers.length + currentMonthMembers.length + 2).fill([]));
  
      headerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow = 0;
  
        if (drawing.range?.br) {
          drawing.range.br.nativeRow = 0;
        }
      });
  
      // Use separate insertionRows for old and new members
      let oldInsertionRow = footerStartRow + 1; 
      let newInsertionRow = footerStartRow + oldMembers.length + 2; 
  
      // Insert records from previous months first
      oldMembers.forEach((member) => {
        const row = worksheet.getRow(oldInsertionRow);
        row.height = 100;
  
        const cells = [
          member.registrationControlNumber, 
          member.lastName.toUpperCase(), 
          member.firstName.toUpperCase(), 
          member.middleName.toUpperCase(), 
          member.homeAddress.toUpperCase(), 
          member.placeOfBirth.toUpperCase(), 
          `${String(new Date(member.dateOfBirth).getMonth() + 1).padStart(2, "0")}/${String(new Date(member.dateOfBirth).getDate()).padStart(2, "0")}/${new Date(member.dateOfBirth).getFullYear()}`, 
          member.sex === "Female" ? "F" : member.sex === "Male" ? "M" : "", 
          member.age, 
          member.civilStatus.toUpperCase(), 
          member.educationalAttainment, 
          member.natureOfWork, 
          member.employmentArrangement, 
          member.salary, 
          member.sssMember ? "YES" : "NO", 
          member.pagibigMember ? "YES" : "NO", 
          member.philhealthMember ? "YES" : "NO", 
          member.employerName.toUpperCase(), 
          member.employerAddress.toUpperCase()
        ];
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 21 }; // Increased font size
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // Enable text wrapping
  
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
        oldInsertionRow++;
      });
  
      const headerRow = worksheet.getRow(footerStartRow + oldMembers.length + 1);
  
      worksheet.unMergeCells(footerStartRow, 1, footerStartRow, 18);
      
      // Set the value and styles for the header
      headerRow.getCell(1).value = `(NEW MEMBERS ${currentMonthYear})`;
      headerRow.getCell(1).font = { bold: false, italic: true, size: 21, color: { argb: "FF0000" } }; // Increased font size
      headerRow.height = 25;
      headerRow.alignment = { horizontal: "left", vertical: "middle" };
      
      worksheet.mergeCells(footerStartRow + oldMembers.length + 1, 1, footerStartRow + oldMembers.length + 1, 18);
      headerRow.commit();
  
      // Insert records from the current month
      currentMonthMembers.forEach((member) => {
        const row = worksheet.getRow(newInsertionRow);
        row.height = 100;
  
        const cells = [
          member.registrationControlNumber, 
          member.lastName.toUpperCase(), 
          member.firstName.toUpperCase(), 
          member.middleName.toUpperCase(), 
          member.homeAddress.toUpperCase(), 
          member.placeOfBirth.toUpperCase(), 
          `${String(new Date(member.dateOfBirth).getMonth() + 1).padStart(2, "0")}/${String(new Date(member.dateOfBirth).getDate()).padStart(2, "0")}/${new Date(member.dateOfBirth).getFullYear()}`, 
          member.sex === "Female" ? "F" : member.sex === "Male" ? "M" : "", 
          member.age, 
          member.civilStatus.toUpperCase(), 
          member.educationalAttainment, 
          member.natureOfWork, 
          member.employmentArrangement, 
          member.salary, 
          member.sssMember ? "YES" : "NO", 
          member.pagibigMember ? "YES" : "NO", 
          member.philhealthMember ? "YES" : "NO", 
          member.employerName.toUpperCase(), 
          member.employerAddress.toUpperCase()
        ];
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 21 }; // Increased font size
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // Enable text wrapping
  
          // Apply medium black border to each cell
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
        newInsertionRow++;
      });
  
      footerDrawings.forEach((drawing) => {
        const newRow = (drawing.range?.tl?.nativeRow || 5) + oldMembers.length + currentMonthMembers.length + 2;
  
        if (drawing.range?.tl) drawing.range.tl.nativeRow = newRow;
  
        if (drawing.range?.br) {
          drawing.range.br.nativeRow = newRow + 1;
        }
      });
  
      // Create a buffer and upload to Firebase Storage
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `Kasambahay_Masterlist_${currentMonthYear}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("Kasambahay Masterlist Report generated successfully. Please wait for the downloadable file!");
  
      // Return file URL for conversion
      return fileUrl;
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Failed to generate Kasambahay Masterlist Report.");
    } finally {
      setLoadingKasambahay(false);
    }
  };
  
  
  
  const handleGenerateKasambahayPDF = async () => {
    setLoadingKasambahay(true);
  
    try {
      const fileUrl = await generateKasambahayReport();
      if (!fileUrl) return alert("Failed to generate Excel report.");
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
  
      const currentDate = new Date();
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
      saveAs(blob, `Kasambahay_Masterlist_${currentMonthYear}.pdf`);
  
      alert("Kasambahay Report successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
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
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= 5);
  
      worksheet.getRow(5).getCell(1).value = `As of ${currentMonthYear}`;
      worksheet.getRow(5).getCell(1).font = { name: "Calibri", size: 12, bold: true }; 
  
      const dataStartRow = 8;
      const footerStartRow = 13; 

      worksheet.spliceRows(dataStartRow + jobSeekers.length, 0, ...new Array(footerDrawings.length).fill([])); 
      
      let insertionRow = dataStartRow;

      const lastDataRow = insertionRow + jobSeekers.length - 1;

  
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
            cell.font = { name: "Calibri", size: 12 };
          });
    
          row.commit();
          insertionRow++;
        });
    
        footerDrawings.forEach((drawing) => {
          const newRow = (drawing.range?.tl?.nativeRow || 186) + jobSeekers.length + 1;
          if (drawing.range?.tl) drawing.range.tl.nativeRow = newRow;
          if (drawing.range?.br) drawing.range.br.nativeRow = newRow + 1;
        });

      // Create a buffer and upload to Firebase Storage
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `FirstTimeJobSeekers_${currentMonthYear}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("First-Time Job Seeker Report generated successfully. Please wait for the downloadable file!");
  
      // Return file URL for conversion
      return fileUrl;
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate First-Time Job Seeker Report.");
    } finally {
      setLoadingJobSeeker(false);
    }
  };

  const handleGenerateJobSeekerPDF = async () => {
    setLoadingJobSeeker(true);
    try {
      const fileUrl = await generateFirstTimeJobSeekerReport();
      if (!fileUrl) return alert("Failed to generate Excel report.");
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      // Get PDF as a Blob
      const blob = await response.blob();
  
      // Save file with the correct name dynamically
      const currentDate = new Date();
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
      saveAs(blob, `FirstTimeJobSeekers_${currentMonthYear}.pdf`);
  
      alert("First-Time Job Seeker Report successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingJobSeeker(false);
    }
  };
  


  const generateResidentListReport = async () => {
    setLoadingResident(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      if (residents.length === 0) {
        alert("No resident found.");
        setLoadingResident(false);
        return;
      }
  
      residents.sort((a, b) => (Number(a.residentNumber) || 0) - (Number(b.residentNumber) || 0));
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = reportTitle;
  
      const dataStartRow = 3;
      let insertionRow = dataStartRow;
  
      residents.forEach((resident) => {
        const row = worksheet.getRow(insertionRow);
        row.height = 55;
  
        const cells = [
          resident.residentNumber || "",
          resident.name || "",
          resident.address || "",
          resident.dateOfBirth || "",
          resident.placeOfBirth || "",
          resident.age || "",
          resident.sex || "",
          resident.civilStatus || "",
          resident.occupation || "",
          resident.contactNumber || "",
          resident.emailAddress || "",
          resident.precinctNumber || "",
        ];
  
        cells.forEach((value, index) => {
          row.getCell(index + 1).value = value;
          row.getCell(index + 1).font = { name: "Calibri", size: 12, bold: false }; 
          row.getCell(index + 1).alignment = {
            horizontal: 'center',
            wrapText: true,
          };
          row.getCell(index + 1).border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },            
          }
          
        });
  
        row.commit();
        insertionRow++;
      });
  
      const totalRow = worksheet.getRow(insertionRow);
      worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
      Object.assign(totalRow.getCell(1), { value: `TOTAL: ${residents.length}`, alignment: { horizontal: "center", vertical: "middle" }, font: { name: "Times New Roman", size: 10, bold: false } });
  
      totalRow.commit();
  
      // Create a buffer and upload to Firebase Storage
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `Inhabitant_Record_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("Resident Masterlist generated successfully. Please wait for the downloadable file!");
  
      // Return file URL for conversion
      return fileUrl;
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate Resident Masterlist Report.");
    } finally {
      setLoadingResident(false);
    }
  };

  const handleGenerateResidentPDF = async () => {
    setLoadingResident(true);
    try {
      const fileUrl = await generateResidentListReport();
      if (!fileUrl) return alert("Failed to generate Excel report.");
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      // Get PDF as a Blob
      const blob = await response.blob();
  
      // Save the file with the correct name dynamically
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      saveAs(blob, `Inhabitant_Record_${year}.pdf`);
  
      alert("Resident Masterlist Report successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingResident(false);
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
              <button onClick={handleGenerateResidentPDF} disabled={loadingResident} className="report-button">
                {loadingResident ? "Generating..." : "Generate Resident Masterlist"}
              </button>                    <button className="report-button">Generate East Fairview Resident List</button>
              <button className="report-button">Generate South Fairview Resident List</button>
              <button className="report-button">Generate West Fairview Resident List</button>
              <button onClick={handleGenerateKasambahayPDF} disabled={loadingKasambahay} className="report-button">
                {loadingKasambahay ? "Generating..." : "Generate Kasambahay Masterlist"}
              </button>
              <button onClick={handleGenerateJobSeekerPDF} disabled={loadingJobSeeker} className="report-button">
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
       
      <div className="forms-section">


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
                <button 
                  onClick={() => window.location.href = selectedFile.url} 
                  className="download-button"
                >
                  Download
                </button>
                <button 
                  onClick={() => deleteFile(selectedFile.name)} 
                  className="deleted-button"
                >
                  Delete
                </button>
              </div>
            )}

    </div>

<h2 className="report-title">Upload A File</h2>  

<div className="upload-section">
      <div className="upload-container">
          <input 
              type="file" 
              onChange={handleFileUpload} 
              id="file-upload"
              style={{ display: 'none' }} 
          />
          <label 
              htmlFor="file-upload" 
              className="upload-link"
          >
              Choose File
          </label>

          {selectedUploadFile && (
              <div className="file-name-image-display">
                  <ul>
                      <div className="file-name-image-display-indiv">
                          <li className="file-item"> 
                              
                            
                              <span>{selectedUploadFile.name}</span>  
                              <div className="delete-container">
                                  {/* Delete button with image */}
                                  <button
                                      type="button"
                                      onClick={onDeleteFile} // Call the delete function
                                      className="deleted-button"
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
                  </ul>
              </div>
          )}

          <button 
              onClick={uploadFile} 
              disabled={!selectedUploadFile} 
              className="upload-button"
          >
              Upload
          </button>
      </div>

</div>             
          
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
