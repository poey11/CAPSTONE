import { getLocalDateString } from "./helpers";
import { toWords } from 'number-to-words';
import {db, storage} from "@/app/db/firebase";
import { collection,getDocs, query, where,addDoc, doc, onSnapshot, updateDoc, arrayUnion, getDoc, setDoc, arrayRemove } from "firebase/firestore";
import {customAlphabet} from "nanoid";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import next from "next";




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


const handlePrint = async(requestData:any, id:any) => {
    const dateToday = getLocalDateString(new Date());
    const dayToday = getOrdinal(parseInt(dateToday.split("-")[2]));
    const monthToday = getMonthName(parseInt(dateToday.split("-")[1]));
    const yearToday = dateToday.split("-")[0];
    let locationPath = "";
    let reqData = {};
    if(requestData?.purpose === "Death Residency"){
        locationPath = "DeathResidency.pdf";
        reqData = {
                "Text1":`${(requestData?.fullName|| "")
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
            "Text1":`${(requestData?.fullName || "")
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
    else if(requestData?.purpose === "Residency" && !(requestData?.docType === "Barangay Clearance")){
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
    
        const file = new File([blobB], `${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`, { type: "application/pdf" });
        await uploadPDFToFirebase(file, requestData,id);
        return;
    }
    else if(requestData?.purpose === "Good Moral and Probation"){
        if(requestData?.goodMoralPurpose === "Legal Purpose and Intent") locationPath = "certificate of goodmoral_a.pdf";
        else locationPath = "certificate of goodmoral_b.pdf";
        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            ...(requestData?.goodMoralPurpose === "Legal Purpose and Intent" ? {
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
            "Text1":`${(requestData?.fullName || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
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
    const nextYear = (parseInt(yearToday) + 1).toString();

    if(requestData?.docType === "Barangay Clearance"){
        if(requestData?.purpose === "Residency") locationPath = "RESIDENCY.pdf"; // ✅
        else if(requestData?.purpose === "Loan") locationPath ="LOAN.pdf"; //✅
        else if(requestData?.purpose === "Bank Transaction") locationPath ="BANK TRANSACTION.pdf";//✅
        else if(requestData?.purpose === "Local Employment") locationPath ="LOCAL EMPLOYEMENT.pdf";//✅
        else if(requestData?.purpose === "Maynilad") locationPath ="MAYNILAD.pdf";//✅
        else if(requestData?.purpose === "Meralco") locationPath ="MERALCO.pdf";//✅
        else if(requestData?.purpose === "Bail Bond") locationPath ="BAIL BOND_Clearance_OC.pdf";

        reqData = {
            "Text1":`${(requestData?.requestorFname || requestData?.requestor || "")
            .replace(/^Mr\.?\s*/i, "")
            .replace(/^Ms\.?\s*/i, "")
            .toUpperCase()}`,
            "Text2": requestData?.address,
            "Text3": `${getMonthName(parseInt(requestData?.birthday.split("-")[1]))} ${requestData?.birthday.split("-")[2]}, ${requestData?.birthday.split("-")[0]}`,
            "Text4": requestData?.civilStatus,
            "Text5": requestData?.gender,
            "Text6": requestData?.dateOfResidency.split("-")[0],
            "Text7": requestData?.age.toString(),
            "Text8": requestData?.citizenship.toUpperCase(),
            "Text9": nextYear,
            "Text10": `${monthToday} ${dayToday}, ${yearToday}`,
        };
        
    }



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
                imageUrl: requestData?.twoByTwoPicture || "",
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
        const file = new File([blobB], `${requestData?.docType}${`_${requestData?.purpose}` || ""}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`, { type: "application/pdf" });
        await uploadPDFToFirebase(file, requestData,id);
        return;
    }

    if(requestData?.purpose === "First Time Jobseeker"){
        const yearOfResidency = parseInt(requestData?.dateOfResidency.split("-")[0]);
        const yearOfRequest = parseInt(requestData?.createdAt.split("/")[2]);
        let yearNos = 0;
        if(yearOfRequest === yearOfResidency){
            yearNos = 1;
        }
        else{
            yearNos = yearOfRequest - yearOfResidency;
        }
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
            "Text7":yearNos.toString(),
        }

        let locationPath2 = "OATH OF UNDERTAKING.pdf";
        let reqData2 = {
            "Text1": `${(requestData?.requestorFname || requestData?.requestor || "")
                .replace(/^Mr\.?\s*/i, "")
                .replace(/^Ms\.?\s*/i, "")
                .toUpperCase()}`,
            "Text2": parseInt(requestData?.age).toString(),
            "Text3": requestData?.address,
            "Text4": yearNos.toString(),
            "Text5": dayToday,
            "Text6":`${monthToday} ${yearToday}`,
            "Text7": `${requestData?.requestorFname.toUpperCase()}`,
            "Text8": `${monthToday} ${dateToday.split("-")[2]}, ${yearToday}`,
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
        linkB.download=`${requestData?.docType}_Oath Of Undertaking_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`;
        linkB.click();
        URL.revokeObjectURL(urlB);
        linkB.remove();
        const file = new File([blobB], `${requestData?.docType}_Oath Of Undertaking_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`, { type: "application/pdf" });
        await uploadPDFToFirebase(file, requestData,id);
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
    link.download=`${requestData?.docType}_${`${requestData?.purpose || ""}`}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`
    link.click();
    URL.revokeObjectURL(url);
    link.remove();

    
    const file = new File([blob], `${requestData?.docType}_${`${requestData?.purpose || ""}`}_${requestData?.requestor.toUpperCase() || requestData?.requestorFname.toUpperCase()}.pdf`, { type: "application/pdf" });
    await uploadPDFToFirebase(file, requestData,id);
    

    return;
}

const uploadPDFToFirebase = async (file: File, data:any, id:any) => {
    console.log(data);
    try {
        const storageRef = ref(storage, `GeneratedDocuments/${id}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const docRef = doc(db, "ServiceRequests",id);

        const docSnapshot = await getDoc(docRef);
        if (!docSnapshot.exists()) {
            await setDoc(docRef, {
                listOfPDFs:[]
            }, {merge:true});
        }
        
        await updateDoc(docRef, {
            listOfPDFs: arrayUnion(downloadURL),
        });
    return downloadURL;
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};


const today = new Date();


const extraData = {
    day: "",
    month: "",
    year:   "",
}

function replacePlaceholders(body: string, values: Record<string, string>) {
    return body.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
}
const handleGenerateDocument = async(documentB:any, id:any) => {
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


    const documentFields =  [];

    const dynamicFields = matchedDoc.fields.reduce((acc: any, field: any) => {
      acc[field.name] = documentB[field.name];
      return acc;
    }, {});


    
    documentFields.push(dynamicFields);

    const mergedData = {
      ...dynamicFields,
      ...extraData,
    };
    
    const newBody = replacePlaceholders(matchedDoc?.body, mergedData);
    const variableNames = extractVariableNames(matchedDoc?.body);
    const boldWords:any[] = [];
    variableNames.forEach((variable) => {
        boldWords.push(mergedData[variable]);
    });
    console.log("Bold Words:", boldWords);

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
            boldWords: boldWords,
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

    const file = new File([blob], `${documentB.docType}${`_${documentB.purpose}` || ""}.pdf`, { type: "application/pdf" });
    await uploadPDFToFirebase(file, documentB, id);

}

const deleteOldestPDF = async (docId: string) => {
  try {
    const docRef = doc(db, "ServiceRequests", docId);
    const snapshot = await getDoc(docRef);

    const data = snapshot.data();
    const listOfPDFs: string[] = data?.listOfPDFs || [];

    if (listOfPDFs.length === 0) {
      console.log("No PDFs to delete.");
      return;
    }

    const oldestURL = listOfPDFs[0];

    // 🔁 Convert download URL to storage path
    const match = oldestURL.match(/\/o\/(.*?)\?/);
    const fullPath = match ? decodeURIComponent(match[1]) : null;

    if (!fullPath) {
      console.error("❌ Could not extract storage path from URL.");
      return;
    }

    const fileRef = ref(storage, fullPath);

    await deleteObject(fileRef);

    // 🔄 Remove from Firestore
    await updateDoc(docRef, {
      listOfPDFs: arrayRemove(oldestURL),
    });

    console.log("✅ Oldest PDF deleted successfully.");
  } catch (error) {
    console.error("❌ Failed to delete oldest PDF:", error);
  }
}

function extractVariableNames(bodyText: string): string[] {
  const regex = /{(.*?)}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(bodyText)) !== null) {
    matches.push(match[1].trim()); // add variable name without braces
  }

  return matches;
}


const handleGenerateDocumentTypeB = async(documentB:any, id:any) => {
    console.log("Document Type B:", documentB);
    const dateToday = getLocalDateString(new Date());
    const dayToday = getOrdinal(parseInt(dateToday.split("-")[2]));
    const monthToday = getMonthName(parseInt(dateToday.split("-")[1]));
    const yearToday = dateToday.split("-")[0];
    
    const docRef = query(
        collection(db, "DocumentBody"),
        where("docType", "==", documentB?.docType),
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
    console.log("Document Data:", documentData);

    if(documentB?.docType === "Barangay Certificate" && documentB?.purpose === "No Income"){
        documentB = {
            ...documentB,
            ...(documentB?.noIncomePurpose === "ESC Voucher" && {
                purpose: "No Income B",
            })
        }
    }
    if(documentB?.docType === "Barangay Certificate" && documentB?.purpose === "Guardianship"){
        documentB = {
            ...documentB,
            ...(documentB?.guardianshipType === "Legal Purpose" && {
                purpose: "Guardianship B",
            }),
        }
    }
    if(documentB?.docType === "Barangay Certificate" && documentB?.purpose === "Good Moral and Probation"){
        documentB = {
            ...documentB,
            ...(documentB?.goodMoralPurpose === "Others" &&{
                purpose: "Good Moral and Probation B",
            })
        }    
        
    }
    if(documentB?.docType === "Barangay Indigency" && documentB?.purpose === "No Income"){
        documentB = {
            ...documentB,
            ...(documentB?.noIncomePurpose === "ESC Voucher" && {
                purpose: "No Income B",
            })
        }
    }
    
    const matchedDoc = documentData.find((doc) => doc.purpose === documentB?.purpose);
    documentB = {
        ...documentB,
        requestorFname:`${documentB?.requestorFname || documentB?.requestor || ""}`.replace(/^Mr\.?\s*/i, "").replace(/^Ms\.?\s*/i, "").toUpperCase(),
        dayToday: dayToday,
        monthToday: monthToday,
        yearToday: yearToday,
        ...(documentB?.docType === "Barangay Certificate" && {
            ...(documentB?.purpose === "Estate Tax" && {
                dateOfResidencyYear: documentB?.dateOfResidency.split("-")[0],
                dateofdeath: `${getMonthName(parseInt(documentB?.dateofdeath.split("-")[1]))} ${documentB?.dateofdeath.split("-")[2]}, ${documentB?.dateofdeath.split("-")[0]}`,
            }),
            ...(documentB?.purpose === "Death Residency" && {
                dateofdeath: `${getMonthName(parseInt(documentB?.dateofdeath.split("-")[1]))} ${documentB?.dateofdeath.split("-")[2]}, ${documentB?.dateofdeath.split("-")[0]}`,
            }),
            ...(documentB?.purpose === "Cohabitation" && {
                cohabitationStartDate: `${getMonthName(parseInt(documentB?.cohabitationStartDate.split("-")[1]))} ${documentB?.cohabitationStartDate.split("-")[2]}, ${documentB?.cohabitationStartDate.split("-")[0]}`,
                partnerWifeHusbandFullName: `${documentB?.partnerWifeHusbandFullName || ""}`.replace(/^Mr\.?\s*/i, "").replace(/^Ms\.?\s*/i, "").toUpperCase(),
            }),
            ...(documentB?.purpose === "Good Moral and Probation B" && {
               goodMoralPurpose: documentB?.goodMoralOtherPurpose
            }),
            ...((documentB?.purpose === "Garage/TRU" || documentB?.purpose === "Garage/PUV")  && {
                noOfVehicles: toWords(parseInt(documentB?.noOfVehicles)).toUpperCase() + ` (${documentB?.noOfVehicles})`,
            }),
            
        }),
        ...(documentB?.docType === "Barangay Indigency" && {
            ...(documentB?.purpose === "Fire Victims" && {
                dateOfFireIncident: `${getMonthName(parseInt(documentB?.dateOfFireIncident.split("-")[1]))} ${documentB?.dateOfFireIncident.split("-")[2]}, ${documentB?.dateOfFireIncident.split("-")[0]}`,
            }),
            ...(documentB?.purpose === "Flood Victims" && {
                dateOfTyphoon: `${getMonthName(parseInt(documentB?.dateOfTyphoon.split("-")[1]))} ${documentB?.dateOfTyphoon.split("-")[2]}, ${documentB?.dateOfTyphoon.split("-")[0]}`,
                 nameOfTyphoon: documentB?.nameOfTyphoon.toUpperCase(),
                typhoonSignal: documentB?.typhoonSignal
            }),
        }),
        ...(documentB?.docType === "Other Documents"&& {
            ...(documentB?.purpose === "First Time Jobseeker" && {
                yearNos: (() => {
                    const yearOfResidency = parseInt(documentB?.dateOfResidency.split("-")[0]);
                    const yearOfRequest = parseInt(documentB?.createdAt.split("/")[2]);
                    return `${toWords(yearOfRequest === yearOfResidency ? 1 : yearOfRequest - yearOfResidency).toUpperCase()} (${yearOfRequest === yearOfResidency ? 1 : yearOfRequest - yearOfResidency})`;
                })(),
                nextYear: (parseInt(yearToday) + 1).toString(),
            })
        }),
    }

    
    let location = "";

    if(documentB?.docType === "Barangay Certificate"){
        location = "CERTIFICATE_template.pdf"
    }
    else if(documentB?.docType === "Barangay Indigency"){
        location = "INDIGENCY_template.pdf";
    }
    else if(documentB?.purpose === "Oath Of Undertaking" ){
        location = "OATH OF UNDERTAKING templates.pdf";
    }
    else{
        location = "CERTIFICATE_template.pdf";
    }

    const newBody = replacePlaceholders(matchedDoc?.Body, documentB);

    const variableNames = extractVariableNames(matchedDoc?.Body);

    const boldWords:any[] = [];
    variableNames.forEach((variable) => {
        boldWords.push(documentB[variable]);
    });

    const separateBoldWords: string[] = [];
    
    boldWords.forEach((phrase) => {
      if (typeof phrase === 'string') {
        // Split the phrase by whitespace and filter out empty strings
        const words = phrase.trim().split(/\s+/);
        separateBoldWords.push(...words);
      }
    });

    const response = await fetch('/api/swapTextPDF', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            location: location,
            body: newBody,
            purpose: documentB?.purpose,
            boldWords: boldWords,
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
    link.download=`${documentB?.docType}${`_${documentB?.purpose}` || ""}_${documentB?.requestor.toUpperCase() || documentB?.requestorFname.toUpperCase()}.pdf`;
    if(!(documentB?.docType == "Barangay Certificate" && documentB?.purpose == "Residency")){
        link.click();
        URL.revokeObjectURL(url);
        link.remove();   
    }     
    const file = new File([blob], `${documentB.docType}${`_${documentB.purpose}` || ""}.pdf`, { type: "application/pdf" });
    const pdfURL = await uploadPDFToFirebase(file, documentB, id);
    
 


    if(documentB?.docType === "Barangay Certificate" && documentB?.purpose === "Residency"){
        const responseB = await fetch("/api/imageToPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pdfTemplate: pdfURL,
                data: documentB,
                imageUrl: documentB?.photoUploaded,
                imageX:10,
                imageY:570,
                imageWidth:130,
                imageHeight:105,
            })
        });
        if(!responseB.ok)throw new Error("Failed to generate PDF");
        const blobB = await responseB.blob();
        const urlB = URL.createObjectURL(blobB);
        const linkB = document.createElement("a");
        linkB.href = urlB;
        linkB.download=`${documentB?.docType}${`_${documentB?.purpose}` || ""}_${documentB?.requestor.toUpperCase() || documentB?.requestorFname.toUpperCase()}.pdf`;
        linkB.click();
        URL.revokeObjectURL(urlB);
        linkB.remove();
        const file = new File([blobB], `${documentB?.docType}${`_${documentB?.purpose}` || ""}_${documentB?.requestor.toUpperCase() || documentB?.requestorFname.toUpperCase()}.pdf`, { type: "application/pdf" });
        await deleteOldestPDF(id);
        await uploadPDFToFirebase(file, documentB, id);
        return;
    }

    if(documentB?.purpose === "First Time Jobseeker"){  
        const newData = {
            ...documentB,
            purpose: "Oath Of Undertaking",
            age: documentB?.age.toString(),
        }
        handleGenerateDocumentTypeB(newData, id);
        return;
    }

}

    
export {handlePrint, handleGenerateDocument, handleGenerateDocumentTypeB};


