"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";
import { useSession } from "next-auth/react";


interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {

  // rbac

  const { data: session } = useSession();


  const [loadingKasambahay, setLoadingKasambahay] = useState(false); 
  const [loadingJobSeeker, setLoadingJobSeeker] = useState(false);    
  const [loadingMasterResident, setLoadingMasterResident] = useState(false);    
  const [loadingEastResident, setLoadingEastResident] = useState(false);
  const [loadingWestResident, setLoadingWestResident] = useState(false);    
  const [loadingSouthResident, setLoadingSouthResident] = useState(false);  
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

  // kasambahay report

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

  // jobseekers
  
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
  

  // all residents

  const generateResidentListReport = async () => {
    setLoadingMasterResident(true);
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
  
      residents.sort((a, b) => {
        const nameCompare = (a.lastName || "").localeCompare(b.lastName || "");
        if (nameCompare !== 0) return nameCompare;
        return (a.address || "").localeCompare(b.address || "");
      });

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
      setLoadingMasterResident(false);
    }
  };

  const handleGenerateResidentPDF = async () => {
    setLoadingMasterResident(true);
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
      setLoadingMasterResident(false);
    }
  };
  
  // residents per general location
  // east fairview
  const generateEastResidentListReport = async () => {
    setLoadingEastResident(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - EAST FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      const addressGroups = {
        "RINA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("Rina")
        ),
        "SAMAFA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("SAMAFA")
        ),
        "SAMAPLI": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("SAMAPLI")
        ),
        "SITIO KISLAP": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("SITIO KISLAP")
        ),
        "EFHAI": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("EFHAI")
        ),
      };
  
      const filteredGroups = Object.entries(addressGroups).filter(([key, value]) => value.length > 0);
  
      if (filteredGroups.length === 0) {
        alert("No residents found.");
        setLoadingEastResident(false);
        return;
      }
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = reportTitle;
  
      let insertionRow = 3;
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        // Sort by lastName, then by firstName
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) {
            return firstA.localeCompare(firstB);
          }
          return lastA.localeCompare(lastB);
        });
  
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = {
          name: "Times New Roman",
          size: 14,
          bold: true
        };
        headerCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };
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
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`;
  
          const cells = [
            count,
            fullName.trim(),
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
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_EastFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("Resident List for East Fairview generated successfully. Please wait for the downloadable file!");
  
      return fileUrl;
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate East Fairview Resident Report.");
    } finally {
      setLoadingEastResident(false);
    }
  };  
  
  const handleGenerateEastResidentPDF = async () => {
    setLoadingEastResident(true);
    try {
      const fileUrl = await generateEastResidentListReport();
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
  
      saveAs(blob, `Inhabitant_Record_EastFairview_${year}.pdf`);
  
      alert("Resident Report (East Fairview) successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
    setLoadingEastResident(false);
    }
  };

  const generateWestResidentListReport = async () => {
    setLoadingWestResident(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - WEST FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      const addressGroups = {
        "AUSTIN": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("AUSTIN")
        ),
        "BASILIO 1": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("BASILIO 1")
        ),
        "DARISNAI": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("DARISNAI")
        ),
        "MUSTANG BENZ": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("MUSTANG BENZ")
        ),
        "ULNA": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("ULNA")
        ),
        "UNITED FAIRLANE": residents.filter((resident) =>
          resident.cluster && resident.cluster.includes("UNITED FAIRLANE")
        ),
        "URLINA": residents.filter((resident) =>
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
  
      const filteredGroups = Object.entries(addressGroups).filter(([key, value]) => value.length > 0);
  
      if (filteredGroups.length === 0) {
        alert("No residents found.");
        setLoadingWestResident(false);
        return;
      }
  
      const templateRef = ref(storage, "ReportsModule/INHABITANT RECORD TEMPLATE.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A1").value = reportTitle;
  
      let insertionRow = 3;
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        // Sort by lastName, then by firstName
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) {
            return firstA.localeCompare(firstB);
          }
          return lastA.localeCompare(lastB);
        });
  
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = {
          name: "Times New Roman",
          size: 14,
          bold: true
        };
        headerCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };
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
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`;
  
          const cells = [
            count,
            fullName.trim(),
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
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_WestFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("Resident List for West Fairview generated successfully. Please wait for the downloadable file!");
  
      return fileUrl;
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate West Fairview Resident Report.");
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
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - South FAIRVIEW`;
  
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
  
      const filteredGroups = Object.entries(addressGroups).filter(([key, value]) => value.length > 0);
  
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
  
      worksheet.getCell("A1").value = reportTitle;
  
      let insertionRow = 3;
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        // Sort by lastName, then by firstName
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
  
          if (lastA === lastB) {
            return firstA.localeCompare(firstB);
          }
          return lastA.localeCompare(lastB);
        });
  
        worksheet.mergeCells(insertionRow, 1, insertionRow, 12);
        const headerRow = worksheet.getRow(insertionRow);
        const headerCell = headerRow.getCell(1);
  
        headerCell.value = group;
        headerCell.font = {
          name: "Times New Roman",
          size: 14,
          bold: true
        };
        headerCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };
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
          const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`;
  
          const cells = [
            count,
            fullName.trim(),
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
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Inhabitant_Record_SouthFairview_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
  
      alert("Resident List for South Fairview generated successfully. Please wait for the downloadable file!");
  
      return fileUrl;
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate South Fairview Resident Report.");
    } finally {
      setLoadingSouthResident(false);
    }
  };  
  
  
  const handleGenerateSouthResidentPDF = async () => {
    setLoadingSouthResident(true);
    try {
      const fileUrl = await generateSouthResidentListReport();
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
  
      saveAs(blob, `Inhabitant_Record_SouthFairview_${year}.pdf`);
  
      alert("Resident Report (South Fairview) successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingSouthResident(false);
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
                      session?.user?.position === "LT Staff" ||
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
              <button onClick={handleGenerateResidentPDF} disabled={loadingMasterResident} className="report-button">
                {loadingMasterResident ? "Generating..." : "Generate Resident Masterlist"}
              </button>
              <button onClick={handleGenerateEastResidentPDF} disabled={loadingEastResident} className="report-button">
                {loadingEastResident ? "Generating..." : "Generate East Resident List"}
              </button>

              <button onClick={handleGenerateWestResidentPDF} disabled={loadingWestResident} className="report-button">
                {loadingWestResident ? "Generating..." : "Generate West Resident List"}
              </button>

              <button onClick={handleGenerateSouthResidentPDF} disabled={loadingSouthResident} className="report-button">
                {loadingSouthResident ? "Generating..." : "Generate South Resident List"}
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
              <button className="report-button">Summary of Incidents</button>
              <button className="report-button">Incident Status Summary</button>
          
          {session?.user?.department === "Lupon" && (
            <>
              <button className="report-button">Lupon Settled Report</button>
              <button className="report-button">Lupon Pending Report</button>
            </>
          )}
          {session?.user?.department === "VAWC" && (
            <>
              <button className="report-button">Monthly VAWC Report</button>
            </>
          )}
          {session?.user?.department === "GAD" || session?.user?.department === "BCPC"  && (
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
