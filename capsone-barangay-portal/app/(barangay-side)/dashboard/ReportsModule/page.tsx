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
import { ProgramsMonthlyReportModal } from "@/app/(barangay-side)/components/ProgramsMonthlyReportModal"; 


import { generateKasambahayXlsx, generateFirstTimeJobSeekerXlsx, generateSeniorCitizenXlsx,
         generateStudentDemographicXlsx, generatePwdDemographicXlsx, generateSoloParentDemographicXlsx,
         generateResidentRegistrationSummaryXlsx, generateResidentMasterlistXlsx, generateEastResidentListXlsx,
         generateWestResidentListXlsx, generateSouthResidentListXlsx } from "./logic/residentReports";
import { generateServiceRequestXlsx } from "./logic/servicesReports";
import { generateIncidentSummaryXlsx, generateDepartmentalIncidentXlsx, generateLuponSettledXlsx,
         generateLuponPendingXlsx, generateIncidentStatusSummaryXlsx} from "./logic/incidentReports";
import { generateProgramsMonthlyXlsx } from "./logic/programsReports";         






interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {

  // rbac
  const { data: session } = useSession();

  // file upload rbac
  const canSelectFolder = ["Secretary", "Assistant Secretary", "Punong Barangay"].includes(session?.user?.position || "");
  const canUpload = session?.user?.position === "Assistant Secretary" || session?.user?.position === "Secretary";


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

  // for programs
const [showProgramsMonthlyModal, setShowProgramsMonthlyModal] = useState(false);
const [loadingProgramsMonthly, setLoadingProgramsMonthly] = useState(false);
const [range, setRange] = useState({ startMonth: 0, startYear: new Date().getFullYear(), endMonth: new Date().getMonth(), endYear: new Date().getFullYear()});
const [approvalStatus, setApprovalStatus] = useState<"All"|"Pending"|"Approved"|"Rejected">("All");
const [progressStatus, setProgressStatus] = useState<"All"|"Upcoming"|"Ongoing"|"Completed">("All");




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


let toastQueue: Promise<void> = Promise.resolve();

const showErrorToast = (message: string) => {
  // Chain onto the queue to ensure order
  toastQueue = toastQueue.then(() => {
    return new Promise((resolve) => {
      setPopupErrorGenerateReportMessage(message);
      setShowErrorGenerateReportPopup(true);

      setTimeout(() => {
        setShowErrorGenerateReportPopup(false);
        resolve(); // Let the next toast proceed
      }, 3000);
    });
  });
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
  

  
// KASAMBAHAY
const handleGenerateKasambahayPDF = async (natureOfWork: string) => {
  setLoadingKasambahay(true);
  setIsGenerating(true);
  try {
    const { fileUrl, fileName } = await generateKasambahayXlsx({
      db,
      storage,
      natureOfWork, // "All" or "1".."6"
    });

    if (!fileUrl) {
      setIsGenerating(false);
      await showErrorToast("Failed to generate PDF report");
      return;
    }

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("Failed to convert to PDF");

    const blob = await response.blob();

    // Use “pretty” label using your existing map (optional)
    const label = natureOfWork === "All" ? "All" : (natureOfWorkMap[Number(natureOfWork)] || `Type${natureOfWork}`);
    const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    saveAs(blob, `Kasambahay_Masterlist_${label}_${currentMonthYear}.pdf`);

    // Notification (kept in UI so you control recipients)
    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Kasambahay Masterlist Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Kasambahay Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Kasambahay Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingKasambahay(false);
    setIsGenerating(false);
    setShowKasambahayModal(false);
  }
};

// JOB SEEKER
const handleGenerateJobSeekerPDF = async () => {
  setLoadingJobSeeker(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateFirstTimeJobSeekerXlsx({ db, storage });
    if (!fileUrl) {
      setIsGenerating(false);
      await showErrorToast("Failed to generate PDF report");
      return;
    }

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("Failed to convert to PDF");

    const blob = await response.blob();
    const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    saveAs(blob, `FirstTimeJobSeekers_${currentMonthYear}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (First Time Jobseeker Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("First-Time Job Seeker Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate First-Time Job Seeker Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingJobSeeker(false);
    setIsGenerating(false);
  }
};

// SENIOR
const handleGenerateSeniorPDF = async () => {
  setLoadingResidentSeniorDemographic(true);
  setIsGenerating(true);
  try {
    const { fileUrl, label } = await generateSeniorCitizenXlsx({ db, storage });
    if (!fileUrl) {
      setIsGenerating(false);
      await showErrorToast("Failed to generate PDF report");
      return;
    }

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("Failed to convert to PDF");

    const blob = await response.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Senior_Citizen_Report_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Senior Citizen Demographics Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Senior Citizen Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Senior Citizen Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingResidentSeniorDemographic(false);
    setIsGenerating(false);
  }
};

// STUDENT
const handleGenerateStudentPDF = async () => {
  setLoadingResidentStudentDemographic(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateStudentDemographicXlsx({ db, storage });
    if (!fileUrl) {
      setIsGenerating(false);
      await showErrorToast("Failed to generate PDF report");
      return;
    }

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("Failed to convert to PDF");

    const blob = await response.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Student_Demographic_Report_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Student Demographics Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Student Demographic Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Student PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingResidentStudentDemographic(false);
    setIsGenerating(false);
  }
};


// PWD
const handleGeneratePwdPDF = async () => {
  setLoadingResidentPWDDemographic(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generatePwdDemographicXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `PWD_Demographic_Report_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (PWD Demographics Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("PWD Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PWD Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingResidentPWDDemographic(false);
    setIsGenerating(false);
  }
};

// SOLO PARENT
const handleGenerateSoloParentPDF = async () => {
  setLoadingResidentSoloParentDemographic(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateSoloParentDemographicXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Solo_Parent_Demographic_Report_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Solo Parent Demographics Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Solo Parent Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Solo Parent PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingResidentSoloParentDemographic(false);
    setIsGenerating(false);
  }
};

// REGISTRATION SUMMARY
const handleRegistrationSummaryPDF = async (
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  allTime: boolean = false
) => {
  setLoadingRegistrationSummary(true);
  setIsGenerating(true);
  try {
    const { fileUrl, labelFile } = await generateResidentRegistrationSummaryXlsx({
      db,
      storage,
      startMonth,
      startYear,
      endMonth,
      endYear,
      allTime,
    });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    saveAs(blob, `Resident_Registration_Summary_${labelFile}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Resident Registration Summary Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Resident Registration Summary generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Registration Summary PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingRegistrationSummary(false);
    setShowResidentSummaryModal(false);
    setIsGenerating(false);
  }
};

// MASTERLIST (INHABITANT RECORD)
const handleGenerateResidentPDF = async () => {
  setLoadingMasterResident(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateResidentMasterlistXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Inhabitant_Record_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Resident Masterlist Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Resident Masterlist Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate Resident Masterlist Report PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingMasterResident(false);
    setIsGenerating(false);
  }
};

  
  // residents per general location
// EAST
const handleGenerateEastResidentPDF = async () => {
  setLoadingEastResident(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateEastResidentListXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Inhabitant_Record_EastFairview_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (East Resident Masterlist Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else await showErrorToast("Failed to generate PDF.");
  } finally {
    setLoadingEastResident(false);
    setIsGenerating(false);
  }
};

// WEST
const handleGenerateWestResidentPDF = async () => {
  setLoadingWestResident(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateWestResidentListXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Inhabitant_Record_WestFairview_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (West Resident Masterlist Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else await showErrorToast("Failed to generate PDF.");
  } finally {
    setLoadingWestResident(false);
    setIsGenerating(false);
  }
};

// SOUTH
const handleGenerateSouthResidentPDF = async () => {
  setLoadingSouthResident(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateSouthResidentListXlsx({ db, storage });

    const res = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!res.ok) throw new Error("Failed to convert to PDF");

    const blob = await res.blob();
    const year = new Date().getFullYear();
    saveAs(blob, `Inhabitant_Record_SouthFairview_${year}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (South Resident Masterlist Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Resident Report (South Fairview) generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (error: any) {
    if (error?.code === "NO_DATA") await showErrorToast(error.message);
    else {
      setShowErrorGenerateReportPopup(true);
      setPopupErrorGenerateReportMessage("Failed to generate PDF");
      setTimeout(() => setShowErrorGenerateReportPopup(false), 5000);
    }
  } finally {
    setLoadingSouthResident(false);
    setIsGenerating(false);
  }
};


const startOfMonth = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const endExclusiveOfMonth = (y: number, m: number) => new Date(y, m + 1, 1, 0, 0, 0, 0);
const monthNameUpper = (y: number, m: number) => new Date(y, m).toLocaleString("default", { month: "long" }).toUpperCase();


function buildReportLabel(
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) {
  if (allTime) return "ALL TIME";
  if (startMonth === endMonth && startYear === endYear) {
    return `${monthNameUpper(endYear, endMonth)} ${endYear}`;
  }
  return `${monthNameUpper(startYear, startMonth)} ${startYear} – ${monthNameUpper(endYear, endMonth)} ${endYear}`;
}

function buildFileLabel(
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) {
  if (allTime) return "ALL_TIME";
  if (startMonth === endMonth && startYear === endYear) {
    const m = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
    return `${m}_${endYear}`.replace(/\s+/g, "_");
  }
  const sm = new Date(startYear, startMonth).toLocaleString("default", { month: "long" });
  const em = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
  return `${sm}_${startYear}__to__${em}_${endYear}`.replace(/\s+/g, "_");
}

const toJSDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// Summary of incidents (grouped by department)
const handleGenerateIncidentSummaryPDF = async (
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime = false
) => {
  setLoadingIncidentSummary(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateIncidentSummaryXlsx({
      db, storage, startMonth, startYear, endMonth, endYear, allTime,
    });

    const resp = await fetch("/api/convertPDF", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl }) });
    if (!resp.ok) throw new Error("Failed to convert to PDF");

    const blob = await resp.blob();
    const label = buildFileLabel(startMonth, startYear, endMonth, endYear, allTime);
    saveAs(blob, `Incident_Summary_Report_${label}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Incident Summary Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("All Incidents Summary Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (e: any) {
    await showErrorToast(e?.code === "NO_DATA" ? "No incident reports found for the selected range." : "Failed to generate PDF");
  } finally {
    setLoadingIncidentSummary(false);
    setShowIncidentSummaryModal(false);
    setIsGenerating(false);
  }
};

// Departmental report
const handleGenerateDepartmentalPDF = async (
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime = false, department: string, status: string
) => {
  setLoadingVAWCReport(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateDepartmentalIncidentXlsx({
      db, storage, startMonth, startYear, endMonth, endYear, allTime, department, status,
    });

    const resp = await fetch("/api/convertPDF", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl }) });
    if (!resp.ok) throw new Error("Failed to convert to PDF");

    const blob = await resp.blob();
    const label = buildFileLabel(startMonth, startYear, endMonth, endYear, allTime);
    saveAs(blob, `Department_Report_${department}_${status}_${label}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Incident Departmental Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Department Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (e: any) {
    await showErrorToast(e?.code === "NO_DATA" ? "No reports matched your filters." : "Failed to generate Department Report PDF");
  } finally {
    setLoadingVAWCReport(false);
    setIsGenerating(false);
  }
};

// Lupon settled
const handleGenerateLuponSettledPDF = async () => {
  setLoadingLuponSettledReport(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateLuponSettledXlsx({ db, storage });
    const resp = await fetch("/api/convertPDF", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl }) });
    if (!resp.ok) throw new Error("Failed to convert to PDF");
    const blob = await resp.blob();
    const yr = new Date().getFullYear();
    saveAs(blob, `Lupon_Settled_Report_${yr}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Lupon Settled Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Lupon Settled Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (e: any) {
    await showErrorToast(e?.code === "NO_DATA" ? "No Lupon Settled reports found." : "Failed to generate Lupon Settled Report PDF");
  } finally {
    setLoadingLuponSettledReport(false);
    setIsGenerating(false);
  }
};

// Lupon pending
const handleGenerateLuponPendingPDF = async () => {
  setLoadingLuponPendingReport(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateLuponPendingXlsx({ db, storage });
    const resp = await fetch("/api/convertPDF", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl }) });
    if (!resp.ok) throw new Error("Failed to convert to PDF");
    const blob = await resp.blob();
    const yr = new Date().getFullYear();
    saveAs(blob, `Lupon_Pending_Report_${yr}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Lupon Pending Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setShowSuccessGenerateReportPopup(true);
    setPopupSuccessGenerateReportMessage("Lupon Pending Report generated successfully");
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (e: any) {
    await showErrorToast(e?.code === "NO_DATA" ? "No Lupon Pending/Dismissed reports found." : "Failed to generate Lupon Pending Report PDF");
  } finally {
    setLoadingLuponPendingReport(false);
    setIsGenerating(false);
  }
};

// Status summary (as of current month)
const handleGenerateIncidentStatusSummaryPDF = async () => {
  setLoadingIncidentStatuses(true);
  setIsGenerating(true);
  try {
    const { fileUrl } = await generateIncidentStatusSummaryXlsx({ db, storage });
    const resp = await fetch("/api/convertPDF", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl }) });
    if (!resp.ok) throw new Error("Failed to convert to PDF");

    const blob = await resp.blob();
    const monthYear = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
    saveAs(blob, `Incident_Status_Summary_Report_${monthYear.replace(" ", "_")}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Incident Status Summary Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Incident Summary Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (e: any) {
    await showErrorToast("Failed to generate Incident Summary PDF");
  } finally {
    setLoadingIncidentStatuses(false);
    setIsGenerating(false);
  }
};

const handleGenerateServiceRequestPDF = async (
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  allTime: boolean,
  docType: string,
  status: string
) => {
  setLoadingBarangayCertMonthly(true);
  setIsGenerating(true);
  try {
    const { fileUrl, labelFile, docTypeForName } = await generateServiceRequestXlsx({
      db,
      storage,
      startMonth,
      startYear,
      endMonth,
      endYear,
      allTime,
      docType,
      status,
    });

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("PDF conversion failed");

    const blob = await response.blob();
    saveAs(blob, `ServiceRequestReport_${docTypeForName}_${labelFile}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Service Request Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Service Request Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (err: any) {
    if (err?.code === "NO_DATA") {
      await showErrorToast("No service requests found for the selected criteria.");
    } else {
      await showErrorToast("Failed to generate PDF.");
    }
  } finally {
    setLoadingBarangayCertMonthly(false);
    setShowCertMonthlyModal(false);
    setIsGenerating(false);
  }
};


// Programs Reports


const handleGenerateProgramsMonthlyPDF = async ({
  startMonth,
  startYear,
  endMonth,
  endYear,
  allTime,
  approvalStatus,
  progressStatus,
}: {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime: boolean;
  approvalStatus: "All" | "Pending" | "Approved" | "Rejected";
  progressStatus: "All" | "Upcoming" | "Ongoing" | "Completed";
}) => {
  setLoadingProgramsMonthly(true);
  setIsGenerating(true);
  try {
    const { fileUrl, labelFile } = await generateProgramsMonthlyXlsx({
      db,
      storage,
      startMonth,
      startYear,
      endMonth,
      endYear,
      allTime,
      approvalStatus,
      progressStatus, // note: ignored by generator when approvalStatus === "Rejected"
    });

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("PDF conversion failed");

    const blob = await response.blob();
    saveAs(blob, `Monthly_Programs_Report_${labelFile}.pdf`);

    const notificationRef = collection(db, "BarangayNotifications");
    await addDoc(notificationRef, {
      message: `A report (Monthly Programs Report) was generated by ${session?.user?.fullName}.`,
      timestamp: new Date(),
      isRead: false,
      recipientRole: "Punong Barangay",
      transactionType: "System Report",
    });

    setPopupSuccessGenerateReportMessage("Monthly Programs Report generated successfully");
    setShowSuccessGenerateReportPopup(true);
    setTimeout(() => setShowSuccessGenerateReportPopup(false), 5000);
  } catch (err: any) {
    if (err?.code === "NO_DATA") {
      await showErrorToast("No programs found for the selected criteria.");
    } else {
      await showErrorToast("Failed to generate PDF.");
    }
  } finally {
    setLoadingProgramsMonthly(false);
    setShowProgramsMonthlyModal(false);
    setIsGenerating(false);
  }
};




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
    setPopupMessage("Failed to delete file.!");
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
            <img src="/Images/report.png" alt="user info" className="redirection-icons-generatereport"/> 
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
                setViewingFolder("ReportsModule/AdminStaff");
              } else if (session?.user?.position === "Admin Staff") {
                setViewingFolder("ReportsModule/AdminStaff/");
              } else if (session?.user?.position === "LF Staff") {
                setViewingFolder("ReportsModule/LFStaff/");
              } else {
                // fallback
                setViewingFolder("ReportsModule/AdminStaff");
              }
            }}
          >
            <div className="generatereport-redirection-icons-section">
              <img src="/Images/form.png" alt="user info" className="redirection-icons-generatereport"/> 
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
                    <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
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
                      {session?.user?.role === "Barangay Official" &&
                        (
                          session?.user?.position === "Secretary" ||
                          session?.user?.position === "Punong Barangay" ||
                          session?.user?.position === "Assistant Secretary" ||
                          session?.user?.position === "Admin Staff"
                        ) && (
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
                        src="/Images/regresident.png" // You can change this to your desired icon
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
                        <img src="/Images/senior.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/students.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/disabled.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/soloparent.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/form.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingMasterResident ? "Generating..." : "Masterlist Resident Inhabitant Record"}
                        </p>
                      </button>
                    </div>
                  )}

                  {currentPage === 2 && (
                    <div className="report-grid">
                      <button onClick={handleGenerateEastResidentPDF} disabled={loadingEastResident} className="report-tile">
                        <img src="/Images/east.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/west.png" alt="user info" className="report-icon"/> 
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
                        <img src="/Images/south.png" alt="user info" className="report-icon"/> 
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
                            src="/Images/form.png"
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
                        <img src="/Images/jobseeker.png" alt="user info" className="report-icon-bigger"/> 
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
                          src="/Images/incident.png"
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
                        <img src="/Images/incidentstatus.png" alt="user info" className="report-icon"/> 
                        <p className="report-title">
                          {loadingIncidentStatuses ? "Generating..." : "Incident Status Summary"}
                        </p>
                      </button>

                      {(session?.user?.department === "Lupon" || session?.user?.position === "Assistant Secretary") && (
                        <>
                          <button onClick={handleGenerateLuponSettledPDF} disabled={loadingLuponSettledReport} className="report-tile">
                            <img src="/Images/incidentsettled.png" alt="user info" className="report-icon-bigger"/> 
                            <p className="report-title">
                              {loadingLuponSettledReport ? "Generating..." : "Lupon Settled Report"}
                            </p>
                          </button>

                          <button onClick={handleGenerateLuponPendingPDF} disabled={loadingLuponPendingReport} className="report-tile">
                            <img src="/Images/incidentpending.png" alt="user info" className="report-icon-bigger"/> 
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
                                <img src="/Images/womenandchildren.png" alt="icon" className="report-icon-bigger" />
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
                                <img src="/Images/womenandchildren.png" alt="icon" className="report-icon-bigger" />
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
                            <img src="/Images/genders.png" alt="user info" className="report-icon"/> 
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
                            src="/Images/services.png"
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
                          onGenerate={(startMonth, startYear, endMonth, endYear, allTime, docType, status) => {
                            void handleGenerateServiceRequestPDF(
                              startMonth,
                              startYear,
                              endMonth,
                              endYear,
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
                      <>
                      <button  className="report-tile">
                        <img src="/Images/participation.png" alt="user info" className="report-icon"/> 
                          <p className="report-title">
                            Program Participation Report
                          </p>
                      </button>                          
                      <button
                        type="button"
                        onClick={() => setShowProgramsMonthlyModal(true)}
                        disabled={loadingProgramsMonthly}
                        className={`report-tile ${loadingProgramsMonthly ? "disabled" : ""}`}
                        aria-busy={loadingProgramsMonthly}
                        aria-label="Generate Monthly Programs Report"
                      >
                        <img src="/Images/status.png" alt="" className="report-icon-bigger" aria-hidden="true" />
                        <p className="report-title">
                          {loadingProgramsMonthly ? "Generating..." : "Monthly Programs Report"}
                        </p>
                      </button>

                      <ProgramsMonthlyReportModal
                        open={showProgramsMonthlyModal}
                        onClose={() => setShowProgramsMonthlyModal(false)}
                        range={range}
                        onRangeChange={setRange}
                        approvalStatus={approvalStatus}
                        onApprovalStatusChange={(v) => setApprovalStatus(v)}
                        progressStatus={progressStatus}
                        onProgressStatusChange={(v) => setProgressStatus(v)}
                        loading={loadingProgramsMonthly}
                        onGenerate={(args) => {
                          // NOTE: the generator itself ignores progress when approval is Rejected.
                          void handleGenerateProgramsMonthlyPDF(args);
                        }}
                      />
                      </>
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
                    selectedModule === "Services Module" 
                    //selectedModule === "Programs Module"
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
                    <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
              <h1> Download Form </h1>
            </div>

            {session?.user?.position === "Assistant Secretary" && (
              <div className="action-btn-downloadble-forms">
                <button className="action-download" onClick={handleUploadClick}>Upload File</button>
              </div>
            )}

          </div>

          <div className="downloadble-report-header-body">

            <div className="downloadble-report-info-toggle-wrapper">
              {(session?.user?.position === "Secretary" ||
                session?.user?.position === "Assistant Secretary" ||
                session?.user?.position === "Punong Barangay") && (
                <>
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
                            <img src="/Images/form.png" alt="Form Icon" />
                            <span>{file.name.replace(".docx", "")}</span>
                          </div>
                          <div className="form-buttons">
                            <button
                              className="download-btn"
                              onClick={() => uploadForms(file.url)}
                            >
                              Download
                            </button>
                            {canUpload && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteClick(file.name)}
                              >
                                Delete
                              </button>
                            )}
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
                <div className="spinner" />
                <p>{generatingMessage}</p>
              </div>
            </div>
          )}

                {isLoading.status && (
            <div className="popup-backdrop-download">
              <div className="popup-content-download">
                  <div className="spinner"/>
                    <p>{isLoading.message}</p>
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
