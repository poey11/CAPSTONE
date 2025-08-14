import DocumentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/component";
import OtherDocumentTransactions from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/OtherDocumentTransactions/component";
import IncidentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/IncidentTransactions/component";

export default function TransactionRouter({ searchParams }: any) {
  const { id, type } = searchParams;

  if (!id) return null;

  if (type === "ServiceRequest") {
    return <DocumentTransactionsDetails referenceId={id} />;
  }
  if (type === "IncidentReport") {
    return <IncidentTransactionsDetails referenceId={id} />;
  }
  return <OtherDocumentTransactions id={id} />;
}