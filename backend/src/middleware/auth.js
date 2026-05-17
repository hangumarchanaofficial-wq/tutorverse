import { supabaseAdmin } from "../lib/supabase.js";
import { HttpError } from "../utils/httpError.js";

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

// Dev-only synthetic identity used when ADMIN_ROLE_BYPASS=true.
const DEV_ADMIN_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@local",
  role: "admin",
};

function bypassEnabled() {
  return String(process.env.ADMIN_ROLE_BYPASS || "").toLowerCase() === "true";
}

export async function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req);

    // DEV-ONLY: when ADMIN_ROLE_BYPASS=true, treat unauthenticated callers as
    // a synthetic dev-admin so the admin UI works without sign-in. Real
    // bearer tokens still validate normally.
    if (!token) {
      if (bypassEnabled()) {
        req.user = { ...DEV_ADMIN_USER };
        return next();
      }
      throw new HttpError(401, "Missing access token");
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, "Invalid or expired token");

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req, _res, next) {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    // DEV-ONLY: skip role enforcement when ADMIN_ROLE_BYPASS=true. Disable
    // before going to production so admin endpoints stay locked to the
    // `profiles.role = 'admin'` rule.
    if (bypassEnabled()) {
      req.user.role = "admin";
      return next();
    }

    if (req.user.role !== undefined) {
      if (req.user.role !== "admin") throw new HttpError(403, "Admin access required");
      return next();
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw new HttpError(500, "Failed to fetch profile role", error.message);

    const role = data?.role || "customer";
    req.user.role = role;
    if (role !== "admin") throw new HttpError(403, "Admin access required");

    next();
  } catch (error) {
    next(error);
  }
}
