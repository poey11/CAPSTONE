"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, storage } from "@/app/db/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type SimpleField = { name: string };

type Resident = {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  mobile?: string;
  emailAddress?: string;              // ✅ only source for email
  verificationFilesURLs?: string[];   // ✅ first URL used as Valid ID
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;

  programId: string;
  programName?: string;

  textFields: SimpleField[];
  fileFields: SimpleField[];

  resident: Resident | null; // null for manual entry

  onSaved: (msg?: string) => void;
  onError?: (msg: string) => void;

  prettyLabels?: Record<string, string>;
};

const DEFAULT_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
};

type Preview = { url: string; isPdf: boolean; isObjectUrl: boolean };

export default function AddWalkInParticipantModal({
  isOpen,
  onClose,
  onBack,
  programId,
  programName = "",
  textFields,
  fileFields,
  resident,
  onSaved,
  onError,
  prettyLabels,
}: Props) {
  const LABELS = prettyLabels || DEFAULT_LABELS;

  // Prefill from resident (if any)
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of textFields || []) init[f.name] = "";

    if (resident) {
      const fullName = `${resident.firstName || ""} ${resident.middleName ? resident.middleName + " " : ""}${resident.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim();
      for (const f of textFields || []) {
        if (f.name === "firstName") init[f.name] = resident.firstName || "";
        else if (f.name === "lastName") init[f.name] = resident.lastName || "";
        else if (f.name === "contactNumber") init[f.name] = resident.contactNumber || resident.mobile || "";
        else if (f.name === "emailAddress") init[f.name] = resident.emailAddress || ""; // ✅ emailAddress only
        else if (f.name === "location") init[f.name] = resident.address || resident.location || "";
        else if (f.name === "fullName") init[f.name] = fullName;
      }
    }
    return init;
  });

  const [formFiles, setFormFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // --- Previews for ALL file fields ---
  const residentValidIdUrl = resident?.verificationFilesURLs?.[0] || "";
  const [filePreviews, setFilePreviews] = useState<Record<string, Preview>>({});
  const previewsRef = useRef<Record<string, Preview>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({}); // custom trigger targets

  useEffect(() => {
    setFilePreviews((old) => {
      const next: Record<string, Preview> = {};
      const fields = (fileFields || []).map((f) => f.name);

      for (const field of fields) {
        const file = formFiles[field];
        if (file) {
          const objURL = URL.createObjectURL(file);
          const isPdf =
            (file.type || "").toLowerCase().includes("pdf") ||
            (file.name || "").toLowerCase().endsWith(".pdf");
          next[field] = { url: objURL, isPdf, isObjectUrl: true };
        } else if (field === "validIDjpg" && residentValidIdUrl) {
          next[field] = {
            url: residentValidIdUrl,
            isPdf: residentValidIdUrl.toLowerCase().includes(".pdf"),
            isObjectUrl: false,
          };
        }
      }

      for (const [k, pv] of Object.entries(old)) {
        const nxt = next[k];
        if (pv.isObjectUrl && (!nxt || nxt.url !== pv.url)) {
          URL.revokeObjectURL(pv.url);
        }
      }

      previewsRef.current = next;
      return next;
    });

    return () => {
      for (const pv of Object.values(previewsRef.current)) {
        if (pv.isObjectUrl) URL.revokeObjectURL(pv.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFiles, residentValidIdUrl, fileFields]);

  const textFieldsToRender = useMemo<SimpleField[]>(
    () => (textFields?.length ? textFields : []),
    [textFields]
  );
  const fileFieldsToRender = useMemo<SimpleField[]>(
    () => (fileFields?.length ? fileFields : []),
    [fileFields]
  );

  const needsValidId = fileFieldsToRender.some((f) => f.name === "validIDjpg");

  const labelFor = (name: string) => LABELS[name] || name;

  const handleFormTextChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFormFileChange = (field: string, inputEl: HTMLInputElement) => {
    const file = inputEl.files?.[0] || null;
    setFormFiles((prev) => ({ ...prev, [field]: file }));
  };

  const validateReqForm = () => {
    for (const f of textFieldsToRender) {
      const val = (formData[f.name] ?? "").toString().trim();
      if (!val) throw new Error(`Please fill out: ${labelFor(f.name)}`);
    }
    for (const f of fileFieldsToRender) {
      const hasManual = !!formFiles[f.name];
      if (!hasManual) {
        if (f.name === "validIDjpg" && residentValidIdUrl) continue; // allow auto-attach
        throw new Error(`Please upload: ${labelFor(f.name)}`);
      }
    }
  };

  // Capacity check (Approved + role: 'Participant')
  const recheckCapacityServer = async () => {
    const partQ = query(
      collection(db, "ProgramsParticipants"),
      where("programId", "==", programId),
      where("approvalStatus", "==", "Approved"),
      where("role", "==", "Participant")
    );
    const countSnap = await getCountFromServer(partQ);
    const currentCount = countSnap.data().count || 0;

    const progSnap = await getDoc(doc(db, "Programs", programId));
    const capacity = Number((progSnap.data() as any)?.participants);
    if (Number.isFinite(capacity) && currentCount >= capacity) {
      throw new Error("Program capacity reached. Cannot add more participants.");
    }
    return progSnap.data() as any;
  };

  const uploadAllFiles = async (uidTag: string) => {
    const urls: Record<string, string> = {};
    const entries = Object.entries(formFiles).filter(([, f]) => !!f) as [string, File][];
    for (const [field, file] of entries) {
      const sref = ref(storage, `Programs/${programId}/walkinUploads/${uidTag}/${Date.now()}-${field}-${file.name}`);
      await uploadBytes(sref, file);
      urls[field] = await getDownloadURL(sref);
    }
    return urls;
  };

  const maybeUploadResidentValidID = async (uidTag: string) => {
    const url = residentValidIdUrl;
    if (!url) return {};
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch resident's Valid ID file.");
    const blob = await res.blob();

    const mime = (blob.type || "").toLowerCase();
    let ext = "jpg";
    if (mime.includes("pdf")) ext = "pdf";
    else if (mime.includes("png")) ext = "png";
    else if (mime.includes("jpeg")) ext = "jpg";
    else if (mime.includes("webp")) ext = "webp";

    const sref = ref(
      storage,
      `Programs/${programId}/walkinUploads/${uidTag}/${Date.now()}-validIDjpg-resident.${ext}`
    );
    await uploadBytes(sref, blob);
    const uploadedUrl = await getDownloadURL(sref);
    return { validIDjpg: uploadedUrl } as Record<string, string>;
  };

  const submit = async () => {
    if (!programId) return;
    setSaving(true);
    try {
      validateReqForm();

      const progRef = doc(db, "Programs", programId);
      const progSnap = await getDoc(progRef);
      if (!progSnap.exists()) throw new Error("Program not found.");
      const statusNow = (progSnap.data()?.progressStatus || "").toString().toLowerCase();
      if (["rejected", "completed"].includes(statusNow)) {
        throw new Error(`This program is ${progSnap.data()?.progressStatus}. You can’t add participants.`);
      }

      if (resident?.id) {
        const dupQ = query(
          collection(db, "ProgramsParticipants"),
          where("programId", "==", programId),
          where("residentId", "==", resident.id)
        );
        const dupSnap = await getDocs(dupQ);
        if (!dupSnap.empty) throw new Error("This resident is already enlisted in this program.");
      }

      await recheckCapacityServer();

      const firstName = formData.firstName ?? (resident ? resident.firstName || "" : "");
      const lastName = formData.lastName ?? (resident ? resident.lastName || "" : "");
      const contactNumber = formData.contactNumber ?? (resident ? resident.contactNumber || resident.mobile || "" : "");
      const emailAddress = formData.emailAddress ?? (resident ? resident.emailAddress || "" : ""); // ✅ only emailAddress
      const location = formData.location ?? (resident ? resident.address || resident.location || "" : "");
      const fullName =
        (formData.fullName ||
          `${firstName || ""} ${lastName || ""}`.trim()) || "";

      const uidTag = resident?.id ? `resident-${resident.id}` : "manual";
      let uploadedFiles = await uploadAllFiles(uidTag);

      if (needsValidId && !uploadedFiles.validIDjpg && residentValidIdUrl) {
        const autoFiles = await maybeUploadResidentValidID(uidTag);
        uploadedFiles = { ...uploadedFiles, ...autoFiles };
      }

      await addDoc(collection(db, "ProgramsParticipants"), {
        programId,
        programName: progSnap.data()?.programName || programName || "",
        residentId: resident?.id || null,
        role: "Participant",
        approvalStatus: "Approved",
        addedVia: resident?.id ? "walk-in-resident" : "walk-in-manual",
        createdAt: serverTimestamp(),

        fullName,
        firstName: firstName || "",
        lastName: lastName || "",
        contactNumber: contactNumber || "",
        emailAddress: emailAddress || "",
        location: location || "",

        fields: formData,
        files: uploadedFiles,
      });

      onSaved?.("Participant added successfully!");
      onClose();
    } catch (e: any) {
      onError?.(e?.message || "Failed to add participant. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;




  return (
    <>
      <div className="program-popup-overlay">
        <div className="program-popup">
          <div className="walkin-participant-backbutton-container">
                <button onClick={onBack}>
                  <img src="/images/left-arrow.png" alt="Left Arrow" className="participant-back-btn-resident" />
                </button>
              </div>    

            <h2> {resident ? "Complete Requirements" : "Manual Entry"} </h2>
            <h1>* Walk-in Participant Application *</h1>


        <div className="walkin-participant-header-body-bottom-section">
              <div className="walkin-participant-user-info-main-container">
                <div className="walkin-participant-info-main-content">
                  <nav className="walkin-info-toggle-wrapper">
                    {["details", "reqs"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section as "details" | "reqs")}
                      >
                        {section === "details" && "Details"}
                        {section === "reqs" && "Requirements"}
                      </button>
                    ))}
                  </nav>

                  {activeSection === "details" && (
                    <>
                      
                      <div className="walkin-details-section">
                        {/* Left column */}
                        <div className="walkin-content-left-side">
                          {textFieldsToRender
                            .filter((_, idx) => idx % 2 === 0) // even indexes go left
                            .map((f) => {
                              const name = f.name;
                              const lower = name.toLowerCase();
                              const type =
                                lower.includes("email") ? "email" :
                                lower.includes("contact") || lower.includes("phone") ? "tel" :
                                "text";
                              
                               // Format: capitalize first + add space before uppercase letters
                                const formattedLabel = name
                                  .replace(/([A-Z])/g, " $1")   // add space before capital letters
                                  .replace(/^./, (s) => s.toUpperCase()); // capitalize first letter

                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {formattedLabel} <span className="required">*</span>
                                  </p>
                                  <input
                                    type={type}
                                    className="walkin-input-field"
                                    required
                                    value={formData[name] || ""}
                                    onChange={(e) => handleFormTextChange(name, e.target.value)}
                                    placeholder={`Enter ${formattedLabel}`}
                                  />
                                </div>
                              );
                            })}
                        </div>

                        {/* Right column */}
                        <div className="walkin-content-right-side">
                          {textFieldsToRender
                            .filter((_, idx) => idx % 2 !== 0) // odd indexes go right
                            .map((f) => {
                              const name = f.name;
                              const lower = name.toLowerCase();
                              const type =
                                lower.includes("email") ? "email" :
                                lower.includes("contact") || lower.includes("phone") ? "tel" :
                                "text";
                               // Format: capitalize first + add space before uppercase letters
                                const formattedLabel = name
                                  .replace(/([A-Z])/g, " $1")   // add space before capital letters
                                  .replace(/^./, (s) => s.toUpperCase()); // capitalize first letter


                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {formattedLabel} <span className="required">*</span>
                                  </p>
                                  <input
                                    type={type}
                                    className="walkin-input-field"
                                    required
                                    value={formData[name] || ""}
                                    onChange={(e) => handleFormTextChange(name, e.target.value)}
                                    placeholder={`Enter ${formattedLabel}`}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>

                    </>
                  )}

                  {activeSection === "reqs" && (
                    <>
                      <div className="walkin-requirements-section">
                        {fileFieldsToRender.map((f, idx) => {
                          const name = f.name;
                          const isValidId = name === "validIDjpg";
                          // Format: capitalize first + add space before uppercase letters
                          const formattedLabel = name
                            // 1. Remove "jpg" or other extensions at the end
                            .replace(/jpg$/i, "")
                            .replace(/jpeg$/i, "")
                            .replace(/png$/i, "")
                            .replace(/pdf$/i, "")
                            // 2. Insert spaces correctly
                            .replace(/([a-z])([A-Z])/g, "$1 $2")
                            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
                            // 3. Capitalize first letter
                            .replace(/^./, (s) => s.toUpperCase())
                            // 4. Ensure "Id" → "ID"
                            .replace(/\bId\b/g, "ID");

                          const preview = filePreviews[name];

                          const hasManual = !!formFiles[name];
                          const statusText = hasManual
                            ? formFiles[name]?.name || "File selected"
                            : isValidId && !!residentValidIdUrl
                            ? "Auto-attached from resident"
                            : "No file chosen";

                          return (
                            <div
                              key={`ff-${name}`}
                              className="box-container-outer-photosprogram"
                              style={{
                                flex: fileFieldsToRender.length === 1 ? "0 0 40%" : "0 0 calc(50% - 20px)",
                                display: "flex",
                                justifyContent: fileFieldsToRender.length === 1 ? "center" : "flex-start",
                              }}
                            >
                              <div className="title-walkin-requirements">
                                {formattedLabel}
                              </div>

                              <div className="box-container-resindentificationpic">
                                {/* File Upload Section */}
                                <div className="file-upload-container">
                                  <label
                                    htmlFor={`file-${name}`}
                                    className="upload-link"
                                    style={{ cursor: "pointer" }}
                                  >
                                    {hasManual ? "Replace File" : "Click to Upload File"}
                                  </label>

                                  <input
                                    ref={(el) => { fileInputRefs.current[name] = el; }}
                                    id={`file-${name}`}
                                    type="file"
                                    className="file-upload-input"
                                    accept="image/*,application/pdf,.pdf"
                                    onChange={(e) => handleFormFileChange(name, e.currentTarget)}
                                    style={{ display: "none" }}
                                  />

                                  {/* File Selected */}
                                  {hasManual && formFiles[name] && (
                                    <div className="file-name-image-display">
                                      <div className="file-name-image-display-indiv">
                                        {preview?.url && !preview.isPdf && (
                                          <img
                                            src={preview.url}
                                            alt="Preview"
                                            style={{ width: "50px", height: "50px", marginRight: "5px" }}
                                          />
                                        )}
                                        <span>{formFiles[name]?.name}</span>
                                        
                                      </div>
                                    </div>
                                  )}

                                  {/* Auto-attach notice */}
                                  {isValidId && !!residentValidIdUrl && !hasManual && (
                                    <small style={{ display: "block", marginTop: 6, opacity: 0.8 }}>
                                      A resident Valid ID will be auto-attached.
                                    </small>
                                  )}


                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>


                    </>
                  )}

                    
              
                </div>
              </div>
    
    
        </div>


        <div className="action-btn-section-verify-section-participant">
                <div className="action-btn-section-verify">
                  <button className="participant-action-reject" onClick={onClose} disabled={saving}>
                    Cancel
                  </button>
                  <button className="participant-action-accept" onClick={submit} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>



            </div>

            
      </div>      
    </>
  );
}
