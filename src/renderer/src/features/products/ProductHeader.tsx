import { Button } from "@/components/ui/button";
import { useProductsStore } from "@/store/productsStore";
import { Plus } from "lucide-react";

export default function ProductHeader() {
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Products</h1>
          <p className="text-muted-foreground text-lg">Manage product inventory and pricing</p>
        </div>
        <Button
          onClick={() => {
            setActionType("add");
            setOpenProductDialog();
          }}
          size="lg"
          className="bg-primary hover:bg-primary/90 h-12 gap-2 px-6 py-3 text-base font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Button>
      </div>
    </>
  );
}
