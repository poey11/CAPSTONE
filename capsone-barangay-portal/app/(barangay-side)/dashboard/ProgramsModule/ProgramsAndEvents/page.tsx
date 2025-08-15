"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProgramsModule() {
  const router = useRouter();

  const { data: session } = useSession();
   const user = session?.user;

  // Dummy data for programs
  const dummyPrograms = [
    {
      id: "1",
      programName: "Community Clean-up Drive",
      approvalStatus: "Approved",
      progressStatus: "Ongoing",
      activeStatus: "Active",
      dateCreated: "2025-07-20",
    },
    {
      id: "2",
      programName: "Health and Wellness Fair",
      approvalStatus: "Pending",
      progressStatus: "Upcoming",
      activeStatus: "Inactive",
      dateCreated: "2025-06-10",
    },
    {
      id: "3",
      programName: "Youth Sports Festival",
      approvalStatus: "Approved",
      progressStatus: "Completed",
      activeStatus: "Active",
      dateCreated: "2025-05-05",
    },
    {
      id: "4",
      programName: "Senior Citizen Support Program",
      approvalStatus: "Rejected",
      progressStatus: "Upcoming",
      activeStatus: "Inactive",
      dateCreated: "2025-04-12",
    },
    {
      id: "5",
      programName: "Barangay Tree Planting",
      approvalStatus: "Approved",
      progressStatus: "Ongoing",
      activeStatus: "Active",
      dateCreated: "2025-02-18",
    },
  ];


// Dummy participants data
const dummyParticipants = [
  {
    id: "1",
    fullName: "Juan Dela Cruz",
    contactNumber: "0917-123-4567",
    emailAddress: "juan.delacruz@example.com",
    location: "Barangay Fairview, Quezon City",
    programName: "Community Clean-up Drive"
  },
  {
    id: "2",
    fullName: "Maria Santos",
    contactNumber: "0922-987-6543",
    emailAddress: "maria.santos@example.com",
    location: "Barangay Fairview, Quezon City",
    programName: "Health and Wellness Fair"
  },
  {
    id: "3",
    fullName: "Pedro Ramirez",
    contactNumber: "0998-456-7890",
    emailAddress: "pedro.ramirez@example.com",
    location: "Barangay Fairview, Quezon City",
    programName: "Youth Sports Festival"
  },
];





// Load dummy data and split into main and pending
useEffect(() => {
  setTimeout(() => {
    // Separate pending and non-pending
    const pendingOnly = dummyPrograms.filter(p => p.approvalStatus === "Pending");
    const nonPendingOnly = dummyPrograms.filter(p => p.approvalStatus !== "Pending");

    // Main section will use non-pending programs
    setPrograms(nonPendingOnly);

    // Pending section will use pending ones
    setProgramsAssignedData(pendingOnly);

    // Participants
    setParticipantsListsData(dummyParticipants);

    setLoading(false);
  }, 500);
}, []);


  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSectionRedirection, setActiveSectionRedirection] = useState("main");
const [programsAssignedData, setProgramsAssignedData] = useState<any[]>([]); // similar to taskAssignedData
const [participantsListsData, setParticipantsListsData] = useState<any[]>([]);


const searchParams = useSearchParams();



  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10;

useEffect(() => {
  setTimeout(() => {
    setPrograms(dummyPrograms);
    setParticipantsListsData(dummyParticipants); 
    setLoading(false);
  }, 500);
}, []);

  
  const [searchName, setSearchName] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");


  // Filtering logic
  useEffect(() => {
    let filtered = [...programs];
    /*   let filtered = programs.filter(p => p.approvalStatus !== "Pending");*/

    if (searchName) {
      filtered = filtered.filter((p) =>
        p.programName.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (approvalFilter) {
      filtered = filtered.filter((p) => p.approvalStatus === approvalFilter);
    }

    if (progressFilter) {
      filtered = filtered.filter((p) => p.progressStatus === progressFilter);
    }

    if (activeFilter) {
      filtered = filtered.filter((p) => p.activeStatus === activeFilter);
    }

    setFilteredPrograms(filtered);
  }, [searchName, approvalFilter, progressFilter, activeFilter, programs]);

  // Pagination logic
  const indexOfLast = currentPage * programsPerPage;
  const indexOfFirst = indexOfLast - programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);

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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      setPrograms((prev) => prev.filter((program) => program.id !== id));
      alert("Program deleted successfully!");
    }
  };






   const [showAddProgramsPopup, setShowAddProgramsPopup] = useState(false);


   const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Open popup
    const openPopup = () => {
      setIsPopupOpen(true);
    };

    // Close popup
    const closePopup = () => {
      setIsPopupOpen(false);
    };

    const handleEditClick = () => {
    router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails");
  };


  const [activeSection, setActiveSection] = useState("details");




 const [filtersLoaded, setFiltersLoaded] = useState(false);
 const hasAnimatedOnce = useRef(false);
 







