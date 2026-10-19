/**
 * Lightweight date formatting helpers without external dependencies
 */

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return String(dateString);
  }
}

export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return formatShortDate(dateString);
    }
    if (diffDay >= 1) {
      return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;
    }
    if (diffHour >= 1) {
      return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
    }
    if (diffMin >= 1) {
      return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
    }
    return "just now";
  } catch {
    return String(dateString);
  }
}
