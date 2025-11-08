"use client";
import "@/CSS/OfficialsModuleBarangdaySide/editOfficialOfficer.css";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/app/db/firebase";
import { useSession } from "next-auth/react";

type OfficialDoc = {
  id?: string;           // userId link if present
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  facebook?: string;
  facebookLink?: string;
  contact?: string;
  phone?: string;
  email?: string;
  position?: string;
  department?: string;
  term?: string;
  image?: string;        // displayed photo (what your list likely uses)
};

export default function EditOfficial() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const officialId = searchParams.get("id") as string | null;
  const router = useRouter();

  // Single editing model (comes from DisplayedOfficials first, then possibly overwritten by BarangayUsers)
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialDoc | null>(null);

  // Keep a copy for "Discard"
  const [originalOfficialData, setOriginalOfficialData] = useState<OfficialDoc | null>(null);

  // Link (if DisplayedOfficials has an `id` field)
  const [linkedUserId, setLinkedUserId] = useState<string>("");

  // UI state
  const [activeSection, setActiveSection] = useState<"details" | "others">("details");
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  // Image selection & preview
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);

  // Term update (YYYY-MM-DD date input)
  const [updateTerm, setUpdateTerm] = useState<string>("");

  // Popups & validation
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Snapshots
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!officialId) return;

    const displayedRef = doc(db, "DisplayedOfficials", officialId);
    const unsubDisplayed = onSnapshot(displayedRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as OfficialDoc;

      // Build an initial, best-effort editing object
      const merged: OfficialDoc = {
        ...data,
        // fallback name from parts if name missing
        name:
          data.name ||
          [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") ||
          "",
        facebook: data.facebook ?? data.facebookLink ?? "",
        contact: data.contact ?? data.phone ?? "",
        email: data.email ?? "",
        position: data.position ?? "",
        department: data.department ?? "",
        term: data.term ?? "",
        image: data.image ?? "",
      };

      setSelectedOfficial((prev) => ({ ...(prev ?? {}), ...merged }));
      setOriginalOfficialData((prev) => prev ?? merged); // keep first load as original
      setLinkedUserId(data.id || "");
      // Prefer existing displayed image for initial preview
      if (data.image) setIdentificationPreview((p) => p ?? data.image!);
    });

    return () => unsubDisplayed();
  }, [officialId]);

  // If linked, also watch the BarangayUsers doc. We merge what we learn,
  // but we **never** drop the image if DisplayedOfficials had one.
  useEffect(() => {
    if (!linkedUserId) return;

    const userRef = doc(db, "BarangayUsers", linkedUserId);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as OfficialDoc;

      setSelectedOfficial((prev) => {
        const next: OfficialDoc = {
          ...(prev ?? {}),
          name:
            data.name ||
            prev?.name ||
            [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") ||
            "",
          facebook: data.facebook ?? prev?.facebook ?? data.facebookLink ?? "",
          contact: data.contact ?? prev?.contact ?? data.phone ?? "",
          email: data.email ?? prev?.email ?? "",
          position: data.position ?? prev?.position ?? "",
          department: data.department ?? prev?.department ?? "",
          term: data.term ?? prev?.term ?? "",
          // keep whichever image is present; prefer the user's image only if present
          image: data.image ?? prev?.image ?? "",
        };
        // keep preview if we have one; otherwise adopt user's image if available
        if (!identificationPreview && next.image) {
          setIdentificationPreview(next.image);
        }
        return next;
      });
    });

    return () => unsubUser();
  }, [linkedUserId]); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────────
  const validateAndConfirm = () => {
    if (!selectedOfficial) return false;


    const hasChanges =
    JSON.stringify(selectedOfficial) !== JSON.stringify(originalOfficialData) ||
    identificationFile ||
    updateTerm;

  if (!hasChanges) {
    setErrorMessage("No changes were made.");
    setShowErrorPopup(true);
    setShowSubmitPopup(false);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return false;
  }


    const newInvalid: string[] = [];
    const isLinked = !!linkedUserId;

    // Only validate editable fields when not linked
    if (!isLinked) {
      if (!selectedOfficial.name?.trim()) newInvalid.push("name");
      if (!selectedOfficial.facebook?.trim()) newInvalid.push("facebook");
      if (!selectedOfficial.contact?.trim()) newInvalid.push("contact");
      if (!selectedOfficial.email?.trim()) newInvalid.push("email");
    }

    if (newInvalid.length) {
      setInvalidFields(newInvalid);
      setErrorMessage("Please fill in all required fields.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return false;
    }

    // Additional phone/email validation (only when editable)
    if (!isLinked) {
      const phoneRegex = /^09\d{9}$/;
      if (selectedOfficial.contact && !phoneRegex.test(selectedOfficial.contact)) {
        setInvalidFields(["contact"]);
        setErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return false;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (selectedOfficial.email && !emailRegex.test(selectedOfficial.email)) {
        setInvalidFields(["email"]);
        setErrorMessage("Invalid email address. Format: example@domain.com");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return false;
      }
    }

    setInvalidFields([]);
    setShowSubmitPopup(true);
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Upload & Save
  // ─────────────────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!officialId || !selectedOfficial) return;
    setShowSubmitPopup(false);

    // Compute term text if user selected a start date
    let termFormatted = selectedOfficial.term ?? "";
    if (updateTerm) {
      const startYear = new Date(updateTerm).getFullYear();
      const endYear = startYear + 3;
      termFormatted = `${startYear} - ${endYear}`;
    }

    const audit = {
      updatedBy: user?.fullName || "Unknown",
      updatedAt: new Date().toLocaleString(),
    };

    // 1) Upload new image if a file is chosen
    let newImageUrl: string | undefined;
    try {
      if (identificationFile) {
        // best-effort delete of old image
        try {
          if (selectedOfficial.image) {
            const oldRef = ref(storage, selectedOfficial.image); // works with full download URL (same bucket)
            await deleteObject(oldRef);
          }
        } catch (_) {
          // Ignore delete errors
        }

        // Upload new file
        const storagePath = `officialPictures/${officialId}/${identificationFile.name}`;
        const storageRefObj = ref(storage, storagePath);
        await uploadBytes(storageRefObj, identificationFile);
        newImageUrl = await getDownloadURL(storageRefObj);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMessage("There was an error uploading the image.");
      setShowErrorPopup(true);
      return;
    }

    // 2) Build payloads
    const commonFields: Partial<OfficialDoc> = {
      ...(termFormatted ? { term: termFormatted } : {}),
      ...(newImageUrl ? { image: newImageUrl } : {}),
    };

    try {
      // Always update DisplayedOfficials so the public/list photo changes
      const displayedRef = doc(db, "DisplayedOfficials", officialId);
      await updateDoc(displayedRef, {
        ...commonFields,
        ...audit,
        // If you want the public card to reflect these too, include them:
        ...(selectedOfficial.name ? { name: selectedOfficial.name } : {}),
        ...(selectedOfficial.facebook ? { facebook: selectedOfficial.facebook } : {}),
        ...(selectedOfficial.contact ? { contact: selectedOfficial.contact } : {}),
        ...(selectedOfficial.email ? { email: selectedOfficial.email } : {}),
      } as any);

      // If linked, keep the user record in sync for image/term (+ optional fields)
      if (linkedUserId) {
        const userRef = doc(db, "BarangayUsers", linkedUserId);
        await updateDoc(userRef, {
          ...commonFields,
          ...audit,
          ...(selectedOfficial.name ? { name: selectedOfficial.name } : {}),
          ...(selectedOfficial.facebook ? { facebook: selectedOfficial.facebook } : {}),
          ...(selectedOfficial.contact ? { contact: selectedOfficial.contact } : {}),
          ...(selectedOfficial.email ? { email: selectedOfficial.email } : {}),
        } as any);
      }

      // Update local preview to the new URL if we uploaded
      if (newImageUrl) setIdentificationPreview(newImageUrl);

      setPopupMessage("Official details updated successfully!");
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        router.push("/dashboard/OfficialsModule");
      }, 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage("There was an error updating the official.");
      setShowErrorPopup(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // UI Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleBack = () => {
    window.location.href = "/dashboard/OfficialsModule";
  };

  const handleDiscardClick = () => setShowDiscardPopup(true);

  const handleIdentificationFileDelete = () => {
    setIdentificationFile(null);
    // keep current saved photo as preview instead of blanking it
    setIdentificationPreview(selectedOfficial?.image ?? null);
  };

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdentificationFile(file);
    setIdentificationPreview(URL.createObjectURL(file)); // local preview
  };

  const safe = <T,>(v: T | undefined | null, fallback: T): T => (v ?? fallback);

  return (
    <main className="edit-official-main-container">
      <div className="edit-official-main-content">
        <div className="edit-official-main-section1">
          <div className="edit-official-main-section1-left">
            <button onClick={handleBack}>
              <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1>Edit Official</h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-save" type="button" onClick={validateAndConfirm}>Save</button>
          </div>
        </div>

        <div className="edit-official-bottom-section">
          <nav className="edit-official-info-toggle-wrapper">
            {(["details", "others"] as const).map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section === "details" ? "Details" : "Others"}
              </button>
            ))}
          </nav>

          <div className="edit-official-bottom-section-scroll">
            <form className="edit-official-section-2" onSubmit={(e) => e.preventDefault()}>
              {activeSection === "details" && (
                <>
                  <div className="edit-official-section-2-full-top">
                    <div className="edit-official-section-2-left-side">
                      <div className="fields-section-official">
                        <p>Full Name<span className="required">*</span></p>
                        <input
                          type="text"
                          value={safe(selectedOfficial?.name, "")}
                          placeholder="Full name"
                          className="edit-official-input-field"
                          onChange={(e) => setSelectedOfficial(o => ({ ...(o ?? {}), name: e.target.value }))}
                          disabled={!!linkedUserId}
                        />
                      </div>

                      <div className="fields-section-official">
                        <p>Facebook<span className="required">*</span></p>
                        <input
                          type="text"
                          value={safe(selectedOfficial?.facebook, "")}
                          placeholder="Facebook link/handle"
                          onChange={(e) => setSelectedOfficial(o => ({ ...(o ?? {}), facebook: e.target.value }))}
                          className="edit-official-input-field"
                          disabled={!!linkedUserId}
                        />
                      </div>

                      <div className="fields-section-official">
                        <p>Contact Number<span className="required">*</span></p>
                        <input
                          type="text"
                          value={safe(selectedOfficial?.contact, "")}
                          placeholder="0917XXXXXXX"
                          onChange={(e) => setSelectedOfficial(o => ({ ...(o ?? {}), contact: e.target.value }))}
                          disabled={!!linkedUserId}
                          className="edit-official-input-field"
                        />
                      </div>
                    </div>

                    <div className="edit-official-section-2-right-side">
                      <div className="fields-section-official">
                        <p>Position<span className="required">*</span></p>
                        <input
                          type="text"
                          className="edit-official-input-field"
                          name="position"
                          value={safe(selectedOfficial?.position, "")}
                          readOnly
                          disabled={!!linkedUserId}
                        />
                      </div>

                      {selectedOfficial?.position === "LF Staff" && (
                        <div className="fields-section-official">
                          <p>Department<span className="required">*</span></p>
                          <input
                            type="text"
                            value={safe(selectedOfficial?.department, "")}
                            readOnly
                            disabled={!!linkedUserId}
                            className="edit-official-input-field"
                          />
                        </div>
                      )}

                      <div className="fields-section-official">
                        <p>Current Term Duration<span className="required">*</span></p>
                        <input
                          type="text"
                          className="edit-official-input-field"
                          name="term"
                          value={safe(selectedOfficial?.term, "")}
                          readOnly
                          disabled={!!linkedUserId}
                        />
                      </div>

                      <div className="fields-section-official">
                        <p>Update Term Duration</p>
                        <input
                          type="date"
                          className="edit-official-input-field"
                          min={new Date().toISOString().split("T")[0]}
                          name="updateTerm"
                          value={updateTerm}
                          onChange={(e) => setUpdateTerm(e.target.value)}
                        />
                      </div>

                      <div className="fields-section-official">
                        <p>Email Address<span className="required">*</span></p>
                        <input
                          type="text"
                          disabled={!!linkedUserId}
                          value={safe(selectedOfficial?.email, "")}
                          placeholder="example@domain.com"
                          onChange={(e) => setSelectedOfficial(o => ({ ...(o ?? {}), email: e.target.value }))}
                          className="edit-official-input-field"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "others" && (
                <div className="edit-official-others-mainsection">
                  <div className="box-container-outer-resindentificationpic">
                    <div className="title-resindentificationpic">Identification Picture</div>

                    <div className="box-container-resindentificationpic">
                      <div className="identificationpic-container">
                        <label htmlFor="identification-file-upload" className="upload-link">
                          Click to Upload File
                        </label>
                        <input
                          id="identification-file-upload"
                          type="file"
                          className="file-upload-input"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleIdentificationFileChange}
                        />

                        {(identificationFile || identificationPreview) && (
                          <div className="identificationpic-display">
                            <div className="identification-picture">
                              {identificationPreview && (
                                <img src={identificationPreview} alt="Preview" style={{ height: "200px" }} />
                              )}
                            </div>
                          </div>
                        )}

                        {(identificationFile || identificationPreview) && (
                          <div className="delete-container">
                            <button
                              type="button"
                              onClick={handleIdentificationFileDelete}
                              className="delete-button"
                            >
                              <img src="/Images/trash.png" alt="Delete" className="delete-icon" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {showSubmitPopup && (
        <div className="addbrgyofficial-confirmation-popup-overlay">
          <div className="addbrgyofficial-confirmation-popup">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to submit?</p>
            <div className="barangay-official-yesno-container">
              <button onClick={() => setShowSubmitPopup(false)} className="addbrgyofficial-no-button">No</button>
              <button onClick={handleUpload} className="addbrgyofficial-yes-button">Yes</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className={`barangay-official-popup-overlay show`}>
          <div className="barangay-official-popup">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className={`addbrgyofficial-error-popup-overlay show`}>
          <div className="barangay-official-popup">
            <img src={"/Images/warning-1.png"} alt="popup icon" className="icon-alert" />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {showDiscardPopup && (
        <div className="confirmation-popup-overlay-edit-official">
          <div className="confirmation-popup-edit-official">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to discard the changes?</p>
            <div className="yesno-container-add">
              <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
              <button
                type="button"
                onClick={() => {
                  if (originalOfficialData) {
                    setSelectedOfficial(originalOfficialData);
                    setIdentificationPreview(originalOfficialData.image ?? null);
                    setIdentificationFile(null);
                    setUpdateTerm("");
                  }
                  setShowDiscardPopup(false);
                }}
                className="yes-button-add"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
