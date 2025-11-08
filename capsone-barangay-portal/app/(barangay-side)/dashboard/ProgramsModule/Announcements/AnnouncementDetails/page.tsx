"use client";
import "@/CSS/ProgramsBrgy/EditAnnouncement.css";
import { useState,useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {  onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";

interface AnnouncementFormProps {
  announcementHeadline?: string;
  featuredInAnnouncements?: string;
  category?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  image?:string;
  content?: string;
  isActive?: boolean;
  isInFeatured?: string;
  updatedBy?: string;
}
export default function AnnouncementDetails() {

    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const announcementId = searchParams.get("id");
    const [announcementData, setAnnouncementData] = useState<AnnouncementFormProps | null>(null);
    const [selectedAnnnouncementData, setSelectedAnnouncementData] = useState<AnnouncementFormProps | null>(null);
    const [dataSet, setDataSet] = useState(false);

    const [invalidFields, setInvalidFields] = useState<string[]>([]);

    //popup
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showSavePopup, setShowSavePopup] = useState(false); 
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);

    useEffect(() => {
      if (!announcementId) return;
      const docRef = doc(db, "announcements", announcementId);
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          setAnnouncementData(doc.data() as AnnouncementFormProps);
          setDataSet(true);
        } else {
          console.log("No such document!");
        } 
      });
      return () => unsubscribe();
    }, [announcementId]);

    useEffect(() => {
        setSelectedAnnouncementData(announcementData);
    }, [dataSet]);

    const router = useRouter();

    const handleBack = () => {
      router.back();
    };


    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if(announcementData?.image){
          setPreview(announcementData.image);
        }
    },[announcementData])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile)); // create preview
      }
      e.target.value = ""; // reset the input value to allow re-uploading the same file
    };

    const handleDelete = () => {
      if (!announcementData?.image) return;

      setPreview(null);
      setFile(null);
      setAnnouncementData((prev) =>
        prev ? { ...prev, image: "" } : null
      );
    };

    const handleSaveChanges = async () => {
      if (!announcementId || !announcementData) return;

      try {
        const docRef = doc(db, "announcements", announcementId);
        let updatedData = {
          ...announcementData,
          updatedAt: new Date().toLocaleString(),
          updatedBy: session?.user?.fullName || "Unknown",
        };

        //  If image was removed
        if (!preview && !file) {
          if (announcementData.image) {
            const oldImageRef = ref(storage, announcementData.image);
            await deleteObject(oldImageRef).catch((error) => {
              console.log("No previous image to delete or error deleting:", error);
            });
          }
          updatedData.image = "";
        }

        // If new file uploaded
        if (file) {
          if (announcementData.image) {
            const oldImageRef = ref(storage, announcementData.image);
            await deleteObject(oldImageRef).catch((error) => {
              console.log("Error deleting old image:", error);
            });
          }

          const storageRef = ref(
            storage,
            `announcementsPictures/${Date.now()}-${announcementData.announcementHeadline}`
          );
          await uploadBytes(storageRef, file);
          const imageUrl = await getDownloadURL(storageRef);

          updatedData.image = imageUrl;
        }

        await updateDoc(docRef, updatedData);

        setPopupMessage("Announcement updated successfully!");
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
          router.push("/dashboard/ProgramsModule/Announcements");
        }, 3000);
      } catch (error) {
        console.error("Error updating announcement:", error);
        setPopupErrorMessage("There was an error updating the announcement.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
      }
    };


    const validateFields = () => {
      const newInvalidFields: string[] = [];

      if (!announcementData?.announcementHeadline || announcementData.announcementHeadline.trim() === "") {
        newInvalidFields.push("announcementHeadline");
        setPopupErrorMessage("Program Headline is required.");
        setActiveSection("content"); // 🔹 jump to details
      }

      if (!announcementData?.content || announcementData.content.trim() === "") {
        newInvalidFields.push("content");
        setPopupErrorMessage("Description is required.");
        setActiveSection("content"); // 🔹 jump to description
      }

      if (!preview) {
        newInvalidFields.push("image");
        setPopupErrorMessage("A photo is required.");
        setActiveSection("others"); // 🔹 jump to others
      }

      if (newInvalidFields.length > 0) {
        setInvalidFields(newInvalidFields);
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return false; 
      }

      setInvalidFields([]);
      return true; 
    };

    const [activeSection, setActiveSection] = useState<"content" | "details" | "others">("content");


    const confirmSave = () => {
      setShowSavePopup(false); 
      handleSaveChanges();     
    };


    const handleSaveClick = () => {
      
  // Check if there are changes first
  const hasChanges = JSON.stringify(announcementData) !== JSON.stringify(selectedAnnnouncementData) || !!file;

  if (!hasChanges) {
    setPopupErrorMessage("No changes were made.");
    setShowErrorPopup(true);
    setShowSavePopup(false); // make sure the confirmation popup does not show
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }


      
      if (validateFields()) {
        setShowSavePopup(true); // only open confirmation if valid
      }
    };

    const confirmDiscard = () => {
      setAnnouncementData(selectedAnnnouncementData);
      handleDelete();
      setShowDiscardPopup(false); 
    };

