"use client";

import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { useSearchParams,useRouter } from "next/navigation";
import { use, useEffect,useState } from "react";
import { useSession } from "next-auth/react";
import { getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {storage,db} from "@/app/db/firebase";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";
import { collection, doc, setDoc, updateDoc, getDocs, query, onSnapshot,getDoc, addDoc, where } from "firebase/firestore";
import { handlePrint,handleGenerateDocument } from "@/app/helpers/pdfhelper";
import { useMemo } from "react";
import { set } from "date-fns";
import { request } from "http";

interface EmergencyDetails {
    fullName: string;
    address: string;
    relationship: string;
    contactNumber: string;
  }
  
  interface OnlineRequest {
    sendTo: string;
    accID: string;
    requestId: string;
    documentTypeIs?: string; 
    docPrinted?: boolean; // Optional field to track if document is printed
    reqType?: string; // "Online" or "InBarangay"
    requestor: string;
    partnerWifeHusbandFullName: string;
    cohabitationStartDate: string;
    cohabitationRelationship:string;
    docType: string;
    status: string;
    purpose: string;
    createdAt: string;
    requestorFname: string;
    nosOfPUV: string;
    puvPurpose: string;
    appointmentDate: string;
    dateOfResidency: string;
    address: string; // Will also be the home address
    toAddress: string; // Will be the home address
    businessLocation: string; // Will be the project location
    businessNature: string;
    estimatedCapital: string;
    businessName: string;
    birthday: string;
    age: string;
    gender: string;
    civilStatus: string;
    approvedBySAS: boolean;
    contact: string;
    typeofconstruction: string;
    typeofbldg: string;
    projectName: string;
    citizenship: string;
    educationalAttainment: string;
    course: string;
    isBeneficiary: string;
    birthplace: string;
    religion: string;
    nationality: string;
    height: string;
    weight: string;
    bloodtype: string;
    occupation: string;
    precinctnumber: string;
    emergencyDetails: EmergencyDetails;
    signaturejpg: string;
    barangayIDjpg: string;
    validIDjpg:string ;
    letterjpg: string;
    copyOfPropertyTitle: string;
    dtiRegistration: string;
    isCCTV: string;
    taxDeclaration: string;
    approvedBldgPlan: string;
    deathCertificate: string;
    identificationPic: string;
    dateofdeath: string;
    wardFname: string;
    wardRelationship: string;
    guardianshipType: string;
    CYFrom: string;
    CYTo: string;
    attestedBy: string;
    goodMoralPurpose: string;
    noIncomeChildFName: string;
    noIncomePurpose: string;
    deceasedEstateName: string;
    estateSince: string;
    noOfTRU: string;
    vehicleMake: string;
    vehicleType: string;
    vehiclePlateNo: string;
    vehicleSerialNo: string;
    vehicleChassisNo: string;
    vehicleEngineNo: string;
    vehicleFileNo: string;
    docsRequired: File[]; // Changed to File[] to match the file structure
    fromAddress: string;
    goodMoralOtherPurpose: string;
    noOfVechicles: string;
    dateOfFireIncident: string;
    nameOfTyphoon: string;
    dateOfTyphoon: string;
    projectLocation: string;
    homeOrOfficeAddress: string;
    rejectionReason: string;
    orNumber: string;
    orImageUpload: string;
    photoUploaded: string; // For Residency purpose
    interviewRemarks: string; // For Barangay Indigency
    residentId: string;
}

interface File {
    name?: string;
}

/*
For Reason For Rejection
*/

interface rejectProp {
    reason: string;
}


const ViewOnlineRequest = () => {
    const user = useSession().data?.user;
    const [userPosition, setUserPosition] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const  [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<OnlineRequest>();
    const [activeSection, setActiveSection] = useState("basic");
    const [popupSection, setPopupSection] = useState("receival");
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showDocumentGeneratedPopup, setShowDocumentGeneratedPopup] = useState(false);
    const [showNotifyAdminPopup, setShowNotifyAdminPopup] = useState(false);
    const [showNotifyRequestorPopup, setShowNotifyRequestorPopup] = useState(false);
    const [showAppointmentApprovedPopup, setShowAppointmentApprovedPopup] = useState(false);
    const [showPhotoUploadSuccessPopup, setShowPhotoUploadSuccessPopup] = useState(false);
    const [showInterviewRemarksSuccessPopup, setShowInterviewRemarksSuccessPopup] = useState(false);
    const [showCompletionPopup, setShowCompletionPopup] = useState(false);
    const [matchedOtherDocFields, setMatchedOtherDocFields] = useState<string[]>([]);
    const [orNumber, setOrNumber] = useState("");
    const [otherDocuments, setOtherDocuments] = useState<
      { type: string; title: string; fields: { name: string }[] }[]
    >([]);
    const [files1, setFiles1] = useState<{ name: string; preview: string }[]>([]);


      // matic first time jobseeker checker

      const [showJobseekerPopup, setShowJobseekerPopup] = useState(false);
      const [jobseekerPopupMessage, setJobseekerPopupMessage] = useState("");
      const [askAddToList, setAskAddToList] = useState(false);
      const [firstTimeClaimed, setFirstTimeClaimed] = useState<boolean | null>(null);

      useEffect(() => {
        const checkJobseeker = async () => {
          if (!requestData) return;
          if (requestData.status === "Completed" || requestData.status === "In - Progress") return;
          if (requestData.purpose !== "First Time Jobseeker") return;
      
          try {
            const jobSeekerRef = collection(db, "JobSeekerList");
      
            // 🔍 Check by residentId first
            const byResidentIdQuery = query(jobSeekerRef, where("residentId", "==", requestData.residentId));
            const byResidentIdSnap = await getDocs(byResidentIdQuery);
      
            if (!byResidentIdSnap.empty) {
              const existingDoc = byResidentIdSnap.docs[0].data();
              setFirstTimeClaimed(existingDoc?.firstTimeClaimed ?? null);
              if (existingDoc?.firstTimeClaimed === false) {
                setJobseekerPopupMessage(
                  "This applicant is already in the Jobseeker List, but the document has not been claimed yet. Payment will NOT be required."
                );
              } else {
                setJobseekerPopupMessage(
                  "This applicant is already in the Jobseeker List and has claimed a document before. Payment will be required."
                );
              }
              setShowJobseekerPopup(true);
              return;
            }
      
            // 🔍 Fallback by split names + DOB
            let firstName = "";
            let lastName = "";
            if (requestData.requestorFname) {
              const parts = requestData.requestorFname.trim().split(" ");
              firstName = parts[0] || "";
              lastName = parts.length >= 2 ? parts[parts.length - 1] : "";
            }
      
            const snapshot = await getDocs(jobSeekerRef);
            const matchDoc = snapshot.docs.find(doc => {
              const data = doc.data();
      
              const dbFirstName = (data.firstName || "").toLowerCase().trim();
              const dbLastName = (data.lastName || "").toLowerCase().trim();
              const dbDOB = (data.dateOfBirth || "").split("T")[0];
      
              const localFirstName = firstName.toLowerCase().trim();
              const localLastName = lastName.toLowerCase().trim();
              const localDOB = (requestData.birthday || "").split("T")[0];
      
              return dbFirstName === localFirstName &&
                     dbLastName === localLastName &&
                     dbDOB === localDOB;
            });
      
            if (matchDoc) {
              const data = matchDoc.data();
              setFirstTimeClaimed(data?.firstTimeClaimed ?? null);
              if (data?.firstTimeClaimed === false) {
                // No popup needed, since already in list & not yet claimed
                return;
              } else {
                setJobseekerPopupMessage(
                  "This applicant is already in the Jobseeker List and has claimed a document before. Payment will be required."
                );
                setShowJobseekerPopup(true);
                return;
              }
            } else {
              if (userPosition === "Assistant Secretary") {
                setJobseekerPopupMessage(
                  "This applicant is not yet in the First Time Jobseeker List.\n" +
                  "Under RA 11261, this means the request will not be paid for unless added.\n" +
                  "Do you want to add them now to the Jobseeker List?"
                );
                setShowJobseekerPopup(true);
                setAskAddToList(true);
              } else {
                setJobseekerPopupMessage(
                  "This applicant is not yet in the First Time Jobseeker List. Under RA 11261, this means the request will not be paid for. Only the Assistant Secretary can add them to the list."
                );
                setShowJobseekerPopup(true);
                setAskAddToList(false); // ✅ Make sure no Yes/No buttons show
              }
            }
            
      
          } catch (err) {
            console.error("Error checking JobSeekerList:", err);
          }
        };
      
        checkJobseeker();
      }, [requestData]);
      
       
  
  
  // handle function for matic jobseeker
  const handleAddToJobseekerList = async () => {
    try {
      if (!requestData) return;
  
      // Split the requestorFname into first, middle, last
      let firstName = "";
      let middleName = "";
      let lastName = "";
      if (requestData.requestorFname) {
        const parts = requestData.requestorFname.trim().split(" ");
        firstName = parts[0] || "";
        middleName = parts.length === 3 ? parts[1] : "";
        lastName = parts.length >= 2 ? parts[parts.length - 1] : "";
      }
  
      // Build new jobseeker data for Firestore
      const newDoc = {
        dateApplied: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        lastName,
        firstName,
        middleName,
        age: parseInt(requestData.age || "0"),
        dateOfBirth: requestData.birthday || "",
        monthOfBirth: requestData.birthday ? (new Date(requestData.birthday).getMonth() + 1).toString() : "",
        dayOfBirth: requestData.birthday ? new Date(requestData.birthday).getDate().toString() : "",
        yearOfBirth: requestData.birthday ? new Date(requestData.birthday).getFullYear().toString() : "",
        sex: requestData.gender || "",
        remarks: "",
        residentId: requestData.residentId || "",
        identificationFileURL: requestData.validIDjpg || "",
        firstTimeClaimed: false,
      };
  
      // Save to Firestore
      await addDoc(collection(db, "JobSeekerList"), newDoc);
  
      // If you want, also set it to your form state
  
      // Show success feedback
      setShowJobseekerPopup(false);
      setAskAddToList(false);
      setPopupMessage("Added to Jobseeker List successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
  
    } catch (err) {
      console.error("Failed to add to JobSeekerList:", err);
    }
  };
  
      


useEffect(() => {
  const id = searchParams.get("id");
  const reqType = searchParams.get("reqType");

  if (!id) return;

  if (!reqType) {
    router.replace(`/dashboard/ServicesModule/ViewRequest?reqType=online&id=${id}`, { scroll: false });
  }
}, [searchParams, router]);


/*
For Reason for Reject
*/

  const [rejectionReason, setRejectionReason] = useState<rejectProp>({
        reason: "",
    });
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [data, setData] = useState<any>();
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false); 



/*
Functions for Reason for Reject
*/

  useEffect(() => {
        if (!id) return
        try {
            const fetchData = async () => {
                // Fetch the document from Firestore
                const docRef = doc(db, "ServiceRequests", id);
                const docSnapshot = await getDoc(docRef);
                
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setData(data);
                } else {
                    console.error("Document does not exist");
                }
            };
            fetchData();
        } catch (error: any) {
            console.error("Error fetching data:", error.message);
            
        }

    },[]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRejectionReason({
            ...rejectionReason,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmitClick = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        if (rejectionReason.reason.trim() === "") {
            setPopupErrorMessage("Please fill up all the fields.");
            setShowErrorPopup(true);
            setTimeout(() => {
                setShowErrorPopup(false);
            }, 3000);
            return;
        }

      
        setShowSubmitRejectPopup(true); // change
    };
    

{/*}
    const confirmSubmit = () => {
        try {
            handleRejection();
            setShowSubmitRejectPopup(false); // change


            setTimeout(() => {
                  setPopupMessage("Reason for Rejection submitted successfully!");
                  setShowPopup(true); // ✅ show success popup after hiding
              }, 100); // slight delay to allow DOM transition (optional)

            setTimeout(() => {
                setShowPopup(false);
                if(data?.reqType === "In Barangay") {
                    router.push(`/dashboard/ServicesModule/InBarangayRequests?highlight=${id}`);
                }
                else{
                    router.push(`/dashboard/ServicesModule/OnlineRequests?highlight=${id}`);
                }
                
            }, 3000);
        } catch (error) {
            console.error("Error updating rejection reason:", error);
        }
    };
*/}


      const confirmSubmit = () => {
          try {
              handleRejection();
              setShowSubmitRejectPopup(false); // close confirmation

              setShowRejectPopup(false); 

              setTimeout(() => {
                  setPopupMessage("Reason for Rejection submitted successfully!");
                  setShowPopup(true); // ✅ show success popup after hiding
              }, 100); // slight delay to allow DOM transition (optional)

              setTimeout(() => {
                  setShowPopup(false);
                  if (data?.reqType === "In Barangay") {
                      router.push(`/dashboard/ServicesModule/InBarangayRequests?highlight=${id}`);
                  } else {
                      router.push(`/dashboard/ServicesModule/OnlineRequests?highlight=${id}`);
                  }
              }, 3000);
          } catch (error) {
              console.error("Error updating rejection reason:", error);
          }
      };



    const handleRejection = async () => {
        try {
            if (!id) return;
            const docRef = doc(db, "ServiceRequests", id);
            const updatedData = {
                status: "Rejected",
                statusPriority: 5,
                rejectionReason: rejectionReason.reason,
                sendTo: "Admin Staff",
            };
            await updateDoc(docRef, updatedData);

            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
                residentID: data?.accID,       // the user id linked to this request
                requestID: id,                 // the Firestore UID
                message: `Your Document Request (${data?.requestId}) has been rejected. Reason: (${rejectionReason.reason})`,
                timestamp: new Date(),
                transactionType: "Online Request",
                isRead: false,
            });



        //    router.push(`/dashboard/ServicesModule/InBarangayRequests?highlight=${id}`);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };




  /*
    EXISTING FUNCTIONS FOR VIEW REQUESTS
  */


    useEffect(() => {
        if (user) {
            setUserPosition(user.position || null);
        }

    },[user])


    useEffect(() => {
        if(!id) return
        const serviceRef = doc(db, "ServiceRequests", id);
        const unsubscribe = onSnapshot(serviceRef, (doc) => {
            if (doc.exists()) {
            const data = doc.data() as OnlineRequest;

            // If appointmentDate exists, format time string
            if (data.appointmentDate) {
              const isoDate = data.appointmentDate;
              const dateObj = new Date(isoDate);
              // Get time in HH:mm AM/PM format
              const timeString = dateObj.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
              });
              // You can add this to the data object if you want to use it in your UI
              setRequestData({
                ...data,
                appointmentDate: timeString,
              });
            }

            setRequestData(data);
            setLoading(false);
            }
        })
        return () => {
          unsubscribe(); // Clean up the listener
        };
        }, [id]);
    const [status, setStatus] = useState("");    
    
   
    useEffect(() => {
        if (!requestData) return;
        // Set status based on requestData
        setStatus(requestData?.status);
   }, [requestData]);
  
    const handleDownloadUrl = async (data: OnlineRequest): Promise<OnlineRequest> => {
      const fileJpgFields = [
        "signaturejpg",
        "barangayIDjpg",
        "validIDjpg",
        "letterjpg",
        "copyOfPropertyTitle",
        "dtiRegistration",
        "isCCTV",
        "taxDeclaration",
        "approvedBldgPlan",
        "deathCertificate",
        "identificationPic",
        "orImageUpload",
      ] as const;

      const updatedData = { ...data };

      for (const field of fileJpgFields) {
        const filename = data[field];

        // Skip if already a full URL
        if (
          filename &&
          typeof filename === "string" &&
          !filename.startsWith("https://")
        ) {
          try {
            const fileRef = ref(storage, `/ServiceRequests/${filename}`);
            const downloadUrl = await getDownloadURL(fileRef);
            updatedData[field] = downloadUrl;
          } catch (error) {
            console.warn(`Could not get URL for ${field}:`, error);
          }
        }
      }

      return updatedData;
    };

    const handleORUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles1([{ name: file.name, preview }]);
    
      // Optionally store in requestData.orImageUpload here (if needed)
      // Example: setRequestData(prev => ({ ...prev, orImageUpload: file.name }));
    
      e.target.value = "";
    
      // Optional cleanup
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleORDelete = (fileName: string) => {
      setFiles1((prev) => prev.filter((file) => file.name !== fileName));
    };
    
    useEffect(() => {
      const fetchMatchedOtherDocFields = async () => {
        try {
          if (!requestData?.docType || !requestData?.purpose) return;
    
          const snapshot = await getDocs(collection(db, "OtherDocuments"));
    
          const matchedDoc = snapshot.docs.find(
            (doc) =>
              doc.data().type === requestData.docType &&
              doc.data().title === requestData.purpose
          );
    
          if (matchedDoc) {
            const fields = matchedDoc.data().fields || [];
            const fieldNames = fields.map((f: any) => f.name);
            setMatchedOtherDocFields(fieldNames);
          } else {
            setMatchedOtherDocFields([]); // no match
          }
        } catch (error) {
          console.error("Error fetching matched OtherDocuments fields:", error);
        }
      };
    
      fetchMatchedOtherDocFields();
    }, [requestData?.docType, requestData?.purpose]);


  
  
  useEffect(() => {
    const fetchOtherDocs = async () => {
      const q = query(collection(db, "OtherDocuments"));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          type: data.type,
          title: data.title,
          fields: data.fields || [],
        };
      });
      setOtherDocuments(docs);
    };
  
    fetchOtherDocs();
  }, []);


   useEffect(() => {
      if (!requestData) return;
      if(!(requestData?.reqType === "In Barangay")) {
        const fetchUrls = async () => {
          const updated = await handleDownloadUrl(requestData);

          // Avoid state update if no real changes
          if (JSON.stringify(updated) !== JSON.stringify(requestData)) {
            setRequestData(updated);
          }
        };
        fetchUrls();
      }
    }, [requestData]);


    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedStatus = e.target.value;
        setPendingStatus(selectedStatus);     // store temporary selection
        setShowSubmitPopup(true);            // trigger confirmation popup
    };

    const confirmStatusChange = async () => {
        if (!pendingStatus) return;
    
        setShowSubmitPopup(false);
    
        // Show success popup immediately
        setPopupMessage("Status updated successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    
        await handleSave(pendingStatus); // still perform DB updates in the background
        setPendingStatus(null);
    };

    useEffect(() => {
        if (requestData?.status) {
          setStatus(requestData.status);
        }
      }, [requestData?.status]);
    
    const cancelStatusChange = () => {
        setShowSubmitPopup(false);
        setPendingStatus(null);
    };


    const requestField = [
        { key: "createdAt", label: "Date Requested" },
        { key: "docType", label: "Document Type" },
        { key: "purpose", label: "Purpose" },
        { key: "appointmentDate", label: "Appointment Date" },
        { key: "fullName", label: "Full Name" },
        { key: "partnerWifeHusbandFullName", label: "Partner's/Wife's/Husband's Full Name" },
        { key: "businessName", label: "Business Name" },
        { key: "businessNature", label: "Business Nature" },
        { key: "businessLocation", label: "Business Location" },
        { key: "puvPurpose", label: "Purpose of Certificate" },
        { key: "vehicleType", label: "Vehicle Description"  },            
        { key: "nosOfPUV", label: "No of Vehicles"  },
        { key: "noOfTRU", label: "No Of Tricycle" },
        { key: "vehicleMake", label: "Tricycle Make" },
        { key: "vehicleType", label: "Tricycle Type"  },
        { key: "vehiclePlateNo", label: "Tricycle Plate No"  },
        { key: "vehicleSerialNo", label: "Tricycle Serial No"  },
        { key: "vehicleChassisNo", label: "Tricycle Chassis No" },
        { key: "vehicleEngineNo", label: "Tricycle Engine No" },
        { key: "vehicleFileNo", label: "Tricycle File No"  },
        { key: "cohabitationStartDate", label: "Start of Cohabitation" },
        { key: "cohabitationRelationship", label: "Cohabitation Relationship"},
        { key: "noIncomePurpose", label: "No Income Purpose" },
        { key: "noIncomeChildFName", label: "Son/Daughter's Name" },
        { key: "address", label: "Requestor's Address" },
        { key: "estateSince", label: "Estate Since" },
        { key: "guardianshipType", label: "Guardianship Type" },
        { key: "wardRelationship", label: "Ward's Relationship" },
        { key: "wardFname", label: "Ward's Full Name" },
        { key: "toAddress", label: "To Address" },
        { key: "attestedBy", label: "Attested By" },
        { key: "CYFrom", label: "Cohabitation Year From" },
        { key: "CYTo", label: "Cohabitation Year To" },
        { key: "goodMoralPurpose", label: "Purpose Of Good Moral" },
        { key: "age", label: "Requestor's Age" },
        { key: "dateOfResidency", label: "Requestor's Date of Residency" },
        { key: "occupation", label: "Occupation" },
        { key: "civilStatus", label: "Requestor's Civil Status" },
        { key: "citizenship", label: "Requestor's Citizenship" },
        { key: "gender", label: "Requestor's Gender" },
        { key: "contact", label: "Requestor's Contact" },
        { key: "birthday", label: "Requestor's Birthday" },
        { key: "dateofdeath", label: "Date Of Death" },
        { key: "estimatedCapital", label: "Estimated Capital" },
        { key: "typeofconstruction", label: "Type of Construction" },
        { key: "typeofbldg", label: "Type of Building" },
        { key: "projectName", label: "Project Name" },
        { key: "educationalAttainment", label: "Educational Attainment" },
        { key: "course", label: "Course" },
        { key: "isBeneficiary", label: "Is Beneficiary" },
        { key: "birthplace", label: "Birthplace" },
        { key: "religion", label: "Religion" },
        { key: "fromAddress", label: "From Address"},
        { key: "goodMoralOtherPurpose", label: "Certificate Purpose"}, // for Garage/PUV purpose iba lang kasi yung field name sa db
        { key: "noOfVechicles", label: "No of Vehicles"},
        
        // Emergency Details Fields
        { key: "emergencyDetails.firstName", label: "Emergency Contact First Name" },
        { key: "emergencyDetails.middleName", label: "Emergency Contact Middle Name" },
        { key: "emergencyDetails.lastName", label: "Emergency Contact Last Name" },
        { key: "emergencyDetails.address", label: "Emergency Contact Address" },
        { key: "emergencyDetails.relationship", label: "Emergency Contact Relationship" },
        { key: "emergencyDetails.contactNumber", label: "Emergency Contact Number" },

        { key: "requestor", label: "Requestor's Full Name"},
        { key: "rejectionReason", label: "Reason for Rejection"},
        { key: "dateOfFireIncident", label: "Date of Fire Incident"},
        { key: "nameOfTyphoon", label: "Name of Typhoon"},
        { key: "dateOfTyphoon", label: "Date of Typhoon"},
        { key: "projectLocation", label: "Project Location"},
        { key: "homeOrOfficeAddress", label: "Home / Office Address"},
        { key: "precinctnumber", label: "Precinct Number"},
        { key: "bloodtype", label: "Blood Type"},

        // File Fields
        { key: "signaturejpg", label: "Signature" },
        { key: "barangayIDjpg", label: "Barangay ID" },
        { key: "validIDjpg", label: "Valid ID" },
        { key: "letterjpg", label: "Endorsement Letter" },
        { key: "copyOfPropertyTitle", label: "Copy of Property Title" },
        { key: "dtiRegistration", label: "DTI Registration" },
        { key: "isCCTV", label: "CCTV Requirement" },
        { key: "taxDeclaration", label: "Tax Declaration" },
        { key: "approvedBldgPlan", label: "Approved Building Plan" },
        { key: "deathCertificate", label: "Death Certificate" },
        { key: "identificationPic", label: "Identification Picture" },

        // OR
        { key: "orNumber", label: "OR Number" },
        { key: "orImageUpload", label: "OR Image" },
        ];


        
        const predefinedFieldSections: Record<string, {
            basic?: string[];
            full?: string[];
            others?: string[];
          }> = {
            "Death Residency": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "fullName",
                "dateofdeath",
                "estateSince",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
                "deathCertificate",
              ],
            },
            "Cohabitation": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "partnerWifeHusbandFullName",
                "cohabitationStartDate",
                "cohabitationRelationship",

              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],  
          },
         "Occupancy /  Moving Out": {
              basic: [
                "createdAt",
                "requestor",
                "docType",
                "dateOfResidency",
                "purpose",
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age",
                "civilStatus",
                "gender",
                "citizenship",
                "fullName",
                "fromAddress",
                "toAddress",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Guardianship": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "guardianshipType",
              ],
              full: [
                "birthday",
                "contact",
                "age",
                "civilStatus",
                "gender",
                "citizenship",
                "fullName",
                "wardRelationship",
                "wardFname",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Residency": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "appointmentDate",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "CYFrom", 
                "attestedBy", 
                "CYTo", 
              ],
              others: [
                "identificationPic",
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Good Moral and Probation": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency",               
                "purpose", 
                "address", 
                "goodMoralPurpose",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "No Income": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "noIncomePurpose",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "noIncomeChildFName",    
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Estate Tax": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "fullName",
                "dateofdeath",
                "estateSince",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
                "deathCertificate",
            ],
          },
          "Garage/TRU": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName", 
                "vehiclePlateNo",
                "businessNature",
                "vehicleSerialNo",
                "businessLocation",
                "vehicleChassisNo",
                "noOfVechicles",
                "vehicleEngineNo",
                "vehicleMake",
                "vehicleFileNo",   
                "vehicleType",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Garage/PUV": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "goodMoralOtherPurpose",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "vehicleType",
                "noOfVechicles",
   
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Financial Subsidy of Solo Parent": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "goodMoralOtherPurpose",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "noIncomeChildFName"
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Fire Victims": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "dateOfFireIncident"
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Flood Victims": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "nameOfTyphoon",
                "dateOfTyphoon",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Barangay ID": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "birthplace",
                "occupation",
                "religion",
                "bloodtype",
                "nationality",
                "height",
                "precinctnumber",
                "weight"

              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "First Time Jobseeker": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "educationalAttainment",
                "course",
                "isBeneficiary",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          /* for business permit/temporary business permit */
          "New": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName",
                "businessNature",
                "businessLocation",
                "estimatedCapital",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Renewal": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName",
                "businessNature",
                "businessLocation",
                "estimatedCapital",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
        }

        const constructionPermitFields = {
          /* For Construction Permit */
            basic: [
             "createdAt", 
             "requestor",
              "docType", 
              "dateOfResidency", 
              "purpose", 
              "address",
            ],
            full: [
              "birthday",
              "contact",
              "age", 
              "civilStatus", 
              "gender", 
              "citizenship", 
              "typeofconstruction",
              "projectName",
              "typeofbldg",
              "projectLocation",
              "homeOrOfficeAddress",
            ],
            others: [
              "signaturejpg",
              "barangayIDjpg",
              "validIDjpg",
              "letterjpg",
          ],
        }

        
        const otherDocPredefinedFields = {
          basic: [
            "createdAt", 
            "requestor", 
            "docType", 
            "dateOfResidency", 
            "purpose", 
            "address", 
          ],
          full: [
            "birthday",
            "contact",
            "age", 
            "civilStatus", 
            "gender", 
            "citizenship", 
          ],
          others: [
            "signaturejpg",
            "barangayIDjpg",
            "validIDjpg",
            "letterjpg",
          ],
        };
        

        const defaultFieldSections = {
          basic: ["createdAt", "requestor", "docType", "dateOfResidency", "purpose", "address"],
          full: ["birthday", "contact", "age", "civilStatus", "gender", "citizenship"],
          others: ["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg"],
        };
        
        const excludedImageFields = [
          "signaturejpg",
          "barangayIDjpg",
          "validIDjpg",
          "letterjpg",
        ];


        
        
        const fieldSections = useMemo(() => {
          if (requestData?.docType === "Construction") {
            return {
              basic: [...constructionPermitFields.basic],
              full: [...constructionPermitFields.full],
              others: [...constructionPermitFields.others],
            };
          }
        
          if (!requestData?.purpose && !requestData?.docType) return defaultFieldSections;
        
          // Match by (1) purpose + type
          const matchedByPurpose = otherDocuments.find(
            (doc) =>
              doc.title === requestData?.purpose &&
              doc.type === requestData?.docType
          );
        
          // Match by (2) docType === title
          const matchedByDocType = otherDocuments.find(
            (doc) => doc.title === requestData?.docType
          );
        
          // ✅ Match by (3) title === purpose (regardless of type)
          const matchedByTitleOnly = otherDocuments.find(
            (doc) => doc.title === requestData?.purpose
          );
        
          // ✅ Combine all matched fields
          const combinedFields = Array.from(
            new Map(
              [
                ...(matchedByPurpose?.fields || []),
                ...(matchedByDocType?.fields || []),
                ...(matchedByTitleOnly?.fields || []),
              ].map((field) => [field.name, field]) // key by field name
            ).values()
          );
        
          const excludedDynamicFields = [
            "requestorFname",
            "requestorMrMs",
            "dateOfResidency",
            "address",
          ];
        
          const dynamicFields = combinedFields
            .map((f) => f.name)
            .filter((name) => !excludedDynamicFields.includes(name));
        
          const dynamicToFull = dynamicFields.filter(
            (field) => !excludedImageFields.includes(field)
          );
          const dynamicToOthers = dynamicFields.filter((field) =>
            excludedImageFields.includes(field)
          );
        
          const predefined = predefinedFieldSections[requestData?.purpose || ""];
        
          if (predefined) {
            return {
              basic: [...(predefined.basic || [])],
              full: [...(predefined.full || []), ...dynamicToFull],
              others: [...(predefined.others || []), ...dynamicToOthers],
            };
          } else if (matchedByPurpose || matchedByDocType || matchedByTitleOnly) {
            return {
              basic: [...otherDocPredefinedFields.basic],
              full: [...otherDocPredefinedFields.full, ...dynamicToFull],
              others: [...otherDocPredefinedFields.others, ...dynamicToOthers],
            };
          } else {
            return defaultFieldSections;
          }
        }, [requestData?.purpose, requestData?.docType, otherDocuments]);
        

        
        const formatFieldName = (name: string) =>
          name
            .replace(/_/g, " ") // Replace underscores with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word

        const getLabel = (key: string): string => {
          const baseLabel = requestField.find((field) => field.key === key)?.label || formatFieldName(key);
        
          if (key === "fullName") {
            // Customize label for fullName depending on docType or purpose
            if (requestData?.purpose === "Occupancy /  Moving Out") {
              return `From ${baseLabel}`;
            }

            if (requestData?.purpose === "Estate Tax" || requestData?.purpose === "Death Residency") {
              return `Deceased's ${baseLabel}`;
            }
        
            if (requestData?.purpose === "Guardianship") {
              return `Guardian's ${baseLabel}`;
            }
        
            // Default fallback
            return baseLabel;
          }
        
          return baseLabel;
        };
      
    const currentPurpose = requestData?.purpose as keyof typeof predefinedFieldSections;
    const currentSections = predefinedFieldSections[currentPurpose] || {};
    const [resolvedImageUrls, setResolvedImageUrls] = useState<Record<string, string>>({});
    
    useEffect(() => {
      const resolveFilenamesToUrls = async () => {
        if (!requestData) return;
    
        const allFieldKeys = [
          ...fieldSections.basic,
          ...fieldSections.full,
          ...fieldSections.others,
        ];
    
        const keys = Object.keys(requestData).filter((key) => {
          const value = String(requestData[key as keyof typeof requestData]);
          return (
            !allFieldKeys.includes(key) &&
            typeof value === "string" &&
            value.startsWith("service_request_")
          );
        });
    
        const resolved: Record<string, string> = {};
        for (const key of keys) {
          try {
            const filename = requestData[key as keyof typeof requestData];
            const fileRef = ref(storage, `ServiceRequests/${filename}`);
            const url = await getDownloadURL(fileRef);
            resolved[key] = url;
          } catch (error) {
            console.error("Failed to get download URL for", key, error);
          }
        }
    
        setResolvedImageUrls(resolved);
      };
    
      resolveFilenamesToUrls();
    }, [requestData, fieldSections]);

      
    const renderSection = (sectionName: "basic" | "full" | "others") => {
      let fieldKeys = fieldSections[sectionName] || [];

      if (sectionName === "others") {
        return (
         <div className="others-image-section">
            {requestData?.reqType === "InBarangay" ? (
              <>
                {requestData?.docsRequired?.map((file, index) => (
                  <div key={index} className="services-onlinereq-verification-requirements-section">
                    <span className="verification-requirements-label">Image {index + 1}</span>
                    <div className="services-onlinereq-verification-requirements-container">
                      <a href={file.name} target="_blank" rel="noopener noreferrer">
                        <img
                          src={file.name}
                          alt={`Image ${index}`}
                          className="verification-reqs-pic uploaded-picture"
                          style={{ cursor: 'pointer' }}
                        />
                      </a>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
               {requestData &&
                [
                  ...fieldKeys,
                  ...Object.keys(requestData).filter((key) => {
                    const value = String(requestData[key as keyof typeof requestData]);
                    return (
                      !fieldKeys.includes(key) &&
                      typeof value === "string" &&
                      (value.startsWith("https://firebasestorage") || value.startsWith("service_request_"))
                    );
                  }),
                ].map((key) => {
                  const value = requestData[key as keyof typeof requestData];
                  if (!value) return null;

                  let fileUrl: string | undefined;
                    if (typeof value === "string") {
                      fileUrl = value.startsWith("service_request_") ? resolvedImageUrls[key] : value;
                    }

                  if (!fileUrl) return null; // still loading or failed to resolve

                  return (
                    <div key={key} className="services-onlinereq-verification-requirements-section">
                      <span className="verification-requirements-label">{getLabel(key)}</span>
                      <div className="services-onlinereq-verification-requirements-container">
                      {fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={fileUrl}
                            alt={getLabel(key)}
                            className="verification-reqs-pic uploaded-picture"
                            style={{ cursor: 'pointer' }}
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
        );
      }
    
      

      //  Layout for basic/full with dynamic fields included
      const leftFields = fieldKeys.filter((_, i) => i % 2 === 0);
      const rightFields = fieldKeys.filter((_, i) => i % 2 !== 0);
    
      const renderField = (key: string) => {
        let value;
      
        if (key.includes(".")) {
          value = key.split(".").reduce((obj, k) => (obj as any)?.[k], requestData);
        } else {
          value = (requestData as any)?.[key];
        }
      
        if (key === "isBeneficiary") {
          value = value === true ? "Yes" : value === false ? "No" : "";
        }
      
        if (!value) return null;
      
        return (
          <div key={key} className="services-onlinereq-fields-section">
            <p>{getLabel(key)}</p>
            <input
              type="text"
              className="services-onlinereq-input-field"
              value={value}
              readOnly
            />
          </div>
        );
      };
      return (
        <div className="services-onlinereq-content" style={{ display: 'flex', gap: '2rem' }}>
          <div className="services-onlinereq-content-left-side" style={{ flex: 1 }}>
            {leftFields.map(renderField)}
          </div>
          <div className="services-onlinereq-content-right-side" style={{ flex: 1 }}>
            {rightFields.map(renderField)}
          </div>
        </div>
      );
    };
     
    const handleBack = () => {
        router.back();
    };

    const handleviewappointmentdetails = () => {
        router.push("/dashboard/ServicesModule/Appointments")
    };

    const handlerejection = () => {
        setShowRejectPopup(true);
       /* router.push("/dashboard/ServicesModule/OnlineRequests/ReasonForReject/?id=" + id); */
    };

    const handleSave = async (newStatus: string) => {
        try {
            if (!id) return;
        
            const docRef = doc(db, "ServiceRequests", id);
        
            const updatedData = {
                status: newStatus,
                ...(newStatus === "Pending" && { statusPriority: 1 }),
                ...(newStatus === "Pick-up" && { statusPriority: 2 }),
                ...(newStatus === "Completed" && { statusPriority: 3 }),
            };
        
            // Create notification
            const notificationRef = collection(db, "Notifications");
            await addDoc(notificationRef, {
                residentID: requestData?.accID,
                requestID: id,
                message: `Your Document Request (${requestData?.requestId}) has been updated to "${newStatus}".`,
                timestamp: new Date(),
                transactionType: "Online Request",
                isRead: false,
            });
        
            // Update Firestore document
            await updateDoc(docRef, updatedData);
        
            //  Manually update local requestData state so UI changes immediately
            setRequestData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    ...updatedData
                } as OnlineRequest;
            });
        
            setStatus(newStatus); // update local state after DB update

            
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSMS = async() => {
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: requestData?.contact,
                  message: `Hello Mr/Ms. ${requestData?.requestorFname}, your 
                  document request with ID ${requestData?.requestId} 
                  is now ready for pick-up. Please visit the barangay hall 
                  to collect your document. Thank you!`,
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");

          const data = await response.json();
          console.log(data);
        }
        catch(err) {
          console.log(err);
        }  
    };
  
    const [showReceivalForm, setShowReceivalForm] = useState(false);
    const [receival, setReceival] = useState({
      receivalName: "",
      receivalWhen: new Date(),
    })

    const handleReceivalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
    
      const docRef = doc(db, "ServiceRequests", id);
      const currentDateTime = new Date(); 
    
      const updatedData: any = {
        receivalName: receival.receivalName,
        receivalWhen: currentDateTime,
        status: "Completed",
        statusPriority: 3,
        orNumber: orNumber,
      };
    
      
      if (files1.length > 0) {
        const file = files1[0];
        const response = await fetch(file.preview);
        const blob = await response.blob();
    
        const storageRef = ref(storage, `ServiceRequests/${file.name}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
    
        updatedData.orImageUpload = downloadURL;
      }
    
      await updateDoc(docRef, updatedData);

      // update firsttimeclaimed to true if it was false

      if (requestData?.purpose === "First Time Jobseeker") {
        try {
          const jobSeekerRef = collection(db, "JobSeekerList");
    
          // Check by residentId first
          const byResidentIdQuery = query(jobSeekerRef, where("residentId", "==", requestData.residentId));
          const byResidentIdSnap = await getDocs(byResidentIdQuery);
    
          if (!byResidentIdSnap.empty) {
            const jobDoc = byResidentIdSnap.docs[0];
            const data = jobDoc.data();
            if (!data.firstTimeClaimed) {
              await updateDoc(jobDoc.ref, { firstTimeClaimed: true });
            }
          } else {
            // Fallback by name + DOB
            const snapshot = await getDocs(jobSeekerRef);
            const match = snapshot.docs.find(doc => {
              const data = doc.data();
              return data.firstName?.toLowerCase() === requestData.requestorFname?.split(" ")[0]?.toLowerCase() &&
                     data.lastName?.toLowerCase() === requestData.requestorFname?.split(" ").slice(-1)[0]?.toLowerCase() &&
                     data.dateOfBirth === requestData.birthday;
            });
            if (match && !match.data().firstTimeClaimed) {
              await updateDoc(match.ref, { firstTimeClaimed: true });
            }
          }
        } catch (err) {
          console.error("Failed to update firstTimeClaimed:", err);
        }
      }
    
      const notificationRef = collection(db, "Notifications");
      await addDoc(notificationRef, {
        residentID: requestData?.accID,
        requestID: id,
        message: `Your document request (${requestData?.requestId}) has been completed and received. Thank you!`,
        timestamp: new Date(),
        transactionType: "Online Request",
        isRead: false,
    });

      setShowReceivalForm(false);
      handleRequestIsDone();
      setShowCompletionPopup(true);
    };

    const docPrinted = requestData?.docPrinted;

    
    const print = async() => {
      /* This part will handle ung pag generate ng pdf and also updates the request's status to In - Progress */
      if(!requestData?.documentTypeIs){
        handlePrint(requestData);
      }
      else{//if existing ung documentTypeIs, it will use the other generate document function
        handleGenerateDocument(requestData);
        console.log("Existing documentTypeIs, using other generate document function");
      }
      
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      let updatedData: any = {
          status: "In - Progress",
          statusPriority: 2,
          docPrinted: true,
      };

     await updateDoc(docRef, updatedData);

     const notificationRef = collection(db, "Notifications");
     await addDoc(notificationRef, {
       residentID: requestData?.accID,
       requestID: id,
       message: `Your document request (${requestData?.requestId}) has been updated to (${updatedData.status}) We will notify you once it's ready for pickup.`,
       timestamp: new Date(),
       transactionType: "Online Request",
       isRead: false,
     });

     setShowDocumentGeneratedPopup(true);
    }

    useEffect(() => {
      const fetchReceivalData = async () => {
        if (!id) return;
    
        const docRef = doc(db, "ServiceRequests", id);
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          const data = docSnap.data();
          setReceival({
            receivalName: data.receivalName || "",
            receivalWhen: data.receivalWhen?.seconds
              ? new Date(data.receivalWhen.seconds * 1000) // Convert Firestore Timestamp to JS Date
              : data.receivalWhen || "", // fallback
          });
        }
      };
    
      fetchReceivalData();
    }, [id]);

    const handleNextStep = async() => {
      if(!id) return;
      let updatedData = {}
      const docRef = doc(db, "ServiceRequests", id);

      if(requestData?.sendTo === "SAS"){
          /* This part will handle ung pag notify kay admin staff regarding the doc  */
         updatedData = {
          sendTo: "Admin Staff",
        }
                
        const notificationRef = collection(db, "BarangayNotifications");
        await addDoc(notificationRef, {
          message: `You have been assigned a new task for ${requestData.purpose} document requested by ${requestData.requestorFname}.`,
          timestamp: new Date(),
          requestorId: requestData?.accID,
          isRead: false,
          transactionType: "Online Assigned Service Request",
          recipientRole: "Admin Staff",
          requestID: id,
        });

        // await addDoc(collection(db, "Notifications"), {
        //   residentID: requestData?.accID,
        //   requestID: id,
        //   message: `Your document request (${requestData?.requestId}) is now (In - Progress). We will notify you once it progresses.`,
        //   timestamp: new Date(),
        //   transactionType: "Online Service Request",
        //   isRead: false,
        // });        
        

      }else{
        /* This part will handle ung pag notify kay resident na to pickup na ung  doc */
        //handleSMS(); Admin Staff will handle the sending of SMS to the resident
        updatedData = {
          status: "Pick-up",
          statusPriority: 3,
        }

        // notifs resident na for pick up na yung document
        const notificationRef = collection(db, "Notifications");
        await addDoc(notificationRef, {
          residentID: requestData?.accID,
          requestID: id,
          message: `Your document request (${requestData?.requestId}) is now ready for pickup. Please visit the barangay hall to collect it.`,
          timestamp: new Date(),
          transactionType: "Online Request",
          isRead: false,
      });
      

      }
      
      await updateDoc(docRef, updatedData);
    }

    const handleApprovedBySAS = async() => {
      /* This part will handle ung pag ka approve ni asst sec and sec sa appointment request */
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      const updatedData = {
          approvedBySAS: true,
          sendTo: "Admin Staff",
          status: "In - Progress",
          statusPriority: 2,
          ...(requestData?.docType === "Barangay Indigency" && {
            interviewRemarks:""
          }),
          ...(requestData?.purpose === "Residency" && {
            photoUploaded: "",
          }),
      };
      await updateDoc(docRef, updatedData);

      await addDoc(collection(db, "Notifications"), {
        residentID: requestData?.accID,
        requestID: id,
        message: `Your proposed appointment for (${requestData?.requestId}) has been approved. Please arrive to the barangay hall on time.`,
        timestamp: new Date(),
        transactionType: "Online Service Request",
        isRead: false,
      });

      const notificationRef = collection(db, "BarangayNotifications");

      if (requestData?.purpose === "Residency" && requestData?.reqType === "Online") {
        await addDoc(notificationRef, {
          message: `You have been assigned an appointment for picture taking for ${requestData?.purpose} for ${requestData?.requestorFname}.`,
          timestamp: new Date(),
          requestorId: requestData?.accID,
          isRead: false,
          transactionType: "Online Service Request",
          recipientRole: "Admin Staff",
          requestID: id,
        });
      } else if (requestData?.docType === "Barangay Indigency" && requestData?.reqType === "Online") {
        await addDoc(notificationRef, {
          message: `You have been assigned an appointment for interview for ${requestData?.docType} ${requestData?.purpose} for ${requestData?.requestorFname}.`,
          timestamp: new Date(),
          requestorId: requestData?.accID,
          isRead: false,
          transactionType: "Online Service Request",
          recipientRole: "Admin Staff",
          requestID: id,
        });
      }
      
    setShowAppointmentApprovedPopup(true);
    }

    const [showInterviewForm, setShowInterviewForm] = useState(false);
    const [interviewRemarks, setInterviewRemarks] = useState("");

    const handleInterviewRemarks = async(e:any) => {
      e.preventDefault();
      console.log("Interview Remarks: ", interviewRemarks);
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      const updatedData = {
          interviewRemarks: interviewRemarks,
          status: "In - Progress",
          statusPriority: 2,
          sendTo: "SAS",
          remarksCreated: new Date(),
      };
      await updateDoc(docRef, updatedData);

      const notificationRef = collection(db, "BarangayNotifications");
      await addDoc(notificationRef, {
        message: `You have been assigned a new task for ${requestData?.purpose} document requested by ${requestData?.requestorFname}.`,
        timestamp: new Date(),
        requestorId: requestData?.accID,
        isRead: false,
        transactionType: "Online Assigned Service Request",
        recipientRole: "Assistant Secretary",
        requestID: id,
      });

      setShowInterviewForm(false);
      setShowInterviewRemarksSuccessPopup(true);
    }

    
    const [showPhotoUpload, setshowPhotoUpload] = useState(false);
    const [files2, setFiles2] = useState<{ name: string, preview: string | undefined }[]>([]);
   
    const handlePhotoDelete = (fileName: string) => {
        setFiles2((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };
    
    const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const newFiles = selectedFiles.map((file) => ({
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setFiles2(newFiles);
    };

    const handlePhotoUpload = async(e:any) => {
      e.preventDefault();
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      const updatedData: any = {
          photoUploaded: "",
          status: "In - Progress",
          statusPriority: 2,
          sendTo: "SAS",
      };
      if (files2.length > 0) {
        const file = files2[0];
        if (!file.preview) return;
        const response = await fetch(file.preview);
        const blob = await response.blob();
      
        const storageRef = ref(storage, `ServiceRequests/${file.name}`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
      
        updatedData.photoUploaded = downloadURL;
      }
      await updateDoc(docRef, updatedData);

      const notificationRef = collection(db, "BarangayNotifications");
      await addDoc(notificationRef, {
        message: `A picture has been uploaded for request ${requestData?.docType} ${requestData?.purpose}.`,
        timestamp: new Date(),
        requestorId: requestData?.accID || "",  // adjust based on your actual data context
        isRead: false,
        transactionType: "Online Service Request",
        recipientRole: "Assistant Secretary",
        requestID: id,
      });
    

      setshowPhotoUpload(false); 
      setShowPhotoUploadSuccessPopup(true);
    }


    const [showRemarksGiven, setShowRemarksGiven] = useState(false);


    const handleRequestIsDone = async() => {
      /* This part will handle ung pag update ng status to Completed and nareceive n ni resident yung document */
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      const updatedData = {
          status: "Completed",
          statusPriority: 4,
      };
      await updateDoc(docRef, updatedData);
    }

    return (  
        <main className="main-container-services-onlinereq">



           {/*
            POP UP FOR REJECT
           */}


                {showRejectPopup && (
                  <div className="reasonfor-recject-popup-overlay">
                    <div className="reasonfor-reject-confirmation-popup">
                      <h2>Reject Request</h2>

                      <form onSubmit={handleSubmitClick} className="reject-container" >
                        <div className="box-container-outer-reasonforreject">
                          <div className="title-remarks-reasonforreject">Reason For Reject</div>
                          <div className="box-container-reasonforreject">
                            <textarea
                              className="reasonforreject-input-field"
                              name="reason"
                              id="reason"
                              placeholder="Enter the reason for denial (e.g., incomplete details, invalid ID)..."
                              value={rejectionReason.reason}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="reject-reason-yesno-container">
                          <button type="button" onClick={() => setShowRejectPopup(false)} className="reject-reason-no-button">
                            Cancel
                          </button>
                          <button type="submit" className="reject-reason-yes-button" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              {showSubmitRejectPopup && (
                <div className="confirmation-popup-overlay-services-onlinereq-reject">
                    <div className="confirmation-popup-services-onlinereq-status">
                        <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                        <p>Are you sure you want to Submit? </p>
                        <div className="yesno-container-add">
                            <button onClick={() => setShowSubmitRejectPopup(false)} className="no-button-add">No</button>
                            <button onClick={confirmSubmit} className="yes-button-add">Yes</button>
                        </div>
                    </div>
                </div>
            )}


                {showPopup && (
                <div className={`popup-overlay-services-onlinereq show`}>
                    <div className="popup-services-onlinereq">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}


                {showJobseekerPopup && (
                  <div className="confirmation-popup-overlay-services-onlinereq-status">
                    <div className="confirmation-popup-services-onlinereq-status">
                      <img src="/Images/question.png" alt="info icon" className="successful-icon-popup" />
                      <p style={{ whiteSpace: "pre-line" }}>{jobseekerPopupMessage}</p>
                      {askAddToList ? (
                        <div className="yesno-container-add">
                          <button onClick={() => setShowJobseekerPopup(false)} className="no-button-add">No</button>
                          <button onClick={() => handleAddToJobseekerList()} className="yes-button-add">Yes</button>
                        </div>
                      ) : (
                        <div className="yesno-container-add">
                          <button onClick={() => setShowJobseekerPopup(false)} className="yes-button-add">Close</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                
                
            {showErrorPopup && (
                    <div className={`rejectrequest-error-popup-overlay show`}>
                        <div className="rejectrequest-popup">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                            <p>{popupErrorMessage}</p>
                        </div>
                    </div>
                    )}
    

        
            {
              
              (
                (userPosition === "Admin Staff" && requestData?.sendTo === "Admin Staff") ||
                (["Assistant Secretary", "Secretary"].includes(userPosition || "") && requestData?.sendTo === "SAS")
              )
              && (
                <>
                  {(status !== "Completed" && status !== "Rejected") && (
                    <>
                      <div className="services-onlinereq-redirectionpage-section">
                        
                        {!docPrinted && (
                          <>
                          
                            {requestData?.appointmentDate && !requestData?.approvedBySAS && (
                              <>
                                
                                <button className="services-onlinereq-redirection-buttons" onClick={handlerejection}>
                                  <div className="services-onlinereq-redirection-icons-section">
                                      <img src="/images/rejected.png" alt="user info" className="redirection-icons-info" />
                                  </div>
                                  <h1>Reject Request</h1>
                                </button>
                              </>
                            )}
                            {!requestData?.appointmentDate && !(requestData?.purpose ==="Residency" || requestData?.docType === "Barangay Indigency") && (
                              <>
                                <button className="services-onlinereq-redirection-buttons" onClick={handlerejection}>
                                  <div className="services-onlinereq-redirection-icons-section">
                                      <img src="/images/rejected.png" alt="user info" className="redirection-icons-info" />
                                  </div>
                                  <h1>Reject Request</h1>
                                </button>
                              </>
                            )}
                        
                            {!requestData?.approvedBySAS && requestData?.appointmentDate ? (
                              <button className="services-onlinereq-redirection-buttons" onClick={handleApprovedBySAS}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Approve Appointment</h1>
                            </button>
                            ):(
                              <>
                                {((requestData?.docType === "Barangay Indigency" || requestData?.purpose==="Residency") && (user?.position === "Secretary" || user?.position === "Assistant Secretary" )) &&(
                                  <>
                                    <button className="services-onlinereq-redirection-buttons" onClick={print}>
                                    <div className="services-onlinereq-redirection-icons-section">
                                        <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                                    </div>
                                      <h1>Generate Document</h1>
                                    </button>
                                  </>
                                )}
                                {!requestData?.appointmentDate && !(requestData?.docType === "Barangay Indigency" || requestData?.purpose==="Residency") && (
                                  <button className="services-onlinereq-redirection-buttons" onClick={print}>
                                    <div className="services-onlinereq-redirection-icons-section">
                                        <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                                    </div>
                                      <h1>Generate Document</h1>
                                  </button>
                                )}
                              </>
                            )}
                            
                          </>
                        )}

                        {(requestData?.purpose==="Residency") && (requestData?.photoUploaded === "") &&( 
                          <>
                             <button className="services-onlinereq-redirection-buttons" onClick={()=>setshowPhotoUpload(true)}>
                                <div className="services-onlinereq-redirection-icons-section">
                                    <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                                </div>
                                  <h1>Upload ID Picture</h1>
                              </button>
                          </>
                        )}
                        
                        {(requestData?.docType === "Barangay Indigency") &&(requestData?.interviewRemarks === "") &&( 
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={() => setShowInterviewForm(true)}>
                                <div className="services-onlinereq-redirection-icons-section">
                                    <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                                </div>
                                  <h1>Interview Remarks</h1>
                              </button>
                          </>
                        )}


                    
                        {docPrinted && (userPosition !== "Admin Staff") ? (
                          <>
                            <button className="services-onlinereq-redirection-buttons"
                            onClick={() => {
                              handleNextStep();            
                              setShowNotifyAdminPopup(true); // show popup
                            }}
                            >
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Notify Admin Staff</h1>
                            </button>
                          </>
                        ) : (docPrinted && !["Assistant Secretary", "Secretary"].includes(userPosition as string) && status !== "Pick-up") &&(
                          <>
                            <button className="services-onlinereq-redirection-buttons"
                              onClick={() => {
                                handleNextStep();            
                                setShowNotifyRequestorPopup(true); // show popup
                              }}
                            >
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Notify Requestor</h1>
                            </button>
                          </>
                        )}
                         {docPrinted && status === "Pick-up" && (
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={() => setShowReceivalForm(true)}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Document Received</h1>
                            </button>
                          </>
                        )}

                        {/* {status === "Pick-up" && docPrinted && (
                          <button  onClick={handleSMS} className="services-onlinereq-redirection-buttons">
                              <div className="services-onlinereq-redirection-icons-section">
                              <img src="/images/sendSMS.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Send SMS</h1>
                          </button>
                        )} */}
                        {requestData?.appointmentDate && requestData?.approvedBySAS  && (
                          <button className="services-onlinereq-redirection-buttons" onClick={handleviewappointmentdetails}>
                              <div className="services-onlinereq-redirection-icons-section">
                              <img src="/images/appointment.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Appointment Details</h1>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
            )}

         {/*}   <div className="services-onlinereq-main-content"> */}


                <div
                  className="services-onlinereq-main-content"
                  style={{
                    height:
                      ((userPosition === "Admin Staff" && requestData?.sendTo === "Admin Staff") ||
                        (["Assistant Secretary", "Secretary"].includes(userPosition || "") &&
                          requestData?.sendTo === "SAS")) &&
                      status !== "Completed" &&
                      status !== "Rejected"
                        ? "100%"
                        : "85%",
                  }}
                >

                <div className="services-onlinereq-main-section1">
                    <div className="services-onlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> {requestData?.reqType || "Online"} Document Request Details </h1>
                    </div>
                </div>

                <div className="services-onlinereq-header-body">

                    <div className="services-onlinereq-header-body-top-section">
                        <div className="services-onlinereq-info-toggle-wrapper">
                        {[
                            "basic",
                            "full",
                            ...(requestData?.purpose === "Barangay ID" ? ["emergency"] : []),
                            "others",
                            ...(requestData?.status === "Rejected" ? ["rejected"] : []),
                            ...(requestData?.status === "Completed" ? ["received"] : []),
                            ...(requestData?.status === "Completed" &&
                              !["Barangay Clearance", "Barangay Certificate", "Barangay Indigency", "Other Documents"].includes(requestData?.docType || "")
                              ? ["or"]
                              : []),
                            ...((requestData?.purpose==="Residency") && (requestData?.photoUploaded)
                              ? ["photo"]
                              : []),
                            ...((requestData?.docType === "Barangay Indigency") &&(requestData?.interviewRemarks)
                              ? ["interview"]
                              : [])
                          ].map((section) => (
                            <button
                              key={section}
                              type="button"
                              className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                              onClick={() => setActiveSection(section)}
                            >
                              {section === "basic" && "Basic Info"}
                              {section === "full" && "Full Info"}
                              {section === "emergency" && "Emergency Info"}
                              {section === "others" && "Others"}
                              {section === "rejected" && "Rejected"}
                              {section === "received" && "Received"}
                              {section === "or" && "OR Section"}
                              {section === "photo" && "Photo Section"}
                              {section === "interview" && "Interview Remarks"}
                            </button>
                          ))}
                        </div> 
                    </div>

                    <div className="services-onlinereq-header-body-bottom-section">
                        <div className="services-onlinereq-main-details-container">
                            <div className="services-onlinereq-main-details-section">
                                <div className="services-onlinereq-main-details-topsection">
                                    <h1>{requestData?.requestId}</h1>
                                </div>
                                <div className="services-onlinereq-main-details-statussection">
                                    <h1> Status</h1>

                                    <div className="services-onlinereq-status-section-view">
                                        <select
                                            id="status"
                                            className={`services-onlinereq-status-dropdown ${status?.toLowerCase().replace(/\s*-\s*/g, "-") || ""}`}

                                            name="status"
                                            value={status}
                                            onChange={handleStatusChange}
                                            disabled
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In - Progress">In - Progress</option>
                                            <option value="Pick-up">Pick-up</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Rejected" disabled>Rejected</option>
                                        </select>
                                    </div> 
                                </div>

                                <div className="services-onlinereq-main-details-description">
                                    <div className="onlinereq-purpose-section">
                                        <div className="onlinereq-purpose-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                                <img src="/Images/purpose.png" alt="description icon" className="onlinereq-type-section-icon" />
                                            </div>
                                            <div className="onlinereq-main-details-title-section">
                                                <h1>Document Type</h1>
                                            </div>
                                        </div>
                                        <p>{requestData?.docType || "N/A"}</p>
                                    </div>
                                    <div className="onlinereq-purpose-section">
                                        <div className="onlinereq-purpose-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                                <img src="/Images/description.png" alt="description icon" className="onlinereq-purpose-section-icon" />
                                            </div>
                                            <div className="onlinereq-main-details-title-section">
                                                <h1>Purpose</h1>
                                            </div>
                                        </div>
                                        <p>{requestData?.purpose || "N/A"}</p>
                                    </div>

                                  
                                  
                                            <div className="onlinereq-date-section">
                                                <div className="onlinereq-date-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                           <img src="/Images/calendar.png" alt="calendar icon" className="onlinereq-calendar-section-icon" />
                                              </div>
                                              <div className="onlinereq-main-details-title-section">
                                                <h1>Date Requested</h1>
                                             </div>
                                           </div>
                                         <p>{requestData?.createdAt || "N/A"}</p>
                                      </div>
                                      
                                   

                                    {requestData?.appointmentDate && (
                                        <>
                                            <div className="onlinereq-date-section">
                                                <div className="onlinereq-date-topsection">
                                                    <div className="onlinereq-main-details-icons-section">
                                                        <img src="/Images/calendar.png" alt="calendar icon" className="onlinereq-calendar-section-icon" />
                                                    </div>
                                                    <div className="onlinereq-main-details-title-section">
                                                        <h1>Appointment Date</h1>
                                                    </div>
                                                </div>
                                                <p>{requestData?.appointmentDate || "N/A"}</p>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        <div className="services-onlinereq-info-main-container">
                            <div className="services-onlinereq-info-container-scrollable">
                                <div className="services-onlinereq-info-main-content">

                                    
                                {activeSection === "basic" && <> {renderSection("basic")} </>}
                                
                                {activeSection === "full" && <> {renderSection("full")} </>}


                                {activeSection === "emergency" && (
                                  <>
                                    <div className="services-onlinereq-content" style={{ display: 'flex', gap: '2rem' }}>
                                      <div className="services-onlinereq-content-left-side" style={{ flex: 1 }}>
                                        <div className="services-onlinereq-fields-section">
                                          <p>Emergency Contact Full Name</p>
                                          <input
                                            type="text"
                                            className="services-onlinereq-input-field"
                                            value={requestData?.emergencyDetails?.fullName || ""}
                                            readOnly
                                          />
                                        </div>
                                        <div className="services-onlinereq-fields-section">
                                          <p>Emergency Contact Address</p>
                                          <input
                                            type="text"
                                            className="services-onlinereq-input-field"
                                            value={requestData?.emergencyDetails?.address || ""}
                                            readOnly
                                          />
                                        </div>
                                        
                                      </div>

                                      <div className="services-onlinereq-content-right-side" style={{ flex: 1 }}>
                                        <div className="services-onlinereq-fields-section">
                                          <p>Emergency Contact Number</p>
                                          <input
                                            type="text"
                                            className="services-onlinereq-input-field"
                                            value={requestData?.emergencyDetails?.contactNumber || ""}
                                            readOnly
                                          />
                                        </div>

                                        <div className="services-onlinereq-fields-section">
                                          <p>Relationship</p>
                                          <input
                                            type="text"
                                            className="services-onlinereq-input-field"
                                            value={requestData?.emergencyDetails?.relationship || ""}
                                            readOnly
                                          />
                                        </div>
                                        
                                      </div>
                                    </div>
                                  </>
                                )}


                                {activeSection === "others" && <> {renderSection("others")} </>}

                                {activeSection === "rejected" && (
                                  <>
                                    <div className="rejectedion-main-container">
                                    <div className="box-container-outer-rejection">
                                        <div className="title-remarks-rejected">
                                          Reason for Rejection
                                        </div>
                                        <div className="box-container-rejected">
                                        <textarea className="rejected-input-field" placeholder="Enter Remarks" name="remarks" value={requestData?.rejectionReason} readOnly/>
                                        </div>
                                      </div>
                                    </div>
                                    
                                  </>
                                )}

                                {activeSection === "received" && (
                                  <>
                                    <div className="services-onlinereq-content">
                                      
                                        <div className="services-onlinereq-fields-section">
                                          <h1>Receival Name</h1>
                                          <input
                                            type="text"
                                            className="services-onlinereq-input-field"
                                            value={receival?.receivalName}
                                            readOnly
                                          />
                                        </div>

                                      <div className="services-onlinereq-fields-section">
                                        <h1>Receival Date and Time</h1>
                                        <input
                                          type="text"
                                          className="services-onlinereq-input-field"
                                          value={
                                            receival?.receivalWhen
                                              ? new Date(receival.receivalWhen).toLocaleString("en-US", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  hour12: true,
                                                })
                                              : ""
                                          }
                                          
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  
                                  </>
                                )}  


                                {activeSection === "or" && (
                                  <>
                                    <div className="services-onlinereq-content">
                                      
                                        <div className="services-onlinereq-fields-section">
                                          <h1>OR Number</h1>
                                          <input
                                            type="number"
                                            className="services-onlinereq-input-field"
                                            value={requestData?.orNumber}
                                            readOnly
                                          />
                                        </div>

                                        <div className="services-onlinereq-fields-section">
                                          <div className="services-onlinereq-verification-requirements-section">
                                            <span className="verification-requirements-label">OR Image</span>
                                            <div className="services-onlinereq-verification-requirements-container">
                                              {requestData?.orImageUpload && (
                                                <a
                                                  href={
                                                    requestData.orImageUpload.startsWith("https://")
                                                      ? requestData.orImageUpload
                                                      : resolvedImageUrls["orImageUpload"]
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <img
                                                    src={
                                                      requestData.orImageUpload.startsWith("https://")
                                                        ? requestData.orImageUpload
                                                        : resolvedImageUrls["orImageUpload"]
                                                    }
                                                    alt="OR Image"
                                                    className="verification-reqs-pic uploaded-picture"
                                                    style={{ cursor: "pointer" }}
                                                  />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      
                                    </div>
                                  </>
                                )}

                                {activeSection === "photo" && (
                                  <>
                                    <div className="services-onlinereq-content">
                                      {requestData?.photoUploaded && (
                                        <div className="services-onlinereq-fields-section">
                                          <div className="services-onlinereq-verification-requirements-section">
                                            <span className="verification-requirements-label">Uploaded Photo</span>
                                            <div className="services-onlinereq-verification-requirements-container">
                                              <a
                                                href={
                                                  requestData.photoUploaded.startsWith("https://")
                                                    ? requestData.photoUploaded
                                                    : resolvedImageUrls["photoUploaded"]
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <img
                                                  src={
                                                    requestData.photoUploaded.startsWith("https://")
                                                      ? requestData.photoUploaded
                                                      : resolvedImageUrls["photoUploaded"]
                                                  }
                                                  alt="Uploaded Photo"
                                                  className="verification-reqs-pic uploaded-picture"
                                                  style={{ cursor: "pointer" }}
                                                />
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {activeSection === "interview" && (
                                  <>
                                    <div className="rejectedion-main-container">
                                      <div className="box-container-outer-rejection">
                                        <div className="title-remarks-rejected">
                                          Interview Remarks
                                        </div>
                                        <div className="box-container-rejected">
                                        <textarea className="rejected-input-field" placeholder="Enter Remarks" name="remarks" value={requestData?.interviewRemarks} readOnly/>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>


            </div>

            {showSubmitPopup && (
                <div className="confirmation-popup-overlay-services-onlinereq-status">
                    <div className="confirmation-popup-services-onlinereq-status">
                        <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                        <p>Are you sure you want to change the status to <strong className="pending-status-word">{pendingStatus}</strong>?</p>
                        <div className="yesno-container-add">
                            <button onClick={cancelStatusChange} className="no-button-add">No</button>
                            <button onClick={confirmStatusChange} className="yes-button-add">Yes</button>
                        </div>
                    </div>
                </div>
            )}






            

        {showReceivalForm && (
          <div className="view-doc-receival-form-popup-overlay">
            <div className="doc-receival-popup">
              <div className="services-onlinereq-info-toggle-wrapper">
              {["receival", "payment"].map((section) => {
                const excludedDocTypes = [
                  "Barangay Clearance",
                  "Barangay Certificate",
                  "Barangay Indigency",
                  "Other Documents",
                ];

                // Hide "OR Section" if docType is in the excluded list
                const isPayment = section === "payment";
                const shouldHidePayment =
                isPayment &&
                (
                  (excludedDocTypes.includes(requestData?.docType || "") &&
                   requestData?.purpose !== "First Time Jobseeker") ||
                  (requestData?.purpose === "First Time Jobseeker" && firstTimeClaimed === false)
                );
              

                if (shouldHidePayment) return null;

                return (
                  <button
                    key={section}
                    type="button"
                    className={`info-toggle-btn ${popupSection === section ? "active" : ""}`}
                    onClick={() => setPopupSection(section)}
                  >
                    {section === "receival" && "Receival Section"}
                    {section === "payment" && "OR Section"}
                  </button>
                );
              })}
              </div>

              <form onSubmit={handleReceivalSubmit} className="doc-receival-form">

                {popupSection === "receival" && (
                  <>
                  <div className="doc-receival-content2">
                    <div className="services-onlinereq-doc-receival-form-section">
                      <p>Name of Person Receiving<span className="required-asterisk">*</span></p>
                      <select
                        value={receival.receivalName}
                        onChange={(e) => setReceival({ ...receival, receivalName: e.target.value })}
                        className="services-onlinereq-input-field"
                        required
                      >
                        <option value="" disabled>Select Name</option>
                        <option value={requestData?.requestorFname}>{requestData?.requestorFname}</option>
                      </select>
                    </div>
                    <div className="services-onlinereq-doc-receival-form-section">
                      <p>Current Date and Time</p>
                      <input
                        type="text"
                        className="services-onlinereq-input-field"
                        value={new Date().toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                        readOnly
                      />
                    </div>
                  </div>

                  {requestData?.purpose === "First Time Jobseeker" && firstTimeClaimed === false && (
                      <p className="jobseeker-note-nopayment">
                        * This request will not require payment as per RA 11261 (First Time Jobseeker).
                      </p>
                    )}                       
                  {requestData?.purpose === "First Time Jobseeker" && firstTimeClaimed === true && (
                    <p className="jobseeker-note-payment">
                      * This request will require payment as they have already claimed their RA 11261 (First Time Jobseeker).
                    </p>
                  )}                  
                </>
               )}

                {popupSection === "payment" && (
                  <>
                    <div className="doc-receival-content2">
                      <div className="services-onlinereq-doc-receival-form-section">
                        <p>OR Number <span className="required-asterisk">*</span></p>
                        <input
                          type="number"
                          className="services-onlinereq-input-field"
                          value={orNumber}
                          onChange={(e) => setOrNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div className="services-onlinereq-doc-receival-form-section">
                        <p>Upload OR</p>
                        <div className="box-container-OR">
                          <div className="file-upload-container-OR">
                            <label htmlFor="file-upload-OR" className="upload-link">Click to Upload File</label>
                            <input
                              id="file-upload-OR"
                              type="file"
                              className="file-upload-input"
                              accept=".jpg,.jpeg,.png"
                              onChange={handleORUpload}
                            />
                            {files1.length > 0 && (
                              <div className="file-name-image-display">
                                {files1.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li className="file-item">
                                      {file.preview && (
                                        <div className="filename-image-container">
                                          <img
                                            src={file.preview}
                                            alt={file.name}
                                            className="file-preview"
                                          />
                                        </div>
                                      )}
                                      <span className="file-name">{file.name}</span>
                                      <div className="delete-container">
                                        <button
                                          type="button"
                                          onClick={() => handleORDelete(file.name)}
                                          className="delete-button"
                                        >
                                          <img
                                            src="/images/trash.png"
                                            alt="Delete"
                                            className="delete-icon"
                                          />
                                        </button>
                                      </div>
                                    </li>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </>
                )}

                  <div className="doc-receivalform-buttons-section">
                    <div className="doc-receivalform-action-buttons">
                      <button
                        className="doc-receivalform-action-close"
                        type="button"
                        onClick={() => setShowReceivalForm(false)}
                      >
                        Close
                      </button>
                      <button className="doc-receivalform-action-submit" type="submit">
                        Submit
                      </button>
                    </div>
                  </div>
              </form>
            </div>
          </div>
        )}

        
        {showInterviewForm && (
          <>
            <div className="view-doc-receival-form-popup-overlay">
              <div className="doc-receival-popup">
                <form onSubmit={handleInterviewRemarks} className="doc-receival-form">
                  <div className="doc-receival-content">
                    <div className="services-onlinereq-doc-receival-form-section-interview">
                      <h2>Interview Remarks</h2>
                      <h3>Upload remarks from the interview appointment</h3>
                      <textarea
                        className="interview-remarks-field-section"
                        placeholder="Enter Remarks"
                        name="remarks"
                        value={interviewRemarks}
                        onChange={(e) => setInterviewRemarks(e.target.value)}
                        required
                      />
                    </div>


            
                  </div>

                  
                  <div className="doc-receivalform-buttons-section">
                      <div className="doc-receivalform-action-buttons">
                        <button
                          className="doc-receivalform-action-close"
                          type="button"
                          onClick={() => setShowInterviewForm(false)}
                        >
                          Close
                        </button>
                        <button className="doc-receivalform-action-submit" type="submit">
                          Submit
                        </button>
                      </div>
                    </div>
                </form>
              </div>
            </div>
          </>
        )}

        {showPhotoUpload && (
          <>
            <div className="view-doc-receival-form-popup-overlay">
              <div className="doc-receival-popup">
                <form onSubmit={handlePhotoUpload} className="doc-receival-form">
                  <div className="services-onlinereq-doc-receival-form-section">
                    
                      <h2>Identification Photo</h2>
                      <h3>Upload picture taken from the picture appointment</h3>
                      <div className="box-container-OR">
                        <div>
                          <label htmlFor="file-upload-photo" className="upload-link cursor-pointer text-blue-600 hover:underline">
                            Click to Upload File
                          </label>
                          <input
                            id="file-upload-photo"
                            type="file"
                            className="file-upload-input hidden"
                            accept=".jpg,.jpeg,.png"
                            onChange={handlePhotoUploadChange}
                          />
                        </div>

                        {files2.length > 0 && (
                          <div className="space-y-2">
                            {files2.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-4 p-3 border rounded bg-gray-50"
                              >
                                {/* Image */}
                                {file.preview && (
                                  <div className="w-16 h-16 flex-shrink-0">
                                    <img
                                      src={file.preview}
                                      alt={file.name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  </div>
                                )}

                                {/* File name */}
                                <div className="flex-grow overflow-hidden">
                                  <span
                                    className="block text-sm text-gray-800 truncate"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </span>
                                </div>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handlePhotoDelete(file.name)}
                                  className="p-2 hover:bg-red-100 rounded"
                                >
                                  <img src="/images/trash.png" alt="Delete" className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                 
                  </div>


                  <div className="doc-receivalform-buttons-section">
                    <div className="doc-receivalform-action-buttons">
                      <button
                        className="doc-receivalform-action-close"
                        type="button"
                        onClick={() => setshowPhotoUpload(false)}
                      >
                        Close
                      </button>
                      <button className="doc-receivalform-action-submit" type="submit">
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
                <div className="services-onlinereq-info-toggle-wrapper">
                </div>
              </div>
            </div>
          </>
        )}

    

        {showRemarksGiven && (
          <div className="view-doc-receival-form-popup-overlay">
            <div className="doc-receival-popup">
              <div className="services-onlinereq-info-toggle-wrapper">
                <button
                  type="button"
                  className="info-toggle-btn active"
                >
                  Interview Remarks
                </button>
              </div>
              <div className="doc-receival-content">
                <div className="services-onlinereq-fields-section">
                  <p>Interview Remarks</p>
                  <textarea
                    className="services-onlinereq-input-field"
                    placeholder="Enter Remarks"
                    name="remarks"
                    value={requestData?.interviewRemarks || ""}
                    readOnly
                  />
                </div>
              </div>
              <button
                className="doc-receivalform-action-close"
                type="button"
                onClick={() => setShowRemarksGiven(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}


        {showDocumentGeneratedPopup && (
          <div className="documentgenerated-popup-overlay-services-onlinereq-status">
            <div className="documentgenerated-popup-services-onlinereq-status">
              <img
                src="/Images/check.png"
                alt="success icon"
                className="successful-icon-popup"
              />
              <p>Document has been Generated.</p>

              {requestData?.purpose === "Barangay ID" && requestData?.docType === "Other Documents" ? (
                <h2>Next: Click the button "Notify Requestor" that the document is ready for pick-up.</h2>
              ) : requestData?.docType === "Business Permit" ? (
                <h2>Next: Click the button "Notify Requestor" once signature and dry seal has been completed.</h2>
              ) : (
                <h2>Next: Click the button "Notify Admin Staff" once signature and dry seal has been completed.</h2>
              )}

              <div className="yesno-container-add">
                <button
                  onClick={() => setShowDocumentGeneratedPopup(false)}
                  className="yes-button-add"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showNotifyAdminPopup && (
          <div className="documentgenerated-popup-overlay-services-onlinereq-status">
            <div className="documentgenerated-popup-services-onlinereq-status">
              <img
                src="/Images/check.png"
                alt="success icon"
                className="successful-icon-popup"
              />
              <p>Admin Staff has been notified.</p>
              <h2>Next: Wait for the Admin Staff to get the document from the office.</h2>
              <div className="yesno-container-add">
                <button
                  onClick={() => {
                    setShowNotifyAdminPopup(false);
                    if (requestData?.reqType === "Online") {
                      router.push("/dashboard/ServicesModule/OnlineRequests");
                    } else {
                      router.push("/dashboard/ServicesModule/InBarangayRequests");
                    }
                  }}
                  className="yes-button-add"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}


        {showNotifyRequestorPopup && (
          <div className="notifyrequestor-popup-overlay-services-onlinereq-status">
            <div className="notifyrequestor-popup-services-onlinereq-status">
              <img
                src="/Images/check.png"
                alt="success icon"
                className="successful-icon-popup"
              />
              <p>Requestor has been notified that the document is for Pick-up.</p>
              <h2>Next: Click the "Document Received" button once the requestor has pick-up the document.</h2>
              <div className="yesno-container-add">
                <button
                  onClick={() => {
                    setShowNotifyRequestorPopup(false);                   
                  }}
                  className="yes-button-add"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showAppointmentApprovedPopup && (
          <div className="notifyrequestor-popup-overlay-services-onlinereq-status">
            <div className="notifyrequestor-popup-services-onlinereq-status">
              <img
                src="/Images/check.png"
                alt="success icon"
                className="successful-icon-popup"
              />
              <p>Scheduled Appointment Approved.</p>
              <h2>Next: Wait for the Admin Staff to conduct the scheduled appointment.</h2>
              <div className="yesno-container-add">
                <button
                  onClick={() => setShowAppointmentApprovedPopup(false)}
                  className="yes-button-add"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showPhotoUploadSuccessPopup && (
        <div className="notifyrequestor-popup-overlay-services-onlinereq-status">
          <div className="notifyrequestor-popup-services-onlinereq-status">
            <img
              src="/Images/check.png"
              alt="success icon"
              className="successful-icon-popup"
            />
            <p>Photo from the appointment successfully uploaded.</p>
            <h2>Next: Wait for the document to be generated by Secretary/Assistant Secretary.</h2>
            <div className="yesno-container-add">
              <button
                onClick={() => {
                  setShowPhotoUploadSuccessPopup(false);
                  setshowPhotoUpload(false); // optionally close upload modal too
                }}
                className="yes-button-add"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showInterviewRemarksSuccessPopup && (
        <div className="notifyrequestor-popup-overlay-services-onlinereq-status">
          <div className="notifyrequestor-popup-services-onlinereq-status">
            <img
              src="/Images/check.png"
              alt="success icon"
              className="successful-icon-popup"
            />
            <p>Interview Remarks successfully uploaded.</p>
            <h2>Next: Wait for the document to be generated by Secretary/Assistant Secretary.</h2>
            <div className="yesno-container-add">
              <button
                onClick={() => setShowInterviewRemarksSuccessPopup(false)}
                className="yes-button-add"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

        {showCompletionPopup && (
          <div className="documentgenerated-popup-overlay-services-onlinereq-status">
            <div className="documentgenerated-popup-services-onlinereq-status">
              <img
                src="/Images/check.png"
                alt="success icon"
                className="successful-icon-popup"
              />
              <p>The Document Request has been completed.</p>
              <div className="yesno-container-add">
                <button
                  className="yes-button-add"
                  onClick={() => {
                    setShowCompletionPopup(false);
                    setShowReceivalForm(false); // hide form after completion
                    if (requestData?.reqType === "Online") {
                      router.push("/dashboard/ServicesModule/OnlineRequests");
                    } else {
                      router.push("/dashboard/ServicesModule/InBarangayRequests");
                    }
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        </main>
    );

    
}
 
export default ViewOnlineRequest;