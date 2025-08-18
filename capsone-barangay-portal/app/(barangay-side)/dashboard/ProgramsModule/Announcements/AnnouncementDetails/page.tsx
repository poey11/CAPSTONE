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
                        {["details", "description"].map((section) => (
                        <button
                            key={section}
                            type="button"
                            className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section as "details" | "description" | "others")}
                        >
                            {section === "details" && "Details"}
                            {section === "description" && "Description"}
                        </button>
                        ))}
                    </nav>

                    <div className="edit-announcement-bottom-section-scroll">
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

                        </form>

                    </div>
            </div>

        </div>

    </main>

  );
}
