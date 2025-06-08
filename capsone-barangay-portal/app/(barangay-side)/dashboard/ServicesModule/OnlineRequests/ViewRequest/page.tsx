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
    requestor: string;
    partnerWifeHusbandFullName: string;
    cohabitationStartDate: string;
    cohabitationRelationship:string;
    docType: string;
    status: string;
    purpose: string;
    requestDate: string;
    fullName: string;
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
    tricycleMake: string;
    tricycleType: string;
    tricyclePlateNo: string;
    tricycleSerialNo: string;
    tricycleChassisNo: string;
    tricycleEngineNo: string;
    tricycleFileNo: string;
   
}


const ViewOnlineRequest = () => {
    const user = useSession().data?.user;
    const userPosition = user?.position;
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const  [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<OnlineRequest>();

    useEffect(() => {
        if(!id) return
        getSpecificDocument("ServiceRequests", id, setRequestData).then(() => setLoading(false));   
        console.log(id);    
    }, [id]);
    const [status, setStatus] = useState("");    
    
   
    useEffect(() => {
    
     setStatus(requestData?.status || "");
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

      const fetchUrls = async () => {
        const updated = await handleDownloadUrl(requestData);

        // Avoid state update if no real changes
        if (JSON.stringify(updated) !== JSON.stringify(requestData)) {
          setRequestData(updated);
        }
      };

      fetchUrls();
    }, [requestData]);


    
    if(loading) return <p>......</p>
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value);
    };


    const requestField = [
        { key: "requestDate", label: "Date Requested" },
        { key: "docType", label: "Document Type" },
        { key: "purpose", label: "Purpose" },
        { key: "fullName", label: "Full Name" },
        { key: "partnerWifeHusbandFullName", label: "Partner's/Wife's/Husband's Full Name" },
        { key: "businessName", label: "Business Name" },
        { key: "businessNature", label: "Business Nature" },
        { key: "businessLocation", label: "Business Location" },
        { key: "noOfTRU", label: "No Of Tricycle" },
        { key: "tricycleMake", label: "Tricycle Make" },
        { key: "tricycleType", label: "Tricycle Type"  },
        { key: "tricyclePlateNo", label: "Tricycle Plate No"  },
        { key: "tricycleSerialNo", label: "Tricycle Serial No"  },
        { key: "tricycleChassisNo", label: "Tricycle Chassis No" },
        { key: "tricycleEngineNo", label: "Tricycle Engine No" },
        { key: "tricycleFileNo", label: "Tricycle File No"  },
        { key: "cohabitationStartDate", label: "Start of Cohabitation" },
        { key: "cohabitationRelationship", label: "Cohabitation Relationship"},
        { key: "noIncomePurpose", label: "Purpose Of No Income" },
        { key: "noIncomeChildFName", label: "Son/Daughther's Name For No Income" },
        { key: "address", label: "Address" },
        { key: "estateSince", label: "Estate Since" },
        { key: "guardianshipType", label: "Guardianship Type" },
        { key: "wardRelationship", label: "Ward's Relationship" },
        { key: "wardFname", label: "Ward's Full Name" },
        { key: "toAddress", label: "To Address" },
        { key: "attestedBy", label: "Attested By" },
        { key: "CYFrom", label: "Cohabitation Year From" },
        { key: "CYTo", label: "Cohabitation Year To" },
        { key: "goodMoralPurpose", label: "Purpose Of Good Moral" },
        { key: "age", label: "Age" },
        { key: "dateOfResidency", label: "Date of Residency" },
        { key: "occupation", label: "Occupation" },
        { key: "civilStatus", label: "Civil Status" },
        { key: "citizenship", label: "Citizenship" },
        { key: "gender", label: "Gender" },
        { key: "contact", label: "Contact" },
        { key: "birthday", label: "Birthday" },
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

        
        // Emergency Details Fields
        { key: "emergencyDetails.firstName", label: "Emergency Contact First Name" },
        { key: "emergencyDetails.middleName", label: "Emergency Contact Middle Name" },
        { key: "emergencyDetails.lastName", label: "Emergency Contact Last Name" },
        { key: "emergencyDetails.address", label: "Emergency Contact Address" },
        { key: "emergencyDetails.relationship", label: "Emergency Contact Relationship" },
        { key: "emergencyDetails.contactNumber", label: "Emergency Contact Number" },

        {key: "requestor", label: "Requestor Name"},

        // File Fields
        { key: "signaturejpg", label: "Signature" },
        { key: "barangayIDjpg", label: "Barangay ID" },
        { key: "validIDjpg", label: "Valid ID" },
        { key: "letterjpg", label: "Letter" },
        { key: "copyOfPropertyTitle", label: "Copy of Property Title" },
        { key: "dtiRegistration", label: "DTI Registration" },
        { key: "isCCTV", label: "CCTV Requirement" },
        { key: "taxDeclaration", label: "Tax Declaration" },
        { key: "approvedBldgPlan", label: "Approved Building Plan" },
        { key: "deathCertificate", label: "Death Certificate" },
        ];
     
    const handleBack = () => {
        router.back();
    };

    const handleviewappointmentdetails = () => {
        //window.location.href = "/dashboard/ServicesModule/Appointments/View";
    };

    const handlerejection = () => {
        //window.location.href = "/dashboard/ServicesModule/OnlineRequests/ReasonForReject";
        router.push("/dashboard/ServicesModule/OnlineRequests/ReasonForReject/?id=" + id);
    };

    const handleSave = async() => {
        try {
            if(!id) return
            const docRef = doc(db, "ServiceRequests", id);
            const updatedData = {
                status: status,
                ...(status === "Pending" && { statusPriority: 1 }),
                ...(status === "Pick-up" && { statusPriority: 2 }),
                ...(status === "Completed" && { statusPriority: 3 }),
            }
             const notificationRef = doc(collection(db, "Notifications"));
                  await setDoc(notificationRef, {
                    residentID: requestData?.accID, // reportID == user id
                    requestID: requestData?.requestId,
                    message: `Your Document Request (${requestData?.requestId}) has been updated to "${status}".`,
                    timestamp: new Date(),
                    transactionType: "Online Request",
                    isRead: false,
                  });


            await updateDoc(docRef, updatedData).then(() => {
                alert("Status Updated");
            });
            
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    const handleSMS = async() => {
        //window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: requestData?.contact,
                  message: `Hello Mr/Ms. ${requestData?.fullName}, your document request with ID ${requestData?.requestId} is now ready for pick-up. Please visit the barangay hall to collect your document. Thank you!`,
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
                "Text6": requestData?.tricycleMake.toUpperCase(),
                "Text7": requestData?.tricycleType,
                "Text8": requestData?.tricyclePlateNo,
                "Text9": requestData?.tricycleSerialNo,
                "Text10": requestData?.tricycleChassisNo,
                "Text11": requestData?.tricycleEngineNo,
                "Text12": requestData?.tricycleFileNo,
                "Text13": requestData?.requestor.toUpperCase(),
                "Text14": dayToday,
                "Text15": `${monthToday} ${yearToday}`,
            };
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
        link.download=`${requestData?.docType}_${requestData?.purpose || ""}_certificate.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();

    }

    return (
        <main className="viewonlinereq-main-container">

            <div className="viewonlinereq-page-title-section-1">
                <h1>Online Document Requests</h1>
            </div>
            {(userPosition === "Assistant Secretary" || userPosition === "Admin Staff")&& (<>
                <div className="viewonlinereq-actions-content">
                    <div className="viewonlinereq-actions-content-section1">
                        {(requestData?.status !== "Completed" && requestData?.status !== "Rejected")&& (
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
                        {status === "pick-up" && (
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
                            {["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg", "copyOfPropertyTitle", "dtiRegistration", "isCCTV", "taxDeclaration", "approvedBldgPlan","deathCertificate"].includes(field.key) ? (
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
        </main>
    );
}
 
export default ViewOnlineRequest;