"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { doc, getDoc, updateDoc, collection, where, query, getDocs } from "firebase/firestore";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function EditResident() {

  const { data: session } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [formData, setFormData] = useState({
    residentNumber: 0,
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    dateOfResidency: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    citizenship: "",
    generalLocation: "",
    cluster: "",
    isStudent: false,
    isPWD: false,
    pwdType: "",
    pwdTemporaryUntil: "",     
    pwdIdFileURL: "", 
    isSeniorCitizen: false,
    isSoloParent: false,
    verificationFilesURLs: [],
    identificationFileURL: "",
    updatedBy: "",
  });

  const clusterOptions: Record<string, string[]> = {
    "East Fairview": [
      "Rina",
      "SAMAFA",
      "SAMAPLI",
      "SITIO KISLAP",
      "EFHAI",
    ],
    "West Fairview": [
      "AUSTIN",
      "BASILIO 1",
      "DARISNAI",
      "MUSTANG BENZ",
      "ULNA",
      "UNITED FAIRLANE",
      "URLINA",
      "VERBENA 1",
      "WEST FAIRVEW HOA",
      "TULIP RESIDENCES HOA",

    ],
    "South Fairview": [
      "AKAP",
      "ARNAI",
      "F.L.N.A",
      "FEWRANO",
      "UPPER CORVETTE HOA",
    ]
  };

  const fieldSectionMap: { [key: string]: "basic" | "full" | "others" } = {
    lastName: "basic",
    firstName: "basic",
    middleName: "basic",
    sex: "basic",
    address: "basic",
    dateOfBirth: "basic",
    age: "full",
    placeOfBirth: "full",
    dateOfResidency: "full",
    civilStatus: "full",
    generalLocation: "full",
    cluster: "full",
    occupation: "full",
    contactNumber: "full",
    emailAddress: "full",
    precinctNumber: "full",
    verificationFiles: "others",
  };


  //const [file, setFile] = useState<File | null>(null);
  //const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const [pwdIdFile, setPwdIdFile] = useState<File | null>(null);
  const [pwdIdPreview, setPwdIdPreview] = useState<string | null>(null);

  
  const handleDiscardClick = async () => {
    setShowDiscardPopup(true);
  }

  const confirmDiscard = async () => {
      setShowDiscardPopup(false);

      setFormData(originalData); // Reset to original data
      setIdentificationPreview(originalData.identificationFileURL || null);
      setIdentificationFile(null); // Reset file selection
      setVerificationPreviews(originalData.verificationFilesURLs || []);
      setVerificationFiles([]); // Reset file selection

      setPopupMessage("Changes discarded successfully!");
      setShowPopup(true);
      

      // Hide the popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

  };



  useEffect(() => {
    if (residentId) {
      const fetchResidentData = async () => {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            residentNumber: docSnap.data().residentNumber || 0,
            firstName: docSnap.data().firstName || "",
            lastName: docSnap.data().lastName || "",
            middleName: docSnap.data().middleName || "",
            address: docSnap.data().address || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            dateOfResidency: docSnap.data().dateOfResidency || "",
            age: docSnap.data().age || 0,
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            occupation: docSnap.data().occupation || "",
            contactNumber: docSnap.data().contactNumber || "",
            emailAddress: docSnap.data().emailAddress || "",
            citizenship: docSnap.data().citizenship || "",
            generalLocation: docSnap.data().generalLocation || "",
            cluster: docSnap.data().cluster || "",
            isStudent: docSnap.data().isStudent || false,
            isPWD: docSnap.data().isPWD || false,
            isSeniorCitizen: docSnap.data().isSeniorCitizen || false,
            isSoloParent: docSnap.data().isSoloParent || false,
            verificationFilesURLs: docSnap.data().verificationFilesURLs || [],
            identificationFileURL: docSnap.data().identificationFileURL || "",
            updatedBy: docSnap.data().updatedBy || "",
            pwdType: docSnap.data().pwdType || "",
            pwdTemporaryUntil: docSnap.data().pwdTemporaryUntil || "",
            pwdIdFileURL: docSnap.data().pwdIdFileURL || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
          setVerificationPreviews(docSnap.data().verificationFilesURLs || []);
          setIdentificationPreview(docSnap.data().identificationFileURL || null);
          setPwdIdPreview(data.pwdIdFileURL || null);
        }
      };
      fetchResidentData();
    }
  }, [residentId]);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
  
    if (name === "dateOfBirth" && typeof newValue === 'string') {
      const birthDate = new Date(newValue);
      const today = new Date();
  
      if (birthDate > today) {
        setPopupErrorMessage("Date of birth cannot be in the future.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
  
      const age = calculateAge(newValue);
      if (age < 0) {
        setPopupErrorMessage("Invalid age calculated. Please check the birth date.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
  
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
        age: age,
        isSeniorCitizen: age >= 60,
      }));
      return;
    }

    if (name === "isPWD") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        isPWD: checked,
        ...(checked ? {} : { pwdType: "", pwdTemporaryUntil: "" })
      }));
      if (!checked) {
        setPwdIdFile(null);
        setPwdIdPreview(formData.pwdIdFileURL ? formData.pwdIdFileURL : null);
      }
      return;
    }    
  
    setFormData((prevData) => {
      let updatedData = {
        ...prevData,
        [name]: newValue,
      };
  
      if (name === "generalLocation") {
        updatedData.cluster = ""; // Reset cluster if location changes
      }
  
      return updatedData;
    });
  };

  const handlePwdIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPwdIdFile(file);
      setPwdIdPreview(URL.createObjectURL(file));
      e.target.value = "";
    }
  };
  
  const handlePwdIdFileDelete = () => {
    setPwdIdFile(null);
    setPwdIdPreview(formData.pwdIdFileURL ? formData.pwdIdFileURL : null);
    // don't clear saved URL here on edit; user can overwrite by uploading a new one
  };
  
  

  const handleSaveClick = async () => {

    const { 
      firstName, lastName, address, generalLocation, cluster, dateOfBirth, 
      age, sex, civilStatus, contactNumber,  emailAddress
  } = formData;
  
    const invalidFields: string[] = [];

    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!address) invalidFields.push("address");
    if (!generalLocation) invalidFields.push("generalLocation");
    if (!cluster) invalidFields.push("cluster");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age"); 
    if (!sex) invalidFields.push("sex");
    if (!civilStatus) invalidFields.push("civilStatus");
    if (!contactNumber) invalidFields.push("contactNumber");


    
    if (invalidFields.length > 0) {
      // Set the section based on the first invalid field
      const firstInvalidField = invalidFields[0];
      const section = fieldSectionMap[firstInvalidField];
      setActiveSection(section);

      setInvalidFields(invalidFields);
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return;
    }
    
    // Phone number validation logic
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      setActiveSection("full");
      setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailAddress && !emailRegex.test(emailAddress)) {
        setActiveSection("full");
        setPopupErrorMessage("Invalid email address. Format: example@domain.com");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
    

    setInvalidFields([]);

    // extra PWD validation
    if (formData.isPWD) {
      if (!formData.pwdType) invalidFields.push("pwdType");
      if (formData.pwdType === "Temporary") {
        if (!formData.pwdTemporaryUntil) invalidFields.push("pwdTemporaryUntil");
        else {
          const until = new Date(formData.pwdTemporaryUntil);
          const today = new Date(new Date().toISOString().split("T")[0]);
          if (until < today) invalidFields.push("pwdTemporaryUntil");
        }
      }
    }
    
    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);
    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);

      //router.push("/dashboard/ResidentModule");
      router.push(`/dashboard/ResidentModule?highlight=${docId}`);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      /*
      let verificationFilesURLs: string[] = [];
      if (verificationFiles.length > 0) {
        for (const file of verificationFiles) {
          const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          verificationFilesURLs.push(url);
        }
      }

      let identificationFileURL = "";
      if (identificationFile) {
        const storageRef = ref(storage, `ResidentsFiles/${identificationFile.name}`);
        await uploadBytes(storageRef, identificationFile);
        identificationFileURL = await getDownloadURL(storageRef);
      }*/

        let uploadedVerificationURLs: string[] = [];

        for (const file of verificationFiles) {
          const fileRef = ref(storage, `ResidentsFiles/VerificationFile/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          uploadedVerificationURLs.push(url);
        }
  
        let uploadedIdentificationURL = formData.identificationFileURL;
        if (identificationFile) {
          const idRef = ref(storage, `ResidentsFiles/IdentificationFile/${identificationFile.name}`);
          await uploadBytes(idRef, identificationFile);
          uploadedIdentificationURL = await getDownloadURL(idRef);
        }

        let uploadedPwdIdURL = formData.pwdIdFileURL;
        if (pwdIdFile) {
          const pwdRef = ref(storage, `ResidentsFiles/PWDID/${pwdIdFile.name}`);
          await uploadBytes(pwdRef, pwdIdFile);
          uploadedPwdIdURL = await getDownloadURL(pwdRef);
        }
                


      const docRef = doc(db, "Residents", residentId!);
      await updateDoc(doc(db, "Residents", residentId as string), {
        ...formData,
        verificationFilesURLs: uploadedVerificationURLs.length ? uploadedVerificationURLs : formData.verificationFilesURLs,
        identificationFileURL: uploadedIdentificationURL,
        pwdIdFileURL: uploadedPwdIdURL,
        updatedBy: session?.user?.position || "",
      });

      // Update in JobSeekerList
        const jobSeekerQuery = query(
          collection(db, "JobSeekerList"),
          where("residentId", "==", residentId)
        );
        const jobSeekerSnapshot = await getDocs(jobSeekerQuery);

        jobSeekerSnapshot.forEach(async (docSnap) => {
          const jobSeekerRef = doc(db, "JobSeekerList", docSnap.id);
          await updateDoc(jobSeekerRef, {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            identificationFileURL: uploadedIdentificationURL,
          });
        });


        // Update KasambahayList
        const kasambahaySnapshot = await getDocs(collection(db, "KasambahayList"));
    
        for (const docSnap of kasambahaySnapshot.docs) {
          const data = docSnap.data();
          const updates: any = {};
    
          if (data.residentId === residentId) {
            // Update kasambahay name & address
            updates.firstName = formData.firstName;
            updates.middleName = formData.middleName;
            updates.lastName = formData.lastName;
            updates.homeAddress = formData.address;
            updates.identificationFileURL = uploadedIdentificationURL;

          }
    
          if (data.employerId === residentId) {
            // Update employer info
            updates.employerName = `${formData.firstName} ${formData.middleName || ""} ${formData.lastName}`.trim();
            updates.employerAddress = formData.address;
          }
    
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, "KasambahayList", docSnap.id), updates);
          }
        }

        // --- Update ServiceRequests ---
        {
          const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim();

          const honorific = (() => {
            if (formData.sex === "Male") return "Mr.";
            if (formData.sex === "Female") return "Ms.";
            return ""; // fallback if sex not provided
          })();

          const calcAge = (dobStr?: string) => {
            if (!dobStr) return formData.age || 0;
            const dob = new Date(dobStr);
            if (Number.isNaN(dob.getTime())) return formData.age || 0;
            const today = new Date();
            let a = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
            return a;
          };

          const normalizedDOB = formData.dateOfBirth || "";
          const computedAge = calcAge(normalizedDOB);

          const srQuery = query(
            collection(db, "ServiceRequests"),
            where("residentId", "==", residentId)
          );

          const srSnap = await getDocs(srQuery);

          const srUpdates = {
            requestorFname: fullName,
            requestor: `${honorific ? honorific + " " : ""}${fullName}`.trim(),
            requestorMrMs: honorific,
            gender: formData.sex || "",
            receivalName: fullName,
            dateOfResidency: formData.dateOfResidency || "",
            contact: formData.contactNumber || "",
            birthday: normalizedDOB,            // aka dateOfBirth
            citizenship: formData.citizenship || "",
            civilStatus: formData.civilStatus || "",
            age: computedAge,
          };

          // Update each matching service request
          for (const d of srSnap.docs) {
            const srRef = doc(db, "ServiceRequests", d.id);
            await updateDoc(srRef, srUpdates);
          }
        }

    

        // Update in VotersList
        const votersQuery = query(
          collection(db, "VotersList"),
          where("residentId", "==", residentId)
        );
        const votersSnapshot = await getDocs(votersQuery);

        votersSnapshot.forEach(async (docSnap) => {
          const voterRef = doc(db, "VotersList", docSnap.id);
          await updateDoc(voterRef, {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            homeAddress: formData.address,
            identificationFileURL: uploadedIdentificationURL,
          });
        });

          // Update IncidentReports
          const complainantQuery = query(
            collection(db, "IncidentReports"),
            where("complainant.residentId", "==", residentId)
          );
          const respondentQuery = query(
            collection(db, "IncidentReports"),
            where("respondent.residentId", "==", residentId)
          );

          const [complainantSnapshot, respondentSnapshot] = await Promise.all([
            getDocs(complainantQuery),
            getDocs(respondentQuery),
          ]);

          const incidentDocsMap = new Map();
          [...complainantSnapshot.docs, ...respondentSnapshot.docs].forEach((docSnap) => {
            incidentDocsMap.set(docSnap.id, docSnap);
          });

          const updatedResidentData = {
            fname: formData.firstName,
            lname: formData.lastName,
            address: formData.address,
            contact: formData.contactNumber || "",
            sex: formData.sex,
            age: formData.age,
            civilStatus: formData.civilStatus,
            residentId: residentId!,
          };

          for (const [id, docSnap] of incidentDocsMap.entries()) {
            const data = docSnap.data();
            const updates: any = {};

            if (data.complainant?.residentId === residentId) {
              updates.complainant = {
                ...data.complainant,
                ...updatedResidentData,
              };
            }

            if (data.respondent?.residentId === residentId) {
              updates.respondent = {
                ...data.respondent,
                ...updatedResidentData,
              };
            }

            if (Object.keys(updates).length > 0) {
              const incidentRef = doc(db, "IncidentReports", docSnap.id);
              await updateDoc(incidentRef, updates);
            }
          }
                      

      return docRef.id; // return ID

    } catch (err) {
      setError("Failed to update resident");
      console.error(err);
    }

    setLoading(false);
  };
  
    const handleBack = () => {
      window.location.href = "/dashboard/ResidentModule";
    };

    const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
    
        // Ensure only one file is processed
        setIdentificationFile(selectedFile);
        setIdentificationPreview(URL.createObjectURL(selectedFile));
    
        // Reset the file input to prevent multiple selections
        e.target.value = "";
      }
    };

    const handleVerificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
        setVerificationFiles((prev) => [...prev, ...selectedFiles]);
        setVerificationPreviews((prev) => [...prev, ...newPreviews]);
        e.target.value = "";
      }
    };

    /*
    const handleIdentificationFileDelete = () => {
      setIdentificationFile(null);
      setIdentificationPreview(null);
      setFormData((prev) => ({
        ...prev,
        identificationFileURL: "",  // Clear the actual field
      }));
    };*/

    const handleIdentificationFileDelete = async () => {

      setIdentificationFile(null);
      setIdentificationPreview(null);
      setFormData((prev) => ({
        ...prev,
        identificationFileURL: "",
      }));
    };

  
  
    const handleVerificationFileDelete = (index: number) => {
      setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
      setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
    };
    
  
    const [activeSection, setActiveSection] = useState("basic");
    // options: "basic", "full", "others"

    return (
        <main className="add-resident-main-container">

          <div className="add-resident-main-content">
            <div className="add-resident-main-section1">
              <div className="add-resident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                </button>

                <h1> Edit Resident </h1>
              </div>

              <div className="action-btn-section">
                <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
              
            </div>

            <div className="add-resident-bottom-section">
                <nav className="main-residents-info-toggle-wrapper">
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
            <form id="editResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
              {/* Left Side - Resident Form */}
              
              {activeSection === "basic" && (
                        <>
                        <div className="add-main-resident-section-2-full-top">  
                          <div className="add-main-resident-section-2-left-side">
                              <div className="fields-section">
                                <p>Resident Number</p>
                                <input type="text" 
                                  name="residentNumber" 
                                  value={formData.residentNumber} 
                                  onChange={handleChange} 
                                  readOnly 
                                  className="add-resident-input-field-disabled" />
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
                                />
                              </div>


                              <div className="fields-section">
                                  <p>Date of Residency<span className="required">*</span></p>
                                    <input 
                                      type="date"
                                      className={`add-resident-input-field ${invalidFields.includes("dateOfResidency") ? "input-error" : ""}`}
                                      name="dateOfResidency"
                                      value={formData.dateOfResidency}
                                      onChange={handleChange}
                                      max={new Date().toISOString().split("T")[0]}
                                      required />
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
                                />
                              </div>
                            
                              <div className="fields-section">
                                <p>Gender<span className="required">*</span></p>
                                <select
                                  name="sex"
                                  className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                                  value={formData.sex}
                                  onChange={handleChange}
                                  required>
                                  <option value="" disabled>Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              </div>

                              <div className="fields-section">
                                    <p>Address<span className="required">*</span></p>
                                    <input 
                                      type="text"
                                      className={`add-resident-input-field ${invalidFields.includes("address") ? "input-error" : ""}`}
                                      placeholder="Enter Address"
                                      name="address"
                                      value={formData.address}
                                      onChange={handleChange}
                                      required />
                              </div>

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
                                      required />
                                </div>
                              </div>
                          </div>
                        </div>

                        <div className="add-main-resident-section-2-full-bottom">

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
                                    type="string"
                                    className={`add-resident-input-field ${invalidFields.includes("age") ? "input-error" : ""}`}
                                    placeholder="Enter Age"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    readOnly />
                                </div>

                                    <div className="fields-section">
                                      <p>Place of Birth</p>
                                      <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
                                    </div>
                                  

                                    <div className="fields-section">
                                      <p>Civil Status<span className="required">*</span></p>
                                      <select 
                                        name="civilStatus"
                                        className={`add-resident-input-field ${invalidFields.includes("civilStatus") ? "input-error" : ""}`}
                                        value={formData.civilStatus}
                                        onChange={handleChange}
                                        required>
                                        <option value="" disabled>Choose Civil Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Separated">Separated</option>
                                      </select>
                                    </div>

                                    <div className="fields-section">
                                      <p>Location<span className="required">*</span></p>
                                      <select
                                        name="generalLocation"
                                        className={`add-resident-input-field ${invalidFields.includes("generalLocation") ? "input-error" : ""}`}
                                        value={formData.generalLocation}
                                        onChange={handleChange}
                                        required
                                      >
                                        <option value="" disabled>Choose Part of Fairview</option>
                                        <option value="East Fairview">East Fairview</option>
                                        <option value="West Fairview">West Fairview</option>
                                        <option value="South Fairview">South Fairview</option>
                                      </select>
                                  </div>
                                  
                            </div>


                              <div className="add-main-resident-section-2-right-side">
                                    
                                    <div className="fields-section">
                                      <p>Contact Number<span className="required">*</span></p>
                                      <input 
                                        type="tel" 
                                        className={`add-resident-input-field ${invalidFields.includes("contactNumber") ? "input-error" : ""}`}
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={(e) => {
                                          const input = e.target.value;
                                          if (/^\d{0,11}$/.test(input)) {
                                            setFormData({ ...formData, contactNumber: input });
                                          }
                                        }}
                                        pattern="^[0-9]{11}$" 
                                        placeholder="Enter 11-digit phone number" 
                                      />
                                    </div>

                                    <div className="fields-section">
                                      <p>Email Address</p>
                                      <input type="email" className="add-resident-input-field" placeholder="Enter Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
                                    </div>

                                    <div className="fields-section">
                                    <p>Cluster/Section<span className="required">*</span></p>
                                    <select
                                      name="cluster"
                                      className="add-resident-input-field"
                                      value={formData.cluster || ""}
                                      onChange={handleChange}
                                      required
                                      disabled={!formData.generalLocation} // Optional: disables until a location is picked
                                    >
                                      <option value="" disabled>
                                        {formData.generalLocation ? "Choose HOA/Sitio" : "Select Location First"}
                                      </option>
                                      {formData.generalLocation &&
                                        clusterOptions[formData.generalLocation].map((option, index) => (
                                          <option key={index} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                    <div className="fields-section">
                                <p>Citizenship<span className="required">*</span></p>
                                <select
                                  name="citizenship"
                                  className={`add-resident-input-field ${invalidFields.includes("citizenship") ? "input-error" : ""}`}
                                  value={
                                    ["Filipino", "Dual Citizen", "Naturalized", "Others"].includes(
                                      formData.citizenship.split("(")[0]
                                    ) ? formData.citizenship.split("(")[0] : ""
                                  }
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      citizenship: selected
                                    }));
                                  }}
                                  required
                                >
                                  <option value="" disabled>Select Citizenship</option>
                                  <option value="Filipino">Filipino</option>
                                  <option value="Dual Citizen">Dual Citizen</option>
                                  <option value="Naturalized">Naturalized</option>
                                  <option value="Others">Others</option>
                                </select>

                                {/* Input for Dual Citizen */}
                                {formData.citizenship.startsWith("Dual Citizen") && (
                                  <input
                                    type="text"
                                    className={`add-resident-input-field ${invalidFields.includes("citizenship") ? "input-error" : ""}`}
                                    placeholder="Specify other citizenship (e.g., American)"
                                    value={
                                      formData.citizenship.includes("(")
                                        ? formData.citizenship.slice(
                                            formData.citizenship.indexOf("(") + 1,
                                            formData.citizenship.indexOf(")")
                                          )
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      setFormData((prev) => ({
                                        ...prev,
                                        citizenship: val ? `Dual Citizen(${val})` : "Dual Citizen"
                                      }));
                                    }}
                                    required
                                  />
                                )}

                                {/* Input for Others */}
                                {formData.citizenship.startsWith("Others") && (
                                  <input
                                    type="text"
                                    className={`add-resident-input-field ${invalidFields.includes("citizenship") ? "input-error" : ""}`}
                                    placeholder="Please specify your citizenship"
                                    value={
                                      formData.citizenship.includes("(")
                                        ? formData.citizenship.slice(
                                            formData.citizenship.indexOf("(") + 1,
                                            formData.citizenship.indexOf(")")
                                          )
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      setFormData((prev) => ({
                                        ...prev,
                                        citizenship: val ? `Others(${val})` : "Others"
                                      }));
                                    }}
                                    required
                                  />
                                )}
                              </div>

                                    
                            </div>

                          </div>

                          <div className="add-main-resident-section-2-full-bottom">  
                          
                          <div className="add-main-resident-section-2-cluster">
                            <div className="fields-section">
                                      <p>Occupation</p>
                                      <input type="text" className="add-resident-input-field" placeholder="Enter Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
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
                                  Resident Classification
                                </div>

                                <div className="box-container-resclassification">
                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isStudent" checked={formData.isStudent} onChange={handleChange} />
                                      Student
                                    </label>
                                  </div>

                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isPWD" checked={formData.isPWD} onChange={handleChange} />
                                      PWD
                                    </label>
                                  </div>

                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isSoloParent" checked={formData.isSoloParent} onChange={handleChange} />
                                      Solo Parent
                                    </label>
                                  </div>  
                                </div>
                              </div> 



                              {/* PWD Section */}

                              {formData.isPWD && (
                              <div className="box-container-outer-pwdpic">
                                <div className="title-pwdpic">PWD Information</div>

                                <div className="box-container-pwdpic">
                                  <div className={`file-upload-container-pwd ${invalidFields.includes("pwdIdFile") ? "pwd-error" : ""}`}>
                                    <label htmlFor="pwd-id-file-upload" className="upload-link">Click to Upload PWD ID</label>
                                    <input
                                      id="pwd-id-file-upload"
                                      type="file"
                                      className="file-upload-input"
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handlePwdIdFileChange}
                                    />
                                    {(pwdIdFile || pwdIdPreview) && (
                                      <div className="file-name-image-display">
                                        <div className="file-name-image-display-indiv">
                                          {pwdIdPreview && (
                                            <img src={pwdIdPreview} alt="PWD ID Preview" style={{ width: 50, height: 50, marginRight: 5 }} />
                                          )}
                                          <span>{pwdIdFile?.name || "PWD ID"}</span>
                                          <div className="delete-container">
                                            <button type="button" onClick={handlePwdIdFileDelete} className="delete-button">
                                              <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pwd-type-container">
                                    <div className={`pwd-fields-section ${invalidFields.includes("pwdType") ? "input-error" : ""}`}>
                                      <p className="pwd-label">Type of PWD ID <span className="required">*</span></p>
                                      <div className="pwd-radio-row">
                                        <label className={`radio-card ${formData.pwdType === "Permanent" ? "active" : ""}`}>
                                          <input
                                            type="radio"
                                            name="pwdType"
                                            value="Permanent"
                                            checked={formData.pwdType === "Permanent"}
                                            onChange={(e) => setFormData(prev => ({ ...prev, pwdType: e.target.value, pwdTemporaryUntil: "" }))}
                                          /> Permanent
                                        </label>
                                        <label className={`radio-card ${formData.pwdType === "Temporary" ? "active" : ""}`}>
                                          <input
                                            type="radio"
                                            name="pwdType"
                                            value="Temporary"
                                            checked={formData.pwdType === "Temporary"}
                                            onChange={(e) => setFormData(prev => ({ ...prev, pwdType: e.target.value }))}
                                          /> Temporary
                                        </label>
                                      </div>
                                    </div>

                                    
                                      <div
                                        className={`pwd-fields-section-valid ${
                                          formData.pwdType === "Temporary" ? "show" : "hidden"
                                        } ${invalidFields.includes("pwdTemporaryUntil") ? "input-error" : ""}`}
                                      >
                                        <p className="pwd-label">Valid Until <span className="required">*</span></p>
                                        <input
                                          type="date"
                                          name="pwdTemporaryUntil"
                                          className="pwd-input"
                                          value={formData.pwdTemporaryUntil}
                                          onChange={handleChange}
                                          min={new Date().toISOString().split("T")[0]}
                                          required
                                        />
                                      </div>
                                    
                                  </div>
                                </div>
                              </div>
                            )}
                            </div>


                            <div className="add-main-resident-section-2-bottom-side">
                            <div className="box-container-outer-resindentificationpic">
                                <div className="title-resindentificationpic">
                                  Identification Picture
                                </div>

                                <div className="box-container-resindentificationpic">

                                  {/* File Upload Section */}
                                  <div className="identificationpic-container">
                                      <label htmlFor="identification-file-upload" className="upload-link">Click to Upload File</label>
                                      <input id="identification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleIdentificationFileChange} />


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
                                          <button type="button" onClick={handleIdentificationFileDelete} className="delete-button">
                                            <img src="/images/trash.png" alt="Delete" className="delete-icon" />
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

                                  {/* File Upload Section */}
                                  <div className="file-upload-container">
                                     
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
                                            <div key={index} className="identificationpic-file-name-image-display-indiv">
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

          {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-add-resident">
                            <div className="confirmation-popup-add-resident">
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
                        <div className="confirmation-popup-overlay-add-resident">
                            <div className="confirmation-popup-add-resident">
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
                <div className={`popup-overlay-add-resident show`}>
                    <div className="popup-add-resident">
                    <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                    <p>{popupMessage}</p>
                    </div>
                </div>
                )}
        {showErrorPopup && (
                <div className={`error-popup-overlay-add-resident show`}>
                    <div className="popup-add-resident">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                    <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>
    );
  }