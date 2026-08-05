export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
        L
      </div>

      <div>
        <h1 className="text-blue-500 font-bold text-xl">
          LifeBoost AI
        </h1>

        <p className="text-xs text-gray-400">
          Smart Finance
        </p>
      </div>
    </div>
  );
}
