"use client";
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllSpecificDocument, deleteDocument } from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";
import { db,storage } from "@/app/db/firebase";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";


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

  return (
    <main className="main-container-departments">
      <div className="section-1-departments">
        {isAuthorized && (
          <button className="add-announcement-btn-departments" onClick={() => router.push(`/dashboard/IncidentModule/AddIncident?departmentId=${departmentId}`)}>
          Add New Incident
          </button>
        )}
        
      </div>

      <div className="section-2-departments">
      <input
          type="text"
          className="search-bar-departments"
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

      <div className="main-section-departments">
  {currentIncidents.length === 0 ? (
    <div className="no-result-card-departments">
       <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-departments" />
      <p className="no-results-departments">No Results Found</p>
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Case Number</th>
          <th>Date & Time of the Incident</th>
          <th>Area Of Incident</th>
          <th>Nature of Complaint</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentIncidents.map((incident, index) => (
         <tr
          key={incident.id}
          className={highlightedId === incident.id ? "highlighted-row" : ""}
        >
            <td>{incident.caseNumber}</td>
            <td>{incident.dateFiled} {incident.timeFiled}</td>
            <td>{incident.areaOfIncident}</td>
            {incident.nature === "Others" ? (<td>{incident.specifyNature}</td>):(<td>{incident.nature}</td>)}
            <td>
              <span className={`status-badge-departments ${incident.status.toLowerCase().replace(" ", "-")}`}>
                {incident.status}
              </span>
            </td>
            <td>
              <div className="actions-departments-main">
                <button className="action-view-departments-main" onClick={(e) => { e.stopPropagation(); handleView(incident.id); }}><img src="/Images/view.png" alt="View" /></button>
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



<div className="redirection-section-departments">
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

    </main>
  );
}
