"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/db/firebase";

import "@/CSS/ResidentAccount/transactions.css";

export default function Transactions() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactionData, setTransactionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
    
                const combined = [...incidents, ...services].sort((a, b) => {
                    const dateA = new Date((a as any).dateFiled || (a as any).requestDate || 0);
                    const dateB = new Date((b as any).dateFiled || (b as any).requestDate || 0);
                    return dateB.getTime() - dateA.getTime(); // Latest first
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
        if (transaction.type === "IncidentReport") {
            router.push(`/ResidentAccount/Transactions/IncidentTransactions?id=${transaction.id}`);
        } else if (transaction.type === "ServiceRequest") {
            router.push(`/ResidentAccount/Transactions/ServiceTransactions?id=${transaction.id}`);
        }   
    };

    

    return (
        <main className="main-container-transactions">
            
            <div className="headerpic-transactions">
                <p>TRANSACTIONS</p>
            </div>

            <div className="transactions-history-transactions">
                <div className="table-section-transactions">
                    {loading ? (
                        <p>Loading...</p>
                    ) : transactionData.length === 0 ? (
                        <div className="no-transactions">
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Reference ID</th>
                                    <th>Details</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionData.map((item) => (
                                    <tr key={item.id} onClick={() => handleTransactionClick(item)}>
                                        <td>{item.dateFiled || item.requestDate || "N/A"}</td>
                                        <td>{item.type === "IncidentReport" ? "Incident Report" : "Document Request"}</td>
                                        <td>{item.caseNumber || "N/A"}</td>
                                        <td>{item.concerns || item.docType || "N/A"}</td>
                                        <td>{item.purpose || "N/A"}</td>
                                        <td>
                                            <span className={`status-dropdown-transactions ${item.status?.toLowerCase() || ""}`}>
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
        </main>
    );
}
