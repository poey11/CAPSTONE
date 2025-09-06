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
  location?: string;
  address?: string;
  programName?: string;
  idImageUrl?: string; // legacy single-ID field
  role?: string;
};

type SimpleField = { name: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  onSave?: (updated: Participant) => void;
  onApprove?: (participantId: string) => void;
  onReject?: (participantId: string, reason: string) => void;
};

const PRETTY_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
  dateOfBirth: "Date of Birth",
  age: "Age",
};

// helper: compute age from YYYY-MM-DD
function computeAgeFromDOB(dobYMD?: string): number | null {
  if (!dobYMD || !/^\d{4}-\d{2}-\d{2}$/.test(dobYMD)) return null;
  const [y, m, d] = dobYMD.split("-").map(Number);
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const mDiff = now.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age <= 200 ? age : null;
}

export default function ViewApprovedParticipantModal({
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

  // Program requirements (dynamic fields to display)
  const [reqTextFields, setReqTextFields] = useState<SimpleField[]>([]);
  const [reqFileFields, setReqFileFields] = useState<SimpleField[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

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

  // Load program requirements (textFields/fileFields) using programId from fullDoc
  useEffect(() => {
    const loadReqs = async () => {
      if (!fullDoc?.programId) {
        setReqTextFields([]);
        setReqFileFields([]);
        return;
      }
      setLoadingReqs(true);
      try {
        const pSnap = await getDoc(doc(db, "Programs", fullDoc.programId));
        if (pSnap.exists()) {
          const data = pSnap.data() as any;
          const tfs: SimpleField[] = Array.isArray(data?.requirements?.textFields)
            ? data.requirements.textFields
            : [];
          const ffs: SimpleField[] = Array.isArray(data?.requirements?.fileFields)
            ? data.requirements.fileFields
            : [];
          setReqTextFields(tfs);
          setReqFileFields(ffs);
        } else {
          setReqTextFields([]);
          setReqFileFields([]);
        }
      } catch {
        setReqTextFields([]);
        setReqFileFields([]);
      } finally {
        setLoadingReqs(false);
      }
    };
    loadReqs();
  }, [fullDoc?.programId]);

  const labelFor = (name: string) => PRETTY_LABELS[name] || name;

  // Derived display data (emailAddress preferred, bring top-level + fields)
  const fieldsMap: Record<string, any> = useMemo(() => {
    const base = (fullDoc?.fields || {}) as Record<string, any>;
    const top: Record<string, any> = {
      firstName: fullDoc?.firstName,
      lastName: fullDoc?.lastName,
      contactNumber: fullDoc?.contactNumber,
      emailAddress: fullDoc?.emailAddress ?? participant?.emailAddress ?? "",
      location: fullDoc?.location ?? fullDoc?.address,
      programName: fullDoc?.programName,
      role: fullDoc?.role ?? participant?.role ?? "",
      fullName: fullDoc?.fullName ?? participant?.fullName ?? "",
      dateOfBirth: fullDoc?.dateOfBirth ?? base?.dateOfBirth ?? "",
      computedAge: typeof fullDoc?.computedAge === "number" ? fullDoc.computedAge : undefined,
    };
    return { ...base, ...top };
  }, [fullDoc, participant?.emailAddress, participant?.role, participant?.fullName]);

  const roleValue = (fieldsMap.role || "") as string;
  const isVolunteer = roleValue?.trim().toLowerCase() === "volunteer";

  // For Volunteers, allow only PRETTY text fields (excluding file keys and derived "age")
  const PRETTY_TEXT_KEYS_SET = useMemo(() => {
    const keys = Object.keys(PRETTY_LABELS).filter(
      (k) => k !== "validIDjpg" && k !== "age"
    );
    return new Set(keys);
  }, []);

  // DOB + Age derived values
  const dobValue: string = (fieldsMap.dateOfBirth || "").toString();
  const ageFromDOB = computeAgeFromDOB(dobValue);
  const ageValue: string =
    typeof fieldsMap.computedAge === "number"
      ? String(fieldsMap.computedAge)
      : (ageFromDOB != null ? String(ageFromDOB) : "");

  // Files map with legacy support. We'll render by program order later.
  const filesMap: Record<string, string> = useMemo(() => {
    const map = { ...(fullDoc?.files || {}) } as Record<string, string>;
    // legacy support: top-level idImageUrl
    if (fullDoc?.idImageUrl && !map.validIDjpg) {
      map.validIDjpg = fullDoc.idImageUrl;
    }
    return map;
  }, [fullDoc]);

  // Build ordered text fields to show: program-defined order; if none, fallback to common fields
  const orderedTextNames: string[] = useMemo(() => {
    if (reqTextFields.length > 0) return reqTextFields.map((f) => f.name);
    // fallback order if program has no config (include DOB if present)
    const base = ["firstName", "lastName", "contactNumber", "emailAddress", "location"];
    if (dobValue) base.push("dateOfBirth");
    return base;
  }, [reqTextFields, dobValue]);

  // Filter text fields if Volunteer (only PRETTY labels)
  const filteredTextNames: string[] = useMemo(() => {
    if (!isVolunteer) return orderedTextNames;
    // Keep only those that exist in PRETTY labels (text) or the special dateOfBirth
    return orderedTextNames.filter(
      (name) => PRETTY_TEXT_KEYS_SET.has(name) || name === "dateOfBirth"
    );
  }, [orderedTextNames, PRETTY_TEXT_KEYS_SET, isVolunteer]);

  // Build ordered file keys to show: program-defined first (keeping any present), then any extras (alpha)
  const orderedFileNames: string[] = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    // If program specifies order, use it first
    for (const f of reqFileFields) {
      if (filesMap[f.name]) {
        out.push(f.name);
        seen.add(f.name);
      }
    }
    // Ensure validIDjpg is first if present and not already
    if (filesMap.validIDjpg && !seen.has("validIDjpg")) {
      out.unshift("validIDjpg");
      seen.add("validIDjpg");
    }
    // Add any other uploaded file keys not listed, alphabetically
    Object.keys(filesMap)
      .filter((k) => !seen.has(k))
      .sort((a, b) => a.localeCompare(b))
      .forEach((k) => out.push(k));
    return out;
  }, [reqFileFields, filesMap]);

  // Filter files if Volunteer (only Valid ID)
  const filteredFileNames: string[] = useMemo(() => {
    if (!isVolunteer) return orderedFileNames;
    return orderedFileNames.filter((k) => k === "validIDjpg");
  }, [orderedFileNames, isVolunteer]);

  const isPdfUrl = (url: string) => url?.toLowerCase().includes(".pdf");

  if (!isOpen || !participant) return null;

  return (
    <>
      <div className="participants-view-popup-overlay add-incident-animated">
        <div className="view-barangayuser-popup">
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
                    {tab === "details" ? "Details" : "Requirements"}
                  </button>
                ))}
              </div>
            </div>

            <div className="view-participant-header-body-bottom-section">
              <div className="view-participant-user-info-main-container">
                <div className="view-participant-info-main-content">
                  {activeTab === "details" && (
                    <div style={{ width: "100%", padding: "20px 0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                        <div className="view-participant-fields-section">
                          <p>Program Name</p>
                          <input
                            type="text"
                            className="view-participant-input-field"
                            value={fieldsMap.programName ?? fullDoc?.programName ?? ""}
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

                      {loadingReqs ? (
                        <div style={{ padding: 16, opacity: 0.8 }}>Loading fields…</div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          {filteredTextNames.map((name) => {
                            // Special rendering for dateOfBirth: show DOB + Age
                            if (name === "dateOfBirth") {
                              return (
                                <React.Fragment key="dob-special">
                                  <div className="view-participant-fields-section">
                                    <p>{labelFor("dateOfBirth")}</p>
                                    <input
                                      type="text"
                                      className="view-participant-input-field"
                                      value={dobValue || ""}
                                      readOnly
                                    />
                                  </div>
                                  <div className="view-participant-fields-section">
                                    <p>{labelFor("age")}</p>
                                    <input
                                      type="text"
                                      className="view-participant-input-field"
                                      value={ageValue}
                                      readOnly
                                    />
                                  </div>
                                </React.Fragment>
                              );
                            }

                            // Generic field rendering
                            const formattedLabel = PRETTY_LABELS[name]
                              ? PRETTY_LABELS[name]
                              : name
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (s) => s.toUpperCase());
                            const v = (fieldsMap[name] ?? "").toString();

                            return (
                              <div key={`tf-${name}`} className="view-participant-fields-section">
                                <p>{formattedLabel}</p>
                                <input
                                  type={
                                    name.toLowerCase().includes("email")
                                      ? "email"
                                      : name.toLowerCase().includes("contact") || name.toLowerCase().includes("phone")
                                      ? "tel"
                                      : "text"
                                  }
                                  className="view-participant-input-field"
                                  value={v}
                                  readOnly
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "reqs" && (
                    <div className="participant-uploaded-photo-section" style={{ width: "100%" }}>
                      {loadingFull ? (
                        <div className="no-result-card-programs" style={{ padding: 16 }}>
                          <img src="/images/no-results.png" alt="Loading" className="no-result-icon-programs" />
                          <p className="no-results-programs">Loading uploads…</p>
                        </div>
                      ) : (isVolunteer ? filteredFileNames : Object.keys(filesMap)).length === 0 ? (
                        <div className="no-result-card-programs" style={{ padding: 16 }}>
                          <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-programs" />
                          <p className="no-results-programs">No files uploaded</p>
                        </div>
                      ) : (
                        <>
                          {(isVolunteer ? filteredFileNames : orderedFileNames).map((key) => {
                            const url = filesMap[key];
                            if (!url) return null;
                            const label = labelFor(key);
                            const isPdf = isPdfUrl(url);

                            return (
                              <div key={key} className="box-container-outer-participant" style={{ width: "100%" }}>
                                <div className="title-remarks-participant">
                                  {key === "validIDjpg" ? "Uploaded Valid ID" : label}
                                </div>
                                <div className="box-container-participant-2">
                                  {isPdf ? (
                                    <embed src={url} type="application/pdf" className="uploaded-pic-participant" />
                                  ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={url}
                                        alt={label}
                                        className="participant-img-view uploaded-pic-participant"
                                        style={{ cursor: "pointer" }}
                                      />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
    </>
  );
}
