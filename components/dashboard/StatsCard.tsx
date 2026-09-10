type StatsCardProps = {
  title: string;
  value: string;
  icon: string;
};

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  const isBalance = title.toLowerCase().includes("balance");
  const isExpense = title.toLowerCase().includes("gasto");
  const tone = isBalance && value.startsWith("-") ? "border-rose-500/20 from-rose-500/10 to-slate-900" : isExpense ? "border-rose-500/20 from-slate-900 to-rose-500/10" : "border-blue-500/20 from-blue-500/10 to-slate-900";
  return (
    <div className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 sm:p-6 ${tone}`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-blue-500/20" />
      <div className="relative flex min-h-[118px] flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-wide text-slate-300">{title}</p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-xl text-white">{icon}</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{value}</h2>
      </div>
    </div>
  );
}