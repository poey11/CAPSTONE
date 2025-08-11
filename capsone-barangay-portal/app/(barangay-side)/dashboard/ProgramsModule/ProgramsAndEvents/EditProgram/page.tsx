"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useState } from "react";


export default function EditResident() {

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
        <main className="edit-program-main-container" >
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
                            <div className="edit-program-section-2-left-side">

                                
                            </div>

                           <div className="edit-program-section-2-right-side">
                                
                                
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

