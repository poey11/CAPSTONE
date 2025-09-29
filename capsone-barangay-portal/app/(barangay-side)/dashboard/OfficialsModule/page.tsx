"use client"
import "@/CSS/OfficialsModuleBarangdaySide/module.css";
import type { Metadata } from "next";
import React,{useState, useEffect, useRef} from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { collection, onSnapshot, addDoc, deleteDoc, doc} from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "@firebase/storage";
import { off } from "process";

interface Official {
  id: string;
  name: string;
  position: string;
  term: string;
  contact: string;
  image?: string;
  email?: string;
  facebook?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  department?: string;
}


export default function OfficialsModule() {
  const [officialsData, setOfficialsData] = useState<Official[]>([]);
  const [filteredOfficials, setFilteredOfficials] = useState<Official[]>([]);
  const [displayedOfficials, setDisplayedOfficials] = useState<Official[]>([]);
  const [selectedNewOfficial, setSelectedNewOfficial] = useState<Official|null>();
  const [manualNewOfficial, setManualNewOfficial] = useState<Official|null>();
  const [takenPositions, setTakenPositions] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const user = session?.user?.position;
  const [position, setPosition] = useState("");
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const positionsList = [
    "Punong Barangay",
    "Secretary",
    "Assistant Secretary",
    "Barangay Administrator",
    "Barangay Treasurer",
    "Kasamabahay Assistance Desk",
    "Solo Parent Desk",
    "BDRRMO",
    "BADAC Focal Person",
    "GAD Focal Person",
    "VAWC Focal Person",
    "BCPC Focal Person",
    "Medical Assistance",
    "ASH Desk",
    "PWD Massage & Therapeutic Center",
    "BHERT",
    "BSPO, EX-O",
    "Clean & Green Department",
    "Land & Housing Department",
    "Sports & Cultural Development",
    "OFW Assistance Desk"
  ];

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdentificationFile(file);
      setIdentificationPreview(URL.createObjectURL(file)); // temporary preview
    }
  };

  const router = useRouter();
  const handleEditClick = (id:string) => {
    router.push("/dashboard/OfficialsModule/EditOfficial"+`?id=${id}`);
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

    
    useEffect(() => {
      const docRef = collection(db, "BarangayUsers");
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
      
        const data: Official[] = snapshot.docs.map((doc) => ({
          
          id: doc.id,
          name: [doc.data().firstName, doc.data().middleName, doc.data().lastName]
            .filter(Boolean) // removes null, undefined, and empty strings
            .join(" "),
          position: doc.data().position === "LF Staff"
              ? `${doc.data().position} (${doc.data().department || "N/A"})`
              : doc.data().position || "N/A",          
          
          ...(doc.data().position === "LF Staff" && { department: doc.data().department || "N/A" }),
          term: doc.data().term || "N/A",
          contact: doc.data().phone,
          image: doc.data().image || "/images/default-profile.png",
          email: doc.data().email || "N/A",
          createdBy: doc.data().createdBy || "N/A",
          createdAt: doc.data().createdAt,
          updatedBy: doc.data().updatedBy || "N/A",
          facebook: doc.data().facebook || "N/A",
        }));
        setOfficialsData(data);
      });
      return () => unsubscribe();
    },[])

    useEffect(() => {
      if( position === "GAD Focal Person" || position === "VAWC Focal Person"|| position === "BCPC Focal Person" ){
        let temp = ""
        if(position === "GAD Focal Person" ) temp = "GAD";
        else if(position === "VAWC Focal Person" ) temp = "VAWC";
        else if(position === "BCPC Focal Person" ) temp = "BCPC";
        let data = [...officialsData];
        data = data.filter((official) => official.position.includes("LF Staff") && official.department === temp );
        
        setFilteredOfficials(data);
        return;
      }
      else{
        if(position === "Barangay Administrator" ){
          let data = [...officialsData];
          data = data.filter((official) => official.position ===  "Admin Staff" );
          setFilteredOfficials(data);
          return;
        }
        
        let data = [...officialsData];
        data = data.filter((official) => official.position === position);
        setFilteredOfficials(data);
      }

    },[position,officialsData ])

  

