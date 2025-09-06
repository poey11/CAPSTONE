"use client"

//import "@/CSS/OfficialsModuleBarangdaySide/SitioModule.css";
import "@/CSS/OfficialsModuleBarangdaySide/module.css";
import type { Metadata } from "next";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import React,{useState, useEffect, useRef} from "react";


const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

// Dummy officials data with 11 entries
const officersData = [
  { id: 1, name: "Mr. Faustino Madriaga", position: "Association President", contact: "09171234567", gender: "Male", location: "East Fairview", clusterSection: "Falcon HOA", image: "/Images/CaptainImage.jpg" },
  { id: 2, name: "Mr. Jun Palatan", position: "Association President", contact: "09182345678", gender: "Male", location: "West Fairview", clusterSection: "RINA SAMAFA", image: "/Images/CaptainImage.jpg" },
  { id: 3, name: "Mr. Nestor Torsiende", position: "Association President", contact: "09193456789", gender: "Male", location: "South Fairview", clusterSection: "Colt HOA", image: "/Images/CaptainImage.jpg" },
  { id: 4, name: "Mr. Ronald Bas", position: "Association President", contact: "09204567890", gender: "Male", location: "East Fairview", clusterSection: "Falcon HOA", image: "/Images/CaptainImage.jpg" },
  { id: 5, name: "Mr. Ronald Bas", position: "Association President", contact: "09215678901", gender: "Male", location: "South Fairview", clusterSection: "RINA SAMAFA", image: "/Images/CaptainImage.jpg" },
  { id: 6, name: "Ms. Linda Gagasa", position: "Association President", contact: "09226789012", gender: "Female", location: "West Fairview", clusterSection: "Colt HOA", image: "/Images/CaptainImage.jpg" },
  { id: 7, name: "Mr. Enrique Sumugba", position: "Association President", contact: "09237890123", gender: "Male", location: "East Fairview", clusterSection: "Falcon HOA", image: "/Images/CaptainImage.jpg" },
  { id: 8, name: "Mr. Francis Camacho", position: "Association President", contact: "09248901234", gender: "Male", location: "South Fairview", clusterSection: "RINA SAMAFA", image: "/Images/CaptainImage.jpg" },
  { id: 9, name: "Mr. Enrico Testa", position: "Association President", contact: "09259012345", gender: "Male", location: "West Fairview", clusterSection: "Colt HOA", image: "/Images/CaptainImage.jpg" },
  { id: 10, name: "Mr. Nonong Paggabao", position: "Association President", contact: "09260123456", gender: "Male", location: "East Fairview", clusterSection: "Falcon HOA", image: "/Images/CaptainImage.jpg" },
  { id: 11, name: "Ms. Nenita Ong", position: "Association President", contact: "09271234568", gender: "Female", location: "South Fairview", clusterSection: "RINA SAMAFA", image: "/images/CaptainImage.jpg" },
  { id: 12, name: "Dr. Leo Ceno", position: "Association President", contact: "09282345679", gender: "Male", location: "West Fairview", clusterSection: "Colt HOA", image: "/Images/CaptainImage.jpg" },
  { id: 13, name: "Ms. Veronica Pagayatan", position: "Association President", contact: "09293456780", gender: "Female", location: "East Fairview", clusterSection: "Falcon HOA", image: "/Images/CaptainImage.jpg" },
  { id: 14, name: "Ms. Daisy Barcelon", position: "Association President", contact: "09304567891", gender: "Female", location: "South Fairview", clusterSection: "RINA SAMAFA", image: "/Images/CaptainImage.jpg" },
  { id: 15, name: "Mr. Edevico T. De Mayo Jr", position: "Association President", contact: "09315678902", gender: "Male", location: "West Fairview", clusterSection: "Colt HOA", image: "/Images/CaptainImage.jpg" }
];

