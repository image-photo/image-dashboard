"use client";

type FeedbackModalProps = {
  title: string;
  message: string;
  onClose: () => void;
  tone?: "success" | "error";
};

export default function FeedbackModal({
  title,
  message,
  onClose,
  tone = "error",
}: FeedbackModalProps) {
  const buttonClass =
    tone === "success"
      ? "bg-green-700 hover:bg-green-800"
      : "bg-blue-700 hover:bg-blue-800";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>

        <p className="text-slate-600 mb-6">{message}</p>

        <button
          onClick={onClose}
          className={`${buttonClass} text-white px-4 py-3 rounded-xl font-semibold w-full`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
