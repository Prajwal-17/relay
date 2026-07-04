export const StatusIndicator = ({
  isDisabled,
  size = "default"
}: {
  isDisabled?: boolean;
  size?: "default" | "lg";
}) => {
  const isLarge = size === "lg";
  if (isDisabled) {
    return (
      <div className="flex items-center gap-2">
        <div className={`bg-warning rounded-full ${isLarge ? "h-2.5 w-2.5" : "h-2 w-2"}`} />
        <span className={`text-warning font-semibold ${isLarge ? "text-base" : "text-sm"}`}>
          Inactive
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div
        className={`bg-success animate-pulse rounded-full ${isLarge ? "h-2.5 w-2.5" : "h-2 w-2"}`}
      />
      <span className={`text-success font-semibold ${isLarge ? "text-base" : "text-sm"}`}>
        Active
      </span>
    </div>
  );
};