export default function SitioHoaOfficersModule() {

  const [nameSearch, setNameSearch] = useState("");
  const [title, setTitle] = useState("");
  const [positionDropdown, setPositionDropdown] = useState("");
  const [locationDropdown, setLocationDropdown] = useState("");
  const [showAddOfficerPopup, setShowAddOOfficerPopup] = useState(false);
  const [viewActiveSection, setViewActiveSection] = useState("details");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [filteredUser, setFilteredUser] = useState<any[]>([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const UserPerPage = 10; 

  const router = useRouter();
  const handleEditClick = () => {
    router.push("/dashboard/OfficialsModule/SitioHoaOfficers/EditSitioHoaOfficer");
  };

  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const hasAnimatedOnce = useRef(false);

  useEffect(() => {
    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      setFiltersLoaded(false);
      const timeout = setTimeout(() => {
        setFiltersLoaded(true);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setFiltersLoaded(true); 
    }
  }, []);

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
          setFilteredUser(officersData);
        }, []);


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

    <main className="officiers-main-container">
      <div className="officers-section-1"> 
        <button 
          className="add-officers-btn add-officers-animated"
          onClick={() => setShowAddOOfficerPopup(true)}
        >
          Add New Officer
        </button>
      </div>

      <div className={`officers-section-2 ${filtersLoaded ? "filters-animated" : ""}`}>
          <input 
            type="text" 
            className="officers-filter" 
            placeholder="Enter Name" 
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        
          <select
            className="officers-filter"
            value={positionDropdown}
            onChange={(e) => setPositionDropdown(e.target.value)}
          >
            <option value="">Position</option>
            <option value="Association President">Association President</option>
            {/* not sure if pwede may ibang position*/}
          </select>

          <select
            className="officers-filter"
            value={locationDropdown}
            onChange={(e) => setLocationDropdown(e.target.value)}
          >
            <option value="">Location</option>
            <option value="East Fairview">East Fairview</option>
            <option value="West Fairview">West Fairview</option>
            <option value="South Fairview">South Fairview</option>
          </select>
      </div>

      <div className="officers-main-section">
        {currentUser.length === 0 ? (
          <div className="no-result-card">
            <img src="/Images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Position</th>
                <th>Cluster/Section</th>
                <th>Location</th>
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
                  <td>{official.clusterSection}</td>
                  <td>{official.location}</td>
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


        {showAddOfficerPopup && (
            <div className="add-officer-popup-overlay">
                <div className="add-officer-confirmation-popup">
                    <h2>Add New Officer</h2>

                    <div className="add-officer-main-container">
                      <div className="add-officer-photo-section">
                        <span className="add-officer-details-label">Identification Picture</span>
                        <div className="add-officer-profile-container">
                          <img
                            src={"/Images/default-identificationpic.jpg"}
                            alt="Identification"
                            className="add-officer-id-photo"
                          />
                        </div>
                        <label htmlFor="identification-file-upload" className="add-officer-upload-link">Click to Upload File</label>
                      </div>

                      <div className="add-officer-info-main-container">
                        <div className="add-officer-content-left-side">
                            <div className="fields-section">
                                <p>Last Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Last Name"
                                  name="lastName"
                                  required
                                />
                             </div>
                             <div className="fields-section">
                                <p>First Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter First Name"
                                  name="firstName"
                                  required
                                />
                             </div>
                             <div className="fields-section">
                                <p>Middle Name</p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Middle Name"
                                  name="middleName"
                                  required
                                />
                             </div>

                             <div className="fields-section">
                              <p>Title<span className="required">*</span></p>
                              <select
                                className="add-officer-input-field"
                                name="position"
                                required
                                onChange={(e) => setTitle(e.target.value)}
                              >
                                <option value="">Select a Title</option>
                                <option value="Ms.">Ms.</option>
                                <option value="Mr.">Mr.</option>
                              
                              </select>
                            </div>
                        </div>

                        <div className="add-officer-content-right-side">
                          <div className="fields-section">
                            <p>Position<span className="required">*</span></p>
                            <select
                              className="add-officer-input-field"
                              name="position"
                              required
                            >
                              <option value="">Position</option>
                              <option value="Association President">Association President</option>
                              {/* not sure if pwede may ibang position*/}
                            </select>
                          </div>
                        <div className="fields-section">
                            <p>Location<span className="required">*</span></p>
                            <select
                              className="add-officer-input-field"
                              name="position"
                              required
                            >
                              <option value="">Location</option>
                              <option value="East Fairview">East Fairview</option>
                              <option value="West Fairview">West Fairview</option>
                              <option value="South Fairview">South Fairview</option>
                            </select>
                        </div>

                        <div className="fields-section">
                                <p>Cluster/Section</p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Middle Name"
                                  name="middleName"
                                  required
                                />
                          </div>

                          <div className="fields-section">
                                      <p>Contact Number<span className="required">*</span></p>
                                      <input 
                                        type="tel" 
                                        className="add-officer-input-field"
                                        name="contactNumber"
                                        pattern="^[0-9]{11}$" 
                                        placeholder="Enter 11-digit phone number" 
                                      />
                             </div>
                          
                        </div>
                      </div>

                    </div>

                    
                
                    {/* Buttons */}
                    <div className="officer-yesno-container">
                        <button onClick={() => setShowAddOOfficerPopup(false)} className="official-no-button">Cancel</button>
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
                  <img src="/Images/QCLogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
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
                      <img src="/Images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident" />
                    </button>
                  </div>
                  <div className="view-resident-user-info-toggle-wrapper">
                    {["details", "history"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`main-resident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                        onClick={() => setViewActiveSection(section)}
                      >
                        {section === "details" && "Details"}
                        {section === "history" && "History"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="view-user-header-body-bottom-section">
                  <div className="mainresident-photo-section">
                    <span className="user-details-label">Officer Details</span>
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
                              <p>Title</p>
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

                            <div className="view-user-fields-section">
                              <p>Location</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                readOnly
                              /> 
                            </div>

                            <div className="view-user-fields-section">
                              <p>Cluster/Section</p>
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
                        </>
                      )}
                    {viewActiveSection  === "history" && (
                        <>
                          <div className="view-mainresident-content-left-side">
                            <div className="view-user-fields-section">
                                <p>Created By</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  readOnly
                                /> 
                            </div>
                            <div className="view-user-fields-section">
                                <p>Created At</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  readOnly
                                /> 
                            </div>
                          </div>
                          <div className="view-mainresident-content-right-side">
                            <div className="view-user-fields-section">
                                <p>Updated By</p>
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
