import type { Application } from "../types";

type Props = {
  application: Application | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

export function ApprovalModal({ application, onClose, onApprove, onReject }: Props) {
  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{application.title}</h3>
            <p className="text-sm text-slate-500">{application.company}</p>
            <p className="text-sm text-slate-500">{application.email}</p>
          </div>
          <button className="rounded bg-slate-100 px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap">
          {application.coverLetter}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => onApprove(application.id)}
          >
            Approve & Send
          </button>
          <button
            className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => onReject(application.id)}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
