"use client";
import "@/CSS/ResidentModule/module.css";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc, addDoc, query, where, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function RegisteredVotersModule() {

  const { data: session } = useSession();
  const userPosition = session?.user?.position;
  const isAuthorized = ["Secretary", "Assistant Secretary"].includes(userPosition || "");

  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const router = useRouter(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedVoterNumber, setSelectedVoterNumber] = useState<string | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false); 
  const [showAlertPopup, setshowAlertPopup] = useState(false); 

  const [missingVoters, setMissingVoters] = useState<any[]>([]);
  const [showMissingPopup, setShowMissingPopup] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  // Highlighting Logic based on the URL parameter
  const searchParams = useSearchParams();
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);


  const [searchPrecinct, setSearchPrecinct] = useState<string>("");


  useEffect(() => {
    if (highlightResidentId && filteredResidents.length > 0) {
      const targetIndex = filteredResidents.findIndex(resident => resident.id === highlightResidentId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / residentsPerPage) + 1;
        setHighlightedId(highlightResidentId);
        setCurrentPage(targetPage);
  
        setTimeout(() => {
          const targetElement = document.querySelector(`tr[data-id="${highlightResidentId}"]`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
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

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "VotersList"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResidents(data);
      } catch (err) {
        setError("Failed to load voters");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  useEffect(() => {
    let filtered = [...residents];

    if (searchName) {
      const lowerSearch = searchName.toLowerCase();
      filtered = filtered.filter((resident) => {
        const firstName = resident.firstName?.toLowerCase() || "";
        const middleName = resident.middleName?.toLowerCase() || "";
        const lastName = resident.lastName?.toLowerCase() || "";
        return firstName.includes(lowerSearch) || middleName.includes(lowerSearch) || lastName.includes(lowerSearch);
      });
    }


    /*
    if (searchAddress) {
      filtered = filtered.filter((resident) =>
        resident.homeAddress?.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }
      */


    if (searchPrecinct) {
        filtered = filtered.filter((resident) =>
          resident.precinctNumber?.toLowerCase().includes(searchPrecinct.toLowerCase())
        );
      }

    filtered.sort((a, b) => {
      const numA = parseInt(a.voterNumber, 10) || 0;
      const numB = parseInt(b.voterNumber, 10) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setCurrentPage(1);
    setFilteredResidents(filtered);
  }, [searchName, searchPrecinct, showCount, residents, sortOrder]);



  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const parseExcelDate = (excelDate: any) => {
    if (typeof excelDate === "number") {
      const parsed = XLSX.SSF.parse_date_code(excelDate);
      if (!parsed) return "";
      const yyyy = parsed.y;
      const mm = String(parsed.m).padStart(2, "0");
      const dd = String(parsed.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return excelDate?.slice(0, 10) ?? "";
  };
  

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthorized) {
      alert("You are not authorized to import voters.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
      if (!Array.isArray(sheetData)) throw new Error("Sheet data is not an array");
  
      const voterRows = sheetData.slice(3);
      const missing = [];
  
      for (const row of voterRows) {
        if (!Array.isArray(row)) continue;
        const [no, voterName, address, precinct, birthdate] = row;
        if (!voterName || typeof voterName !== "string") continue;
  
        const parts = voterName.split(',').map((s) => toTitleCase(s.trim()));
        const lastName = parts[0] || "";
        const firstName = parts[1] || "";
        const middleName = parts.slice(2).join(' ');
        const birthdateString = parseExcelDate(birthdate);
  
        // Check if voter already exists
        const voterExistsQuery = query(
          collection(db, "VotersList"),
          where("firstName", "==", firstName),
          where("middleName", "==", middleName),
          where("lastName", "==", lastName),
          where("dateOfBirth", "==", birthdateString)
        );
        const voterExistsSnap = await getDocs(voterExistsQuery);
        if (!voterExistsSnap.empty) {
          console.log(`Voter already exists: ${firstName} ${middleName} ${lastName}`);
          continue; // Skip adding duplicate voter
        }
  
        // Check Residents
        const residentQuery = query(
          collection(db, "Residents"),
          where("firstName", "==", firstName),
          where("middleName", "==", middleName),
          where("lastName", "==", lastName),
          where("dateOfBirth", "==", birthdateString)
        );
        const residentSnapshot = await getDocs(residentQuery);
  
        // Prepare clean createdAt
        const today = new Date();
        const createdAt = today.toISOString().split("T")[0];
  
        //  Add voter to VotersList
        const nextVoterNumber = await getNextVoterNumber();
        
        const voterDocRef = await addDoc(collection(db, "VotersList"), {
          voterNumber: nextVoterNumber,
          lastName,
          firstName,
          middleName,
          homeAddress: address || "",
          precinctNumber: precinct || "",
          dateOfBirth: birthdateString || "",
          createdAt: createdAt
        });
  
        if (!residentSnapshot.empty) {
          // Found resident, link voterId and residentId both ways
          const residentDoc = residentSnapshot.docs[0];
          const residentId = residentDoc.id;
  
          // Update Resident to have voterId
          await updateDoc(doc(db, "Residents", residentId), {
            voterId: voterDocRef.id
          });
  
          // Update Voter to have residentId
          await updateDoc(doc(db, "VotersList", voterDocRef.id), {
            residentId: residentId
          });
  
        } else {
          // No resident found, add to missing list
          missing.push({
            voterId: voterDocRef.id,
            firstName,
            middleName,
            lastName,
            address,
            precinctNumber: precinct || "",
            dateOfBirth: birthdateString || ""
          });
        }
      }
  
      //  Handle missing popup
      if (missing.length > 0) {
        setMissingVoters(missing);
        setShowMissingPopup(true);
      } else {
        setPopupMessage("Voters imported and linked successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      }
  
    } catch (err) {
      console.error("Import error:", err);
      setPopupMessage("Failed to import voters.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };
  
  

  const getNextResidentNumber = async () => {
    const querySnapshot = await getDocs(collection(db, "Residents"));
    let highest = 0;
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.residentNumber) {
        const num = parseInt(data.residentNumber, 10);
        if (!isNaN(num) && num > highest) {
          highest = num;
        }
      }
    });
  
    return highest + 1;
  };

  const getNextVoterNumber = async () => {
    const querySnapshot = await getDocs(collection(db, "VotersList"));
    let highest = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.voterNumber) {
        const num = parseInt(data.voterNumber, 10);
        if (!isNaN(num) && num > highest) {
          highest = num;
        }
      }
    });
    return highest + 1;
  };

  function excelDateToISO(excelDate: number): string {
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    return jsDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
  }
  
  const handleAddSelectedResidents = async () => {
    let addedCount = 0;
  
    for (const voter of missingVoters) {
      if (selectedToAdd.has(voter.voterId)) {
        const newNumber = await getNextResidentNumber();
  
        // Safely parse birthDate
        let birthDate = "";
        if (typeof voter.dateOfBirth === "number") {
          birthDate = excelDateToISO(voter.dateOfBirth);
        } else if (typeof voter.dateOfBirth === "string") {
          birthDate = voter.dateOfBirth;
        }
  
        // Calculate age
        let age = "";
        if (birthDate) {
          const birthDateObj = new Date(birthDate);
          const today = new Date();
          let ageNum = today.getFullYear() - birthDateObj.getFullYear();
          const m = today.getMonth() - birthDateObj.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            ageNum--;
          }
          age = ageNum.toString();
        }
  
        // Add resident
        const residentDocRef = await addDoc(collection(db, "Residents"), {
          residentNumber: newNumber,
          firstName: voter.firstName,
          middleName: voter.middleName,
          lastName: voter.lastName,
          address: voter.address,
          precinctNumber: voter.precinctNumber,
          voterId: voter.voterId,
          dateOfBirth: birthDate,
          age: Number(age)
        });
  
        // Update Voter with new residentId
        await updateDoc(doc(db, "VotersList", voter.voterId), {
          residentId: residentDocRef.id
        });
  
        addedCount++;
      }
    }
  
    setShowMissingPopup(false);
    setSelectedToAdd(new Set());
    setPopupMessage(`${addedCount} voter${addedCount !== 1 ? 's' : ''} successfully added to Residents.`);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };
  
  
  
  

  const handleEditClick = (id: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/ResidentModule/registeredVoters/EditVoter?id=${id}`);
    } else {
      alert("You are not authorized to edit a voter.");
    }
  };

  const handleDeleteClick = (id: string, voterNumber: string) => {
    if (isAuthorized) {
      setDeleteUserId(id);
      setSelectedVoterNumber(voterNumber);
      setShowDeletePopup(true);
    } else {
      alert("You are not authorized to delete this voter.");
    }
  };

  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDoc(doc(db, "VotersList", deleteUserId));
        setResidents((prev) => prev.filter(resident => resident.id !== deleteUserId));
        setShowDeletePopup(false);
        setDeleteUserId(null);
        setPopupMessage("Voter Record deleted successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } catch (error) {
        console.error("Error deleting voter:", error);
        setPopupMessage("Failed to delete voter.");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10;
  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = filteredResidents.slice(indexOfFirstResident, indexOfLastResident);
  const totalPages = Math.ceil(filteredResidents.length / residentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if ((i === currentPage - 2 || i === currentPage + 2) && pageNumbersToShow[pageNumbersToShow.length - 1] !== "...") {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  return (
    <main className="resident-module-main-container">
      <div className="resident-module-section-1">
        
        <button
          className="add-announcement-btn"
          onClick={() => {
            if (isAuthorized) {
              fileInputRef.current?.click();
            } else {
              alert("You are not authorized to import voters.");
            }
          }}
        >
          Import Voters from Excel
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleExcelUpload}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </div>

      <div className="resident-module-section-2">
        <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

     {/*
             <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />

     */}

         <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Precinct Number (e.g. 2014A)"
          value={searchPrecinct}
          onChange={(e) => setSearchPrecinct(e.target.value)}
        />


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

      <div className="resident-module-main-section">
  {loading ? (
    <p>Loading voters...</p>
  ) : error ? (
    <p className="error">{error}</p>
  ) : currentResidents.length === 0 ? (
    <div className="no-result-card">
      <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>
            Voter Number
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="sort-button"
            >
              {sortOrder === "asc" ? "▲" : "▼"}
            </button>
          </th>                
          <th>Full Name</th>                
          <th>Home Address</th>
          <th>Precinct Number</th>
          <th>Creation At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentResidents.map((resident) => (
          <tr
            key={resident.id}
            data-id={resident.id}
            className={highlightedId === resident.id ? "highlighted-row" : ""}
          >
            <td>{resident.voterNumber}</td>
            <td>{`${resident.lastName}, ${resident.firstName}${resident.middleName ? ' ' + resident.middleName : ''}`}</td>
            <td>{resident.homeAddress}</td>
            <td>{resident.precinctNumber}</td>
            <td>{resident.createdAt}</td>
            <td>
              <div className="residentmodule-actions">
                <button
                  className="residentmodule-action-view"
                  onClick={() => router.push(`/dashboard/ResidentModule/registeredVoters/ViewVoter?id=${resident.id}`)}
                >
                   <img src="/Images/view.png" alt="View" />
                </button>
                {!isAuthorized ? (
                <>
                  <button
                    className="residentmodule-action-edit hidden"
                    aria-hidden="true"
                  >
                   <img src="/Images/edit.png" alt="View" />
                  </button>
                  <button
                    className="residentmodule-action-delete hidden"
                    aria-hidden="true"
                  >
                     <img src="/Images/delete.png" alt="View" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="residentmodule-action-edit"
                    onClick={() => handleEditClick(resident.id)}
                  >
                    <img src="/Images/edit.png" alt="View" />
                  </button>
                  <button
                    className="residentmodule-action-delete"
                    onClick={() => handleDeleteClick(resident.id, resident.voterNumber)}
                  >
                     <img src="/Images/delete.png" alt="View" />
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
              <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
              {getPageNumbers().map((number, index) => (
                <button
                  key={index}
                  onClick={() => typeof number === 'number' && paginate(number)}
                  className={currentPage === number ? "active" : ""}
                >
                  {number}
                </button>
              ))}
              <button onClick={nextPage} disabled={currentPage === totalPages}>&raquo;</button>
          </div>

  
      {showDeletePopup && (
                        <div className="confirmation-popup-overlay-module-voters">
                            <div className="confirmation-popup-module-voters">
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                            <p>Are you sure you want to delete this Voter Record?</p>
                            <h2>Voter Number: {selectedVoterNumber}</h2>
                                <div className="yesno-container-module">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button-module">No</button>
                                    <button onClick={confirmDelete} className="yes-button-module">Yes</button>
                                </div> 
                            </div>
                        </div>
      )}


      {showPopup && (
                <div className={`popup-overlay-module-voters show`}>
                    <div className="popup-module-voters">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
      )}

      {showAlertPopup && (
                        <div className="confirmation-popup-overlay-module">
                            <div className="confirmation-popup-module">
                                <p>{popupMessage}</p>
                                <div className="yesno-container-module">
                                    <button onClick={() => setshowAlertPopup(false)} className="no-button-module">Continue</button>
                                </div> 
                            </div>
                        </div>
       )}  

      {showMissingPopup && (
        <div className="confirmation-popup-overlay-voter-confirmation">
          <div className="confirmation-popup-module-voter-confirmation">
            <h3 className="missing-title">{missingVoters.length} voter{missingVoters.length !== 1 ? "s" : ""} not found in Resident{missingVoters.length !== 1 ? "s" : ""}</h3>
            <p>Select which voters to add as new residents:</p>
            <div className="missing-voter-list">
              {missingVoters.map((voter) => (
                <label key={voter.voterId} >
                  <input
                    type="checkbox"
                    checked={selectedToAdd.has(voter.voterId)}
                    onChange={(e) => {
                      const newSet = new Set(selectedToAdd);
                      e.target.checked ? newSet.add(voter.voterId) : newSet.delete(voter.voterId);
                      setSelectedToAdd(newSet);
                    }}
                  />
                  {`${voter.firstName} ${voter.middleName} ${voter.lastName}, ${voter.address} (${voter.precinctNumber})`}
                </label>
              ))}
            </div>
            <div className="yesno-container-module-confirmation">
              <button onClick={handleAddSelectedResidents} className="add-all-button-module-confirmation">Add Selected</button>
              <button onClick={() => {
                setSelectedToAdd(new Set(missingVoters.map(v => v.voterId)));
                handleAddSelectedResidents();
              }} className="yes-button-module-confirmation">Add All</button>
              <button onClick={() => setShowMissingPopup(false)} className="no-button-module-confirmation">Cancel</button>
            </div>
          </div>
        </div>
      )}

                 

    </main>
  );
}
