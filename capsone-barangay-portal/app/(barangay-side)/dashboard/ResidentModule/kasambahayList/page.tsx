"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  orderBy,
  serverTimestamp,
  query,
} from "firebase/firestore";
import Link from "next/link";

// 🔽 Storage imports for justification upload
import { storage } from "../../../../db/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export default function KasambahayListModule() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userPosition = (session?.user as any)?.position;
  const isAuthorized = ["Secretary", "Assistant Secretary"].includes(userPosition || "");

  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [filterNatureOfWork, setFilterNatureOfWork] = useState("");
  const [filterEmploymentArrangement, setFilterEmploymentArrangement] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Highlighting
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const hasAnimatedOnce = useRef(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10;

  // Delete popup
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedRegistrationControlNumber, setSelectedRegistrationControlNumber] = useState<string | null>(null);

  // Alerts / toasts
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showAlertPopup, setshowAlertPopup] = useState(false);

  // View popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewActiveSection, setViewActiveSection] = useState("basic");

  // 🔽 NEW: Upload-justification-before-edit states
  const [showEditJustificationPopup, setShowEditJustificationPopup] = useState(false);
  const [editResident, setEditResident] = useState<any | null>(null);
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 🔽 NEW: Justification history for Kasambahay
  const [editJustifications, setEditJustifications] = useState<any[]>([]);

  const openPopup = (user: any) => {
    setSelectedUser(user);
    setViewActiveSection("basic");
    setIsPopupOpen(true);
    router.push(`?id=${user.id}`, { scroll: false });
  };

  const closePopup = () => {
    setSelectedUser(null);
    setIsPopupOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Animate filters only once
  useEffect(() => {
    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      setFiltersLoaded(false);
      const t = setTimeout(() => setFiltersLoaded(true), 50);
      return () => clearTimeout(t);
    } else {
      setFiltersLoaded(true);
    }
  }, []);

  // Highlight handling
  useEffect(() => {
    if (highlightResidentId && filteredResidents.length > 0) {
      const targetIndex = filteredResidents.findIndex((r) => r.id === highlightResidentId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / residentsPerPage) + 1;
        setHighlightedId(highlightResidentId);
        setCurrentPage(targetPage);

        setTimeout(() => {
          const el = document.querySelector(`tr[data-id="${highlightResidentId}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);

        const timeoutId = setTimeout(() => {
          setHighlightedId(null);
          const params = new URLSearchParams(window.location.search);
          params.delete("highlight");
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          router.replace(newUrl, { scroll: false });
        }, 3000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [highlightResidentId, filteredResidents]);

  // Fetch list
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "KasambahayList"));
        const data = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setResidents(data);
      } catch (err) {
        setError("Failed to load residents");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResidents();
  }, []);

  // Filtering + sorting
  useEffect(() => {
    let filtered = [...residents];

    if (searchName) {
      filtered = filtered.filter((r) => {
        const firstName = r.firstName?.toLowerCase() || "";
        const middleName = r.middleName?.toLowerCase() || "";
        const lastName = r.lastName?.toLowerCase() || "";
        const q = searchName.toLowerCase();
        return firstName.includes(q) || middleName.includes(q) || lastName.includes(q);
      });
    }

    if (filterNatureOfWork) {
      filtered = filtered.filter((r) => String(r.natureOfWork) === filterNatureOfWork);
    }

    if (filterEmploymentArrangement) {
      filtered = filtered.filter((r) => String(r.employmentArrangement) === filterEmploymentArrangement);
    }

    filtered.sort((a, b) => {
      const numA = parseInt(a.registrationControlNumber, 10) || 0;
      const numB = parseInt(b.registrationControlNumber, 10) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    if (showCount) filtered = filtered.slice(0, showCount);

    setCurrentPage(1);
    setFilteredResidents(filtered);
  }, [searchName, filterNatureOfWork, filterEmploymentArrangement, showCount, residents, sortOrder]);

  // Add Kasambahay
  const handleAddResidentClick = () => {
    if (isAuthorized) {
      router.push("/dashboard/ResidentModule/kasambahayList/AddKasambahay");
    } else {
      alert("You are not authorized to create a new kasambahay.");
      router.refresh();
    }
  };

  const handleEditClick = (id: string) => {
    if (!isAuthorized) {
      alert("You are not authorized to edit a kasambahay.");
      router.refresh();
      return;
    }
    const target = residents.find((r) => r.id === id);
    setEditResident(target || { id });
    setJustificationFile(null);
    setUploadProgress(0);
    setShowEditJustificationPopup(true);
  };

  // Delete with confirm
  const handleDeleteClick = async (id: string, registrationControlNumber: string) => {
    if (isAuthorized) {
      setDeleteUserId(id);
      setSelectedRegistrationControlNumber(registrationControlNumber);
      setShowDeletePopup(true);
    } else {
      alert("You are not authorized to delete this resident.");
      router.refresh();
    }
  };

  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDoc(doc(db, "KasambahayList", deleteUserId));
        setResidents((prev) => prev.filter((r) => r.id !== deleteUserId));
        setShowDeletePopup(false);
        setDeleteUserId(null);
        setPopupMessage("Kasambahay Record deleted successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Failed to delete resident.");
        setTimeout(() => setShowPopup(false), 3000);
      }
    }
  };

  // Pagination helpers
  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = filteredResidents.slice(indexOfFirstResident, indexOfLastResident);
  const totalPages = Math.ceil(filteredResidents.length / residentsPerPage);
  const paginate = (n: number) => setCurrentPage(n);
  const nextPage = () => setCurrentPage((p) => (p < totalPages ? p + 1 : p));
  const prevPage = () => setCurrentPage((p) => (p > 1 ? p - 1 : p));

  const getPageNumbers = () => {
    const pageNumbersToShow: any[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if ((i === currentPage - 2 || i === currentPage + 2) && pageNumbersToShow[pageNumbersToShow.length - 1] !== "...") {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  const educationalAttainmentMap: Record<number, string> = {
    1: "Elem Under Grad",
    2: "Elem Grad",
    3: "HS Grad",
    4: "HS Under Grad",
    5: "COL Grad",
    6: "COL Under Grad",
    7: "Educational",
    8: "Vocational",
  };

  const natureOfWorkMap: Record<number, string> = {
    1: "Gen. House Help (All Around)",
    2: "YAYA",
    3: "COOK",
    4: "Gardener",
    5: "Laundry Person",
    6: "Others",
  };

  const employeeArrangementMap: Record<number, string> = {
    1: "Live - IN",
    2: "Live - OUT",
  };

  const rangeOfSalaryMap: Record<number, string> = {
    1: "₱1,500 - ₱1,999",
    2: "₱2,000 - ₱2,499",
    3: "₱2,500 - ₱4,999",
    4: "₱5,000 and Above",
  };

  const booleanToYesNo = (v: boolean): string => (v ? "Yes" : "No");

  // 🔽 Helper to format Firestore timestamps or ISO strings
  const formatTS = (ts: any) => {
    try {
      if (!ts) return "N/A";
      if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString();
      const d = new Date(ts);
      if (!isNaN(d as any)) return d.toLocaleString();
      return String(ts);
    } catch {
      return String(ts ?? "N/A");
    }
  };

  // 🔽 Fetch list of edit justification letters for HISTORY tab (Kasambahay)
  const residentId = searchParams.get("id"); // selected user from popup
  useEffect(() => {
    const fetchJustifications = async () => {
      if (!residentId) return;
      try {
        const justRef = collection(db, "KasambahayList", residentId, "EditJustifications");
        const q = query(justRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEditJustifications(items);
      } catch (e) {
        console.error("Error fetching kasambahay edit justifications:", e);
      }
    };
    fetchJustifications();
  }, [residentId]);

  // 🔽 Upload the justification letter then continue to Edit page
  const handleUploadAndContinue = async () => {
    if (!editResident) return;
    if (!justificationFile) {
      setPopupMessage("Please select a justification letter file to upload.");
      setshowAlertPopup(true);
      return;
    }
    if (!isAuthorized) {
      setPopupMessage("Only the Secretary or Assistant Secretary may proceed.");
      setshowAlertPopup(true);
      return;
    }

    try {
      setUploading(true);
      const path = `KasambahayEditJustifications/${editResident.id}/${Date.now()}_${justificationFile.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, justificationFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (err) => {
          console.error("Upload error:", err);
          setUploading(false);
          setPopupMessage("Upload failed. Please try again.");
          setshowAlertPopup(true);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          // Save metadata to Firestore under subcollection "EditJustifications" of KasambahayList
          await addDoc(collection(db, "KasambahayList", editResident.id, "EditJustifications"), {
            url,
            originalFilename: justificationFile.name,
            storagePath: path,
            residentId: editResident.id,
            uploadedBy: (session?.user as any)?.fullName || (session?.user as any)?.name || "Unknown",
            uploadedByUid: (session?.user as any)?.id || (session?.user as any)?.uid || null,
            uploadedByPosition: userPosition || "-",
            createdAt: serverTimestamp(),
          });

          setUploading(false);
          setShowEditJustificationPopup(false);
          setJustificationFile(null);

          // Continue to the existing Edit page
          router.push(`/dashboard/ResidentModule/kasambahayList/EditKasambahay?id=${editResident.id}`);
        }
      );
    } catch (e) {
      console.error("Upload exception:", e);
      setUploading(false);
      setPopupMessage("Something went wrong while uploading.");
      setshowAlertPopup(true);
    }
  };

  return (
    <main className="resident-module-main-container">
      <div className="resident-module-section-1">
        {isAuthorized && (
          <Link href="/dashboard/ResidentModule/kasambahayList/AddKasambahay">
            <button className="add-announcement-btn add-incident-animated">Add New Kasambahay</button>
          </Link>
        )}
      </div>

      <div className={`resident-module-section-2 ${filtersLoaded ? "filters-animated" : ""}`}>
        <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <select
          className="resident-module-filter"
          value={filterNatureOfWork}
          onChange={(e) => setFilterNatureOfWork(e.target.value)}
        >
          <option value="">Filter by Nature of Work</option>
          <option value="1">Gen. House Help (All Around)</option>
          <option value="2">YAYA</option>
          <option value="3">COOK</option>
          <option value="4">Gardener</option>
          <option value="5">Laundry Person</option>
          <option value="6">Others</option>
        </select>

        <select
          className="resident-module-filter"
          value={filterEmploymentArrangement}
          onChange={(e) => setFilterEmploymentArrangement(e.target.value)}
        >
          <option value="">Filter by Employment Arrangement</option>
          <option value="1">Live - IN</option>
          <option value="2">Live - OUT</option>
        </select>

        <select
          className="resident-module-filter"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

      <div className={`resident-module-main-section ${!isAuthorized ? "expand-when-no-section1-resident-module" : ""}`}>
        {loading ? (
          <p>Loading residents...</p>
        ) : currentResidents.length === 0 ? (
          <div className="no-result-card">
            <img src="/Images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Registration Control Number
                  <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="sort-button">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </button>
                </th>
                <th>Full Name</th>
                <th>Home Address</th>
                <th>Nature of Work</th>
                <th>Employment Arrangement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentResidents.map((resident) => {
                const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
                return (
                  <tr key={resident.id} data-id={resident.id} className={highlightedId === resident.id ? "highlighted-row" : ""}>
                    <td>{resident.registrationControlNumber}</td>
                    <td>{fullName}</td>
                    <td>{resident.homeAddress}</td>
                    <td>{natureOfWorkMap[Number(resident.natureOfWork) as keyof typeof natureOfWorkMap] || "N/A"}</td>
                    <td>{employeeArrangementMap[Number(resident.employmentArrangement) as keyof typeof employeeArrangementMap] || "N/A"}</td>
                    <td>
                      <div className="residentmodule-actions">
                        <button className="residentmodule-action-view" onClick={() => openPopup(resident)}>
                          <img src="/Images/view.png" alt="View" />
                        </button>

                        {!isAuthorized ? (
                          <>
                            <button className="residentmodule-action-edit hidden" aria-hidden="true">
                              <img src="/Images/edit.png" alt="Edit" />
                            </button>
                            <button className="residentmodule-action-delete hidden" aria-hidden="true">
                              <img src="/Images/delete.png" alt="Delete" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="residentmodule-action-edit"
                              onClick={() => handleEditClick(resident.id)}
                              title="Upload justification letter to edit"
                            >
                              <img src="/Images/edit.png" alt="Edit" />
                            </button>
                            <button
                              className="residentmodule-action-delete"
                              onClick={() => handleDeleteClick(resident.id, resident.registrationControlNumber)}
                            >
                              <img src="/Images/delete.png" alt="Delete" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="redirection-section">
        <button onClick={prevPage} disabled={currentPage === 1}>
          &laquo;
        </button>
        {getPageNumbers().map((number: any, index: number) => (
          <button key={index} onClick={() => typeof number === "number" && paginate(number)} className={currentPage === number ? "active" : ""}>
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </div>

      {/* Delete Confirm */}
      {showDeletePopup && (
        <div className="confirmation-popup-overlay-module-kasambahay">
          <div className="confirmation-popup-module-kasambahay">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to delete this Kasambahay Record?</p>
            <h2>Registration Control Number: {selectedRegistrationControlNumber}</h2>
            <div className="yesno-container-module">
              <button onClick={() => setShowDeletePopup(false)} className="no-button-module">
                No
              </button>
              <button onClick={confirmDelete} className="yes-button-module">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Toast */}
      {showPopup && (
        <div className={`popup-overlay-module-kasambahay show`}>
          <div className="popup-module-kasambahay">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertPopup && (
        <div className="confirmation-popup-overlay-module-kasambahay">
          <div className="confirmation-popup-module-kasambahay">
            <p>{popupMessage}</p>
            <div className="yesno-container-module">
              <button onClick={() => setshowAlertPopup(false)} className="no-button-module">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔽 NEW: Edit Justification Upload Popup */}
      {showEditJustificationPopup && editResident && (
        <div className="confirmation-popup-overlay-module-main-justifiation-letter">
          <div className="confirmation-popup-module-justification-letter">
            <img src="/Images/letter.png" alt="upload icon" className="letter-icon-popup" />
            <h2>Upload Justification Letter</h2>
            <p>A signed justification letter from the Barangay Chairman/Punong Barangay is required before editing this kasambahay.</p>
            <h4>
              Kasambahay: {editResident?.lastName || ""}, {editResident?.firstName || ""}
            </h4>

            <div>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setJustificationFile(e.target.files?.[0] || null)} />
              {uploading && <p>Uploading… {uploadProgress}%</p>}
            </div>

            <div className="yesno-container-module-justification-letter">
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowEditJustificationPopup(false);
                    setJustificationFile(null);
                  }
                }}
                className="no-button-module-justification-letter"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAndContinue}
                className="yes-button-module-justification-letter"
                disabled={!justificationFile || uploading}
                title={!justificationFile ? "Select a file first" : "Upload & continue"}
              >
                {uploading ? `Uploading ${uploadProgress}%` : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Popup (with History incl. Justifications) */}
      {isPopupOpen && selectedUser && (
        <div className="user-roles-view-popup-overlay add-incident-animated">
          <div className="view-barangayuser-popup">
            <div className="view-user-main-section1">
              <div className="view-user-header-first-section">
                <img src="/Images/QCLogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
              </div>
              <div className="view-user-header-second-section">
                <h2 className="gov-info">Republic of the Philippines</h2>
                <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
                <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
                <h2 className="contact">930-0040 / 428-9030</h2>
              </div>
              <div className="view-user-header-third-section">
                <img src="/Images/logo.png" alt="Brgy Logo" className="user-logo2-image-side-bar-1" />
              </div>
            </div>
            <div className="view-user-header-body">
              <div className="view-user-header-body-top-section">
                <div className="view-user-backbutton-container">
                  <button onClick={closePopup}>
                    <img src="/Images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident" />
                  </button>
                </div>
                <div className="view-resident-user-info-toggle-wrapper">
                  {["basic", "employment", "others", "history"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`main-resident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                      onClick={() => setViewActiveSection(section)}
                    >
                      {section === "basic" && "Basic"}
                      {section === "employment" && "Employment"}
                      {section === "others" && "Others"}
                      {section === "history" && "History"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="view-user-header-body-bottom-section">
              <div className="mainresident-photo-section">
                <span className="user-details-label">Kasambahay Details</span>
                <div className="user-profile-container">
                  <img
                    src={selectedUser.identificationFileURL || "/Images/default-identificationpic.jpg"}
                    alt="Identification"
                    className="resident-id-photo"
                  />
                </div>
              </div>

              <div className="view-main-resident-info-main-container">
                <div className="view-user-info-main-content">
                  {viewActiveSection === "basic" && (
                    <>
                      <div className="mainresident-scroll">
                        <div className="view-main-user-content-left-side">
                          <div className="view-user-fields-section">
                            <p>Registration Control Number</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.registrationControlNumber || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Last Name</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.lastName || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>First Name</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.firstName || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Middle Name</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.middleName || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Civil Status</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.civilStatus || "N/A"} readOnly />
                          </div>
                        </div>
                        <div className="view-main-user-content-right-side">
                          <div className="view-user-fields-section">
                            <p>Gender</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.sex || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Home Address</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.homeAddress || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Date of Birth</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.dateOfBirth || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Place of Birth</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.placeOfBirt || "N/A"} readOnly />
                          </div>
                          <div className="view-user-fields-section">
                            <p>Age</p>
                            <input type="text" className="view-user-input-field" value={selectedUser.age || "N/A"} readOnly />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {viewActiveSection === "employment" && (
                    <>
                      <div className="view-mainresident-content-left-side">
                        <div className="view-user-fields-section">
                          <p>Employer Name</p>
                          <input type="text" className="view-user-input-field" value={selectedUser.employerName || "N/A"} readOnly />
                        </div>
                        <div className="view-user-fields-section">
                          <p>Employer Address</p>
                          <input type="text" className="view-user-input-field" value={selectedUser.employerAddress || "N/A"} readOnly />
                        </div>
                        <div className="view-user-fields-section">
                          <p>Educational Attainment</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={educationalAttainmentMap[Number(selectedUser.educationalAttainment)] || "N/A"}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="view-mainresident-content-right-side">
                        <div className="view-user-fields-section">
                          <p>Nature of Work</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={natureOfWorkMap[Number(selectedUser.natureOfWork)] || "N/A"}
                            readOnly
                          />
                        </div>
                        <div className="view-user-fields-section">
                          <p>Employment Arrangement</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={employeeArrangementMap[Number(selectedUser.employmentArrangement)] || "N/A"}
                            readOnly
                          />
                        </div>
                        <div className="view-user-fields-section">
                          <p>Range of Salary</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={rangeOfSalaryMap[Number(selectedUser.salary)] || "N/A"}
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {viewActiveSection === "others" && (
                    <>
                      <div className="others-main-section">
                        <div className="others-top-section">
                          <div className="view-main-user-content-left-side">
                            <div className="view-user-fields-section">
                              <p>SSS Member</p>
                              <input type="text" className="view-user-input-field" value={booleanToYesNo(selectedUser.sssMember)} readOnly />
                            </div>
                            <div className="view-user-fields-section">
                              <p>PhilHealth Member</p>
                              <input type="text" className="view-user-input-field" value={booleanToYesNo(selectedUser.philhealthMember)} readOnly />
                            </div>
                          </div>
                          <div className="view-main-user-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Pag-IBIG Member</p>
                              <input type="text" className="view-user-input-field" value={booleanToYesNo(selectedUser.pagibigMember)} readOnly />
                            </div>
                          </div>
                        </div>

                        <div className="others-bottom-section">
                          {(selectedUser.verificationFilesURLs as string[])?.length > 0 ? (
                            (selectedUser.verificationFilesURLs as string[]).map((url: string, index: number) => (
                              <div key={index} className="services-onlinereq-verification-requirements-section">
                                <span className="verification-requirements-label">
                                  {selectedUser.verificationFilesURLs.length === 1 ? "Verification Requirement" : `Verification Requirement ${index + 1}`}
                                </span>
                                <div className="services-onlinereq-verification-requirements-container">
                                  <div className="file-name-image-display">
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={url}
                                        alt={`Verification Requirement ${index + 1}`}
                                        className="verification-reqs-pic uploaded-pic"
                                        style={{ cursor: "pointer" }}
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="services-onlinereq-verification-requirements-section">
                              <span className="verification-requirements-label">Verification Requirements</span>
                              <div className="services-onlinereq-verification-requirements-container">
                                <div className="no-verification-files-text">
                                  <p>No verification requirements uploaded.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 🔽 NEW: HISTORY shows justification uploads for Kasambahay */}
                  {viewActiveSection === "history" && (
                    <>
                  <div className="view-mainresident-main-section-history">

                   <div className="view-mainresident-upper-section">

                      <div className="view-mainresident-content-left-side">

                        <div className="view-user-fields-section">
                          <p>Created By</p>
                          <input type="text" className="view-user-input-field" value={selectedUser.createdBy || "N/A"} readOnly />
                        </div>
                        <div className="view-user-fields-section">
                          <p>Created At</p>
                          <input type="text" className="view-user-input-field" value={selectedUser.createdAt || "N/A"} readOnly />
                        </div>
                      </div>
                      <div className="view-mainresident-content-right-side">
                        <div className="view-user-fields-section">
                          <p>Last Updated By</p>
                          <input type="text" className="view-user-input-field" value={selectedUser.updatedBy || "N/A"} readOnly />
                        </div>
                      </div>
                    </div>

                    <div className="view-mainresident-lower-section">

                        <div className="view-user-fields-section">
                          {editJustifications.length === 0 ? (
                            <div className="no-verification-files-text">
                              <p>None uploaded yet.</p>
                            </div>
                          ) : (
                            <div className="records-table-wrapper">
                              <table className="records-table">
                                <thead>
                                  <tr>
                                    <th className="add-new-col-case">File</th>
                                    <th className="add-new-col-concern">Uploaded By</th>
                                    <th className="add-new-col-date">Position</th>
                                    <th className="add-new-col-status">Uploaded At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {editJustifications.map((j, idx) => (
                                    <tr key={j.id}>
                                      <td>
                                        <a href={j.url} target="_blank" rel="noopener noreferrer">
                                          {j.originalFilename || `Justification ${idx + 1}`}
                                        </a>
                                      </td>
                                      <td>{j.uploadedBy || "N/A"}</td>
                                      <td>{j.uploadedByPosition || "-"}</td>
                                      <td>{formatTS(j.createdAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
               

                    </div>

                    </div>

                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
