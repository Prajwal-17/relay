interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-background flex items-center justify-between rounded-lg border px-3 py-2 text-xl font-medium shadow-sm hover:shadow-xl">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
