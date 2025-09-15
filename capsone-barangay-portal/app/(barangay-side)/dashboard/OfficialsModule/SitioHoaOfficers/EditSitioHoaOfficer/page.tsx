"use client";
import "@/CSS/OfficialsModuleBarangdaySide/editOfficialOfficer.css";
import { useState,useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {  onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
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

export default function EditOfficer() {

    const { data: session } = useSession();
    const user =  session?.user;    
    const searchParams = useSearchParams();
    const officialId = searchParams.get("id");
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("details");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [identificationFile, setIdentificationFile] = useState<File | null>(null);
    const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
    const [selectedOfficial, setSelectedOfficial] = useState<NewOfficerDetails>({});
    const [selectedOfficialData, setSelectedOfficialData] = useState<NewOfficerDetails>({});
    const [dataSet, setDataSet] = useState(false);
    
    useEffect(()=>{
        if (!officialId) return;
        const docRef = doc(db, "hoaSitioOfficers", officialId as string);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                console.log("Document data:", doc.data());
                setSelectedOfficial(doc.data());
                setDataSet(true);
            }
        });

        return () => unsubscribe();
    },[officialId])

    useEffect(() => {
        if (selectedOfficial.image) {
            setIdentificationPreview(selectedOfficial.image);
        }

    },[selectedOfficial])

    
    useEffect(() => {
        setSelectedOfficialData(selectedOfficial);
    },[dataSet])

    console.log("selectef official",selectedOfficial);
    const handleBack = () => {
        router.back();
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

    const handleSaveChanges = async () => {
        if (!officialId) return;
        try {
            const docRef = doc(db, "hoaSitioOfficers", officialId as string);
            let updateData={
                ...selectedOfficial,
                updatedAt: new Date().toLocaleString(),
                updatedBy: user?.fullName || "Unknown",
            };
            if (identificationFile && !(selectedOfficial.image && selectedOfficial.image.includes(identificationFile.name))) {
            
                const imageRef = ref(storage, selectedOfficial.image);
                await deleteObject(imageRef).catch((error) => { 
                    console.log("No previous image to delete or error deleting:", error);
                });
                const storageRef = ref(storage, `hoaSitioPictures/${Date.now()}_${identificationFile.name}`);
                await uploadBytes(storageRef, identificationFile);
                const downloadURL = await getDownloadURL(storageRef);
                updateData = {
                  ...updateData,
                  image: downloadURL,
                };
            }

            await updateDoc(docRef, updateData);
            alert("Officer details updated successfully!");
            router.push("/dashboard/OfficialsModule/SitioHoaOfficers");
        } catch (error) {
            
        }
    }

    return (
        <main className="edit-officer-main-container">
            <div className="edit-officer-main-content">
                <div className="edit-officer-main-section1">
                    <div className="edit-officer-main-section1-left">
                        <button onClick={handleBack}>
                        <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Edit Officer </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                        <button type = "button" onClick={handleSaveChanges} className="action-save">
                            Save
                        </button>
                    </div>
                </div>

                <div className="edit-official-bottom-section">
                    <nav className="edit-officer-info-toggle-wrapper">
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
                    
                    <div className="edit-officer-bottom-section-scroll">
                        <form  className="edit-officer-section-2">
                            {activeSection === "details" && (
                                <>
                                    <div className="edit-officer-section-2-full-top">
                                        <div className="edit-official-section-2-left-side">
                                            <div className="fields-section-official">
                                                <p>Officer Full Name<span className="required">*</span></p>
                                                <input type="text" 
                                                value ={selectedOfficial.fullName|| ""}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, fullName: e.target.value})}
                                                    className="edit-officer-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Email<span className="required">*</span></p>
                                                <input type="text" 
                                                value={selectedOfficial.email || ""}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, email: e.target.value})}    
                                        
                                                className="edit-officer-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Facebook</p>
                                                <input type="text" 
                                                value={selectedOfficial.facebook || ""}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, facebook: e.target.value})}
                                                className="edit-officer-input-field" />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Department<span className="required">*</span></p>
                                                <select
                                                    className="edit-officer-input-field"
                                                    name="position"
                                                    value={selectedOfficial.department || ""}
                                                    onChange={(e) => setSelectedOfficial({...selectedOfficial, department: e.target.value})}
                                                >
                                                    <option value="" disabled>Select a Department</option>
                                                    <option value="SITIO">SITIO</option>
                                                    <option value="HOA">HOA</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="edit-officer-section-2-right-side">
                                            <div className="fields-section-official">
                                                <p>Position<span className="required">*</span></p>
                                                <select
                                                className="edit-officer-input-field"
                                                name="position"
                                                required
                                                >
                                                    <option value="" disabled>Position</option>
                                                        {selectedOfficial.department === "HOA" ? (
                                                          <>
                                                            <option value="Association President">Association President</option>
                                                            <option value="Association Officer">Association Officer</option>
                                                          </>
                                                        ):(
                                                          <>
                                                            <option value="Sitio President">Sitio President</option>
                                                            <option value="Sitio Officer">Sitio Officer</option>
                                                          </>
                                                        )}
                                                        <option value="Others">Others</option>
                                                </select>
                                            </div>
                                            {selectedOfficial.position === "Others" && (
                                                <div className="fields-section-official">
                                                    <p>Please Specify Position<span className="required">*</span></p>
                                                    <input 
                                                        type="text" 
                                                        className="edit-officer-input-field"
                                                        name="otherPosition"
                                                        value={selectedOfficial.otherPosition || ""}
                                                        onChange={(e) => setSelectedOfficial({...selectedOfficial, otherPosition: e.target.value})}
                                                    />
                                                </div>
                                            )}
                                            <div className="fields-section-official">
                                                <p>Location<span className="required">*</span></p>
                                                <select
                                                className="edit-officer-input-field"
                                                name="position"
                                                value={selectedOfficial.location || ""}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, location: e.target.value})}
                                                >
                                                <option value="" disabled>Location</option>
                                                <option value="East Fairview">East Fairview</option>
                                                <option value="West Fairview">West Fairview</option>
                                                <option value="South Fairview">South Fairview</option>
                                                </select>
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Cluster/Section<span className="required">*</span></p>
                                                <select 
                                                    className="edit-officer-input-field"
                                                    name="clusterSection"
                                                    value={selectedOfficial.clusterSection || ""}
                                                    onChange={(e) => setSelectedOfficial({...selectedOfficial, clusterSection: e.target.value})}
                                                >
                                                    <option value="" disabled>Select Cluster/Section</option>
                                                    <option value="SITIO KISLAP">SITIO KISLAP</option>
                                                    <option value="URLINA">URLINA</option>
                                                    <option value="EFHAI">EFHAI</option>
                                                    <option value="TULIP RESIDENCES HOA">TULIP RESIDENCES HOA</option>
                                                    <option value="UPPER CORVETTE HOA">UPPER CORVETTE HOA</option>
                                                    <option value="WEST FAIRVEW HOA">WEST FAIRVEW HOA</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                            </div>
                                            {selectedOfficial.clusterSection === "Others" && (
                                                <div className="fields-section-official">
                                                    <p>Please Specify Cluster/Section<span className="required">*</span></p>
                                                    <input
                                                        type="text"
                                                        className="edit-officer-input-field"
                                                        name="otherClusterSection"
                                                        value={selectedOfficial.otherClusterSection || ""}
                                                        onChange={(e) => setSelectedOfficial({...selectedOfficial, otherClusterSection: e.target.value})}
                                                    />
                                                </div>
                                            )}
                                            <div className="fields-section-official">
                                                <p>Contact Number<span className="required">*</span></p>
                                                <input 
                                                    type="tel" 
                                                    className="edit-officer-input-field"
                                                    name="contact"
                                                    pattern="^[0-9]{11}$" 
                                                    placeholder="Enter 11-digit phone number" 
                                                    value={selectedOfficial.contact || ""}
                                                    onChange={(e) => setSelectedOfficial({...selectedOfficial, contact: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeSection === "others" && (
                                <>
                                    <div className="edit-officer-others-mainsection">
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
                                    <button type="button" onClick={()=>{
                                        setSelectedOfficial(selectedOfficialData);
                                        setShowDiscardPopup(false);
                                        }} className="yes-button-add">
                                            Yes
                                    </button> 
                                </div> 
                            </div>
                        </div>
                    )}
        </main>
    );
}