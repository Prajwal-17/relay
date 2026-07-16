import { Button } from "@/components/ui/button";
import { SectionCard } from "../shared/SectionCard";
import { EmptyTab } from "../shared/EmptyTab";
import { formatDateStr } from "@shared/utils/dateUtils";
import { Pin, Plus, StickyNote } from "lucide-react";
import { useState } from "react";
import { mockNotes } from "../../_mock/data";

export function NotesTab() {
  const [draft, setDraft] = useState("");
  const notes = mockNotes;

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
      <SectionCard title="Add Note">
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note about this customer…"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 shadow-xs min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
          />
          <div className="flex justify-end">
            <Button className="hover:bg-primary-hover h-9 cursor-pointer" disabled={!draft.trim()}>
              <Plus className="size-4" />
              Add Note
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Pinned / all notes */}
      {notes.length === 0 ? (
        <div className="bg-card border-border shadow-xs rounded-xl border">
          <EmptyTab
            icon={StickyNote}
            title="No notes yet"
            description="Notes you add will appear here. Pin important ones to keep them on top."
          />
        </div>
      ) : (
        <SectionCard title="Notes">
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="border-border/70 bg-background rounded-lg border px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground text-sm font-medium">{note.body}</p>
                  {note.pinned && (
                    <span className="bg-warning/15 text-warning border-warning/30 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
                      <Pin className="size-3" />
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1.5 text-xs font-medium">
                  {note.author} · {formatDateStr(note.date)}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
