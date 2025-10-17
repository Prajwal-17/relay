import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { Navigate, useParams } from "react-router-dom";
import Dashboard from "./Dashboard";

const DashboardPage = () => {
  const { type } = useParams<{ type: string }>();

  const validTypes: DashboardType[] = [DASHBOARD_TYPE.SALES, DASHBOARD_TYPE.ESTIMATES];

  if (!type || !validTypes.includes(type as DashboardType)) {
    return <Navigate to="/not-found" replace />;
  }

  return <Dashboard type={type as DashboardType} />;
};

export default DashboardPage;
