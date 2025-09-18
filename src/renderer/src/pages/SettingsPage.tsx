import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchProducts } from "@/lib/apiAdapters";
import { useProductsStore } from "@/store/productsStore";
import { useEffect } from "react";

const SettingsPage = () => {
  const setSearchResult = useProductsStore((state) => state.setSearchResult);

  const { searchParam } = useInfiniteScroll({
    fetchFn: fetchProducts,
    stateUpdater: setSearchResult,
    delay: 300,
    pageSize: 20
  });

  useEffect(() => {
    console.log(searchParam);
  }, [searchParam]);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center text-3xl font-bold">
        Settings Page
      </div>
    </>
  );
};

export default SettingsPage;
