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
        }));
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
         <div className="appointments-section-1">
          <h1>Scheduled Appointments</h1>
          <button
            className="add-announcement-btn"
            onClick={handleCalendarView}
          >
            View Calendar
          </button>
          
         </div>
         <div className="appointments-section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter Appointment Type" 
          />
          <input 
                type="date" 
                className="search-bar" 
                placeholder="Select Date From" 
            />
            <input 
                type="date" 
                className="search-bar" 
                placeholder="Select Date To" 
            />
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Select Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Show...</option>
            <option value="active">Show 5</option>
            <option value="inactive">Show 10</option>
          </select>
         </div>
          <Calendar appointments={appointmentData} />

         
        <div className="redirection-section">
        <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === 'number' && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>&raquo;</button>
      </div>
      </main>
        
    );
}