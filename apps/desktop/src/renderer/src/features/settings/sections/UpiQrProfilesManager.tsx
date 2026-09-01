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
import { UpiAccountPicker } from "@/components/app-ui/UpiAccountPicker";
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
      nextErrors.label = "Use a different name";
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
        <div className="flex min-h-10 items-center justify-between gap-3 py-1.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="text-foreground block text-sm font-semibold">UPI accounts</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {printing.upiQrProfiles.length}{" "}
              {printing.upiQrProfiles.length === 1 ? "account" : "accounts"}
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Add UPI account"
            disabled={disabled}
            onClick={(event) => openEditor(undefined, event.currentTarget)}
          >
            <Plus />
            Add account
          </Button>
        </div>

        <div>
          {printing.upiQrProfiles.length > 0 ? (
            <div className="flex min-w-0 items-center gap-3 py-1.5">
              <span
                id="settings-default-upi-label"
                className="text-foreground shrink-0 text-xs font-medium"
              >
                Default account
              </span>
              <div className="min-w-0 flex-1">
                <UpiAccountPicker
                  id="settings-default-upi"
                  aria-labelledby="settings-default-upi-label"
                  profiles={printing.upiQrProfiles}
                  selectedProfileId={printing.defaultUpiQrProfileId}
                  defaultProfileId={printing.defaultUpiQrProfileId}
                  disabled={disabled}
                  compact
                  showListDetails={false}
                  onProfileChange={(profileId) => onUpdate({ defaultUpiQrProfileId: profileId })}
                />
              </div>
            </div>
          ) : null}
          <div
            className="max-h-80 overflow-y-auto py-1"
            role="list"
            aria-label="Saved UPI accounts"
          >
            {printing.upiQrProfiles.length === 0 ? (
              <div className="text-muted-foreground flex min-h-12 items-center gap-2 px-2 py-2 text-xs">
                <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-(--radius-control)">
                  <QrCode className="size-4" aria-hidden="true" />
                </span>
                <span>No UPI accounts saved</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                {printing.upiQrProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="hover:bg-hover grid min-h-11 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-(--radius-control) px-2 py-1"
                    data-testid={"upi-profile-" + profile.id}
                  >
                    <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-(--radius-control)">
                        <QrCode className="size-4" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                        <span
                          className="text-foreground max-w-[38%] min-w-0 shrink-0 truncate text-sm font-semibold"
                          title={profile.label}
                        >
                          {profile.label}
                        </span>
                        <span className="text-muted-foreground shrink-0" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className="text-muted-foreground min-w-0 truncate text-xs"
                          title={profile.upiId + " · " + profile.payeeName}
                        >
                          {profile.upiId} · {profile.payeeName}
                        </span>
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 justify-start gap-1.5 px-2 text-xs"
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
                ))}
              </div>
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
          className="min-w-0 sm:max-w-sm"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            scanReturnFocusRef.current?.focus();
          }}
        >
          <DialogHeader className="min-w-0 pr-6">
            <DialogTitle>Test UPI QR</DialogTitle>
            <DialogDescription
              className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]"
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
              Give this account a simple name, like Main counter. Payee name is shown in the payment
              app.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveProfile}>
            {(
              [
                {
                  field: "label",
                  label: "Name",
                  placeholder: "Main counter",
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
          <AlertDialogHeader className="min-w-0">
            <AlertDialogTitle className="[overflow-wrap:anywhere]">
              Delete {profileToDelete?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">
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
