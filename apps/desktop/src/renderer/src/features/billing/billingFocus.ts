import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";

export function focusFirstEmptyLineItem(tabId: string): void {
  window.requestAnimationFrame(() => {
    const session = useBillingSessionStore.getState().sessions[tabId];
    const emptyRow = (session?.lineItems ?? []).find(
      (item) => !item.isDeleted && item.productSnapshot.trim() === ""
    );
    if (!emptyRow) return;

    const searchStore = useSearchDropdownStore.getState();
    searchStore.setActiveRowId(emptyRow.rowId);
    searchStore.setItemQuery("");
    searchStore.setIsDropdownOpen(false);

    document
      .querySelector<HTMLInputElement>(`[data-billing-product-input="${emptyRow.rowId}"]`)
      ?.focus({ preventScroll: true });
  });
}
