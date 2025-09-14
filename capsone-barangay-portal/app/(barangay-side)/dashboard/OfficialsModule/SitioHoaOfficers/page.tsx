"use client"

//import "@/CSS/OfficialsModuleBarangdaySide/SitioModule.css";
import "@/CSS/OfficialsModuleBarangdaySide/module.css";
import { useRouter } from "next/navigation";
import React,{useState, useEffect, useRef} from "react";
import {useSession} from "next-auth/react";
import { addDoc, collection, onSnapshot, deleteDoc, doc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";



interface NewOfficerDetails {
  id?: string;
  fullName?: string;
  email?: string;
  facebook?: string;
  position?: string;
  otherPosition?: string;
  location?: string;
  clusterSection?: string;
  otherClusterSection?: string;
  contact?: string;
  department?: string;
  image?: string;
  createdAt?: String;
  updatedAt?: String;
  createdBy?: string;
}


export default function SitioHoaOfficersModule() {
  const {data:session} = useSession();
  const user = session?.user;
  const router = useRouter();

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

  const [officersData, setOfficersData] = useState<NewOfficerDetails[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<NewOfficerDetails | null>(null);
  const handleEditClick = (id:string) => {
    router.push("/dashboard/OfficialsModule/SitioHoaOfficers/EditSitioHoaOfficer"+`?id=${id}`);
  };

  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const hasAnimatedOnce = useRef(false);
  const [newOfficerDetails, setNewOfficerDetails] = useState<NewOfficerDetails>({
      department: "SITIO",
      position: "Sitio President",
      location: "East Fairview",
      clusterSection: "SITIO KISLAP",
  });

  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdentificationFile(file);
      setIdentificationPreview(URL.createObjectURL(file)); // temporary preview
    }
  };
  useEffect(() => {
    const officersCollection = collection(db, "hoaSitioOfficers");
    const unsubscribe = onSnapshot(officersCollection, (snapshot) => {
      const data: NewOfficerDetails[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        fullName: doc.data().fullName,
        email: doc.data().email ,
        facebook: doc.data().facebook,
        position: doc.data().position,
        ...(doc.data().position === "Others" && { otherPosition: doc.data().otherPosition }),
        location: doc.data().location,
        clusterSection: doc.data().clusterSection,
        ...(doc.data().clusterSection === "Others" && { otherClusterSection: doc.data().otherClusterSection }),
        contact: doc.data().contact,
        department: doc.data().department,
        image: doc.data().image ||"/images/default-profile.png",
        createdAt: doc.data().createdAt ,
        updatedAt: doc.data().updatedAt,
        createdBy: doc.data().createdBy || "Unknown",
      }));
      setOfficersData(data);
    });
    return () => unsubscribe();

  }, []);


  console.log("Officers Data:", officersData);


  const addNewOfficer = async () => {
    if (!identificationFile) {
      alert("Please upload an identification picture.");
      return;
    }
    if(!newOfficerDetails.fullName){
      alert("Please enter the officer's full name.");
      return;
    }
    if(!newOfficerDetails.email){
      alert("Please enter the officer's email.");
      return;
    }
    if(!newOfficerDetails.facebook){
      alert("Please enter the officer's facebook link.");
      return;
    }
    if(!newOfficerDetails.position){
      alert("Please select the officer's position.");
      return;
    } 
    if(newOfficerDetails.position === "Others" && !newOfficerDetails.otherPosition){
      alert("Please specify the officer's position.");
      return;
    }
    if(!newOfficerDetails.location){
      alert("Please select the officer's location.");
      return;
    }
    if(!newOfficerDetails.clusterSection){
      alert("Please select the officer's cluster/section.");
      return;
    }
    if(newOfficerDetails.clusterSection === "Others" && !newOfficerDetails.otherClusterSection){
      alert("Please specify the officer's cluster/section.");
      return;
    }
    if(!newOfficerDetails.contact){
      alert("Please enter the officer's contact number.");
      return;
    }
    if(!newOfficerDetails.department){
      alert("Please select the officer's department.");
      return;
    }
    

    try {
      // Upload identification picture to Firebase Storage
      const storageRef = ref(storage, `hoaSitioPictures/${Date.now()}_${identificationFile.name}`);
      await uploadBytes(storageRef, identificationFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Prepare officer object with image included
      const officerData = {
        ...newOfficerDetails,
        image: imageUrl,
        createdAt: new Date().toLocaleString(),
        createdBy: user?.fullName || "Unknown",
        updatedAt: new Date().toLocaleString(),
      };

      // Save officer details to Firestore
      const officersCollection = collection(db, "hoaSitioOfficers");
      await addDoc(officersCollection, officerData);

      alert("New officer added successfully.");
      setNewOfficerDetails({});
      setIdentificationFile(null);
      setIdentificationPreview(null);
      setShowAddOOfficerPopup(false);
    } catch (error) {
      console.error("Error adding new officer: ", error);
      alert("There was an error adding the new officer. Please try again.");
    }
  };

  const deleteOfficer = async(id: string) => {
    const officerToDelete = officersData.find((officer) => officer.id === id);
    if (officerToDelete) {
      if (officerToDelete.image) {
        const imageRef = ref(storage, officerToDelete.image);
        await deleteObject(imageRef).catch((error) => {
          console.error("Error deleting image from storage: ", error);
        });
      }
      const officerDoc = deleteDoc(doc(db, "hoaSitioOfficers", id));
      officerDoc.catch((error) => {
        console.error("Error deleting officer document: ", error);
      });
    }
    
  }



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
      const openPopup = (official:NewOfficerDetails) => {
        setIsPopupOpen(true);
        setSelectedOfficer(official);

      };
  
      // Close popup
      const closePopup = () => {
        setIsPopupOpen(false);
      };
  
        // Load dummy data on first render
        useEffect(() => {
          setFilteredUser(officersData);
        }, [officersData]);


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
        {user?.position === "Admin Staff" && (
          <button 
          className="add-officers-btn add-officers-animated"
          onClick={() => setShowAddOOfficerPopup(true)}
          >
            Add New Officer
          </button>
        )}
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
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Position</th>
                <th>Department</th>
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
                    <div className="official-name">{official.fullName}</div>
                  </div>
                </td>
                  {official.position === "Others" ? (
                    <td>{official.otherPosition}</td>
                  ) : (
                    <td>{official.position}</td>
                  )}
                  <td>{official.department}</td>
                  {official.clusterSection === "Others" ? (
                    <td>{official.otherClusterSection}</td>
                  ) : (
                    <td>{official.clusterSection}</td>
                  )}
                  <td>{official.location}</td>
                  <td>{official.contact}</td>
                  <td>
                    <div className="bry-official-actions">
                      <button 
                        className="brgy-official-action-view"
                        onClick={()=> openPopup(official)}
                      >
                        <img src="/Images/view.png" alt="View"/>
                      </button>

                      {user?.position === "Admin Staff" && (
                        <>
                          <button 
                          className="brgy-official-action-edit"
                          onClick={()=>handleEditClick(official.id||"")}
                          >
                            <img src="/Images/edit.png" alt="Edit"/>
                          </button>
                            
                          <button type = "button" onClick={()=>deleteOfficer(official.id)} className="brgy-official-action-delete">
                             <img src="/Images/delete.png" alt="Delete" />
                          </button>
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
                            src={identificationPreview || "/Images/default-identificationpic.jpg"}
                            alt="Identification"
                            className="add-officer-id-photo"
                          />
                        </div>
                            
                        <label htmlFor="identification-file-upload" className="add-officer-upload-link">
                          Click to Upload File
                        </label>
                        <input
                          id="identification-file-upload"
                          type="file"
                          accept="image/*"
                          className="hidden" // hides the raw input, use the label instead
                          onChange={handleIdentificationFileChange}
                        />
                      </div>

                      <div className="add-officer-info-main-container">
                        <div className="add-officer-content-left-side">
                            <div className="fields-section">
                                <p>Officer Full Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Full  Name"
                                  value={newOfficerDetails.fullName||""}
                                  onChange={(e) => setNewOfficerDetails({...newOfficerDetails, fullName: e.target.value})}
                                  name="fullName"
                                  required
                                />
                             </div>
                            <div className="fields-section">
                                <p>Email<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Email"
                                  name="email"
                                  value={newOfficerDetails.email||""}
                                  onChange={(e) => setNewOfficerDetails({...newOfficerDetails, email: e.target.value})}
                                  required
                                />
                             </div> 

                             <div className="fields-section">
                                <p>Facebook Link<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className="add-officer-input-field"
                                  placeholder="Enter Facebook Link"
                                  value={newOfficerDetails.facebook||""}
                                  onChange={(e) => setNewOfficerDetails({...newOfficerDetails, facebook: e.target.value})}
                                  name="facebook"
                                  required
                                />
                             </div>

                             <div className="fields-section">
                              <p>Department<span className="required">*</span></p>
                              <select
                                className="add-officer-input-field"
                                name="department"
                                required
                                onChange={(e) => setNewOfficerDetails({...newOfficerDetails, department: e.target.value})}
                              >
                                <option value="" disabled>Select a Department</option>
                                <option value="SITIO">SITIO</option>
                                <option value="HOA">HOA</option>
                              
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
                              onChange={(e) => setNewOfficerDetails({...newOfficerDetails, position: e.target.value})}
                            >
                              <option value="" disabled>Position</option>
                              {newOfficerDetails.department === "SITIO" ? (
                                <>
                                  
                                  <option value="Sitio President">Sitio President</option>
                                  <option value="Sitio Officer">Sitio Officer</option>
                                </>
                              ):(
                                <>
                                  <option value="Association President">Association President</option>
                                  <option value="Association Officer">Association Officer</option>
                                </>
                              )}
                              <option value="Others">Others</option>
                              {/* not sure if pwede may ibang position*/}
                            </select>
                          </div>
                          {newOfficerDetails.position === "Others" && (
                            <div className="fields-section">
                              <p>Please Specify Position<span className="required">*</span></p>
                              <input
                                type="text"
                                className="add-officer-input-field"
                                placeholder="Enter Position"
                                value={newOfficerDetails.otherPosition||""}
                                onChange={(e) => setNewOfficerDetails({...newOfficerDetails, otherPosition: e.target.value})}
                                name="otherPosition"  
                                required
                              />
                            </div>
                          )}
                        <div className="fields-section">
                            <p>Location<span className="required">*</span></p>
                            <select
                              className="add-officer-input-field"
                              name="location"
                              required
                              onChange={(e) => setNewOfficerDetails({...newOfficerDetails, location: e.target.value})}
                            >
                              <option value="" disabled>Location</option>
                              <option value="East Fairview">East Fairview</option>
                              <option value="West Fairview">West Fairview</option>
                              <option value="South Fairview">South Fairview</option>
                            </select>
                        </div>

                        <div className="fields-section">
                                <p>Cluster/Section</p>
                                <select
                                  className="add-officer-input-field"
                                  name="clusterSection"
                                  onChange={(e) => setNewOfficerDetails({...newOfficerDetails, clusterSection: e.target.value})}
                                  required
                                >
                                  
                                  <option value="" disabled>Select Cluster/Section</option>
                                  <option value="SITIO KISLAP">SITIO KISLAP</option>
                                  <option value="URLINA">URLINA</option>
                                  <option value="EFHAI">EFHAI</option>
                                  <option value="TULIP RESIDENCES HOA">TULIP RESIDENCES HOA</option>
                                  <option value="UPPER CORVETTE HOA">UPPER CORVETTE HOA</option>
                                  <option value="WEST FAIRVEW HOA">WEST FAIRVEW HOA</option>
                                  <option value="Others">Others</option>
                                  {/* Add more options as needed */}
                                </select>
                          </div>
                          {newOfficerDetails.clusterSection === "Others" && (
                            <div className="fields-section">
                              <p>Please Specify Cluster/Section<span className="required">*</span></p>
                              <input
                                type="text"
                                className="add-officer-input-field"
                                placeholder="Enter Cluster/Section"
                                value={newOfficerDetails.otherClusterSection||""}
                                onChange={(e) => setNewOfficerDetails({...newOfficerDetails, otherClusterSection: e.target.value})}
                                name="otherClusterSection"
                                required
                              />
                            </div>
                          )}

                          <div className="fields-section">
                                      <p>Contact Number<span className="required">*</span></p>
                                      <input 
                                        type="tel" 
                                        className="add-officer-input-field"
                                        name="contact"
                                        value={newOfficerDetails.contact||""}
                                        onChange={(e) => setNewOfficerDetails({...newOfficerDetails, contact: e.target.value})}
                                        required
                                        pattern="^[0-9]{11}$" 
                                        placeholder="Enter 11-digit phone number" 
                                      />
                             </div>
                          
                        </div>
                      </div>

                    </div>

                    
                
                    {/* Buttons */}
                    <div className="officer-yesno-container">
                        <button onClick={() => {
                          setShowAddOOfficerPopup(false);
                          setNewOfficerDetails({});
                          setIdentificationFile(null);
                          setIdentificationPreview(null);
                        }} className="official-no-button">Cancel</button>
                        <button type="button" onClick={addNewOfficer} className="official-yes-button">
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
                        src={ selectedOfficer?.image|| "/Images/default-identificationpic.jpg"}
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
                              <p>Officer Full Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.fullName || ""}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Email</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.email || ""}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Facebook</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.facebook || ""}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Department</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.department || ""}
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
                                value = {selectedOfficer?.position === "Others" ? selectedOfficer?.otherPosition : selectedOfficer?.position || ""}
                                readOnly
                              /> 
                            </div>

                            <div className="view-user-fields-section">
                              <p>Location</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.location || ""}
                                readOnly
                              /> 
                            </div>

                            <div className="view-user-fields-section">
                              <p>Cluster/Section</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.clusterSection === "Others" ? selectedOfficer?.otherClusterSection : selectedOfficer?.clusterSection || ""}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Contact Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value = {selectedOfficer?.contact || ""}
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
                                  value = {selectedOfficer?.createdBy || "N/A"}
                                  readOnly
                                /> 
                            </div>
                            <div className="view-user-fields-section">
                                <p>Created At</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value = {selectedOfficer?.createdAt ? selectedOfficer.createdAt.toString() : "N/A"}
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
                                  value = {selectedOfficer?.updatedAt ? selectedOfficer.updatedAt.toString() : "N/A"}
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
