import {db, storage} from "@/app/db/firebase";
import {collection, doc, deleteDoc, onSnapshot, query, where} from "firebase/firestore";
import { useState } from "react";

const [incidentData, setIncidentData] = useState<any[]>([])

const getReportData = async (department: string, ) => {
    try{
        const luponReportCollection = query(collection(db, "IncidentReports"), where("department", "==", department));
        const unsubscribeReport = onSnapshot(luponReportCollection, (snapshot) => {
        const reportData:any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));   
        setIncidentData(reportData);
        });
    
        return unsubscribeReport;
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const getLTlist = async () => {
    


}

export {getReportData};