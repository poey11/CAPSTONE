"use client";
import "@/CSS/AnnouncementsBrgy/Announcements.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementModule() {
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
  const [activeFilter, setActiveFilter] = useState("");
  const [searchHeadline, setSearchHeadline] = useState("");
const [searchDate, setSearchDate] = useState("");


useEffect(() => {
  let filtered = [...announcements];

  // Headline filter
  if (searchHeadline) {
    filtered = filtered.filter((a) =>
      a.announcementHeadline.toLowerCase().includes(searchHeadline.toLowerCase())
    );
  }

  // Published date filter
  if (searchDate) {
    filtered = filtered.filter((a) => a.publishedDate === searchDate);
  }

  // Active/Inactive filter
  if (activeFilter) {
    filtered = filtered.filter(
      (a) => a.featuredInAnnouncements.toLowerCase() === activeFilter.toLowerCase()
    );
  }

  setFilteredAnnouncements(filtered);
}, [searchHeadline, searchDate, activeFilter, announcements]);

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






   const [showAddAnnouncementPopup, setShowAddAnnouncementPopup] = useState(false);


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
    router.push("/dashboard/ProgramsModule/Announcements/AnnouncementDetails");
  };


  const [activeSection, setActiveSection] = useState("details");



  return (
    <main className="announcement-main-container">
    <div className="announcement-module-section-1">
      <button 
        className="add-announcement-btn"
        onClick={() => setShowAddAnnouncementPopup(true)}
      >
        Add New Announcement
      </button>

    </div>


      <div className="announcement-module-section-2">  
    <input
                type="text"
                className="announcement-module-filter"
                placeholder="Search by Headline"
                value={searchHeadline}
                onChange={(e) => setSearchHeadline(e.target.value)}
            />

            {/* Published Date filter */}
            <input
                type="date"
                className="announcement-module-filter"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
            />

            {/* Active/Inactive filter */}
            <select
                className="announcement-module-filter"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
            >
                <option value="">All Active/Inactive</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>


      </div>

      <div className="announcements-module-main-section">
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
                    <div className="actions-announcements">

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
                        className="action-announcements-button"
                        onClick={handleEditClick}
                      >
                        <img
                          src="/Images/edit.png"
                          alt="Edit"
                          className="action-announcements-edit"
                        />
                      </button>

                            <button
                        className="action-announcements-button"
                      >

                        <img src="/Images/delete.png" alt="Delete" className="action-announcements-delete" />
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



{showAddAnnouncementPopup && (
  <div className="add-announcements-popup-overlay">
    <div className="add-announcements-confirmation-popup">

       <h2>Add New Announcement</h2>
       

       <div className="add-announcements-main-container">

        
    


          <div className="add-announcements-photo-section">
           <span className="add-announcements-details-label"> Photo </span>
             <div className="add-announcements-profile-container">
                  <img
                     src={"/Images/thumbnail.png"}
                     alt="Identification"
                     className="add-announcements-photo"
                  />

             </div>
              <label htmlFor="identification-file-upload" className="add-announcements-upload-link">Click to Upload File</label>
          </div>

          <div className="add-announcements-info-main-container">



           <div className="add-announcements-upper-section">
            <div className="add-announcements-content-left-side">
              <div className="fields-section-add-announcements">
                <p>Program Headline<span className="required">*</span></p>
                  <input
                  type="text"
                  className="add-announcements-input-field"
                  placeholder="Program Name (E.g. Feeding Program)"
                  />
              </div>

           <div className="fields-section-add-announcements">
              <p>Announcement Category<span className="required">*</span></p>
              <select className="add-announcements-input-field">
                <option value="">Choose Category</option>
                <option value="">Public Advisory</option>
                <option value="">Emergency</option>
                <option value="">Barangay Event</option>
              </select>
            </div>





            </div>

            <div className="add-announcements-content-right-side">

{/*}
                <div className="fields-section-add-announcements">
                <label className="switch-label">
                    Featured in Announcements
                    <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                    </label>
                </label>
                </div>
*/}


              <div className="fields-section-add-announcements">
                  <p> Published Date <span className="required">*</span></p>
                    <input
                    type="date"
                    className="add-announcements-input-field"
                    />
                </div>

             <div className="fields-section-add-announcements">
                <p>Author<span className="required">*</span></p>
                  <input
                  type="text"
                  className="add-announcements-input-field"
                  />
              </div>



            </div>
            
            </div> 


            <div className="add-announcements-lower-section">
                                    <div className="announcements-description-container">
                                      <div className="box-container-outer-description-announcements">
                                          <div className="title-description-announcements">
                                              Full Content / Description
                                          </div>
                                          <div className="box-container-description-announcements">
                                            <textarea className="description-input-field-announcements" />
                                          </div>
                                      </div>
                                    </div>

            </div>
            
          </div>


       </div>
       


       <div className="announcement-yesno-container">
             <button onClick={() => setShowAddAnnouncementPopup(false)} className="announcement-no-button">Cancel</button>
                     <button className="announcement-yes-button">
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
