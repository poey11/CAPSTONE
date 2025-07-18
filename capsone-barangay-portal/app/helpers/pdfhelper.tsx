import { getLocalDateString } from "./helpers";
import { toWords } from 'number-to-words';
import {db} from "@/app/db/firebase";
import { collection,getDocs, query, where } from "firebase/firestore";
import {customAlphabet} from "nanoid";




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


const handlePrint = async(requestData:any) => {
    const dateToday = getLocalDateString(new Date());
    const dayToday = getOrdinal(parseInt(dateToday.split("-")[2]));
    const monthToday = getMonthName(parseInt(dateToday.split("-")[1]));
    const yearToday = dateToday.split("-")[0];
    let locationPath = "";
    let reqData = {};
    if(requestData?.purpose === "Death Residency"){
        locationPath = "DeathResidency.pdf";
        reqData = {
                "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()} (Deceased)`,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.fromAddress,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.CYFrom,
            "Text3": requestData?.CYTo,
            "Text4": requestData?.address,
            "Text5": requestData?.attestedBy.toUpperCase(),
            "Text6": dayToday,
            "Text7": `${monthToday} ${yearToday}`,
        };
        const responseB = await fetch("/api/imageToPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: "/ServiceRequests/templates",
                pdfTemplate: locationPath,
                data: reqData,
                imageUrl: requestData?.photoUploaded,
                imageX:10,
                imageY:550,
                imageWidth:130,
                imageHeight:105,
            })
        });
        if(!responseB.ok)throw new Error("Failed to generate PDF");
        const blobB = await responseB.blob();
        const urlB = URL.createObjectURL(blobB);
        const linkB = document.createElement("a");
        linkB.href = urlB;
        linkB.download=`${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`;
        linkB.click();
        URL.revokeObjectURL(urlB);
        linkB.remove();
        return;


    }
    else if(requestData?.purpose === "Good Moral and Probation"){
        if(requestData?.goodMoralPurpose === "Other Legal Purpose and Intent") locationPath = "certificate of goodmoral_a.pdf";
        else locationPath = "certificate of goodmoral_b.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.requestorFname.toUpperCase(),
            "Text4": requestData?.requestor.toUpperCase(),
            "Text5": requestData?.noIncomeChildFName.toUpperCase(),
            "Text6": dayToday,
            "Text7": `${monthToday} ${yearToday}`,
        }
    }
    else if(requestData?.purpose === "Estate Tax"){
        locationPath = "certificate of estate tax.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.dateOfResidency.split("-")[0],
            "Text4": requestData?.requestorFname.toUpperCase(),
            "Text5": `${getMonthName(parseInt(requestData?.dateOfResidency.split("-")[1]))} ${requestData?.dateOfResidency.split("-")[2]}, ${requestData?.dateOfResidency.split("-")[0]}`,
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
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.businessName.toUpperCase(),
            "Text3": requestData?.businessLocation,
            "Text4": `${toWords(parseInt(requestData?.noOfVehicles)).toUpperCase()} (${requestData?.noOfVehicles})`,
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
            "Text2": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text3": requestData?.address.toUpperCase(),
            "Text4": `${toWords(parseInt(requestData?.noOfVehicles)).toUpperCase()} (${requestData?.noOfVehicles})`,
            "Text5": requestData?.goodMoralOtherPurpose,
            "Text6": dayToday,
            "Text7": `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.docType === "Barangay Clearance"){
        if(requestData?.purpose === "Residency") locationPath = "RESIDENCY.pdf";
        else if(requestData?.purpose === "Loan") locationPath ="LOAN.pdf";
        else if(requestData?.purpose === "Bank Transaction") locationPath ="BANK TRANSACTION.pdf";
        else if(requestData?.purpose === "Local Employment") locationPath ="LOCAL EMPLOYEMENT.pdf";
        else if(requestData?.purpose === "Maynilad") locationPath ="MAYNILAD.pdf";
        else if(requestData?.purpose === "Meralco") locationPath ="MERALCO.pdf";
        else if(requestData?.purpose === "Bail Bond") locationPath ="BAIL BOND_Clearance_OC.pdf";

        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.birthday,
            "Text4": requestData?.civilStatus,
            "Text5": requestData?.gender,
            "Text6": requestData?.dateOfResidency.split("-")[0],
            "Text7": requestData?.age.toString(),
            "Text8": requestData?.citizenship.toUpperCase(),
            "Text9": yearToday,
        };
        
    }

    const nextYear = (parseInt(yearToday) + 1).toString();


    if(requestData?.purpose === "Barangay ID"){
        const nanoidDigits = customAlphabet('0123456789', 5);
        const randomNumber = nanoidDigits();
        locationPath = "Barangay ID.pdf";
        reqData = {
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.birthday,
            "Text4": parseInt(requestData?.age).toString(),
            "Text5": requestData?.precinctnumber,
            "Text6": requestData?.civilStatus,
            "Text7": `${yearToday[2]}${yearToday[3]} - ${randomNumber}`,
            "Text8": requestData?.emergencyDetails.fullName,
            "Text9": requestData?.emergencyDetails.address,
            "Text10": requestData?.emergencyDetails.contactNumber,
            "Text11": requestData?.emergencyDetails.relationship,
            "Text12": `December ${nextYear}`,
        }

        const responseB = await fetch("/api/imageToPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: "/ServiceRequests/templates",
                pdfTemplate: locationPath,
                data: reqData,
                imageUrl: requestData?.twoByTwoPicture,
                imageX:25,
                imageY:108,
                imageWidth:130,
                imageHeight:105,
            })
        });
        if(!responseB.ok)throw new Error("Failed to generate PDF");
        const blobB = await responseB.blob();
        const urlB = URL.createObjectURL(blobB);
        const linkB = document.createElement("a");
        linkB.href = urlB;
        linkB.download=`${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`;
        linkB.click();
        URL.revokeObjectURL(urlB);
        linkB.remove();
        return;
    }

    if(requestData?.purpose === "First Time Jobseeker"){
        locationPath = "FIRST TIME JOB SEEKERS.pdf";
        reqData = {
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,            
            "Text2": requestData?.address,
            "Text3": dayToday,
            "Text4": `${monthToday} ${yearToday}`,
            "Text5": `${monthToday} ${dateToday.split("-")[2]}, ${nextYear}`,
            "Text6": `${monthToday} ${dateToday.split("-")[2]}, ${yearToday}`,
        }

        let locationPath2 = "OATH OF UNDERTAKING.pdf";
        let reqData2 = {
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text2": parseInt(requestData?.age).toString(),
            "Text3": `${requestData?.requestorFname.toUpperCase()}`,
            "Text4": `${monthToday} ${dateToday.split("-")[2]}, ${yearToday}`,

        };
        const responseB = await fetch("/api/fillPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: "/ServiceRequests/templates",
                pdfTemplate: locationPath2,
                data: reqData2,
            })
        });

        if(!responseB.ok)throw new Error("Failed to generate PDF");
        const blobB = await responseB.blob();
        const urlB = URL.createObjectURL(blobB);
        const linkB = document.createElement("a");
        linkB.href = urlB;
        linkB.download=`${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`;
        linkB.click();
        URL.revokeObjectURL(urlB);
        linkB.remove();
    }

    if(requestData?.docType ==="Temporary Business Permit"){
        if(requestData?.purpose === "New") locationPath = "NEW TEMPORARY BUSINESS PERMIT.pdf";
        else if(requestData?.purpose === "Renewal") locationPath = "RENEWAL TEMPORARY BUSINESS PERMIT.pdf";
        reqData ={
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text2" : requestData?.address,
            "Text3" : requestData?.businessName.toUpperCase(),
            "Text4" : requestData?.contact,
            "Text5" : requestData?.businessNature,
            "Text6" : dayToday,
            "Text7" : `${monthToday} ${yearToday}`,
        };
    }

    if(requestData?.docType === "Business Permit"){
        if(requestData?.purpose === "New") locationPath = "NEW BUSINESS PERMIT.pdf";
        else if(requestData?.purpose === "Renewal") locationPath = "RENEWAL BUSINESS PERMIT.pdf";
        reqData ={
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text2" : requestData?.address,
            "Text3" : requestData?.businessName.toUpperCase(),
            "Text4" : requestData?.contact,
            "Text5" : requestData?.businessNature,
            "Text6" : dayToday,
            "Text7" : `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.docType === "Construction"){
        locationPath = "CONSTRUCTION PERMIT.pdf";
        reqData = {
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text2" : requestData?.projectLocation,
            "Text3" : requestData?.contact,
            "Text4" : requestData?.projectName,
            "Text5" : dayToday,
            "Text6" : `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.purpose === "Public Attorneys Office"){
        locationPath = "CERTIFICATE OF INDIGENCY _ PTO.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": dayToday,
            "Text4": `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.purpose === "Financial Subsidy of Solo Parent"){
        locationPath = "CERTIFICATE OF SOLO PARENT.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.noIncomeChildFName.toUpperCase(),
            "Text4": requestData?.requestor.toUpperCase(),
            "Text5": dayToday,
            "Text6": `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.purpose === "Fire Victims"){
        locationPath = "INDIGENCY OF FIRE VICTIM.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": `${getMonthName(parseInt(requestData?.dateOfFireIncident.split("-")[1]))} ${requestData?.dateOfFireIncident.split("-")[2]}, ${requestData?.dateOfFireIncident.split("-")[0]}`,
            "Text4": dayToday,
            "Text5": `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.purpose === "Flood Victims"){
        locationPath = "CERTIFICATION FLOOD VICTIM.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": requestData?.nameOfTyphoon,
            "Text4": `${getMonthName(parseInt(requestData?.dateOfTyphoon.split("-")[1]))} ${requestData?.dateOfTyphoon.split("-")[2]}, ${requestData?.dateOfTyphoon.split("-")[0]}`,
            "Text6": dayToday,
            "Text7": `${monthToday} ${yearToday}`,
        }
    }

    if(requestData?.purpose === "Philhealth Sponsor"){
        locationPath = "CERTIFICATE OF INDIGENCY _PHILHEALTH SPONSOR.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": dayToday,
            "Text4": `${monthToday} ${yearToday}`,
        }
    };

    if(requestData?.purpose === "Medical Assistance"){
        locationPath = "CERTIFICATE OF INDIGENCY _MEDICAL ASST.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": dayToday,
            "Text4": `${monthToday} ${yearToday}`,
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
    link.download=`${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
    return;
}


const today = new Date();


const extraData = {
    day: "",
    month: "",
    year:   "",
}

const handleGenerateDocument = async(documentB:any) => {
    function replacePlaceholders(body: string, values: Record<string, string>) {
        return body.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
    }



    const docRef = query(
      collection(db, "OtherDocuments"),
      where("type", "==", documentB?.docType),
    );

    const docSnapshot = await getDocs(docRef);
    if (docSnapshot.empty) return;

    let documentData: any[] = [];
    docSnapshot.forEach((doc) => {
      const data = doc.data();
      documentData.push({
        id: doc.id,
        ...data,
      });
    });

    
    const day = getOrdinal(today.getDate());
    const month = getMonthName(today.getMonth() + 1);
    const year = today.getFullYear();
    extraData.day = day;
    extraData.month = month;
    extraData.year = year.toString();

    // ✅ Actually store the result of filtering
    const matchedDoc = documentData.find((doc) => doc.title === documentB?.purpose);

    console.log("Matched Document:", matchedDoc);
    console.log("Document Data:", documentB);
    console.log("Extra Data:", extraData);

    const documentFields =  [];

    const dynamicFields = matchedDoc.fields.reduce((acc: any, field: any) => {
      acc[field.name] = documentB[field.name];
      return acc;
    }, {});
    
    documentFields.push(dynamicFields);
    console.log("Document Fields:", documentFields);

    const mergedData = {
      ...dynamicFields,
      ...extraData,
    };
    
    const newBody = replacePlaceholders(matchedDoc?.body, mergedData);

    console.log("Replaced Body:", newBody);
    
    
    console.log("Generating document with body:", newBody);
    const response = await fetch('/api/dynamicPDF', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: matchedDoc?.title,
            body: newBody,
        }),
    });
    if (!response.ok) {
        console.error("Failed to generate PDF");
        return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download=`${documentB.docType}${`_${documentB.purpose}` || ""}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    link.remove();        
}


    
export {handlePrint, handleGenerateDocument};