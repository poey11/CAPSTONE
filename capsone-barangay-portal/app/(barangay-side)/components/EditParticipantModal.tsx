"use client";
import React, { useEffect, useMemo, useState } from "react";

type Participant = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string; // kept to match your table
  email?: string;        // optional alias
  location?: string;     // "Home Address"
  address?: string;      // optional alias
  programName?: string;
  idImageUrl?: string;   // for the Requirements tab preview
};

type Props = {
  isOpen: boolean;
  onClose: () => void;

  participant: Participant | null;

  /** Called when user clicks Save. You’ll get the edited participant object back. */
  onSave?: (updated: Participant) => void;

  /** Called when user clicks Approve. */
  onApprove?: (participantId: string) => void;

  /** Called when user confirms rejection, with reason text. */
  onReject?: (participantId: string, reason: string) => void;
};

export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  onSave,
  onApprove,
  onReject,
}: Props) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"details" | "reqs">("details");

  // Local editable state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail]         = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [programName, setProgramName] = useState("");

  // Reject popups state
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Little success toast (reuse your classes)
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Simple field validation styles
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Sync incoming participant → local editable fields
  useEffect(() => {
    if (!participant) return;
    // Derive first/last if only fullName is present
    const derivedFirst =
      participant.firstName ??
      (participant.fullName ? participant.fullName.split(" ").slice(0, -1).join(" ") : "");
    const derivedLast =
      participant.lastName ??
      (participant.fullName ? participant.fullName.split(" ").slice(-1).join(" ") : "");

    setFirstName(derivedFirst || "");
    setLastName(derivedLast || "");
    setContactNumber(participant.contactNumber || "");
    setEmail(participant.emailAddress || participant.email || "");
    setHomeAddress(participant.location || participant.address || "");
    setProgramName(participant.programName || "");
    setActiveTab("details");
    setErrors({});
    setRejectReason("");
    setShowRejectPopup(false);
    setShowSubmitRejectPopup(false);
  }, [participant, isOpen]);

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!firstName.trim()) e.firstName = true;
    if (!lastName.trim()) e.lastName = true;
    if (!contactNumber.trim()) e.contactNumber = true;
    if (!email.trim()) e.email = true;
    if (!homeAddress.trim()) e.homeAddress = true;
    if (!programName.trim()) e.programName = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApprove = () => {
    if (!participant) return;
    onApprove?.(participant.id);
    setToastMsg("Participant approved.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleRejectClick = () => {
    setRejectReason("");
    setShowRejectPopup(true);
  };

  const handleConfirmReject = () => {
    // open confirmation modal
    if (!rejectReason.trim()) {
      // light inline validation
      setToastMsg("Please enter a reason before submitting.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    setShowSubmitRejectPopup(true);
  };

  const handleRejectYes = () => {
    if (!participant) return;
    onReject?.(participant.id, rejectReason.trim());
    setShowSubmitRejectPopup(false);
    setShowRejectPopup(false);
    setToastMsg("Reason for Rejection submitted successfully!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
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
                  {activeTab === "details" && (
                    <>
                      <div className="view-participant-user-content-left-side">
                        <div className="view-participant-fields-section">
                          <p>Last Name</p>
                          <input
                            type="text"
                            className={`view-participant-input-field ${
                              errors.lastName ? "error" : ""
                            }`}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Contact Number</p>
                          <input
                            type="tel"
                            className={`view-participant-input-field ${
                              errors.contactNumber ? "error" : ""
                            }`}
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Home Address</p>
                          <input
                            type="text"
                            className={`view-participant-input-field ${
                              errors.homeAddress ? "error" : ""
                            }`}
                            value={homeAddress}
                            onChange={(e) => setHomeAddress(e.target.value)}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Program Name</p>
                          <input
                            type="text"
                            className={`view-participant-input-field ${
                              errors.programName ? "error" : ""
                            }`}
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="view-participant-user-content-right-side">
                        <div className="view-participant-fields-section">
                          <p>First Name</p>
                          <input
                            type="text"
                            className={`view-participant-input-field ${
                              errors.firstName ? "error" : ""
                            }`}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            readOnly
                          />
                        </div>

                        <div className="view-participant-fields-section">
                          <p>Email</p>
                          <input
                            type="email"
                            className={`view-participant-input-field ${
                              errors.email ? "error" : ""
                            }`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "reqs" && (
                    <>
                      <div className="participant-uploaded-photo-section">
                        <div className="box-container-outer-participant">
                          <div className="title-remarks-participant">Uploaded Valid ID</div>
                          <div className="box-container-participant-2">
                            {participant.idImageUrl ? (
                              <a
                                href={participant.idImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={participant.idImageUrl}
                                  alt="Verification Requirement"
                                  className="participant-img-view uploaded-pic-participant"
                                  style={{ cursor: "pointer" }}
                                />
                              </a>
                            ) : (
                              <div className="no-result-card-programs" style={{ padding: 16 }}>
                                <img
                                  src="/images/no-results.png"
                                  alt="No results icon"
                                  className="no-result-icon-programs"
                                />
                                <p className="no-results-programs">No ID uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Room for more requirement blocks if you add them later */}
                    </>
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
                    placeholder="Enter the reason for rejecting the participant (e.g., incomplete requirements, invalid information, duplicate registration)..."
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
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to Submit? </p>
            <div className="yesno-container-add">
              <button
                onClick={() => setShowSubmitRejectPopup(false)}
                className="no-button-add"
              >
                No
              </button>
              <button onClick={handleRejectYes} className="yes-button-add">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / small toast popup */}
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
