"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AddNewProgramModal from "@/app/(barangay-side)/components/AddNewProgramModal";
import EditParticipantModal from "@/app/(barangay-side)/components/EditParticipantModal";

// Firestore
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/db/firebase";

type Program = {
  id: string;
  programName: string;
  approvalStatus: "Approved" | "Pending" | "Rejected";
  progressStatus: "Ongoing" | "Upcoming" | "Completed";
  activeStatus: "Active" | "Inactive";
  createdAt?: Timestamp | null;
  dateCreated: string;
};

type Participant = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string;
  email?: string;
  location?: string;
  address?: string;
  programName?: string;
  idImageUrl?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
};

function tsToYMD(ts?: Timestamp | null): string {
  try {
    if (!ts) return "";
    const d = ts.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

export default function ProgramsModule() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const searchParams = useSearchParams();

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsAssignedData, setProgramsAssignedData] = useState<Program[]>([]);
  const [participantsListsData, setParticipantsListsData] = useState<Participant[]>([]);

  const [activeSectionRedirection, setActiveSectionRedirection] = useState<"main" | "programs" | "participants">("main");

  // Load Programs from Firestore
  useEffect(() => {
    const q = query(collection(db, "Programs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Program[] = [];
        snap.forEach((docu) => {
          const d = docu.data() as any;
          const dateCreated = tsToYMD(d.createdAt ?? null) || d.dateCreated || "";
          list.push({
            id: docu.id,
            programName: d.programName ?? "",
            approvalStatus: d.approvalStatus ?? "Pending",
            progressStatus: d.progressStatus ?? "Upcoming",
            activeStatus: d.activeStatus ?? "Inactive",
            createdAt: d.createdAt ?? null,
            dateCreated,
          });
        });
        const nonPending = list.filter((p) => p.approvalStatus !== "Pending");
        const pending = list.filter((p) => p.approvalStatus === "Pending");
        setPrograms(nonPending);
        setProgramsAssignedData(pending);
        setLoadingPrograms(false);
      },
      () => {
        setLoadingPrograms(false);
      }
    );
    return () => unsub();
  }, []);

  // Load Participants from Firestore
  useEffect(() => {
    const q = query(collection(db, "ProgramsParticipants"), orderBy("programName", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Participant[] = [];
        snap.forEach((docu) => {
          const d = docu.data() as any;
          list.push({
            id: docu.id,
            fullName: d.fullName ?? "",
            firstName: d.firstName ?? "",
            lastName: d.lastName ?? "",
            contactNumber: d.contactNumber ?? "",
            emailAddress: d.emailAddress ?? d.email ?? "",
            email: d.email ?? d.emailAddress ?? "",
            location: d.location ?? d.address ?? "",
            address: d.address ?? d.location ?? "",
            programName: d.programName ?? "",
            idImageUrl: d.idImageUrl ?? "",
            approvalStatus: d.approvalStatus ?? "Pending",
          });
        });
        setParticipantsListsData(list);
        setLoadingParticipants(false);
      },
      () => {
        setLoadingParticipants(false);
      }
    );
    return () => unsub();
  }, []);

  // Section routing sync
  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", "main");
      router.replace(`?${params.toString()}`, { scroll: false });
    } else if (section === "main" || section === "programs" || section === "participants") {
      setActiveSectionRedirection(section);
    }
  }, [searchParams, router]);

  const handleSectionSwitch = (section: "main" | "programs" | "participants") => {
    setActiveSectionRedirection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleEditClick = (id: string) => {
    router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${id}`);
  };

  // Program delete
  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      await deleteDoc(doc(db, "Programs", id));
      alert("Program deleted successfully!");
    } catch (e) {
      alert("Failed to delete program.");
    }
  };

  // Add Program Modal
  const [showAddProgramsPopup, setShowAddProgramsPopup] = useState(false);

  // Main programs filtering
  const [searchName, setSearchName] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);

  useEffect(() => {
    let filtered = [...programs];
    if (searchName) filtered = filtered.filter((p) => p.programName.toLowerCase().includes(searchName.toLowerCase()));
    if (approvalFilter) filtered = filtered.filter((p) => p.approvalStatus === approvalFilter);
    if (progressFilter) filtered = filtered.filter((p) => p.progressStatus === progressFilter);
    if (activeFilter) filtered = filtered.filter((p) => p.activeStatus === activeFilter);
    setFilteredPrograms(filtered);
  }, [searchName, approvalFilter, progressFilter, activeFilter, programs]);

  // Main programs pagination
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10;
  const indexOfLast = currentPage * programsPerPage;
  const indexOfFirst = indexOfLast - programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if ((i === currentPage - 2 || i === currentPage + 2) && pageNumbersToShow[pageNumbersToShow.length - 1] !== "...") {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  // Participants filtering
  const [participantNameSearch, setParticipantNameSearch] = useState("");
  const [participantProgramSearch, setParticipantProgramSearch] = useState("");
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    let filtered = [...participantsListsData];
    if (participantNameSearch.trim()) {
      filtered = filtered.filter((p) => (p.fullName || "").toLowerCase().includes(participantNameSearch.toLowerCase()));
    }
    if (participantProgramSearch.trim()) {
      filtered = filtered.filter((p) => (p.programName || "").toLowerCase().includes(participantProgramSearch.toLowerCase()));
    }
    setFilteredParticipants(filtered);
    setParticipantsPage(1);
  }, [participantNameSearch, participantProgramSearch, participantsListsData]);

  // Participants pagination
  const [participantsPage, setParticipantsPage] = useState(1);
  const participantsPerPage = 10;
  const indexOfLastParticipant = participantsPage * participantsPerPage;
  const indexOfFirstParticipant = indexOfLastParticipant - participantsPerPage;
  const currentParticipants = filteredParticipants.slice(indexOfFirstParticipant, indexOfLastParticipant);
  const participantsTotalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const paginateParticipants = (pageNumber: number) => setParticipantsPage(pageNumber);
  const nextParticipantsPage = () => setParticipantsPage((prev) => (prev < participantsTotalPages ? prev + 1 : prev));
  const prevParticipantsPage = () => setParticipantsPage((prev) => (prev > 1 ? prev - 1 : prev));

  // Pending programs filtering
  const [pendingSearchName, setPendingSearchName] = useState("");
  const [pendingApprovalFilter, setPendingApprovalFilter] = useState("Pending");
  const [pendingProgressFilter, setPendingProgressFilter] = useState("");
  const [pendingActiveFilter, setPendingActiveFilter] = useState("");
  const [filteredPendingPrograms, setFilteredPendingPrograms] = useState<Program[]>([]);

  useEffect(() => {
    let filtered = [...programsAssignedData];
    if (pendingSearchName) filtered = filtered.filter((p) => p.programName.toLowerCase().includes(pendingSearchName.toLowerCase()));
    if (pendingApprovalFilter) filtered = filtered.filter((p) => p.approvalStatus === pendingApprovalFilter);
    if (pendingProgressFilter) filtered = filtered.filter((p) => p.progressStatus === pendingProgressFilter);
    if (pendingActiveFilter) filtered = filtered.filter((p) => p.activeStatus === pendingActiveFilter);
    setFilteredPendingPrograms(filtered);
  }, [pendingSearchName, pendingApprovalFilter, pendingProgressFilter, pendingActiveFilter, programsAssignedData]);

  // Pending programs pagination
  const [pendingProgramsPage, setPendingProgramsPage] = useState(1);
  const pendingProgramsPerPage = 10;
  const indexOfLastPending = pendingProgramsPage * pendingProgramsPerPage;
  const indexOfFirstPending = indexOfLastPending - pendingProgramsPerPage;
  const currentPendingPrograms = filteredPendingPrograms.slice(indexOfFirstPending, indexOfLastPending);
  const pendingTotalPages = Math.ceil(filteredPendingPrograms.length / pendingProgramsPerPage);
  const paginatePending = (pageNumber: number) => setPendingProgramsPage(pageNumber);
  const nextPendingPage = () => setPendingProgramsPage((prev) => (prev < pendingTotalPages ? prev + 1 : prev));
  const prevPendingPage = () => setPendingProgramsPage((prev) => (prev > 1 ? prev - 1 : prev));

  // Participant modal state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const openParticipantModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsParticipantModalOpen(true);
  };

  const closeParticipantModal = () => {
    setIsParticipantModalOpen(false);
    setSelectedParticipant(null);
  };

  // Participant edit save
  const handleParticipantSave = async (updated: Participant) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", updated.id), {
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        fullName: updated.fullName ?? `${updated.firstName || ""} ${updated.lastName || ""}`.trim(),
        contactNumber: updated.contactNumber ?? "",
        emailAddress: updated.emailAddress ?? updated.email ?? "",
        email: updated.email ?? updated.emailAddress ?? "",
        location: updated.location ?? updated.address ?? "",
        address: updated.address ?? updated.location ?? "",
        programName: updated.programName ?? "",
      });
      setParticipantsListsData((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } catch (e) {
      alert("Failed to save participant changes.");
    }
  };

  // Participant approve
  const handleParticipantApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", id), {
        approvalStatus: "Approved",
      });
      alert("Participant approved.");
    } catch {
      alert("Failed to approve participant.");
    }
  };

  // Participant reject
  const handleParticipantReject = async (id: string, reason: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", id), {
        approvalStatus: "Rejected",
        rejectionReason: reason,
      });
      alert("Participant rejected.");
    } catch {
      alert("Failed to reject participant.");
    }
  };

  // Participant delete
  const handleDeleteParticipant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this participant?")) return;
    try {
      await deleteDoc(doc(db, "ProgramsParticipants", id));
      alert("Participant deleted successfully!");
    } catch {
      alert("Failed to delete participant.");
    }
  };

  return (
    <main className="programs-module-main-container">
      <div className="programs-module-section-1">
        <div className="center-wrapper">
          <div
            className={`pending-program-info-toggle-wrapper ${
              user?.position === "Assistant Secretary" ? "with-add-request" : ""
            }`}
          >
            {["main", "programs", "participants"].map((sectionKey) => (
              <button
                key={sectionKey}
                type="button"
                className={`info-toggle-btn-pending-program assigned-tasks ${
                  activeSectionRedirection === sectionKey ? "active" : ""
                }`}
                onClick={() => handleSectionSwitch(sectionKey as "main" | "programs" | "participants")}
              >
                {sectionKey === "main" && "All Programs"}
                {sectionKey === "programs" && (
                  <span className="badge-container">
                    Pending Programs
                    {programsAssignedData.length > 0 && (
                      <span className="task-badge">{programsAssignedData.length}</span>
                    )}
                  </span>
                )}
                {sectionKey === "participants" && (
                  <span className="badge-container">
                    Pending Participants
                    {participantsListsData.filter((p) => p.approvalStatus === "Pending").length > 0 && (
                      <span className="task-badge">
                        {participantsListsData.filter((p) => p.approvalStatus === "Pending").length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="section-add-program">
          <button className="add-programs-btn" onClick={() => setShowAddProgramsPopup(true)}>
            Add New Program
          </button>
        </div>
      </div>

      <AddNewProgramModal
        isOpen={showAddProgramsPopup}
        onClose={() => setShowAddProgramsPopup(false)}
      />

      {activeSectionRedirection === "main" && (
        <>
          <div className="programs-module-section-2">
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Program Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />

            <select
              className="programs-module-filter"
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
            >
              <option value="">All Approval Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="programs-module-filter"
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
            >
              <option value="">All Progress Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              className="programs-module-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Active/Inactive</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="programs-module-main-section">
            {loadingPrograms ? (
              <p>Loading programs...</p>
            ) : currentPrograms.length === 0 ? (
              <div className="no-result-card-programs">
                <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
                <p className="no-results-programs">No Results Found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Date Created</th>
                    <th>Approval Status</th>
                    <th>Progress Status</th>
                    <th>Active/Inactive</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrograms.map((program) => (
                    <tr key={program.id}>
                      <td>{program.programName}</td>
                      <td>{program.dateCreated}</td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.approvalStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.approvalStatus}</p>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.progressStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.progressStatus}</p>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.activeStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.activeStatus}</p>
                        </span>
                      </td>
                      <td>
                        <div className="actions-programs">
                          <button
                            className="action-programs-button"
                            onClick={() => handleEditClick(program.id)}
                          >
                            <img
                              src="/Images/edit.png"
                              alt="Edit"
                              className="action-programs-edit"
                            />
                          </button>
                          <button
                            className="action-programs-button"
                            onClick={() => handleDeleteProgram(program.id)}
                          >
                            <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                          </button>
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
        </>
      )}

      {activeSectionRedirection === "participants" && (
        <>
          <div className="programs-module-section-2">
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Full Name"
              value={participantNameSearch}
              onChange={(e) => setParticipantNameSearch(e.target.value)}
            />
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Program Name"
              value={participantProgramSearch}
              onChange={(e) => setParticipantProgramSearch(e.target.value)}
            />
          </div>

          <div className="programs-module-main-section">
            {loadingParticipants ? (
              <p>Loading participants...</p>
            ) : currentParticipants.length === 0 ? (
              <div className="no-result-card-programs">
                <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
                <p className="no-results-programs">No Results Found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Program Name</th>
                    <th>Contact Number</th>
                    <th>Email Address</th>
                    <th>Location</th>
                    <th>Approval</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentParticipants.map((participant) => (
                    <tr key={participant.id}>
                      <td>{participant.fullName}</td>
                      <td>{participant.programName}</td>
                      <td>{participant.contactNumber}</td>
                      <td>{participant.emailAddress}</td>
                      <td>{participant.location}</td>
                      <td>
                        <span
                          className={`status-badge-programs ${String(participant.approvalStatus || "Pending")
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{participant.approvalStatus || "Pending"}</p>
                        </span>
                      </td>
                      <td>
                        <div className="actions-programs">
                          <button
                            className="action-programs-button"
                            onClick={() => openParticipantModal(participant)}
                          >
                            <img src="/Images/edit.png" alt="Edit" className="action-programs-edit" />
                          </button>
                          <button
                            className="action-programs-button"
                            onClick={() => handleDeleteParticipant(participant.id)}
                          >
                            <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="redirection-section">
            <button onClick={prevParticipantsPage} disabled={participantsPage === 1}>
              &laquo;
            </button>
            {Array.from({ length: participantsTotalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => paginateParticipants(num)}
                className={participantsPage === num ? "active" : ""}
              >
                {num}
              </button>
            ))}
            <button
              onClick={nextParticipantsPage}
              disabled={participantsPage === participantsTotalPages}
            >
              &raquo;
            </button>
          </div>

          <EditParticipantModal
            isOpen={isParticipantModalOpen}
            onClose={closeParticipantModal}
            participant={selectedParticipant}
            onSave={handleParticipantSave}
            onApprove={handleParticipantApprove}
            onReject={handleParticipantReject}
          />
        </>
      )}

      {activeSectionRedirection === "programs" && (
        <>
          <div className="programs-module-section-2">
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Program Name"
              value={pendingSearchName}
              onChange={(e) => setPendingSearchName(e.target.value)}
            />
            <select
              className="programs-module-filter"
              value={pendingApprovalFilter}
              onChange={(e) => setPendingApprovalFilter(e.target.value)}
            >
              <option value="">All Approval Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select
              className="programs-module-filter"
              value={pendingProgressFilter}
              onChange={(e) => setPendingProgressFilter(e.target.value)}
            >
              <option value="">All Progress Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              className="programs-module-filter"
              value={pendingActiveFilter}
              onChange={(e) => setPendingActiveFilter(e.target.value)}
            >
              <option value="">All Active/Inactive</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="programs-module-main-section">
            {loadingPrograms ? (
              <p>Loading programs...</p>
            ) : currentPendingPrograms.length === 0 ? (
              <div className="no-result-card-programs">
                <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
                <p className="no-results-programs">No Results Found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Date Created</th>
                    <th>Approval Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPendingPrograms.map((program) => (
                    <tr key={program.id}>
                      <td>{program.programName}</td>
                      <td>{program.dateCreated}</td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.approvalStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.approvalStatus}</p>
                        </span>
                      </td>
                      <td>
                        <div className="actions-programs">
                          <button
                            className="action-programs-button"
                            onClick={() => handleEditClick(program.id)}
                          >
                            <img
                              src="/Images/edit.png"
                              alt="Edit"
                              className="action-programs-edit"
                            />
                          </button>
                          <button
                            className="action-programs-button"
                            onClick={() => handleDeleteProgram(program.id)}
                          >
                            <img src="/Images/delete.png" alt="Delete" className="action-programs-delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="redirection-section">
            <button onClick={prevPendingPage} disabled={pendingProgramsPage === 1}>
              &laquo;
            </button>
            {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => paginatePending(num)}
                className={pendingProgramsPage === num ? "active" : ""}
              >
                {num}
              </button>
            ))}
            <button onClick={nextPendingPage} disabled={pendingProgramsPage === pendingTotalPages}>
              &raquo;
            </button>
          </div>
        </>
      )}
    </main>
  );
}
