import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upiQrProfileSchema } from "@shared/schemas/preferences.schema";
import type { PrintingConfig, UpiQrProfile } from "@shared/types";
import { Pencil, Plus, QrCode, ScanLine, Trash2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { UpiQrScanPreview } from "./UpiQrScanPreview";

type ProfileFields = Pick<UpiQrProfile, "label" | "upiId" | "payeeName">;
type ProfileField = keyof ProfileFields;
type FieldErrors = Partial<Record<ProfileField, string>>;

const EMPTY_FIELDS: ProfileFields = {
  label: "",
  upiId: "",
  payeeName: ""
};

export function UpiQrProfilesManager({
  printing,
  disabled,
  onUpdate
}: {
  printing: PrintingConfig;
  disabled: boolean;
  onUpdate: (partial: Partial<PrintingConfig>) => void;
}) {
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const scanReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const [editingProfile, setEditingProfile] = useState<UpiQrProfile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [fields, setFields] = useState<ProfileFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [profileToDelete, setProfileToDelete] = useState<UpiQrProfile | null>(null);
  const [profileToPreview, setProfileToPreview] = useState<UpiQrProfile | null>(null);

  const openEditor = (profile?: UpiQrProfile, returnFocus?: HTMLButtonElement) => {
    returnFocusRef.current = returnFocus ?? null;
    setEditingProfile(profile ?? null);
    setFields(
      profile
        ? { label: profile.label, upiId: profile.upiId, payeeName: profile.payeeName }
        : EMPTY_FIELDS
    );
    setErrors({});
    setIsEditorOpen(true);
  };

  const updateField = (field: ProfileField, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate: UpiQrProfile = {
      id: editingProfile?.id ?? crypto.randomUUID(),
      label: fields.label.trim(),
      upiId: fields.upiId.trim(),
      payeeName: fields.payeeName.trim()
    };
    const result = upiQrProfileSchema.safeParse(candidate);
    const nextErrors: FieldErrors = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "label" || field === "upiId" || field === "payeeName") {
          nextErrors[field] ??= issue.message;
        }
      });
    }

    const otherProfiles = printing.upiQrProfiles.filter(
      (profile) => profile.id !== editingProfile?.id
    );
    if (
      otherProfiles.some(
        (profile) => profile.label.toLocaleLowerCase() === candidate.label.toLocaleLowerCase()
      )
    ) {
      nextErrors.label = "Use a unique account name";
    }
    if (
      otherProfiles.some(
        (profile) => profile.upiId.toLocaleLowerCase() === candidate.upiId.toLocaleLowerCase()
      )
    ) {
      nextErrors.upiId = "This UPI ID is already saved";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const upiQrProfiles = editingProfile
      ? printing.upiQrProfiles.map((profile) =>
          profile.id === editingProfile.id ? candidate : profile
        )
      : [...printing.upiQrProfiles, candidate];
    onUpdate({
      upiQrProfiles,
      defaultUpiQrProfileId: printing.defaultUpiQrProfileId ?? candidate.id
    });
    setIsEditorOpen(false);
  };

  const deleteProfile = () => {
    if (!profileToDelete) return;
    const upiQrProfiles = printing.upiQrProfiles.filter(
      (profile) => profile.id !== profileToDelete.id
    );
    const defaultUpiQrProfileId =
      printing.defaultUpiQrProfileId === profileToDelete.id
        ? (upiQrProfiles[0]?.id ?? null)
        : printing.defaultUpiQrProfileId;

    onUpdate({
      upiQrProfiles,
      defaultUpiQrProfileId,
      ...(upiQrProfiles.length === 0
        ? { printUpiQrOnSales: false, printUpiQrOnEstimates: false }
        : {})
    });
    setProfileToDelete(null);
  };

  return (
    <>
      <div>
        <div className="flex min-h-12 items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="text-foreground block text-sm font-semibold">UPI accounts</span>
            <span className="text-muted-foreground block text-xs">
              {printing.upiQrProfiles.length}{" "}
              {printing.upiQrProfiles.length === 1 ? "account" : "accounts"}
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(event) => openEditor(undefined, event.currentTarget)}
          >
            <Plus />
            Add UPI account
          </Button>
        </div>

        <div className="border-border border-t">
          {printing.upiQrProfiles.length > 0 ? (
            <div className="bg-muted text-muted-foreground grid h-8 grid-cols-[minmax(0,1fr)_5.5rem_8rem_4rem] items-center gap-2 px-2 text-xs font-semibold">
              <span>UPI account</span>
              <span className="text-center">Default</span>
              <span>QR check</span>
              <span className="sr-only">Actions</span>
            </div>
          ) : null}
          <div
            className="divide-border max-h-80 divide-y overflow-y-auto"
            role="list"
            aria-label="Saved UPI accounts"
          >
            {printing.upiQrProfiles.length === 0 ? (
              <div className="text-muted-foreground flex min-h-20 items-center gap-3 px-2 py-3 text-sm">
                <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-(--radius-control)">
                  <QrCode className="size-4" aria-hidden="true" />
                </span>
                <span>No UPI accounts saved</span>
              </div>
            ) : (
              printing.upiQrProfiles.map((profile) => {
                const isDefault = profile.id === printing.defaultUpiQrProfileId;
                return (
                  <div
                    key={profile.id}
                    className="hover:bg-hover grid min-h-14 min-w-0 grid-cols-[minmax(0,1fr)_5.5rem_8rem_4rem] items-center gap-2 px-2 py-1.5"
                    data-testid={"upi-profile-" + profile.id}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)">
                        <QrCode className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="text-foreground block truncate text-sm font-semibold"
                          title={profile.label}
                        >
                          {profile.label}
                        </span>
                        <span
                          className="text-muted-foreground block truncate text-xs"
                          title={profile.upiId + " · " + profile.payeeName}
                        >
                          {profile.upiId} · {profile.payeeName}
                        </span>
                      </span>
                    </span>

                    <label
                      className="focus-within:ring-ring flex size-8 cursor-pointer items-center justify-center justify-self-center rounded-(--radius-control) focus-within:ring-2"
                      title={"Use " + profile.label + " as default account"}
                    >
                      <input
                        type="radio"
                        name="default-upi-profile"
                        value={profile.id}
                        checked={isDefault}
                        disabled={disabled}
                        aria-label={"Use " + profile.label + " as default account"}
                        onChange={() => onUpdate({ defaultUpiQrProfileId: profile.id })}
                        className="accent-primary size-4"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start px-2"
                      aria-label={"Test " + profile.label + " QR"}
                      disabled={disabled}
                      onClick={(event) => {
                        scanReturnFocusRef.current = event.currentTarget;
                        setProfileToPreview(profile);
                      }}
                    >
                      <ScanLine />
                      Test QR
                    </Button>

                    <span className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={"Edit " + profile.label}
                        title={"Edit " + profile.label}
                        disabled={disabled}
                        onClick={(event) => openEditor(profile, event.currentTarget)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={"Delete " + profile.label}
                        title={"Delete " + profile.label}
                        disabled={disabled}
                        onClick={() => setProfileToDelete(profile)}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(profileToPreview)}
        onOpenChange={(open) => {
          if (!open) setProfileToPreview(null);
        }}
      >
        <DialogContent
          className="sm:max-w-sm"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            scanReturnFocusRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Test UPI QR</DialogTitle>
            <DialogDescription
              className="truncate"
              title={
                profileToPreview
                  ? profileToPreview.label + " · " + profileToPreview.upiId
                  : undefined
              }
            >
              {profileToPreview?.label} · {profileToPreview?.upiId}
            </DialogDescription>
          </DialogHeader>
          {profileToPreview ? <UpiQrScanPreview profile={profileToPreview} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Edit UPI account" : "Add UPI account"}</DialogTitle>
            <DialogDescription>
              This name identifies the account in Settings and Billing.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveProfile}>
            {(
              [
                {
                  field: "label",
                  label: "Account name",
                  placeholder: "Main account",
                  autoFocus: true
                },
                {
                  field: "upiId",
                  label: "UPI ID",
                  placeholder: "shop@bank",
                  autoFocus: false
                },
                {
                  field: "payeeName",
                  label: "Payee name",
                  placeholder: "Your store name",
                  autoFocus: false
                }
              ] as const
            ).map(({ field, label, placeholder, autoFocus }) => {
              const errorId = "upi-profile-" + field + "-error";
              return (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={"upi-profile-" + field}>{label}</Label>
                  <Input
                    id={"upi-profile-" + field}
                    value={fields[field]}
                    placeholder={placeholder}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? errorId : undefined}
                    onChange={(event) => updateField(field, event.target.value)}
                  />
                  {errors[field] ? (
                    <p id={errorId} className="text-destructive text-xs" role="alert">
                      {errors[field]}
                    </p>
                  ) : null}
                </div>
              );
            })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled}>
                {editingProfile ? "Save changes" : "Add account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(profileToDelete)}
        onOpenChange={(open) => {
          if (!open) setProfileToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {profileToDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {profileToDelete?.id === printing.defaultUpiQrProfileId &&
              printing.upiQrProfiles.length > 1
                ? printing.upiQrProfiles.find((profile) => profile.id !== profileToDelete.id)
                    ?.label + " will become the default account."
                : printing.upiQrProfiles.length === 1
                  ? "UPI QR printing will be turned off until another account is added."
                  : "This account will no longer be available while billing."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteProfile}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
