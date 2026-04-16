export type PendingApplication = {
  job: {
    title: string;
    company: string;
    email: string;
  };
  coverLetter: string;
};

type ApprovalDecision = "approved" | "rejected" | null;

export const approvalState: {
  pendingApplication: PendingApplication | null;
  isApproved: boolean;
  decision: ApprovalDecision;
} = {
  pendingApplication: null,
  isApproved: false,
  decision: null
};

export function setPendingApplication(application: PendingApplication): boolean {
  if (approvalState.pendingApplication || approvalState.decision !== null) {
    return false;
  }
  approvalState.pendingApplication = application;
  approvalState.isApproved = false;
  approvalState.decision = null;
  return true;
}

export function approvePendingApplication(): boolean {
  if (!approvalState.pendingApplication) {
    return false;
  }
  approvalState.isApproved = true;
  approvalState.decision = "approved";
  approvalState.pendingApplication = null;
  return true;
}

export function rejectPendingApplication(): boolean {
  if (!approvalState.pendingApplication) {
    return false;
  }
  approvalState.isApproved = false;
  approvalState.decision = "rejected";
  approvalState.pendingApplication = null;
  return true;
}

export function resetApprovalState(): void {
  approvalState.pendingApplication = null;
  approvalState.isApproved = false;
  approvalState.decision = null;
}
