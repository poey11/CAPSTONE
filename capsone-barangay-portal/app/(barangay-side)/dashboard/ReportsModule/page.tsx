"use client";
import { useState, useEffect, useRef} from "react";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData, addDoc } from "firebase/firestore";
import ExcelJS from 'exceljs';
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonthYearModal } from "@/app/(barangay-side)/components/MonthYearModal"; 
import { NatureOfWorkModal } from "@/app/(barangay-side)/components/NatureOfWorkModal"; 
import { ServiceMonthYearModal } from "@/app/(barangay-side)/components/ServiceMonthYearModal"; 
import { DepartmentalReportModal } from "@/app/(barangay-side)/components/DepartmentalReportModal"; 





interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {

  // rbac
  const { data: session } = useSession();

  // file upload rbac
  const canSelectFolder = ["Secretary", "Assistant Secretary", "Punong Barangay"].includes(session?.user?.position || "");
  const canUpload = session?.user?.position === "Assistant Secretary";


  // for residents
  const [loadingKasambahay, setLoadingKasambahay] = useState(false); 
  const [loadingJobSeeker, setLoadingJobSeeker] = useState(false);
  const [showKasambahayModal, setShowKasambahayModal] = useState(false);


  // inhabitant record
  const [loadingMasterResident, setLoadingMasterResident] = useState(false);    
  const [loadingEastResident, setLoadingEastResident] = useState(false);
  const [loadingWestResident, setLoadingWestResident] = useState(false);    
  const [loadingSouthResident, setLoadingSouthResident] = useState(false);  
  const [loadingRegistrationSummary, setLoadingRegistrationSummary] = useState(false); 
  
  const [showResidentSummaryModal, setShowResidentSummaryModal] = useState(false);


  // for resident demographic reports
  const [loadingResidentSeniorDemographic, setLoadingResidentSeniorDemographic] = useState(false);  
  const [loadingResidentStudentDemographic, setLoadingResidentStudentDemographic] = useState(false);  
  const [loadingResidentPWDDemographic, setLoadingResidentPWDDemographic] = useState(false);  
  const [loadingResidentSoloParentDemographic, setLoadingResidentSoloParentDemographic] = useState(false);  
  


  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

  // for incident reports
  const [loadingVAWCReport, setLoadingVAWCReport] = useState(false);

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showAdminDepartmentModal, setShowAdminDepartmentModal] = useState(false);

  
  const [loadingLuponSettledReport, setLoadingLuponSettledReport] = useState(false);    
  const [loadingLuponPendingReport, setLoadingLuponPendingReport] = useState(false);    
  const [loadingIncidentSummary, setLoadingIncidentSummary] = useState(false);    
  const [loadingIncidentStatuses, setLoadingIncidentStatuses] = useState(false);    
  const [loadingGADRCOMonitoringReport, setGADRCOMonitoringReport] = useState(false);    

  const [showIncidentSummaryModal, setShowIncidentSummaryModal] = useState(false);    
  const [showVAWCModal, setShowVAWCModal] = useState(false);


  // for services reports

  const [loadingBarangayCertPending, setLoadingBarangayCertPending] = useState(false);    
  const [loadingBarangayCertCompleted, setLoadingBarangayCertCompleted] = useState(false);    
  const [loadingBarangayCertMonthly, setLoadingBarangayCertMonthly] = useState(false);    
  
  const [showCertMonthlyModal, setShowCertMonthlyModal] = useState(false);
  const [showCompletedCertModal, setShowCompletedCertModal] = useState(false);
  const [showPendingCertModal, setShowPendingCertModal] = useState(false);

  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const storage = getStorage();
  const db = getFirestore();



  
// Downloadable Forms

  const [files, setFiles] = useState<FileData[]>([]);
  const [showUploadFilePopup, setShowUploadFilePopup] = useState(false);
  const uploadFilePopUpRef = useRef<HTMLDivElement>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<{ status: boolean; message: string }>({
    status: false,
    message: "",
  });

const [selectedFolder, setSelectedFolder] = useState<string>("ReportsModule/");
const [viewingFolder, setViewingFolder] = useState<string>("ReportsModule/");




const fetchDownloadLinks = async () => {
  try {
    const folderRef = ref(storage, viewingFolder);
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
}, [viewingFolder]);


const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files[0]) {
    setSelectedUploadFile(event.target.files[0]);
  }
};

const onDeleteFile = () => {
  setSelectedUploadFile(null);
};


const uploadFile = async () => {
  if (!selectedUploadFile) return;
  if (!selectedFolder) {
    setPopupMessage("Please select a folder.");
    setShowPopup(true);
    return;
  }

  setIsLoading({ status: true, message: "Uploading File, please wait..." });

  try {
    const fileRef = ref(storage, `${selectedFolder}${selectedUploadFile.name}`);
    await uploadBytes(fileRef, selectedUploadFile);
    setPopupMessage("File Uploaded Successfully!");
    setSelectedUploadFile(null);
    fetchDownloadLinks();
  } catch (error) {
    console.error("Upload failed:", error);
    setPopupMessage("File upload failed. Please try again.");
  } finally {
    setShowUploadFilePopup(false);
    setTimeout(() => {
      setIsLoading({ status: false, message: "" });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }, 2000);
  }
};


const handleUploadClick = () => {
  setShowUploadFilePopup(true);
};

const handleDeleteClick = (fileName: string) => {
  setFileToDelete(fileName);
  setShowDeletePopup(true);
  setTimeout(() => {
    setShowPopup(false);
  }, 3000);
};


const confirmDelete = async () => {
  if (!fileToDelete) return;

  const fileRef = ref(storage, `${viewingFolder}${fileToDelete}`);
  try {
    await deleteObject(fileRef);
    setPopupMessage("File deleted successfully!");
    setFiles((prev) => prev.filter((file) => file.name !== fileToDelete));
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Failed to delete file.");
  }

  setShowPopup(true);
  setShowDeletePopup(false);
  setFileToDelete(null);
};

useEffect(() => {
  const handleClickUploadFileOutside = (event: MouseEvent) => {
    if (uploadFilePopUpRef.current && !uploadFilePopUpRef.current.contains(event.target as Node)) {
      setShowUploadFilePopup(false);
    }
  };
  document.addEventListener("mousedown", handleClickUploadFileOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickUploadFileOutside);
  };
}, []);

  
  
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
  const searchParams = useSearchParams();

useEffect(() => {
    const section = searchParams.get("section");
    if (!section) {
      router.push("/dashboard/ReportsModule?section=generate");
    }
  }, [searchParams, router]);
  
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



const ITEMS_PER_PAGE = 6;
const [currentPageForms, setCurrentPageForms] = useState(0);
const startIndex = currentPageForms * ITEMS_PER_PAGE;
const paginatedFiles = files.slice(startIndex, startIndex + ITEMS_PER_PAGE);


const handleNextPage = () => {
  if ((currentPageForms + 1) * ITEMS_PER_PAGE < files.length) {
    setCurrentPageForms((prev) => prev + 1);
  }
};


const handleBackPage = () => {
  if (currentPageForms > 0) {
    setCurrentPageForms((prev) => prev - 1);
  }
};


useEffect(() => {

  const handleClickUploadFileOutside = (event: MouseEvent) => {

    if(
       uploadFilePopUpRef.current &&
       !uploadFilePopUpRef.current.contains(event.target as Node)
    ) {
    setShowUploadFilePopup(false);        
    }

  };

   document.addEventListener("mousedown", handleClickUploadFileOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickUploadFileOutside);
  };
  
}, []);




const [activeSectionForms, setActiveSectionForms] = useState("resident");

useEffect(() => {
  setCurrentPageForms(0);
}, [viewingFolder]);

