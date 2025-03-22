"use client"
import {db, storage} from "../db/firebase";
import {collection, doc, deleteDoc, onSnapshot, query, where, getDoc, getDocs, getCountFromServer , count  } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";

const getAllDocument =  (collect:string,data:(data: any[])=>  void) => {
    try{
        const Collection = collection(db, collect);
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
        const reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        
          data(reports);
        });

        return unsubscribe;
    
    }
    catch(error:String|any){
        console.log(error.message);
    }
}


const getAllStaffList = async (setStaffList:(data: any)=> void) => {
    try {
        const staffquery = collection(db, "BarangayUsers");
        const querySnapshot = await getDocs(staffquery);
        
        const newStaffList: any[] = [];
        querySnapshot.forEach((doc) => {
            newStaffList.push(doc.data());
        });
  
        return setStaffList(newStaffList);
      } catch (error: any) {
        console.error("Error fetching LT List:", error.message);
      }
}


const getStaffList = async (position:string,setStaffList:(data: any)=> void) => {
    try {
        const staffquery = query(collection(db, "BarangayUsers"), where("position", "==",position));
        const querySnapshot = await getDocs(staffquery);
        
        const newStaffList: any[] = [];
        querySnapshot.forEach((doc) => {
            newStaffList.push(doc.data());
        });
  
        return setStaffList(newStaffList);
      } catch (error: any) {
        console.error("Error fetching LT List:", error.message);
      }
}

const  getAllSpecificDocument =  (collect: string,  attribute: string, sign:any, value: string    ,setData:(data: any[])=>  void) => {
    try{
        const reportCollection = query(collection(db, collect), where(attribute, sign, value));
        const unsubscribe = onSnapshot(reportCollection, (snapshot) => {
        const reports:any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        
        setData(reports);
        });
        return unsubscribe;
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const getSpecificDocument = async (mainCollection: string, id: string, setData:(data: any)=> void) => {
    try{
        console.log(id, mainCollection);
        const docRef = doc(db, mainCollection, id);

        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return setData(docSnap.data());
        } else {
            console.log("No such document!");
        }
     

    }
    catch(error:String|any){
        console.log(error.message);
    }
}

const getAllSpecificSubDocument = async (mainCollection: string, id: string, subCollection:string, nos:number, setData:(data: any[])=> void) => {
    try{
        const docRef = doc(db, mainCollection, id);
        const subDocRef = collection(docRef, subCollection);
        const subDocSnap = await getDocs(subDocRef);
        if (subDocSnap.empty) {  
            console.log("No matching document."); 
            return;
        }
        const unsubscribe = onSnapshot(subDocRef, (snapshot) => {
        const reports:any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        
        setData(reports);
        });
        return unsubscribe;

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
    /*incomplete should also delete the  subcollection and pictures related to it in the firebase storage */
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

const getCountofCollection = async (collectionString: string) => {
    try{
        const collectionRef = collection(db, collectionString);
        const collectionCount =  await getCountFromServer(collectionRef);
        return collectionCount;

    }   
    catch(error:String|any){
        console.log(error.message);
    }
}

const getSpecificCountofCollection = async (collectionRef: string, attribute: string, value: string) => {
    try{
        const reportCollection = query(collection(db, collectionRef), where(attribute, "==", value));
        const collectionCount =  await getCountFromServer(reportCollection);
        console.log(collectionCount.data().count);
        return collectionCount.data().count;
    }
    catch(error:String|any){
        console.log(error.message);
    }
}

export {getAllSpecificDocument, getSpecificDocument,
    getAllDocument
    , generateDownloadLink, deleteDocument,
    getStaffList,getAllStaffList,getAllSpecificSubDocument,getCountofCollection,getSpecificCountofCollection
};