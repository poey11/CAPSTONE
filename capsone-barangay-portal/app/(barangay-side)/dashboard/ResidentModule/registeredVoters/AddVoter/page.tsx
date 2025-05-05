"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function addVoter() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    voterNumber: "",
    fullName: "",
    homeAddress: "",
    precinctNumber: "",
    createdAt:"",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

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
    const { fullName, homeAddress} = formData;

    const invalidFields: string[] = [];


    if (!fullName) invalidFields.push("fullName");
    if (!homeAddress) invalidFields.push("homeAddress");
  
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

  return (
    <main className="add-resident-main-container">
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
        </div>
        
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

          <hr/>


        <form id="addVoterForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">

            <div className="fields-container">
              <div className="fields-section">
                <p>Full Name <span className="required">*</span></p>
                <input type="text"  className={`add-resident-input-field ${invalidFields.includes("fullName") ? "input-error" : ""}`} placeholder="Enter Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Home Address <span className="required">*</span></p>
                <input type="text"  className={`add-resident-input-field ${invalidFields.includes("homeAddress") ? "input-error" : ""}`} placeholder="Enter Address" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />
              </div>
              
              <div className="fields-section">
                <p>Precinct Number</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
    </main>
  );
}
