"use client";
import { useState, useEffect, useRef} from "react";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {

  // rbac
  const { data: session } = useSession();


  // for residents
  const [loadingKasambahay, setLoadingKasambahay] = useState(false); 
  const [loadingJobSeeker, setLoadingJobSeeker] = useState(false);

  // inhabitant record
  const [loadingMasterResident, setLoadingMasterResident] = useState(false);    
  const [loadingEastResident, setLoadingEastResident] = useState(false);
  const [loadingWestResident, setLoadingWestResident] = useState(false);    
  const [loadingSouthResident, setLoadingSouthResident] = useState(false);  
  const [loadingRegistrationSummary, setLoadingRegistrationSummary] = useState(false);  

  // for resident demographic reports
  const [loadingResidentSeniorDemographic, setLoadingResidentSeniorDemographic] = useState(false);  
  const [loadingResidentStudentDemographic, setLoadingResidentStudentDemographic] = useState(false);  
  const [loadingResidentPWDDemographic, setLoadingResidentPWDDemographic] = useState(false);  
  const [loadingResidentSoloParentDemographic, setLoadingResidentSoloParentDemographic] = useState(false);  
  


  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

    // for incident reports
    const [loadingVAWCReport, setLoadingVAWCReport] = useState(false);    
    const [loadingLuponSettledReport, setLoadingLuponSettledReport] = useState(false);    
    const [loadingLuponPendingReport, setLoadingLuponPendingReport] = useState(false);    
    const [loadingIncidentSummary, setLoadingIncidentSummary] = useState(false);    
    const [loadingIncidentStatuses, setLoadingIncidentStatuses] = useState(false);    
    const [loadingGADRCOMonitoringReport, setGADRCOMonitoringReport] = useState(false);    



  
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

  // kasambahay report

  const generateKasambahayReport = async () => {
    setLoadingKasambahay(true);
    setIsGenerating(true);
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
      headerRow.getCell(1).font = { bold: true, italic: true, size: 21, color: { argb: "FF0000" } }; // Increased font size
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
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `Kasambahay_Masterlist_${currentMonthYear}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Kasambahay Masterlist Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Kasambahay Masterlist Report...");

      // Return file URL for conversion
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Unexpected error:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Kasambahay Masterlist Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Kasambahay Masterlist Report.");*/
    } finally {
      setLoadingKasambahay(false);
    }
  };
  
  
  
  const handleGenerateKasambahayPDF = async () => {
    setLoadingKasambahay(true);
  
    try {
      const fileUrl = await generateKasambahayReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
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
  
      /*alert("Kasambahay Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Kasambahay Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Kasambahay Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingKasambahay(false);
    }
  };

  // jobseekers
  
  const generateFirstTimeJobSeekerReport = async () => {
    setLoadingJobSeeker(true);
    setIsGenerating(true);
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
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `FirstTimeJobSeekers_${currentMonthYear}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("First-Time Job Seeker Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating First-Time Job Seeker Report...");

      // Return file URL for conversion
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate First-Time Job Seeker Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate First-Time Job Seeker Report.");*/
    } finally {
      setLoadingJobSeeker(false);
    }
  };

  const handleGenerateJobSeekerPDF = async () => {
    setLoadingJobSeeker(true);
    try {
      const fileUrl = await generateFirstTimeJobSeekerReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
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
  
      /*alert("First-Time Job Seeker Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("First-Time Job Seeker Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate First-Time Job Seeker Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingJobSeeker(false);
    }
  };
  

  // for demographic reports

  const generateSeniorCitizenReport = async () => {
    setLoadingResidentSeniorDemographic(true);
    setIsGenerating(true);
    
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `SENIOR CITIZEN DEMOGRAPHIC REPORT ${year}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((resident) => resident.isSeniorCitizen === true);
  
      if (residents.length === 0) {
        alert("No senior citizens found.");
        setLoadingResidentSeniorDemographic(false);
        return;
      }
  
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) {
            return addressA.localeCompare(addressB);
          }
          return firstA.localeCompare(firstB);
        }
        return lastA.localeCompare(lastB);
      });
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      const dataStartRow = 4;
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
  
      // Get footer images/drawings
      const footerDrawings = worksheet.getImages().filter(img => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert rows to make room for residents before footer
      const rowsNeeded = Math.max(0, dataStartRow + residents.length - (originalFooterStartRow - 1));
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));

      // Insert resident data
      residents.forEach((resident, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
      });
  
      // Insert TOTAL row after data
      const totalRowIndex = dataStartRow + residents.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      worksheet.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
      totalRow.getCell(1).value = `TOTAL SENIOR CITIZENS: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
      for (let col = 1; col <= 12; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        };
      }
      totalRow.commit();
  
      // Shift footer drawings down
      footerDrawings.forEach(drawing => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert dual date row below footer
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1;
  
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // Export the file

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Senior_Citizen_Report_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("Senior Citizen Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Senior Citizen Report...")
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating senior citizen report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Senior Citizen Report.");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);

      /*alert("Failed to generate Senior Citizen Report.");*/
    } finally {
      setLoadingResidentSeniorDemographic(false);
    }
  };
  
  const handleGenerateSeniorPDF = async () => {
    setLoadingResidentSeniorDemographic(true);
    try {
      const fileUrl = await generateSeniorCitizenReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      saveAs(blob, `Senior_Citizen_Report_${year}.pdf`);
  
      /*alert("Senior Citizen Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Senior Citizen Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Senior Citizen Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
    }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingResidentSeniorDemographic(false);
    }
  };
  
  const generateStudentDemographicReport = async () => {
    setLoadingResidentStudentDemographic(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `STUDENT DEMOGRAPHIC REPORT ${year}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      const residents = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((resident) => resident.isStudent === true || (resident.age !== undefined && resident.age <= 18));
  
      if (residents.length === 0) {
        alert("No student records found.");
        setLoadingResidentStudentDemographic(false);
        return;
      }
  
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) {
            return addressA.localeCompare(addressB);
          }
          return firstA.localeCompare(firstB);
        }
        return lastA.localeCompare(lastB);
      });
  
      // Load Excel template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Update header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // Define rows for data and footer
      const dataStartRow = 4;
      const originalFooterStartRow = 24; // Original footer drawing start row (adjust if needed)
      const originalFooterEndRow = 28;   // Original footer drawing end row (adjust if needed)
  
      // Get footer drawings (images) in the footer rows
      const footerDrawings = worksheet.getImages().filter(img => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert enough rows before footer to fit all resident rows
      const rowsNeeded = Math.max(0, dataStartRow + residents.length - (originalFooterStartRow - 1));
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  
      // Insert resident data rows
      residents.forEach((resident, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
      });
  
      // Add the total solo parents row just below the last resident data row
      const totalRowIndex = dataStartRow + residents.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      worksheet.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
      totalRow.getCell(1).value = `TOTAL STUDENTS/MINORS: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
      for (let col = 1; col <= 12; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        };
      }
      totalRow.commit();
  
      // Move footer drawings down by the number of inserted rows (residents.length)
      footerDrawings.forEach(drawing => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert 2 more rows after footer to add date text
      // Footer end row shifts by the number of inserted rows too
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1; 
  
      // Insert 2 rows for spacing before date (optional, since we calculate exact position)
      worksheet.insertRow(newDateRowIndex - 1, []); // 1st empty row before date
      worksheet.insertRow(newDateRowIndex, []);     // 2nd empty row before date
  
      // Set the date string in column A of newDateRowIndex + 1
      const dateRow = worksheet.getRow(newDateRowIndex + 1);

      // Increase the row height (e.g., 30 points)
      dateRow.height = 40;
      
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      // Save and upload
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Student_Demographic_Report_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("Student Demographic Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Student Demographic Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating Student report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Student Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Student Report.");*/
    } finally {
      setLoadingResidentStudentDemographic(false);
    }
  };
  
  

  const handleGenerateStudentPDF = async () => {
    setLoadingResidentStudentDemographic(true);
    try {
      const fileUrl = await generateStudentDemographicReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      saveAs(blob, `Student_Demographic_Report_${year}.pdf`);
  
      /*alert("Student Demographic Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Student Demographic Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Student PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Student PDF.");*/
    } finally {
      setLoadingResidentStudentDemographic(false);
    }
  };
  
  const generatePwdReport = async () => {
    setLoadingResidentPWDDemographic(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `PWD DEMOGRAPHIC REPORT ${year}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      const residents = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((resident) => resident.isPWD === true);
  
      if (residents.length === 0) {
        alert("No PWD records found.");
        return;
      }
  
      // Load Excel template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Update header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // Define rows for data and footer
      const dataStartRow = 4;
      const originalFooterStartRow = 24; // Original footer drawing start row (adjust if needed)
      const originalFooterEndRow = 28;   // Original footer drawing end row (adjust if needed)
  
      // Get footer drawings (images) in the footer rows
      const footerDrawings = worksheet.getImages().filter(img => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert enough rows before footer to fit all resident rows
      const rowsNeeded = Math.max(0, dataStartRow + residents.length - (originalFooterStartRow - 1));
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  
      // Insert resident data rows
      residents.forEach((resident, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
      });
  
      // Add the total solo parents row just below the last resident data row
      const totalRowIndex = dataStartRow + residents.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      worksheet.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
      totalRow.getCell(1).value = `TOTAL STUDENTS/MINORS: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
      for (let col = 1; col <= 12; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        };
      }
      totalRow.commit();
  
      // Move footer drawings down by the number of inserted rows (residents.length)
      footerDrawings.forEach(drawing => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert 2 more rows after footer to add date text
      // Footer end row shifts by the number of inserted rows too
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1; 
  
      // Insert 2 rows for spacing before date (optional, since we calculate exact position)
      worksheet.insertRow(newDateRowIndex - 1, []); // 1st empty row before date
      worksheet.insertRow(newDateRowIndex, []);     // 2nd empty row before date
  
      // Set the date string in column A of newDateRowIndex + 1
      const dateRow = worksheet.getRow(newDateRowIndex + 1);

      // Increase the row height (e.g., 30 points)
      dateRow.height = 40;
      
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      // Save and upload
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `PWD_Demographic_Report_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("PWD Demographic Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating PWD Demographic Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating Student report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PWD Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PWD Report.");*/
    } finally {
      setLoadingResidentPWDDemographic(false);
    }
  };

  
  const handleGeneratePwdPDF = async () => {
    setLoadingResidentPWDDemographic(true);
    try {
      const fileUrl = await generatePwdReport();
      if (!fileUrl) return;
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const year = new Date().getFullYear();
      saveAs(blob, `PWD_Demographic_Report_${year}.pdf`);
  
      /*alert("PWD Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("PWD Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error generating PWD PDF:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PWD Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PWD PDF.");*/
    } finally {
      setLoadingResidentPWDDemographic(false);
    }
  };
  
  const generateSoloParentReport = async () => {
    setLoadingResidentSoloParentDemographic(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `SOLO PARENT DEMOGRAPHIC REPORT ${year}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      const residents = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((resident) => resident.isSoloParent === true);
  
      if (residents.length === 0) {
        alert("No solo parent records found.");
        setLoadingResidentSoloParentDemographic(false);
        return;
      }
  
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) {
            return addressA.localeCompare(addressB);
          }
          return firstA.localeCompare(firstB);
        }
        return lastA.localeCompare(lastB);
      });
  
      // Load Excel template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Update header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // Define rows for data and footer
      const dataStartRow = 4;
      const originalFooterStartRow = 24; // Original footer drawing start row (adjust if needed)
      const originalFooterEndRow = 28;   // Original footer drawing end row (adjust if needed)
  
      // Get footer drawings (images) in the footer rows
      const footerDrawings = worksheet.getImages().filter(img => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert enough rows before footer to fit all resident rows
      const rowsNeeded = Math.max(0, dataStartRow + residents.length - (originalFooterStartRow - 1));
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  
      // Insert resident data rows
      residents.forEach((resident, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
      });
  
      // Add the total solo parents row just below the last resident data row
      const totalRowIndex = dataStartRow + residents.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      worksheet.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
      totalRow.getCell(1).value = `TOTAL SOLO PARENTS: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
      for (let col = 1; col <= 12; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        };
      }
      totalRow.commit();
  
      // Move footer drawings down by the number of inserted rows (residents.length)
      footerDrawings.forEach(drawing => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert 2 more rows after footer to add date text
      // Footer end row shifts by the number of inserted rows too
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1; 
  
      // Insert 2 rows for spacing before date (optional, since we calculate exact position)
      worksheet.insertRow(newDateRowIndex - 1, []); // 1st empty row before date
      worksheet.insertRow(newDateRowIndex, []);     // 2nd empty row before date
  
      // Set the date string in column A of newDateRowIndex + 1
      const dateRow = worksheet.getRow(newDateRowIndex + 1);

      // Increase the row height (e.g., 30 points)
      dateRow.height = 40;
      
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
      
      // Save and upload
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Solo_Parent_Demographic_Report_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("Solo Parent Demographic Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Solo Parent Demographic Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating Solo Parent report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Solo Parent Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Solo Parent Report.");*/
    } finally {
      setLoadingResidentSoloParentDemographic(false);
    }
  };
  
  
  const handleGenerateSoloParentPDF = async () => {
    setLoadingResidentSoloParentDemographic(true);
    try {
      const fileUrl = await generateSoloParentReport();
      if (!fileUrl) return;
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const year = new Date().getFullYear();
      saveAs(blob, `Solo_Parent_Demographic_Report_${year}.pdf`);
  
      /*alert("Solo Parent Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Solo Parent Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error generating Solo Parent PDF:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Solo Parent PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Solo Parent PDF.");*/
    } finally {
      setLoadingResidentSoloParentDemographic(false);
    }
  };
  

  // all residents

  const generateResidentRegistrationSummary = async () => {
    setLoadingRegistrationSummary(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript month index starts at 0
      const monthStr = month.toString().padStart(2, "0");
      const monthName = currentDate.toLocaleString("default", { month: "long" });
      const reportTitle = `RESIDENT REGISTRATION SUMMARY - ${monthName.toUpperCase()} ${year}`;
  
      const startDateStr = `${year}-${monthStr}-01`;
      const endDate = new Date(year, month, 0); // last day of the month
      const endDateStr = `${year}-${monthStr}-${endDate.getDate().toString().padStart(2, "0")}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(
        residentRef,
        where("createdAt", ">=", startDateStr),
        where("createdAt", "<=", endDateStr)
      );
  
      const querySnapshot = await getDocs(q);
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      if (residents.length === 0) {
        alert("No residents registered this month.");
        setLoadingRegistrationSummary(false);
        return;
      }
  
      // Sort residents alphabetically
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) {
            return addressA.localeCompare(addressB);
          }
          return firstA.localeCompare(firstB);
        }
        return lastA.localeCompare(lastB);
      });
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRESIDENT REGISTRATION SUMMARY";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
 
      let insertionRow = 4;
      const rowsNeeded = Math.max(0, insertionRow + residents.length - (originalFooterStartRow - 1));
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  

      residents.forEach((resident, index) => {
        const row = worksheet.getRow(insertionRow);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
        insertionRow++;
      });
  
      // Add total
      const totalRow = worksheet.getRow(insertionRow);
      worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
      totalRow.getCell(1).value = `TOTAL: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10 };
      totalRow.commit();
  
      // Shift footer drawings/images
      const totalInsertedRows = residents.length;
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
      footerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow += totalInsertedRows;
        if (drawing.range?.br) drawing.range.br.nativeRow += totalInsertedRows;
      });
  
      // Insert 2 blank rows + date rows
      const dateInsertRowIndex = originalFooterEndRow + totalInsertedRows + 2;
      worksheet.insertRow(dateInsertRowIndex - 1, []);
      worksheet.insertRow(dateInsertRowIndex, []);
      const dateRow = worksheet.getRow(dateInsertRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `Resident_Registration_Summary_${monthName}_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("Resident Registration Summary generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Resident Registration Summary...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);
      
      console.error("Error generating Resident Registration Summary:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Registration Summary");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Resident Registration Summary.");*/
    } finally {
      setLoadingRegistrationSummary(false);
    }
  };
  
  const handleRegistrationSummaryPDF = async () => {
    setLoadingRegistrationSummary(true);
    try {
      const fileUrl = await generateResidentRegistrationSummary();
      /*if (!fileUrl) return alert("Failed to generate Excel summary report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel summary report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
  
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString("default", { month: "long" });
  
      saveAs(blob, `Resident_Registration_Summary_${month}_${year}.pdf`);
  
      /*alert("Resident Registration Summary successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Resident Registration Summary generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Registration Summary PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingRegistrationSummary(false);
    }
  };
  

  const generateResidentListReport = async () => {
    setLoadingMasterResident(true);
    setIsGenerating(true);
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
        setLoadingMasterResident(false);
        return;
      }
  
      // Sort residents by lastName, firstName, then address
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) {
            return addressA.localeCompare(addressB);
          }
          return firstA.localeCompare(firstB);
        }
        return lastA.localeCompare(lastB);
      });
  
      // Load Excel template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // Define footer rows in your template (adjust as needed)
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
  

      // Insert resident data starting at row 4
      let insertionRow = 4;

      // Insert rows before footer to make room for residents
      const rowsNeeded = Math.max(0, insertionRow + residents.length);
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  
  
      residents.forEach((resident, index) => {
        const row = worksheet.getRow(insertionRow);
        row.height = 55;
  
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
        const cells = [
          (index + 1).toString(),
          fullName,
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
  
        cells.forEach((value, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 12, bold: false };
          cell.alignment = { horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        });
  
        row.commit();
        insertionRow++;
      });
  
      // Insert total row after residents
      const totalRow = worksheet.getRow(insertionRow);
      worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
      totalRow.getCell(1).value = `TOTAL: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: false };
      totalRow.commit();
  
      // Shift footer drawings/images down by number of inserted resident rows
      const totalInsertedRows = rowsNeeded - 4;
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
      footerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow += totalInsertedRows;
        if (drawing.range?.br) drawing.range.br.nativeRow += totalInsertedRows;
      });
  
      // Insert 2 blank rows after footer for date rows
      const dateInsertRowIndex = originalFooterEndRow + totalInsertedRows + 2;
      worksheet.insertRow(dateInsertRowIndex - 1, []);
      worksheet.insertRow(dateInsertRowIndex, []);
  
      // Prepare date row with 2 merged date cells
      const dateRow = worksheet.getRow(dateInsertRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // Save and upload

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
      const fileName = `Inhabitant_Record_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Resident Masterlist generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Resident Masterlist...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Masterlist Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Resident Masterlist Report.");*/
    } finally {
      setLoadingMasterResident(false);
    }
  };
  

  const handleGenerateResidentPDF = async () => {
    setLoadingMasterResident(true);
    try {
      const fileUrl = await generateResidentListReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/
  
      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }

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
  
      /*alert("Resident Masterlist Report successfully converted to PDF!");*/
      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Resident Masterlist Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Masterlist Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingMasterResident(false);
    }
  };
  
  // residents per general location
  // east fairview
  const generateEastResidentListReport = async () => {
    setLoadingEastResident(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - EAST FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      // Group residents by cluster for East Fairview
      const addressGroups = {
        "RINA": residents.filter((resident) =>
          resident.cluster && resident.cluster.toUpperCase().includes("RINA")
        ),
        "SAMAFA": residents.filter((resident) =>
          resident.cluster && resident.cluster.toUpperCase().includes("SAMAFA")
        ),
        "SAMAPLI": residents.filter((resident) =>
          resident.cluster && resident.cluster.toUpperCase().includes("SAMAPLI")
        ),
        "SITIO KISLAP": residents.filter((resident) =>
          resident.cluster && resident.cluster.toUpperCase().includes("SITIO KISLAP")
        ),
        "EFHAI": residents.filter((resident) =>
          resident.cluster && resident.cluster.toUpperCase().includes("EFHAI")
        ),
      };
  
      // Filter out empty groups
      const filteredGroups = Object.entries(addressGroups).filter(([key, value]) => value.length > 0);
  
      if (filteredGroups.length === 0) {
        alert("No residents found.");
        setLoadingEastResident(false);
        return;
      }
  
      // Load Excel template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Update header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // Define footer rows 
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
  
      // Calculate total residents count
      const totalResidents = filteredGroups.reduce((sum, [, members]) => sum + members.length, 0);
  
      // Collect footer drawings
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert rows before footer to make room for all residents
      let insertionRow = 4;
      const rowsNeeded = Math.max(0, insertionRow + totalResidents);
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));

      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        // Sort members by lastName, then firstName
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) return firstA.localeCompare(firstB);
          return lastA.localeCompare(lastB);
        });
  
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = { name: "Times New Roman", size: 14, bold: true };
        headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        headerCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        headerRow.height = 25;
        headerRow.commit();
        insertionRow++;
  
        members.forEach((resident) => {
          const row = worksheet.getRow(insertionRow);
          row.height = 55;
  
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
          const cells = [
            count,
            fullName,
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
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.font = { name: "Calibri", size: 12 };
            cell.alignment = { horizontal: "center", wrapText: true };
            cell.border = {
              top: { style: "medium", color: { argb: "000000" } },
              bottom: { style: "medium", color: { argb: "000000" } },
              left: { style: "medium", color: { argb: "000000" } },
              right: { style: "medium", color: { argb: "000000" } },
            };
          });
  
          row.commit();
          insertionRow++;
          count++;
        });
  
        const totalRow = worksheet.getRow(insertionRow);
        worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
        totalRow.getCell(1).value = `TOTAL: ${members.length}`;
        totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        totalRow.getCell(1).font = { name: "Times New Roman", size: 12, italic: true, bold: true };
        totalRow.getCell(1).border = {
          bottom: { style: "medium", color: { argb: "000000" } },
          left: { style: "medium", color: { argb: "000000" } },
          right: { style: "medium", color: { argb: "000000" } },
        };
        totalRow.commit();
  
        insertionRow++;
      }
  
      // Shift footer drawings
      footerDrawings.forEach((drawing) => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert 2 extra rows after footer for dates
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1; 
  
      // Insert 2 empty rows before date row
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      // Prepare the date row
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // Save and upload

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_EastFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Resident List for East Fairview generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Resident List for East Fairview...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate East Fairview Resident Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate East Fairview Resident Report.");*/


    } finally {
      setLoadingEastResident(false);
    }
  };
  
  
  const handleGenerateEastResidentPDF = async () => {
    setLoadingEastResident(true);
    try {
      const fileUrl = await generateEastResidentListReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/
  
      if (!fileUrl) {
        setIsGenerating(false); 

        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);

        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Inhabitant_Record_EastFairview_${year}.pdf`);
  
      /*alert("Resident Report (East Fairview) successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Resident Report (East Fairview) generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Report (East Fairview) PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
    setLoadingEastResident(false);
    }
  };

  const generateWestResidentListReport = async () => {
    setLoadingWestResident(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - WEST FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      const addressGroups = {
        AUSTIN: residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("AUSTIN")
        ),
        "BASILIO 1": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("BASILIO 1")
        ),
        DARISNAI: residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("DARISNAI")
        ),
        "MUSTANG BENZ": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("MUSTANG BENZ")
        ),
        ULNA: residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("ULNA")
        ),
        "UNITED FAIRLANE": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("UNITED FAIRLANE")
        ),
        URLINA: residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("URLINA")
        ),
        "VERBENA 1": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("VERBENA 1")
        ),
        "WEST FAIRVIEW HOA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("WEST FAIRVIEW HOA")
        ),
        "TULIP RESIDENCES HOA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("TULIP RESIDENCES HOA")
        ),
      };
  
      const filteredGroups = Object.entries(addressGroups).filter(([_, members]) => members.length > 0);
  
      if (filteredGroups.length === 0) {
        alert("No residents found.");
        setLoadingWestResident(false);
        return;
      }
  
      // Load template
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Update header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      // === Footer rows and drawings ===
      // Adjust these to your actual footer row numbers in the template
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
  
      // Count total residents to know how many rows to insert before footer
      const totalResidents = filteredGroups.reduce((sum, [, members]) => sum + members.length, 0);
  
      // Get footer drawings that need to be shifted down
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      // Insert blank rows before footer to make room for all residents
      let insertionRow = 4;
      const rowsNeeded = Math.max(0, insertionRow + residents.length);
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));  
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        // Sort members by lastName, then firstName
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) return firstA.localeCompare(firstB);
          return lastA.localeCompare(lastB);
        });
  
        // Group header row
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = { name: "Times New Roman", size: 14, bold: true };
        headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        headerCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        headerRow.height = 25;
        headerRow.commit();
        insertionRow++;
  
        // Resident rows
        members.forEach((resident) => {
          const row = worksheet.getRow(insertionRow);
          row.height = 55;
  
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
          const cells = [
            count,
            fullName,
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
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.font = { name: "Calibri", size: 12 };
            cell.alignment = { horizontal: "center", wrapText: true };
            cell.border = {
              top: { style: "medium", color: { argb: "000000" } },
              bottom: { style: "medium", color: { argb: "000000" } },
              left: { style: "medium", color: { argb: "000000" } },
              right: { style: "medium", color: { argb: "000000" } },
            };
          });
  
          row.commit();
          insertionRow++;
          count++;
        });
  
        // Total row for the group
        const totalRow = worksheet.getRow(insertionRow);
        worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
        totalRow.getCell(1).value = `TOTAL: ${members.length}`;
        totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        totalRow.getCell(1).font = { name: "Times New Roman", size: 12, italic: true, bold: true };
        totalRow.getCell(1).border = {
          bottom: { style: "medium", color: { argb: "000000" } },
          left: { style: "medium", color: { argb: "000000" } },
          right: { style: "medium", color: { argb: "000000" } },
        };
        totalRow.commit();
  
        insertionRow++;
      }
  
      // Shift footer drawings down by totalResidents rows
      footerDrawings.forEach((drawing) => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Insert 2 extra rows after footer for dates
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1; 
  
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:i${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // Save and upload
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_WestFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Resident List for West Fairview generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Resident List for West Fairview...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate West Fairview Resident Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate West Fairview Resident Report.");*/
    } finally {
      setLoadingWestResident(false);
    }
  };
  

  const handleGenerateWestResidentPDF = async () => {
    setLoadingWestResident(true);
    try {
      const fileUrl = await generateWestResidentListReport();
      if (!fileUrl) return alert("Failed to generate Excel report.");
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Inhabitant_Record_WestFairview_${year}.pdf`);
  
      alert("Resident Report (West Fairview) successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingWestResident(false);
    }
  };


  const generateSouthResidentListReport = async () => {
    setLoadingSouthResident(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - SOUTH FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      const addressGroups = {
        "AKAP": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("AKAP")
        ),
        "ARNAI": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("ARNAI")
        ),
        "F.L.N.A": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("F.L.N.A")
        ),
        "FEWRANO": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("FEWRANO")
        ),
        "UPPER CORVETTE HOA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("UPPER CORVETTE HOA")
        ),
      };
  
      const filteredGroups = Object.entries(addressGroups).filter(
        ([, value]) => value.length > 0
      );
  
      if (filteredGroups.length === 0) {
        alert("No residents found.");
        setLoadingSouthResident(false);
        return;
      }
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Header
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      const originalFooterStartRow = 24;
      const originalFooterEndRow = 28;
  
      const totalResidents = filteredGroups.reduce((sum, [, members]) => sum + members.length, 0);
  
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
  
      let insertionRow = 4;
      const rowsNeeded = Math.max(0, insertionRow + totalResidents);
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));
  
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) return firstA.localeCompare(firstB);
          return lastA.localeCompare(lastB);
        });
  
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = { name: "Times New Roman", size: 14, bold: true };
        headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        headerCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        headerRow.height = 25;
        headerRow.commit();
        insertionRow++;
  
        members.forEach((resident) => {
          const row = worksheet.getRow(insertionRow);
          row.height = 55;
  
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
  
          const cells = [
            count,
            fullName,
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
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.font = { name: "Calibri", size: 12 };
            cell.alignment = { horizontal: "center", wrapText: true };
            cell.border = {
              top: { style: "medium", color: { argb: "000000" } },
              bottom: { style: "medium", color: { argb: "000000" } },
              left: { style: "medium", color: { argb: "000000" } },
              right: { style: "medium", color: { argb: "000000" } },
            };
          });
  
          row.commit();
          insertionRow++;
          count++;
        });
  
        const totalRow = worksheet.getRow(insertionRow);
        worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
        totalRow.getCell(1).value = `TOTAL: ${members.length}`;
        totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        totalRow.getCell(1).font = { name: "Times New Roman", size: 12, italic: true, bold: true };
        totalRow.getCell(1).border = {
          bottom: { style: "medium", color: { argb: "000000" } },
          left: { style: "medium", color: { argb: "000000" } },
          right: { style: "medium", color: { argb: "000000" } },
        };
        totalRow.commit();
  
        insertionRow++;
      }
  
      // Shift footer drawings
      footerDrawings.forEach((drawing) => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // Add dual date rows
      const footerShift = rowsNeeded;
      const newDateRowIndex = originalFooterEndRow + footerShift + 1;
  
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_SouthFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Resident List for South Fairview generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Resident List for South Fairview...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate South Fairview Resident Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate South Fairview Resident Report.");*/
    } finally {
      setLoadingSouthResident(false);
    }
  };
  
  
  const handleGenerateSouthResidentPDF = async () => {
    setLoadingSouthResident(true);
    try {
      const fileUrl = await generateSouthResidentListReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Inhabitant_Record_SouthFairview_${year}.pdf`);
  
      /*alert("Resident Report (South Fairview) successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Resident Report (South Fairview) generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingSouthResident(false);
    }
  };


  // for incident reports

  // summary of incident reports

  const generateIncidentSummaryReport = async () => {
    setLoadingIncidentSummary(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `BARANGAY FAIRVIEW INCIDENT REPORTS - ${year}`;
  
      const reportsRef = collection(db, "IncidentReports");
      const q = query(reportsRef);
      const querySnapshot = await getDocs(q);
  
      const incidentReports = querySnapshot.docs.map((doc) => doc.data());
  
      const departmentGroups = {
        Lupon: incidentReports.filter((rep) => rep.department === "Lupon"),
        VAWC: incidentReports.filter((rep) => rep.department === "VAWC"),
        BCPC: incidentReports.filter((rep) => rep.department === "BCPC"),
        GAD: incidentReports.filter((rep) => rep.department === "GAD"),
      };
  
      const filteredGroups = Object.entries(departmentGroups).filter(
        ([, reports]) => reports.length > 0
      );
  
      if (filteredGroups.length === 0) {
        alert("No incident reports found.");
        setLoadingIncidentSummary(false);
        return;
      }
  
      const templateRef = ref(storage, "ReportsModule/Summary of Incidents Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = "BARANGAY FAIRVIEW\n SUMMARY OF INCIDENTS";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;
  
      const originalFooterStartRow = 25;
      const originalFooterEndRow = 28;
  
      const totalReports = filteredGroups.reduce((sum, [, reports]) => sum + reports.length, 0);
  
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= originalFooterStartRow - 1 && row <= originalFooterEndRow - 1;
      });
  
      let insertionRow = 4;
      const rowsNeeded = Math.max(0, insertionRow + totalReports + filteredGroups.length);
      for (let i = 0; i < rowsNeeded; i++) {
        worksheet.insertRow(originalFooterStartRow + i, []);
      }  
  
      for (const [department, reports] of filteredGroups) {
        worksheet.spliceRows(insertionRow, 1, []);
        const headerRange = `A${insertionRow}:E${insertionRow}`;
        try {
          worksheet.unMergeCells(headerRange);
        } catch (_) {}
        
        worksheet.mergeCells(headerRange);
        const headerRow = worksheet.getRow(insertionRow);
        
        // Only set value in A
        headerRow.getCell(1).value = department;
        
        for (let col = 1; col <= 5; col++) {
          const cell = headerRow.getCell(col);
          cell.font = { name: "Times New Roman", size: 20, bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          };
        }
        
        headerRow.height = 25;
        headerRow.commit();
        insertionRow++;
        
        
  
        // --- Incident Data Rows ---
        reports.forEach((report) => {
          const row = worksheet.getRow(insertionRow);
          row.height = 55;
  
          const complainant = report.complainant || {};
          const respondent = report.respondent || {};
          const complainantFullName = `${complainant.fname || ""} ${complainant.lname || ""}`.trim();
          const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();
  
          const cells = [
            report.caseNumber,
            ` C- ${complainantFullName}\n\n R- ${respondentFullName}`,
            `${report.dateFiled || ""} ${report.timeFiled || ""}`,
            report.nature || "",
            report.status || "",
          ];
  
          cells.forEach((value, index) => {
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.font = {
              name: "Calibri",
              size: 12,
              bold: false,
              italic: false
            };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = {
              top: { style: "medium", color: { argb: "000000" } },
              bottom: { style: "medium", color: { argb: "000000" } },
              left: { style: "medium", color: { argb: "000000" } },
              right: { style: "medium", color: { argb: "000000" } },
            };
          });
  
          row.commit();
          insertionRow++;
        });

        worksheet.spliceRows(insertionRow, 1, []);

        const totalRange = `A${insertionRow}:E${insertionRow}`;
        try {
          worksheet.unMergeCells(totalRange);
        } catch (_) {}
        worksheet.mergeCells(totalRange);
        
        const totalRow = worksheet.getRow(insertionRow);
        totalRow.getCell(1).value = `TOTAL: ${reports.length}`;
        
        for (let col = 1; col <= 5; col++) {
          const cell = totalRow.getCell(col);
          cell.font = { name: "Times New Roman", size: 12, italic: true, bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "medium", color: { argb: "000000" } },
            bottom: { style: "medium", color: { argb: "000000" } },
            left: { style: "medium", color: { argb: "000000" } },
            right: { style: "medium", color: { argb: "000000" } },
          };
        }
        
        totalRow.commit();
        insertionRow++;
        
        // --- Add spacer to prevent formatting overlap ---
        worksheet.getRow(insertionRow).values = ["", "", "", "", ""];
        worksheet.getRow(insertionRow).height = 5;
        worksheet.getRow(insertionRow).commit();
        insertionRow++;
      }
  
      // --- Adjust footer drawings ---
      footerDrawings.forEach((drawing) => {
        const offset = rowsNeeded;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      // --- Add dual date rows ---
      const newDateRowIndex = originalFooterEndRow + rowsNeeded + 1;
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      worksheet.mergeCells(`B${dateRow.number}:C${dateRow.number}`);
      const dateCell1 = dateRow.getCell(2);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      worksheet.mergeCells(`D${dateRow.number}:E${dateRow.number}`);
      const dateCell2 = dateRow.getCell(4);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // --- Page setup ---
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };
  
      // --- Save and upload ---
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Incident_Report_BarangayFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      /*alert("Incident Report generated successfully. Please wait for the downloadable file!");*/

      setGeneratingMessage("Generating All Incidents Summary Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate All Incidents Summary Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);

      /*alert("Failed to generate Incident Report.");*/
    } finally {
      setLoadingIncidentSummary(false);
    }
  };
  

  const handleGenerateIncidentSummaryPDF = async () => {
    setLoadingIncidentSummary(true);
    try {
      const fileUrl = await generateIncidentSummaryReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Incident_Summary_Report${year}.pdf`);
  
      /*alert("Incident Summary Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("All Incidents Summary Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingIncidentSummary(false);
    }
  };
  

  // vawc monthly report

  const generateVAWCReport = async () => {
    setLoadingVAWCReport(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString("default", { month: "long" });
      const reportTitle = `FOR THE MONTH OF ${month.toUpperCase()} ${year}`;
  
      //  Get VAWC IncidentReports
      const reportsRef = collection(db, "IncidentReports");
      const q = query(reportsRef, where("department", "==", "VAWC"));
      const querySnapshot = await getDocs(q);
      const vawcReports = querySnapshot.docs.map((doc) => doc.data());
  
      if (vawcReports.length === 0) {
        alert("No VAWC reports found.");
        return;
      }
  
      //  Load Excel template
      const templateRef = ref(storage, "ReportsModule/VAWC Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      //  Update report title
      worksheet.getCell("A3").value = reportTitle;
  
      const headerEndRow = 3;
      const dataStartRow = 5;
      const footerStartRow = 17;
  
      //  Handle header/footer images
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow < dataStartRow);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= footerStartRow);
  
      // to save footer
      worksheet.insertRows(footerStartRow - 1, new Array(vawcReports.length).fill([]));
  
      //  Insert dynamic data
      vawcReports.forEach((report, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const complainant = report.complainant || {};
        const respondent = report.respondent || {};
  
        const complainantFullName = `${complainant.fname || ""} ${complainant.lname || ""}`.trim();
        const complainantAge = complainant.age || "";
        const complainantAddress = complainant.address || "";
  
        const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();
        const respondentAge = respondent.age || "";
        const respondentAddress = respondent.address || "";
  
        const cells = [
          report.dateFiled || "",
          `C- ${complainantFullName}\nR- ${respondentFullName}`,
          `C- ${complainantAge}\nR- ${respondentAge}`,
          `C- ${complainantAddress}\nR- ${respondentAddress}`,
          report.nature || "",
          report.occupation || "",
          report.educationalAttainment || "",
          report.remarks || "",
        ];
  
        cells.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          };
        });
  
        row.commit();
      });
  
      //  Move footer images
      footerDrawings.forEach(drawing => {
        const offset = vawcReports.length;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      //  Save and upload

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `VAWC_Report_${month}_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("VAWC Report generated successfully! Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating VAWC Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating VAWC report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate VAWC Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate VAWC Report.");*/
    } finally {
      setLoadingVAWCReport(false);
    }
  };
  
  
  const handleGenerateVAWCPDF = async () => {
    setLoadingVAWCReport(true);
    try {
      const fileUrl = await generateVAWCReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `VAWC_Report_${year}.pdf`);
  
      /*alert("VAWC Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("VAWC Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate VAWC Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingVAWCReport(false);
    }
  };

  // lupon settled cases

  const generateLuponSettledReport = async () => {
    setLoadingLuponSettledReport(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString("default", { month: "long" });
      const reportTitle = `FOR THE MONTH OF ${month.toUpperCase()} ${year}`;
  
      //  Get Lupon Settled IncidentReports
      const reportsRef = collection(db, "IncidentReports");
      const q = query(
        reportsRef,
        where("department", "==", "Lupon"),
        where("status", "==", "settled")
      );
      const querySnapshot = await getDocs(q);
      const luponSettledReports = querySnapshot.docs.map((doc) => doc.data());
  
      if (luponSettledReports.length === 0) {
        alert("No Lupon Settled reports found.");
        return;
      }
  
      //  Load Excel template
      const templateRef = ref(storage, "ReportsModule/Lupon Tagapamayapa Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      //  Update report title
      worksheet.getCell("A3").value = reportTitle;
  
      const headerEndRow = 3;
      const dataStartRow = 7;
      const footerStartRow = 23;
  
      //  Handle header/footer images
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow < dataStartRow);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= footerStartRow);
  
      // to save footer
      worksheet.insertRows(footerStartRow - 1, new Array(luponSettledReports.length).fill([]));
  
      //  Insert dynamic data
      luponSettledReports.forEach((report, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const complainant = report.complainant || {};
        const respondent = report.respondent || {};
  
        const complainantFullName = `${complainant.fname || ""} ${complainant.lname || ""}`.trim();
        const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();

        const specificNature = report.specifyNature;

  
        const cells = [
          report.caseNumber || "",
          `C- ${complainantFullName}\nR- ${respondentFullName}`,
          report.nature === "Criminal" ? "*" : "",
          report.nature === "Civil" ? "*" : "",
          report.specifyNature || "",
          report.isMediation ? "*" : "",
          report.isConciliation ? "*" : "",
          report.isArbitration ? "*" : "",
          "", // blank
          "", // blank
          "", // blank
          "", // blank
          report.remarks || "",
        ];
        cells.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          };
        });
  
        row.commit();
      });
  
      //  Move footer images
      footerDrawings.forEach(drawing => {
        const offset = luponSettledReports.length;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      //  Save and upload

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Lupon_Settled_Report_${month}_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Lupon Settled Report generated successfully! Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Lupon Settled Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating Lupon Settled report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Settled Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Lupon Settled Report.");*/
    } finally {
      setLoadingLuponSettledReport(false);
    }
  };
  
  
  const handleGenerateLuponSettledPDF = async () => {
    setLoadingLuponSettledReport(true);
    try {
      const fileUrl = await generateLuponSettledReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Lupon_Settled_Report_${year}.pdf`);
  
      /*alert("Lupon Settled Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Lupon Settled Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Settled Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingLuponSettledReport(false);
    }
  };
  
  
  // lupon pending

  const generateLuponPendingReport = async () => {
    setLoadingLuponPendingReport(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.toLocaleString("default", { month: "long" });
      const reportTitle = `FOR THE MONTH OF ${month.toUpperCase()} ${year}`;
  
      //  Get Lupon Pending IncidentReports
      const reportsRef = collection(db, "IncidentReports");
      const q = query(
        reportsRef,
        where("department", "==", "Lupon"),
        where("status", "in", ["Pending", "pending"])
      );
      const querySnapshot = await getDocs(q);
      const luponSettledReports = querySnapshot.docs.map((doc) => doc.data());
  
      if (luponSettledReports.length === 0) {
        alert("No Lupon Pending reports found.");
        return;
      }
  
      //  Load Excel template
      const templateRef = ref(storage, "ReportsModule/Lupon Tagapamayapa Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      //  Update report title
      worksheet.getCell("A3").value = reportTitle;
  
      const headerEndRow = 3;
      const dataStartRow = 7;
      const footerStartRow = 23;
  
      //  Handle header/footer images
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow < dataStartRow);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= footerStartRow);
  
      // to save footer
      worksheet.insertRows(footerStartRow - 1, new Array(luponSettledReports.length).fill([]));
  
      //  Insert dynamic data
      luponSettledReports.forEach((report, index) => {
        const rowIndex = dataStartRow + index;
        const row = worksheet.getRow(rowIndex);
        row.height = 55;
  
        const complainant = report.complainant || {};
        const respondent = report.respondent || {};
  
        const complainantFullName = `${complainant.fname || ""} ${complainant.lname || ""}`.trim();
        const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();


  
        const cells = [
          report.caseNumber || "",
          `C- ${complainantFullName}\nR- ${respondentFullName}`,
          report.nature === "Criminal" ? "*" : "",
          report.nature === "Civil" ? "*" : "",
          !["Civil", "Criminal"].includes(report.nature) ? report.nature : "",
          report.isMediation ? "*" : "",
          report.isConciliation ? "*" : "",
          report.isArbitration ? "*" : "",
          "", // blank
          "*", // blank
          "", // blank
          "", // blank
          report.remarks || "",
        ];
        cells.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          };
        });
  
        row.commit();
      });
  
      //  Move footer images
      footerDrawings.forEach(drawing => {
        const offset = luponSettledReports.length;
        if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
        if (drawing.range?.br) drawing.range.br.nativeRow += offset;
      });
  
      //  Save and upload

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Lupon_Pending_Report_${month}_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Lupon Pending Report generated successfully! Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Lupon Pending Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);

      console.error("Error generating Lupon Pending report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Pending Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Lupon Pending Report.");*/
    } finally {
      setLoadingLuponPendingReport(false);
    }
  };
  
  
  const handleGenerateLuponPendingPDF = async () => {
    setLoadingLuponPendingReport(true);
    try {
      const fileUrl = await generateLuponPendingReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
  
      saveAs(blob, `Lupon_Pending_Report_${year}.pdf`);
  
      /*alert("Lupon Pending Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Lupon Pending Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Pending Report PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate PDF.");*/
    } finally {
      setLoadingLuponPendingReport(false);
    }
  };
  
  

  // summary of incident statuses

  const generateIncidentStatusSummaryReport = async () => {
    setLoadingIncidentStatuses(true);
    setIsGenerating(true);
    try {
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
  
      const reportTitle = `INCIDENT STATUS SUMMARY REPORT AS OF ${monthYear.toUpperCase()}`;
  
      const incidentRef = collection(db, "IncidentReports");
      const q = query(incidentRef);
      const querySnapshot = await getDocs(q);
  
      let incidents = querySnapshot.docs.map((doc) => doc.data());
  
      const departments = ["Lupon", "VAWC", "GAD", "BCPC", "Online"];
  
      // Group counts by department and status
      const departmentCounts = departments.map((dept) => {
        const filtered = incidents.filter(
          (incident) => incident.department === dept
        );
        return {
          department: dept,
          pending: filtered.filter((i) => i.status === "Pending").length,
          resolved: filtered.filter((i) => i.status === "Resolved").length,
          settled: filtered.filter((i) => i.status === "Settled").length,
          archived: filtered.filter((i) => i.status === "Archived").length,
          acknowledged: filtered.filter((i) => i.status === "Acknowledged").length,
        };
      });
  
      // Load Excel Template
      const templateRef = ref(
        storage,
        "ReportsModule/Incident Status Summary Report.xlsx"
      );
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      // Set report title
      worksheet.getCell("A1").value = reportTitle;
  
      let startRow = 3;
      departmentCounts.forEach((item, index) => {
        const row = worksheet.getRow(startRow + index);
        row.getCell(1).value = item.department;
        row.getCell(2).value = item.pending;
        row.getCell(3).value = item.resolved;
        row.getCell(4).value = item.settled;
        row.getCell(5).value = item.archived;
        row.getCell(6).value = item.acknowledged;
  
        // Style
        for (let col = 1; col <= 6; col++) {
          const cell = row.getCell(col);
          cell.font = { name: "Calibri", size: 12 };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        }
  
        row.commit();
      });
  
      // Export

      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9, 
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, 
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Incident_Status_Summary_Report_${monthYear.replace(
        " ",
        "_"
      )}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      /*alert("Incident Summary Report generated successfully. Please wait for the downloadable file!");*/
      setGeneratingMessage("Generating Incident Summary Report...");
      return fileUrl;
    } catch (error) {
      console.error("Error generating incident summary report:", error);
      setIsGenerating(false);

      console.error("Error generating report:", error);

      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate East Fairview Resident Report");  
      
      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Incident Summary Report.");*/
    } finally {
      setLoadingIncidentStatuses(false);
    }
  };

  const handleGenerateIncidentStatusSummaryPDF = async () => {
    setLoadingIncidentStatuses(true);
    try {
      const fileUrl = await generateIncidentStatusSummaryReport();
      /*if (!fileUrl) return alert("Failed to generate Excel report.");*/

      if (!fileUrl) {
        setIsGenerating(false); 
  
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
  
        setTimeout(() => {
          setShowErrorGenerateReportPopup(false);
        }, 5000);
        return;
      }

      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
  
      saveAs(blob, `Incident_Status_Summary_Report_${monthYear.replace(" ", "_")}.pdf`);
  
      /*alert("Incident Summary Report successfully converted to PDF!");*/

      setIsGenerating(false); 
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Incident Summary Report generated successfully");
      setShowSuccessGenerateReportPopup(true);

      setTimeout(() => {
        setShowSuccessGenerateReportPopup(false);
      }, 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Incident Summary PDF");    

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
      }, 5000);
      /*alert("Failed to generate Incident Summary PDF.");*/
    } finally {
      setLoadingIncidentStatuses(false);
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

  const router = useRouter();
  const hasInitialized = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [showSuccessGenerateReportPopup, setShowSuccessGenerateReportPopup] = useState(false);
  const [popupSuccessGenerateReportMessage, setPopupSuccessGenerateReportMessage] = useState("");
  const [showErrorGenerateReportPopup, setShowErrorGenerateReportPopup] = useState(false);
  const [popupErrorGenerateReportMessage, setPopupErrorGenerateReportMessage] = useState("");
  const [activeSection, setActiveSection] = useState("generate");
  const [currentPage, setCurrentPage] = useState(1);
  const moduleTotalPages: { [key: string]: number } = {
    "Resident Module": 2,
    "Incident Module": 1,
    "Services Module": 1,
    "Programs Module": 1,
  };
  
  const totalPages = selectedModule ? moduleTotalPages[selectedModule] || 1 : 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModule]);
  

  const handleBack = () => {
    router.back();
  };


  useEffect(() => {
    // Wait until session.user is available
    if (!session?.user || hasInitialized.current) return;
  
    hasInitialized.current = true;
  
    if (session.user.role === "Barangay Official") {
      const position = session.user.position;
  
      if (["Secretary", "Assistant Secretary", "Punong Barangay"].includes(position)) {
        setSelectedModule("Resident Module");
      } else if (position === "LF Staff") {
        setSelectedModule("Incident Module");
      } else if (position === "Admin Staff") {
        setSelectedModule("Services Module");
      }
    }
  }, [session?.user]);


 

  return (
    <div className="generatereport-main-container">

      {/* NEW*/}
      <div className="generatereport-redirectionpage-section">
        <button 
          className={`generatereport-redirection-buttons ${activeSection === "generate" ? "active" : ""}`}
          onClick={() => setActiveSection("generate")}
        >
          <div className="generatereport-redirection-icons-section">
            <img src="/images/report.png" alt="user info" className="redirection-icons-generatereport"/> 
          </div>
          <h1>Generate Report</h1>
        </button>

        <button 
          className={`generatereport-redirection-buttons ${activeSection === "download" ? "active" : ""}`}
          onClick={() => setActiveSection("download")}
        >
          <div className="generatereport-redirection-icons-section">
            <img src="/images/form.png" alt="user info" className="redirection-icons-generatereport"/> 
          </div>
          <h1>Download Form</h1>
        </button>

      </div>


    {activeSection === "generate" && (
      <>
        <div className="generatereport-main-content">
          <div className="generatereport-main-section1">
            <div className="generatereport-main-section1-left">
              <button onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
              <h1> Generate Report </h1>
            </div>
          </div>

          <div className="generatereport-header-body">
            <div className="generatereport-header-body-top-section">
              <div className="moduleDropdown-container">
              <select
                className="moduleDropdown"
                title="Select a Module"
                onChange={handleModuleChange}
                value={selectedModule}
                required
              >
                  <option value="">Select Module</option>
                      {session?.user?.role === "Barangay Official" &&
                        (
                          session?.user?.position === "Secretary" ||
                          session?.user?.position === "Assistant Secretary" ||
                          session?.user?.position === "Punong Barangay"
                        ) && (
                          <option value="Resident Module">Resident Module</option>
                      )}

                      {session?.user?.role === "Barangay Official" &&
                        (
                          session?.user?.position === "LF Staff" ||
                          session?.user?.position === "Assistant Secretary" ||
                          session?.user?.position === "Secretary" ||
                          session?.user?.position === "Punong Barangay"
                        ) && (
                          <option value="Incident Module">Incident Module</option>
                      )}

                      {session?.user?.role === "Barangay Official" &&
                        (
                          session?.user?.position === "Secretary" ||
                          session?.user?.position === "Punong Barangay" ||
                          session?.user?.position === "Assistant Secretary" ||
                          session?.user?.position === "Admin Staff"
                        ) && (
                          <option value="Services Module">Services Module</option>
                      )}
                      {session?.user?.role === "Barangay Official" && (
                          <option value="Programs Module">Programs Module</option>
                      )}
                </select>
              </div>
            </div>

            <div className="generatereport-header-body-bottom-section">

            {selectedModule && (
              <div className="generatereport-button-redirection-container">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <img src="/Images/back.png" className="redirection-reports-button" />
                </button>

              </div>
            )}

              <div className="generatereport-main-reports-section">
              {selectedModule === "Resident Module" && (
                <>
                  {currentPage === 1 && (
                    <div className="report-grid">
                      <button onClick={handleRegistrationSummaryPDF} disabled={loadingRegistrationSummary} className="report-tile">
                      <img src="/images/regresident.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingRegistrationSummary ? "Generating..." : "Resident Registration Summary Report"}
                        </p>
                      </button>

                      <button onClick={handleGenerateSeniorPDF} disabled={loadingResidentSeniorDemographic} className="report-tile">
                        <img src="/images/senior.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingResidentSeniorDemographic ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Demographic Report <br/> (Senior Citizens)
                            </>
                          )}
                          
                        </p>
                      </button>

                      <button onClick={handleGenerateStudentPDF} disabled={loadingResidentStudentDemographic} className="report-tile">
                        <img src="/images/students.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingResidentStudentDemographic ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Demographic Report <br/> (Students/Minors)
                            </>
                          )}
                        </p>
                      </button>

                      <button onClick={handleGeneratePwdPDF} disabled={loadingResidentPWDDemographic} className="report-tile">
                        <img src="/images/disabled.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingResidentPWDDemographic ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Demographic Report <br/> (PWD)
                            </>
                          )}
                        </p>
                      </button>

                      <button onClick={handleGenerateSoloParentPDF} disabled={loadingResidentSoloParentDemographic} className="report-tile">
                        <img src="/images/soloparent.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingResidentSoloParentDemographic ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Demographic Report<br /> (Solo Parents)
                            </>
                          )}
                        </p>
                      </button>

                      <button onClick={handleGenerateResidentPDF} disabled={loadingMasterResident} className="report-tile">
                        <img src="/images/form.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingMasterResident ? "Generating..." : "Masterlist Resident Inhabitant Record"}
                        </p>
                      </button>
                    </div>
                  )}

                  {currentPage === 2 && (
                    <div className="report-grid">
                      <button onClick={handleGenerateEastResidentPDF} disabled={loadingEastResident} className="report-tile">
                        <img src="/images/east.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                        {loadingEastResident ? (
                          "Generating..."
                        ) : (
                          <>
                            Resident Inhabitant Record<br />
                            (East Fairview)
                          </>
                        )}
                        </p>
                      </button>

                      <button onClick={handleGenerateWestResidentPDF} disabled={loadingWestResident} className="report-tile">
                        <img src="/images/west.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingWestResident ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Inhabitant Record<br />
                              (West Fairview)
                            </>
                          )}
                        </p>
                      </button>

                      <button onClick={handleGenerateSouthResidentPDF} disabled={loadingSouthResident} className="report-tile">
                        <img src="/images/south.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingSouthResident ? (
                            "Generating..."
                          ) : (
                            <>
                              Resident Inhabitant Record<br />
                              (South Fairview)
                            </>
                          )}
                        </p>
                      </button>

                      <button onClick={handleGenerateKasambahayPDF} disabled={loadingKasambahay} className="report-tile">
                        <img src="/images/form.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingKasambahay ? "Generating..." : "Kasambahay Masterlist"}
                        </p>
                      </button>

                      <button onClick={handleGenerateJobSeekerPDF} disabled={loadingJobSeeker} className="report-tile">
                        <img src="/images/jobseeker.png" alt="user info" className="report-icon-bigger"/> 
                        <p className="report-title">
                          {loadingJobSeeker ? "Generating..." : "First-Time Job Seeker List"}
                        </p>
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedModule === "Incident Module" && (
                <>
                  {currentPage === 1 && (
                    <div className="report-grid">
                      <button onClick={handleGenerateIncidentSummaryPDF} disabled={loadingIncidentSummary} className="report-tile">
                        <img src="/images/incident.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                        {loadingIncidentSummary ? "Generating..." : "All Incidents Summary"}
                        </p>
                      </button>

                      <button onClick={handleGenerateIncidentStatusSummaryPDF} disabled={loadingIncidentStatuses} className="report-tile">
                        <img src="/images/incidentstatus.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingIncidentStatuses ? "Generating..." : "Incident Status Summary"}
                        </p>
                      </button>

                      {(session?.user?.department === "Lupon" || session?.user?.position === "Assistant Secretary") && (
                        <>
                          <button onClick={handleGenerateLuponSettledPDF} disabled={loadingLuponSettledReport} className="report-tile">
                            <img src="/images/incidentsettled.png" alt="user info" className="report-icon-bigger"/> 
                            <p className="report-title">
                              {loadingLuponSettledReport ? "Generating..." : "Lupon Settled Report"}
                            </p>
                          </button>

                          <button onClick={handleGenerateLuponPendingPDF} disabled={loadingLuponPendingReport} className="report-tile">
                            <img src="/images/incidentpending.png" alt="user info" className="report-icon-bigger"/> 
                            <p className="report-title">
                              {loadingLuponPendingReport ? "Generating..." : "Lupon Pending Report"}
                            </p>
                          </button>
                        </>
                      )}

                      {(session?.user?.department === "VAWC" || session?.user?.position === "Assistant Secretary") && (
                        <>
                          <button onClick={handleGenerateVAWCPDF} disabled={loadingVAWCReport} className="report-tile">
                            <img src="/images/womenandchildren.png" alt="user info" className="report-icon-bigger"/> 
                            <p className="report-title">
                              {loadingVAWCReport ? "Generating..." : "Monthly VAWC Report"}
                            </p>
                          </button>
                        </>
                      )}

                      {(session?.user?.department === "GAD" || session?.user?.department === "BCPC" || session?.user?.position === "Assistant Secretary")  && (
                        <>
                          <button  className="report-tile">
                            <img src="/images/genders.png" alt="user info" className="report-icon"/> 
                            <p className="report-title">
                              GADRCO Quarterly Monitoring Report
                            </p>
                          </button>
                        </>
                      )}

                    </div>
                  )}
                </>
              )}  

              {selectedModule === "Services Module" && (
                <>
                  {currentPage === 1 && (
                    <div className="report-grid">
                      <button  className="report-tile">
                        <img src="/images/services.png" alt="user info" className="report-icon"/> 
                          <p className="report-title">
                            Most Requested Services Lists
                          </p>
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedModule === "Programs Module" && (
                <>
                  {currentPage === 1 && (
                    <div className="report-grid">
                      <button  className="report-tile">
                        <img src="/images/participation.png" alt="user info" className="report-icon"/> 
                          <p className="report-title">
                            Program Participation Report
                          </p>
                      </button>
                      <button  className="report-tile">
                        <img src="/images/status.png" alt="user info" className="report-icon-bigger"/> 
                          <p className="report-title">
                            Program Completion Status Report
                          </p>
                      </button>
                    </div>
                  )}
                </>
              )}

                
              </div>

            {selectedModule && (
              <div className="generatereport-button-redirection-container">
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, 2))}
                  disabled={
                    currentPage === 2 || 
                    selectedModule === "Incident Module" || 
                    selectedModule === "Services Module" || 
                    selectedModule === "Programs Module"
                  }
                >
                  <img src="/Images/next.png" className="redirection-reports-button" />
                </button>
              </div>
            )}
            </div>

          </div>
        </div>
      </>
    )}

    {activeSection === "download" && (
      <>
        <div className="generatereport-main-content">
          <div className="generatereport-main-section1">
            <div className="generatereport-main-section1-left">
              <button onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
              <h1> Download Form </h1>
            </div>
          </div>

          <div className="generatereport-header-body">
           

          </div>
        </div>
      </>
    )}


{/*

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
              <option value="">Select Module</option>
                  {session?.user?.role === "Barangay Official" &&
                    (
                      session?.user?.position === "Secretary" ||
                      session?.user?.position === "Assistant Secretary" ||
                      session?.user?.position === "Punong Barangay"
                    ) && (
                      <option value="Resident Module">Resident Module</option>
                  )}

                  {session?.user?.role === "Barangay Official" &&
                    (
                      session?.user?.position === "LF Staff" ||
                      session?.user?.position === "Assistant Secretary" ||
                      session?.user?.position === "Secretary" ||
                      session?.user?.position === "Punong Barangay"
                    ) && (
                      <option value="Incident Module">Incident Module</option>
                  )}

                  {session?.user?.role === "Barangay Official" &&
                    (
                      session?.user?.position === "Secretary" ||
                      session?.user?.position === "Punong Barangay" ||
                      session?.user?.position === "Assistant Secretary" ||
                      session?.user?.position === "Admin Staff"
                    ) && (
                      <option value="Services Module">Services Module</option>
                  )}
                  {session?.user?.role === "Barangay Official" && (
                      <option value="Programs Module">Programs Module</option>
                  )}
            </select>
          </div>

          {selectedModule === "Resident Module" && (
            <>
              <button onClick={handleRegistrationSummaryPDF} disabled={loadingRegistrationSummary} className="report-button">
                {loadingRegistrationSummary ? "Generating..." : "Generate Resident Registration Summary Report"}
              </button>
              <button onClick={handleGenerateSeniorPDF} disabled={loadingResidentSeniorDemographic} className="report-button">
                {loadingResidentSeniorDemographic ? "Generating..." : "Generate Resident Demographic Report(Senior Citizens)"}
              </button>
              <button onClick={handleGenerateStudentPDF} disabled={loadingResidentStudentDemographic} className="report-button">
                {loadingResidentStudentDemographic ? "Generating..." : "Generate Resident Demographic Report(Students/Minors)"}
              </button> 
              <button onClick={handleGeneratePwdPDF} disabled={loadingResidentPWDDemographic} className="report-button">
                {loadingResidentPWDDemographic ? "Generating..." : "Generate Resident Demographic Report(PWD)"}
              </button>   
              <button onClick={handleGenerateSoloParentPDF} disabled={loadingResidentSoloParentDemographic} className="report-button">
                {loadingResidentSoloParentDemographic ? "Generating..." : "Generate Resident Demographic Report(Solo Parents)"}
              </button>    
              <button onClick={handleGenerateResidentPDF} disabled={loadingMasterResident} className="report-button">
                {loadingMasterResident ? "Generating..." : "Generate Master Resident Inhabitant Record"}
              </button>
              <button onClick={handleGenerateEastResidentPDF} disabled={loadingResidentSeniorDemographic} className="report-button">
                {loadingEastResident ? "Generating..." : "Generate East Resident Inhabitant Record"}
              </button>
              <button onClick={handleGenerateWestResidentPDF} disabled={loadingWestResident} className="report-button">
                {loadingWestResident ? "Generating..." : "Generate West Resident Inhabitant Record"}
              </button>
              <button onClick={handleGenerateSouthResidentPDF} disabled={loadingSouthResident} className="report-button">
                {loadingSouthResident ? "Generating..." : "Generate South Resident Inhabitant Record"}
              </button>
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
              <button onClick={handleGenerateIncidentSummaryPDF} disabled={loadingIncidentSummary} className="report-button">
                {loadingIncidentSummary ? "Generating..." : "All Incidents Summary"}
              </button>      
              <button onClick={handleGenerateIncidentStatusSummaryPDF} disabled={loadingIncidentStatuses} className="report-button">
                {loadingIncidentStatuses ? "Generating..." : "Incident Status Summary"}
              </button>             
          {(session?.user?.department === "Lupon" || session?.user?.position === "Assistant Secretary") && (
            <>
              <button onClick={handleGenerateLuponSettledPDF} disabled={loadingLuponSettledReport} className="report-button">
                {loadingLuponSettledReport ? "Generating..." : "Lupon Settled Report"}
              </button>   
              <button onClick={handleGenerateLuponPendingPDF} disabled={loadingLuponPendingReport} className="report-button">
                {loadingLuponPendingReport ? "Generating..." : "Lupon Pending Report"}
              </button>   
            </>
          )}
          {(session?.user?.department === "VAWC" || session?.user?.position === "Assistant Secretary") && (
            <>
              <button onClick={handleGenerateVAWCPDF} disabled={loadingVAWCReport} className="report-button">
                {loadingVAWCReport ? "Generating..." : "Monthly VAWC Report"}
              </button>      
            </>
          )}
          {(session?.user?.department === "GAD" || session?.user?.department === "BCPC" || session?.user?.position === "Assistant Secretary")  && (
            <>
              <button className="report-button">GADRCO Quarterly Monitoring Report</button>
            </>
          )}

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

*/}

{/*
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

<h2 className="report-title">Upload a File</h2>  

<div className="upload-section">
      <div className="upload-container-brgyside">
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
{/*}
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

  */}

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

      {/* Generating of Report Popup */}
      {isGenerating && (
        <div className="popup-backdrop">
          <div className="popup-content">
            <img src="/Images/loading.png" alt="loading..." className="successful-icon-popup-letter" />
            <p>{generatingMessage}</p>
          </div>
        </div>
      )}

      {/* Success Generate Report Popup*/}
      {showSuccessGenerateReportPopup && (
        <div className={`popup-overlay-success-generate-report show`}>
          <div className="popup-success-generate-report">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupSuccessGenerateReportMessage}</p>
          </div>
        </div>
      )}

      {/* Success Generate Report Popup*/}
      {showErrorGenerateReportPopup && (
        <div className={`popup-overlay-error-generate-report show`}>
          <div className="popup-error-generate-report">
          <img src={ "/Images/warning-1.png"} alt="icon alert" className="icon-alert" />
            <p>{popupErrorGenerateReportMessage}</p>
          </div>
        </div>
      )}


      
    </div>
  );
};

export default ReportsPage;