// On first load, ensure section param exists
useEffect(() => {
  const section = searchParams.get("section");
  if (!section) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", "main");
    router.replace(`?${params.toString()}`, { scroll: false });
  }
}, []);

{/*}
// Handle section switching
const handleSectionSwitch = (section: string) => {
  setActiveSectionRedirection(section);
  const params = new URLSearchParams(searchParams.toString());
  if (section === "main") {
    params.set("section", "main");
  } else if (section === "programs") {
    params.set("section", "programs");
  }
  router.push(`?${params.toString()}`, { scroll: false });
};
*/}


// Handle section switching
const handleSectionSwitch = (section: string) => {
  setActiveSectionRedirection(section);
  const params = new URLSearchParams(searchParams.toString());
  params.set("section", section);
  router.push(`?${params.toString()}`, { scroll: false });
};





/*
 FOR PARTICIPANTS LOGIC
*/


// Participants filtering states
const [participantNameSearch, setParticipantNameSearch] = useState("");
const [participantProgramSearch, setParticipantProgramSearch] = useState("");
const [filteredParticipants, setFilteredParticipants] = useState<any[]>([]);

// Participants pagination states
const [participantsPage, setParticipantsPage] = useState(1);
const participantsPerPage = 10;


useEffect(() => {
  let filtered = [...participantsListsData];

  if (participantNameSearch.trim()) {
    filtered = filtered.filter((p) =>
      p.fullName.toLowerCase().includes(participantNameSearch.toLowerCase())
    );
  }

  if (participantProgramSearch.trim()) {
    filtered = filtered.filter((p) =>
      p.programName.toLowerCase().includes(participantProgramSearch.toLowerCase())
    );
  }

  setFilteredParticipants(filtered);
  setParticipantsPage(1); // Reset page when filtering
}, [participantNameSearch, participantProgramSearch, participantsListsData]);


const indexOfLastParticipant = participantsPage * participantsPerPage;
const indexOfFirstParticipant = indexOfLastParticipant - participantsPerPage;
const currentParticipants = filteredParticipants.slice(indexOfFirstParticipant, indexOfLastParticipant);

const participantsTotalPages = Math.ceil(filteredParticipants.length / participantsPerPage);

const paginateParticipants = (pageNumber: number) => setParticipantsPage(pageNumber);
const nextParticipantsPage = () =>
  setParticipantsPage((prev) => (prev < participantsTotalPages ? prev + 1 : prev));
const prevParticipantsPage = () =>
  setParticipantsPage((prev) => (prev > 1 ? prev - 1 : prev));






// Load dummy data and split into main and pending
useEffect(() => {
  setTimeout(() => {
    // Separate pending and non-pending
    const pendingOnly = dummyPrograms.filter(p => p.approvalStatus === "Pending");
    const nonPendingOnly = dummyPrograms.filter(p => p.approvalStatus !== "Pending");

    // Main section will use non-pending programs
    setPrograms(nonPendingOnly);

    // Pending section will use pending ones
    setProgramsAssignedData(pendingOnly);

    // Participants
    setParticipantsListsData(dummyParticipants);

    setLoading(false);
  }, 500);
}, []);








/*
For Participants Logic
*/



// Pagination states for PENDING PROGRAMS
const [pendingProgramsPage, setPendingProgramsPage] = useState(1);
const pendingProgramsPerPage = 10;


{/*}
// Load dummy data and filter pending ones
useEffect(() => {
  setTimeout(() => {
    setPrograms(dummyPrograms);
    setParticipantsListsData(dummyParticipants);

    // Only pending programs
    const pendingOnly = dummyPrograms.filter(p => p.approvalStatus === "Pending");
    setProgramsAssignedData(pendingOnly);

    setLoading(false);
  }, 500);
}, []);


*/}

// Pending programs filter logic
const [pendingSearchName, setPendingSearchName] = useState("");
const [pendingApprovalFilter, setPendingApprovalFilter] = useState("");
const [pendingProgressFilter, setPendingProgressFilter] = useState("");
const [pendingActiveFilter, setPendingActiveFilter] = useState("");
const [filteredPendingPrograms, setFilteredPendingPrograms] = useState<any[]>([]);

