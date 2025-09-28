"use client";
import "@/CSS/AnnouncementsBrgy/Announcements.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {useSession} from "next-auth/react";
import { addDoc, collection, onSnapshot, deleteDoc, doc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db,storage } from "@/app/db/firebase";
interface AnnouncementHeader {
  id: string;
  announcementHeadline: string;
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  image:string;
  isInFeatured?: string;
}
interface AnnouncementFormProps {
  announcementHeadline?: string;
  category?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  image?:string;
  content?: string;
  isActive?: boolean;
  isInFeatured?: string;
}
export default function AnnouncementModule() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<AnnouncementHeader[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const announcementsPerPage = 10;

  // popop
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);


  const [announcementFile, setAnnouncementFile] = useState<File | null>(null);
  const [announcementPreview, setAnnouncementPreview] = useState<string | null>(null);

  const handleAnnouncementFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnnouncementFile(file);
      setAnnouncementPreview(URL.createObjectURL(file)); // show preview
    }
  };



  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const data: AnnouncementHeader[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as AnnouncementHeader),
        id: doc.id,
      }));
      setAnnouncements(data);
      setFilteredAnnouncements(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [newAnnouncement, setNewAnnouncement] = useState<AnnouncementFormProps>({
    createdAt: new Date().toLocaleString(),
    createdBy: user?.fullName || "",
    category: "Public Advisory",
    isInFeatured: "Active",
    isActive: true,
  });

  const confirmSubmit = async () => {
    setShowSubmitPopup(false); // close confirm popup
    await createAnnouncement(); // call create
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.announcementHeadline) {
      alert("Please fill in the program headline.");
      return;
    }
    if (!newAnnouncement.category) {
      alert("Please select the program category.");
      return;
    }
    if (!newAnnouncement.content) {
      alert("Please fill in the program content/description.");
      return;
    }
    if (!announcementFile) {
      alert("Please upload the program photo.");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `announcementsPictures/${Date.now()}-${newAnnouncement.announcementHeadline}`
      );
      let imageurl = "";
      if (announcementFile) {
        await uploadBytes(storageRef, announcementFile);
        const downloadURL = await getDownloadURL(storageRef);
        imageurl = downloadURL;
      }

      const announcementData = {
        ...newAnnouncement,
        image: imageurl,
      };

      await addDoc(collection(db, "announcements"), announcementData);

      // close add popup
      setShowAddAnnouncementPopup(false);
      setAnnouncementFile(null);
      setAnnouncementPreview(null);
      setNewAnnouncement({
        createdAt: new Date().toLocaleString(),
        createdBy: user?.fullName || "",
        category: "Public Advisory",
        isInFeatured: "Inactive",
        isActive: true,
      });

      // show sliding popup instead of alert
      setPopupMessage("Announcement created successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const [activeFilter, setActiveFilter] = useState("");
  const [searchHeadline, setSearchHeadline] = useState("");
  const [searchDate, setSearchDate] = useState("");


useEffect(() => {
  let filtered = [...announcements];

  // Headline filter
  if (searchHeadline) {
    filtered = filtered.filter((a) =>
      a.announcementHeadline.toLowerCase().includes(searchHeadline.toLowerCase())
    );
  }

  // Published date filter
  if (searchDate) {
  filtered = filtered.filter((a) => {
    const createdDate = new Date(a.createdAt).toLocaleDateString(); 
    const searchDateStr = new Date(searchDate).toLocaleDateString(); 
    return createdDate === searchDateStr;
  });
}


  // Active/Inactive filter
  if (activeFilter) {
    filtered = filtered.filter(
      (a) => a.isInFeatured && a.isInFeatured.toLowerCase() === activeFilter.toLowerCase()
    );
  }

  setFilteredAnnouncements(filtered);
}, [searchHeadline, searchDate, activeFilter, announcements]);

  // Pagination logic
  const indexOfLast = currentPage * announcementsPerPage;
  const indexOfFirst = indexOfLast - announcementsPerPage;
  const currentAnnouncements = filteredAnnouncements.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAnnouncements.length / announcementsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
      ) {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };



  const confirmDelete = async () => {
    if (deleteAnnouncementId) {
      try {
        const announcementToDelete = announcements.find((a) => a.id === deleteAnnouncementId);

        if (announcementToDelete) {

          if (announcementToDelete.image) {
            const imageRef = ref(storage, announcementToDelete.image);
            await deleteObject(imageRef).catch((error) => {
              console.error("Error deleting image from storage: ", error);
            });
          }

          await deleteDoc(doc(db, "announcements", deleteAnnouncementId));

          setPopupMessage("Announcement deleted successfully!");
          setShowPopup(true);

          setTimeout(() => {
            setShowPopup(false);
          }, 3000);
        }

        setShowDeletePopup(false);
        setDeleteAnnouncementId(null);
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    }
  };



   const [showAddAnnouncementPopup, setShowAddAnnouncementPopup] = useState(false);


   const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Open popup
    const openPopup = () => {
      setIsPopupOpen(true);
    };

    // Close popup
    const closePopup = () => {
      setIsPopupOpen(false);
    };

    const handleEditClick = async(id:string) => {
      router.push(`/dashboard/ProgramsModule/Announcements/AnnouncementDetails?id=${id}`)
    };

  return (
    <main className="announcement-main-container">
    <div className="announcement-module-section-1">
      {(user?.position === "Admin Staff" || user?.position === "Punong Barangay"|| user?.position === "Secretary"|| user?.position === "Assistant Secretary") &&(
        <button 
          className="add-announcement-btn"
          onClick={() => setShowAddAnnouncementPopup(true)}
        >
          Add New Announcement
        </button>
      )}

    </div>


      <div className="announcement-module-section-2">  
    <input
                type="text"
                className="announcement-module-filter"
                placeholder="Search by Headline"
                value={searchHeadline}
                onChange={(e) => setSearchHeadline(e.target.value)}
            />

            {/* Published Date filter */}
            <input
                type="date"
                className="announcement-module-filter"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
            />

            {/* Active/Inactive filter */}
            <select
                className="announcement-module-filter"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
            >
                <option value="" disabled>All Active/Inactive</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>


      </div>

      <div className="announcements-module-main-section">
        {loading ? (
          <p>Loading programs...</p>
        ) : currentAnnouncements.length === 0 ? (
          <div className="no-result-card-programs">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
            <p className="no-results-programs">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Headline</th>
                <th>Category</th>
                <th>Author</th>
                <th>Published Date</th>
                <th>Featured</th>
                <th>Showing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAnnouncements.map((announcement) => (
                <tr key={announcement.id}>
                  <td>{announcement.announcementHeadline}</td>
                  <td>{announcement.category}</td>
                  <td>{announcement.createdBy}</td>
                  <td>{announcement.createdAt}</td>              
                  <td>
                    <span
                      className={`status-badge-programs ${announcement.isInFeatured
                        .toLowerCase()
                        .replace(/\s*-\s*/g, "-")}`}
                    >
                      <p>{announcement.isInFeatured}</p>
                    </span>
                  </td>
                  <td>
                     <span
                      className={`status-badge-programs ${String(announcement.isActive ? "Active" : "Inactive")
                        .toLowerCase()
                        .replace(/\s*-\s*/g, "-")}`}
                    >
                      <p>{announcement.isActive ? "Active" : "Inactive"}</p>
                    </span>
                  </td>
  
                  <td>
                    <div className="actions-announcements">

                    {/*}
                      <button
                        className="action-programs-button"
                        onClick={openPopup}
                      >
                        <img
                          src="/Images/view.png"
                          alt="View"
                          className="action-programs-view"
                          
                        />
                      </button>

                      */}
                      
                      {user?.position === "Admin Staff" && (
                        <>
                          <button
                            type="button"
                            className="action-announcements-button"
                            onClick={() => handleEditClick(announcement.id)}
                          >
                            <img
                              src="/Images/edit.png"
                              alt="Edit"
                              className="action-announcements-edit"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteAnnouncementId(announcement.id);
                              setShowDeletePopup(true);
                            }}
                            className="action-announcements-button"
                          >
                            <img src="/Images/delete.png" alt="Delete" className="action-announcements-delete" />
                          </button>
                        </>
                      )}


                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="redirection-section">
        <button onClick={prevPage} disabled={currentPage === 1}>
          &laquo;
        </button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === "number" && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </div>



{showAddAnnouncementPopup && (
  <div className="add-announcements-popup-overlay">
    <div className="add-announcements-confirmation-popup">

       <h2>Add New Announcement</h2>
       

       <div className="add-announcements-main-container">

        
    


          <div className="add-announcements-photo-section">
            <span className="add-announcements-details-label">Photo</span>

            <div className="add-announcements-profile-container">
              <img
                src={announcementPreview || "/Images/thumbnail.png"} 
                alt="Announcement"
                className="add-announcements-photo"
              />
            </div>

            <label htmlFor="announcement-file-upload" className="add-announcements-upload-link">
              Click to Upload File
            </label>
            <input
              id="announcement-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAnnouncementFileChange}
            />

            {/* {announcementFile && (
              <button type="button" onClick={handleAnnouncementFileDelete} className="delete-button">
                <img src="/images/trash.png" alt="Delete" className="delete-icon" />
              </button>
            )} */}
          </div>


          <div className="add-announcements-info-main-container">



           <div className="add-announcements-upper-section">
            <div className="add-announcements-content-left-side">
              <div className="fields-section-add-announcements">
                <p>Program Headline<span className="required">*</span></p>
                  <input
                  type="text"
                  className="add-announcements-input-field"
                  placeholder="Program Name (E.g. Feeding Program)"
                  value ={newAnnouncement.announcementHeadline|| ""}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, announcementHeadline: e.target.value})}
                  required
                  />
              </div>

           <div className="fields-section-add-announcements">
              <p>Announcement Category<span className="required">*</span></p>
              <select className="add-announcements-input-field"
                value ={newAnnouncement.category}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                required
              >
                <option value="" disabled>Choose Category</option>
                <option value="Public Advisory">Public Advisory</option>
                <option value="Emergency">Emergency</option>
                <option value="Barangay Event">Barangay Event</option>
              </select>
            </div>



              <div className="fields-section-add-announcements-toggle">
 
                <p>Featured in Announcements</p>
                <label className="switch">
                <input type="checkbox" defaultChecked 
                onChange={(e) => setNewAnnouncement({...newAnnouncement, isInFeatured: e.target.checked ? "Active" : "Inactive"})}

                />
                <span className="slider round"></span>
                </label>

                </div>

            </div>

            <div className="add-announcements-content-right-side">
              
                
             


              <div className="fields-section-add-announcements">
                  <p> Published Date <span className="required">*</span></p>
                    <input
                    type="text"
                    className="add-announcements-input-field"
                    value = {newAnnouncement.createdAt}
                    readOnly
                    />
                </div>

             <div className="fields-section-add-announcements">
                <p>Author<span className="required">*</span></p>
                  <input
                  type="text"
                  className="add-announcements-input-field"
                  placeholder="Author"
                  value ={newAnnouncement.createdBy}
                  readOnly
                  />
              </div>



            </div>
            
            </div> 


            <div className="add-announcements-lower-section">
              <div className="announcements-description-container">
                <div className="box-container-outer-description-announcements">
                    <div className="title-description-announcements">
                        Full Content / Description
                    </div>
                    <div className="box-container-description-announcements">
                      <textarea
                      placeholder="Write the full content/description of the announcement here..."
                      value ={newAnnouncement.content|| ""}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      required
                      className="description-input-field-announcements" />
                    </div>
                </div>
              </div>

            </div>
            
          </div>


       </div>
       


       <div className="announcement-yesno-container">
             <button onClick={() => {
                setShowAddAnnouncementPopup(false);
                setAnnouncementFile(null);
                setAnnouncementPreview(null);
                setNewAnnouncement({ 
                  createdAt: new Date().toLocaleString(),
                  createdBy: user?.fullName || "",
                  category: "Public Advisory",
                  isInFeatured: "Inactive",
                  isActive: true,
                });
             }} className="announcement-no-button">Cancel</button>
                     <button type = "button" onClick={() => setShowSubmitPopup(true)} className="announcement-yes-button">
                     Save
                </button>

       </div>


    </div>

  </div>

)}

  {showDeletePopup && (
    <div className="announcements-confirmation-popup-overlay">
      <div className="announcements-confirmation-popup">
        <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
        <p>Are you sure you want to delete this Announcement?</p>
        <div className="announcements-yesno-container">
          <button onClick={() => setShowDeletePopup(false)} className="announcements-no-button">No</button>
          <button onClick={confirmDelete} className="announcements-yes-button">Yes</button>
        </div> 
      </div>
    </div>
  )}


  {showPopup && (
      <div className={`announcements-popup-overlay show`}>
          <div className="announcements-popup">
              <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
              <p>{popupMessage}</p>
          </div>
      </div>
  )}

  {showSubmitPopup && (
    <div className="submit-announcements-confirmation-popup-overlay">
        <div className="submit-announcements-confirmation-popup">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to submit?</p>
            <div className="announcements-yesno-container">
                <button onClick={() => setShowSubmitPopup(false)} className="announcements-no-button">No</button>
                <button onClick={confirmSubmit} className="announcements-yes-button">Yes</button> 
            </div> 
        </div>
    </div>
  )}


    </main>
  );
}
