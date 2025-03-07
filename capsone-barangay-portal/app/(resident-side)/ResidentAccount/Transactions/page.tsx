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
        { Date: "05-10-2024",ReferenceId: "2001", Type: "Document", Details: "Barangay Clearance", Status: "Resolved" },
        { Date: "05-10-2024",ReferenceId: "2002", Type: "Document", Details: "Cedula", Status: "Pending" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document", Details: "Indigency", Status: "Rejected" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document", Details: "Indigency", Status: "Rejected" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document", Details: "Indigency", Status: "Rejected" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document", Details: "Indigency", Status: "Rejected" },
        { Date: "05-10-2024",ReferenceId: "2003", Type: "Document", Details: "Indigency", Status: "Rejected" },
        
    ]);

    const handleSort = (key: keyof typeof transactionData[0]) => {
        const sortedData = [...transactionData].sort((a, b) => a[key].localeCompare(b[key]));
        console.log(sortedData);
    };

    const handleIncidentTransaction = () => {
        router.push("/ResidentAccount/Transactions/IncidentTransactions");
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
                                <th onClick={() => handleSort("Status")}>Status</th>
                            </tr>
                        </thead>
                       <tbody>
                             {transactionData.map((transaction, index) => (
                                <tr key={index} onClick={handleIncidentTransaction}>
                                    <td> {transaction.Date}</td>
                                    <td>{transaction.ReferenceId}</td>
                                    <td>{transaction.Type}</td>
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
