"use client"

import { useRouter } from "next/navigation";
import "@/CSS/barangaySide/ServicesModule/Appointments.css";
import { useMemo, useEffect, useState } from "react";
import Calendar from "@/app/(barangay-side)/components/calender";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { request } from "http";


type Appointment = {
    id: string;
    title: string;
    date: string; // format: 'YYYY-MM-DD'
    requestStatus?: string; // Optional field for sorting

  }


  export default function Appointments() {

    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
      try {
        const Collection = query(collection(db, "ServiceRequests"));
      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          const reports = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setData(reports); // don't sort here
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.error(error.message);
      }
    }, []);



    const appointmentData: Appointment[] = useMemo(() => {
      return [...data]
        .sort((a, b) => {
          if (a.statusPriority !== b.statusPriority) {
            return a.statusPriority - b.statusPriority;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .map((item) => ({
          id: item.id,
          title: `${item.docType} - ${item.purpose}`,
          date:
            item.appointmentDate,
          requestStatus: item.status,
          statusPriority: item.statusPriority,
          approvedBySAS: item.approvedBySAS,
        })).filter((item) => item.approvedBySAS === true );
        
    }, [data]);

    console.log(appointmentData);

    const router = useRouter();

    const handleCalendarView = () => {
      router.push("/dashboard/ServicesModule/Appointments/CalendarView");
    };

    const handleView = () => {
      router.push("/dashboard/ServicesModule/Appointments/View");
    };

    const handleEdit = () => {
      router.push("/dashboard/ServicesModule/Appointments/Edit");
  };

  const handleSMS = () => {
    window.location.href = "/dashboard/ServicesModule/Appointments/SMS";
};


const [currentPage, setCurrentPage] = useState(1);
const residentsPerPage = 10; //pwede paltan 

const [filteredOnlineRequests, setFilteredOnlineRequests] = useState<any[]>([]);

const indexOfLastRequest = currentPage * residentsPerPage;
const indexOfFirstRequest = indexOfLastRequest - residentsPerPage;
const currentOnlineRequests = filteredOnlineRequests.slice(indexOfFirstRequest, indexOfLastRequest);

const totalPages = Math.ceil(filteredOnlineRequests.length / residentsPerPage);


const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

const getPageNumbers = () => {
  const totalPagesArray = [];
  const pageNumbersToShow = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pageNumbersToShow.push(i);
    } else if (
      (i === currentPage - 2 || i === currentPage + 2) &&
      pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
    ) {
      pageNumbersToShow.push("...");
    }
  }

  return pageNumbersToShow;
};


  

    return (

        <main className="appointments-main-container">
        
         <div className="appointments-section-2">
          <input 
              type="text" 
              className="appointments-module-filter" 
              placeholder="Enter Appointment Type" 
          />
          <input 
                type="date" 
                className="appointments-module-filter" 
                placeholder="Select Date From" 
            />
            <input 
                type="date" 
                className="appointments-module-filter" 
                placeholder="Select Date To" 
            />
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="appointments-module-filter" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Select Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
         </div>

         <div className="appointment-calendar-container">
          <Calendar appointments={appointmentData} />
         </div>
          

         
        
      </main>
        
    );
}