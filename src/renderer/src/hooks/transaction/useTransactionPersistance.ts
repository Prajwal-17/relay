import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import { buildTransactionPayload, normalizeOriginalLineItems } from "@/utils";
import { txnPayloadSchema } from "@shared/schemas/transaction.schema";
import {
  BILLSTATUS,
  type TransactionType,
  type UpdateEstimateResponse,
  type UpdateSaleResponse
} from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useTransactionPayload from "./useTransactionPayload";

export type MutationVariables = {
  type: TransactionType;
  id: string | null;
  payload: any;
};

const useTransactionPersistance = () => {
  const navigate = useNavigate();

  const transactionNo = useBillingStore((state) => state.transactionNo);
  const customerId = useBillingStore((state) => state.customerId);
  const billingType = useBillingStore((state) => state.billingType);
  const billingId = useBillingStore((state) => state.billingId);
  const billingDate = useBillingStore((state) => state.billingDate);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);

  const status = useBillingStore((state) => state.status);
  const setStatus = useBillingStore((state) => state.setStatus);
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const syncOriginals = useBillingStore((state) => state.syncOriginals);
  const updateInternalIds = useLineItemsStore((state) => state.updateInternalIds);
  const lineItems = useLineItemsStore((state) => state.lineItems);

  // print ref
  const receiptRef = useReceiptRefStore((state) => state.receiptRef);
  const handlePrint = useReactToPrint({ contentRef: receiptRef || undefined });

  // autosave payload
  const { isDirty, payload: debouncedPayload } = useTransactionPayload();

  const saveMutation = useMutation<
    { id: string } | UpdateSaleResponse | UpdateEstimateResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ type, id, payload }) => {
      if (id) {
        return apiClient.post<UpdateSaleResponse>(`/api/${type}s/${id}/edit`, payload);
      } else {
        return apiClient.post<{ id: string }>(`/api/${type}s/create`, payload);
      }
    },
    onMutate: () => setStatus(BILLSTATUS.SAVING),
    onSuccess: (response, variables) => {
      setStatus(BILLSTATUS.SAVED);

      if (!variables.id && response.id) {
        setBillingId(response.id);
        const newPath = `/billing/${variables.type}s/${response.id}/edit`;
        window.history.replaceState(window.history.state, "", `#${newPath}`);
      }

      // Sync original values to prevent infinite loop
      syncOriginals();

      // update internal ids (only present on update responses)
      if ("items" in response && response.items) {
        setBillingDate(new Date(response.createdAt!));
        updateInternalIds(response.items);
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
          type: debouncedPayload.billingType,
          id: debouncedPayload.id,
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
      createdAt: billingDate ? billingDate.toISOString() : new Date().toISOString()
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

      if (response) {
        toast.success("Saved Successfully");

        if (action === "save&print") {
          if (!receiptRef?.current) {
            toast.error("Nothing to print");
          } else {
            await handlePrint();
            navigate(`/dashboard/${billingType}s`);
          }
        } else if (action === "saveAsPDF") {
          if (!billingId) {
            toast.error("Bill is Not Saved");
            return;
          }
          const response = await window.shareApi.saveAsPDF(billingId, billingType);
          if (response.status === "success") {
            toast.success("Receipt successfully saved as a PDF.");
          } else {
            toast.error(response.error.message || "Failed to save PDF");
          }
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
        e.returnValue = ""; // Chrome requires returnValue to be set
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
