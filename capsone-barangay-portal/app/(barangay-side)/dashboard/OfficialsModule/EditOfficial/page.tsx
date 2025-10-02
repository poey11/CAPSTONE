
"use client";
import "@/CSS/OfficialsModuleBarangdaySide/editOfficialOfficer.css";
import { useState,useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {  onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL,deleteObject } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";



export default function EditOfficial() {
    const { data: session } = useSession();
    const user = session?.user;
    const searchParams = useSearchParams();
    const officialId = searchParams.get("id");
    const router = useRouter();

    const [selectedOfficial, setSelectedOfficial] = useState<any>();
    const [newOfficialData, setNewOfficialData] = useState<any>();
    const [activeSection, setActiveSection] = useState("details");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [identificationFile, setIdentificationFile] = useState<File | null>(null);
    const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
    const [dataSet, setDataSet] = useState<boolean>(false);
    const [updateTerm, setUpdateTerm] = useState<string>("");
    const [isOfficialIdSet, setIsOfficialIdSet] = useState<string>("");
    useEffect(()=>{
        if (!officialId) return;
        const docRef = doc(db, "DisplayedOfficials", officialId as string);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                console.log("Document data:", doc.data());
                setSelectedOfficial(doc.data());
                if(doc.data().id){
                  setIsOfficialIdSet(doc.data().id);
                }
                setDataSet(true);
            }
        });

        return () => unsubscribe();
    },[officialId])


    useEffect(() => {
        if (selectedOfficial?.image) {
            setIdentificationPreview(selectedOfficial.image);
        }

    },[selectedOfficial])

    useEffect(() => {
      setNewOfficialData(selectedOfficial);
    },[dataSet]);

    useEffect(() => {
      if(!isOfficialIdSet) return;
      const docRef = doc(db, "BarangayUsers", isOfficialIdSet as string);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                console.log("Document data:", doc.data());
                setSelectedOfficial(doc.data());
                setDataSet(true);
            }
        });

        return () => unsubscribe();


    },[isOfficialIdSet])
    

    console.log("selectef official",selectedOfficial);

    
    const handleUpload = async (e:any) => {
      e.preventDefault();
      if (!officialId) return;
      let termFormatted = "";
      if(updateTerm){
        const startYear = new Date(updateTerm).getFullYear();
          const endYear = startYear + 3;
          termFormatted = `${startYear} - ${endYear}`;
      }
      let updateDate = {
        ...selectedOfficial,
          updatedBy: user?.fullName, // Replace with actual user
          updatedAt: new Date().toLocaleString(),
          term: termFormatted || selectedOfficial?.term,
      }
      try {
        if(identificationFile && !(selectedOfficial?.image && selectedOfficial.image.includes(identificationFile.name))){
          const imageRef = ref(storage, selectedOfficial?.image || "");
          await deleteObject(imageRef);
          const storageRef = ref(storage, `officialPictures/${officialId}/${identificationFile.name}`);
          await uploadBytes(storageRef, identificationFile);
          const downloadURL = await getDownloadURL(storageRef);
          updateDate = {
            ...updateDate,
            image: downloadURL,
          }
          handleIdentificationFileDelete(); // clear state after successful upload
        }
        
        if(isOfficialIdSet){
          const docRefBarangayUser = doc(db, "BarangayUsers", isOfficialIdSet as string);
          await updateDoc(docRefBarangayUser, updateDate);
        }else{
          const docRef = doc(db, "DisplayedOfficials", officialId as string);
  
          await updateDoc(docRef, updateDate);
        }
        router.push("/dashboard/OfficialsModule");
      } catch (error) {
        console.log("Error uploading file:", error);
        alert("Failed to upload file.");
      }
    };
    
    console.log("isOfficialIdSet",isOfficialIdSet);

    const handleIdentificationFileDelete = () => {
      setIdentificationFile(null);
      setIdentificationPreview(null);
    };
    const handleBack = () => {
      window.location.href = "/dashboard/OfficialsModule";
    };

    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }

    const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIdentificationFile(file);
      setIdentificationPreview(URL.createObjectURL(file)); // local preview
    };
    console.log("selectedOfficial",selectedOfficial);

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
                        <button className="action-save" type="button" onClick={handleUpload}>
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
                                                <p>Full Name<span className="required">*</span></p>
                                                <input type="text" 
                                                value={
                                                    selectedOfficial?.name ||
                                                    [selectedOfficial?.firstName, selectedOfficial?.middleName, selectedOfficial?.lastName]
                                                      .filter(Boolean) // remove undefined/null/empty
                                                      .join(" ") || 
                                                    "N/A"
                                                  }

                                                className="edit-official-input-field" 
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, name: e.target.value})}
                                                disabled={isOfficialIdSet ? true: false}
                                                />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Facebook<span className="required">*</span></p>
                                                <input type="text" 
                                                value={selectedOfficial?.facebook||selectedOfficial?.facebookLink || "N/A"}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, facebook: e.target.value})}
                                                className="edit-official-input-field"
                                                disabled={isOfficialIdSet ? true: false}

                                                />
                                                
                                            </div>
                                            {/*<div className="fields-section-official">
                                                <p>Middle Name<span className="required">*</span></p>
                                                <input type="text" 
                                                value={selectedOfficial.middleName || "N/A"}
                                                readOnly
                                                className="edit-official-input-field" />
                                            </div> */}
                                            <div className="fields-section-official">
                                                <p>Contact Number<span className="required">*</span></p>
                                                <input type="text" 
                                                value={selectedOfficial?.contact ||selectedOfficial?.phone || "N/A"}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, contact: e.target.value})}
                                                disabled={isOfficialIdSet ? true: false}

                                                className="edit-official-input-field" />
                                                
                                            </div>
                                        </div>
                                        <div className="edit-official-section-2-right-side">
                                            <div className="fields-section-official">
                                                <p>Position<span className="required">*</span></p>
                                                <input 
                                                    type="text"
                                                    required
                                                    className="edit-official-input-field"
                                                    name="position"
                                                    value={selectedOfficial?.position || "N/A"}
                                                    readOnly
                                                />
                                                    
                                            </div>

                                            {selectedOfficial?.position === "LF Staff" && (
                                                <div className="fields-section-official">
                                                    <p>Department<span className="required">*</span></p>
                                                    <input type="text" 
                                                    value={selectedOfficial.department || "N/A"}
                                                    readOnly
                                                    className="edit-official-input-field" />
                                                </div>
                                            )}

                                            <div className="fields-section-official">
                                                <p>Current Term Duration<span className="required">*</span></p>
                                                <input 
                                                    type="text"
                                                    required
                                                    className="edit-official-input-field"
                                                    name="term"
                                                    value={selectedOfficial?.term || "N/A"}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="fields-section-official">
                                                <p>Update Term Duration<span className="required">*</span></p>
                                                <input
                                                    type="date"
                                                    className="edit-official-input-field"
                                                    min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                                                    name="updateTerm"
                                                    value={updateTerm || "N/A"}
                                                    onChange={(e) => setUpdateTerm(e.target.value)}
                                                />
                                            </div>

                                            <div className="fields-section-official">
                                                <p>Email Address<span className="required">*</span></p>
                                                <input type="text" 
                                                disabled={isOfficialIdSet ? true: false}
                                                value={selectedOfficial?.email || "N/A"}
                                                onChange={(e) => setSelectedOfficial({...selectedOfficial, email: e.target.value})}
                                                className="edit-official-input-field" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeSection === "others" && (
                                <div className="edit-official-others-mainsection">
                                    <div className="box-container-outer-resindentificationpic">
                                      <div className="title-resindentificationpic">
                                        Identification Picture
                                      </div>

                                      <div className="box-container-resindentificationpic">
                                        {/* File Upload Section */}
                                        <div className="identificationpic-container">
                                          <label htmlFor="identification-file-upload" className="upload-link">
                                            Click to Upload File
                                          </label>
                                          <input
                                            id="identification-file-upload"
                                            type="file"
                                            className="file-upload-input"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleIdentificationFileChange}
                                          />

                                          {(identificationFile || identificationPreview) && (
                                            <div className="identificationpic-display">
                                              <div className="identification-picture">
                                                {identificationPreview && (
                                                  <img
                                                    src={identificationPreview}
                                                    alt="Preview"
                                                    style={{ height: "200px" }}
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {(identificationFile || identificationPreview) && (
                                            <div className="delete-container">
                                              <button
                                                type="button"
                                                onClick={handleIdentificationFileDelete}
                                                className="delete-button"
                                              >
                                                <img
                                                  src="/images/trash.png"
                                                  alt="Delete"
                                                  className="delete-icon"
                                                />
                                              </button>
                                            </div>
                                          )}

                                          {/* {(identificationFile || identificationPreview) && (
                                            <button
                                              type="button"
                                              onClick={handleUpload}
                                              className="upload-button"
                                            >
                                              Save Identification Picture
                                            </button>
                                          )} */}
                                        </div>
                                      </div>
                                    </div>
                                </div>

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
                                      setSelectedOfficial(newOfficialData);
                                      setShowDiscardPopup(false);
                                    }}
                                    className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}


        </main>
    );
}