useEffect(() => {
  let filtered = [...programsAssignedData];
  if (pendingSearchName) {
    filtered = filtered.filter(p =>
      p.programName.toLowerCase().includes(pendingSearchName.toLowerCase())
    );
  }
  if (pendingApprovalFilter) {
    filtered = filtered.filter(p => p.approvalStatus === pendingApprovalFilter);
  }
  if (pendingProgressFilter) {
    filtered = filtered.filter(p => p.progressStatus === pendingProgressFilter);
  }
  if (pendingActiveFilter) {
    filtered = filtered.filter(p => p.activeStatus === pendingActiveFilter);
  }
  setFilteredPendingPrograms(filtered);
}, [
  pendingSearchName,
  pendingApprovalFilter,
  pendingProgressFilter,
  pendingActiveFilter,
  programsAssignedData
]);

// Pending programs pagination logic
const indexOfLastPending = pendingProgramsPage * pendingProgramsPerPage;
const indexOfFirstPending = indexOfLastPending - pendingProgramsPerPage;
const currentPendingPrograms = filteredPendingPrograms.slice(indexOfFirstPending, indexOfLastPending);
const pendingTotalPages = Math.ceil(filteredPendingPrograms.length / pendingProgramsPerPage);

const paginatePending = (pageNumber: number) => setPendingProgramsPage(pageNumber);
const nextPendingPage = () =>
  setPendingProgramsPage(prev => (prev < pendingTotalPages ? prev + 1 : prev));
