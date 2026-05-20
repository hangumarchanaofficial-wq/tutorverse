import React, { useEffect, useState } from "react";

/** Default admin header portrait (Kristin Watson / dev bypass) */
export const DEFAULT_ADMIN_PROFILE_AVATAR =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=face&auto=format&q=85";

/** Curated Unsplash portraits — stable per sender via hash (matches Sellers list) */
export const PREMIUM_AVATAR_URLS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
];

/** Seller / shop threads — product-style crops (same CDN set as catalog mock images) */
export const INBOX_BRAND_AVATARS = {
  "Heritage Weaves":
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=256&h=256&fit=crop&auto=format&q=85",
  "Ceylon Naturals":
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=256&h=256&fit=crop&auto=format&q=85",
  "Southern Home & Craft":
    "https://images.unsplash.com/photo-1594040226829-7f251ab78f80?w=256&h=256&fit=crop&auto=format&q=85",
  "Anuradhapura Batik Studio":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=256&h=256&fit=crop&auto=format&q=85",
};

function paletteIndex(seed) {
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function dummyAvatarUrl(seed, name) {
  const i = paletteIndex(seed || name) % PREMIUM_AVATAR_URLS.length;
  return PREMIUM_AVATAR_URLS[i];
}

export function adminDisplayName(user) {
  return user?.displayName || user?.name || user?.email?.split("@")[0] || "Admin";
}

/** Portrait for signed-in admin or demo header */
export function adminProfileAvatarUrl(user) {
  if (user?.photoURL) return user.photoURL;
  if (user?.avatarUrl) return user.avatarUrl;
  if (!user) return DEFAULT_ADMIN_PROFILE_AVATAR;
  return dummyAvatarUrl(user.uid || user.id || user.email, adminDisplayName(user));
}

const ADMIN_AVATAR_SIZES = {
  sm: { box: "h-8 w-8", text: "text-[10px]" },
  md: { box: "h-9 w-9", text: "text-[11px]" },
  lg: { box: "h-10 w-10", text: "text-xs" },
};

/** Admin shell profile photo with initials fallback */
export function AdminProfileAvatar({ user, size = "md", className = "" }) {
  const name = adminDisplayName(user);
  const initial = (name[0] || "A").toUpperCase();
  const src = adminProfileAvatarUrl(user);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const { box, text } = ADMIN_AVATAR_SIZES[size] || ADMIN_AVATAR_SIZES.md;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-[#d0d5dd] shadow-[0_1px_3px_rgba(16,24,40,0.08)] ${box} ${className}`}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt=""
          className={`${box} object-cover`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`flex ${box} items-center justify-center bg-gradient-to-br from-[#2a3548] to-[#1a2332] font-bold text-[#e5e7eb] ${text}`}
          aria-hidden
        >
          {initial}
        </div>
      )}
    </div>
  );
}

/** Resolve portrait URL for an inbox row (explicit url → customer id → brand → hash) */
export function inboxAvatarUrl(message) {
  if (!message) return PREMIUM_AVATAR_URLS[0];
  if (message.avatarUrl) return message.avatarUrl;
  if (message.senderId) return dummyAvatarUrl(message.senderId, message.from);
  if (message.from && INBOX_BRAND_AVATARS[message.from]) return INBOX_BRAND_AVATARS[message.from];
  return dummyAvatarUrl(message.id, message.from);
}

/** Circular inbox portrait with initials fallback */
export function InboxAvatar({ message, size = "md", className = "" }) {
  const initials = message?.initials || "?";
  const src = inboxAvatarUrl(message);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const textClass = size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ring-1 ring-[#3d4a5f] ${sizeClass} ${className}`}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt=""
          className={`${sizeClass} object-cover`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`flex ${sizeClass} items-center justify-center bg-gradient-to-br from-[#2a3548] to-[#1a2332] font-bold text-[#e5e7eb] ${textClass}`}
          aria-hidden
        >
          {initials}
        </div>
      )}
    </div>
  );
}