return (
    <main className="edit-announcement-main-container">
        <div className="edit-announcement-main-content">
            <div className="edit-announcement-main-section1">
                <div className="edit-announcement-main-section1-left">
                    <button onClick={handleBack}>
                    <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                    </button>
                    <h1> Edit Announcement Details </h1>
                </div>
                <div className="action-btn-section-program">
                    <button 
                      onClick={() => setShowDiscardPopup(true)} 
                      className="action-discard"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveClick}   
                      className="action-save"
                    >
                      Save
                    </button>
                </div>


            </div>

            <div className="edit-announcement-bottom-section">
                    <nav className="edit-announcement-info-toggle-wrapper">
                        {["content", "details", "others"].map((section) => (
                        <button
                            key={section}
                            type="button"
                            className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section as "content" | "details" | "others")}
                        >
                            {section === "content" && "Content"}
                            {section === "details" && "Details"}
                            {section === "others" && "Others"}
                        </button>
                        ))}
                    </nav>

                    <div className="edit-announcement-bottom-section-scroll">
                      <form className="edit-announcement-section-2" >

                        {activeSection === "content" && (
                        <>
                          <div className="edit-announcement-upper-section">
                            <div className="edit-announcements-description-container">
                                <div className="edit-box-container-outer-headline-announcements">
                                    <div className="edit-title-description-announcements">
                                        Announcement Headline
                                    </div>
                                    <div className={`edit-box-container-headline-announcements ${invalidFields.includes("content") ? "input-error" : ""}`}>
                                      <textarea 
                                        value={announcementData?.announcementHeadline || ""}
                                        onChange={(e) =>
                                          setAnnouncementData((prev) => ({
                                            ...prev,
                                            content: e.target.value,
                                          }))
                                        }
                                        placeholder="Write the full content or description of the announcement here..."
                                        className="edit-headline-input-field-announcements"
                                        />
                                    </div>
                                </div>

                                <div className="edit-box-container-outer-description-announcements">
                                    <div className="edit-title-description-announcements">
                                        Full Content / Description
                                    </div>
                                    <div className={`edit-box-container-description-announcements ${invalidFields.includes("content") ? "input-error" : ""}`}>
                                      <textarea 
                                        value={announcementData?.content || ""}
                                        onChange={(e) =>
                                          setAnnouncementData((prev) => ({
                                            ...prev,
                                            content: e.target.value,
                                          }))
                                        }
                                        placeholder="Write the full content or description of the announcement here..."
                                        className="edit-description-input-field-announcements"
                                        />
                                    </div>
                                </div>
                            </div>

                          </div>

                         </>
                      )}

                        {activeSection === "details" && (
                        <>
                          <div className="edit-announcement-upper-section">
                            <div className="edit-announcement-section-2-left-side">

                              <div className="active-featured-section">

                                <div className="active-button-section-edit-announcement">
                                  <label className="switch-label-edit-announcement">
                                      Featured in Home Page
                                      <label className="switch">
                                      <input type="checkbox" 
                                      checked={announcementData?.isInFeatured === "Active" || false}
                                      onChange={(e) => {
                                        const updatedValue = e.target.checked ? "Active" : "Inactive";
                                        setAnnouncementData((prev) => ({
                                          ...prev,
                                          isInFeatured: updatedValue,
                                        }));
                                      }}    
                                      />
                                      <span className="slider round"></span>
                                      </label>
                                  </label>
                                  
                                </div>    
                                <div className="active-button-section-edit-announcement">
                                  <label className="switch-label-edit-announcement">
                                      Set as Active
                                      <label className="switch">
                                      <input type="checkbox" 
                                      checked={announcementData?.isActive || false}
                                      onChange={(e) => {
                                        const updatedValue = e.target.checked;
                                        setAnnouncementData((prev) => ({
                                          ...prev,
                                          isActive: updatedValue,
                                        }));
                                      }}

                                      />
                                      <span className="slider round"></span>
                                      </label>
                                  </label>
                                </div>  

                              </div>
                            
                              <div className="fields-section-edit-announcement">
                                <p>Announcement Category<span className="required">*</span></p>
                                        <select className="edit-announcement-input-field"
                                            value={announcementData?.category || ""}
                                            onChange={(e) =>
                                              setAnnouncementData((prev) => ({
                                                ...prev,
                                                category: e.target.value,
                                              }))
                                            }
                                          >
                                            <option disabled value="">Choose Category</option>
                                            <option value="Public Advisory">Public Advisory</option>
                                            <option value="Emergency">Emergency</option>
                                            <option value="Barangay Event">Barangay Event</option>
                                        </select>
                                </div>

                            </div>

                            <div className="edit-announcement-section-2-right-side">

                                 <div className="fields-section-edit-announcement">
                                    <p> Published Date <span className="required">*</span></p>
                                        <input
                                          type="text"
                                          className="edit-announcement-input-field"
                                          value={announcementData?.createdAt || ""}
                                          readOnly
                                        />
                                    </div>

                                <div className="fields-section-edit-announcement">
                                    <p>Author<span className="required">*</span></p>
                                    <input
                                      type="text"
                                      className="edit-announcement-input-field"
                                      value={announcementData?.createdBy || ""}
                                      readOnly
                                    />
                                </div>

                            </div>

                          </div>

                        </>
                        )}
                        
                        {activeSection === "others" && (
                          <>
                           <div
                              className="box-container-outer-announcementpic"
                              style={{ display: activeSection === "others" ? "block" : "none" }}
                            >
                            <div className="title-announcementpic">Photo</div>
                            <div className={`box-container-announcementpic ${invalidFields.includes("image") ? "input-error" : ""}`}>
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
                                  onChange={handleFileChange}
                                />
                      
                                {preview && (
                                  <div className="identificationpic-display-announcement">
                                    <div className="identification-picture-announcement">
                                      <img src={preview} alt="Preview" style={{ height: "200px" }} />
                                    </div>
                                  </div>
                                )}
                      
                                {preview && (
                                  <div className="delete-container">
                                    <button
                                      type="button"
                                      className="delete-button"
                                      onClick={handleDelete}
                                    >
                                      <img
                                        src="/Images/trash.png"
                                        alt="Delete"
                                        className="delete-icon"
                                      />
                                    </button>
                                  </div>
                                )}
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
            <div className="confirmation-popup-overlay-add">
                <div className="confirmation-popup-add">
                    <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                    <p>Are you sure you want to discard the changes?</p>
                    <div className="yesno-container-add">
                        <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
                        <button onClick={confirmDiscard} className="yes-button-add">Yes</button> 
                    </div> 
                </div>
            </div>
        )}

        {showSavePopup && (
            <div className="confirmation-popup-overlay">
                <div className="confirmation-popup">
                    <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                    <p>Are you sure you want to save the changes?</p>
                    <div className="yesno-container">
                        <button onClick={() => setShowSavePopup(false)} className="no-button">No</button> 
                        <button onClick={confirmSave} className="yes-button">Yes</button> 
                    </div> 
                </div>
            </div>
          )}

        {showPopup && (
          <div className={`popup-overlay show`}>
              <div className="popup">
                  <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                  <p>{popupMessage}</p>
              </div>
          </div>
        )}

        {showErrorPopup && (
            <div className={`error-popup-overlay show`}>
                <div className="popup">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                    <p>{popupErrorMessage}</p>
                </div>
            </div>
        )}

    </main>

  );
}
