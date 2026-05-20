import React from "react";
import { Link } from "react-router-dom";
import { Activity, Settings } from "lucide-react";

export const ADMIN_APP_VERSION = "1.0.0";

const STATUS_LABELS = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

/**
 * Slim premium admin shell footer — brand, version, quick links, status pill.
 * @param {"operational" | "degraded" | "down"} [status]
 */
export default function AdminFooter({ status = "operational" }) {
  const statusLabel = STATUS_LABELS[status] ?? STATUS_LABELS.operational;
  const year = new Date().getFullYear();

  return (
    <footer className="admin-footer shrink-0">
      <div className="admin-footer__inner">
        <div className="admin-footer__brand">
          <p className="admin-footer__copy">
            &copy; {year}{" "}
            <span className="admin-footer__brand-name">TwoWay Ceylon</span>. All rights reserved.
          </p>
        </div>

        <div className="admin-footer__meta">
          <span className="admin-footer__version" title="Admin panel version">
            v{ADMIN_APP_VERSION}
          </span>

          <nav className="admin-footer__links" aria-label="Admin footer">
            <Link to="/admin/health" className="admin-footer__link">
              <Activity className="admin-footer__link-icon" strokeWidth={2.2} aria-hidden />
              System Health
            </Link>
            <Link to="/admin/settings" className="admin-footer__link">
              <Settings className="admin-footer__link-icon" strokeWidth={2.2} aria-hidden />
              Settings
            </Link>
          </nav>

          <span
            className={`admin-footer__status admin-footer__status--${status}`}
            role="status"
            aria-live="polite"
          >
            <span className="admin-footer__status-dot" aria-hidden />
            {statusLabel}
          </span>
        </div>
      </div>
    </footer>
  );
}
