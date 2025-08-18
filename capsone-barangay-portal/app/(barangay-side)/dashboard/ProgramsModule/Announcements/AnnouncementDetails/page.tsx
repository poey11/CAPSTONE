"use client";
import "@/CSS/ProgramsBrgy/EditAnnouncement.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";



export default function AnnouncementDetails() {

     const router = useRouter();

    const handleBack = () => {
    router.push("/dashboard/ProgramsModule/ProgramsAndEvents");
  };


    const [activeSection, setActiveSection] = useState<"details" | "description" | "others">("details");
return (
    <main className="edit-announcement-main-container">
        <div className="edit-announcement-main-content">
            <div className="edit-announcement-main-section1">
                <div className="edit-announcement-main-section1-left">
                    <button onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                    </button>
                    <h1> Edit Announcement Details </h1>
                </div>

            </div>

            <div className="edit-announcement-bottom-section">
                    <nav className="edit-announcement-info-toggle-wrapper">
                        {["details", "description", "others"].map((section) => (
                        <button
                            key={section}
                            type="button"
                            className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section as "details" | "description" | "others")}
                        >
                            {section === "details" && "Details"}
                            {section === "description" && "Description"}
                            {section === "others" && "Others"}
                        </button>
                        ))}
                    </nav>

                    <div className="edit-announcement-bottom-section-scroll">

                        <div className="fields-section-edit-announcement">
                                <label className="switch-label">
                                    Featured in Announcements
                                    <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                    </label>
                                </label>
                        </div>    

                        <form className="edit-announcement-section-2" >
                        {activeSection === "details" && (
                        <>
                          <div className="edit-announcement-upper-section">
                            <div className="edit-announcement-section-2-left-side">
                                <div className="fields-section-edit-announcement">
                                    <p>Program Headline<span className="required">*</span></p>
                                    <input
                                    type="text"
                                    className="edit-announcement-input-field"
                                    placeholder="Program Name (E.g. Feeding Program)"
                                    />
                                </div>

                              <div className="fields-section-edit-announcement">
                                <p>Announcement Category<span className="required">*</span></p>
                                        <select className="edit-announcement-input-field">
                                            <option value="">Choose Category</option>
                                            <option value="">Public Advisory</option>
                                            <option value="">Emergency</option>
                                            <option value="">Barangay Event</option>
                                        </select>
                                </div>

                            </div>

                            <div className="edit-announcement-section-2-right-side">

                                 <div className="fields-section-edit-announcement">
                                    <p> Published Date <span className="required">*</span></p>
                                        <input
                                        type="date"
                                        className="edit-announcement-input-field"
                                        />
                                    </div>

                                <div className="fields-section-edit-announcement">
                                    <p>Author<span className="required">*</span></p>
                                    <input
                                    type="text"
                                    className="edit-announcement-input-field"
                                    />
                                </div>

                            </div>

                          </div>

                        </>
                        )}

                     {activeSection === "description" && (
                        <>
                          <div className="edit-announcement-upper-section">
                                 <div className="edit-announcements-description-container">
                                      <div className="edit-box-container-outer-description-announcements">
                                          <div className="edit-title-description-announcements">
                                              Full Content / Description
                                          </div>
                                          <div className="edit-box-container-description-announcements">
                                            <textarea className="edit-description-input-field-announcements" />
                                          </div>
                                      </div>
                                 </div>

                          </div>

                         </>
                        )}
                        
                        {activeSection === "others" && (
                        <>

                      <div className="box-container-outer-announcementpic">
                        <div className="title-announcementpic">Photo</div>
                        <div className="box-container-announcementpic">
                          <div className="identificationpic-container-announcement">
                            <label
                              htmlFor="identification-file-upload"
                              className="upload-link"

                            >
                              Click to Upload File
                            </label>
                            <input
                              id="identification-file-upload"
                              type="file"
                              className="file-upload-input"
                              accept=".jpg,.jpeg,.png"
          
                            />

                            
                              <div className="identificationpic-display-announcement">
                                <div className="identification-picture-announcement">
                                    <img  alt="Preview" style={{ height: "200px" }} />
                                </div>
                              </div>
          
                         
                              <div className="delete-container">
                                <button
                                  type="button"
                                  className="delete-button"

                                >
                                  <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                </button>
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
