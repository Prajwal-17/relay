interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-card flex items-center justify-between rounded-(--radius-control) border px-3 py-2 text-sm font-medium">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
