"use client"
import "@/CSS/OfficialsModuleBarangdaySide/module.css";
import type { Metadata } from "next";
import React,{useState, useEffect, useRef} from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import Link from 'next/link';


const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

// Dummy officials data with 11 entries
const officialsData = [
  { id: 1, name: "Juan Dela Cruz", position: "Punong Barangay", term: "2023-2026", contact: "09171234567", gender: "Male", image: "/images/CaptainImage.jpg" },
  { id: 2, name: "Maria Lopez Santos", position: "Secretary", term: "2023-2026", contact: "09182345678", gender: "Female", image: "/images/CaptainImage.jpg" },
  { id: 3, name: "Roberto Garcia", position: "Asst Secretary", term: "2023-2026", contact: "09193456789", gender: "Male", image: "/images/CaptainImage.jpg" },
  { id: 4, name: "Angela Rivera", position: "Admin Staff", term: "2023-2026", contact: "09204567890", gender: "Female", image: "/images/CaptainImage.jpg" },
  { id: 5, name: "Paulo Mendoza", position: "LF Staff", term: "2023-2026", contact: "09215678901", gender: "Male", image: "/images/CaptainImage.jpg" },
  { id: 6, name: "Catherine Cruz", position: "Admin Staff", term: "2023-2026", contact: "09226789012", gender: "Female", image: "/images/CaptainImage.jpg" },
  { id: 7, name: "Emmanuel Reyes", position: "LF Staff", term: "2023-2026", contact: "09237890123", gender: "Male", image: "/images/CaptainImage.jpg" },
  { id: 8, name: "Isabella Flores", position: "Secretary", term: "2023-2026", contact: "09248901234", gender: "Female", image: "/images/CaptainImage.jpg" },
  { id: 9, name: "Mark Villanueva", position: "Asst Secretary", term: "2023-2026", contact: "09259012345", gender: "Male", image: "/images/CaptainImage.jpg" },
  { id: 10, name: "Grace Bautista", position: "Admin Staff", term: "2023-2026", contact: "09260123456", gender: "Female", image: "/images/CaptainImage.jpg" },
  { id: 11, name: "Francis Lim", position: "LF Staff", term: "2023-2026", contact: "09271234568", gender: "Male", image: "/images/CaptainImage.jpg" },
];

