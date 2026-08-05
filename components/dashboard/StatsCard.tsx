type StatsCardProps = {
  title: string;
  value: string;
  icon: string;
};

export default function StatsCard({
  title,
  value,
  icon,
}: StatsCardProps) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

      <div className="flex justify-between items-center">

        <p className="text-gray-400">
          {title}
        </p>

        <span className="text-2xl">
          {icon}
        </span>

      </div>

      <h2 className="text-3xl font-bold mt-6">
        {value}
      </h2>

    </div>
  );
}