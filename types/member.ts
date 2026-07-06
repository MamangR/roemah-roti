export type Member = {
  id: string;
  uid?: string;
  name: string;
  firstName: string;
  phoneToken: string;
  initials: string;
  phone: string;
  rawPhone: string;
  birthday: string;
  birthdayInput: string;
  since: string;
  referralCode: string;
  totalVisits: number;
  rewardsEarned: number;
  memberDurationLabel: string;
  favorites: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type MemberRegistrationInput = {
  name: string;
  phone: string;
  birthday: string;
  favorites: string[];
};

export type AdminMemberRow = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastVisit: string;
  rewardLabel: string;
  rewardStatus: "redeemed" | "pending" | "none";
};