const prevPendingPage = () =>
  setPendingProgramsPage(prev => (prev > 1 ? prev - 1 : prev));



  return (
    <main className="programs-module-main-container">



    <div className="programs-module-section-1">

    <div className="center-wrapper">
      <div
        className={`pending-program-info-toggle-wrapper ${
          user?.position === "Assistant Secretary" ? "with-add-request" : ""
        }`}
      >
        {["main", "programs", "participants"].map((section) => (
          <button
            key={section}
            type="button"
            className={`info-toggle-btn-pending-program assigned-tasks ${
              activeSectionRedirection === section ? "active" : ""
            }`}
            onClick={() => handleSectionSwitch(section)}
          >
            {section === "main" && "All Programs"}
            {section === "programs" && (
              <>
                <span className="badge-container">
                  Pending Programs
                  {programsAssignedData.length > 0 && (
                    <span className="task-badge">{programsAssignedData.length}</span>
                  )}
                </span>
              </>
            )}
            {section === "participants" && (
              <>
                <span className="badge-container">
                  Pending Participants
                  {participantsListsData.length > 0 && (
                    <span className="task-badge">{participantsListsData.length}</span>
                  )}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>


    



<div className="section-add-program">
    <button 
        className="add-programs-btn"
        onClick={() => setShowAddProgramsPopup(true)}
      >
        Add New Program
      </button>

    </div>

</div>

 {activeSectionRedirection === "main" && (
      <>

      <div className="programs-module-section-2">
        <input
          type="text"
          className="programs-module-filter"
          placeholder="Search by Program Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <select
          className="programs-module-filter"
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
        >
          <option value="">All Approval Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          className="programs-module-filter"
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value)}
        >
          <option value="">All Progress Status</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          className="programs-module-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All Active/Inactive</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>



      </div>

      <div className="programs-module-main-section">
        {loading ? (
          <p>Loading programs...</p>
        ) : currentPrograms.length === 0 ? (
          <div className="no-result-card-programs">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
            <p className="no-results-programs">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Date Created</th>
                <th>Approval Status</th>
                <th>Progress Status</th>
                <th>Active/Inactive</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPrograms.map((program) => (
                <tr key={program.id}>
                  <td>{program.programName}</td>
                  <td>{program.dateCreated}</td>
                  <td>
                            <span
                    className={`status-badge-programs ${program.approvalStatus
                      .toLowerCase()
                      .replace(/\s*-\s*/g, "-")}`}
                  >
                    <p>{program.approvalStatus}</p>
                  </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge-programs ${program.progressStatus
                        .toLowerCase()
                        .replace(/\s*-\s*/g, "-")}`}
                    >
                      <p>{program.progressStatus}</p>
                    </span>
                  </td>                  
                  <td>
                    <span
                      className={`status-badge-programs ${program.activeStatus
                        .toLowerCase()
                        .replace(/\s*-\s*/g, "-")}`}
                    >
                      <p>{program.activeStatus}</p>
                    </span>
                  </td>
  
                  <td>
                    <div className="actions-programs">

                    {/*}
                      <button
                        className="action-programs-button"
                        onClick={openPopup}
                      >
                        <img
                          src="/Images/view.png"
                          alt="View"
                          className="action-programs-view"
                          
                        />
                      </button>

                      */}
                      

                      <button
                        className="action-programs-button"
                        onClick={handleEditClick}
                      >
                        <img
                          src="/Images/edit.png"
                          alt="Edit"
                          className="action-programs-edit"
                        />
                      </button>

                            <button
                        className="action-programs-button"
                      >

                        <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                      </button>


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="redirection-section">
        <button onClick={prevPage} disabled={currentPage === 1}>
          &laquo;
        </button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === "number" && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </div>
         </>
        )}



        
    {activeSectionRedirection === "participants" && (
      <>

{activeSectionRedirection === "participants" && (
  <>

<div className="programs-module-section-2">
  <input
    type="text"
    className="programs-module-filter"
    placeholder="Search by Full Name"
    value={participantNameSearch}
    onChange={(e) => setParticipantNameSearch(e.target.value)}
  />
  <input
    type="text"
    className="programs-module-filter"
    placeholder="Search by Program Name"
    value={participantProgramSearch}
    onChange={(e) => setParticipantProgramSearch(e.target.value)}
  />
</div>



    <div className="programs-module-main-section">
      {loading ? (
        <p>Loading participants...</p>
      ) : currentParticipants.length === 0 ? (
        <div className="no-result-card-programs">
          <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
          <p className="no-results-programs">No Results Found</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Program Name</th>
              <th>Contact Number</th>
              <th>Email Address</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentParticipants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.fullName}</td>
                <td>{participant.programName}</td>
                <td>{participant.contactNumber}</td>
                <td>{participant.emailAddress}</td>
                <td>{participant.location}</td>
                <td>
                  <div className="actions-programs">
                    <button className="action-programs-button">
                      <img src="/Images/edit.png" alt="Edit" className="action-programs-edit" />
                    </button>
                    <button className="action-programs-button">
                      <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      )}
    </div>
  </>
)}


    <div className="redirection-section">
        <button onClick={prevParticipantsPage} disabled={participantsPage === 1}>
          &laquo;
        </button>
        {Array.from({ length: participantsTotalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => paginateParticipants(num)}
            className={participantsPage === num ? "active" : ""}
          >
            {num}
          </button>
        ))}
        <button
          onClick={nextParticipantsPage}
          disabled={participantsPage === participantsTotalPages}
        >
          &raquo;
        </button>
      </div>
      </>
     )}



    {activeSectionRedirection === "programs" && (
      <>

      
    <div className="programs-module-section-2">
      <input
        type="text"
        className="programs-module-filter"
        placeholder="Search by Program Name"
        value={pendingSearchName}
        onChange={(e) => setPendingSearchName(e.target.value)}
      />
      <select
        className="programs-module-filter"
        value={pendingApprovalFilter}
        onChange={(e) => setPendingApprovalFilter(e.target.value)}
      >
        <option value="">All Approval Status</option>
        <option value="Pending">Pending</option>
      </select>
      <select
        className="programs-module-filter"
        value={pendingProgressFilter}
        onChange={(e) => setPendingProgressFilter(e.target.value)}
      >
        <option value="">All Progress Status</option>
        <option value="Ongoing">Ongoing</option>
        <option value="Upcoming">Upcoming</option>
        <option value="Completed">Completed</option>
      </select>
      <select
        className="programs-module-filter"
        value={pendingActiveFilter}
        onChange={(e) => setPendingActiveFilter(e.target.value)}
      >
        <option value="">All Active/Inactive</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

       <div className="programs-module-main-section">
        {loading ? (
          <p>Loading programs...</p>
        ) : currentPendingPrograms.length === 0 ? (
          <div className="no-result-card-programs">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
            <p className="no-results-programs">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Date Created</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPendingPrograms.map((program) => (
                <tr key={program.id}>
                  <td>{program.programName}</td>
                  <td>{program.dateCreated}</td>
                  <td>
                            <span
                    className={`status-badge-programs ${program.approvalStatus
                      .toLowerCase()
                      .replace(/\s*-\s*/g, "-")}`}
                  >
                    <p>{program.approvalStatus}</p>
                  </span>
                  </td>


  
                  <td>
                    <div className="actions-programs">

                    {/*}
                      <button
                        className="action-programs-button"
                        onClick={openPopup}
                      >
                        <img
                          src="/Images/view.png"
                          alt="View"
                          className="action-programs-view"
                          
                        />
                      </button>

                      */}
                      

                      <button
                        className="action-programs-button"
                        onClick={handleEditClick}
                      >
                        <img
                          src="/Images/edit.png"
                          alt="Edit"
                          className="action-programs-edit"
                        />
                      </button>

                            <button
                        className="action-programs-button"
                      >

                        <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                      </button>


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    <div className="redirection-section">
      <button onClick={prevPendingPage} disabled={pendingProgramsPage === 1}> &laquo; </button>
      {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => paginatePending(num)}
          className={pendingProgramsPage === num ? "active" : ""}
        >
          {num}
        </button>
      ))}
      <button onClick={nextPendingPage} disabled={pendingProgramsPage === pendingTotalPages}> &raquo; </button>
    </div>


      </>
     )}




{showAddProgramsPopup && (
  <div className="add-programs-popup-overlay">
    <div className="add-programs-confirmation-popup">

       <h2>Add New Program</h2>
       

       <div className="add-programs-main-container">

        
           {activeSection === "details" && (
              <>


          <div className="add-programs-photo-section">
           <span className="add-programs-details-label"> Photo </span>
             <div className="add-programs-profile-container">
                  <img
                     src={"/Images/thumbnail.png"}
                     alt="Identification"
                     className="add-program-photo"
                  />

             </div>
              <label htmlFor="identification-file-upload" className="add-programs-upload-link">Click to Upload File</label>
          </div>

          <div className="add-programs-info-main-container">

                <nav className="program-info-toggle-wrapper">
                  {["details", "reqs"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "details" && "Details"}
                      {section === "reqs" && "Requirements"}
                    </button>
                  ))}
                </nav>

           <div className="add-programs-upper-section">
            <div className="add-programs-content-left-side">
              <div className="fields-section-add-programs">
                <p>Program Name<span className="required">*</span></p>
                  <input
                  type="text"
                  className="add-programs-input-field"
                  placeholder="Program Name (E.g. Feeding Program)"
                  />
              </div>

              <div className="fields-section-add-programs">
                <p>Number of Participants<span className="required">*</span></p>
                <input
                  type="number"
                  min="1"
                  className="add-programs-input-field"
                  placeholder="E.g. 50"
                />
              </div>

            <div className="fields-section-add-programs">
              <p>Eligible Participants<span className="required">*</span></p>
              <select className="add-programs-input-field">
                <option value="">Select requirement</option>
                <option value="resident">Resident</option>
                <option value="non-resident">Non-Resident</option>
                <option value="both">Both</option>
              </select>
            </div>

            </div>

            <div className="add-programs-content-right-side">
               <div className="fields-section-add-programs">
                  <p>Location<span className="required">*</span></p>
                    <input
                    type="text"
                    className="add-programs-input-field"
                    placeholder="Location (E.g. Baragay Hall)"
                    />
                </div>


              <div className="fields-section-add-programs">
                  <p>Program Start Date<span className="required">*</span></p>
                    <input
                    type="date"
                    className="add-programs-input-field"
                    />
                </div>

                <div className="fields-section-add-programs">
                  <p>Program End Date<span className="required">*</span></p>
                    <input
                    type="date"
                    className="add-programs-input-field"
                    />
                </div>

            </div>
            
            </div> 


            <div className="add-programs-lower-section">
                                    <div className="programs-description-container">
                                      <div className="box-container-outer-description">
                                          <div className="title-description-programs">
                                              Description of Program
                                          </div>
                                          <div className="box-container-description">
                                            <textarea className="description-input-field" />
                                          </div>
                                      </div>
                                    </div>

            </div>
            
          </div>
                                  </>
                      )}


         {activeSection === "reqs" && (
              <>

          <div className="add-programs-info-main-container">

                <nav className="program-info-toggle-wrapper">
                  {["details", "reqs"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "details" && "Details"}
                      {section === "reqs" && "Requirements"}
                    </button>
                  ))}
                </nav>




            
          </div>

              </>
           )}


       </div>
       


       <div className="programs-yesno-container">
             <button onClick={() => setShowAddProgramsPopup(false)} className="program-no-button">Cancel</button>
                     <button className="program-yes-button">
                     Save
                </button>

       </div>


    </div>

  </div>

)}

  {isPopupOpen && (
    <div className="user-roles-view-popup-overlay add-incident-animated">
      <div className="view-barangayuser-popup">

      </div>
    </div>
  )}





    </main>
  );
}
