"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import DocumentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/page";
import OtherDocumentTransactions from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/OtherDocumentTransactions/page";
import IncidentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/IncidentTransactions/page";

export default function TransactionRouter() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) return null;

    if (type === "ServiceRequest") {
        return <DocumentTransactionsDetails referenceId={id} />;
    }
    if (type === "IncidentReport") {
        return <IncidentTransactionsDetails referenceId={id} />;
    }
    return <OtherDocumentTransactions id={id} />;




    return null; // This component redirects and does not render anything
}