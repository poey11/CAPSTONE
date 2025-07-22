"use client"

import { useRouter } from "next/navigation";
import "@/CSS/barangaySide/ServicesModule/Appointments.css";
import { useMemo, useEffect, useState } from "react";
import Calendar from "@/app/(barangay-side)/components/calender";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSearchParams } from 'next/navigation';
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
        .map((item) => {
          // Parse ISO string and convert to local time (Philippines is UTC+8)
          const isoDate = item.appointmentDate;
          const dateObj = new Date(isoDate);
          // Get time in HH:mm AM/PM format
          const timeString = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila",
          });

          return {
            id: item.id,
            title: `${item.requestId.split("-")[1]} - ${item.requestId.split("-")[2]} : ${timeString}`,
            date: isoDate,
            requestStatus: item.status,
            statusPriority: item.statusPriority,
            approvedBySAS: item.approvedBySAS,
          };
        })
        .filter(
          (item) =>
            item.approvedBySAS === true &&
            item.requestStatus !== "Completed" &&
            item.requestStatus !== "Rejected"
        );
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


const searchParams = useSearchParams();

    /* NEW UPDATED ADDED */
    const [filtersLoaded, setFiltersLoaded] = useState(false);
  
    /* NEW UPDATED ADDED */
    useEffect(() => {
      setFiltersLoaded(false); // reset animation
      const timeout = setTimeout(() => {
        setFiltersLoaded(true); // retrigger
      }, 50); // adjust delay as needed
      return () => clearTimeout(timeout);
    }, [searchParams.toString()]);

    return (

        <main className="appointments-main-container" /* edited this class*/>

         <div className="appointment-calendar-container">
         <div className="custom-calendar-wrapper">
          <Calendar appointments={appointmentData} />
          </div>
         </div>
          
        
         
        
      </main>
        
    );
}