"use client";

import "@/CSS/OfficialsPage/HOA.css";

import { useState,useEffect } from "react";
import { collection, onSnapshot,query,where} from "firebase/firestore";
import { db } from "@/app/db/firebase";

interface NewOfficerDetails {
  id?: string;
  fullName: string;
  email: string;
  facebook: string;
  position: string;
  otherPosition?: string;
  location: string;
  clusterSection: string;
  otherClusterSection?: string;
  contact: string;
  department: string;
  image: string;
  createdAt?: String;
  updatedAt?: String;
  createdBy?: string;
}


export default function HOAOfficersPage() {
  

  const [officials, setOfficial] = useState<NewOfficerDetails[]>([]);
  useEffect(() => {
    const docRef = query(collection(db, "hoaSitioOfficers"), where("department", "==", "HOA") );
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data: NewOfficerDetails[] = snapshot.docs.map((doc) => (doc.data() as NewOfficerDetails));
      setOfficial(data);
    });
    return () => unsubscribe();

  },[])
  return (

    
    <main className="main-container-hoa">

      <div className="headerpic-hoa">
        <p>HOA OFFICERS</p>
      </div>

      <div className="officials-header">
        <h1 className="officials-title">Meet the HOA Officers</h1>
        <div className="officials-underline"></div>
      </div>

     
      <div className="other-officials-section">
          {officials.map((official, index) => (
            <div key={index} className="official-card-officials">
              <img
                src={official.image}
                alt={official.image}
                className="official-image-officials"
              />
              <div className="official-content-officials">
                <p className="official-role-officials">{official.position}</p>
                <h2 className="official-name-officials">{official.fullName}</h2>
                <h3 className="official-cluster-officials">{official.clusterSection}
                  {official.clusterSection === "Others"
                    ? ` - ${official.otherClusterSection}`
                    : ""}
                </h3>
                
                <p className="official-phonenumber-officials">
                  Contact Information: {official.contact}
                </p>
                <p className="official-phonenumber-officials">
                  Location: {official.location}
                </p>
                <p className="official-phonenumber-officials">
                  Email: {official.email || "N/A"}
                </p>
                <a href={official.facebook} 
                 target="_blank" 
                  rel="noopener noreferrer"
                className="official-phonenumber-officials">
                  Facebook: {official.facebook || "N/A"}
                </a>
                    
              </div>
            </div>
          ))}
        </div>

   
    </main>
  );
}
