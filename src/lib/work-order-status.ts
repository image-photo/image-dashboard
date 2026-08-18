export const proofStatusOptions = [
  "Not Required",
  "Preparing Proof",
  "Awaiting Client Approval",
  "Revisions Requested",
  "Approved",
] as const;

export const getProofStatusClass = (status: string | null) => {
  if (status === "Approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Awaiting Client Approval") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Preparing Proof" || status === "Revisions Requested") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
};
