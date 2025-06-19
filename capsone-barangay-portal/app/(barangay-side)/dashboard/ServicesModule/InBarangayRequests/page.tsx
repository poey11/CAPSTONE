"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "@/CSS/barangaySide/ServicesModule/InBarangayRequests.css";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";


  export default function InBarangayRequests() { 
    const router = useRouter();
    const [requestData, setRequestData] = useState<any[]>([]);

    useEffect(() => {
      try {
        const Collection = query(
          collection(db,"ServiceRequests"),
          where("accID", "==", "INBRGY-REQ"), // Filter for In Barangay requests
          orderBy("createdAt", "desc") // First, sort by latest
        );      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        
          // Now sort client-side: Pending (1) first, then Pickup (2), etc.
          reports.sort((a, b) => {
            if (a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // status priority asc
            }
          
            // Convert string dates to timestamps
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        
          setRequestData(reports);
          console.log(requestData);

        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
      }
    }, []);


    const handleGenerateDocument = () => {
      router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    };

    const handleView =(id: string,reqType:string) => {
      if(reqType === "Other Documents"){
        router.push(`/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/OtherNewDocument/view?id=${id}`);
      }
      else{
        router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest?id=${id}`);
      }
    };

  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleDeleteClick = (documentType: string) => {
    setSelectedDocumentType(documentType); 
    setShowDeletePopup(true);
};

const confirmDelete = () => {
  setShowDeletePopup(false);

  const documentType = selectedDocumentType || "Document";
  setPopupMessage(`${documentType} deleted successfully!`);
  setShowPopup(true);

  // Hide the popup after 3 seconds
  setTimeout(() => {
    setShowPopup(false);
  }, 3000);
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

        <main className="inbarangayreq-main-container">
         <div className="inbarangayreq-section-1">
          <h1>In Barangay Document Requests</h1>
          <button
            className="add-announcement-btn"
            onClick={handleGenerateDocument}
          >
            Generate Document
          </button>
         </div>
         <div className="inbarangayreq-section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter Document Type" 
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
            <option value="active">New</option>
            <option value="inactive">Completed</option>
            <option value="inactive">In Progress</option>
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

         <div className="inbarangayreq-main-section">
          <table>
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Request ID</th>
                <th>Request Date</th>
                <th>Requestor</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {requestData.map((request, index) => (
              <tr key={index}>
                <td>{request.docType}</td>
                <td>{request.requestId}</td>
                <td>{request.createdAt}</td>
                <td>{request.requestor}</td>
                <td>{request.purpose}</td>
                <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view"
                        onClick={() => handleView(request.id, request.reqType)}
                    >
                        View
                    </button>

                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>


        {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
        )}

        {showDeletePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to delete this request?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDelete} className="yes-button">Yes</button>
                                </div> 
                            </div>
                        </div>
          )}
                

      </main>
        
    );
}