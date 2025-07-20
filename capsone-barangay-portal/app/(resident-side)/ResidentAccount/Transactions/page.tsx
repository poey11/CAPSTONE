"use client";

import "@/CSS/ResidentAccount/transactions.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/db/firebase";

export default function Transactions() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactionData, setTransactionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [filterRequestId, setFilterRequestId] = useState<string>("");

    const currentUser = user?.uid;

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                
                const incidentRef = collection(db, "IncidentReports");
                const incidentQuery = query(incidentRef, where("reportID", "==", currentUser));
                const incidentSnapshot = await getDocs(incidentQuery);
                const incidents = incidentSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    type: "IncidentReport",
                    ...doc.data(),
                }));
    
                
                const serviceRef = collection(db, "ServiceRequests");
                const serviceQuery = query(serviceRef, where("accID", "==", currentUser));
                const serviceSnapshot = await getDocs(serviceQuery);
                const services = serviceSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    type: "ServiceRequest",
                    ...doc.data(),
                }));
    
                {/*}
                const combined = [...incidents, ...services].sort((a, b) => {
                    const dateA = new Date((a as any).createdAt);
                    const dateB = new Date((b as any).createdAt);
                    return dateB.getTime() - dateA.getTime(); // Latest first
                });
                */}

                const combined = [...incidents, ...services].sort((a, b) => {
                    const isACompleted = (a as any).status === "Completed";
                    const isBCompleted = (b as any).status === "Completed";
                
                    if (isACompleted && !isBCompleted) return 1;
                    if (!isACompleted && isBCompleted) return -1;
                
                    let dateA: Date;
                    let dateB: Date;
                
                    // Assign dateA
                    if (a.type === "IncidentReport") {
                        dateA = new Date((a as any).createdAt || (a as any).requestDate || 0);
                    } else if (a.type === "ServiceRequest") {
                        dateA = new Date((a as any).createdAt2 || (a as any).requestDate || 0);
                    } else {
                        dateA = new Date(0);
                    }
                
                    // Assign dateB
                    if (b.type === "IncidentReport") {
                        dateB = new Date((b as any).createdAt || (b as any).requestDate || 0);
                    } else if (b.type === "ServiceRequest") {
                        dateB = new Date((b as any).createdAt2 || (b as any).requestDate || 0);
                    } else {
                        dateB = new Date(0);
                    }
                
                    return dateB.getTime() - dateA.getTime(); // Newest first
                });

    
                setTransactionData(combined);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleTransactionClick = (transaction: any) => {
        console.log("Transaction clicked:", transaction);
        if (transaction.type === "IncidentReport") {
            router.push(`/ResidentAccount/Transactions/IncidentTransactions?id=${transaction.id}`);
        } else if (transaction.type === "ServiceRequest") {
            router.push(`/ResidentAccount/Transactions/DocumentTransactions?id=${transaction.id}`);
        } 
        else{
            router.push(`/ResidentAccount/Transactions/DocumentTransactions/OtherDocumentTransactions?id=${transaction.id}`);
        }  
    };

const filteredTransactions = transactionData.filter((item) => {
    const matchesType = filterType === "All" || item.type === filterType;
    const matchesStatus = filterStatus === "All" || item.status === filterStatus;

    const requestId = item.caseNumber || item.requestId || "";
    const matchesRequestId =
        filterRequestId.trim() === "" ||
        requestId.toLowerCase().includes(filterRequestId.trim().toLowerCase());

    return matchesType && matchesStatus && matchesRequestId;
});

    

    return (
        <main className="main-container-transactions">
            
            <div className="headerpic-transactions">
                <p>TRANSACTIONS</p>
            </div>

        <div className="transacntions-container fade-in">
            <div className="filter-section-transactions">
                <div className="filter-section-transactions-inner">
                    <div className="filter-group">
                    <label>Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="modern-filter-input"
                    >
                        <option value="All">All</option>
                        <option value="IncidentReport">Incident Report</option>
                        <option value="ServiceRequest">Document Request</option>
                    </select>
                    </div>

                    <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="modern-filter-input"
                    >
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Pick-up">Pick-Up</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                        <option value="In - Progress">In - Progress</option>
                    </select>
                    </div>

                    <div className="filter-group">
                    <label>Request ID</label>
                    <input
                        type="text"
                        placeholder="e.g. BSWOJU - 0018"
                        value={filterRequestId}
                        onChange={(e) => setFilterRequestId(e.target.value)}
                        className="modern-filter-input"
                    />
                    </div>
                </div>
                </div>


            <div className="transactions-history-transactions">
                <div className="table-section-transactions">
                    {loading ? (
                        <p>Loading...</p>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="no-transactions">
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Reference ID</th>
                                    <th>Type</th>
                                    <th>Details</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((item) => (
                                    <tr key={item.id} onClick={() => handleTransactionClick(item)}>
                                        <td>{item.createdAt2 ||item.createdAt ||"N/A"}</td>
                                        <td>
                                            {item.caseNumber && item.caseNumber.split(" - ").length >= 3
                                                ? `${item.caseNumber.split(" - ")[1]} - ${item.caseNumber.split(" - ")[2]}`
                                                : item.requestId && item.requestId.split(" - ").length >= 3
                                                ? `${item.requestId.split(" - ")[1]} - ${item.requestId.split(" - ")[2]}`
                                                : "N/A"}
                                        </td>
                                        <td>{item.type === "IncidentReport" ? "Incident Report" : "Document Request"}</td>
                                        <td>{item.concerns || item.docType || "N/A"}</td>
                                        <td>{item.purpose || "N/A"}</td>
                                        <td>
                                            <span className={`status-dropdown-transactions ${item.status?.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
                                                {item.status || "N/A"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
           
        </main>
    );
}
