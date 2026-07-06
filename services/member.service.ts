import { getStoredMemberPhoneToken, normalizePhoneToken, storeMemberPhoneToken } from "@/lib/member-session";
import type { BirthdayPreview } from "@/types/visit";
import type { AdminMemberRow, Member, MemberRegistrationInput } from "@/types/member";

const localMemberCacheKey = "roemah_roti_member_profile";

// ─── Register / update a member ──────────────────────────────────────────────
export async function registerMember(input: MemberRegistrationInput): Promise<Member> {
  const member = makeMemberFromRegistration(input);
  if (!member.phoneToken) {
    throw new Error("Please enter a WhatsApp number so we can remember your membership.");
  }

  storeMemberPhoneToken(member.rawPhone);
  cacheLocalMember(member);

  const response = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });

  if (!response.ok) {
    throw new Error("Registration could not be saved. Please try again.");
  }

  return member;
}

// ─── Get the currently logged-in member ──────────────────────────────────────
export async function getCurrentMember(): Promise<Member | null> {
  const token = getStoredMemberPhoneToken();
  if (!token) {
    return getCachedLocalMember();
  }

  return (await getMemberByPhoneToken(token)) ?? getCachedLocalMember();
}

// ─── Fetch a member by phone token ───────────────────────────────────────────
export async function getMemberByPhoneToken(phoneToken: string): Promise<Member | null> {
  const response = await fetch(`/api/members?phoneToken=${encodeURIComponent(phoneToken)}`);
  if (!response.ok) {
    return getCachedLocalMember();
  }

  const member = (await response.json()) as Member | null;
  if (member) {
    cacheLocalMember(member);
  }

  return member;
}

// ─── List all members for the admin panel ────────────────────────────────────
export async function listAdminMembers(): Promise<AdminMemberRow[]> {
  const response = await fetch("/api/members/list");
  if (!response.ok) {
    return [];
  }

  return response.json() as Promise<AdminMemberRow[]>;
}

// ─── List members with birthdays this week ───────────────────────────────────
export async function listBirthdaysThisWeek(): Promise<BirthdayPreview[]> {
  const response = await fetch("/api/members/birthdays");
  if (!response.ok) {
    return [];
  }

  return response.json() as Promise<BirthdayPreview[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMemberFromRegistration(input: MemberRegistrationInput): Member {
  const phoneToken = normalizePhoneToken(input.phone);
  const name = input.name.trim();
  const birthdayInput = input.birthday;

  return {
    id: phoneToken,
    name,
    firstName: name.split(" ")[0] || name,
    phoneToken,
    initials: getInitials(name),
    phone: maskPhone(input.phone),
    rawPhone: input.phone,
    birthday: formatBirthday(birthdayInput),
    birthdayInput,
    since: formatMemberSince(new Date()),
    referralCode: makeReferralCode(name),
    totalVisits: 0,
    rewardsEarned: 0,
    memberDurationLabel: "new",
    favorites: input.favorites,
    updatedAt: new Date().toISOString(),
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function makeReferralCode(name: string) {
  const firstName = name.split(" ")[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "INSIDER";
  return `${firstName}-INSIDER`;
}

function formatBirthday(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

function formatMemberSince(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function maskPhone(phone: string) {
  const digits = normalizePhoneToken(phone);
  if (digits.length < 4) {
    return phone;
  }

  const visible = digits.slice(-4);
  const prefix = phone.trim().startsWith("+") ? phone.trim().split(" ").slice(0, 2).join(" ") : `+${digits.slice(0, 2)}`;
  return `${prefix} .... ${visible}`;
}

function cacheLocalMember(member: Member) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localMemberCacheKey, JSON.stringify(member));
}

function getCachedLocalMember(): Member | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawMember = window.localStorage.getItem(localMemberCacheKey);
  if (!rawMember) {
    return null;
  }

  try {
    return JSON.parse(rawMember) as Member;
  } catch {
    return null;
  }
}
