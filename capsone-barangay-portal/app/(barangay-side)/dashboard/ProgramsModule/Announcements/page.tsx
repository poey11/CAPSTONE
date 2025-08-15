"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgramsModule() {
  const router = useRouter();


// Dummy data for announcements
const dummyAnnouncements = [
  {
    id: "1",
    announcementHeadline: "Barangay Clean-up Drive This Saturday",
    featuredInAnnouncements: "Inactive",
    publishedDate: "2025-07-25",
    createdBy: "Admin Staff",
  },
  {
    id: "2",
    announcementHeadline: "Free Health Check-up for Residents",
    featuredInAnnouncements: "Inactive",
    publishedDate: "2025-06-15",
    createdBy: "Barangay Secretary",
  },
  {
    id: "3",
    announcementHeadline: "Youth Sports Fest Registration Now Open",
    featuredInAnnouncements: "Inactive",
    publishedDate: "2025-05-10",
    createdBy: "Barangay Treasurer",
  },
  {
    id: "4",
    announcementHeadline: "Senior Citizen Monthly Gathering",
    featuredInAnnouncements: "Inactive",
    publishedDate: "2025-04-20",
    createdBy: "Lupon Staff",
  },
  {
    id: "5",
    announcementHeadline: "Tree Planting Activity Next Week",
    featuredInAnnouncements: "Inactive",
    publishedDate: "2025-02-22",
    createdBy: "Punong Barangay",
  },
];


  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const announcementsPerPage = 10;

  // Simulate fetch
  useEffect(() => {
    setTimeout(() => {
      setAnnouncements(dummyAnnouncements);
      setLoading(false);
    }, 500);
  }, []);

  
  const [searchName, setSearchName] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");


  // Filtering logic
  useEffect(() => {
    let filtered = [...announcements];

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

    setFilteredAnnouncements(filtered);
  }, [searchName, approvalFilter, progressFilter, activeFilter, announcements]);

  // Pagination logic
  const indexOfLast = currentPage * announcementsPerPage;
  const indexOfFirst = indexOfLast - announcementsPerPage;
  const currentAnnouncements = filteredAnnouncements.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAnnouncements.length / announcementsPerPage);

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
      setAnnouncements((prev) => prev.filter((announcements) => announcements.id !== id));
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



  return (
    <main className="programs-module-main-container">
    <div className="programs-module-section-1">
      <button 
        className="add-programs-btn"
        onClick={() => setShowAddProgramsPopup(true)}
      >
        Add New Announcement
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
        ) : currentAnnouncements.length === 0 ? (
          <div className="no-result-card-programs">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
            <p className="no-results-programs">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Headline</th>
                <th>Published Date</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAnnouncements.map((announcement) => (
                <tr key={announcement.id}>
                  <td>{announcement.announcementHeadline}</td>
                  <td>{announcement.publishedDate}</td>              
                  <td>
                    <span
                      className={`status-badge-programs ${announcement.featuredInAnnouncements
                        .toLowerCase()
                        .replace(/\s*-\s*/g, "-")}`}
                    >
                      <p>{announcement.featuredInAnnouncements}</p>
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
