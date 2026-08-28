import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { Navigate, useParams } from "react-router-dom";
import TransactionsScreen from "@/features/transactions/TransactionsScreen";

const TransactionsPage = () => {
  const { type } = useParams<{ type: string }>();

  const validTypes: DashboardType[] = [DASHBOARD_TYPE.SALES, DASHBOARD_TYPE.ESTIMATES];

  if (!type || !validTypes.includes(type as DashboardType)) {
    return <Navigate to="/not-found" />;
  }

  return <TransactionsScreen key={type} type={type as DashboardType} />;
};

export default TransactionsPage;
