type CardProps = {
  title: string;
  value: string;
};

export default function Card({ title, value }: CardProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-800">
      <p className="text-gray-400 text-sm">{title}</p>

      <h2 className="text-3xl font-bold text-white mt-3">
        {value}
      </h2>
    </div>
  );
}
