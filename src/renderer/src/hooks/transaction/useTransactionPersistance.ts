import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import { buildTransactionPayload, normalizeOriginalLineItems } from "@/utils";
import { txnPayloadSchema } from "@shared/schemas/transaction.schema";
import { BILLSTATUS, TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useTransactionPayload from "./useTransactionPayload";

const saveTransactionApi = async ({
  id,
  type,
  payload
}: {
  id: string | null;
  type: TransactionType;
  payload: any;
}) => {
  const resource = type === TRANSACTION_TYPE.SALE ? "sales" : "estimates";
  const url = id
    ? `http://localhost:3000/api/${resource}/${id}/edit`
    : `http://localhost:3000/api/${resource}/create`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.status !== "success") {
    throw new Error(data.error?.message || "Failed to save");
  }
  return data;
};

const useTransactionPersistance = () => {
  const navigate = useNavigate();

  const transactionNo = useBillingStore((state) => state.transactionNo);
  const customerId = useBillingStore((state) => state.customerId);
  const billingType = useBillingStore((state) => state.billingType);
  const billingId = useBillingStore((state) => state.billingId);
  const billingDate = useBillingStore((state) => state.billingDate);

  const status = useBillingStore((state) => state.status);
  const setStatus = useBillingStore((state) => state.setStatus);
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const updateInternalIds = useLineItemsStore((state) => state.updateInternalIds);
  const lineItems = useLineItemsStore((state) => state.lineItems);

  // print ref
  const receiptRef = useReceiptRefStore((state) => state.receiptRef);
  const handlePrint = useReactToPrint({ contentRef: receiptRef || undefined });

  // autosave payload
  const { isDirty, payload: debouncedPayload } = useTransactionPayload();

  const saveMutation = useMutation({
    mutationFn: saveTransactionApi,
    onMutate: () => setStatus(BILLSTATUS.SAVING),
    onSuccess: (response, variables) => {
      setStatus(BILLSTATUS.SAVED);

      if (!variables.id && response.data?.id) {
        setBillingId(response.data.id);
        const newPath = `/billing/${variables.type}s/${response.data.id}/edit`;
        window.history.replaceState(window.history.state, "", `#${newPath}`);
      }

      // update internal ids
      if (response.data?.items) {
        updateInternalIds(response.data.items);
      }
    },
    onError: (error) => {
      setStatus(BILLSTATUS.UNSAVED);
      toast.error(error.message);
    }
  });

  // Autosave
  useEffect(() => {
    if (!isDirty) {
      if (status !== BILLSTATUS.SAVED && !saveMutation.isPending) {
        setStatus(BILLSTATUS.SAVED);
      }
      return;
    }
    if (saveMutation.isPending) return;

    setStatus(BILLSTATUS.UNSAVED);

    const handler = setTimeout(() => {
      if (debouncedPayload) {
        saveMutation.mutate({
          id: debouncedPayload.id,
          type: debouncedPayload.billingType,
          payload: debouncedPayload.payload
        });
      }
    }, 3000);

    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [isDirty, debouncedPayload, saveMutation.isPending, status]);

  // Manual Save Action
  const handleManualAction = async (action: "save" | "save&print" | "saveAsPDF") => {
    if (saveMutation.isPending) {
      toast("Saving in progress...", { icon: "⏳" });
      return;
    }

    const freshPayload = buildTransactionPayload({
      billingType,
      billingId,
      isAutoSave: false,
      transactionNo,
      customerId,
      items: normalizeOriginalLineItems(lineItems),
      createdAt: billingDate ? billingDate.toISOString() : new Date(billingDate).toISOString()
    });

    if (!freshPayload) {
      toast.error("Cannot save: Missing Transaction No or Customer");
      return;
    }

    const parseResult = txnPayloadSchema.safeParse(freshPayload.payload);
    if (!parseResult.success) {
      toast.error(parseResult.error.issues[0].message);
      return;
    }

    try {
      const response = await saveMutation.mutateAsync({
        id: freshPayload.id,
        type: freshPayload.billingType,
        payload: freshPayload.payload
      });

      if (response.status === "success") {
        toast.success("Saved Successfully");

        if (action === "save&print") {
          if (!receiptRef?.current) {
            toast.error("Nothing to print");
          } else {
            await handlePrint();
          }
        } else if (action === "saveAsPDF") {
          // save a PDF
        } else if (action === "save") {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Manual save interrupted", error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveMutation.isPending || isDirty) {
        e.preventDefault();
        toast.error("Bill is not Saved. Do not Refresh");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveMutation.isPending, isDirty]);

  return {
    status,
    isSaving: saveMutation.isPending,
    handleManualAction
  };
};

export default useTransactionPersistance;
