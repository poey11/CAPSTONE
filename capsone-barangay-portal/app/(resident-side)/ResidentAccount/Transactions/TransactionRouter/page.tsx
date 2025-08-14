import DocumentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/page";
import OtherDocumentTransactions from "@/app/(resident-side)/ResidentAccount/Transactions/DocumentTransactions/OtherDocumentTransactions/page";
import IncidentTransactionsDetails from "@/app/(resident-side)/ResidentAccount/Transactions/IncidentTransactions/page";

export default function TransactionRouter({
  searchParams,
}: {
  searchParams: { id?: string; type?: string };
}) {
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