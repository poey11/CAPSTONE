"use client"
import {db, storage} from "@/app/db/firebase";
import {collection, doc, deleteDoc, onSnapshot, query, where, getDoc, getDocs} from "firebase/firestore";
import { ReportProps } from "@/app/helpers/interfaceHelper";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";

const getAllIncidentReports =  (setIncidentData:(data: ReportProps[])=>  void) => {
    try{
        const luponReportCollection = collection(db, "IncidentReports");
        const unsubscribe = onSnapshot(luponReportCollection, (snapshot) => {
        const reports: ReportProps[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ReportProps[];
        
        setIncidentData(reports);
        });

        return unsubscribe;
    
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const  getIncidentDataByDepartment =  (department: string,  setIncidentData:(data: ReportProps[])=>  void) => {
    try{
        const luponReportCollection = query(collection(db, "IncidentReports"), where("department", "==", department));
        const unsubscribe = onSnapshot(luponReportCollection, (snapshot) => {
        const reports:ReportProps[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as ReportProps[];
        
        setIncidentData(reports);
        });
        return unsubscribe;
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const getSpecificIncidentReport = async (id: string, setReportData:(data: any)=> void, setLTReportData:(data:any)=> void) => {
    try{
        const docRef = doc(db, "IncidentReports", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setReportData(docSnap.data());
        } else {
            console.log("No such document!");
        }
        const LTreportRef = collection(docRef, "LTAssignedInfo");
        const LTreportCollectionSnapshot = await getDocs(LTreportRef);
        if (LTreportCollectionSnapshot.empty) {
            console.log("No matching document.");
            return;
          }
          const LTdata = LTreportCollectionSnapshot.docs[0].data();
         return setLTReportData(LTdata);

    }
    catch(error:String|any){
        console.log(error.message);
    }
}
const generateDownloadLink = async (file: string, location: string) => {
    try{
        const fileRef = ref(storage, `${location}/${file}`);
        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const deleteDocument = async (collection: string,id: string) => {
    /*incomplete should also delete the LTAssignedInfo subcollection picture */
    try{
        const docRef = doc(db, collection, id);
        const docSnapshot = await getDoc(docRef);

        if (!docSnapshot.exists()) {
            console.log("Document does not exist.");
            return;
        }

        const docData = docSnapshot.data();
        const imagePath = docData?.file; 

        if (imagePath) {
            const newImagePath = `${collection}/${imagePath}`;
            const imageRef = ref(storage,  newImagePath);
            await deleteObject(imageRef);
            console.log("Image deleted successfully:", imagePath);
        }
        deleteDoc(docRef);

       }
       catch(error:String|any){
         console.log(error.message);
       }
}

export {getIncidentDataByDepartment, 
    getAllIncidentReports, getSpecificIncidentReport
    , generateDownloadLink, deleteDocument
};