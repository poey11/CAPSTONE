"use client";
import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/app/db/firebase";
import {
  doc,
  getDoc,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

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
  idImageUrl?: string; // legacy single-ID field
  role?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  onSave?: (updated: Participant) => void;
  onApprove?: (participantId: string) => void;
  onReject?: (participantId: string, reason: string) => void;
};

export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  onApprove,
  onReject,
}: Props) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"details" | "reqs">("details");

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Reject modals
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Loaded full doc (includes fields/files/role)
  const [fullDoc, setFullDoc] = useState<any | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // Fetch the complete ProgramsParticipants doc when opened
  useEffect(() => {
    const load = async () => {
      if (!isOpen || !participant?.id) {
        setFullDoc(null);
        return;
      }
      setLoadingFull(true);
      try {
        const snap = await getDoc(doc(db, "ProgramsParticipants", participant.id));
        if (snap.exists()) {
          setFullDoc({ id: snap.id, ...snap.data() });
        } else {
          // fallback to what we already have
          setFullDoc({ ...participant });
        }
      } finally {
        setLoadingFull(false);
      }
    };
    load();
  }, [isOpen, participant?.id]);

  //  Derived display data (no conditional hooks) 
  const fieldsMap: Record<string, string> = useMemo(() => {
    const base = (fullDoc?.fields || {}) as Record<string, any>;
    // promote meaningful fallbacks
    const top: Record<string, any> = {
      firstName: fullDoc?.firstName,
      lastName: fullDoc?.lastName,
      contactNumber: fullDoc?.contactNumber,
      emailAddress: fullDoc?.emailAddress ?? fullDoc?.email,
      location: fullDoc?.location ?? fullDoc?.address,
      programName: fullDoc?.programName,
      role: fullDoc?.role ?? participant?.role ?? "",
    };
    return { ...base, ...top };
  }, [fullDoc, participant?.role]);

  // Requirements: file URLs. validIDjpg first, then others alpha.
  const filesMap: Record<string, string> = useMemo(() => {
    const map = { ...(fullDoc?.files || {}) } as Record<string, string>;

    // legacy support: top-level idImageUrl
    if (fullDoc?.idImageUrl && !map.validIDjpg) {
      map.validIDjpg = fullDoc.idImageUrl;
    }

    // Build ordered map: validIDjpg → rest (sorted)
    const ordered: Record<string, string> = {};
    if (map.validIDjpg) ordered.validIDjpg = map.validIDjpg;

    Object.keys(map)
      .filter((k) => k !== "validIDjpg")
      .sort((a, b) => a.localeCompare(b))
      .forEach((k) => (ordered[k] = map[k]));

    return ordered;
  }, [fullDoc]);

  const roleValue = fieldsMap.role || "";

  // Helpers
  const isPdfUrl = (url: string) => url?.toLowerCase().includes(".pdf");

  const handleApprove = async () => {
    if (!participant?.id) return;
    onApprove?.(participant.id);

    
    try {
      const notificationRef = doc(collection(db, "Notifications"));
      await setDoc(notificationRef, {
        residentID: fullDoc?.residentId || null,               // who to notify
        participantID: fullDoc?.id || participant.id,          // ProgramsParticipants UID
        programId: fullDoc?.programId || null,
        programName: fullDoc?.programName || "",
        role: fullDoc?.role || "Participant",
        message: `Your registration for ${fullDoc?.programName || "the program"} as ${
          fullDoc?.role || "Participant"
        } has been approved.`,
        timestamp: serverTimestamp(),
        transactionType: "Program Registration",
        isRead: false,
      });
    } catch (e) {
      console.error("Failed to send approval notification:", e);
    }

    setToastMsg("Participant approved.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleRejectClick = () => {
    setRejectReason("");
    setShowRejectPopup(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setToastMsg("Please enter a reason before submitting.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1800);
      return;
    }
    setShowSubmitRejectPopup(true);
  };

  const handleRejectYes = async () => {
    if (!participant?.id) return;
    onReject?.(participant.id, rejectReason.trim());

    try {
      const notificationRef = doc(collection(db, "Notifications"));
      await setDoc(notificationRef, {
        residentID: fullDoc?.residentId || null,
        participantID: fullDoc?.id || participant.id,
        programId: fullDoc?.programId || null,
        programName: fullDoc?.programName || "",
        role: fullDoc?.role || "Participant",
        message: `Your registration for ${fullDoc?.programName || "the program"} as ${
          fullDoc?.role || "Participant"
        } has been rejected. Reason: ${rejectReason.trim()}`,
        timestamp: serverTimestamp(),
        transactionType: "Program Registration",
        isRead: false,
      });
    } catch (e) {
      console.error("Failed to send rejection notification:", e);
    }

    setShowSubmitRejectPopup(false);
    setShowRejectPopup(false);
    setToastMsg("Reason for Rejection submitted successfully!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  if (!isOpen || !participant) return null;

  return (
    <>
      {/* Main modal */}
      <div className="participants-view-popup-overlay add-incident-animated">
        <div className="view-barangayuser-popup">
          {/* Header */}
          <div className="view-user-main-section1">
            <div className="view-user-header-first-section">
              <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
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

          {/* Body */}
          <div className="view-participant-header-body">
            <div className="view-participant-header-body-top-section">
              <div className="view-participant-backbutton-container">
                <button onClick={onClose}>
                  <img
                    src="/images/left-arrow.png"
                    alt="Left Arrow"
                    className="participant-back-btn-resident"
                  />
                </button>
              </div>

              <div className="view-participant-info-toggle-wrapper">
                {["details", "reqs"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`participant-info-toggle-btn ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab as "details" | "reqs")}
                  >
                    {tab === "details" ? "Full Details" : "Requirements"}
                  </button>
                ))}
              </div>

              <div className="action-btn-section-verify-section-participant">
                <div className="action-btn-section-verify">
                  <button className="participant-action-reject" onClick={handleRejectClick}>
                    Reject
                  </button>
                  <button className="participant-action-accept" onClick={handleApprove}>
                    Approve
                  </button>
                </div>
              </div>
            </div>

            <div className="view-participant-header-body-bottom-section">
              <div className="view-participant-user-info-main-container">
                <div className="view-participant-info-main-content">
                  {/* ===== Full Details ===== */}
                  {activeTab === "details" && (
                    <div style={{ display: "flex", width: "100%", padding: "20px 0" }}>
                      <div className="view-participant-user-content-left-side">
                        <div className="view-participant-fields-section">
                          <p>Last Name</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={
                              fieldsMap.lastName ??
                              fullDoc?.lastName ??
                              (fullDoc?.fullName ? fullDoc.fullName.split(" ").slice(-1).join(" ") : "")
                            }
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Contact Number</p>
                          <input
                            type="tel"
                            className="view-participant-input-field"
                            value={fieldsMap.contactNumber ?? fullDoc?.contactNumber ?? ""}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Home Address</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={
                              fieldsMap.location ??
                              fullDoc?.location ??
                              fullDoc?.address ??
                              ""
                            }
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Program Name</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={fieldsMap.programName ?? fullDoc?.programName ?? ""}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="view-participant-user-content-right-side">
                        <div className="view-participant-fields-section">
                          <p>First Name</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={
                              fieldsMap.firstName ??
                              fullDoc?.firstName ??
                              (fullDoc?.fullName ? fullDoc.fullName.split(" ").slice(0, -1).join(" ") : "")
                            }
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Email</p>
                          <input
                            type="email"
                            className="view-participant-input-field"
                            value={fieldsMap.emailAddress ?? fullDoc?.emailAddress ?? fullDoc?.email ?? ""}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Role</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={roleValue}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== Requirements ===== */}
                  {activeTab === "reqs" && (
                    <div className="participant-uploaded-photo-section" style={{ width: "100%" }}>
                      {/* If still loading, or nothing to show */}
                      {loadingFull ? (
                        <div className="no-result-card-programs" style={{ padding: 16 }}>
                          <img
                            src="/images/no-results.png"
                            alt="Loading"
                            className="no-result-icon-programs"
                          />
                          <p className="no-results-programs">Loading uploads…</p>
                        </div>
                      ) : Object.keys(filesMap).length === 0 ? (
                        <div className="no-result-card-programs" style={{ padding: 16 }}>
                          <img
                            src="/images/no-results.png"
                            alt="No results icon"
                            className="no-result-icon-programs"
                          />
                          <p className="no-results-programs">No files uploaded</p>
                        </div>
                      ) : (
                        <>
                          {/* Render Valid ID (always first if present) */}
                          {filesMap.validIDjpg && (
                            <div className="box-container-outer-participant" style={{ width: "100%" }}>
                              <div className="title-remarks-participant">Uploaded Valid ID</div>
                              <div className="box-container-participant-2">
                                {isPdfUrl(filesMap.validIDjpg) ? (
                                  <embed
                                    src={filesMap.validIDjpg}
                                    type="application/pdf"
                                    className="uploaded-pic-participant"
                                  />
                                ) : (
                                  <a
                                    href={filesMap.validIDjpg}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={filesMap.validIDjpg}
                                      alt="Valid ID"
                                      className="participant-img-view uploaded-pic-participant"
                                      style={{ cursor: "pointer" }}
                                    />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Other files */}
                          {Object.entries(filesMap)
                            .filter(([k]) => k !== "validIDjpg")
                            .map(([key, url]) => (
                              <div
                                key={key}
                                className="box-container-outer-participant"
                                style={{ width: "100%" }}
                              >
                                <div className="title-remarks-participant">
                                  {key}
                                </div>
                                <div className="box-container-participant-2">
                                  {isPdfUrl(url) ? (
                                    <embed
                                      src={url}
                                      type="application/pdf"
                                      className="uploaded-pic-participant"
                                    />
                                  ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={url}
                                        alt={key}
                                        className="participant-img-view uploaded-pic-participant"
                                        style={{ cursor: "pointer" }}
                                      />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject reason modal */}
      {showRejectPopup && (
        <div className="reasonfor-recject-popup-overlay">
          <div className="reasonfor-reject-confirmation-popup">
            <h2>Reject Participant</h2>

            <form className="reject-container" onSubmit={(e) => e.preventDefault()}>
              <div className="box-container-outer-reasonforreject">
                <div className="title-remarks-reasonforreject">Reason For Reject</div>
                <div className="box-container-reasonforreject">
                  <textarea
                    className="reasonforreject-input-field"
                    name="reason"
                    id="reason"
                    placeholder="Enter the reason for rejecting the participant..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="reject-reason-yesno-container">
                <button
                  type="button"
                  onClick={() => setShowRejectPopup(false)}
                  className="reject-reason-no-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="reject-reason-yes-button"
                  onClick={handleConfirmReject}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm submit reject modal */}
      {showSubmitRejectPopup && (
        <div className="confirmation-popup-overlay-program-reject">
          <div className="confirmation-popup-program-status">
            <img src="/Images/question.png" alt="question icon" className="successful-icon-popup" />
            <p>Are you sure you want to Submit?</p>
            <div className="yesno-container-add">
              <button onClick={() => setShowSubmitRejectPopup(false)} className="no-button-add">
                No
              </button>
              <button onClick={handleRejectYes} className="yes-button-add">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showToast && (
        <div className="popup-overlay-participant show">
          <div className="popup-participant">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{toastMsg}</p>
          </div>
        </div>
      )}
    </>
  );
}
