import { Clock3, FileBarChart } from "lucide-react";

const ReportsPage = () => {
  return (
    <div className="bg-background flex h-full min-h-0 items-center justify-center p-3">
      <section className="border-border bg-card w-full max-w-lg rounded-(--radius-panel) border p-6 text-center">
        <span className="bg-brand-soft text-brand-foreground mx-auto flex size-11 items-center justify-center rounded-(--radius-control)">
          <FileBarChart className="size-5" />
        </span>
        <div className="text-brand-foreground mt-4 inline-flex items-center gap-1.5 text-xs font-semibold">
          <Clock3 className="size-3.5" />
          Coming soon
        </div>
        <h1 className="text-foreground mt-1.5 text-xl font-semibold">Reports are on the way</h1>
      </section>
    </div>
  );
};

export default ReportsPage;
