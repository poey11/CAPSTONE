

"use client";
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import { useState, useEffect, useRef} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllSpecificDocument, deleteDocument, generateDownloadLink} from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";
import { db,storage } from "@/app/db/firebase";
import { collection, onSnapshot, orderBy, query, where, getDocs, doc, getDoc, addDoc} from "firebase/firestore";
import ExcelJS from "exceljs";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { saveAs } from "file-saver";

const statusOptions = ["Pending", "CFA", "Settled", "Dismissed", "Refer to Government Agency"];

export default function Department() {
  const user = useSession().data?.user;
  const userDepartment = user?.department;

  
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]); // Ensure this is populated
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 10; // Can be changed
  

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedIncidentNumber, setSelectedIncidentNumber] = useState<string | null> (null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showAlertPopup, setshowAlertPopup] = useState(false); 

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
  const [showSuccessGenerateReportPopup, setShowSuccessGenerateReportPopup] = useState(false);
  const [popupSuccessGenerateReportMessage, setPopupSuccessGenerateReportMessage] = useState("");
  const [showErrorGenerateReportPopup, setShowErrorGenerateReportPopup] = useState(false);
  const [popupErrorGenerateReportMessage, setPopupErrorGenerateReportMessage] = useState("");
  const [loadingIncidentSummary, setLoadingIncidentSummary] = useState(false);    

 const searchParams = useSearchParams();
  const highlightUserId = searchParams.get("highlight");
 const [highlightedId, setHighlightedId] = useState<string | null>(null);



  const router = useRouter();
  const searchParam = useSearchParams();
  const departmentId = searchParam.get("id");


  const isAuthorized = userDepartment === departmentId;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [viewActiveSection, setViewActiveSection] = useState("complainant");
  const [selectedArea, setSelectedArea] = useState<string>("");

  
  const hasAnimatedOnce = useRef(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const [hasDialogue, setHasDialogue] = useState(false);
  const [hasHearing, setHasHearing] = useState(false);
  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [dialogueMeetingData, setDialogueMeetingData] = useState<any | null>(null);
  const [hearingData, setHearingData] = useState<any[]>([]);
  const [generatedSummonLetter, setGeneratedSummonLetter] = useState<any[]>([]);

  // error toast top right
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


const openPopup = async (incident: any) => {
  setViewActiveSection("complainant");
  setIsPopupOpen(true);

  const params = new URLSearchParams(window.location.search);
  params.set("viewid", incident.id);
  router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });

  const incidentId = incident.id;

  // --- DialogueMeeting ---
  const dialogueDocRef = doc(db, "IncidentReports", incidentId, "DialogueMeeting", incidentId);
  const dialogueDocSnap = await getDoc(dialogueDocRef);
  const dialogueData = dialogueDocSnap.exists() ? dialogueDocSnap.data() : null;

  // --- Generated Letter (dialogue) ---
  const dialogueLettersSnap = await getDocs(
    query(
      collection(db, "IncidentReports", incidentId, "GeneratedLetters"),
      where("letterType", "==", "dialogue")
    )
  );
  const generatedDialogueLetter = !dialogueLettersSnap.empty ? dialogueLettersSnap.docs[0].data() : null;

  if (dialogueData && generatedDialogueLetter) {
    const mergedDialogueData = {
      HearingOfficer: dialogueData?.HearingOfficer || "No Hearing Officer Assigned",
      remarks: dialogueData?.remarks || "No Remarks Available",
      partyA: dialogueData?.partyA || "No Party A Assigned",
      partyB: dialogueData?.partyB || "No Party B Assigned",
      minutesOfDialogue: dialogueData?.minutesOfDialogue || "No Minutes Available",
      DateTimeOfMeeting: generatedDialogueLetter?.DateTimeOfMeeting || null,
    };
    setDialogueMeetingData(mergedDialogueData);
    setHasDialogue(true);
  } else {
    setDialogueMeetingData(null);
    setHasDialogue(false);
  }

  // --- Generated Letters (summon) ---
  const summonLettersSnap = await getDocs(
    query(
      collection(db, "IncidentReports", incidentId, "GeneratedLetters"),
      where("letterType", "==", "summon"),
      orderBy("createdAt", "asc")
    )
  );

  const summonLetters = summonLettersSnap.docs.map((doc) => doc.data());
  setGeneratedSummonLetter(summonLetters);
  setHasHearing(summonLetters.length > 0);

  // --- SummonsMeeting collection ---
  const hearingSnap = await getDocs(
    query(collection(db, "IncidentReports", incidentId, "SummonsMeeting"), orderBy("nosHearing", "desc"))
  );

  const hearingEntries = hearingSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  setHearingData(hearingEntries);

  // Set selected
  setSelectedIncident(incident);
};


    const closePopup = () => {
      setSelectedIncident(null);
      setIsPopupOpen(false);
      const params = new URLSearchParams(window.location.search);
      params.delete("viewid");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    };
  
    useEffect(() => {
      // Animate filters only once on initial page load
      if (!hasAnimatedOnce.current) {
        hasAnimatedOnce.current = true;
        setFiltersLoaded(false);
        const timeout = setTimeout(() => {
          setFiltersLoaded(true);
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        // Never retrigger animation again
        setFiltersLoaded(true);
      }
    }, []);
  

    useEffect(() => {
    if(selectedIncident?.file){
      generateDownloadLink(selectedIncident?.file, "IncidentReports").then(url => {
        if (url) setconcernImageUrl(url);
      });
    }
  },[selectedIncident]);

  const formatDateTime = (rawDate: string | undefined) => {
  if (!rawDate) return "Not Yet Investigated";
  const date = new Date(rawDate);
  return `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, '0')} - ${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const hearingFormDataA = (item: any, index: number, generatedSummonLetter: any[]) => ({
  partyA: item.partyA || "No Party A Assigned",
  partyB: item.partyB || "No Party B Assigned",
  hearingMeetingDateTime: formatDateTime(generatedSummonLetter?.[index]?.DateTimeOfMeeting) || "Not Yet Investigated",
  remarks: item.remarks || "No Remarks Available",
  minutesOfCaseProceedings: item.minutesOfCaseProceedings || "No Minutes Available",
  firstHearingOfficer: item.firstHearingOfficer || "No First Hearing Officer Assigned",
  secondHearingOfficer: item.secondHearingOfficer || "No Second Hearing Officer Assigned",
  thirdHearingOfficer: item.thirdHearingOfficer || "No Third Hearing Officer Assigned"
});

const [openIndices, setOpenIndices] = useState<{[key:number]: boolean}>({});

const toggleOpen = (index: number) => {
    setOpenIndices(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  function getHearingOfficer(nos: string, formData: any) {
    const key = `${nos.toLowerCase()}HearingOfficer`;
    return formData[key] || "No Hearing Officer Assigned";
  }

  useEffect(() => {
    if (highlightUserId && filteredIncidents.length > 0) {
      setHighlightedId(highlightUserId);
  
      const incidentIndex = filteredIncidents.findIndex(
        (incident) => incident.id === highlightUserId
      );
  
      if (incidentIndex !== -1) {
        const newPage = Math.floor(incidentIndex / incidentsPerPage) + 1;
  
        if (currentPage !== newPage) {
          setCurrentPage(newPage);
        }
  
        // Delay scrolling slightly to let page update
        const scrollTimeout = setTimeout(() => {
          const targetElement = document.querySelector("tr.highlighted-row");
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);
  
        const clearHighlightTimeout = setTimeout(() => {
          setHighlightedId(null);
  
          const params = new URLSearchParams(window.location.search);
          params.delete("highlight");
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          router.replace(newUrl, { scroll: false });
        }, 3000);
  
        return () => {
          clearTimeout(scrollTimeout);
          clearTimeout(clearHighlightTimeout);
        };
      }
    }
  }, [highlightUserId, filteredIncidents, currentPage, incidentsPerPage, router]);



  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDocument("IncidentReports", deleteUserId);
        await deleteDocument("IncidentReports/Investigator", deleteUserId);
  
        setIncidentData((prev) => prev.filter(resident => resident.id !== deleteUserId));
        setShowDeletePopup(false);
        setDeleteUserId(null);
  
        setPopupMessage("Incident Record deleted successfully!");
        setShowPopup(true);
  
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      } catch (error) {
        console.error("Error deleting incident:", error);
        setPopupMessage("Failed to delete incident.");
        setShowPopup(true);
  
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      }
    }
  };
  

/*Revised this. Copy from Online Request in Service Module. */

  useEffect(() => {
    if (!departmentId) return;
    const Collection = query(
      collection(db,"IncidentReports"),
      where("department", "==", departmentId),
      orderBy ("createdAt", "desc")); // Order by dateFiled in descending order
    const unsubscribe = onSnapshot(Collection, (snapshot) => {
      let data: any[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
       data.sort((a, b) => {
          if(a.statusPriority !== b.statusPriority) {
            return a.statusPriority - b.statusPriority; // Sort by status priority first
          }
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // Sort by createdAt in descending order
        });
      setIncidentData(data);
      setFilteredIncidents(data); // Initialize filteredIncidents with fetched data
    });
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    
  }, [departmentId]);


  const handleView = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/ViewIncident?id=${reportId}`);
  };

  const handleEdit = (reportId: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/IncidentModule/EditIncident?id=${reportId}`);
    }
  };

  const handleDeleteClick = (reportId: string, incidentNumber: string) => {
    if (isAuthorized) {
      setDeleteUserId(reportId);
      setSelectedIncidentNumber(incidentNumber);
      setShowDeletePopup(true);
    } else {
      alert("You are not authorized to delete this resident.");
      router.refresh(); // Refresh the page
    }
  };




/*
For Nature Filters
*/
const natureOptionsByDepartment: { [key: string]: string[] } = {
  Lupon: ["Civil", "Criminal", "Others"],
  GAD: [
    "Physical Abuse",
    "Sexual Abuse",
    "Psychological, Enviromental, Verbal Abuse",
    "Economic, Financial Abuse",
    "Public Space Sexual Harassment",
    "Others: (Trafficking, Prostitution, Violaiton of RA9208)",
  ],
  BCPC: [
    "Child Abuse",
    "Child Exploitation",
    "Child Trafficking",
    "Child Labor",
    "Child Neglect",
    "Child Abandonment",
    "Child Sexual Abuse",
    "Child Physical Abuse",
    "Child Psychological Abuse",
    "Child Bullying",
    "Child Prostitution",
    "Others",
  ],
  VAWC: [
    "Physical Abuse",
    "Sexual Abuse",
    "Psychological, Enviromental, Verbal Abuse",
    "Economic, Financial Abuse",
    "Public Space Sexual Harassment",
    "Others: (Trafficking, Prostitution, Violaiton of RA9208)",
  ],
};


//FILTERS LOGIC

const [showCount, setShowCount] = useState<number>(0);
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
const [selectedStatus, setSelectedStatus] = useState<string>("");
const [caseNumberSearch, setCaseNumberSearch] = useState("");
const [incidentType, setIncidentType] = useState<string>("");
const [selectedNature, setSelectedNature] = useState<string>("");



useEffect(() => {
  let filtered = [...incidentData];

  // Filter by status
  if (selectedStatus) {
    filtered = filtered.filter(
      (incident) =>
        incident.status?.toLowerCase().trim() === selectedStatus.toLowerCase()
    );
  }


if (incidentType) {
  filtered = filtered.filter(
    (incident) =>
      incident.typeOfIncident?.toLowerCase().trim() === incidentType.toLowerCase()
  );
}


  {/*}
  if (caseNumberSearch) {
    filtered = filtered.filter((incident) => {
      const segments = incident.caseNumber?.split(" - ");
      const lastSegment = segments?.[2]?.trim();
      return lastSegment?.includes(caseNumberSearch.trim());
    });
  }
  */}

    // Filter by case number (any segment, partial match)
  if (caseNumberSearch) {
    filtered = filtered.filter((incident) => {
      return incident.caseNumber
        ?.toLowerCase()
        .includes(caseNumberSearch.trim().toLowerCase());
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const numA = parseInt(a.residentNumber, 10) || 0;
    const numB = parseInt(b.residentNumber, 10) || 0;
    return sortOrder === "asc" ? numA - numB : numB - numA;
  });

  // Limit
  if (showCount) {
    filtered = filtered.slice(0, showCount);
  }


  if (selectedNature) {
  filtered = filtered.filter(
    (incident) =>
      incident.nature?.toLowerCase().trim() === selectedNature.toLowerCase()
  );
}

if (selectedArea) {
  filtered = filtered.filter(
    (incident) =>
      incident.areaOfIncident?.toLowerCase().trim() === selectedArea.toLowerCase()
  );
}


  
  setCurrentPage(1);

  setFilteredIncidents(filtered);
}, [incidentData, selectedStatus, showCount, sortOrder, caseNumberSearch, incidentType, selectedNature, selectedArea]);


  // Pagination logic
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
      ) {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  const [mediaType, setMediaType] = useState<string>("");
  
  useEffect(() => {
   let type = "";

   if (concernImageUrl) {
     // Try to extract file name with extension from Firebase URL
     const match = concernImageUrl.match(/\/o\/(.*?)\?/); // get path after /o/ and before ?
     const decodedPath = match ? decodeURIComponent(match[1]) : "";
     const fileExtension = decodedPath.split('.').pop()?.toLowerCase();

     console.log("Decoded filename:", decodedPath);
     console.log("File Extension:", fileExtension);

     if (fileExtension?.match(/(jpg|jpeg|png|gif|webp)$/)) {
       type = "image";
     } else if (fileExtension?.match(/(mp3|wav|ogg)$/)) {
       type = "audio";
     } else if (fileExtension?.match(/(mp4|webm|ogg)$/)) {
       type = "video";
     } else {
       type = "unsupported";
     }
   }

     setMediaType(type);
   }, [concernImageUrl]);

   // generate individual case report
const toDateSafe = (raw: any): Date | null => {
  if (!raw) return null;
  if (typeof raw?.toDate === "function") return raw.toDate();
  if (raw instanceof Date) return raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const formatDT = (raw: any): string => {
  const d = toDateSafe(raw);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
};

const formatDTLoose = (raw: any): string => {
  if (!raw) return "";
  const d = toDateSafe(raw);
  if (d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
  }
  if (typeof raw === "string") {
    // accept e.g. "2025-07-28T15:51" or "2025-07-28 15:51[:ss]"
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/);
    if (m) return `${m[1]} ${m[2]}`;
    return raw; // last resort: pass through
  }
  return "";
};


const replacePlaceholders = (worksheet: ExcelJS.Worksheet, mapping: Record<string, string>) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === "string") {
        let val = cell.value as string;
        let changed = false;
        for (const [key, replacement] of Object.entries(mapping)) {
          if (val.includes(key)) {
            val = val.split(key).join(replacement ?? "");
            changed = true;
          }
        }
        if (changed) cell.value = val;
      }
    });
  });
};

const deleteRowsByLabels = (ws: ExcelJS.Worksheet, labels: string[]) => {
  const toDelete: number[] = [];
  ws.eachRow((row, n) => {
    const a = String(row.getCell(1).value ?? "").trim();
    if (labels.includes(a)) toDelete.push(n);
  });
  toDelete.sort((a, b) => b - a).forEach((n) => ws.spliceRows(n, 1));
};

const sheetHasPlaceholder = (ws: ExcelJS.Worksheet, placeholder: string): boolean => {
  let found = false;
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      if (typeof cell.value === "string" && (cell.value as string).includes(placeholder)) found = true;
    })
  );
  return found;
};

// Basic “auto-fit” row height for wrapped text in a given column (default B)
const autoFitRows = (ws: ExcelJS.Worksheet, textCol = 2) => {
  const colWidth = ws.getColumn(textCol).width ?? 50; // chars
  const charsPerLine = Math.max(10, Math.floor(colWidth)); // rough
  const base = 15; // pt per line approx

  ws.eachRow((row) => {
    const cell = row.getCell(textCol);
    if (cell && typeof cell.value === "string") {
      const s = (cell.value as string).replace(/\r/g, "");
      const segments = s.split("\n").map((v) => v.trim());
      const lines = segments.reduce((sum, seg) => sum + Math.max(1, Math.ceil(seg.length / charsPerLine)), 0);
      cell.alignment = { ...(cell.alignment || {}), wrapText: true, vertical: "top" };
      row.height = Math.max(base + 2, lines * base); // grow row
    }
  });
};

// Delete a contiguous section starting at header text in Column A
const deleteSectionByHeader = (ws: ExcelJS.Worksheet, headerLabel: string, nextHeaderCandidates: string[]) => {
  let start = -1;
  ws.eachRow((row, n) => {
    const a = String(row.getCell(1).value ?? "").trim();
    if (a === headerLabel && start === -1) start = n;
  });
  if (start === -1) return;

  let stop = (ws.lastRow?.number ?? start) + 1;
  ws.eachRow((row, n) => {
    if (n <= start) return;
    const a = String(row.getCell(1).value ?? "").trim();
    if (nextHeaderCandidates.includes(a) && n < stop) stop = n;
  });

  const count = stop - start;
  if (count > 0) ws.spliceRows(start, count);
};

const ORD_LABELS = ["First", "Second", "Third"] as const;
type OrdLabel = typeof ORD_LABELS[number];
const normalizeOrd = (v: any): OrdLabel | null => {
  if (v === null || v === undefined) return null;
  const num = typeof v === "number" ? v : /^\d+$/.test(String(v)) ? parseInt(String(v), 10) : NaN;
  if (!isNaN(num)) {
    if (num >= 0 && num <= 2) return ORD_LABELS[num];
    if (num >= 1 && num <= 3) return ORD_LABELS[num - 1];
  }
  const s = String(v).toLowerCase().trim();
  if (["first", "1st"].includes(s)) return "First";
  if (["second", "2nd"].includes(s)) return "Second";
  if (["third", "3rd"].includes(s)) return "Third";
  return null;
};

const pickOfficer = (h: any, label: OrdLabel): string =>
  h?.hearingOfficer ||
  h?.[`${label.toLowerCase()}HearingOfficer`] ||
  h?.firstHearingOfficer ||
  h?.secondHearingOfficer ||
  h?.thirdHearingOfficer ||
  "";


const generateIncidentCaseReport = async (
  incidentId: string,
  caseNumber?: string
): Promise<string | null> => {
  try {
    setLoadingIncidentSummary?.(true);
    setIsGenerating?.(true);
    setGeneratingMessage?.("Generating Incident Case Report...");

    const incRef = doc(db, "IncidentReports", incidentId);
    const incSnap = await getDoc(incRef);
    if (!incSnap.exists()) { showErrorToast?.("Incident not found."); return null; }
    const inc: any = { id: incidentId, ...incSnap.data() };

    const dialogueSnap = await getDoc(doc(db, "IncidentReports", incidentId, "DialogueMeeting", incidentId));
    const dialogue = dialogueSnap.exists() ? dialogueSnap.data() : null;

    const dialogueLetterSnap = await getDocs(query(
      collection(db, "IncidentReports", incidentId, "GeneratedLetters"),
      where("letterType", "==", "dialogue"),
      orderBy("createdAt", "desc")
    ));
    const dialogueLetter = dialogueLetterSnap.empty ? null : dialogueLetterSnap.docs[0].data();

    const summonLettersSnap = await getDocs(query(
      collection(db, "IncidentReports", incidentId, "GeneratedLetters"),
      where("letterType", "==", "summon"),
      orderBy("createdAt", "asc")
    ));
    const summonLetters = summonLettersSnap.docs.map(d => d.data());

    const hearingsSnap = await getDocs(query(
      collection(db, "IncidentReports", incidentId, "SummonsMeeting"),
      orderBy("nosHearing", "asc")
    ));
    const rawHearings = hearingsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const normHearings = rawHearings
      .map(h => ({ ...h, ord: normalizeOrd(h.nosHearing ?? h.nos) }))
      .filter(h => !!h.ord)
      .sort((a, b) => (a.ord === "First" ? 1 : a.ord === "Second" ? 2 : 3) - (b.ord === "First" ? 1 : b.ord === "Second" ? 2 : 3));

    const hearingByOrd: Record<OrdLabel, any> = {} as any;
    normHearings.forEach(h => (hearingByOrd[h.ord as OrdLabel] = h));

    const lettersByOrd: Record<OrdLabel, any> = {} as any;
    summonLetters.forEach((L: any) => {
      const ord = normalizeOrd(L?.nosHearing ?? L?.nos ?? L?.ordinal);
      if (ord) lettersByOrd[ord] = L;
    });

    const complainant = inc.complainant || {};
    const respondent = inc.respondent || {};

    const mapping: Record<string, string> = {
      "{{CaseNumber}}": inc.caseNumber || caseNumber || "",
      "{{Department}}": inc.department || "",
      "{{Status}}": inc.status || "",
      "{{DateFiled}}": `${inc.dateFiled || ""} ${inc.timeFiled || ""}`.trim(),
      "{{DateReceived}}": `${inc.dateReceived || ""} ${inc.timeReceived || ""}`.trim(),
      "{{Location}}": [inc.location, inc.areaOfIncident].filter(Boolean).join(" - "),
      "{{Nature}}": inc.nature || "",
      "{{TypeOfIncident}}": inc.typeOfIncident || "",
      "{{DeskOfficer}}": inc.receivedBy || "",
      "{{IsLate}}": inc.isReportLate ? "Yes" : "No",
      "{{ReasonLate}}": inc.isReportLate ? (inc.reasonForLateFiling || "N/A") : "",
      "{{Concern}}": inc.concern || "",

      "{{ComplainantFullName}}": `${complainant.fname || ""} ${complainant.lname || ""}`.trim(),
      "{{ComplainantAddress}}": complainant.address || "",
      "{{ComplainantContact}}": complainant.contact || "",
      "{{ComplainantSex}}": complainant.sex || "",
      "{{ComplainantAge}}": complainant.age ? String(complainant.age) : "",
      "{{ComplainantCivilStatus}}": complainant.civilStatus || "",

      "{{RespondentFullName}}": `${respondent.fname || ""} ${respondent.lname || ""}`.trim(),
      "{{RespondentAddress}}": respondent.address || "",
      "{{RespondentContact}}": respondent.contact || "",
      "{{RespondentSex}}": respondent.sex || "",
      "{{RespondentAge}}": respondent.age ? String(respondent.age) : "",
      "{{RespondentCivilStatus}}": respondent.civilStatus || "",

      "{{DialogueDateTime}}": dialogueLetter?.DateTimeOfMeeting ? formatDT(dialogueLetter.DateTimeOfMeeting) : "",
      "{{DialogueOfficer}}": dialogue?.HearingOfficer || "",
      "{{DialoguePartyA}}": dialogue?.partyA || "",
      "{{DialoguePartyB}}": dialogue?.partyB || "",
      "{{DialogueRemarks}}": dialogue?.remarks || "",
      "{{DialogueMinutes}}": dialogue?.minutesOfDialogue || "",
    };

(["First","Second","Third"] as const).forEach((label, i) => {
  const h = hearingByOrd[label] || {};
  const letter = lettersByOrd[label] ?? summonLetters[i] ?? null; // <— fallback to index

  const dtRaw =
    letter?.DateTimeOfMeeting ??
    h.DateTimeOfMeeting ??
    h.hearingMeetingDateTime ??
    h.dateTimeOfMeeting ?? // just in case different casing
    null;

  const idx = i + 1;
  mapping[`{{Hearing${idx}DateTime}}`] = formatDTLoose(dtRaw);
  mapping[`{{Hearing${idx}Officer}}`] = pickOfficer(h, label) || "";
  mapping[`{{Hearing${idx}PartyA}}`] = h.partyA ?? h.partyAStatement ?? h.partyAInput ?? "";
  mapping[`{{Hearing${idx}PartyB}}`] = h.partyB ?? h.partyBStatement ?? h.partyBInput ?? "";
  mapping[`{{Hearing${idx}Remarks}}`] = h.remarks ?? h.remarksHearing ?? "";
  mapping[`{{Hearing${idx}Minutes}}`] = h.minutesOfCaseProceedings ?? h.minutes ?? h.minutesOfDialogue ?? "";
});


    const templateRef = ref(storage, "ReportsModule/LFStaff/Individual Case Report Template.xlsx");
    const templateUrl = await getDownloadURL(templateRef);
    const resp = await fetch(templateUrl);
    const arrayBuffer = await resp.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const ws = workbook.worksheets[0];

    // Layout to reduce clipping
    ws.getColumn(1).width = ws.getColumn(1).width ?? 28; // labels
    ws.getColumn(2).width = Math.max(ws.getColumn(2).width ?? 70, 70); // text
    ws.eachRow((row) => {
      const b = row.getCell(2);
      if (typeof b.value === "string") {
        b.alignment = { ...(b.alignment || {}), wrapText: true, vertical: "top" };
      }
    });

    try {
        let reportTitle = "BARANGAY FAIRVIEW\nINDIVIDUAL INCIDENT REPORT";

          if (inc.status === "Refer to Government Agency") {
            const agency =
              (inc.referredAgency && String(inc.referredAgency).trim()) || "N/A";

            reportTitle = `BARANGAY FAIRVIEW\nINDIVIDUAL INCIDENT REPORT\nREFERRED TO AGENCY:\n${agency.toUpperCase()}\nREPORT`;
        } else if (inc.status === "CFA") {
          reportTitle = "BARANGAY FAIRVIEW\nINDIVIDUAL INCIDENT REPORT\nCERTIFICATE TO FILE ACTION REPORT";
        }

        ws.getCell("A1").value = reportTitle;
      ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
      if (!sheetHasPlaceholder(ws, "{{CaseNumber}}")) {
        ws.getCell("A2").value = `Case No.: ${inc.caseNumber || caseNumber || incidentId}`;
      }
    } catch {}

    replacePlaceholders(ws, mapping);

    if (!inc.isReportLate) {
      deleteRowsByLabels(ws, ["Late Report?", "Reason for Late Filing"]);
    }

    // Remove empty hearing sections entirely
    const nextHeaders = ["HEARING 1","HEARING 2","HEARING 3","DIALOGUE","RESPONDENT","COMPLAINANT","CASE DETAILS"];
    const hEmpty = (n: 1|2|3) =>
      !mapping[`{{Hearing${n}DateTime}}`] &&
      !mapping[`{{Hearing${n}Officer}}`] &&
      !mapping[`{{Hearing${n}PartyA}}`] &&
      !mapping[`{{Hearing${n}PartyB}}`] &&
      !mapping[`{{Hearing${n}Remarks}}`] &&
      !mapping[`{{Hearing${n}Minutes}}`];

    // delete from bottom up so row indices stay valid
    if (hEmpty(3)) deleteSectionByHeader(ws, "HEARING 3", nextHeaders);
    if (hEmpty(2)) deleteSectionByHeader(ws, "HEARING 2", nextHeaders);
    if (hEmpty(1)) deleteSectionByHeader(ws, "HEARING 1", nextHeaders);

    // Auto-fit rows so long paragraphs don't clip
    autoFitRows(ws, 2);

    ws.pageSetup = {
      horizontalCentered: true,
      orientation: "portrait",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    const safeCase = (inc.caseNumber || caseNumber || incidentId).replace(/[^\w.-]/g, "_");
    const xlsxRef = ref(storage, `GeneratedReports/Incident_Case_${safeCase}.xlsx`);
    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    await uploadBytes(xlsxRef, new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const xlsxUrl = await getDownloadURL(xlsxRef);

    setGeneratingMessage?.("Uploading Incident Case Report...");
    return xlsxUrl;
  } catch (error) {
    console.error("Error generating Incident Case XLSX:", error);
    try {
      setShowErrorGenerateReportPopup?.(true);
      setPopupErrorGenerateReportMessage?.("Failed to generate Incident Case Report");
      setTimeout?.(() => setShowErrorGenerateReportPopup?.(false), 5000);
    } catch {}
    return null;
  } finally {
    try { setLoadingIncidentSummary?.(false); } catch {}
  }
};


const handleGenerateIncidentCasePDF = async (incidentId: string, caseNumber?: string) => {
  try {
    setLoadingIncidentSummary?.(true);
    setIsGenerating?.(true);
    setGeneratingMessage?.("Generating PDF...");

    const fileUrl = await generateIncidentCaseReport(incidentId, caseNumber);
    if (!fileUrl) { setIsGenerating?.(false); showErrorToast?.("Failed to generate Excel report"); return; }

    const response = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
    });
    if (!response.ok) throw new Error("Failed to convert to PDF");

    const pdfBlob = await response.blob();
    const safeCase = (caseNumber || incidentId).replace(/[^\w.-]/g, "_");
    saveAs(pdfBlob, `Incident_Case_${caseNumber}.pdf`);

    try {
      await addDoc(collection(db, "BarangayNotifications"), {
        message: `A report (Incident Case: ${caseNumber || incidentId}) was generated by ${user?.fullName || user?.name || "Unknown"}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
    } catch {}

    setIsGenerating?.(false);
    setGeneratingMessage?.("");
    setPopupSuccessGenerateReportMessage?.("Incident Case Report generated successfully");
    setShowSuccessGenerateReportPopup?.(true);
    setTimeout?.(() => setShowSuccessGenerateReportPopup?.(false), 5000);
  } catch (error) {
    console.error("Error generating Incident Case PDF:", error);
    try {
      setShowErrorGenerateReportPopup?.(true);
      setPopupErrorGenerateReportMessage?.("Failed to generate PDF");
      setTimeout?.(() => setShowErrorGenerateReportPopup?.(false), 5000);
    } catch {}
  } finally {
    try { setLoadingIncidentSummary?.(false); setIsGenerating?.(false); } catch {}
  }
};


