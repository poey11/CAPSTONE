
"use client";
import "@/CSS/OfficialsModuleBarangdaySide/editOfficialOfficer.css";
import { useState } from "react";


export default function EditOfficial() {

    const [activeSection, setActiveSection] = useState("details");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [position, setPosition] = useState("");
    const [identificationFile, setIdentificationFile] = useState<File | null>(null);
    const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);

    const handleBack = () => {
      window.location.href = "/dashboard/OfficialsModule";
    };

    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }

    const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIdentificationFile(file);
        setIdentificationPreview(URL.createObjectURL(file));
    }

    };

    return (
        <main className="edit-official-main-container">
            <div className="edit-official-main-content">
                <div className="edit-official-main-section1">
                    <div className="edit-official-main-section1-left">
                        <button onClick={handleBack}>
                        <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Edit Official </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                        <button className="action-save">
                            Save
                        </button>
                    </div>
                </div>

                <div className="edit-official-bottom-section">
                    <nav className="edit-official-info-toggle-wrapper">
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

                    <div className="edit-official-bottom-section-scroll">
                        <form  className="edit-official-section-2">
                            {activeSection === "details" && (
                                <>
                                    <div className="edit-official-section-2-full-top">
                                        <div className="edit-official-section-2-left-side">
                                            <div className="fields-section-official">
                                                <p>Last Name<span className="required">*</span></p>
                                                <input type="text" 
                                                required
                                                className="edit-official-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>First Name<span className="required">*</span></p>
                                                <input type="text" 
                                                required
                                                className="edit-official-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Middle Name<span className="required">*</span></p>
                                                <input type="text" 
                                                required
                                                className="edit-official-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Contact Number<span className="required">*</span></p>
                                                <input type="text" 
                                                required
                                                className="edit-official-input-field" />
                                            </div>
                                        </div>
                                        <div className="edit-official-section-2-right-side">
                                            <div className="fields-section-official">
                                                <p>Position<span className="required">*</span></p>
                                                <select
                                                    required
                                                    className="edit-official-input-field"
                                                    name="position"
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
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
                                                <div className="fields-section-official">
                                                    <p>Department<span className="required">*</span></p>
                                                    <input type="text" 
                                                    required
                                                    className="edit-official-input-field" />
                                                </div>
                                            )}

                                            <div className="fields-section-official">
                                                <p>Term Duration<span className="required">*</span></p>
                                                <input
                                                    type="date"
                                                    className="edit-official-input-field"
                                                    name="termDuration"
                                                    required
                                                    min={new Date().toISOString().split("T")[0]}
                                                />
                                            </div>

                                            <div className="fields-section-official">
                                                <p>Email Address<span className="required">*</span></p>
                                                <input type="text" 
                                                required
                                                className="edit-official-input-field" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeSection === "others" && (
                                <>
                                    <div className="edit-official-others-mainsection">
                                        <div className="box-container-outer-resindentificationpic">
                                            <div className="title-resindentificationpic">
                                                Identification Picture
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
                                </>
                            )}
                        </form>
                    </div>

                </div>

            </div>

            {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-edit-official">
                            <div className="confirmation-popup-edit-official">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
                                    <button className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}


        </main>
    );
}

