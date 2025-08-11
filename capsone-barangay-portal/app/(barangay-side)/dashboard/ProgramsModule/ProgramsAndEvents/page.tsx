"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgramsModule() {
  const router = useRouter();

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

  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10;

  // Simulate fetch
  useEffect(() => {
    setTimeout(() => {
      setPrograms(dummyPrograms);
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






  return (
    <main className="programs-module-main-container">
    <div className="programs-module-section-1">
      <button 
        className="add-programs-btn"
        onClick={() => setShowAddProgramsPopup(true)}
      >
        Add New Program
      </button>
    </div>


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

                      <button
                        className="action-programs-button"
                        onClick={() => router.push(`/dashboard/ProgramsModule/ViewProgram?id=${program.id}`)}
                      >
                        <img
                          src="/Images/view.png"
                          alt="View"
                          className="action-programs-view"
                        />
                      </button>

                      <button
                        className="action-programs-button"
                        onClick={() => router.push(`/dashboard/ProgramsModule/EditProgram?id=${program.id}`)}
                      >
                        <img
                          src="/Images/edit.png"
                          alt="Edit"
                          className="action-programs-edit"
                        />
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



{showAddProgramsPopup && (
  <div className="add-programs-popup-overlay">
    <div className="add-programs-confirmation-popup">

       <h2>Add New Program</h2>

       <div className="add-programs-main-container">


          <div className="add-programs-photo-section">
           <span className="add-programs-details-label">Program Photo</span>
             <div className="add-programs-profile-container">
                  <img
                     src={"/Images/default-identificationpic.jpg"}
                     alt="Identification"
                     className="add-official-id-photo"
                  />

             </div>
              <label htmlFor="identification-file-upload" className="add-programs-upload-link">Click to Upload File</label>
          </div>

          <div className="add-programs-info-main-container">

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
                <p>Schedule of Program<span className="required">*</span></p>
                  <div className="program-schedule-container">
                    <div className="date-input-wrapper">
                      <label>Start Date</label>
                      <input type="date" className="add-programs-input-field" />
                    </div>

                    <div className="date-input-wrapper">
                      <label>End Date</label>
                      <input type="date" className="add-programs-input-field" />
                    </div>
                  </div>

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

       </div>


       <div className="programs-yesno-container">

        

       </div>


    </div>

  </div>

)}

    </main>
  );
}