// Add this helper function somewhere in your component file
const formatStatus = (status: string) => {
  if (!status) return "";
  return status.trim() === "Refer to Government Agency" ? "RGA" : status;
};



  return (
    <main className="main-container-departments"  /* edited this class*/>
      
      <div className="section-1-departments">
        {isAuthorized && (
          <button className="add-announcement-btn-departments add-incident-animated"  /* edited this class*/ onClick={() => router.push(`/dashboard/IncidentModule/AddIncident?departmentId=${departmentId}`)}>
          Add New Incident
          </button>
        )}
        
      </div>

      <div className={`section-2-departments ${filtersLoaded ? "filters-animated" : ""}`}  /* edited this class*/>
    
      <input
        type="text"
        className="search-bar-departments"
        placeholder="Search Case No. (e.g. BCPC - POPHYJ - 0015 or 0015)"
        value={caseNumberSearch}
        onChange={(e) => setCaseNumberSearch(e.target.value)}
      />
              



        <select
          className="featuredStatus-departments"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="featuredStatus-departments"
          value={incidentType}
          onChange={(e) => setIncidentType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Minor">Minor</option>
          <option value="Major">Major</option>
        </select>


      {/*
                <select
              className="featuredStatus-departments"
              value={showCount}
              onChange={(e) => setShowCount(Number(e.target.value))}
            >
              <option value="0">Show All</option>
              <option value="5">Show 5</option>
              <option value="10">Show 10</option>
            </select>

      */}


        {departmentId && (
            <select
              className="featuredStatus-departments"
              value={selectedNature}
              onChange={(e) => setSelectedNature(e.target.value)}
            >
              <option value="">All Natures</option>
              {natureOptionsByDepartment[departmentId]?.map((nature) => (
                <option key={nature} value={nature}>
                  {nature}
                </option>
              ))}
            </select>
          )}


       <select
            className="featuredStatus-departments"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="">All Areas</option>
            <option value="East Fairview">East Fairview</option>
            <option value="West Fairview">West Fairview</option>
            <option value="South Fairview">South Fairview</option>
        </select>




      </div>


          <div
              className={`main-section-departments ${
                !isAuthorized ? "expand-when-no-section1" : ""
              }`}
            >
        {currentIncidents.length === 0 ? (
          <div className="no-result-card-departments" /* edited this class */>
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-departments" /* edited this class *//>
            <p className="no-results-departments" /* edited this class */>No Results Found</p>
          </div>
        ) : (
          <table>
            <thead /* edited this class */>
              <tr >
                <th /* edited this class */>Case Number</th> 
                <th>Date & Time of the Incident</th>
                <th>Area Of Incident</th>
                <th>Nature of Complaint</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentIncidents.map((incident, index) => (
              <tr /* edited this class*/
                key={incident.id}
                className={highlightedId === incident.id ? "highlighted-row" : ""}
              >
                  <td /* edited this class */>{incident.caseNumber}</td>
                  <td>{incident.dateFiled} {incident.timeFiled}</td>
                  <td>{incident.areaOfIncident}</td>
                  {incident.nature === "Others" ? (<td>{incident.specifyNature}</td>):(<td>{incident.nature}</td>)}
                      <td>
                        <span
                          className={`status-badge-departments ${formatStatus(incident.status)
                            .toLowerCase()
                           .replace(" ", "-")}`}
                        >
                          <p>{formatStatus(incident.status)}</p>
                        </span>
                      </td>

                  <td>
                    <div className="actions-departments-main">
                      <button className="action-view-departments-main" onClick={() => openPopup(incident)}>
                        <img src="/Images/view.png" alt="View" />
                      </button>
                      {isAuthorized && (
                        <>
                        {incident.status !== "settled" && incident.status !== "CFA" && incident.status !=="Refer to Government Agency" && incident.status !=="dismissed" && (
                          <button className="action-edit-departments-main" onClick={(e) => { e.stopPropagation(); handleEdit(incident.id); }}> <img src="/Images/edit.png" alt="Edit" /></button>
                        )}
                          <button className="action-delete-departments-main" onClick={(e) => { e.stopPropagation(); handleDeleteClick(incident.id, incident.caseNumber); }}><img src="/Images/delete.png" alt="Delete" /></button>
                        {(incident.status === "CFA" || incident.status === "Refer to Government Agency") && (
                          <button
                            className="action-print-departments-main"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateIncidentCasePDF(incident.id, incident.caseNumber);
                            }}
                          >
                            <img src="/Images/printer.png" alt="Print" />
                          </button>
                        )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>



    <div className="redirection-section-departments" /* edited this class */>
        <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === 'number' && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>&raquo;</button>
      </div>



    
      {showDeletePopup && (
      <div className="confirmation-popup-overlay-add">
        <div className="confirmation-popup-incident">
          <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
          <p>Are you sure you want to delete this Incident Record?</p>
          <h2>Incident Number: {selectedIncidentNumber}</h2>
          <div className="yesno-container-add">
            <button onClick={() => setShowDeletePopup(false)} className="no-button-add">No</button>
            <button onClick={confirmDelete} className="yes-button-add">Yes</button>
          </div> 
        </div>
      </div>
    )}
  
    {showPopup && (
      <div className={`popup-overlay-add show`}>
        <div className="popup-add">
          <p>{popupMessage}</p>
        </div>
      </div>
    )}
  
    {showAlertPopup && (
      <div className="confirmation-popup-overlay-add">
        <div className="confirmation-popup-add">
          <p>{popupMessage}</p>
          <div className="yesno-container-add">
            <button onClick={() => setshowAlertPopup(false)} className="no-button-add">Continue</button>
          </div> 
        </div>
      </div>
    )}

    {isPopupOpen && selectedIncident && (
      <div className="incident-view-popup-overlay add-incident-animated">
        <div className="view-incident-popup">
          <div className="view-incident-main-section1">
            <div className="view-user-header-first-section">
              <img src="/Images/QCLogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
            </div>
            <div className="incident-view-header-second-section">
              <h2 className="gov-info">Republic of the Philippines</h2>
              <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
              <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
              <h2 className="contact">930-0040 / 428-9030</h2>
            </div>
            <div className="view-user-header-third-section">
              <img src="/Images/logo.png" alt="Brgy Logo" className="user-logo2-image-side-bar-1" />
            </div>
          </div>
          <div className="incident-view-header-body">
              <div className="incident-view-header-body-top-section">
                  <div className="incident-view-backbutton-container">
                    <button onClick={closePopup}>
                      <img src="/Images/left-arrow.png" alt="Left Arrow" className="incident-back-btn" />
                    </button>
                  </div>
                  <div className="view-incident-user-info-toggle-wrapper">
                    {["complainant", "respondent", "incident", "deskofficer"]
                      .concat(hasDialogue ? ["dialogue"] : [])
                      .concat(hasHearing ? ["hearing"] : [])
                      .map((section) => (
                        <button
                          key={section}
                          type="button"
                          className={`incident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                          onClick={() => setViewActiveSection(section)}
                        >
                          {section === "complainant" && "Complainant"}
                          {section === "respondent" && "Respondent"}
                          {section === "incident" && "Incident"}
                          {section === "deskofficer" && "Officer"}
                          {section === "dialogue" && "Dialogue"}
                          {section === "hearing" && "Hearing"}
                        </button>
                    ))}
                  </div>
                </div>
                <div className="incident-view-header-body-bottom-section">
                  <div className="incident-view-info-main-container">
                    <div className="incident-view-info-main-content">
                      <div className="incident-view-info-main-content-left-details">
                        <div className="incident-maindetails-top-section">
                          <h1>{selectedIncident.caseNumber}</h1>
                        </div>
                        <div className="incident-main-details-statussection">
                          <h1> Status</h1>

                      <div className="view-incident-status-section-view">
                        <p
                          className={`view-incident-status-badge-view ${formatStatus(
                            selectedIncident?.status || ""
                          )
                            .toLowerCase()
                           .replace(" ", "-")}`}
                        >
                          {formatStatus(selectedIncident?.status || "")}
                        </p>
                      </div>

                        </div>

      
                        <div className="incident-maindetails-bottom-section">
                          <div className="incident-main-details-description">
                            <div className="incident-date-section">
                              <div className="incident-date-topsection">
                                <div className="incident-main-details-icons-section">
                                  <img src="/Images/calendar.png" alt="calendar icon" className="view-incident-description-icon-calendar" />
                                </div>
                                <div className="incident-main-details-title-section">
                                  <h1>Date Filed</h1>
                                </div>
                              </div>
                              <p>{`${selectedIncident?.dateFiled}${selectedIncident?.isReportLate ? " (Late Filing)" : ""} `  || ""}</p>
                            </div>

                              <div className="incident-date-section">
                              <div className="incident-date-topsection">
                                <div className="incident-main-details-icons-section">
                                  <img src="/Images/calendar.png" alt="calendar icon" className="view-incident-description-icon-calendar" />
                                </div>
                                <div className="incident-main-details-title-section">
                                  <h1>Type of ncident</h1>
                                </div>
                              </div>
                                      <p>{selectedIncident?.typeOfIncident || "N/A"}</p>
                            </div>

                            <div className="incident-location-section">
                              <div className="incident-loc-topsection">
                                <div className="incident-main-details-icons-section">
                                  <img src="/Images/loc.png" alt="location icon" className="view-incident-description-icon-loc" />
                                </div>
                                <div className="incident-main-details-title-section">
                                  <h1>Location</h1>
                                </div>
                              </div>
                              <p>{`${selectedIncident?.location} - ${selectedIncident?.areaOfIncident}` || "N/A"}</p>
                            </div>

                            <div className="incident-description-section">
                              <div className="incident-desc-topsection">
                                <div className="incident-main-details-icons-section">
                                  <img src="/Images/description.png" alt="description icon" className="view-incident-description-icon-desc" />
                                </div>
                                <div className="incident-main-details-title-section">
                                  <h1>Nature</h1>
                                </div>
                              </div>
                              <p>{selectedIncident?.nature || "N/A"}</p>
                            </div>

                                {selectedIncident?.status === "settled" && selectedIncident.department === "Lupon" && (
                                  <div className="incident-description-section">
                                    <div className="incident-desc-topsection">
                                      <div className="incident-main-details-icons-section">
                                        <img src="/Images/description.png" alt="description icon" className="view-incident-description-icon-desc" />
                                      </div>
                                      <div className="incident-main-details-title-section">
                                        <h1>Action taken:</h1>
                                      </div>
                                    </div>
                                    <ul className="incident-settlement-options">
                                      {selectedIncident?.isMediation && <li>Mediation</li>}
                                      {selectedIncident?.isConciliation && <li>Conciliation</li>}
                                      {selectedIncident?.isArbitration && <li>Arbitration</li>}
                                    </ul>
                                  </div>
                                )}


                          </div>
                        </div>
                      </div>
                      <div className="incident-view-info-main-content-right-details">
                        <div className="view-incident-info-main-content">
                          {viewActiveSection  === "complainant" && (
                            <>
                              <div className="view-mainresident-content-left-side">
                                <div className="view-user-fields-section">
                                  <p>Complainent's Last Name</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.lname || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Complainent's First Name</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.fname || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Civil Status</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.civilStatus || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Age</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.age || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                              <div className="view-mainresident-content-left-side">
                                <div className="view-user-fields-section">
                                  <p>Contact Number</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.contact || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Address</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.address || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Gender</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.complainant?.sex || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                            </>
                          )}
                          {viewActiveSection  === "respondent" && (
                            <>
                              <div className="view-mainresident-content-left-side">
                                <div className="view-user-fields-section">
                                  <p>Respondent's Last Name</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.lname || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Respondent's First Name</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.fname || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Civil Status</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.civilStatus || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Age</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.age || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                              <div className="view-mainresident-content-left-side">
                                <div className="view-user-fields-section">
                                  <p>Contact Number</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.contact || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Address</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.address || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                                <div className="view-user-fields-section">
                                  <p>Gender</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.respondent?.sex || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                            </>
                          )}
                          {viewActiveSection  === "incident" && (
                            <>
                              <div className="incident-main-section">
                                <div className="incident-top-section">  
                                  <div className="view-main-user-content-left-side">
                                    <div className="view-user-fields-section">
                                      <p>Incident Nature</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={selectedIncident.nature}
                                        readOnly
                                      /> 
                                    </div>
                                    <div className="view-user-fields-section">
                                      <p>Type of Incident</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={selectedIncident.typeOfIncident}
                                        readOnly
                                      /> 
                                    </div>
                                    {selectedIncident.department === "GAD" && (
                                      <>
                                        <div className="view-user-fields-section">
                                          <p>No of Male Children Victim/s</p>
                                          <input type="text" className="view-user-input-field" name="nosofMaleChildren" value={selectedIncident?.nosofMaleChildren || "N/A"} readOnly
                                          />
                                        </div>
                                      </>
                                    )}
                                    {selectedIncident.typeOfIncident === "Minor" && (
                                      <div className="view-user-fields-section">
                                        <p>Recommended Event</p>
                                        <input type="text" className="view-user-input-field" name="recommendedEvent" value={selectedIncident?.recommendedEvent || "N/A"} readOnly />
                                      </div>
                                    )}
                                  </div>
                                  <div className="view-main-user-content-right-side">
                                    <div className="view-user-fields-section">
                                      <p>Date and Time Filed</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={
                                          `${selectedIncident.dateFiled || "N/A"} ${selectedIncident.timeFiled || ""}`.trim()
                                        }
                                        readOnly
                                      />
                                    </div>
                                    <div className="view-user-fields-section">
                                      <p>Incident Location</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={`${selectedIncident?.location} - ${selectedIncident?.areaOfIncident}` || "N/A"}
                                        readOnly
                                      /> 
                                    </div>
                                    {selectedIncident.department === "GAD" && (
                                      <>
                                        <div className="view-user-fields-section">
                                          <p>No of Female Children Victim/s</p>
                                          <input type="text" className="view-user-input-field" name="nosofFemaleChildren" value={selectedIncident?.nosofFemaleChildren || "N/A"} readOnly
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="incident-bottom-section">
                                  
                                  {selectedIncident?.isReportLate && (
                                    <div className="view-incident-partyA-container">
                                      <div className="box-container-outer-natureoffacts">
                                          <div className="title-remarks-latefiling">
                                              Reason For Late Filing/Reporting
                                          </div>
                                          <div className="box-container-partyA">
                                            <textarea className="natureoffacts-input-field" name="reasonForLateFiling" id="reasonForLateFiling" value={selectedIncident.reasonForLateFiling || "NA"} readOnly/>
                                          </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">
                                        Nature of Facts
                                      </div>
                                      <div className="box-container-partyA">
                                      <textarea className="natureoffacts-input-field" name="concern" value={selectedIncident.concern} readOnly/>
                                      </div>
                                    </div>
                                  </div>
                                    {concernImageUrl ? (
                                      <div className="services-onlinereq-verification-requirements-section">
                                        <span className="verification-requirements-label">Incident Evidence</span>
                                    
                                        <div className="services-onlinereq-verification-requirements-container">
                                          <div className="file-name-image-display">
                                    
                                            {mediaType === "image" ? (
                                              <a href={concernImageUrl} target="_blank" rel="noopener noreferrer">
                                                <img
                                                  src={concernImageUrl}
                                                  alt="Incident Image"
                                                  className="verification-reqs-pic uploaded-pic"
                                                  style={{ cursor: 'pointer' }}
                                                />
                                              </a>
                                            ) : mediaType === "audio" ? (
                                              <audio controls className="incident-audio" style={{ width: '100%' }}>
                                                <source src={concernImageUrl} />
                                                Your browser does not support the audio element.
                                              </audio>
                                            ) : mediaType === "video" ? (
                                              <video controls className="incident-video" width="65%">
                                                <source src={concernImageUrl} />
                                                Your browser does not support the video element.
                                              </video>
                                            ) : (
                                              <p className="unsupported-text">Unsupported media type</p>
                                            )}

                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="services-onlinereq-verification-requirements-section">
                                        <span className="verification-requirements-label">Incident Evidence</span>
                                        <div className="services-onlinereq-verification-requirements-container">
                                          <div className="no-verification-files-text">
                                            <p>No media available</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                </div>
                              </div>
                            </>
                          )}
                          {viewActiveSection  === "deskofficer" && (
                            <>
                              <div className="view-mainresident-content-left-side">
                                <div className="view-user-fields-section">
                                  <p>Desk Officer Full Name</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedIncident.receivedBy || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                              <div className="view-mainresident-content-right-side"> 
                                <div className="view-user-fields-section">
                                  <p>Date and Time Signed</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={
                                          `${selectedIncident.dateReceived || "N/A"} ${selectedIncident.timeReceived || ""}`.trim()
                                        }
                                    readOnly
                                  /> 
                                </div>
                              </div>
                            </>
                          )}
                          {viewActiveSection  === "dialogue" && (
                            <>
                              <div className="incident-main-section">
                                <div className="incident-top-section">  
                                  <div className="view-main-user-content-left-side">
                                    <div className="view-user-fields-section">
                                      <p>Meeting Date and Time</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={
                                          dialogueMeetingData?.DateTimeOfMeeting
                                            ? formatDateTime(dialogueMeetingData.DateTimeOfMeeting)
                                            : "Not Yet Investigated"
                                        }
                                        readOnly
                                      /> 
                                    </div>
                                  </div>
                                  <div className="view-main-user-content-right-side">
                                    <div className="view-user-fields-section">
                                      <p>Hearing Officer</p>
                                      <input
                                        type="text"
                                        className="view-user-input-field"
                                        value={dialogueMeetingData?.HearingOfficer || "No Hearing Officer Assigned"}
                                        readOnly
                                      /> 
                                    </div>
                                  </div>
                                </div>
                                <div className="incident-bottom-section">
                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">
                                        Party A
                                      </div>
                                      <div className="box-container-partyA">
                                        <textarea className="natureoffacts-input-field" name="concern" value={dialogueMeetingData?.partyA || "No Party A Assigned"} readOnly/>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">
                                        Party B
                                      </div>
                                      <div className="box-container-partyA">
                                        <textarea className="natureoffacts-input-field" name="concern" value={dialogueMeetingData?.partyB || "No Party B Assigned"} readOnly/>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">
                                        Remarks
                                      </div>
                                      <div className="box-container-partyA">
                                        <textarea className="natureoffacts-input-field" name="concern" value={dialogueMeetingData?.remarks || "No Remarks Available"} readOnly/>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">
                                        Minutes of Dialogue
                                      </div>
                                      <div className="box-container-partyA">
                                        <textarea className="natureoffacts-input-field" name="concern" value={dialogueMeetingData?.minutesOfDialogue || "No Minutes of Dialogue Available"} readOnly/>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          {viewActiveSection  === "hearing" && (
                            <>
                              <div className="hearing-main-section">
                                {viewActiveSection === "hearing" && hearingData.length > 0 && (
                                  [...hearingData]
                                    .sort((a, b) => {
                                      const order = { First: 1, Second: 2, Third: 3 };
                                      return order[a.nos as keyof typeof order] - order[b.nos as keyof typeof order];
                                    })
                                    .map((item, index) => {
                                      const hearingFormData = hearingFormDataA(item, index, generatedSummonLetter); // Make sure you're passing summon letters
                                      return (
                                        <div className="view-incident-dialogue-content" key={index}>
                                          <div className="hearing-fullinfo-container">
                                            <div
                                              className="hearing-title-container"
                                              style={{ cursor: "pointer" }}
                                              onClick={() => toggleOpen(index)}
                                            >
                                              <div className="hearing-title">
                                                <h1>{item.nos} Hearing Details</h1>
                                              </div>
                                              <div className="hearing-button-section">
                                                <button
                                                  className="toggle-btn-hearing"
                                                  aria-label={openIndices[index] ? "Hide details" : "Show details"}
                                                >
                                                  <img
                                                    src={openIndices[index] ? "/Images/up.png" : "/Images/down.png"}
                                                    alt={openIndices[index] ? "Hide details" : "Show details"}
                                                    style={{ width: "16px", height: "16px" }}
                                                  />
                                                </button>
                                              </div>
                                            </div>

                                            <div className="view-incident-content-topsection">
                                              <div className="view-incident-content-left-side">
                                                <div className="view-incident-fields-section">
                                                  <p>Meeting Date & Time</p>
                                                  <input
                                                    type="text"
                                                    className="view-incident-input-field"
                                                    name="hearingMeetingDateTime"
                                                    value={hearingFormData.hearingMeetingDateTime || "N/A"}
                                                    readOnly
                                                  />
                                                </div>
                                              </div>

                                              <div className="view-incident-content-right-side">
                                                <div className="view-incident-fields-section">
                                                  <p>{item.nos} Hearing Officer</p>
                                                  <input
                                                    type="text"
                                                    className="view-incident-input-field"
                                                    value={getHearingOfficer(item.nos, hearingFormData)}
                                                    readOnly
                                                  />
                                                </div>
                                              </div>
                                            </div>

                                            {openIndices[index] && (
                                              <div className="view-incident-content-bottomsection">
                                                <div className="view-incident-partyA-container">
                                                  <div className="box-container-outer-natureoffacts">
                                                    <div className="title-remarks-partyA">Party A</div>
                                                    <div className="box-container-partyA">
                                                      <textarea
                                                        className="partyA-input-field"
                                                        name="partyA"
                                                        value={hearingFormData.partyA}
                                                        readOnly
                                                      />
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="view-incident-partyA-container">
                                                  <div className="box-container-outer-natureoffacts">
                                                    <div className="title-remarks-partyA">Party B</div>
                                                    <div className="box-container-partyA">
                                                      <textarea
                                                        className="partyA-input-field"
                                                        name="partyB"
                                                        value={hearingFormData.partyB}
                                                        readOnly
                                                      />
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="view-incident-partyA-container">
                                                  <div className="box-container-outer-natureoffacts">
                                                    <div className="title-remarks-partyA">Remarks</div>
                                                    <div className="box-container-partyA">
                                                      <textarea
                                                        className="partyA-input-field"
                                                        name="remarks"
                                                        value={hearingFormData.remarks}
                                                        readOnly
                                                      />
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="view-incident-partyA-container">
                                                  <div className="box-container-outer-natureoffacts">
                                                    <div className="title-remarks-partyA">Minutes of Dialogue</div>
                                                    <div className="box-container-partyA">
                                                      <textarea
                                                        className="partyA-input-field"
                                                        name="minutesOfDialogue"
                                                        value={hearingFormData.minutesOfCaseProceedings}
                                                        readOnly
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
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

          {/* Success Generate Report Popup*/}
      {showSuccessGenerateReportPopup && (
        <div className={`popup-overlay-success-generate-report show`}>
          <div className="popup-success-generate-report">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupSuccessGenerateReportMessage}</p>
          </div>
        </div>
      )}

      {/* Error Generate Report Popup*/}
      {showErrorGenerateReportPopup && (
        <div className={`popup-overlay-error-generate-report show`}>
          <div className="popup-error-generate-report">
          <img src={ "/Images/warning-1.png"} alt="icon alert" className="icon-alert" />
            <p>{popupErrorGenerateReportMessage}</p>
          </div>
        </div>
      )}


    </main>
  );
}