const uploadForms = async (url: string): Promise<void> => {
  setIsLoading({ status: true, message: "Downloading Form, please wait..." });

  try {
    window.location.href = url;

    await new Promise(resolve => setTimeout(resolve, 1000));

    setPopupMessage("File download successful!");
  } catch (error) {
    console.error("Error in uploadForms:", error);
  } finally {
    // End loading after 2 seconds
    setTimeout(() => {
      setIsLoading({ status: false, message: "" });

      // Show popup after loading is done
      setShowPopup(true);

      // Hide popup after 2 more seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    }, 2000);
  }
};

  // kasambahay report

  const natureOfWorkMap: Record<number, string> = {
    1: "Gen. House Help (All Around)",
    2: "YAYA",
    3: "COOK",
    4: "Gardener",
    5: "Laundry Person",
    6: "Others"
  };
  

  const generateKasambahayReport = async (natureOfWork: string) => {
    setLoadingKasambahay(true);
    setIsGenerating(true);
  
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  
      const kasambahayRef = collection(db, "KasambahayList");
      const q = query(kasambahayRef);
      const snapshot = await getDocs(q);
  
      let allMembers = snapshot.docs.map(doc => doc.data());
  
      // Filter by natureOfWork if not "All"
      if (natureOfWork !== "All") {
        allMembers = allMembers.filter(member => member.natureOfWork === Number(natureOfWork));
      }
  
      // Split into old & current month
      const oldMembers = allMembers.filter(member => {
        const createdDate = new Date(member.createdAt);
        return createdDate.getFullYear() < currentDate.getFullYear() ||
              (createdDate.getFullYear() === currentDate.getFullYear() && createdDate.getMonth() < currentDate.getMonth());
      });
  
      const currentMonthMembers = allMembers.filter(member => {
        const createdDate = new Date(member.createdAt);
        return createdDate.getFullYear() === currentDate.getFullYear() &&
               createdDate.getMonth() === currentDate.getMonth();
      });
  
      if (oldMembers.length === 0 && currentMonthMembers.length === 0) {
        alert(`No Kasambahay records${natureOfWork !== "All" ? ` for ${natureOfWork}` : ""}.`);
        return null;
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
        if (drawing.range?.br) drawing.range.br.nativeRow = 0;
      });
  
      let oldInsertionRow = footerStartRow + 1;
      let newInsertionRow = footerStartRow + oldMembers.length + 2;
  
      // Insert old records
      oldMembers.forEach((member) => {
        const row = worksheet.getRow(oldInsertionRow);
        row.height = 100;
  
        const cells = [
          member.registrationControlNumber,
          member.lastName?.toUpperCase(),
          member.firstName?.toUpperCase(),
          member.middleName?.toUpperCase(),
          member.homeAddress?.toUpperCase(),
          member.placeOfBirth?.toUpperCase(),
          `${String(new Date(member.dateOfBirth).getMonth() + 1).padStart(2, "0")}/${String(new Date(member.dateOfBirth).getDate()).padStart(2, "0")}/${new Date(member.dateOfBirth).getFullYear()}`,
          member.sex === "Female" ? "F" : member.sex === "Male" ? "M" : "",
          member.age,
          member.civilStatus?.toUpperCase(),
          member.educationalAttainment,
          member.natureOfWork,
          member.employmentArrangement,
          member.salary,
          member.sssMember ? "YES" : "NO",
          member.pagibigMember ? "YES" : "NO",
          member.philhealthMember ? "YES" : "NO",
          member.employerName?.toUpperCase(),
          member.employerAddress?.toUpperCase()
        ];
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 21 };
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
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
  
      // Header row for new members
      const headerRow = worksheet.getRow(footerStartRow + oldMembers.length + 1);
      worksheet.unMergeCells(footerStartRow + oldMembers.length + 1, 1, footerStartRow + oldMembers.length + 1, 18);
      headerRow.getCell(1).value = `(NEW MEMBERS ${currentMonthYear})`;
      headerRow.getCell(1).font = { bold: true, italic: true, size: 21, color: { argb: "FF0000" } };
      headerRow.height = 25;
      headerRow.alignment = { horizontal: "left", vertical: "middle" };
      worksheet.mergeCells(footerStartRow + oldMembers.length + 1, 1, footerStartRow + oldMembers.length + 1, 18);
      headerRow.commit();
  
      // Insert current month records
      currentMonthMembers.forEach((member) => {
        const row = worksheet.getRow(newInsertionRow);
        row.height = 100;
  
        const cells = [
          member.registrationControlNumber,
          member.lastName?.toUpperCase(),
          member.firstName?.toUpperCase(),
          member.middleName?.toUpperCase(),
          member.homeAddress?.toUpperCase(),
          member.placeOfBirth?.toUpperCase(),
          `${String(new Date(member.dateOfBirth).getMonth() + 1).padStart(2, "0")}/${String(new Date(member.dateOfBirth).getDate()).padStart(2, "0")}/${new Date(member.dateOfBirth).getFullYear()}`,
          member.sex === "Female" ? "F" : member.sex === "Male" ? "M" : "",
          member.age,
          member.civilStatus?.toUpperCase(),
          member.educationalAttainment,
          member.natureOfWork,
          member.employmentArrangement,
          member.salary,
          member.sssMember ? "YES" : "NO",
          member.pagibigMember ? "YES" : "NO",
          member.philhealthMember ? "YES" : "NO",
          member.employerName?.toUpperCase(),
          member.employerAddress?.toUpperCase()
        ];
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 21 };
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
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
        if (drawing.range?.br) drawing.range.br.nativeRow = newRow + 1;
      });
  
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
  
      const fileName = `Kasambahay_Masterlist_${natureOfWork}_${currentMonthYear.replace(" ", "_")}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      setGeneratingMessage("Generating Kasambahay Masterlist Report...");
      return fileUrl;
    } catch (error) {
      console.error("Error generating Kasambahay Masterlist:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Kasambahay Masterlist");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
      return null;
    } finally {
      setLoadingKasambahay(false);
      setShowKasambahayModal(false);

    }
  };
  
  
  
  
  const handleGenerateKasambahayPDF = async (natureOfWork: string) => {
    setLoadingKasambahay(true);
    try {
      const fileUrl = await generateKasambahayReport(natureOfWork);
  
      if (!fileUrl) {
        setIsGenerating(false);
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
        setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
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
  
      // Use the label instead of number
      let fileLabel = "All";
      if (natureOfWork !== "All") {
        fileLabel = natureOfWorkMap[Number(natureOfWork)] || `Type${natureOfWork}`;
      }
  
      saveAs(blob, `Kasambahay_Masterlist_${fileLabel}_${currentMonthYear}.pdf`);
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Kasambahay Masterlist Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
      setIsGenerating(false);
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Kasambahay Report generated successfully");
      setShowSuccessGenerateReportPopup(true);
      setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Kasambahay Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
      setShowKasambahayModal(false);
    } finally {
      setLoadingKasambahay(false);
      setIsGenerating(false); 

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
  
      const currentMonthYear = currentDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }).toUpperCase();
  
      const previousMonth = currentDate.getMonth();
      const previousYear = previousMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      const previousMonthName = String(previousMonth === 0 ? 12 : previousMonth).padStart(2, "0");
      const previousMonthYear = new Date(previousYear, previousMonth, 1)
        .toLocaleString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
  
      const jobSeekerRef = collection(db, "JobSeekerList");
  
      const qOldRecords = query(
        jobSeekerRef,
        where("createdAt", "<", `${year}-${month}-01`),
        where("firstTimeClaimed", "==", true)
      );
      const oldRecordsSnapshot = await getDocs(qOldRecords);
      const oldSeekers = oldRecordsSnapshot.docs.map((doc) => doc.data());
  
      const qCurrentMonthRecords = query(
        jobSeekerRef,
        where("createdAt", ">=", `${year}-${month}-01`),
        where("createdAt", "<=", `${year}-${month}-31`),
        where("firstTimeClaimed", "==", true)
      );
      const currentMonthSnapshot = await getDocs(qCurrentMonthRecords);
      const currentMonthSeekers = currentMonthSnapshot.docs.map((doc) => doc.data());
  
      if (oldSeekers.length === 0 && currentMonthSeekers.length === 0) {
        alert("No new job seekers found.");
        setLoadingJobSeeker(false);
        return;
      }
  
      const templateRef = ref(storage, "ReportsModule/First Time Job Seeker Record.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      const monthNames = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const reportTitle = `AS OF ${currentMonthYear.toUpperCase()}`;
      worksheet.getCell("A1").value = "(RA 11261 - FIRST TIME JOBSEEKERS ACT)\nROSTER OF BENEFICIARIES/AVAILEES\nBARANGAY FAIRVIEW\nQUEZON CITY";
      worksheet.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      worksheet.getCell("A2").value = reportTitle;

      for (let rowNum = 1; rowNum <= 4; rowNum++) {
        const row = worksheet.getRow(rowNum);
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        });
        row.commit();
      }
  
      const dataStartRow = 5;
      const footerStartRow = 5; // updated from 10
  
      const headerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow === 0);
      const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= footerStartRow);
  
      worksheet.spliceRows(dataStartRow, 0, ...new Array(oldSeekers.length + currentMonthSeekers.length + 2).fill([]));
  
      // Reset header positions
      headerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow = 0;
        if (drawing.range?.br) drawing.range.br.nativeRow = 0;
      });
      
      let oldInsertionRow = dataStartRow;
      let newInsertionRow = oldInsertionRow + oldSeekers.length + 2;
      
  
      const formatSeekerRow = (seeker: {
        dateApplied?: string;
        lastName?: string;
        firstName?: string;
        middleName?: string;
        age?: number | string;
        monthOfBirth?: string;
        dayOfBirth?: string;
        yearOfBirth?: string;
        sex?: string;
        remarks?: string;
      }) => [
        seeker.dateApplied ? new Date(seeker.dateApplied).toLocaleDateString("en-US") : "",
        seeker.lastName || "",
        seeker.firstName || "",
        seeker.middleName || "",
        seeker.age || "",
        seeker.monthOfBirth ? monthNames[parseInt(seeker.monthOfBirth, 10)] : "",
        seeker.dayOfBirth || "",
        seeker.yearOfBirth || "",
        seeker.sex === "M" ? "*" : "",
        seeker.sex === "F" ? "*" : "",
        seeker.remarks || "",
      ];
      
  
      // OLD members
      oldSeekers.forEach((seeker) => {
        const row = worksheet.getRow(oldInsertionRow);
        row.height = 60;
        const cells = formatSeekerRow(seeker);
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 14 };
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
  
        row.commit();
        oldInsertionRow++;
      });
  
      // Header for new members
      const headerRow = worksheet.getRow(footerStartRow + oldSeekers.length + 1);
      worksheet.unMergeCells(headerRow.number, 1, headerRow.number, 11);
      headerRow.getCell(1).value = `(NEW MEMBERS ${currentMonthYear})`;
      headerRow.getCell(1).font = { bold: true, italic: true, size: 16, color: { argb: "FF0000" } };
      headerRow.alignment = { horizontal: "left", vertical: "middle" };
      headerRow.height = 25;
      worksheet.mergeCells(headerRow.number, 1, headerRow.number, 11);
      headerRow.commit();
  
      // NEW members
      currentMonthSeekers.forEach((seeker) => {
        const row = worksheet.getRow(newInsertionRow);
        row.height = 60;
        const cells = formatSeekerRow(seeker);
  
        cells.forEach((value, index) => {
          const cell = row.getCell(index + 1);
          cell.value = value;
          cell.font = { name: "Calibri", size: 14 };
          cell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
  
        row.commit();
        newInsertionRow++;
      });
  
      // Shift footer drawings
      footerDrawings.forEach((drawing) => {
        const newRow = (drawing.range?.tl?.nativeRow || footerStartRow) + oldSeekers.length + currentMonthSeekers.length + 2;
        if (drawing.range?.tl) drawing.range.tl.nativeRow = newRow;
        if (drawing.range?.br) drawing.range.br.nativeRow = newRow + 1;
      });
  
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
  
      const fileName = `JobSeeker_Masterlist_${currentMonthYear}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
  
      setGeneratingMessage("Generating Job Seeker Masterlist Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);
      console.error("Error generating job seeker report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Job Seeker Report");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "First Time Jobseeker Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });

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
      setIsGenerating(false); 

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

      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Senior Citizen Demographics Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Student Demographics Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "PWD Demographics Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Solo Parent Demographics Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

    }
  };
  

  // all residents

  const generateResidentRegistrationSummary = async (
    month: number,
    year: number,
    allTime: boolean = false
  ): Promise<string | null> => {
    setLoadingRegistrationSummary(true);
    setIsGenerating(true);
  
    try {
      const currentDate = new Date();
      const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
      const reportLabel = allTime ? "ALL TIME" : `${monthName.toUpperCase()} ${year}`;
      const reportTitle = `RESIDENT REGISTRATION SUMMARY - ${reportLabel}`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
  
      let residents = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((res) => {
          if (!res.createdAt) return false;
          if (allTime) return true;
          const resDate = new Date(res.createdAt);
          return resDate.getFullYear() === year && resDate.getMonth() === month;
        });
  
      if (residents.length === 0) {
        alert(allTime
          ? "No registered residents found."
          : "No residents registered this month.");
          setShowResidentSummaryModal(false);
          setIsGenerating(false);
        return null;
      }
  
      // Sort alphabetically
      residents.sort((a, b) => {
        const lastA = (a.lastName || "").trim().toUpperCase();
        const lastB = (b.lastName || "").trim().toUpperCase();
        const firstA = (a.firstName || "").trim().toUpperCase();
        const firstB = (b.firstName || "").trim().toUpperCase();
        const addressA = (a.address || "").trim().toUpperCase();
        const addressB = (b.address || "").trim().toUpperCase();
  
        if (lastA === lastB) {
          if (firstA === firstB) return addressA.localeCompare(addressB);
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
  
      // Total row
      const totalRow = worksheet.getRow(insertionRow);
      worksheet.mergeCells(`A${insertionRow}:L${insertionRow}`);
      totalRow.getCell(1).value = `TOTAL: ${residents.length}`;
      totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      totalRow.getCell(1).font = { name: "Times New Roman", size: 10 };
      totalRow.commit();
  
      // Shift footer drawings
      const totalInsertedRows = residents.length;
      const footerDrawings = worksheet.getImages().filter((img) => {
        const row = img.range?.tl?.nativeRow;
        return row >= (originalFooterStartRow - 1) && row <= (originalFooterEndRow - 1);
      });
      footerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow += totalInsertedRows;
        if (drawing.range?.br) drawing.range.br.nativeRow += totalInsertedRows;
      });
  
      // Insert date rows
      const dateInsertRowIndex = originalFooterEndRow + totalInsertedRows + 2;
      worksheet.insertRow(dateInsertRowIndex - 1, []);
      worksheet.insertRow(dateInsertRowIndex, []);
      const dateRow = worksheet.getRow(dateInsertRowIndex + 1);
      dateRow.height = 40;
  
      const formattedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
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
  
      const fileName = `Resident_Registration_Summary_${reportLabel.replace(/\s+/g, "_")}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      setGeneratingMessage("Generating Resident Registration Summary...");
      return fileUrl;
    } catch (error) {
      console.error("Error generating Resident Registration Summary:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Registration Summary");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
      return null;
    } finally {
      setLoadingRegistrationSummary(false);
      setShowResidentSummaryModal(false);
    }
  };

  const handleRegistrationSummaryPDF = async (
    month: number,
    year: number,
    allTime: boolean = false
  ) => {
    setLoadingRegistrationSummary(true);
  
    try {
      const fileUrl = await generateResidentRegistrationSummary(month, year, allTime);
  
      if (!fileUrl) {
        setIsGenerating(false);
        setPopupErrorGenerateReportMessage("Failed to generate Excel summary report");
        setShowErrorGenerateReportPopup(true);
        setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
      const label = allTime
        ? "ALL_TIME"
        : `${new Date(year, month).toLocaleString("default", { month: "long" })}_${year}`;
  
      saveAs(blob, `Resident_Registration_Summary_${label}.pdf`);
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Resident Registration Summary Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });

      setIsGenerating(false);
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Resident Registration Summary generated successfully");
      setShowSuccessGenerateReportPopup(true);
      setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Registration Summary PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    } finally {
      setLoadingRegistrationSummary(false);
      setShowResidentSummaryModal(false);
      setIsGenerating(false);
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

      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Resident Masterlist Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
  
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
      setIsGenerating(false); 

    }
  };
  
  // residents per general location
  // east fairview
  const generateEastResidentListReport = async () => {
    setLoadingEastResident(true);
    setIsGenerating(true);
  
    // Helper to safely merge cells without error
    const safeMergeCells = (ws: ExcelJS.Worksheet, range: string) => {
      try {
        ws.mergeCells(range);
      } catch (e) {
        if (e instanceof Error) {
          console.warn(`Skipping merge for ${range}: ${e.message}`);
        } else {
          console.warn(`Skipping merge for ${range}: Unknown error`, e);
        }
      }
    };
  
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - EAST FAIRVIEW`;
  
      const residentRef = collection(db, "Residents");
      const q = query(residentRef);
      const querySnapshot = await getDocs(q);
      let residents = querySnapshot.docs.map((doc) => doc.data());
  
      const addressGroups = {
        "RINA": residents.filter((r) => r.cluster?.toUpperCase().includes("RINA")),
        "SAMAFA": residents.filter((r) => r.cluster?.toUpperCase().includes("SAMAFA")),
        "SAMAPLI": residents.filter((r) => r.cluster?.toUpperCase().includes("SAMAPLI")),
        "SITIO KISLAP": residents.filter((r) => r.cluster?.toUpperCase().includes("SITIO KISLAP")),
        "EFHAI": residents.filter((r) => r.cluster?.toUpperCase().includes("EFHAI")),
      };
  
      const filteredGroups = Object.entries(addressGroups).filter(([_, members]) => members.length > 0);
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
      const rowsNeeded = Math.max(0, insertionRow + residents.length);
      worksheet.insertRows(originalFooterStartRow - 1, new Array(rowsNeeded).fill([]));
  
      let count = 1;
  
      for (const [group, members] of filteredGroups) {
        if (!members.length) continue;
  
        members.sort((a, b) => {
          const lastA = (a.lastName || "").trim().toUpperCase();
          const lastB = (b.lastName || "").trim().toUpperCase();
          const firstA = (a.firstName || "").trim().toUpperCase();
          const firstB = (b.firstName || "").trim().toUpperCase();
          return lastA === lastB ? firstA.localeCompare(firstB) : lastA.localeCompare(lastB);
        });
  
        // Group header
        safeMergeCells(worksheet, `A${insertionRow}:L${insertionRow}`);
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
  
        // Total row
        const totalRow = worksheet.getRow(insertionRow);
        safeMergeCells(worksheet, `A${insertionRow}:L${insertionRow}`);
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
  
      // Shift footer images
      footerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow += rowsNeeded;
        if (drawing.range?.br) drawing.range.br.nativeRow += rowsNeeded;
      });
  
      // Insert date
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
  
      safeMergeCells(worksheet, `C${dateRow.number}:D${dateRow.number}`);
      const dateCell1 = dateRow.getCell(3);
      dateCell1.value = `${formattedDate}\nDate`;
      dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      safeMergeCells(worksheet, `H${dateRow.number}:I${dateRow.number}`);
      const dateCell2 = dateRow.getCell(8);
      dateCell2.value = `${formattedDate}\nDate`;
      dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };
  
      dateRow.commit();
  
      // Final save
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
  
      setGeneratingMessage("Generating Resident List for East Fairview...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);
      console.error("Error generating report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate East Fairview Resident Report");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "East Resident Masterlist Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });

      alert("Resident Report (East Fairview) successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingEastResident(false);
      setIsGenerating(false); 

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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "West Resident Masterlist Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
      alert("Resident Report (West Fairview) successfully converted to PDF!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setLoadingWestResident(false);
      setIsGenerating(false); 

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
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "South Resident Masterlist Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

    }
  };


  // for incident reports

  // summary of incident reports
  const generateIncidentSummaryReport = async (
    month: number,
    year: number,
    allTime: boolean = false
  ): Promise<string | null> => {
    setLoadingIncidentSummary(true);
    setIsGenerating(true);
  
    try {
      const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
      const reportLabel = allTime ? "ALL TIME" : `${monthName.toUpperCase()} ${year}`;
      const reportTitle = `BARANGAY FAIRVIEW INCIDENT REPORTS - ${reportLabel}`;
  
      const reportsRef = collection(db, "IncidentReports");
      const q = query(reportsRef);
      const querySnapshot = await getDocs(q);
  
      const incidentReports = querySnapshot.docs
      .map((doc) => doc.data())
      .filter((rep) => {
        if (!rep.createdAt) return false;
        if (allTime) return true;
    
        const date =
          rep.createdAt?.toDate?.() ??
          (rep.createdAt instanceof Date ? rep.createdAt : new Date(rep.createdAt));
    
        return date.getFullYear() === year && date.getMonth() === month;
      });
  
      const departmentGroups = {
        Lupon: incidentReports
          .filter((rep) => rep.department === "Lupon")
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() 
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.() 
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime(); // DESC
          }),
        VAWC: incidentReports
          .filter((rep) => rep.department === "VAWC")
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() 
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.() 
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime();
          }),
        BCPC: incidentReports
          .filter((rep) => rep.department === "BCPC")
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() 
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.() 
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime();
          }),
        GAD: incidentReports
          .filter((rep) => rep.department === "GAD")
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() 
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.() 
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime();
          }),
        Online: incidentReports
          .filter((rep) => rep.department === "Online")
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() 
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.() 
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime();
          }),
      };
      
  
      const filteredGroups = Object.entries(departmentGroups).filter(
        ([, reports]) => reports.length > 0
      );
  
      if (filteredGroups.length === 0) {
        alert(allTime
          ? "No incident reports found."
          : `No incident reports found for ${monthName} ${year}.`
        );
        return null;
      }

      // test data block


      // while (incidentReports.length < 40) {
      //   const idx = incidentReports.length + 1;
      //   incidentReports.push({
      //     caseNumber: `IR-${String(idx).padStart(4, '0')}`,
      //     complainant: { fname: "Test", lname: `User${idx}` },
      //     respondent: { fname: "Dummy", lname: `Person${idx}` },
      //     department: ["Lupon", "VAWC", "BCPC", "GAD", "Online"][idx % 5],
      //     nature: idx % 2 === 0 ? "Criminal" : "Civil",
      //     concerns: idx % 3 === 0 ? "Noise Complaint" : "Dispute",
      //     status: ["In - Progress", "Settled", "Archived"][idx % 3],
      //     dateFiled: new Date().toLocaleDateString("en-US"),
      //     timeFiled: new Date().toLocaleTimeString("en-US"),
      //     createdAt: new Date()
      //   });
      // }


      // end of test data block
  
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
  
        reports.forEach((report) => {
          const row = worksheet.getRow(insertionRow);
          row.height = 55;
  
          const complainant = report.complainant || {};
          const respondent = report.respondent || {};
          const complainantFullName = `${(complainant.fname || report.firstname || "")} ${(complainant.lname || report.lastname || "")}`.trim();
          const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();
  
          const cells = [
            report.caseNumber,
            ` C- ${complainantFullName}\n\n R- ${respondentFullName}`,
            `${report.dateReceived || ""} ${report.timeReceived || ""}`,
            report.nature || report.concerns || "",
            report.status || "",
          ];
  
          cells.forEach((value, index) => {
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.font = { name: "Calibri", size: 12 };
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
  
        worksheet.getRow(insertionRow).values = ["", "", "", "", ""];
        worksheet.getRow(insertionRow).height = 5;
        worksheet.getRow(insertionRow).commit();
        insertionRow++;
      }
  
      footerDrawings.forEach((drawing) => {
        if (drawing.range?.tl) drawing.range.tl.nativeRow += rowsNeeded;
        if (drawing.range?.br) drawing.range.br.nativeRow += rowsNeeded;
      });
  
      const newDateRowIndex = originalFooterEndRow + rowsNeeded + 1;
      worksheet.insertRow(newDateRowIndex - 1, []);
      worksheet.insertRow(newDateRowIndex, []);
  
      const dateRow = worksheet.getRow(newDateRowIndex + 1);
      dateRow.height = 40;
      const formattedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
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
  
      worksheet.pageSetup = {
        horizontalCentered: true,
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
  
      const fileName = `Incident_Summary_Report_${reportLabel.replace(/\s+/g, "_")}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
  
      const fileUrl = await getDownloadURL(storageRef);
      setGeneratingMessage("Generating All Incidents Summary Report...");
      return fileUrl;
    } catch (error) {
      console.error("Error generating All Incidents Summary:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate All Incidents Summary Report");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
      return null;
    } finally {
      setLoadingIncidentSummary(false);
      setShowIncidentSummaryModal(false);
    }
  };
  
  

const handleGenerateIncidentSummaryPDF = async (
  month: number,
  year: number,
  allTime: boolean = false
) => {
  setLoadingIncidentSummary(true);
  try {
    const fileUrl = await generateIncidentSummaryReport(month, year, allTime);

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

    const label = allTime
      ? "ALL_TIME"
      : `${new Date(year, month).toLocaleString("default", { month: "long" })}_${year}`;

    saveAs(blob, `Incident_Summary_Report_${label}.pdf`);
    const notificationRef = collection(db, "BarangayNotifications");
    const reportName = "Incident Summary Report"; // You can replace this with your dynamic report name
    await addDoc(notificationRef, {
      message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

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
  } finally {
    setLoadingIncidentSummary(false);
    setIsGenerating(false); 

  }
};


  // vawc monthly report


  // Interfaces
interface IncidentReport {
  id: string;
  areaOfIncident?: string;
  caseNumber?: string;
  complainant?: {
    address?: string;
    age?: number;
    civilStatus?: string;
    contact?: string;
    fname?: string;
    lname?: string;
    sex?: string;
  };
  createdAt: any;
  dateFiled?: string;
  dateReceived?: string;
  department?: string;
  file?: string;
  generatedHearingSummons?: number;
  hearing?: number;
  isArbitration?: boolean;
  isConciliation?: boolean;
  isDialogue?: boolean;
  isMediation?: boolean;
  location?: string;
  nature?: string;
  concern?: string;
  concerns?: string;
  receivedBy?: string;
  reopenRequester?: string;
  respondent?: {
    address?: string;
    age?: number;
    civilStatus?: string;
    contact?: string;
    fname?: string;
    lname?: string;
    sex?: string;
  };
  status?: string;
  statusPriority?: number;
  timeFiled?: string;
  timeReceived?: string;
  typeOfIncident?: string;
  firstname?: string;
  lastname?: string;
}

interface DialogueMeeting {
  remarks?: string;
}

interface SummonsMeeting {
  nos?: string;
  remarks?: string;
}

// Your full generate function
const generateDepartmentalReport = async (
  month: number,
  year: number,
  allTime: boolean = false,
  department: string,
  status: string
): Promise<string | null> => {
  setLoadingVAWCReport(true);
  setIsGenerating(true);

  try {
    const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
    const reportLabel = allTime ? "ALL TIME" : `${monthName.toUpperCase()} ${year}`;
    const reportTitle = `FOR ${allTime ? "ALL TIME" : `THE MONTH OF ${monthName.toUpperCase()} ${year}`}`;
    const reportHeaderTitle = allTime
      ? `ALL TIME REPORT OF ${department} "${status !== "ALL" ? status : "ALL STATUS"}" CASES`
      : `MONTHLY REPORT OF ${department} "${status !== "ALL" ? status : "ALL STATUS"}" CASES"`;

    // FETCH MAIN REPORTS
    const reportsRef = collection(db, "IncidentReports");
    const q = query(reportsRef);
    const querySnapshot = await getDocs(q);

    const filteredReports: IncidentReport[] = querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as IncidentReport))
    .filter((rep) => {
      if (!allTime) {
        const date = rep.createdAt?.toDate?.() 
          ?? (rep.createdAt instanceof Date ? rep.createdAt : new Date(rep.createdAt ?? ""));
        if (date.getFullYear() !== year || date.getMonth() !== month) {
          return false;
        }
      }
  
      if (department !== "ALL" && rep.department !== department) return false;
      if (status !== "ALL" && rep.status !== status) return false;
  
      return true;
    })
    .sort((a, b) => {
      const aDate = a.createdAt?.toDate?.()
        ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt ?? ""));
      const bDate = b.createdAt?.toDate?.()
        ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt ?? ""));
      return bDate.getTime() - aDate.getTime(); // DESCENDING
    });

    if (filteredReports.length === 0) {
      alert(allTime
        ? `No reports found for ${department === "ALL" ? "any department" : department}.`
        : `No reports found for ${department === "ALL" ? "any department" : department} in ${monthName} ${year}.`
      );
      return null;
    }

    // LOAD EXCEL TEMPLATE
    let templatePath = "ReportsModule/Departmental Incident Reports Template.xlsx";
    if (department === "BCPC") templatePath = "ReportsModule/Departmental Incident BCPC Reports Template.xlsx";
    else if (department === "VAWC") templatePath = "ReportsModule/Departmental Incident VAWC Reports Template.xlsx";
    else if (department === "GAD") templatePath = "ReportsModule/Departmental Incident GAD Reports Template.xlsx";

    const templateRef = ref(storage, templatePath);
    const url = await getDownloadURL(templateRef);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    worksheet.getCell("A2").value = reportHeaderTitle;
    worksheet.getCell("A3").value = reportTitle;

    const dataStartRow = 5;
    const footerStartRow = 17;
    const existingDataRows = footerStartRow - dataStartRow;
    const extraRowsNeeded = filteredReports.length - existingDataRows;

    if (extraRowsNeeded > 0) {
      worksheet.insertRows(footerStartRow - 1, new Array(extraRowsNeeded).fill([]));
    } else if (extraRowsNeeded < 0) {
      worksheet.spliceRows(footerStartRow + extraRowsNeeded, -extraRowsNeeded);
    }

    const footerDrawings = worksheet.getImages().filter(img => img.range.tl.nativeRow >= footerStartRow);

    // ITERATE REPORTS
    for (const [index, report] of filteredReports.entries()) {
      const rowIndex = dataStartRow + index;
      const row = worksheet.getRow(rowIndex);
      row.height = 55;

      const complainant = report.complainant ?? {};
      const respondent = report.respondent ?? {};

      const complainantFullName = (complainant.fname || complainant.lname)
        ? `${complainant.fname || ""} ${complainant.lname || ""}`.trim()
        : `${report.firstname || ""} ${report.lastname || ""}`.trim();

      const complainantAge = complainant.age ?? "";
      const complainantAddress = complainant.address || report.location || "";

      const respondentFullName = `${respondent.fname || ""} ${respondent.lname || ""}`.trim();
      const respondentAge = respondent.age ?? "";
      const respondentAddress = respondent.address ?? "";

      let remarks = "";
      if (report.status === "CFA" || 
      report.status === "Settled" || 
      report.status === "settled" || 
      report.status === "archived" ||
      report.status === "pending") {
  
    const numHearings = report.hearing ?? 0;
  
    let foundRemark = false;
  
        const checkSummons = async (level: string) => {
          const snapshot = await getDocs(collection(db, "IncidentReports", report.id, "SummonsMeeting"));
          snapshot.forEach(doc => {
            const data = doc.data() as SummonsMeeting;
            if (!foundRemark && data.nos === level && data.remarks) {
              remarks = data.remarks;
              foundRemark = true;
            }
          });
        };
      
        const checkDialogue = async () => {
          const snapshot = await getDocs(collection(db, "IncidentReports", report.id, "DialogueMeeting"));
          snapshot.forEach(doc => {
            const data = doc.data() as DialogueMeeting;
            if (!foundRemark && data.remarks) {
              remarks = data.remarks;
              foundRemark = true;
            }
          });
        };
      
        if (numHearings === 3) {
          await checkSummons("Third");
          if (!foundRemark) await checkSummons("Second");
          if (!foundRemark) await checkSummons("First");
          if (!foundRemark) await checkDialogue();
        } else if (numHearings === 2) {
          await checkSummons("Second");
          if (!foundRemark) await checkSummons("First");
          if (!foundRemark) await checkDialogue();
        } else if (numHearings === 1) {
          await checkSummons("First");
          if (!foundRemark) await checkDialogue();
        } else {
          await checkDialogue();
        }
      
        if (!foundRemark) remarks = "";
      
      } else {
        remarks = "";
      }

    const createdAtDate = report.createdAt?.toDate?.()
      ?? (report.createdAt instanceof Date ? report.createdAt : new Date(report.createdAt ?? ""));

    const createdAtStr = createdAtDate.toISOString().split("T")[0];
  
    const concernValue = report.nature 
    ?? report.concern 
    ?? report.concerns 
    ?? "";
  
  const concernWithOrWithoutDept = 
    (department === "ALL") 
      ? `${concernValue} (${report.department ?? ""})`
      : concernValue;

      const cells = [
        createdAtStr,
        `C- ${complainantFullName}\nR- ${respondentFullName}`,
        `C- ${complainantAge}\nR- ${respondentAge}`,
        `C- ${complainantAddress}\nR- ${respondentAddress}`,
        concernWithOrWithoutDept,
        report.status ?? "",
        remarks ?? "",
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
    }

    footerDrawings.forEach(drawing => {
      const offset = Math.max(extraRowsNeeded, 0);
      if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
      if (drawing.range?.br) drawing.range.br.nativeRow += offset;
    });

    for (let i = worksheet.rowCount; i > footerStartRow; i--) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) worksheet.spliceRows(i, 1);
    }

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

    const fileName = `Department_Report_${department}_${status}_${reportLabel.replace(/\s+/g, "_")}.xlsx`;
    const storageRef = ref(storage, `GeneratedReports/${fileName}`);
    await uploadBytes(storageRef, blob);

    const fileUrl = await getDownloadURL(storageRef);
    setGeneratingMessage("Generating Department Report...");
    return fileUrl;
  } catch (error) {
    console.error("Error generating report:", error);
    setShowErrorGenerateReportPopup(true);
    setPopupErrorGenerateReportMessage("Failed to generate Department Report");
    setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    return null;
  } finally {
    setLoadingVAWCReport(false);
  }
};


  const handleGenerateDepartmentalPDF = async (
    month: number,
    year: number,
    allTime: boolean = false,
    department: string,
    status: string
  ) => {
    setLoadingVAWCReport(true);
  
    try {
      const fileUrl = await generateDepartmentalReport(month, year, allTime, department, status);
  
      if (!fileUrl) {
        setIsGenerating(false);
        setPopupErrorGenerateReportMessage("Failed to generate Excel report");
        setShowErrorGenerateReportPopup(true);
        setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
        return;
      }
  
      const response = await fetch("/api/convertPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });
  
      if (!response.ok) throw new Error("Failed to convert to PDF");
  
      const blob = await response.blob();
  
      const label = allTime
        ? "ALL_TIME"
        : `${new Date(year, month).toLocaleString("default", { month: "long" })}_${year}`;
  
      saveAs(blob, `Department_Report_${department}_${status}_${label}.pdf`);
  
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Incident Departmental Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });

      setIsGenerating(false);
      setGeneratingMessage("");
      setPopupSuccessGenerateReportMessage("Department Report generated successfully");
      setShowSuccessGenerateReportPopup(true);
      setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
    } catch (error) {
      console.error("Error:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Department Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    } finally {
      setLoadingVAWCReport(false);
      setIsGenerating(false);
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
      const reportTitle = `DATE ACCOMPLISHED ${month.toUpperCase()} ${year}`;
  
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

      
      // while (luponSettledReports.length < 30) {
      //   const index = luponSettledReports.length + 1;
      //   luponSettledReports.push({
      //     caseNumber: `LSN-${String(index).padStart(4, '0')}`,
      //     complainant: { fname: "Test", lname: `User${index}` },
      //     respondent: { fname: "Dummy", lname: `Person${index}` },
      //     nature: index % 2 === 0 ? "Criminal" : "Civil",
      //     specifyNature: index % 3 === 0 ? "Physical Injury" : "",
      //     isMediation: index % 4 === 0,
      //     isConciliation: index % 5 === 0,
      //     isArbitration: index % 6 === 0,
      //     remarks: "Simulated settled entry",
      //     status: "settled"
      //   });
      // }
      
      // console.log("✅ Added test Lupon Settled Reports:", luponSettledReports);
      
  
      const templateRef = ref(storage, "ReportsModule/Lupon Tagapamayapa Settled Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A2").value = reportTitle;
  
      const dataStartRow = 5;
      const originalFooterStartRow = 21;
      const originalFooterCount = 4;
  
      // Remove original footer rows (21-24)
      worksheet.spliceRows(originalFooterStartRow, originalFooterCount);
  
      let insertionRow = dataStartRow;
  
      // Insert all settled records dynamically
      for (const report of luponSettledReports) {
        worksheet.insertRow(insertionRow, []);
        const row = worksheet.getRow(insertionRow);
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
          report.specifyNature || "",
          report.isMediation ? "*" : "",
          report.isConciliation ? "*" : "",
          report.isArbitration ? "*" : "",
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
        insertionRow++;
      }
  
      // Insert clean footer block with merges, right after last data row
      worksheet.insertRows(insertionRow, [[], [], [], []]);
  
      // Row 1: APPROVED BY | NOTED BY
      worksheet.getRow(insertionRow).getCell(2).value = "APPROVED BY:";
      worksheet.getRow(insertionRow).getCell(6).value = "NOTED BY:";
      worksheet.mergeCells(`B${insertionRow}:D${insertionRow}`);
      worksheet.mergeCells(`F${insertionRow}:H${insertionRow}`);
  
      // Row 2: Names & Titles
      worksheet.getRow(insertionRow + 1).getCell(2).value = "LEONARDO C. BALINO JR.\nBARANGAY SECRETARY";
      worksheet.getRow(insertionRow + 1).getCell(6).value = "JOSE ARNEL L. QUEBAL\nPUNONG BARANGAY";
      worksheet.mergeCells(`B${insertionRow + 1}:D${insertionRow + 1}`);
      worksheet.mergeCells(`F${insertionRow + 1}:H${insertionRow + 1}`);
  
      // Align and style
      for (let i = 0; i < 2; i++) {
        const row = worksheet.getRow(insertionRow + i);
        [2, 6].forEach(cellIdx => {
          const cell = row.getCell(cellIdx);
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.font = { name: "Calibri", size: 12, bold: true };
        });
      }
  
      // Insert spacing rows after
      worksheet.insertRow(insertionRow + 2, []);
      worksheet.insertRow(insertionRow + 3, []);

      const lastFooterRow = insertionRow + 3;
      worksheet.spliceRows(lastFooterRow + 1, worksheet.rowCount - lastFooterRow);      
  
      // Ensure print-friendly layout
      worksheet.pageSetup = {
        horizontalCentered: true,
        verticalCentered: false,
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };
  
      // Export and upload
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const fileName = `Lupon_Settled_Report_${month}_${year}.xlsx`;
      const storageRef = ref(storage, `GeneratedReports/${fileName}`);
      await uploadBytes(storageRef, blob);
      const fileUrl = await getDownloadURL(storageRef);
  
      setGeneratingMessage("Generating Lupon Settled Report...");
      return fileUrl;
    } catch (error) {
      console.error("Error generating Lupon Settled report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Settled Report");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
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
      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Lupon Settled Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

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
      const reportTitle = `DATE ACCOMPLISHED ${month.toUpperCase()} ${year}`;
  
      const reportsRef = collection(db, "IncidentReports");
      const q = query(
        reportsRef,
        where("department", "==", "Lupon"),
        where("status", "in", ["Pending", "pending"])
      );
      const querySnapshot = await getDocs(q);
      const luponPendingReports = querySnapshot.docs.map((doc) => doc.data());
  
      // For testing - fill up to 30 if DB is empty or has few
      // while (luponPendingReports.length < 30) {
      //   const index = luponPendingReports.length + 1;
      //   luponPendingReports.push({
      //     caseNumber: `LPN-${String(index).padStart(4, '0')}`,
      //     complainant: { fname: "Test", lname: `User${index}` },
      //     respondent: { fname: "Dummy", lname: `Person${index}` },
      //     nature: index % 2 === 0 ? "Criminal" : "Civil",
      //     isRepudiated: index % 4 === 0,
      //     status: "Pending",
      //     remarks: "Simulated pending entry"
      //   });
      // }
  
      console.log("✅ Added test Lupon Pending Reports:", luponPendingReports);
  
      const templateRef = ref(storage, "ReportsModule/Lupon Tagapamayapa Pending Report Template.xlsx");
      const url = await getDownloadURL(templateRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
  
      worksheet.getCell("A2").value = reportTitle;
  
      const dataStartRow = 5;
  
      // Remove original footer rows to avoid duplicate blocks
      worksheet.spliceRows(19, 20); // aggressively clears to remove any leftover template footer
  
      let insertionRow = dataStartRow;
  
      // Insert all pending records dynamically
      for (const report of luponPendingReports) {
        worksheet.insertRow(insertionRow, []);
        const row = worksheet.getRow(insertionRow);
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
          report.isRepudiated ? "*" : "",
          report.status === "Pending" ? "*" : "",
          report.status === "archived" ? "*" : "",
          report.status === "CFA" ? "*" : "",
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
        insertionRow++;
      }
  
      // Insert clean footer block with merges, right after last data row
      worksheet.insertRows(insertionRow, [[], [], [], []]);
  
      // Row 1: APPROVED BY / NOTED BY
      worksheet.getRow(insertionRow).getCell(2).value = "APPROVED BY:";
      worksheet.getRow(insertionRow).getCell(6).value = "NOTED BY:";
      worksheet.mergeCells(`B${insertionRow}:D${insertionRow}`);
      worksheet.mergeCells(`F${insertionRow}:H${insertionRow}`);
  
      // Row 2: Names & Titles
      worksheet.getRow(insertionRow + 1).getCell(2).value = "LEONARDO C. BALINO JR.\nBARANGAY SECRETARY";
      worksheet.getRow(insertionRow + 1).getCell(6).value = "JOSE ARNEL L. QUEBAL\nPUNONG BARANGAY";
      worksheet.mergeCells(`B${insertionRow + 1}:D${insertionRow + 1}`);
      worksheet.mergeCells(`F${insertionRow + 1}:H${insertionRow + 1}`);
  
      // Align and style
      for (let i = 0; i < 2; i++) {
        const row = worksheet.getRow(insertionRow + i);
        [2, 6].forEach(cellIdx => {
          const cell = row.getCell(cellIdx);
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.font = { name: "Calibri", size: 12, bold: true };
        });
      }
  
      // Insert spacing rows after
      worksheet.insertRow(insertionRow + 2, []);
      worksheet.insertRow(insertionRow + 3, []);
  
      // Then clear anything after footer
      const lastFooterRow = insertionRow + 3;
      worksheet.spliceRows(lastFooterRow + 1, worksheet.rowCount - lastFooterRow);
  
      // Ensure print-friendly layout
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
  
      setGeneratingMessage("Generating Lupon Pending Report...");
      return fileUrl;
    } catch (error) {
      setIsGenerating(false);
      console.error("Error generating Lupon Pending report:", error);
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Lupon Pending Report");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
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

      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Lupon Pending Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
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
      setIsGenerating(false); 

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
          pending: filtered.filter((i) => i.status === "pending").length,
          inprogress: filtered.filter((i) => i.status === "In - Progress").length,
          settled: filtered.filter((i) =>
            dept === "Online"
              ? i.status === "Settled"
              : i.status === "settled" || i.status === "Settled"
          ).length,
          archived: filtered.filter((i) => i.status === "archived").length,
          cfa: filtered.filter((i) => i.status === "CFA").length,
          acknowledged: filtered.filter((i) => i.status === "acknowledged").length,
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
        row.getCell(3).value = item.inprogress;
        row.getCell(4).value = item.settled;
        row.getCell(5).value = item.archived;
        row.getCell(6).value = item.cfa;
  
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

      const notificationRef = collection(db, "BarangayNotifications");
      const reportName = "Incident Status Summary Report"; // You can replace this with your dynamic report name
      await addDoc(notificationRef, {
        message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
            
  
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
      setLoadingIncidentSummary(false);
      setIsGenerating(false); 

    }
  };

    // Services Module

    const generateServiceRequestReport = async (
      month: number,
      year: number,
      allTime: boolean,
      docType: string,
      status: string
    ) => {
      setLoadingBarangayCertMonthly(true);
      setIsGenerating(true);
    
      try {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
        const reportTitle = allTime
          ? `AS OF ALL TIME`
          : `AS OF ${startOfMonth.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }).toUpperCase()}`;
    
        const serviceRef = collection(db, "ServiceRequests");
        const querySnapshot = await getDocs(serviceRef);
    
        const requests = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((req) => {
            const created = new Date(req.createdAt);
            const matchesTime = allTime || (created >= startOfMonth && created <= endOfMonth);
            const matchesDocType =
              docType === "All" || req.docType?.toLowerCase().includes(docType.toLowerCase());
            const matchesStatus =
              status === "All" || req.status?.toLowerCase() === status.toLowerCase();
            return matchesTime && matchesDocType && matchesStatus;
          })
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate?.()
              ?? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt));
            const bDate = b.createdAt?.toDate?.()
              ?? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt));
            return bDate.getTime() - aDate.getTime();
          });

        if (requests.length === 0) {
          alert("No service requests found for the selected criteria.");
          setShowCertMonthlyModal(false);
          setIsGenerating(false);
          return null;
        }
    
        // test dummy data uncomment the part below only (ctrl + /) after highlighting

        // while (requests.length < 30) {
        //   const idx = requests.length + 1;
          
        //   let simulatedStatus;
        //   if (status === "All") {
        //     const statusOptions = ["Pending", "In - Progress", "Pick-up", "Completed", "Rejected"];
        //     simulatedStatus = statusOptions[idx % statusOptions.length];
        //   } else {
        //     simulatedStatus = status;
        //   }
        
        //   requests.push({
        //     requestId: `SR-${String(idx).padStart(4, '0')}`,
        //     requestor: `Test User ${idx}`,
        //     purpose: idx % 2 === 0 ? "Employment" : "Scholarship",
        //     address: `Test Address ${idx}`,
        //     contact: `0917-0000${idx}`,
        //     createdAt: new Date(),
        //     status: simulatedStatus
        //   });
        // }
        

        // end of test block

        // Load template
        const templateRef = ref(storage, "ReportsModule/Barangay Requests_Template.xlsx");
        const templateURL = await getDownloadURL(templateRef);
        const templateResponse = await fetch(templateURL);
        const templateBuffer = await templateResponse.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(templateBuffer);
        const worksheet = workbook.worksheets[0];
    

        worksheet.getCell("A1").value = allTime
          ? "BARANGAY FAIRVIEW\nALL TIME SUMMARY OF SERVICE REQUESTS"
          : "BARANGAY FAIRVIEW\nMONTHLY SUMMARY OF SERVICE REQUESTS";
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        worksheet.getCell("A1").font = { name: "Calibri", size: 14, bold: true };        

        // Update subheader
        worksheet.getCell("A2").value = reportTitle;
    
        // Insert data rows
        const startRow = 4;
        requests.forEach((req, idx) => {
          const row = worksheet.getRow(startRow + idx);
          row.height = 45;
    
          row.getCell(1).value = idx + 1;
          row.getCell(2).value = req.requestId || "";
          row.getCell(3).value = req.requestor || "";
          row.getCell(4).value = req.purpose || "";
          row.getCell(5).value = req.address || "";
          row.getCell(6).value = req.contact || "";
          row.getCell(7).value = new Date(req.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          row.getCell(8).value = req.status || "";
    
          for (let i = 1; i <= 8; i++) {
            row.getCell(i).font = { name: "Calibri", size: 12 };
            row.getCell(i).alignment = { horizontal: "center", wrapText: true };
            row.getCell(i).border = {
              top: { style: "medium" },
              bottom: { style: "medium" },
              left: { style: "medium" },
              right: { style: "medium" },
            };
          }
    
          row.commit();
        });
    
        // Move signature images / footer if present
        if (worksheet.getImages) {
          const footerDrawings = worksheet.getImages().filter((img) => img.range?.tl?.nativeRow >= 20);
          footerDrawings.forEach((drawing) => {
            const offset = requests.length;
            if (drawing.range?.tl) drawing.range.tl.nativeRow += offset;
            if (drawing.range?.br) drawing.range.br.nativeRow += offset;
          });
        }
    
        // Insert date row 3 rows below the last data + signatures
        const lastFooterRow = 24 + requests.length;  // default signatures start at 24, adjust by inserted rows
        const newDateRow = lastFooterRow + 3;
    
        worksheet.insertRow(newDateRow, []);
        worksheet.mergeCells(`C${newDateRow}:D${newDateRow}`);
        worksheet.mergeCells(`E${newDateRow}:F${newDateRow}`);
    
        const currentDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    
        worksheet.getCell(`C${newDateRow}`).value = `${currentDate}\nDate`;
        worksheet.getCell(`C${newDateRow}`).alignment = { wrapText: true, horizontal: "left" };
        worksheet.getCell(`C${newDateRow}`).font = { name: "Calibri", size: 11, italic: true, bold: true };
    
        worksheet.getCell(`E${newDateRow}`).value = `${currentDate}\nDate`;
        worksheet.getCell(`E${newDateRow}`).alignment = { wrapText: true, horizontal: "left" };
        worksheet.getCell(`E${newDateRow}`).font = { name: "Calibri", size: 11, italic: true, bold: true };
    
        // Page setup
        worksheet.pageSetup = {
          horizontalCentered: true,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        };
    
        // Upload
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
    
        const paddedMonth = String(month + 1).padStart(2, "0");
        const fileName = allTime
          ? `Service Request Report_ALLTIME.xlsx`
          : `Service Request Report_${year}_${paddedMonth}.xlsx`;
    
        const storageRef = ref(storage, `GeneratedReports/${fileName}`);
        await uploadBytes(storageRef, blob);
    
        const finalFileUrl = await getDownloadURL(storageRef);
        setGeneratingMessage("Generating Service Request Report...");
        return finalFileUrl;
      } catch (err) {
        console.error("Error generating report:", err);
        setShowErrorGenerateReportPopup(true);
        setPopupErrorGenerateReportMessage("Failed to generate report");
        setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
        return null;
      } finally {
        setLoadingBarangayCertMonthly(false);
        setShowCertMonthlyModal(false);
      }
    };
    
      
      
  
      const handleGenerateServiceRequestPDF = async (
        month: number,
        year: number,
        allTime: boolean,
        docType: string,
        status: string
      ) => {
        setLoadingBarangayCertMonthly(true);
      
        try {
          const fileUrl = await generateServiceRequestReport(month, year, allTime, docType, status);
      
          if (!fileUrl) {
            alert("No service requests found for the selected criteria.");
            return;
          }
      
          const response = await fetch("/api/convertPDF", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrl }),
          });
      
          if (!response.ok) throw new Error("PDF conversion failed");
      
          const blob = await response.blob();
      
          const label = allTime
            ? "ALLTIME"
            : new Date(year, month).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              }).replace(" ", "");
      
          saveAs(blob, `ServiceRequestReport_${label}.pdf`);
          
          const notificationRef = collection(db, "BarangayNotifications");
          const reportName = "Incident Summary Report"; // You can replace this with your dynamic report name
          await addDoc(notificationRef, {
            message: `A report (${reportName}) was generated by ${session?.user?.fullName}.`,
            timestamp: new Date(),
            isRead: false,
            recipientRole: "Punong Barangay",
            transactionType: "System Report",
          });
        } catch (err) {
          console.error("Error:", err);
          alert("Failed to generate PDF");
        } finally {
          setLoadingBarangayCertMonthly(false);
          setShowCertMonthlyModal(false);
          setIsGenerating(false);
        }
      };
      


  return (
    <div className="generatereport-main-container">

      <div className="generatereport-redirectionpage-section">
        <button 
          className={` ${activeSection === "generate" ? "generate-reports-download-forms-selected" : "generatereport-redirection-buttons"}`}
          /*onClick={() => setActiveSection("generate")}*/

          onClick={() => {
            setActiveSection("generate");
            router.push("/dashboard/ReportsModule?section=generate");
          }}
        >
          <div className="generatereport-redirection-icons-section">
            <img src="/images/report.png" alt="user info" className="redirection-icons-generatereport"/> 
          </div>
          <h1>Generate Report</h1>
        </button>

          <button 
            className={` ${activeSection === "download" ? "generate-reports-download-forms-selected " : "generatereport-redirection-buttons"}`}
            onClick={() => {
              setActiveSection("download");
              router.push("/dashboard/ReportsModule?section=download");

              // ⬇️ set the folder automatically based on their position
              if (session?.user?.position === "Secretary" ||
                  session?.user?.position === "Assistant Secretary" ||
                  session?.user?.position === "Punong Barangay") {
                setViewingFolder("ReportsModule/");
              } else if (session?.user?.position === "Admin Staff") {
                setViewingFolder("ReportsModule/AdminStaff/");
              } else if (session?.user?.position === "LF Staff") {
                setViewingFolder("ReportsModule/LFStaff/");
              } else {
                // fallback
                setViewingFolder("ReportsModule/");
              }
            }}
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
                  <>
                    <button
                      type="button"
                      onClick={() => setShowResidentSummaryModal(true)}
                      disabled={loadingRegistrationSummary}
                      className={`report-tile ${loadingRegistrationSummary ? "disabled" : ""}`}
                      aria-busy={loadingRegistrationSummary}
                      aria-label="Generate Monthly Resident Registration Summary Report"
                    >
                      <img
                        src="/images/regresident.png" // You can change this to your desired icon
                        alt="Resident Summary Icon"
                        className="report-icon"
                        aria-hidden="true"
                      />
                      <p className="report-title">
                        {loadingRegistrationSummary
                          ? "Generating..."
                          : "Monthly Resident Registration Summary Report"}
                      </p>
                    </button>

                    <MonthYearModal
                      show={showResidentSummaryModal}
                      onClose={() => setShowResidentSummaryModal(false)}
                      onGenerate={handleRegistrationSummaryPDF}
                      loading={loadingRegistrationSummary}
                      title="Generate Monthly Resident Registration Summary Report"
                    />
                  </>


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

                      <>
                        <button
                          type="button"
                          onClick={() => setShowKasambahayModal(true)}
                          disabled={loadingKasambahay}
                          className={`report-tile ${loadingKasambahay ? "disabled" : ""}`}
                          aria-busy={loadingKasambahay}
                          aria-label="Generate Kasambahay Masterlist Report"
                        >
                          <img
                            src="/images/form.png"
                            alt="Kasambahay icon"
                            className="report-icon"
                            aria-hidden="true"
                          />
                          <p className="report-title">
                            {loadingKasambahay ? "Generating..." : "Kasambahay Masterlist"}
                          </p>
                        </button>

                        <NatureOfWorkModal
                          show={showKasambahayModal}
                          onClose={() => setShowKasambahayModal(false)}
                          onGenerate={handleGenerateKasambahayPDF}
                          loading={loadingKasambahay}
                          title="Generate Kasambahay Masterlist"
                          options={[
                            { key: "All", value: "All" },
                            ...Object.entries(natureOfWorkMap).map(([key, value]) => ({
                              key,
                              value
                            }))
                          ]}    
                        />
                      </>


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
                    <>
                      <button
                        type="button"
                        onClick={() => setShowIncidentSummaryModal(true)}
                        disabled={loadingIncidentSummary}
                        className={`report-tile ${loadingIncidentSummary ? "disabled" : ""}`}
                        aria-busy={loadingIncidentSummary}
                        aria-label="Generate Incident Summary Report"
                      >
                        <img
                          src="/images/incident.png"
                          alt="Incident Summary Icon"
                          className="report-icon"
                          aria-hidden="true"
                        />

                        
                        <p className="report-title">
                          {loadingIncidentSummary
                            ? "Generating..."
                            : "Monthly Incident Summary Report"}
                        </p>
                      </button>

                      <MonthYearModal
                        show={showIncidentSummaryModal}
                        onClose={() => setShowIncidentSummaryModal(false)}
                        onGenerate={handleGenerateIncidentSummaryPDF}
                        loading={loadingIncidentSummary}
                        title="Generate Monthly Incident Summary Report"
                      />
                    </>


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

                        <>
                          {/* BUTTON FOR STAFF DEPARTMENTS */}
                          {(session?.user?.department === "VAWC" ||
                            session?.user?.department === "Lupon" ||
                            session?.user?.department === "BCPC" ||
                            session?.user?.department === "GAD") && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowDepartmentModal(true)}
                                disabled={loadingVAWCReport}
                                className={`report-tile ${loadingVAWCReport ? "disabled" : ""}`}
                                aria-busy={loadingVAWCReport}
                                aria-label="Generate Monthly Department Report"
                              >
                                <img src="/images/womenandchildren.png" alt="icon" className="report-icon-bigger" />
                                <p className="report-title">
                                  {loadingVAWCReport ? "Generating..." : "Monthly Department Report"}
                                </p>
                              </button>

                              <DepartmentalReportModal
                                show={showDepartmentModal}
                                onClose={() => setShowDepartmentModal(false)}
                                onGenerate={handleGenerateDepartmentalPDF}
                                loading={loadingVAWCReport}
                                allowedDepartments={[session?.user?.department ?? "VAWC", "Online"]}
                                title={`Generate ${session?.user?.department} Report`}
                              />
                            </>
                          )}

                          {/* BUTTON FOR ADMIN POSITIONS */}
                          {(session?.user?.position === "Assistant Secretary" ||
                            session?.user?.position === "Secretary" ||
                            session?.user?.position === "Punong Barangay") && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowAdminDepartmentModal(true)}
                                disabled={loadingVAWCReport}
                                className={`report-tile ${loadingVAWCReport ? "disabled" : ""}`}
                                aria-busy={loadingVAWCReport}
                                aria-label="Generate Department Report"
                              >

                                {/* change icon */}
                                <img src="/images/womenandchildren.png" alt="icon" className="report-icon-bigger" />
                                <p className="report-title">
                                  {loadingVAWCReport ? "Generating..." : "Admin All Departments Monthly Report"}
                                </p>
                              </button>

                              <DepartmentalReportModal
                                show={showAdminDepartmentModal}
                                onClose={() => setShowAdminDepartmentModal(false)}
                                onGenerate={handleGenerateDepartmentalPDF}
                                loading={loadingVAWCReport}
                                allowedDepartments={["ALL", "Lupon", "VAWC", "BCPC", "GAD", "Online"]}
                                title="Generate All Department Report"
                              />
                            </>
                          )}
                        </>

                      {(session?.user?.department === "GAD" || session?.user?.department === "BCPC" || session?.user?.position === "Assistant Secretary")  && (
                        <>
                          {/* <button  className="report-tile">
                            <img src="/images/genders.png" alt="user info" className="report-icon"/> 
                            <p className="report-title">
                              GADRCO Quarterly Monitoring Report
                            </p>
                          </button> */}
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
                      <>
                        <button
                          type="button"
                          onClick={() => setShowCertMonthlyModal(true)}
                          disabled={loadingBarangayCertMonthly}
                          className={`report-tile ${loadingBarangayCertMonthly ? "disabled" : ""}`}
                          aria-busy={loadingBarangayCertMonthly}
                          aria-label="Generate Custom Service Request Report"
                        >
                          <img
                            src="/images/services.png"
                            alt="Service Icon"
                            className="report-icon"
                            aria-hidden="true"
                          />
                          <p className="report-title">
                            {loadingBarangayCertMonthly ? "Generating..." : "Custom Service Request Report"}
                          </p>
                        </button>

                        <ServiceMonthYearModal
                          show={showCertMonthlyModal}
                          onClose={() => setShowCertMonthlyModal(false)}
                          onGenerate={(month, year, allTime, docType, status) => {
                            void handleGenerateServiceRequestPDF(
                              month,
                              year,
                              allTime ?? false,
                              docType ?? "All",
                              status ?? "All"
                            );
                          }}
                          loading={loadingBarangayCertMonthly}
                          title="Generate Custom Service Request Report"
                        />
                      </>


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



    {/* downloadable forms area  here*/}

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

                <div className="action-btn-downloadble-forms">
                    <button className="action-download" onClick={handleUploadClick} >Upload File</button>
              </div>

          </div>

          <div className="downloadble-report-header-body">

            <div className="downloadble-report-info-toggle-wrapper">
              {(session?.user?.position === "Secretary" ||
                session?.user?.position === "Assistant Secretary" ||
                session?.user?.position === "Punong Barangay") && (
                <>
                  <button
                    type="button"
                    className={`info-toggle-btn ${viewingFolder === "ReportsModule/" ? "active" : ""}`}
                    onClick={() => setViewingFolder("ReportsModule/")}
                  >
                    Reports Module Files
                  </button>
                  <button
                    type="button"
                    className={`info-toggle-btn ${viewingFolder === "ReportsModule/AdminStaff/" ? "active" : ""}`}
                    onClick={() => setViewingFolder("ReportsModule/AdminStaff/")}
                  >
                    Admin Staff Files
                  </button>
                  <button
                    type="button"
                    className={`info-toggle-btn ${viewingFolder === "ReportsModule/LFStaff/" ? "active" : ""}`}
                    onClick={() => setViewingFolder("ReportsModule/LFStaff/")}
                  >
                    LF Staff Files
                  </button>
                </>
              )}

              {session?.user?.position === "Admin Staff" && (
                <button
                  type="button"
                  className={`info-toggle-btn ${viewingFolder === "ReportsModule/AdminStaff/" ? "active" : ""}`}
                  onClick={() => setViewingFolder("ReportsModule/AdminStaff/")}
                >
                  Admin Staff
                </button>
              )}

              {session?.user?.position === "LF Staff" && (
                <button
                  type="button"
                  className={`info-toggle-btn ${viewingFolder === "ReportsModule/LFStaff/" ? "active" : ""}`}
                  onClick={() => setViewingFolder("ReportsModule/LFStaff/")}
                >
                  LF Staff
                </button>
              )}

              {/* Fallback for everyone else — only see ReportsModule */}
              {!(
                session?.user?.position === "Secretary" ||
                session?.user?.position === "Assistant Secretary" ||
                session?.user?.position === "Punong Barangay" ||
                session?.user?.position === "Admin Staff" ||
                session?.user?.position === "LF Staff"
              ) && (
                <button
                  type="button"
                  className={`info-toggle-btn ${viewingFolder === "ReportsModule/" ? "active" : ""}`}
                  onClick={() => setViewingFolder("ReportsModule/")}
                >
                  Reports Module
                </button>
              )}
            </div>


            <div className="downloadble-report-header-body-bottom-section">

                  <div className="downloadble-forms-info-main-container">

                    <div className="pagination-button-wrapper">
                      <button
                        className="pagination-btn"
                        onClick={handleBackPage}
                        disabled={currentPageForms === 0}
                      >
                        <img src="/Images/back.png" alt="Back" className="pagination-icon" />
                      </button>
                    </div>


                    <div className="downloadble-forms-grid">
                   {/* {paginatedFiles.map((file, index)=> ( */}
                      {paginatedFiles.slice(0, 4).map((file, index) => (
                        <div className="form-card" key={index}>
                          <div className="form-icon-label">
                            <img src="/images/form.png" alt="Form Icon" />
                            <span>{file.name.replace(".docx", "")}</span>
                          </div>
                          <div className="form-buttons">
                            <button
                              className="download-btn"
                              onClick={() => uploadForms(file.url)}
                            >
                              Download
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteClick(file.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pagination-button-wrapper">
                      <button
                        className="pagination-btn"
                        onClick={handleNextPage}
                        disabled={(currentPageForms + 1) * ITEMS_PER_PAGE >= files.length}
                      >
                          <img src="/Images/next.png" alt="Next" className="pagination-icon" />
                      </button>
                    </div>



                  </div>

            </div>
           

          </div>
        </div>
      </>
    )}






    {showErrorPopup && (
        <div className={`popup-overlay show`}>
          <div className="popup">
              <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {isLoading.status && (
            <div className="popup-backdrop-download">
              <div className="popup-content-download">
                  <img src="/Images/loading.png" alt="loading..." className="successful-icon-popup-download" />
                    <p>{isLoading.message}</p>
              </div>
             </div>
                )}

        {showPopup && (
          <div className={`popup-overlay-downloadble-forms show`}>
              <div className="popup-downloadble-forms">
                <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                <p>{popupMessage}</p>
              </div>
          </div>
            )}

         
                    {showDeletePopup && (
                <div className="popup-backdrop-download">
                  <div className="popup-content-download">
                    <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup-download" />
                    <p>Are you sure you want to delete this file?</p>
                    <h2>{fileToDelete}</h2>
                    <div className="yesno-container-module-downloadable">
                      <button onClick={() => setShowDeletePopup(false)} className="no-button-downloadable">No</button>
                      <button onClick={confirmDelete} className="yes-button-downloadable">Yes</button>
                    </div> 
                  </div>
                </div>
              )}


    {/*  ADDED: Upload Modal (only if Assistant Secretary) */}
    {showUploadFilePopup && canUpload && (
      <div className="fileupload-popup-overlay">
        <div className="fileupload-popup" ref={uploadFilePopUpRef}>
          <div className="file-upload-popup-section-1">
            <h1> Upload File</h1>
            <button
              onClick={uploadFile}
              disabled={!selectedUploadFile}
              className="upload-button-section-1"
            >
              Upload
            </button>
          </div>

          <div className="file-upload-popup-section-2">
            <div className="upload-container-downloadable-forms">
              <input
                type="file"
                onChange={handleFileUpload}
                id="file-upload"
                style={{ display: "none" }}
              />
              <label htmlFor="file-upload" className="upload-link">
                Choose File
              </label>
              {selectedUploadFile && (
                <div className="file-name-image-display">
                  <ul className="file-list">
                    <li className="file-name-image-display-indiv">
                      <div className="file-item">
                        <span className="file-name">{selectedUploadFile.name}</span>
                        <div className="delete-container">
                          <button
                            type="button"
                            onClick={onDeleteFile}
                            className="delete-button-upload"
                          >
                            <img
                              src="/Images/delete.png"
                              alt="Delete"
                              className="delete-icon-upload"
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="file-upload-section-3">
            <div className="section-3-main-content">
              <div className="main-content-section-1">
                <h1>Select Folder</h1>
              </div>
              <div className="section-3-fields-section">
                <div className="module-checkbox-container">
                  <label className="module-checkbox-label">
                    <input
                      type="radio"
                      name="folder"
                      onChange={() => setSelectedFolder("ReportsModule/")}
                    />
                    Reports Module Folder
                  </label>
                </div>
                <div className="module-checkbox-container">
                  <label className="module-checkbox-label">
                    <input
                      type="radio"
                      name="folder"
                      onChange={() => setSelectedFolder("ReportsModule/AdminStaff/")}
                    />
                    Admin Files
                  </label>
                </div>
                <div className="module-checkbox-container">
                  <label className="module-checkbox-label">
                    <input
                      type="radio"
                      name="folder"
                      onChange={() => setSelectedFolder("ReportsModule/LFStaff/")}
                    />
                    LF Files
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}



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
