"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useState } from "react";


export default function EditResident() {

    const [activeSection, setActiveSection] = useState("details");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [position, setPosition] = useState("");
    const [identificationFile, setIdentificationFile] = useState<File | null>(null);
    const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
      const [showRejectPopup, setShowRejectPopup] = useState(false); 
  const [loading, setLoading] = useState(false); 

    const handleBack = () => {
      window.location.href = "/dashboard/OfficialsModule";
    };

    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }



      const handleRejectClick = () => {
    setShowRejectPopup(true); 
  };

    const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIdentificationFile(file);
        setIdentificationPreview(URL.createObjectURL(file));
    }

};

    return (
        <main className="edit-program-main-container" >



        
                {showRejectPopup && (
                  <div className="reasonfor-recject-popup-overlay">
                    <div className="reasonfor-reject-confirmation-popup">
                      <h2>Reject Request</h2>

                      <form  className="reject-container" >
                        <div className="box-container-outer-reasonforreject">
                          <div className="title-remarks-reasonforreject">Reason For Reject</div>
                          <div className="box-container-reasonforreject">
                            <textarea
                              className="reasonforreject-input-field"
                              name="reason"
                              id="reason"
                             placeholder="Enter the reason for rejecting the program (e.g., overlaps with another event, insufficient budget allocation, safety concerns)..."

                            />
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="reject-reason-yesno-container">
                          <button type="button" onClick={() => setShowRejectPopup(false)} className="reject-reason-no-button">
                            Cancel
                          </button>
                          <button type="submit" className="reject-reason-yes-button" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}



            <div className="program-redirectionpage-section">

                   <button className="program-redirection-buttons" onClick={handleRejectClick}>
                        <div className="program-redirection-icons-section" >
                             <img src="/images/rejected.png" alt="user info" className="program-redirection-icons-info" />
                             </div>
                         <h1>Reject Request</h1>
                    </button>



                <button className="program-redirection-buttons">
                        <div className="program-redirection-icons-section">
                            <img src="/images/generatedoc.png" alt="user info" className="program-redirection-icons-info" />
                             </div>
                         <h1>Approve Request</h1>
                    </button>



            </div>

            <div className="edit-program-main-content">
              <div className="edit-program-main-section1">
                    <div className="edit-program-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                            </button>

                            <h1> Edit Program Details </h1>
                    </div>

                    <div className="action-btn-section-program">
                            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                            <button className="action-save">
                                Save
                            </button>

                    </div>

                </div>


                <div className="edit-program-bottom-section">

                    <nav className="edit-program-info-toggle-wrapper">
                        {["details", "others"].map((section) => (
                            <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "details" && "Details"}
                                {section === "others" && "Others"}
                            </button>
                        ))}
                    </nav>


                    <div className="edit-program-bottom-section-scroll">
                         <form  className="edit-program-section-2">
                       
                        {activeSection === "details" && (
                           <>

                           <div className="edit-programs-upper-section">
                                <div className="edit-program-section-2-left-side">
                                <div className="fields-section-edit-programs">
                                    <p>Program Name<span className="required">*</span></p>
                                        <input
                                        type="text"
                                        className="edit-programs-input-field"
                                        placeholder="Program Name (E.g. Feeding Program)"
                                        />
                                </div>

                                <div className="fields-section-edit-programs">
                                    <p>Number of Participants<span className="required">*</span></p>
                                        <input
                                         type="number"
                                          min="1"
                                        className="edit-programs-input-field"
                                         placeholder="E.g. 50"
                                        />
                                </div>


                                <div className="fields-section-edit-programs">
                                    <p>Eligible Participants<span className="required">*</span></p>
                                <select className="edit-programs-input-field">
                                    <option value="">Select requirement</option>
                                    <option value="resident">Resident</option>
                                    <option value="non-resident">Non-Resident</option>
                                    <option value="both">Both</option>
                                </select>
                                </div>
                                    
                                </div>

                            <div className="edit-program-section-2-right-side">
                              <div className="fields-section-edit-programs">
                                    <p>Location<span className="required">*</span></p>
                                        <input
                                        type="text"
                                        className="edit-programs-input-field"
                                         placeholder="Location (E.g. Baragay Hall)"
                                    />
                                </div>

                                <div className="fields-section-edit-programs">
                                     <p>Schedule of Program<span className="required">*</span></p>

                                <div className="edit-program-schedule-container">
                                    <div className="edit-date-input-wrapper">
                                    <label>Start Date</label>
                                    <input type="date" className="edit-programs-input-field" />
                                    </div>

                                    <div className="edit-date-input-wrapper">
                                    <label>End Date</label>
                                    <input type="date" className="edit-programs-input-field" />
                                    </div>
                                </div>


                                </div>
                                    
                                    
                                </div>

                           </div>



                           </> 
                          )}

                        {activeSection === "others" && (
                            <>


                            <div className="edit-programs-upper-section">

                                <div className="edit-program-section-2-left-side">

                                <div className="edit-programs-description-container">
                                      <div className="edit-box-container-outer-description">
                                          <div className="edit-title-description-programs">
                                              Description of Program
                                          </div>
                                          <div className="edit-box-container-description">
                                            <textarea className="eeditdescription-input-field" />
                                          </div>
                                      </div>
                                    </div>

                              </div>


                             <div className="edit-program-section-2-right-side">
                                    <div className="edit-official-others-mainsection">
                                        <div className="box-container-outer-resindentificationpic">
                                            <div className="title-resindentificationpic">
                                                Program Photo
                                            </div>

                                            <div className="box-container-resindentificationpic">

                                            {/* File Upload Section */}
                                            <div className="identificationpic-container">
                                                <label htmlFor="identification-file-upload" className="upload-link">Click to Upload File</label>
                                                <input id="identification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleIdentificationFileChange}/>


                                                {(identificationFile || identificationPreview) && (
                                                    <div className="identificationpic-display">
                                                    <div className="identification-picture">
                                                        {identificationPreview && (
                                                        <img
                                                            src={identificationPreview}
                                                            alt="Preview"
                                                            style={{ height: '200px'}}
                                                        />
                                                        )}
                                                    </div>
                                                    
                                                    </div>

                                                )}
                                                {(identificationFile || identificationPreview) && (
                                                    <div className="delete-container">
                                                    <button type="button" /*onClick={handleIdentificationFileDelete}*/ className="delete-button">
                                                        <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                                    </button>
                                                    </div>
                                                )}
                                                </div>
                                            
                                            </div>
                                        </div> 

                                    </div>
                                
                              </div>

                            </div>






                            </> 
                          )}



                          




                         </form>


                    </div>

                </div>

                

            </div>
        </main>
    );
}

