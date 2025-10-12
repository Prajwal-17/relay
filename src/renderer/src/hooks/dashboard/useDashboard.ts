import { useDashboardStore } from "@/store/dashboardStore";
import { SortOption, type SortType } from "@shared/types";
import { formatToPaisa } from "@shared/utils/utils";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export const useDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const sales = useDashboardStore((state) => state.sales);
  const setSales = useDashboardStore((state) => state.setSales);
  const estimates = useDashboardStore((state) => state.estimates);
  const setEstimates = useDashboardStore((state) => state.setEstimates);
  const sortBy = useDashboardStore((state) => state.sortBy);
  const setSortBy = useDashboardStore((state) => state.setSortBy);
  const dataToRender = pathname === "/sale" ? sales : estimates;

  useEffect(() => {
    let sortByValue = localStorage.getItem("sort-by");

    if (!sortByValue) {
      sortByValue = SortOption.DATE_NEWEST_FIRST;
      localStorage.setItem("sort-by", sortByValue);
    }

    setSortBy(sortByValue as SortType);
  }, [setSortBy]);

  const handleDeleteSale = useCallback(
    async (saleId: string) => {
      try {
        const response = await window.salesApi.deleteSale(saleId);
        if (response.status === "success") {
          toast.success("Successfully deleted sale");
          if (sales.length > 0) {
            setSales(sales.filter((sale) => sale.id !== saleId));
          }
        } else {
          toast.error(response.error.message);
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    },
    [sales, setSales]
  );

  const handleDeleteEstimate = useCallback(
    async (estimateId: string) => {
      try {
        const response = await window.estimatesApi.deleteEstimate(estimateId);
        if (response.status === "success") {
          toast.success("Successfully deleted estimate");
          if (estimates.length > 0) {
            setEstimates(estimates.filter((estimate) => estimate.id !== estimateId));
          }
        } else {
          toast.error(response.error.message);
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    },
    [estimates, setEstimates]
  );

  const handleSaleConvert = async (saleId: string) => {
    try {
      const response = await window.salesApi.convertSaletoEstimate(saleId);
      if (response.status === "success") {
        toast.success(response.data);
        if (sales.length > 0) {
          setSales(sales.filter((sale) => sale.id !== saleId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleEstimateConvert = async (estimateId: string) => {
    try {
      const response = await window.estimatesApi.convertEstimateToSale(estimateId);
      if (response.status === "success") {
        toast.success(response.data);
        if (estimates.length > 0) {
          setEstimates(estimates.filter((estimate) => estimate.id !== estimateId));
        }
      } else {
        toast.error(response.error.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const calculateSalesTotal =
    sales?.reduce((sum, curr) => {
      if (!curr.grandTotal) return sum;
      return sum + formatToPaisa(curr.grandTotal);
    }, 0) || 0;

  const calculateEstimatesTotal =
    estimates?.reduce((sum, curr) => {
      if (!curr.grandTotal) return sum;
      return sum + formatToPaisa(curr.grandTotal);
    }, 0) || 0;

  return {
    navigate,
    pathname,
    sales,
    estimates,
    sortBy,
    setSortBy,
    dataToRender,
    handleDeleteSale,
    handleDeleteEstimate,
    handleSaleConvert,
    handleEstimateConvert,
    calculateSalesTotal,
    calculateEstimatesTotal
  };
};