export default function OfficialsModule() {

  const router = useRouter();
  const handleEditClick = () => {
    router.push("/dashboard/OfficialsModule/EditOfficial");
  };

   /* NEW UPDATED ADDED */
    const [filtersLoaded, setFiltersLoaded] = useState(false);
    const hasAnimatedOnce = useRef(false);
  
    /* NEW UPDATED ADDED */
    useEffect(() => {
      if (!hasAnimatedOnce.current) {
        hasAnimatedOnce.current = true;
        setFiltersLoaded(false);
        const timeout = setTimeout(() => {
          setFiltersLoaded(true);
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        setFiltersLoaded(true); // Always on after initial load
      }
    }, []);

      
    const [showAddOfficialPopup, setShowAddOfficialPopup] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [nameSearch, setNameSearch] = useState("");
    const [positionDropdown, setPositionDropdown] = useState("");
    const searchParams = useSearchParams();
    const [position, setPosition] = useState("");
    const [viewActiveSection, setViewActiveSection] = useState("details");
    const highlightUserId = searchParams.get("highlight");
    

    const [filteredUser, setFilteredUser] = useState<any[]>([]); 
    const [currentPage, setCurrentPage] = useState(1);
    const UserPerPage = 10; 


  // Open popup
    const openPopup = () => {
      setIsPopupOpen(true);
    };

    // Close popup
    const closePopup = () => {
      setIsPopupOpen(false);
    };

      // Load dummy data on first render
      useEffect(() => {
        setFilteredUser(officialsData);
      }, []);

   
  // Apply filter by name & position
  useEffect(() => {
    let filtered = [...officialsData];

    // Filter by name
    if (nameSearch.trim()) {
      const searchTerm = nameSearch.toLowerCase().trim();
      filtered = filtered.filter((official) =>
        official.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by position
    if (positionDropdown) {
      filtered = filtered.filter(
        (official) => official.position === positionDropdown
      );
    }

    setFilteredUser(filtered);
    setCurrentPage(1); // reset to first page on filter change
  }, [nameSearch, positionDropdown]);


    // Pagination logic
  const indexOfLastUser = currentPage * UserPerPage;
  const indexOfFirstUser = indexOfLastUser - UserPerPage;
  const currentUser = filteredUser.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUser.length / UserPerPage);

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
    <main className="brgy-officials-main-container">

      <div className="brgy-officials-section-1"> 
        <button 
          className="add-brgy-official-btn add-brgy-official-animated"
          onClick={() => setShowAddOfficialPopup(true)}
        >
          Add New Official
        </button>
      </div>
      
      <div className={`brgy-officials-section-2 ${filtersLoaded ? "filters-animated" : ""}`}>
          <input 
            type="text" 
            className="brgy-officials-filter" 
            placeholder="Enter Name" 
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        
          <select
                    className="brgy-officials-filter"
                    value={positionDropdown}
                    onChange={(e) => setPositionDropdown(e.target.value)}
                >
                    <option value="">Position</option>
                    <option value="Punong Barangay">Punong Barangay</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Assistant Secretary">Asst Secretary</option>
                    <option value="Admin Staff">Admin Staff</option>
                    <option value="LF Staff">LF Staff</option>
                </select>
      </div>
      


      <div className="brgy-officials-main-section">
        {currentUser.length === 0 ? (
          <div className="no-result-card">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Official Name</th>
                <th>Position</th>
                <th>Term Duration</th>
                <th>Contact Information</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUser.map((official) => (
                <tr key={official.id}>
                  <td>
                  <div className="official-info">
                    <div className="official-image-wrapper">
                      <img
                        src={official.image}
                        alt="Official Profile"
                        className="official-image"
                      />
                    </div>
                    <div className="official-name">{official.name}</div>
                  </div>
                </td>
                  <td>{official.position}</td>
                  <td>{official.term}</td>
                  <td>{official.contact}</td>
                  <td>
                    <div className="bry-official-actions">
                      <button 
                        className="brgy-official-action-view"
                        onClick={openPopup}
                      >
                        <img src="/Images/view.png" alt="View"/>
                      </button>

                     <button 
                      className="brgy-official-action-edit"
                      onClick={handleEditClick}
                     >
                         <img src="/Images/edit.png" alt="Edit"/>
                      </button>

                      <button className="brgy-official-action-delete">
                         <img src="/Images/delete.png" alt="Delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


    {filteredUser.length > UserPerPage && (
        <div className="redirection-section-users">
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
      )}


      {showAddOfficialPopup && (
            <div className="add-official-popup-overlay">
                <div className="add-official-confirmation-popup">
                    <h2>Add New Barangay Official</h2>

                    <div className="add-official-main-container">
                      <div className="add-official-photo-section">
                        <span className="add-official-details-label">Identification Photo</span>
                        <div className="add-official-profile-container">
                          <img
                            src={"/Images/default-identificationpic.jpg"}
                            alt="Identification"
                            className="add-official-id-photo"
                          />
                        </div>
                        <label htmlFor="identification-file-upload" className="add-official-upload-link">Click to Upload File</label>
                      </div>

                      <div className="add-official-info-main-container">
                        <div className="add-official-content-left-side">
                            <div className="fields-section">
                                <p>Last Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-official-input-field"
                                  placeholder="Enter Last Name"
                                  name="lastName"
                                  required
                                />
                             </div>
                             <div className="fields-section">
                                <p>First Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-official-input-field"
                                  placeholder="Enter First Name"
                                  name="firstName"
                                  required
                                />
                             </div>
                             <div className="fields-section">
                                <p>Middle Name</p>
                                <input
                                  type="text"
                                  className="add-official-input-field"
                                  placeholder="Enter Middle Name"
                                  name="middleName"
                                  required
                                />
                             </div>
                             <div className="fields-section">
                                      <p>Contact Number<span className="required">*</span></p>
                                      <input 
                                        type="tel" 
                                        className="add-official-input-field"
                                        name="contactNumber"
                                        pattern="^[0-9]{11}$" 
                                        placeholder="Enter 11-digit phone number" 
                                      />
                             </div>
                        </div>

                        <div className="add-official-content-right-side">
                          <div className="fields-section">
                            <p>Position<span className="required">*</span></p>
                            <select
                              className="add-official-input-field"
                              name="position"
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              required
                            >
                              <option value="">Select a Position</option>
                              <option value="Punong Barangay">Punong Barangay</option>
                              <option value="Secretary">Secretary</option>
                              <option value="Assistant Secretary">Asst Secretary</option>
                              <option value="Admin Staff">Admin Staff</option>
                              <option value="LF Staff">LF Staff</option>
                            </select>
                          </div>

                          {position === "LF Staff" && (
                            <div className="fields-section">
                              <p>
                                Department<span className="required">*</span>
                              </p>
                              <select
                                className="add-official-input-field"
                                name="department"
                                required
                              >
                                <option value="">Select a Department</option>
                                <option value="Lupon">Lupon</option>
                                <option value="GAD">GAD</option>
                                <option value="VAWC">VAWC</option>
                                <option value="BCPC">BCPC</option>
                              </select>
                            </div>
                          )}
                           <div className="fields-section">
                              <p>Term Duration<span className="required">*</span></p>
                              <input
                                type="date"
                                className="add-official-input-field"
                                name="termDuration"
                                required
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                             <div className="fields-section">
                                <p>Email Address<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-official-input-field"
                                  placeholder="Enter Email Address"
                                  name="emailAddress"
                                  required
                                />
                             </div>
                        </div>
                      </div>

                    </div>

                    
                
                    {/* Buttons */}
                    <div className="official-yesno-container">
                        <button onClick={() => setShowAddOfficialPopup(false)} className="official-no-button">Cancel</button>
                        <button className="official-yes-button">
                            Save
                        </button>
                    </div>
                </div>
            </div>
            )}




      {isPopupOpen && (
        <div className="user-roles-view-popup-overlay add-incident-animated">
          <div className="view-barangayuser-popup">
            <div className="view-user-main-section1">
                <div className="view-user-header-first-section">
                  <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
                </div>
                <div className="view-user-header-second-section">
                  <h2 className="gov-info">Republic of the Philippines</h2>
                  <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
                  <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
                  <h2 className="contact">930-0040 / 428-9030</h2>
                </div>
                <div className="view-user-header-third-section">
                  <img src="/Images/logo.png" alt="Brgy Logo" className="user-logo2-image-side-bar-1" />
                </div>
            </div>
            <div className="view-user-header-body">
              <div className="view-user-header-body-top-section">
                  <div className="view-user-backbutton-container">
                    <button onClick={closePopup}>
                      <img src="/images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident" />
                    </button>
                  </div>
                  <div className="view-resident-user-info-toggle-wrapper">
                    {["details"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`main-resident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                        onClick={() => setViewActiveSection(section)}
                      >
                        {section === "details" && "Details"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="view-user-header-body-bottom-section">
                  <div className="mainresident-photo-section">
                    <span className="user-details-label">Official Details</span>
                    <div className="user-profile-container">
                      <img
                        src={"/Images/default-identificationpic.jpg"}
                        alt="Identification"
                        className="resident-id-photo"
                      />
                    </div>
                  </div>
                  <div className="view-main-resident-info-main-container">
                    <div className="view-user-info-main-content">
                      {viewActiveSection  === "details" && (
                        <>
                          <div className="view-mainresident-content-left-side">
                            <div className="view-user-fields-section">
                              <p>Last Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>First Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Middle Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Contact Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>
                          </div>
                          <div className="view-mainresident-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Position</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>

                            {position === "LF Staff" && (
                              <div className="view-user-fields-section">
                                <p>Department</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  readOnly
                                /> 
                              </div>
                            )}

                            <div className="view-user-fields-section">
                              <p>Term Duration</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>

                            <div className="view-user-fields-section">
                              <p>Email Address</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>
                          </div>
                        </>
                      )}
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
