import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerStore } from "@/store/customersStore";
import type { FilteredGoogleContactsType } from "@shared/types";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const GoogleContactsImportDialog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<FilteredGoogleContactsType[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<FilteredGoogleContactsType[]>([]);

  const loading = useCustomerStore((state) => state.loading);
  const setLoading = useCustomerStore((state) => state.setLoading);
  const googleContacts = useCustomerStore((state) => state.googleContacts);
  const setOpenContactDialog = useCustomerStore((state) => state.setOpenContactDialog);

  // TODO: Replace mock with store data
  // const googleContacts: FilteredGoogleContactsType[] = [
  //   { id: 1, name: "John Smith", contact: "+91-9876543220" },
  //   { id: 2, name: "Sarah Johnson", contact: "+91-9876543221" },
  //   { id: 3, name: "Mike Wilson", contact: "+91-9876543222" },
  //   { id: 4, name: "Emily Davis", contact: "+91-9876543223" },
  //   { id: 5, name: "David Brown", contact: "+91-9876543224" },
  //   { id: 6, name: "Lisa Anderson", contact: "+91-9876543225" },
  //   { id: 7, name: "Robert Taylor", contact: "+91-9876543226" },
  //   { id: 8, name: "Jennifer Martinez", contact: "+91-9876543227" },
  //   { id: 9, name: "Christopher Lee", contact: "+91-9876543228" },
  //   { id: 10, name: "Amanda White", contact: "+91-9876543229" }
  // ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(googleContacts);
    } else {
      setSelectedContacts([]);
    }
  };

  useEffect(() => {
    setFilteredContacts(googleContacts);
  }, [googleContacts]);

  const handleImport = async () => {
    setLoading();
    try {
      const response = await window.customersApi.importContacts(selectedContacts);
      if (response.status === "success") {
        toast.success(response.data);
        setLoading();
        setSelectedContacts([]);
        setSearchTerm("");
        setOpenContactDialog();
      } else {
        toast.error(response.error.message);
        setSelectedContacts([]);
        setLoading();
        setSearchTerm("");
        setOpenContactDialog();
      }
    } catch (error) {
      console.error("Import failed", error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(googleContacts);
    } else {
      setFilteredContacts(
        googleContacts.filter((obj) => obj.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [searchTerm]);

  return (
    <>
      {loading ? (
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading....</DialogTitle>
          </DialogHeader>
        </DialogContent>
      ) : (
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from Google Contacts</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedContacts.length === filteredContacts.length &&
                    filteredContacts.length > 0
                  }
                  onCheckedChange={(val) => handleSelectAll(!!val)}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({selectedContacts.length} contacts)
                </Label>
              </div>
              <p className="text-muted-foreground text-sm">{selectedContacts.length} selected</p>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border">
              <div className="space-y-0">
                {filteredContacts.map((obj) => {
                  const isSelected = selectedContacts.some((c) => c.id === obj.id);
                  return (
                    <div
                      key={obj.id}
                      onClick={() =>
                        setSelectedContacts((prev) =>
                          prev.some((c) => c.id === obj.id)
                            ? prev.filter((c) => c.id !== obj.id)
                            : [...prev, obj]
                        )
                      }
                      className="hover:bg-accent flex cursor-pointer items-center space-x-3 border-b p-4 last:border-b-0"
                    >
                      <Checkbox
                        id={obj.id.toString()}
                        checked={isSelected}
                        onCheckedChange={() =>
                          setSelectedContacts((prev) =>
                            prev.some((c) => c.id === obj.id)
                              ? prev.filter((c) => c.id !== obj.id)
                              : [...prev, obj]
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{obj.name}</p>
                        <p className="text-muted-foreground text-sm">{obj.contact}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenContactDialog();
                  setSelectedContacts([]);
                  setSearchTerm("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={selectedContacts.length === 0 || loading}>
                {loading ? "Importing..." : `Import ${selectedContacts.length} Contacts`}
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </>
  );
};