useEffect(() => {
  const docRef = collection(db, "DisplayedOfficials");
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    const data: Official[] = snapshot.docs.map((doc) => {
      const rawPosition = doc.data().position || "N/A";
      return {
        id: doc.id,
        name: doc.data().name,
        position: rawPosition === "LF Staff"
          ? `${rawPosition} (${doc.data().department || "N/A"})`
          : rawPosition,
        term: doc.data().term || "N/A",
        contact: doc.data().contact,
        image: doc.data().image || "/images/default-profile.png",
        email: doc.data().email || "N/A",
        createdBy: doc.data().createdBy || "N/A",
        createdAt: doc.data().createdAt,
        updatedBy: doc.data().updatedBy || "N/A",
        facebook: doc.data().facebook || "N/A",
      };
    });
    setDisplayedOfficials(data);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  // Normalize LF Staff back to just "LF Staff" for taken positions
  const positions = new Set(
    displayedOfficials.map((official) => {
      if (official.position.startsWith("LF Staff")) {
        return "LF Staff";
      }
      return official.position;
    })
  );
  setTakenPositions(positions);
}, [displayedOfficials]);

useEffect(() => {
  if (!takenPositions.size) return;

  const nextAvailable = positionsList.find(
    (pos) => !takenPositions.has(pos)
  );

  // Case 1: No position yet → pick the highest available
  if (!position && nextAvailable) {
    setPosition(nextAvailable);
    return;
  }

  // Case 2: Current position got taken/deleted → reassign
  if (position && takenPositions.has(position) && nextAvailable) {
    setPosition(nextAvailable);
  }
}, [takenPositions, position]);



    console.log(officialsData);



// --- STATE HOOKS ---
const [showSubmitPopup, setShowSubmitPopup] = useState(false);
const [showErrorPopup, setShowErrorPopup] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState("");
const [invalidFields, setInvalidFields] = useState<string[]>([]);


