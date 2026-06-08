/**
 * Certification Intelligence — expiry status + reminder scheduling.
 * Drives the expiry sweep job, renewal campaigns, and compliance cert status.
 */
export type CertStatus = "valid" | "expiring" | "expired" | "missing";
export interface CertExpiryInput {
    expiresAt: Date | null;
    now: Date;
    /** days before expiry to start flagging as "expiring" (default 90) */
    expiringWindowDays?: number;
}
export declare function certStatus(input: CertExpiryInput): CertStatus;
/** Standard reminder cadence (days before expiry). */
export declare const REMINDER_LEAD_DAYS: readonly [90, 60, 30, 7];
/**
 * Which reminders are due to send right now for a certificate, given which lead-day reminders
 * were already sent. Returns the lead-day buckets that should fire now.
 */
export declare function dueReminders(expiresAt: Date, now: Date, alreadySent?: number[]): number[];
/** CPD progress toward renewal. */
export declare function cpdProgress(earnedHours: number, requiredHours: number): {
    pct: number;
    remaining: number;
    met: boolean;
};
