"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/db/firebase";

import ViewApprovedParticipantModal from "@/app/(barangay-side)/components/ViewApprovedParticipantModal";
import AddWalkInParticipantModal from "@/app/(barangay-side)/components/AddWalkInParticipantModal";

type Participant = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string;
  location?: string;
  address?: string;
  programId?: string;
  programName?: string;
  residentId?: string;
  role?: string; // "Participant" | "Volunteer"
  approvalStatus?: string;
  attendance?: boolean; // new field
  dayChosen?: number; // new field
};

type Resident = {
  id: string;
  residentNumber?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  mobile?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  sex?: string;
  age?: number;
  identificationFileURL?: string;
};

type SimpleField = { name: string };

const PRETTY_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
};

const FALLBACK_REQ_TEXT: SimpleField[] = [
  { name: "firstName" },
  { name: "lastName" },
  { name: "contactNumber" },
  { name: "emailAddress" },
  { name: "location" },
];

export default function ParticipantsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || "";

  // UI state
  const [loading, setLoading] = useState(true);

  // Toasts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMsg, setErrorToastMsg] = useState("");

  // List + search
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchName, setSearchName] = useState("");

  // Role filter
  const [roleFilter, setRoleFilter] = useState("");

  // Program meta + requirements
  const [programCapacity, setProgramCapacity] = useState<number | null>(null);
  const [programVolunteerCapacity, setProgramVolunteerCapacity] = useState<number | null>(null);
  const [programTitle, setProgramTitle] = useState<string>("");
  const [programStatus, setProgramStatus] = useState<string>("");
  const [reqTextFields, setReqTextFields] = useState<SimpleField[]>([]);
  const [reqFileFields, setReqFileFields] = useState<SimpleField[]>([]);

  // Residents picker
  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [resSearch, setResSearch] = useState("");
  const residentPopUpRef = useRef<HTMLDivElement>(null);

  // Walk-in modal
  const [showAddWalkInModal, setShowAddWalkInModal] = useState(false);
  const [residentForAdd, setResidentForAdd] = useState<Resident | null>(null);

  // Edit modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const handleBack = () => {
    window.location.href = "/dashboard/ProgramsModule/ProgramsAndEvents";
  };
  const handleParticipantsClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists?programId=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists");
    }
  };
  const handleEditClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails");
    }
  };
  const [noParticipantLimit, setNoParticipantLimit] = useState<boolean>(false);
  const [particapantDays, setParticapantDays] = useState<number[]>([]);
  const [noParticipantLimitList, setNoParticipantLimitList] = useState<boolean[]>([]);
  const [eventType, setEventType] = useState<string>("single");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  // Load program meta
  useEffect(() => {
    let cancelled = false;
    const loadProgram = async () => {
      if (!programId) {
        setProgramCapacity(null);
        setProgramVolunteerCapacity(null);
        setProgramTitle("");
        setProgramStatus("");
        setReqTextFields([]);
        setReqFileFields([]);
        return;
      }
      try {
        const refDoc = doc(db, "Programs", programId);
        const snap = await getDoc(refDoc);
        if (!cancelled && snap.exists()) {
          const d = snap.data() as any;
          const capParticipants = Number(d?.participants);
          const capVolunteers = Number(d?.volunteers);
          const noLimit = Boolean(d?.noParticipantLimit);

          setNoParticipantLimit(noLimit);
          setParticapantDays(Array.isArray(d?.particapantDays) ? d.particapantDays : []);
          setNoParticipantLimitList(Array.isArray(d?.noParticipantLimitList) ? d.noParticipantLimitList : []);
          setProgramCapacity(Number.isFinite(capParticipants) ? capParticipants : null);
          setProgramVolunteerCapacity(Number.isFinite(capVolunteers) ? capVolunteers : null);
          setProgramTitle(d?.programName || "");
          setProgramStatus((d?.progressStatus || "").toString());
          setEventType(d?.eventType || "single");
          
          const tfs: SimpleField[] = Array.isArray(d?.requirements?.textFields)
            ? d.requirements.textFields
            : [];
          const ffs: SimpleField[] = Array.isArray(d?.requirements?.fileFields)
            ? d.requirements.fileFields
            : [];
          setReqTextFields(tfs);
          setReqFileFields(ffs);
        } else if (!cancelled) {
          setProgramCapacity(null);
          setProgramVolunteerCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
          setReqTextFields([]);
          setReqFileFields([]);
        }
      } catch {
        if (!cancelled) {
          setProgramCapacity(null);
          setProgramVolunteerCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
          setReqTextFields([]);
          setReqFileFields([]);
        }
      }
    };
    loadProgram();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  // Live list of approved participants
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "ProgramsParticipants");
    const qRef = programId
      ? query(
          colRef,
          where("programId", "==", programId),
          where("approvalStatus", "==", "Approved"),
          orderBy("fullName", "asc")
        )
      : query(colRef, where("approvalStatus", "==", "Approved"), orderBy("programName", "asc"));

    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const rows: Participant[] = [];
        const inits: Array<Promise<any>> = [];

        snap.forEach((docu) => {
          const d = docu.data() as any;
          const hasAttendance = typeof d.attendance === "boolean";
          const attendance = hasAttendance ? d.attendance : false;

          // Initialize missing attendance to false
          if (!hasAttendance) {
            inits.push(
              updateDoc(doc(db, "ProgramsParticipants", docu.id), { attendance: false }).catch(() => {})
            );
          }

          rows.push({
            id: docu.id,
            fullName: d.fullName ?? "",
            firstName: d.firstName ?? "",
            lastName: d.lastName ?? "",
            contactNumber: d.contactNumber ?? "",
            emailAddress: d.emailAddress ?? "",
            location: d.location ?? d.address ?? "",
            address: d.address ?? d.location ?? "",
            programId: d.programId ?? "",
            programName: d.programName ?? "",
            residentId: d.residentId ?? "",
            role: d.role ?? "Participant",
            approvalStatus: d.approvalStatus ?? "Approved",
            attendance,
            dayChosen: d.dayChosen ?? null,
          });
        });

        if (inits.length) Promise.allSettled(inits);

        setParticipants(rows);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setErrorToastMsg("Failed to load participants.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    );

    return () => unsub();
  }, [programId]);

  const [dayChosen, setDayChosen] = useState<number>(0);
  // Search + Role filter
  const filteredParticipants = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    if(eventType === "single"){
      return participants.filter((p) => {
        const name = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).toLowerCase();
        const matchesName = !q || name.includes(q);
  
        const role = (p.role || "Participant").toLowerCase();
        const matchesRole = !roleFilter || role === roleFilter.toLowerCase();
  
        return matchesName && matchesRole;
      });
    }
   else {
      const participantsFiltered = participants.filter((p) => {
        const name = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).toLowerCase();
        const matchesName = !q || name.includes(q);

        const role = (p.role || "Participant").toLowerCase();
        const matchesRole = !roleFilter || role === roleFilter.toLowerCase();
        const matchesDay = p.dayChosen === dayChosen;

        // ✅ Only apply day filter for Participants
        if (role === "participant") {
          return matchesName && matchesRole && matchesDay;
        }

        // ✅ For Volunteers, ignore day filter
        if (role === "volunteer") {
          return matchesName && matchesRole;
        }

        // default (other roles)
        return matchesName && matchesRole;
      });

      return participantsFiltered;
    }

  }, [searchName, roleFilter, participants,dayChosen,eventType]);

  // Role-specific counts
  const participantCount = useMemo(
    () => participants.filter((p) => (p.role || "Participant").toLowerCase() === "participant").length,
    [participants]
  );
  const volunteerCount = useMemo(
    () => participants.filter((p) => (p.role || "").toLowerCase() === "volunteer").length,
    [participants]
  );

  const multipleDayParticipantCount = useMemo(
    () => participants.filter((p) => (p.role || "Participant").toLowerCase() === "participant" && p.dayChosen === dayChosen).length,
    [participants, dayChosen]
  );
  const badgeParticipantsText = useMemo(() => {
  if (!noParticipantLimit  && eventType === "single") {
    return `Participants: ${participantCount} / ${programCapacity ?? "—"}`;
  }else if(noParticipantLimit === true && eventType === "single") {
   return `Participants: ${participantCount}`;
  } 
  else if (  noParticipantLimitList[dayChosen] === false && eventType === "multiple") {
    return `Participants: ${multipleDayParticipantCount} / ${ particapantDays[dayChosen] ?? "—"}`;
  }
  else if(  noParticipantLimitList[dayChosen] === true && eventType === "multiple") {
    return `Participants: ${multipleDayParticipantCount}`;
  }
  
}, [noParticipantLimit, participantCount, programCapacity, particapantDays, dayChosen, noParticipantLimitList, eventType, multipleDayParticipantCount]);
  console.log(particapantDays)
  console.log(noParticipantLimitList)
  console.log(participants)
  const badgeVolunteersText = useMemo(
    () => `Volunteers: ${volunteerCount} / ${programVolunteerCapacity ?? "—"}`,
    [volunteerCount, programVolunteerCapacity]
  );

  const isProgramClosed = useMemo(
    () => ["rejected", "completed"].includes((programStatus || "").toLowerCase()),
    [programStatus]
  );

  // Add button capacity check
  const isAtCapacity = useMemo(
    () => programCapacity !== null && participantCount >= programCapacity,
    [programCapacity, participantCount]
  );

  // Show volunteers badge only if capacity exists
  const showVolunteerBadge = useMemo(
    () => typeof programVolunteerCapacity === "number" && programVolunteerCapacity > 0,
    [programVolunteerCapacity]
  );

  // Attendance can be edited only if program is ongoing
  const isAttendanceEditable = useMemo(
    () => (programStatus || "").toLowerCase() === "ongoing",
    [programStatus]
  );

  const openAddPopup = async () => {
    if (!programId) {
      setErrorToastMsg("To add a walk-in participant, open this page from a specific Program.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (isProgramClosed) {
      setErrorToastMsg(`This program is ${programStatus}. You can’t add participants.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (isAtCapacity) {
      setErrorToastMsg("Program capacity reached. Cannot add more participants.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (residents.length === 0) {
      try {
        const snap = await getDocs(collection(db, "Residents"));
        const list: Resident[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setResidents(list);
      } catch {
        setErrorToastMsg("Failed to load Residents.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
    }
    setShowResidentsPopup(true);
  };

  // Close residents popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (residentPopUpRef.current && !residentPopUpRef.current.contains(event.target as Node)) {
        setShowResidentsPopup(false);
      }
    };
    if (showResidentsPopup) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResidentsPopup]);

  const filteredResidents = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    const arr = !q
      ? residents
      : residents.filter((r) =>
          (`${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.replace(/\s+/g, " ").trim()).toLowerCase().includes(q)
        );
    return [...arr].sort((a, b) => (Number(a.residentNumber || 0) - Number(b.residentNumber || 0)));
  }, [residents, resSearch]);

  const textFieldsToRender = useMemo<SimpleField[]>(
    () => (reqTextFields.length > 0 ? reqTextFields : FALLBACK_REQ_TEXT),
    [reqTextFields]
  );
  const fileFieldsToRender = useMemo<SimpleField[]>(() => reqFileFields, [reqFileFields]);

  // Duplicate guard on resident click
  const openResidentForm = async (resident: Resident) => {
    if (!programId) return;
    try {
      const dupQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("residentId", "==", resident.id)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setErrorToastMsg("This resident is already enlisted in this program.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
      setResidentForAdd(resident);
      setShowResidentsPopup(false);
      setShowAddWalkInModal(true);
    } catch {
      setErrorToastMsg("Failed to check resident status. Please try again.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };

  const openManualEntry = () => {
    setResidentForAdd(null);
    setShowResidentsPopup(false);
    setShowAddWalkInModal(true);
  };

  const handleWalkInSaved = (msg = "Participant added successfully!") => {
    setShowAddWalkInModal(false);
    setResidentForAdd(null);
    setSuccessToastMsg(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleWalkInError = (msg: string) => {
    setErrorToastMsg(msg);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 3000);
  };

  const handleApprove = async (participantId: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", participantId), {
        approvalStatus: "Approved",
      });
      setSuccessToastMsg("Participant approved.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2200);
    } catch {
      setErrorToastMsg("Failed to approve participant.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };

  const handleReject = async (participantId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", participantId), {
        approvalStatus: "Rejected",
        rejectionReason: reason,
      });
      setSuccessToastMsg("Participant rejected.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2200);
      setShowViewModal(false);
      setSelectedParticipant(null);
    } catch {
      setErrorToastMsg("Failed to reject participant.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };

  const openEditModal = (p: Participant) => {
    setSelectedParticipant(p);
    setShowViewModal(true);
  };

  // Toggle attendance with optimistic UI
  const handleToggleAttendance = async (p: Participant) => {
    if (!isAttendanceEditable) {
      setErrorToastMsg(`Attendance can only be updated when the program is Ongoing.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
      return;
    }

    const nextValue = !Boolean(p.attendance);

    setParticipants((prev) =>
      prev.map((row) => (row.id === p.id ? { ...row, attendance: nextValue } : row))
    );

    try {
      await updateDoc(doc(db, "ProgramsParticipants", p.id), { attendance: nextValue });
      setSuccessToastMsg("Attendance updated.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 1800);
    } catch {
      setParticipants((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, attendance: !nextValue } : row))
      );
      setErrorToastMsg("Failed to update attendance.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };
  console.log(eventType)
  return (
    <main className="edit-program-main-container">
      <div className="program-redirectionpage-section">
        <button className="program-redirection-buttons" onClick={handleEditClick}>
          <div className="program-redirection-icons-section">
            <img src="/Images/audience.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Program Details</h1>
        </button>

        <button className="program-redirection-buttons-selected" onClick={handleParticipantsClick}>
          <div className="program-redirection-icons-section">
            <img src="/Images/team.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Participants</h1>
        </button>
      </div>

      <div className="edit-program-main-content-participants">
        <div className="edit-program-main-section1">
          <div className="edit-program-main-section1-left">
            <button onClick={handleBack}>
              <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1>{programTitle}</h1>
          </div>
          {eventType === "multiple" && (
            
            <div className="action-btn-section-program" >
              <div className="participants-count">
                <p>Select A Day:</p>
                  
                <select
                  value={dayChosen ?? ""}
                  onChange={(e) => setDayChosen(Number(e.target.value))}
                >
                  <option value="" disabled hidden>
                    {/* hidden placeholder, doesn't show in list */}
                  </option>
                  {particapantDays.map((day, index) => (
                    <option value={index} key={index}>
                      {`Day ${index + 1}`}
                    </option>
                  ))}
                </select>

              </div>
            
            </div>                      
          )}
          <div className="action-btn-section-program" style={{ display: "flex", gap: 8 }}>
            <div className="participants-count">
              {badgeParticipantsText}
            </div>
            {showVolunteerBadge && <div className="participants-count">{badgeVolunteersText}</div>}
          </div>
        </div>

        <div className="filter-section">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="programs-module-filter-role"
          >
            <option value="">All Roles</option>
            <option value="participant">Participant</option>
            <option value="volunteer">Volunteer</option>
          </select>

          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="programs-module-filter-participants"
          />
          <button
            type="button"
            title={
              isProgramClosed
                ? `This program is ${programStatus}`
                : isAtCapacity
                ? "Program capacity reached"
                : "Add participant"
            }
            onClick={openAddPopup}
            disabled={isProgramClosed || isAtCapacity}
            style={{
              background: "transparent",
              border: "none",
              cursor: isProgramClosed || isAtCapacity ? "not-allowed" : "pointer",
              opacity: isProgramClosed || isAtCapacity ? 0.5 : 1,
            }}
          >
            <img src="/Images/addicon.png" alt="Add Icon" className="add-icon" />
          </button>
        </div>

        <div className="edit-program-bottom-section-participants">
          <div className="participants-container">
            {loading ? (
              <div style={{ padding: 16, opacity: 0.8 }}>Loading participants…</div>
            ) : filteredParticipants.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.8 }}>No participants found.</div>
            ) : (
              <table className="participants-table fixed-columns">
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Contact Number</th>
                    <th>Email Address</th>
                    <th>Location</th>
                    <th>Role</th>
                    {

                    }
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => {
                    const name = p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
                    return (
                      <tr
                        key={p.id}
                        onClick={() => openEditModal(p)}
                        style={{ cursor: "pointer" }}
                        title="Click to view details"
                      >
                        <td className="td-truncate">{name}</td>
                        <td className="td-truncate">{p.contactNumber || ""}</td>
                        <td className="td-truncate">{p.emailAddress || ""}</td>
                        <td className="td-truncate">{p.location || p.address || ""}</td>
                        <td className="td-truncate">{p.role || "Participant"}</td>
                        <td
                          onClick={(e) => e.stopPropagation()}
                          style={{ textAlign: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={!!p.attendance}
                            disabled={!isAttendanceEditable}
                            onChange={() => handleToggleAttendance(p)}
                            title={
                              isAttendanceEditable
                                ? "Mark attendance"
                                : `Attendance disabled — program is ${programStatus || "not ongoing"}`
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Residents Picker */}
      {showResidentsPopup && (
        <div className="program-popup-overlay">
          <div className="program-popup" ref={residentPopUpRef}>
            <div className="view-participant-backbutton-container">
              <button onClick={() => setShowResidentsPopup(false)}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="participant-back-btn-resident" />
              </button>
            </div>

            <h2>Residents List</h2>
            <h1>* Please select Resident's Name *</h1>

            <div className="manual-add-button-section">
              <button
                className="add-non-resident-button"
                onClick={openManualEntry}
                title="Add a non-resident walk-in"
              >
                Manual Entry <br />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search Resident's Name"
              className="program-search-input"
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
            />

            <div className="program-list" style={{ maxHeight: 360, overflow: "auto" }}>
              {residents.length === 0 ? (
                <p style={{ padding: 12 }}>No residents found.</p>
              ) : (
                <table className="program-table">
                  <thead>
                    <tr>
                      <th>Resident Number</th>
                      <th>First Name</th>
                      <th>Middle Name</th>
                      <th>Last Name</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident) => (
                      <tr
                        key={resident.id}
                        className="program-table-row"
                        style={{ cursor: "pointer" }}
                        onClick={() => openResidentForm(resident)}
                      >
                        <td>{resident.residentNumber ?? ""}</td>
                        <td>{resident.firstName ?? ""}</td>
                        <td>{resident.middleName ?? ""}</td>
                        <td>{resident.lastName ?? ""}</td>
                        <td>{resident.address ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddWalkInModal && (
        <AddWalkInParticipantModal
          isOpen={showAddWalkInModal}
          onClose={() => {
            setShowAddWalkInModal(false);
            setResidentForAdd(null);
          }}
          onBack={() => {
            setShowAddWalkInModal(false);
            setShowResidentsPopup(true);
          }}
          programId={programId}
          programName={programTitle}
          textFields={textFieldsToRender}
          fileFields={fileFieldsToRender}
          resident={residentForAdd}
          onSaved={handleWalkInSaved}
          onError={handleWalkInError}
          prettyLabels={PRETTY_LABELS}
        />
      )}

      {showViewModal && selectedParticipant && (
        <ViewApprovedParticipantModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedParticipant(null);
          }}
          participant={selectedParticipant}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showSuccessToast && (
        <div className="popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{successToastMsg}</p>
          </div>
        </div>
      )}
      {showErrorToast && (
        <div className="error-popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/warning-1.png" alt="popup icon" className="icon-alert" />
            <p>{errorToastMsg}</p>
          </div>
        </div>
      )}
    </main>
  );
}
