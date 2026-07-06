const memberPhoneTokenKey = "roemah_roti_member_phone_token";

export function normalizePhoneToken(phone: string) {
  return phone.replace(/\D/g, "");
}

export function getStoredMemberPhoneToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(memberPhoneTokenKey);
}

export function storeMemberPhoneToken(phone: string) {
  if (typeof window === "undefined") {
    return;
  }

  const token = normalizePhoneToken(phone);
  if (token) {
    window.localStorage.setItem(memberPhoneTokenKey, token);
  }
}

export function clearMemberPhoneToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(memberPhoneTokenKey);
}
