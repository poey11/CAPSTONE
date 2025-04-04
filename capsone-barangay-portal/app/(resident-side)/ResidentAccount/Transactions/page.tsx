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

        const fetchIncidentReports = async () => {
            setLoading(true);
            try {
                const reportsRef = collection(db, "IncidentReports");
                const q = query(reportsRef, where("reportID", "==", currentUser));
                const querySnapshot = await getDocs(q);

                const fetchedReports = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setTransactionData(fetchedReports);
            } catch (error) {
                console.error("Error fetching IncidentReports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIncidentReports();
    }, [currentUser]);

    const handleTransactionClick = (transaction: any) => {
        router.push(`/ResidentAccount/Transactions/IncidentTransactions?id=${transaction.id}`);
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
                                    <th>Reference ID</th>
                                    <th>Department</th>
                                    <th>Concern</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionData.map((report) => (
                                    <tr key={report.id} onClick={() => handleTransactionClick(report)}>
                                        <td>{report.dateFiled || "N/A"}</td>
                                        <td>{report.caseNumber || "N/A"}</td>
                                        <td>{report.department || "N/A"}</td>
                                        <td>{report.concerns || "N/A"}</td>
                                        <td>
                                            <span className={`status-dropdown-transactions ${report.status?.toLowerCase() || ""}`}>
                                                {report.status || "N/A"}
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
