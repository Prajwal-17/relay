import { formatDateStr } from "@shared/utils";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { SalesType } from "src/shared/types";

const SalesDashboard = () => {
  const [sales, setSales] = useState<SalesType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSales() {
      try {
        const response = await window.salesApi.getAllSales();
        if (response.status === "success") {
          setSales(response.data);
        } else {
          toast.error("Could not retrieve sales");
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchSales();
  }, []);

  return (
    <>
      <div className="px-10 py-20">
        <div className="py-5 text-4xl font-bold">Sales</div>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Invoice No</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((row, idx) => (
                <tr key={idx} className="transition hover:bg-gray-50">
                  <td className="px-6 py-3">{formatDateStr(row.createdAt)}</td>
                  <td className="px-6 py-3">{row.invoiceNo}</td>
                  {row.grandTotal && <td className="px-6 py-3">₹ {row.grandTotal}</td>}
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => navigate(`/sales/edit/${row.id}`)}
                      className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SalesDashboard;
