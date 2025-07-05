import { getLocalDateString } from "./helpers";
import { toWords } from 'number-to-words';


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
                "Text1":`${requestData?.requestorFname.toUpperCase()} (Deceased),`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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
            "Text2": requestData?.requestorFname.toUpperCase(),
            "Text3": requestData?.address.toUpperCase(),
            "Text4": `${toWords(parseInt(requestData?.nosOfPUV)).toUpperCase()} (${requestData?.nosOfPUV})`,
            "Text5": requestData?.puvPurpose,
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
            "Text1":`${requestData?.requestorFname.toUpperCase()}`,
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

export {handlePrint};