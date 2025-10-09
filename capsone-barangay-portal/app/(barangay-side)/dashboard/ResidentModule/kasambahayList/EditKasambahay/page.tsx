"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface KasambahayFormData {
  registrationControlNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
  homeAddress: string;
  dateOfBirth: string;
  placeOfBirth: string;
  age: number;
  sex: string;
  civilStatus: string;
  educationalAttainment: string | number;
  natureOfWork: string | number;
  employmentArrangement: string | number;
  salary: string | number;
  employerId: string;
  employerName: string;
  employerAddress: string;
  sssMember: boolean;
  philhealthMember: boolean;
  pagibigMember: boolean;
  verificationFilesURLs: any[];
  identificationFileURL: string | null;
  updatedBy: string;
  residentId: string;
}

export default function EditKasambahay() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const kasambahayId = searchParams.get("id"); 

  const [formData, setFormData] = useState<KasambahayFormData>({
    registrationControlNumber: "",
    firstName: "",
    lastName: "",
    middleName: "",
    homeAddress: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    employerId: "",
    employerName: "",
    employerAddress: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
    verificationFilesURLs: [],
    identificationFileURL: "",
    updatedBy: "",
    residentId: "",
  });

  // Editable fields when linked to a Resident
  const editableWhenLinked = new Set([
    "natureOfWork",
    "employmentArrangement",
    "salary",
    "sssMember",
    "philhealthMember",
    "pagibigMember",
  ]);
  const isLinkedResident = !!formData.residentId;
  const canEditField = (name: string) => {
    if (!isLinkedResident) return true;
    return editableWhenLinked.has(name);
  };

  const fieldSectionMap: { [key: string]: "basic" | "full" | "others" } = {
    lastName: "basic",
    firstName: "basic",
    middleName: "basic",
    sex: "basic",
    homeAddress: "basic",
    dateOfBirth: "basic",
    
    age: "full",
    placeOfBirth: "full",
    civilStatus: "full",
    educationalAttainment: "full",
    natureOfWork: "full",
    employmentArrangement: "full",
    salary: "full",
    employerName: "full",
    employerAddress: "full",

    verificationFiles: "others",
    identificationFile: "others"
  };

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState<KasambahayFormData>({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const employerPopupRef = useRef<HTMLDivElement>(null);

  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [identificationFileDeleted, setIdentificationFileDeleted] = useState(false);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDiscardClick = async () => {
    setShowDiscardPopup(true);
  };

  const confirmDiscard = async () => {
    setShowDiscardPopup(false);

    setFormData(originalData);
    setIdentificationPreview(originalData.identificationFileURL || null);
    setIdentificationFile(null);
    setVerificationPreviews((originalData.verificationFilesURLs as string[]) || []);
    setVerificationFiles([]);

    setPopupMessage("Changes discarded successfully!");
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  useEffect(() => {
    if (!kasambahayId) return;

    const fetchKasambahay = async () => {
      try {
        const docRef = doc(db, "KasambahayList", kasambahayId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data: KasambahayFormData = {
            registrationControlNumber: docSnap.data().registrationControlNumber || "",
            firstName: docSnap.data().firstName || "",
            lastName: docSnap.data().lastName || "",
            middleName: docSnap.data().middleName || "",
            homeAddress: docSnap.data().homeAddress || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            age: docSnap.data().age || 0,
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            educationalAttainment: docSnap.data().educationalAttainment || "",
            natureOfWork: docSnap.data().natureOfWork || "",
            employmentArrangement: docSnap.data().employmentArrangement || "",
            salary: docSnap.data().salary || "",
            employerId: docSnap.data().employerId || "",
            employerName: docSnap.data().employerName || "",
            employerAddress: docSnap.data().employerAddress || "",
            sssMember: docSnap.data().sssMember ?? false,
            philhealthMember: docSnap.data().philhealthMember ?? false,
            pagibigMember: docSnap.data().pagibigMember ?? false,
            verificationFilesURLs: docSnap.data().verificationFilesURLs || [],
            identificationFileURL: docSnap.data().identificationFileURL || "",
            updatedBy: docSnap.data().updatedBy || "",
            residentId: docSnap.data().residentId || "",
          };

          setFormData(data);
          setOriginalData(data);
          setVerificationPreviews(docSnap.data().verificationFilesURLs || []);
          setIdentificationPreview(docSnap.data().identificationFileURL || null);
        } else {
          setError("Kasambahay record not found.");
        }
      } catch (error) {
        console.error("Error fetching Kasambahay:", error);
        setError("Failed to load data.");
      }
    };

    fetchKasambahay();
  }, [kasambahayId]);

  const [activeSection, setActiveSection] = useState("basic");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };
  
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentsCollection = collection(db, "Residents");
        const residentsSnapshot = await getDocs(residentsCollection);
        const residentsList = residentsSnapshot.docs.map(docu => {
          const data = docu.data() as {
            residentNumber: string;
            firstName: string;
            middleName: string;
            lastName: string;
            address: string;
          };
          return { id: docu.id, ...data };
        });
        setResidents(residentsList);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
    fetchResidents();
  }, []);

  const handleEmployerClick = () => {
    if (canEditField("employerName")) {
      setShowResidentsPopup(true);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (!canEditField(name)) return;

    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        numericFields.includes(name)
          ? Number(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };
  
  const handleSaveClick = async () => {
    const {
      lastName,
      firstName,
      homeAddress,
      dateOfBirth,
      age,
      sex,
      civilStatus,
      educationalAttainment,
      natureOfWork,
      employmentArrangement,
      salary,
      employerName,
      employerAddress
    } = formData;
  
    const _invalidFields: string[] = [];

    if (!lastName) _invalidFields.push("lastName");
    if (!firstName) _invalidFields.push("firstName");
    if (!homeAddress) _invalidFields.push("homeAddress");
    if (!dateOfBirth) _invalidFields.push("dateOfBirth");
    if (!age) _invalidFields.push("age");
    if (!sex) _invalidFields.push("sex");
    if (!civilStatus) _invalidFields.push("civilStatus");
    if (!educationalAttainment) _invalidFields.push("educationalAttainment");
    if (!natureOfWork) _invalidFields.push("natureOfWork");
    if (!employmentArrangement) _invalidFields.push("employmentArrangement");
    if (!salary) _invalidFields.push("salary");
    if (!employerName) _invalidFields.push("employerName");
    if (!employerAddress) _invalidFields.push("employerAddress");
    
    if (_invalidFields.length > 0) {
      const firstInvalidField = _invalidFields[0];
      const section = fieldSectionMap[firstInvalidField];
      setActiveSection(section);
      setInvalidFields(_invalidFields);
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }
    setInvalidFields([]);
    setShowSavePopup(true);
  };

  const confirmSave = async () => {
    setShowSavePopup(false);
    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/ResidentModule/kasambahayList?highlight=${docId}`);
    }, 3000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!kasambahayId) return;

    setLoading(true);
    setError("");

    try {
      let uploadedVerificationURLs: string[] = [...(formData.verificationFilesURLs || [])];

      if (!isLinkedResident) {
        for (const vf of verificationFiles) {
          const fileRef = ref(storage, `KasambahayFiles/VerificationFile/${vf.name}`);
          await uploadBytes(fileRef, vf);
          const url = await getDownloadURL(fileRef);
          uploadedVerificationURLs.push(url);
        }
      }

      let uploadedIdentificationURL: string | null = formData.identificationFileURL ?? null;

      if (!isLinkedResident) {
        if (identificationFile) {
          const idRef = ref(storage, `KasambahayFiles/IdentificationFile/${identificationFile.name}`);
          await uploadBytes(idRef, identificationFile);
          uploadedIdentificationURL = await getDownloadURL(idRef);
        } else if (identificationFileDeleted) {
          if (formData.identificationFileURL) {
            const oldFileName = formData.identificationFileURL.split("%2F").pop()?.split("?")[0];
            if (oldFileName) {
              const deleteRef = ref(storage, `KasambahayFiles/IdentificationFile/${oldFileName}`);
              await deleteObject(deleteRef);
            }
          }
          uploadedIdentificationURL = null;
        }
      }

      const docRef = doc(db, "KasambahayList", kasambahayId);

      const baseUpdate: any = {
        natureOfWork: formData.natureOfWork,
        employmentArrangement: formData.employmentArrangement,
        salary: formData.salary,
        sssMember: formData.sssMember,
        philhealthMember: formData.philhealthMember,
        pagibigMember: formData.pagibigMember,
        updatedBy: (session?.user as any)?.position || "",
      };

      if (!isLinkedResident) {
        Object.assign(baseUpdate, {
          registrationControlNumber: formData.registrationControlNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          homeAddress: formData.homeAddress,
          dateOfBirth: formData.dateOfBirth,
          placeOfBirth: formData.placeOfBirth,
          age: formData.age,
          sex: formData.sex,
          civilStatus: formData.civilStatus,
          educationalAttainment: formData.educationalAttainment,
          employerId: formData.employerId,
          employerName: formData.employerName,
          employerAddress: formData.employerAddress,
          verificationFilesURLs: uploadedVerificationURLs.length ? uploadedVerificationURLs : formData.verificationFilesURLs,
          identificationFileURL: uploadedIdentificationURL,
        });
      }

      await updateDoc(docRef, baseUpdate);

      // 🔁 ALSO update the resident's occupation if linked
      if (formData.residentId) {
        const natureOfWorkMap: Record<string, string> = {
          "1": "Kasambahay (Gen. House Help)",
          "2": "Kasambahay (Yaya)",
          "3": "Kasambahay (Cook)",
          "4": "Kasambahay (Gardener)",
          "5": "Kasambahay (Laundry Person)",
          "6": "Kasambahay (Others)",
        };
        const key = String(formData.natureOfWork ?? "");
        const occupation = natureOfWorkMap[key] || "Kasambahay";

        const residentDocRef = doc(db, "Residents", formData.residentId);
        await updateDoc(residentDocRef, { occupation });
      }

      return docRef.id;
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLinkedResident) return;
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setIdentificationFile(selectedFile);
      setIdentificationPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };

  const handleVerificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLinkedResident) return;
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setVerificationFiles((prev) => [...prev, ...selectedFiles]);
      setVerificationPreviews((prev) => [...prev, ...newPreviews]);
      e.target.value = "";
    }
  };

  const handleIdentificationFileDelete = () => {
    if (isLinkedResident) return;
    setIdentificationFile(null);
    setIdentificationPreview(null);
    setFormData((prev) => ({
      ...prev,
      identificationFileURL: "",
    }));
    setIdentificationFileDeleted(true);
  };

  const handleVerificationFileDelete = (index: number) => {
    if (isLinkedResident) return;
    setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
    setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const disabledStyle = (name: string) =>
    !canEditField(name) ? { opacity: 0.7, cursor: "not-allowed" } : undefined;

  return (
    <main className="add-resident-main-container">
      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
          <div className="add-resident-main-section1-left">
            <button onClick={handleBack}>
              <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
            </button>
            <h1> Edit Kasambahay </h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="add-resident-bottom-section">
          <nav className="kasambahay-info-toggle-wrapper">
            {["basic", "full", "others"].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section === "basic" && "Basic Info"}
                {section === "full" && "Full Info"}
                {section === "others" && "Others"}
              </button>
            ))}
          </nav>

          <div className="add-resident-bottom-section-scroll">
            <form id="addKasambahayForm" onSubmit={handleSubmit} className="add-resident-section-2">
              {activeSection === "basic" && (
                <>
                  <div className="add-main-resident-section-2-full-top">  
                    <div className="add-main-resident-section-2-left-side">
                      <div className="fields-section">
                        <p>Registration Control Number</p>
                        <input
                          type="text"
                          name="registrationControlNumber"
                          value={formData.registrationControlNumber}
                          onChange={handleChange}
                          disabled={true}
                          className="add-resident-input-field-disabled"                        
                        />
                      </div>

                      <div className="fields-section">
                        <p>First Name<span className="required">*</span></p>
                        <input
                          type="text"
                          className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`}
                          placeholder="Enter First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("firstName")}
                          style={disabledStyle("firstName")}
                        />
                      </div>

                      <div className="fields-section">
                        <p>Middle Name</p>
                        <input
                          type="text"
                          className="add-resident-input-field"
                          placeholder="Enter Middle Name"
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("middleName")}
                          style={disabledStyle("middleName")}
                        />
                      </div>
                    </div>

                    <div className="add-main-resident-section-2-right-side">
                      <div className="fields-section">
                        <p>Last Name<span className="required">*</span></p>
                        <input
                          type="text"
                          className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`}
                          placeholder="Enter Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("lastName")}
                          style={disabledStyle("lastName")}
                        />
                      </div>
                      <div className="fields-section">
                        <p>Gender<span className="required">*</span></p>
                        <select
                          name="sex"
                          className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                          value={formData.sex}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("sex")}
                          style={disabledStyle("sex")}
                        >
                          <option value="" disabled>Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div className="fields-section">
                        <p>Home Address<span className="required">*</span></p>
                        <input
                          type="text"
                          className={`add-resident-input-field ${invalidFields.includes("homeAddress") ? "input-error" : ""}`}
                          placeholder="Enter Address"
                          name="homeAddress"
                          value={formData.homeAddress}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("homeAddress")}
                          style={disabledStyle("homeAddress")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="add-main-resident-section-2-full-bottom">
                    <div className="add-main-resident-section-2-cluster">
                      <div className="fields-section">
                        <p>Date of Birth<span className="required">*</span></p>
                        <input
                          type="date"
                          className={`add-resident-input-field ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          disabled={!canEditField("dateOfBirth")}
                          style={disabledStyle("dateOfBirth")}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "full" && (
                <>
                  <div className="add-main-resident-section-2-full-top">  
                    <div className="add-main-resident-section-2-left-side">
                      <div className="fields-section">
                        <p>Age<span className="required">*</span></p>
                        <input
                          type="number"
                          className={`add-resident-input-field ${invalidFields.includes("age") ? "input-error" : ""}`}
                          placeholder="Enter Age" 
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          required
                          readOnly
                          disabled={!canEditField("age")}
                          style={disabledStyle("age")}
                        />
                      </div>

                      <div className="fields-section">
                        <p>Place of Birth</p>
                        <input
                          type="text"
                          className="add-resident-input-field"
                          placeholder="Enter Place of Birth"
                          name="placeOfBirth"
                          value={formData.placeOfBirth}
                          onChange={handleChange}
                          disabled={!canEditField("placeOfBirth")}
                          style={disabledStyle("placeOfBirth")}
                        />
                      </div>

                      <div className="fields-section">
                        <p>Civil Status<span className="required">*</span></p>
                        <select
                          name="civilStatus"
                          className={`add-resident-input-field ${invalidFields.includes("civilStatus") ? "input-error" : ""}`}
                          value={formData.civilStatus}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("civilStatus")}
                          style={disabledStyle("civilStatus")}
                        >
                          <option value="" disabled>Choose Civil Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>

                      <div className="fields-section">
                        <p>Educational Attainment<span className="required">*</span></p>
                        <select
                          name="educationalAttainment"
                          className={`add-resident-input-field ${invalidFields.includes("educationalAttainment") ? "input-error" : ""}`}
                          value={formData.educationalAttainment as any}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("educationalAttainment")}
                          style={disabledStyle("educationalAttainment")}
                        >
                          <option value="" disabled>Choose Educational Attainment</option>
                          <option value="1">Elem Under Grad</option>
                          <option value="2">Elem Grad</option>
                          <option value="3">HS Grad</option>
                          <option value="4">HS Under Grad</option>
                          <option value="5">COL Grad</option>
                          <option value="6">COL Under Grad</option>
                          <option value="7">Educational</option>
                          <option value="8">Vocational</option>
                        </select>
                      </div>
                    </div>

                    <div className="add-main-resident-section-2-right-side">
                      <div className="fields-section">
                        <p>Nature of Work<span className="required">*</span></p>
                        <select 
                          name="natureOfWork"
                          className={`add-resident-input-field ${invalidFields.includes("natureOfWork") ? "input-error" : ""}`} 
                          value={formData.natureOfWork as any}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("natureOfWork")}
                          style={disabledStyle("natureOfWork")}
                        >
                          <option value="" disabled>Choose Nature of Work</option>
                          <option value="1">Gen. House Help (All Around)</option>
                          <option value="2">YAYA</option>
                          <option value="3">COOK</option>
                          <option value="4">Gardener</option>
                          <option value="5">Laundry Person</option>
                          <option value="6">Others</option>
                        </select>
                      </div>

                      <div className="fields-section">
                        <p>Employment Arrangement<span className="required">*</span></p>
                        <select 
                          name="employmentArrangement"
                          className={`add-resident-input-field ${invalidFields.includes("employmentArrangement") ? "input-error" : ""}`} 
                          value={formData.employmentArrangement as any}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("employmentArrangement")}
                          style={disabledStyle("employmentArrangement")}
                        >
                          <option value="" disabled>Choose Employment Arrangement</option>
                          <option value="1">Live - IN</option>
                          <option value="2">Live - OUT</option>
                        </select>
                      </div>

                      <div className="fields-section">
                        <p>Range of Salary<span className="required">*</span></p>
                        <select 
                          name="salary"
                          className={`add-resident-input-field ${invalidFields.includes("salary") ? "input-error" : ""}`} 
                          value={formData.salary as any}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("salary")}
                          style={disabledStyle("salary")}
                        >
                          <option value="" disabled>Choose Salary Range</option>
                          <option value="1">₱1,500 - ₱1,999</option>
                          <option value="2">₱2,000 - ₱2,499</option>
                          <option value="3">₱2,500 - ₱4,999</option>
                          <option value="4">₱5,000 and Above</option>
                        </select>
                      </div>

                      <div ref={employerPopupRef}>
                        <div className="fields-section">
                          <p>Employer Name<span className="required">*</span></p>
                          <input 
                            type="text"
                            className={`add-resident-input-field ${invalidFields.includes("employerName") ? "input-error" : ""}`} 
                            placeholder="Select Employer"
                            name="employerName"
                            value={formData.employerName}
                            onChange={handleChange}
                            required
                            onClick={handleEmployerClick}
                            disabled={!canEditField("employerName")}
                            style={disabledStyle("employerName")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="add-main-resident-section-2-full-bottom">
                    <div className="add-main-resident-section-2-cluster">
                      <div className="fields-section">
                        <p>Employer Address<span className="required">*</span></p>
                        <input 
                          type="text"
                          className={`add-resident-input-field ${invalidFields.includes("employerAddress") ? "input-error" : ""}`} 
                          placeholder="Enter Employer Address"
                          name="employerAddress"
                          value={formData.employerAddress}
                          onChange={handleChange}
                          required
                          disabled={!canEditField("employerAddress")}
                          style={disabledStyle("employerAddress")}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "others" && (
                <>
                  <div className="add-main-resident-others-mainsection">
                    <div className="add-main-resident-section-2-top-side">
                      <div className="box-container-outer-resclassification">
                        <div className="title-resclassification">
                          Social Benefit Status
                        </div>

                        <div className="box-container-resclassification">
                          <div className="checkbox-container" style={disabledStyle("sssMember")}>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                name="sssMember"
                                checked={formData.sssMember}
                                onChange={handleChange}
                                disabled={!canEditField("sssMember")}
                              />
                              SSS Membership
                            </label>
                          </div>
                          <div className="checkbox-container" style={disabledStyle("pagibigMember")}>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                name="pagibigMember"
                                checked={formData.pagibigMember}
                                onChange={handleChange}
                                disabled={!canEditField("pagibigMember")}
                              />
                              Pag-Ibig Membership
                            </label>
                          </div>
                          <div className="checkbox-container" style={disabledStyle("philhealthMember")}>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                name="philhealthMember"
                                checked={formData.philhealthMember}
                                onChange={handleChange}
                                disabled={!canEditField("philhealthMember")}
                              />
                              PhilHealth Membership
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="add-main-resident-section-2-bottom-side">
                      <div className="box-container-outer-resindentificationpic">
                        <div className="title-resindentificationpic">
                          Identification Picture
                        </div>

                        <div className="box-container-resindentificationpic">
                          <div className="identificationpic-container" style={disabledStyle("identificationFile")}>
                            <label
                              htmlFor="identification-file-upload"
                              className="upload-link"
                              style={{ pointerEvents: canEditField("identificationFile") ? "auto" : "none" }}
                            >
                              Click to Upload File
                            </label>
                            <input
                              id="identification-file-upload"
                              type="file"
                              className="file-upload-input"
                              accept=".jpg,.jpeg,.png"
                              onChange={handleIdentificationFileChange}
                              disabled={!canEditField("identificationFile")}
                            />

                            {(identificationFile || identificationPreview) && (
                              <div className="identificationpic-display">
                                <div className="identification-picture">
                                  {identificationPreview && (
                                    <img
                                      src={identificationPreview}
                                      alt="Preview"
                                      style={{ height: '200px'}}
                                    />
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
                                  disabled={!canEditField("identificationFile")}
                                  style={disabledStyle("identificationFile")}
                                >
                                  <img src="/Images/trash.png" alt="Delete" className="delete-icon" />
                                </button>
                              </div>
                            )}
                          </div>             
                        </div>
                      </div>

                      <div className="box-container-outer-verificationdocs">
                        <div className="title-verificationdocs">
                          Verification Documents
                        </div>

                        <div className={`box-container-verificationdocs ${invalidFields.includes("verificationFiles") ? "input-error" : ""}`}>
                          <span className="required-asterisk">*</span>

                          <div className="file-upload-container" style={disabledStyle("verificationFiles")}>
                            {(verificationFiles.length > 0 || verificationPreviews.length > 0) && (
                              <div className="file-name-image-display">
                                {verificationPreviews.map((preview, index) => (
                                  <a
                                    key={index}
                                    href={preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none", color: "inherit" }}
                                  >
                                    <div className="identificationpic-file-name-image-display-indiv">
                                      {preview && (
                                        <img src={preview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />
                                      )}
                                      <span>
                                        {verificationFiles[index]?.name || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div> 

        {error && <p className="error">{error}</p>}
      </div>

      {showResidentsPopup && (
        <div className="kasambahay-employer-popup-overlay">
          <div className="kasambahay-employer-popup" ref={employerPopupRef}>
            <h2>Employers List</h2>
            <h1>* Please select Employer's Name *</h1>

            <input
              type="text"
              placeholder="Search Employer's Name"
              className="employer-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!canEditField("employerName")}
              style={disabledStyle("employerName")}
            />

            <div className="employers-list">
              {residents.length === 0 ? (
                <p>No residents found.</p>
              ) : (
                <table className="employers-table">
                  <thead>
                    <tr>
                      <th>Resident Number</th>
                      <th>First Name</th>
                      <th>Middle Name</th>
                      <th>Last Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents
                      .filter((resident) => {
                        const fullName = `${resident.firstName} ${resident.middleName || ""} ${resident.lastName}`.toLowerCase();
                        return fullName.includes(searchTerm.toLowerCase());
                      })
                      .map((resident) => (
                        <tr
                          key={resident.id}
                          className="employers-table-row"
                          onClick={() => {
                            if (!canEditField("employerName")) return;
                            setFormData({
                              ...formData,
                              employerId: resident.id,
                              employerName: `${resident.lastName}, ${resident.firstName} ${resident.middleName || ''}`,
                              employerAddress: resident.address || '',
                            });
                            setShowResidentsPopup(false);
                          }}
                          style={{ cursor: canEditField("employerName") ? 'pointer' : 'not-allowed', opacity: canEditField("employerName") ? 1 : 0.7 }}
                        >
                          <td>{resident.residentNumber}</td>
                          <td>{resident.firstName}</td>
                          <td>{resident.middleName}</td>
                          <td>{resident.lastName}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showDiscardPopup && (
        <div className="confirmation-popup-overlay-add-kasambahay">
          <div className="confirmation-popup-add-kasambahay">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to discard the changes?</p>
            <div className="yesno-container-add">
              <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
              <button onClick={confirmDiscard} className="yes-button-add">Yes</button> 
            </div> 
          </div>
        </div>
      )}

      {showSavePopup && (
        <div className="confirmation-popup-overlay-add-kasambahay">
          <div className="confirmation-popup-add-kasambahay">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to save the changes?</p>
            <div className="yesno-container-add">
              <button onClick={() => setShowSavePopup(false)} className="no-button-add">No</button> 
              <button onClick={confirmSave} className="yes-button-add">Yes</button> 
            </div> 
          </div>
        </div>
      )}
                    
      {showPopup && (
        <div className={`popup-overlay-add-kasambahay show`}>
          <div className="popup-add-kasambahay">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className={`error-popup-overlay-add-kasambahay show`}>
          <div className="popup-add-kasambahay">
            <img src={"/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
            <p>{popupErrorMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
}
