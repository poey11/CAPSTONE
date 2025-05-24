"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useRef } from "react";

export default function addVoter() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    voterNumber: "",
    lastName: "",
    firstName: "",
    middleName: "",
    homeAddress: "",
    precinctNumber: "",
    createdAt:"",
    residentId: "",
    identificationFileURL: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const employerPopupRef = useRef<HTMLDivElement>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLatestNumber = async () => {
      try {
        const voterCollection = collection(db, "VotersList");
        const q = query(voterCollection, orderBy("voterNumber", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        let newNumber = 1;
        if (!querySnapshot.empty) {
          const latestEntry = querySnapshot.docs[0].data();
          newNumber = latestEntry.voterNumber + 1;
        }

        setFormData((prevData) => ({
          ...prevData,
          voterNumber: newNumber.toString(),
        }));
      } catch (error) {
        console.error("Error fetching latest voter number:", error);
      }
    };

    fetchLatestNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  /*
  const handleSubmitClick = async () => {
    const { fullName, homeAddress} = formData;
  
    if (!fullName || !homeAddress) {

      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowErrorPopup(false);
      
    }, 3000);
    
      return;
    }
  
    setShowSubmitPopup(true);
  };*/

  const handleSubmitClick = async () => {
    const { lastName, firstName, homeAddress, precinctNumber} = formData;

    const invalidFields: string[] = [];


    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!homeAddress) invalidFields.push("homeAddress");
    if (!precinctNumber) invalidFields.push("precinctNumber");
  
    if (invalidFields.length > 0) {
      setInvalidFields(invalidFields);
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return;
    }
  
    setInvalidFields([]);
    setShowSubmitPopup(true);

  };

  const confirmSubmit = async () => {
    setShowSubmitPopup(false);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  
    if (!docId) {
      setPopupErrorMessage("Failed to create resident record.");
      setShowErrorPopup(true);
      return;
    }
    
    setPopupMessage("Voter Record added successfully!");
    setShowPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/ResidentModule/registeredVoters?highlight=${docId}`);
    }, 3000);

  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure the latest voter number is assigned
      const voterCollection = collection(db, "VotersList");
      const q = query(voterCollection, orderBy("voterNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let latestNumber = 1;
      if (!querySnapshot.empty) {
        const latestEntry = querySnapshot.docs[0].data();
        latestNumber = latestEntry.voterNumber + 1;
      }

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format


      const docRef = await addDoc(voterCollection, {
        ...formData,
        voterNumber: latestNumber,
        createdAt: currentDate,
      });
      return docRef.id; // return ID

     
    } catch (err) {
      setError("Failed to add voter");
      console.error(err);
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/registeredVoters");
  };

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentsCollection = collection(db, "Residents");
            const residentsSnapshot = await getDocs(residentsCollection);
            const residentsList = residentsSnapshot.docs.map(doc => {
                const data = doc.data() as {
                    residentNumber: string;
                    firstName: string;
                    middleName: string;
                    lastName: string;
                    address: string;
                    identificationFileURL: string
                };
    
                return {
                    id: doc.id,
                    ...data
                };
            });
    
            setResidents(residentsList);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
  
    fetchResidents();
  }, []);

  // Show popup on input focus
  const handleVotersClick = () => {
    setShowResidentsPopup(true);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employerPopupRef.current &&
        !employerPopupRef.current.contains(event.target as Node)
      ) {
        setShowResidentsPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredResidents = residents.filter((resident) =>
    `${resident.firstName} ${resident.middleName} ${resident.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  
  const [activeSection, setActiveSection] = useState("details");

  return (
    <main className="add-resident-main-container">
      {/*}
        <div className="path-section">
          <h1 className="breadcrumb">User and Roles<span className="chevron">/</span></h1>
          <h1 className="breadcrumb">
            <Link href="/dashboard/ResidentModule/registeredVoters">Registered Voters</Link>
            <span className="chevron">/</span>
          </h1>
          <h2 className="breadcrumb">Add New Voter<span className="chevron"></span></h2>
        </div>

        <div className="addresident-page-title-section-1">
        <h1>Registered Voters</h1>
        </div>*/}
        
        <div className="add-resident-main-content">
          <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> Add New Voter </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="add-voter-bottom-section">
            <div className="residents-search-section">
              <input type="text"  className="select-resident-input-field" placeholder="Select Resident" onClick={handleVotersClick} />
            </div>

            
          
              <nav className="voters-info-toggle-wrapper">
                {["details"].map((section) => (
                  <button
                    key={section}
                    type="button"
                    className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                    onClick={() => setActiveSection(section)}
                  >
                    {section === "details" && "Details"}
                  </button>
                ))}
              </nav>  
              <div className="add-resident-bottom-section-scroll">

                <form id="addVoterForm" onSubmit={handleSubmit} className="add-resident-section-2">
                {activeSection === "details" && (
                  <>
                    <div className="addvoter-outer-container">
                      <div className="addvoter-outer-container-left">

                      <div className="resident-photo-section-voter">
                        <span className="resident-details-label-voter">Identification Picture</span>

                        <div className="resident-profile-container-voter">
                          <img
                              src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                              alt="Resident"
                              className={
                                formData.identificationFileURL
                                  ? "resident-picture uploaded-picture"
                                  : "resident-picture default-picture"
                              }
                          /> 
                        </div>
                      </div>
                      </div>

                      <div className="addvoter-outer-container-right">
                        <div className="addvoter-top-details-section">
                          <div className="add-main-resident-section-2-left-side">
                            <div className="fields-section">
                              <p>Last Name<span className="required">*</span></p>
                              <input type="text"  className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`} placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} readOnly required />
                            </div>
                            <div className="fields-section">
                              <p>First Name<span className="required">*</span></p>
                              <input type="text"  className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`} placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} readOnly required />
                            </div>
                          </div>
                          <div className="add-main-resident-section-2-right-side">
                            <div className="fields-section">
                              <p>Middle Name</p>
                              <input type="text"  className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} readOnly />
                            </div>
                            <div className="fields-section">
                              <p>Home Address<span className="required">*</span></p>
                              <input type="text"  className={`add-resident-input-field ${invalidFields.includes("homeAddress") ? "input-error" : ""}`} placeholder="Enter Address" name="homeAddress" value={formData.homeAddress} onChange={handleChange} readOnly required />
                            </div>
                          </div>
                        </div>
                        <div className="add-voter-section-2-full-bottom">
                          
                            <div className="fields-section-precinct">
                              <p>Precinct Number<span className="required">*</span></p>
                              <input type="text" className={`add-voterprecinct-input-field ${invalidFields.includes("precinctNumber") ? "input-error" : ""}`} placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} required/>
                            </div>
                         
                        </div>  
                      </div>

                    

                    </div>

                    
                  

                  </>
                )}
                </form>

              </div>
              
         
          </div>
          {error && <p className="error">{error}</p>}
        </div>

      {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add-voter">
                            <div className="confirmation-popup-add-voter">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add-voter show`}>
                    <div className="popup-add-voter">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add-voter show`}>
                    <div className="popup-add-voter">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}


