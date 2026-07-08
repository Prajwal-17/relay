import { Badge } from "@/components/ui/badge";
import { SectionCard } from "../shared/SectionCard";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { CustomerMock } from "../../_mock/types";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-muted/40 border-border/70 flex flex-col gap-1 rounded-lg border px-3 py-2">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

export function AboutTab({ customer }: { customer: CustomerMock }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Basic Info">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" value={customer.name} />
          <Field label="Contact" value={customer.contact} />
          <Field label="Type" value={customer.customerType} />
          <Field label="GSTIN" value={customer.gstin} />
          <Field label="Credit Limit" value={formatRupee(customer.creditLimit)} />
          <Field label="Opening Balance" value={formatRupee(customer.openingBalance)} />
        </dl>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Billing Address">
          <p className="text-foreground text-sm font-medium whitespace-pre-line">
            {customer.billingAddress || "No billing address on file."}
          </p>
        </SectionCard>
        <SectionCard title="Shipping Address">
          <p className="text-foreground text-sm font-medium whitespace-pre-line">
            {customer.shippingAddress || "Same as billing address."}
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Metadata">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Tags
            </p>
            {customer.tags && customer.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No tags.</p>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Created"
              value={customer.createdAt ? formatDateStrToISTDateTimeStr(customer.createdAt) : "—"}
            />
            <Field
              label="Last Updated"
              value={customer.updatedAt ? formatDateStrToISTDateTimeStr(customer.updatedAt) : "—"}
            />
          </dl>
        </div>
      </SectionCard>
    </div>
  );
}
