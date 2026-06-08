"use strict";
/**
 * Certification Intelligence — expiry status + reminder scheduling.
 * Drives the expiry sweep job, renewal campaigns, and compliance cert status.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMINDER_LEAD_DAYS = void 0;
exports.certStatus = certStatus;
exports.dueReminders = dueReminders;
exports.cpdProgress = cpdProgress;
function certStatus(input) {
    if (input.expiresAt == null)
        return "valid";
    const ms = input.expiresAt.getTime() - input.now.getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    const window = input.expiringWindowDays ?? 90;
    if (days < 0)
        return "expired";
    if (days <= window)
        return "expiring";
    return "valid";
}
/** Standard reminder cadence (days before expiry). */
exports.REMINDER_LEAD_DAYS = [90, 60, 30, 7];
/**
 * Which reminders are due to send right now for a certificate, given which lead-day reminders
 * were already sent. Returns the lead-day buckets that should fire now.
 */
function dueReminders(expiresAt, now, alreadySent = []) {
    const daysLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0)
        return []; // already expired -> escalation path, not reminders
    const sent = new Set(alreadySent);
    return exports.REMINDER_LEAD_DAYS.filter((lead) => daysLeft <= lead && !sent.has(lead));
}
/** CPD progress toward renewal. */
function cpdProgress(earnedHours, requiredHours) {
    const pct = requiredHours <= 0 ? 100 : Math.min(100, Math.round((earnedHours / requiredHours) * 100));
    return { pct, remaining: Math.max(0, requiredHours - earnedHours), met: earnedHours >= requiredHours };
}