{showResidentsPopup && (
      <div className="kasambahay-employer-popup-overlay">
        <div className="kasambahay-employer-popup" ref={employerPopupRef}>
          <h2>Residents List</h2>
          <h1>* Please select Resident's Name *</h1>

          <input
            type="text"
            placeholder="Search Resident's Name"
            className="employer-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="employers-list">
            {residents.length === 0 ? (
              <p>No residents found.</p>
            ) : (
              <table className="employers-table">
                <thead>
                  <tr>
                    <th>Resident Number</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                  </tr>
                </thead>
                <tbody>
                {filteredResidents.map((resident) => (
            <tr
              key={resident.id}
              className="employers-table-row"
              onClick={async () => {
                try {
                  const votersSnapshot = await getDocs(collection(db, "VotersList"));
                  const isDuplicate = votersSnapshot.docs.some((doc) => {
                    const data = doc.data();
                    return (
                      data.lastName?.toLowerCase() === resident.lastName?.toLowerCase() &&
                      data.firstName?.toLowerCase() === resident.firstName?.toLowerCase() &&
                      data.middleName?.toLowerCase() === resident.middleName?.toLowerCase()
                    );
                  });

                  if (isDuplicate) {
                    setPopupErrorMessage("Resident is already in the Voter Database.");
                    setShowErrorPopup(true);
                    setTimeout(() => {
                      setShowErrorPopup(false);
                    }, 3000);
                    return;
                  }

                  // Not a duplicate, proceed to set the form
                  setFormData({
                    ...formData,
                    residentId: resident.id,
                    lastName: resident.lastName || '',
                    firstName: resident.firstName || '',
                    middleName: resident.middleName || '',
                    homeAddress: resident.address || '',
                    identificationFileURL: resident.identificationFileURL || '',
                  });
                  setShowResidentsPopup(false);
                } catch (error) {
                  console.error("Error checking for duplicates:", error);
                  setPopupErrorMessage("An error occurred. Please try again.");
                  setShowErrorPopup(true);
                  setTimeout(() => {
                    setShowErrorPopup(false);
                  }, 3000);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <td>{resident.residentNumber}</td>
              <td>{resident.firstName}</td>
              <td>{resident.middleName}</td>
              <td>{resident.lastName}</td>
            </tr>
          ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}
    </main>
  );
}