const validateAndConfirm = () => {
  const newInvalidFields: string[] = [];

  // ✅ Check if identification file uploaded
  if (!identificationFile) newInvalidFields.push("identificationFile");

  // ✅ Check if official details are selected/entered
  const officialToAdd = selectedNewOfficial || manualNewOfficial;

  if (!officialToAdd) {
    setErrorMessage("Please select or enter an official to add.");
    setInvalidFields(["name", "facebook", "contact", "term", "email"]);
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }

    //  Phone number validation (must start with 09 + 9 digits = 11 total)
  const phoneRegex = /^09\d{9}$/;
  if (officialToAdd.contact && !phoneRegex.test(officialToAdd.contact)) {
    setInvalidFields(["contact"]);
    setErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }

  //  Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (officialToAdd.email && !emailRegex.test(officialToAdd.email)) {
    setInvalidFields(["email"]);
    setErrorMessage("Invalid email address. Format: example@domain.com");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }

  

  if (!officialToAdd.name) newInvalidFields.push("name");
  if (!officialToAdd.facebook) newInvalidFields.push("facebook");
  if (!officialToAdd.contact) newInvalidFields.push("contact");
  if (!officialToAdd.term) newInvalidFields.push("term");
  if (!officialToAdd.email) newInvalidFields.push("email");





  if (newInvalidFields.length > 0) {
    setInvalidFields(newInvalidFields);
    setErrorMessage("Please fill in all required fields.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }







  // ✅ If all good, show confirmation popup
  setInvalidFields([]);
  setShowSubmitPopup(true);
};



const addNewOfficer = async () => {
  try {
    const officialToAdd = selectedNewOfficial || manualNewOfficial;

    // ✅ Upload identification file to Firebase
    const storageRef = ref(storage, `DisplayedOfficials/${Date.now()}_${identificationFile!.name}`);
    await uploadBytes(storageRef, identificationFile!);
    const imageUrl = await getDownloadURL(storageRef);

    // ✅ Format the term into "YYYY - YYYY+3"
    let termFormatted = "N/A";
    if (officialToAdd?.term) {
      const startYear = new Date(officialToAdd.term).getFullYear();
      const endYear = startYear + 3;
      termFormatted = `${startYear} - ${endYear}`;
    }

    const newOfficialData = {
      name: officialToAdd?.name || "N/A",
      contact: officialToAdd?.contact || "N/A",
      term: termFormatted,
      email: officialToAdd?.email || "N/A",
      facebook: officialToAdd?.facebook || "N/A",
      position: position,
      image: imageUrl || "/images/default-profile.png",
      createdBy: session?.user.fullName || "Unknown",
      createdAt: new Date().toLocaleString(),
    };

    console.log("Official To Add:", officialToAdd);
    console.log("New Official Data:", newOfficialData);

    // ✅ Save to Firestore
    const docRef = collection(db, "DisplayedOfficials");
    await addDoc(docRef, newOfficialData);


    setShowSubmitPopup(false);

    // ✅ Success popup
       setPopupMessage("Barangay Official created successfully!");
    setShowPopup(true); // ✅ success popup
    setTimeout(() => setShowPopup(false), 2000);
   
   
   
   
    setShowAddOfficialPopup(false);
    setIdentificationFile(null);
    setIdentificationPreview(null);
    setSelectedNewOfficial(null);
    setManualNewOfficial(null);

  } catch (error) {
    console.error("Error adding document: ", error);
    setErrorMessage("Something went wrong while adding the official.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
  }
};


const [showDeletePopup, setShowDeletePopup] = useState(false);
const [officerToDeleteId, setOfficerToDeleteId] = useState<string | null>(null);
const [officerToDeleteName, setOfficerToDeleteName] = useState<string | null>(null);


  // --- DELETE LOGIC WITH POPUP ---
const confirmDeleteOfficer = (id: string, name: string) => {
  setOfficerToDeleteId(id);
  setOfficerToDeleteName(name);
  setShowDeletePopup(true);
};

const deleteOfficer = async () => {
  if (!officerToDeleteId) return;
  try {
    const officerToDelete = displayedOfficials.find((officer) => officer.id === officerToDeleteId);
    if (officerToDelete && officerToDelete.image) {
      const imageRef = ref(storage, officerToDelete.image);
      await deleteObject(imageRef);
    }
    await deleteDoc(doc(db, "DisplayedOfficials", officerToDeleteId));

    // Success popup
    setPopupMessage("Barangay Official deleted successfully!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  } catch (error) {
    console.error("Error deleting document: ", error);
    setErrorMessage("Something went wrong while deleting the official.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
  } finally {
    setShowDeletePopup(false);
    setOfficerToDeleteId(null);
  }
};

    const [showAddOfficialPopup, setShowAddOfficialPopup] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [nameSearch, setNameSearch] = useState("");
    const [positionDropdown, setPositionDropdown] = useState("");
    const searchParams = useSearchParams();
    const [viewActiveSection, setViewActiveSection] = useState("details");
    const highlightUserId = searchParams.get("highlight");
      

    const [filteredUser, setFilteredUser] = useState<any[]>([]); 
    const [currentPage, setCurrentPage] = useState(1);
    const UserPerPage = 10; 

    const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  // Open popup
    const openPopup = (i:any) => {
      setIsPopupOpen(true);
      setSelectedOfficial(i);
    };

    // Close popup
    const closePopup = () => {
      setIsPopupOpen(false);
    };

      // Load dummy data on first render
      useEffect(() => {
        setFilteredUser(displayedOfficials);
      }, [displayedOfficials]);

   
  // Apply filter by name & position
  useEffect(() => {
    let filtered = [...displayedOfficials];

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
  }, [nameSearch, positionDropdown, displayedOfficials]);


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

  console.log("Filtered Officials:", filteredUser); 
  console.log("Current Page Officials:", currentUser);



  return (
    <main className="brgy-officials-main-container">
      {(user === "Admin Staff" || user === "Assistant Secretary" || user === "Secretary" )&& (
        <div className="brgy-officials-section-1"> 
          <button 
            className="add-brgy-official-btn add-brgy-official-animated"
            onClick={() => setShowAddOfficialPopup(true)}
          >
            Add New Official
          </button>
        </div>
      )}
      
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
                    <option value="Assistant Secretary">Assistant Secretary</option> 
                    <option value="Barangay Treasurer">Barangay Treasurer</option>
                    <option value="Barangay Administrator">Barangay Administrator</option>
                    <option value="Kasamabahay Assistance Desk">Kasamabahay Assistance Desk</option>
                    <option value="Solo Parent Desk">Solo Parent Desk</option>
                    <option value="BDRRMO">BDRRMO</option>
                    <option value="BADAC Focal Person">BADAC Focal Person</option>
                    <option value="GAD Focal Person">GAD Focal Person</option>
                    <option value="VAWC Focal Person">VAWC Focal Person</option>
                    <option value="BCPC Focal Person">BCPC Focal Person</option>
                    <option value="Medical Assistance">Medical Assistance</option>
                    <option value="ASH Desk">ASH Desk </option>
                    <option value="ASH Desk">PWD Massage & Therapeutic Center</option>
                    <option value="BHERT">BHERT</option>
                    <option value="BSPO, EX-O">BSPO, EX-O</option>
                    <option value="Clean & Green Department">Clean & Green Department</option>
                    <option value="Land & Housing Department">Land & Housing Department</option>
                    <option value="Sports & Cultural Development">Sports & Cultural Development</option>
                    <option value="OFW Assistance Desk">OFW Assistance Desk</option>
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
                          src={official.image || "/Images/default-identificationpic.jpg"}
                          alt="Official Profile"
                          className="official-image"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/Images/default-identificationpic.jpg";
                          }}
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
                        onClick={() => openPopup(official)}
                      >
                        <img src="/Images/view.png" alt="View"/>
                      </button>
                      {(user === "Admin Staff" || user === "Assistant Secretary" || user === "Secretary" )&& (
                        <>
                          <button 
                            className="brgy-official-action-edit"
                            onClick={()=>handleEditClick(official.id)}
                           >
                            <img src="/Images/edit.png" alt="Edit"/>
                          </button>
                            <button
                              onClick={() => confirmDeleteOfficer(official.id, official.name)}
                              className="brgy-official-action-delete"
                            >
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


      <div className="redirection-section-users" >
        <button onClick={prevPage} disabled={currentPage === 1}>
          &laquo;
        </button>
        {getPageNumbers().map((number: any, index: number) => (
          <button key={index} onClick={() => typeof number === "number" && paginate(number)} className={currentPage === number ? "active" : ""}>
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </div>





{showDeletePopup && (
  <div className="confirmation-popup-overlay-module-barangay-official">
    <div className="confirmation-popup-module-barangay-official">
      <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
      <p>Are you sure you want to delete this Barangay Official?</p>
     <h2>Official Name: {officerToDeleteName}</h2>
      <div className="yesno-container-module-barangay-official">
        <button
          onClick={() => setShowDeletePopup(false)}
          className="no-button-module-barangay-official"
        >
          No
        </button>
        <button
          onClick={deleteOfficer}
          className="yes-button-module-barangay-official"
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}



            {showSubmitPopup && (
                <div className="addbrgyofficial-confirmation-popup-overlay">
                         <div className="addbrgyofficial-confirmation-popup">
                          <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                           <p>Are you sure you want to submit?</p>
                             <div className="barangay-official-yesno-container">
                              <button onClick={() => setShowSubmitPopup(false)} className="addbrgyofficial-no-button">No</button>
                           <button onClick={addNewOfficer} className="addbrgyofficial-yes-button">Yes</button> 
                       </div> 
                    </div>
               </div>
           )}

        
            {showPopup && (
                <div className={`barangay-official-popup-overlay show`}>
                    <div className="barangay-official-popup">
                     <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                     <p>{popupMessage}</p>
                </div>
            </div>
            )}


                    
        {showErrorPopup && (
                <div className={`addbrgyofficial-error-popup-overlay show`}>
                    <div className="barangay-official-popup">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{errorMessage}</p>
                    </div>
                </div>
                )}



      {showAddOfficialPopup && (
            <div className="add-official-popup-overlay">
                <div className="add-official-confirmation-popup">
                    <h2>Add New Barangay Official</h2>

                    <div className="add-official-main-container">
                      {/* ✅ Identification Picture */}
                      <div className="add-official-photo-section">
                        <span className="add-official-details-label">Identification Picture</span>
                        <div
                          className={`add-official-profile-container ${
                            invalidFields.includes("identificationFile") ? "input-error" : ""
                          }`}
                        >
                          <img
                            src={identificationPreview || "/Images/default-identificationpic.jpg"}
                            alt="Identification"
                            className="add-official-id-photo"
                          />
                        </div>
                        <label htmlFor="identification-file-upload" className="add-official-upload-link">
                          Click to Upload File
                        </label>
                        <input
                          className="hidden"
                          type="file"
                          id="identification-file-upload"
                          accept="image/*"
                          onChange={handleIdentificationFileChange}
                        />
                      </div>

                      <div className="add-official-info-main-container">
                        <div className="add-official-content-left-side">
                          {(position === "Punong Barangay" ||
                            position === "Secretary" ||
                            position === "Assistant Secretary" ||
                            position === "Barangay Administrator" ||
                            position === "GAD Focal Person" ||
                            position === "VAWC Focal Person" ||
                            position === "BCPC Focal Person") && (
                            <>
                              <div className="fields-section">
                                <p>Select an Official <span className="required">*</span></p>
                                <select
                                  className={`add-official-input-field ${invalidFields.includes("officialId") ? "input-error" : ""}`}
                                  name="officialId"
                                  value={selectedNewOfficial ? selectedNewOfficial.id : ""}
                                  onChange={(e) => {
                                    const official = filteredOfficials.find(o => o.id === e.target.value);
                                    setSelectedNewOfficial(official);
                                  }}
                                  required
                                >
                                  <option value="" disabled>Select an Official</option>
                                  {filteredOfficials.map((official) => (
                                    <option key={official.id} value={official.id}>
                                      {official.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}

                          {/* ✅ Full Name */}
                          <div className="fields-section">
                            <p>Full Name<span className="required">*</span></p>
                            <input
                              type="text"
                              className={`add-official-input-field ${invalidFields.includes("name") ? "input-error" : ""}`}
                              placeholder="Enter Full Name"
                              name="name"
                              required
                              value={selectedNewOfficial?.name || manualNewOfficial?.name || ""}
                              readOnly={!!selectedNewOfficial}
                              onChange={(e) => {
                                if (selectedNewOfficial) {
                                  setSelectedNewOfficial({ ...selectedNewOfficial, name: e.target.value });
                                } else {
                                  setManualNewOfficial({ ...manualNewOfficial, name: e.target.value } as Official);
                                }
                              }}
                            />
                          </div>

                          {/* ✅ Facebook */}
                          <div className="fields-section">
                            <p>Facebook<span className="required">*</span></p>
                            <input
                              type="text"
                              className={`add-official-input-field ${invalidFields.includes("facebook") ? "input-error" : ""}`}
                              placeholder="Enter Facebook Link"
                              name="facebook"
                              required
                              value={selectedNewOfficial?.facebook || manualNewOfficial?.facebook || ""}
                              readOnly={!!selectedNewOfficial}
                              onChange={(e) => {
                                if (selectedNewOfficial) {
                                  setSelectedNewOfficial({ ...selectedNewOfficial, facebook: e.target.value });
                                } else {
                                  setManualNewOfficial({ ...manualNewOfficial, facebook: e.target.value } as Official);
                                }
                              }}
                            />
                          </div>

                          {/* ✅ Contact */}
                          <div className="fields-section">
                            <p>Contact Number<span className="required">*</span></p>
                            <input
                              type="tel"
                              className={`add-official-input-field ${invalidFields.includes("contact") ? "input-error" : ""}`}
                              name="contact"
                              pattern="^[0-9]{11}$"
                              placeholder="Enter 11-digit phone number"
                              required
                              value={selectedNewOfficial?.contact || manualNewOfficial?.contact || ""}
                              readOnly={!!selectedNewOfficial}
                              onChange={(e) => {
                                if (selectedNewOfficial) {
                                  setSelectedNewOfficial({ ...selectedNewOfficial, contact: e.target.value });
                                } else {
                                  setManualNewOfficial({ ...manualNewOfficial, contact: e.target.value } as Official);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="add-official-content-right-side">
                          {/* ✅ Position */}
                          <div className="fields-section">
                            <p>Position<span className="required">*</span></p>
                            <select
                              className={`add-official-input-field ${invalidFields.includes("position") ? "input-error" : ""}`}
                              name="position"
                              value={position}
                              onChange={(e) => {
                                setPosition(e.target.value);
                                setSelectedNewOfficial(null);
                                setManualNewOfficial(null);
                              }}
                              required
                            >
                              <option value="" disabled>Select a Position</option>
                              {positionsList.map((pos) => (
                                <option key={pos} value={pos} disabled={takenPositions.has(pos)}>
                                  {pos}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* ✅ Term */}
                          <div className="fields-section">
                            <p>Term Duration<span className="required">*</span></p>
                            <input
                              type="date"
                              className={`add-official-input-field ${invalidFields.includes("term") ? "input-error" : ""}`}
                              name="term"
                              required
                              min={new Date().toISOString().split("T")[0]}
                              value={selectedNewOfficial?.term || manualNewOfficial?.term || ""}
                              readOnly={!!selectedNewOfficial}
                              onChange={(e) => {
                                if (selectedNewOfficial) {
                                  setSelectedNewOfficial({ ...selectedNewOfficial, term: e.target.value });
                                } else {
                                  setManualNewOfficial({ ...manualNewOfficial, term: e.target.value } as Official);
                                }
                              }}
                            />
                          </div>

                          {/* ✅ Email */}
                          <div className="fields-section">
                            <p>Email Address<span className="required">*</span></p>
                            <input
                              type="text"
                              className={`add-official-input-field ${invalidFields.includes("email") ? "input-error" : ""}`}
                              placeholder="Enter Email Address"
                              name="email"
                              required
                              value={selectedNewOfficial?.email || manualNewOfficial?.email || ""}
                              readOnly={!!selectedNewOfficial}
                              onChange={(e) => {
                                if (selectedNewOfficial) {
                                  setSelectedNewOfficial({ ...selectedNewOfficial, email: e.target.value });
                                } else {
                                  setManualNewOfficial({ ...manualNewOfficial, email: e.target.value } as Official);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>


                    
                
                    {/* Buttons */}
                    <div className="official-yesno-container">
                        <button type="button" onClick={() => {
                          setShowAddOfficialPopup(false)
                           setIdentificationFile(null);
                          setIdentificationPreview(null);
                          setSelectedNewOfficial(null);
                          setManualNewOfficial(null);
                        }

                        } className="official-no-button">Cancel</button>
                        <button type= "button" onClick={()=>{
                        validateAndConfirm()
                         

                        }} className="official-yes-button">
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
                    <span className="user-details-label">Official Details</span>
                    <div className="user-profile-container">
                      <img
                        src={selectedOfficial?.image || "/Images/default-identificationpic.jpg"}
                        alt="Identification"
                        className="resident-id-photo"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/Images/default-identificationpic.jpg";
                          }}
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
                                value={selectedOfficial?.name.split(" ").length === 3
                                  ? selectedOfficial.name.split(" ")[2] // last name
                                  : selectedOfficial?.name.split(" ")[1] 
                                  || "" // last name if no middle name 
                                }
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>First Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedOfficial?.name.split(" ")[0] || ""}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Middle Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={
                                     selectedOfficial?.name.split(" ").length === 3
                                       ? selectedOfficial.name.split(" ")[1] // middle name
                                       : "N/A"
                                   }                                
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Contact Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedOfficial?.contact || ""}
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
                                value={selectedOfficial?.position || ""}
                                readOnly
                              /> 
                            </div>

                            {selectedOfficial?.position?.includes("LF Staff") && (
                              <div className="view-user-fields-section">
                                <p>Department</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedOfficial?.position?.match(/\(([^)]+)\)/)?.[1] || ""}
                                  readOnly
                                /> 
                              </div>
                            )}

                            <div className="view-user-fields-section">
                              <p>Term Duration</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedOfficial?.term || ""}
                                readOnly
                              /> 
                            </div>

                            <div className="view-user-fields-section">
                              <p>Email Address</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedOfficial?.email || ""}
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
                                  value={selectedOfficial?.createdBy || ""}
                                  readOnly
                                /> 
                            </div>
                            <div className="view-user-fields-section">
                                <p>Created At</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedOfficial?.createdAt || ""}
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
                                  value={selectedOfficial?.updatedBy || ""}
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
