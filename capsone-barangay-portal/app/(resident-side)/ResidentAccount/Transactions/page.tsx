"use client";

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";

import "@/CSS/ResidentAccount/transactions.css";

const metadata: Metadata = { 
    title: "Transactions Page for Resident Side",
    description: "Transactions Page for Barangay Side",
};

export default function Transactions() {
    const router = useRouter();

    const { data: session } = useSession();

    const currentUser = {
        name: session?.user?.fullName || "User",
    };

    const handleBack = () => {
        router.push("/dashboard");
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };


    { /* ONLINE INCIDENT REPORT STATUS:
        - Resolved
        - Pending


        Online Document Request Status:
        - Approved
        - Rejected
        - Pending
        
        */}

    const [transactionData] = useState([
        { Date: "05-10-2024",ReferenceId: "2001", Type: "Online Incident", Details: "Robbery Incident", Purpose: "N/A", Status: "Pending" },
        { Date: "05-10-2024",ReferenceId: "2002", Type: "Document Request", Details: "Barangay Clearance", Purpose: "Loan", Status: "Pick Up" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Indigency", Purpose: "No Income", Status: "Pick Up" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay ID", Purpose: "N/A", Status: "Completed" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Permit", Purpose: "Business Permit", Status: "Pending" }, // Business Permit
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Permit", Purpose: "Temporary Business Permit", Status: "Pending" }, // Temporary Business Permit
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Permit", Purpose: "Construction Permit", Status: "Pending" }, // Consruction Permit
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Permit", Purpose: "Liquor Permit", Status: "Pending" }, // Liquor Permit
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Permit", Purpose: "COOP", Status: "Pending" }, // COOP
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "Barangay Certificate", Purpose: "Death Residency", Status: "Rejected" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document Request", Details: "First Time Jobseeker", Purpose: "N/A", Status: "Pick Up" },
        
    ]);

    const handleSort = (key: keyof typeof transactionData[0]) => {
        const sortedData = [...transactionData].sort((a, b) => {
            const aValue = a[key] ? String(a[key]) : ""; 
            const bValue = b[key] ? String(b[key]) : ""; 
    
            return aValue.localeCompare(bValue);
        });
    
        console.log(sortedData);
    };

    const documentRoutes: Record<string, string> = {
        "Barangay Clearance": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
        "Barangay Indigency": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
        "Barangay ID": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayID",
        "First Time Jobseeker": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/FirstTimeJobseeker",
        "Barangay Certificate": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
        "Barangay Permit": "/ResidentAccount/Transactions/DocumentRequest/Permit",
    };

    const barangayPermitRoutes: Record<string, string> = {
        "Business Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/Temporary-BusinessPermit(new&renewal)",
        "Temporary Business Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/Temporary-BusinessPermit(new&renewal)",
        "Construction Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/ConstructionPermit",
        "Liquor Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/LiquorPermit",
        "COOP": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/COOP",
    };
    
    const handleTransactionClick = (transaction: typeof transactionData[0]) => {
        if (transaction.Type === "Online Incident") {
            router.push("/ResidentAccount/Transactions/IncidentTransactions");
        } else if (transaction.Type === "Document Request") {
            const encodedDetails = encodeURIComponent(transaction.Details);
            const encodedPurpose = encodeURIComponent(transaction.Purpose);

            if (transaction.Details === "Barangay Permit") {
                const permitRoute = barangayPermitRoutes[transaction.Purpose] || "/ResidentAccount/Transactions/DocumentRequestTransactions/Permit/General";
                router.push(`${permitRoute}?details=${encodedDetails}&purpose=${encodedPurpose}`);
            } else {
                router.push(`${documentRoutes[transaction.Details] || "/ResidentAccount/Transactions/DocumentRequestTransactions"}?details=${encodedDetails}&purpose=${encodedPurpose}`);
            }
        }
    };

    return (
        <main className="main-container">
            

            <div className="Page">
                <p>TRANSACTIONS</p>
            </div>

            <div className="transactions-history">
                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("Date")}>Date</th>
                                <th onClick={() => handleSort("ReferenceId")}>Reference ID</th>
                                <th onClick={() => handleSort("Type")}>Type</th>
                                <th onClick={() => handleSort("Details")}>Details</th>
                                <th onClick={() => handleSort("Status")}>Status</th>
                            </tr>
                        </thead>
                       <tbody>
                             {transactionData.map((transaction, index) => (
                                <tr key={index} onClick={() => handleTransactionClick(transaction)}>
                                    <td> {transaction.Date}</td>
                                    <td>{transaction.ReferenceId}</td>
                                    <td>{transaction.Type}</td>
                                    <td>{transaction.Details}</td>
                                    <td>
                                        <span className={`status-badge ${transaction.Status.toLowerCase().replace(" ", "-")}`}>
                                            {transaction.Status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
