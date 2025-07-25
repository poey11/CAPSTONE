"use client";
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import { useState, useEffect, useRef} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllSpecificDocument, deleteDocument, generateDownloadLink} from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";
import { db,storage } from "@/app/db/firebase";
import { collection, onSnapshot, orderBy, query, where, getDocs, doc, getDoc} from "firebase/firestore";


const statusOptions = ["Pending", "CFA", "Settled", "Archived"];

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
  
  const hasAnimatedOnce = useRef(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const [hasDialogue, setHasDialogue] = useState(false);
  const [hasHearing, setHasHearing] = useState(false);
  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [dialogueMeetingData, setDialogueMeetingData] = useState<any | null>(null);
  const [hearingData, setHearingData] = useState<any[]>([]);
  const [generatedSummonLetter, setGeneratedSummonLetter] = useState<any[]>([]);



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


  // Filter by case number segment
  if (caseNumberSearch) {
    filtered = filtered.filter((incident) => {
      const segments = incident.caseNumber?.split(" - ");
      const lastSegment = segments?.[2]?.trim();
      return lastSegment?.includes(caseNumberSearch.trim());
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

  
  setCurrentPage(1);

  setFilteredIncidents(filtered);
}, [incidentData, selectedStatus, showCount, sortOrder, caseNumberSearch, incidentType, selectedNature]);


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
          className="search-bar-departments"  /* edited this class*/
          placeholder="Enter Case Number (e.g. 0001)"
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
                    <span className={`status-badge-departments ${incident.status.toLowerCase().replace(" ", "-")}`}>
                      <p>{incident.status}</p>
                    </span>
                  </td>
                  <td>
                    <div className="actions-departments-main">
                      <button className="action-view-departments-main" onClick={() => openPopup(incident)}>
                        <img src="/Images/view.png" alt="View" />
                      </button>
                      {isAuthorized && (
                        <>
                        {incident.status !== "settled" && incident.status !== "CFA" && (
                          <button className="action-edit-departments-main" onClick={(e) => { e.stopPropagation(); handleEdit(incident.id); }}> <img src="/Images/edit.png" alt="Edit" /></button>
                        )}
                          <button className="action-delete-departments-main" onClick={(e) => { e.stopPropagation(); handleDeleteClick(incident.id, incident.caseNumber); }}><img src="/Images/delete.png" alt="Delete" /></button>
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
              <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
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
                      <img src="/images/left-arrow.png" alt="Left Arrow" className="incident-back-btn" />
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
                              <p className={`view-incident-status-badge-view ${selectedIncident?.status?.toLowerCase().replace(" ", "-")}`}>
                                {selectedIncident?.status}
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

    </main>
  );
}
