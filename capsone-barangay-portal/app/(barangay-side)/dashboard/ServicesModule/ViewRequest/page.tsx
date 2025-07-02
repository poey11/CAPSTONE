"use client";

import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { useSearchParams,useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import { useSession } from "next-auth/react";
import { getDownloadURL, ref } from "firebase/storage";
import {storage,db} from "@/app/db/firebase";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { getLocalDateString } from "@/app/helpers/helpers";
import { toWords } from 'number-to-words';
import OnlineRequests from "../OnlineRequests/page";
import OnlineReports from "../../IncidentModule/OnlineReports/page";


interface EmergencyDetails {
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    relationship: string;
    contactNumber: string;
  }
  
  interface OnlineRequest {
    accID: string;
    requestId: string;
    reqType?: string; // "Online" or "InBarangay"
    requestor: string;
    partnerWifeHusbandFullName: string;
    cohabitationStartDate: string;
    cohabitationRelationship:string;
    docType: string;
    status: string;
    purpose: string;
    createdAt: string;
    fullName: string;
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
}

interface File {
    name?: string;
}


const ViewOnlineRequest = () => {
    const user = useSession().data?.user;
    const userPosition = user?.position;
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const  [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<OnlineRequest>();
    const [activeSection, setActiveSection] = useState("basic");
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");


    useEffect(() => {
        if(!id) return
        getSpecificDocument("ServiceRequests", id, setRequestData).then(() => setLoading(false));   
        console.log(id);    
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

    
    {/*}
    if(loading) return <p>......</p>
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value);
    };*/}

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
        { key: "noIncomeChildFName", label: "Son/Daughther's Name For No Income" },
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

        {key: "requestor", label: "Requestor's Full Name"},

        {key: "rejectionReason", label: "Reason for Rejection"},

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
        ];


        
        const fieldSections: Record<string, {
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
                "rejectionReason",
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
        }
        
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
      
    const currentPurpose = requestData?.purpose as keyof typeof fieldSections;
    const currentSections = fieldSections[currentPurpose] || {};
      
    const renderSection = (sectionName: "basic" | "full" | "others") => {
        const fieldKeys = currentSections[sectionName] || [];
      
        // Render 'others' section differently (image display)
        if (sectionName === "others") {
            return (
                <div className="others-image-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                  {requestData?.reqType === "InBarangay" ? 
                  (
                    <>
                      {requestData?.docsRequired?.map((file, index) => {
                        return(
                          <div key={index} className="services-onlinereq-verification-requirements-section">
                            <span className="verification-requirements-label">Image {index+1}</span>
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
                        )

                      })}
                    </>
                  ):(
                    <>
                      {fieldKeys.map((key) => {
                        const fileUrl = (requestData as any)?.[key];

                        // Skip if no image
                        if (!fileUrl) return null;
                        return (
                          <div key={key} className="services-onlinereq-verification-requirements-section">
                            <span className="verification-requirements-label">{getLabel(key)}</span>
                            <div className="services-onlinereq-verification-requirements-container">
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={fileUrl}
                                  alt={getLabel(key)}
                                  className="verification-reqs-pic uploaded-picture"
                                  style={{ cursor: 'pointer' }}
                                />
                              </a>
                            </div>
                          </div>
                        );
                      })}   
                    </>
                  )}
                
              </div>
            );
          }
      
        // Default layout for 'basic' and 'full'
        const leftFields = fieldKeys.filter((_, i) => i % 2 === 0);
        const rightFields = fieldKeys.filter((_, i) => i % 2 !== 0);
      
        const renderField = (key: string) => {
          const value = key.includes(".")
            ? key.split(".").reduce((obj, k) => (obj as any)?.[k], requestData)
            : (requestData as any)?.[key];
      
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
        router.push("/dashboard/ServicesModule/OnlineRequests/ReasonForReject/?id=" + id);
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
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
                residentID: requestData?.accID,
                requestID: requestData?.requestId,
                message: `Your Document Request (${requestData?.requestId}) has been updated to "${newStatus}".`,
                timestamp: new Date(),
                transactionType: "Online Request",
                isRead: false,
            });
        
            // Update Firestore document
            await updateDoc(docRef, updatedData);
        
            // ✅ Manually update local requestData state so UI changes immediately
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
                  message: `Hello Mr/Ms. ${requestData?.fullName}, your 
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
    
    
    const getMonthName = (monthNumber:number) => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
    
      if (monthNumber >= 1 && monthNumber <= 12) {
        return monthNames[monthNumber - 1];
      } else {
        return "Invalid month number";
      }
    }

    function getOrdinal(n: number): string {
      const suffixes = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    
    
    const handlePrint = async() => {
        if(!requestData) return
        const dateToday = getLocalDateString(new Date());
        const dayToday = getOrdinal(parseInt(dateToday.split("-")[2]));
        const monthToday = getMonthName(parseInt(dateToday.split("-")[1]));
        const yearToday = dateToday.split("-")[0];
        let locationPath = "";
        let reqData = {};
        if(requestData?.purpose === "Death Residency"){
            locationPath = "DeathResidency.pdf";
            reqData = {
                    "Text1":`${requestData?.fullName.toUpperCase()} (Deceased),`,
                    "Text2": requestData?.address,
                    "Text3": `${getMonthName(parseInt(requestData?.dateofdeath.split("-")[1]))} ${requestData?.dateofdeath.split("-")[2]}, ${requestData?.dateofdeath.split("-")[0]}`,
                    "Text4": requestData?.requestor.toUpperCase(),
                    "Text5": dayToday,
                    "Text6": `${monthToday} ${yearToday}`,  
                };
        }
        else if(requestData?.purpose === "Cohabitation" ){
            if(requestData?.cohabitationRelationship ==="Husband And Wife")locationPath = "Certificate of cohab_marriage.pdf";
            else locationPath = "Certificate of cohab_partners.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": `${requestData?.partnerWifeHusbandFullName.toUpperCase()}`,
                "Text3": requestData?.address,
                "Text4": `${getMonthName(parseInt(requestData?.cohabitationStartDate.split("-")[1]))} ${requestData?.cohabitationStartDate.split("-")[2]}, ${requestData?.cohabitationStartDate.split("-")[0]}`,
                "Text5": requestData?.requestor.toUpperCase(),
                "Text6": dayToday,
                "Text7": `${monthToday} ${yearToday}`,
            };
        }
        else if(requestData?.purpose === "Occupancy /  Moving Out"){
            locationPath = "certficate of moving out.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.address,
                "Text3": requestData?.toAddress,
                "Text4": requestData?.requestor.toUpperCase(),
                "Text5": dayToday,
                "Text6": `${monthToday} ${yearToday}`,
            };
        }
        else if(requestData?.purpose === "Guardianship"){
            if(requestData?.guardianshipType === "Legal Purpose") locationPath = "certifiacte of guardianship_legal.pdf";
            else locationPath = "certifiacte of guardianship_school.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.address,
                "Text3": requestData?.wardRelationship,
                "Text4": `${requestData?.wardFname.toUpperCase()}`,
                "Text5": requestData?.requestor.toUpperCase(),
                "Text6": dayToday,
                "Text7": `${monthToday} ${yearToday}`,
            };
        }
        else if(requestData?.purpose === "Residency"){
            locationPath = "certificate of residency.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.CYFrom,
                "Text3": requestData?.CYTo,
                "Text4": requestData?.address,
                "Text5": requestData?.attestedBy.toUpperCase(),
                "Text6": dayToday,
                "Text7": `${monthToday} ${yearToday}`,
            };
        }
        else if(requestData?.purpose === "Good Moral and Probation"){
            if(requestData?.goodMoralPurpose === "Other Legal Purpose and Intent") locationPath = "certificate of goodmoral_a.pdf";
            else locationPath = "certificate of goodmoral_b.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.address,
                ...(requestData?.goodMoralPurpose === "Other Legal Purpose and Intent" ? {
                    "Text3": dayToday,
                    "Text4": `${monthToday} ${yearToday}`,
                }:{
                    "Text3": requestData?.goodMoralPurpose.toUpperCase(),
                    "Text4": dayToday,
                    "Text5": `${monthToday} ${yearToday}`,
                })
            };
        }
        else if(requestData?.purpose === "No Income"){
            if(requestData?.noIncomePurpose === "SPES Scholarship") locationPath = "certificate of no income (scholarship).pdf";
            else locationPath = "certificate of no income (esc).pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.address,
                "Text3": requestData?.fullName.toUpperCase(),
                "Text4": requestData?.requestor.toUpperCase(),
                "Text5": requestData?.noIncomeChildFName.toUpperCase(),
                "Text6": dayToday,
                "Text7": `${monthToday} ${yearToday}`,
            }
        }
        else if(requestData?.purpose === "Estate Tax"){
            locationPath = "certificate of estate tax.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.address,
                "Text3": requestData?.dateOfResidency.split("-")[0],
                "Text4": requestData?.fullName.toUpperCase(),
                "Text5": `${getMonthName(parseInt(requestData?.dateofdeath.split("-")[1]))} ${requestData?.dateofdeath.split("-")[2]}, ${requestData?.dateofdeath.split("-")[0]}`,
                "Text6": requestData?.estateSince.toUpperCase(),
                "Text7": requestData?.requestor.toUpperCase(),
                "Text8": dayToday,
                "Text9": `${monthToday} ${yearToday}`,
            }
        }
        //Garage PUV/TRU,
        else if(requestData?.purpose === "Garage/TRU"){
            locationPath = "certificate of tru.pdf";
            reqData = {
                "Text1":`${requestData?.fullName.toUpperCase()}`,
                "Text2": requestData?.businessName.toUpperCase(),
                "Text3": requestData?.businessLocation,
                "Text4": `${toWords(parseInt(requestData?.noOfTRU)).toUpperCase()} (${requestData?.noOfTRU})`,
                "Text5": requestData?.businessNature,
                "Text6": requestData?.vehicleMake.toUpperCase(),
                "Text7": requestData?.vehicleType,
                "Text8": requestData?.vehiclePlateNo,
                "Text9": requestData?.vehicleSerialNo,
                "Text10": requestData?.vehicleChassisNo,
                "Text11": requestData?.vehicleEngineNo,
                "Text12": requestData?.vehicleFileNo,
                "Text13": requestData?.requestor.toUpperCase(),
                "Text14": dayToday,
                "Text15": `${monthToday} ${yearToday}`,
            };
        }
        else if(requestData?.purpose === "Garage/PUV"){
            locationPath = "certificate of puv.pdf";
            reqData = {
                "Text1":`${requestData?.vehicleType.toUpperCase()}`,
                "Text2": requestData?.fullName.toUpperCase(),
                "Text3": requestData?.address.toUpperCase(),
                "Text4": `${toWords(parseInt(requestData?.nosOfPUV)).toUpperCase()} (${requestData?.nosOfPUV})`,
                "Text5": requestData?.puvPurpose,
                "Text6": dayToday,
                "Text7": `${monthToday} ${yearToday}`,
            }

        }


        const response = await fetch("/api/fillPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: "/ServiceRequests/templates",
                pdfTemplate: locationPath,
                data: reqData,
            })
        });
        if(!response.ok)throw new Error("Failed to generate PDF");
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download=`${requestData?.docType}${`_${requestData?.purpose}` || ""}_certificate.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();

    }

    

    return (
        <main className="main-container-services-onlinereq">

            {/* NEW CODE */}
            {(userPosition === "Assistant Secretary" || userPosition === "Admin Staff") && (
                <>
                    {((status !== "Rejected" && status !== "Completed") || (status === "Rejected" && requestData?.appointmentDate)) && (
                    <div className="services-onlinereq-redirectionpage-section">
                        {(status !== "Completed" && status !== "Rejected") && (
                        <>
                            <button className="services-onlinereq-redirection-buttons" onClick={handlerejection}>
                            <div className="services-onlinereq-redirection-icons-section">
                                <img src="/images/rejected.png" alt="user info" className="redirection-icons-info" />
                            </div>
                            <h1>Reject Request</h1>
                            </button>

                            <button className="services-onlinereq-redirection-buttons" onClick={handlePrint}>
                            <div className="services-onlinereq-redirection-icons-section">
                                <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                            </div>
                            <h1>Generate Document</h1>
                            </button>
                        </>
                        )}

                        {status === "Pick-up" && (
                        <button  onClick={handleSMS} className="services-onlinereq-redirection-buttons">
                            <div className="services-onlinereq-redirection-icons-section">
                            <img src="/images/sendSMS.png" alt="user info" className="redirection-icons-info" />
                            </div>
                            <h1>Send SMS</h1>
                        </button>
                        )}

                        {requestData?.appointmentDate && (
                        <button className="services-onlinereq-redirection-buttons" onClick={handleviewappointmentdetails}>
                            <div className="services-onlinereq-redirection-icons-section">
                            <img src="/images/appointment.png" alt="user info" className="redirection-icons-info" />
                            </div>
                            <h1>Appointment Details</h1>
                        </button>
                        )}
                    </div>
                    )}
                </>
            )}

            <div className="services-onlinereq-main-content">
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
                            {["basic", "full", "others" ].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "basic" && "Basic Information"}
                                {section === "full" && "Full Information"}
                                {section === "others" && "Other Information"}
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
                                            className={`services-onlinereq-status-dropdown ${status ? status[0].toLowerCase() + status.slice(1):""}`}
                                            name="status"
                                            value={status}
                                            onChange={handleStatusChange}
                                            disabled={requestData?.status === "Completed" || requestData?.status === "Rejected"} // Disable if already completed or rejected 
                                        >
                                            <option value="Pending">Pending</option>
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

                                {activeSection === "others" && <> {renderSection("others")} </>}

                                        

                                </div>
                            </div>
                        </div>

                    </div>

                </div>


            </div>

            


        
            {/* OLD CODE 
                commented kasi baka may need pa here
            */}
{/*
            {(userPosition === "Assistant Secretary" || userPosition === "Admin Staff")&& (<>
                <div className="viewonlinereq-actions-content">
                    <div className="viewonlinereq-actions-content-section1">
                        {(status !== "Completed" && status !== "Rejected")&& (
                            <>
                                <button type="button" className="actions-button-reject" onClick ={handlerejection} >Reject</button>
                                <button type="button" className="actions-button" onClick={handlePrint}>Print</button>
                        
                            </>
                        )}
                        {requestData?.appointmentDate && (<>
                            <button type="button" className="actions-button" onClick ={handleviewappointmentdetails}>View Appointment Details</button>
                        </>)}

                        <select
                            id="status"
                            className={`status-dropdown-viewonlinereq ${status ? status[0].toLowerCase() + status.slice(1):""}`}
                            name="status"
                            value={status}
                            onChange={handleStatusChange}
                            disabled={requestData?.status === "Completed" || requestData?.status === "Rejected"} // Disable if already completed or rejected
                        >
                            <option value="Pending">Pending</option>
                            <option value="Pick-up">Pick-up</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected" disabled>Rejected</option>
                        </select>
                        {(requestData?.status !== "Completed" && requestData?.status !== "Rejected")&& (
                            <button type="button" className="status-dropdown-viewonlinereq completed" onClick={handleSave}>Save</button> 
                        )}
                    </div>

                    <div className="viewonlinereq-actions-content-section2">
                        {status === "Pick-up" && (
                            <button type="button" className="actions-button" >Send Pick-up Notif</button>
                        )}
                    </div>
                </div>
            </>)}
            

            <div className="viewonlinereq-main-content">
                <div className="viewonlinereq-section-1">
                  <div className="viewonlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1>Online Request Details</h1>
                  </div>
                    
                </div>

              {requestField
              
                .filter((field) => {
                    if (!requestData) return false; // Ensure requestData is defined
                
                    // Check if it's a nested emergency detail
                    if (field.key.startsWith("emergencyDetails.")) {
                        const [, subKey] = field.key.split("."); // Extract the sub-key
                        return subKey in (requestData.emergencyDetails ?? {}); // Only include if it exists
                    }
                
                    return field.key in requestData; // Check if the field exists in requestData
                })
                .map( (field) => {
                   // Extract field value safely
                   let fieldValue: string | File | null | undefined;
                   if (field.key.startsWith("emergencyDetails.")) {
                       const [_, subKey] = field.key.split(".");
                       fieldValue = requestData?.emergencyDetails?.[subKey as keyof EmergencyDetails] ?? "N/A";
                   } else {
                       fieldValue = requestData ? requestData[field.key as keyof OnlineRequest] as string | File | null | undefined : "N/A";
                   }

                   // Handle nested emergencyDetails fields
                   if (field.key.startsWith("emergencyDetails.")) {
                       const [_, subKey] = field.key.split("."); // Extract the sub-key
                       fieldValue = requestData?.emergencyDetails?.[subKey as keyof EmergencyDetails] ?? "N/A";
                   }
                  
                
                
                    return (
                        <div className="viewonlinereq-details-section" key={field.key}>
                            <div className="viewonlinereq-title">
                                <p>{field.label}</p>
                            </div>
                         <div className="viewonlinereq-description">
                            {/* Handle File/Image Fields */}


{/*

                            {["signaturejpg", "barangayIDjpg", "validIDjpg", "endorsementLetter", "copyOfPropertyTitle", "dtiRegistration", "isCCTV", "taxDeclaration", "approvedBldgPlan","deathCertificate"].includes(field.key) ? (
                                fieldValue && typeof fieldValue === "string" ? (
                                    <div className="resident-id-container">
                                        
                                        <a href={fieldValue} target="_blank" rel="noopener noreferrer" className="view-image-link">
                                            <img src={fieldValue} alt={field.label} className="resident-id-image"  />
                                        </a>
                                        
                                       
                                    </div>
                                ) : (
                                    <p>No File Uploaded</p>
                                )
                            ) : (
                                <p>{typeof fieldValue === "string" ? fieldValue : "N/A"}</p>
                            )}
                        </div>
                        
                        </div>
                    );
            })}

            </div>

        
*/}

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

            {showPopup && (
                <div className={`popup-overlay-services-onlinereq show`}>
                    <div className="popup-services-onlinereq">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}
        </main>
    );

    
}
 
export default ViewOnlineRequest;