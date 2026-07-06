export type Reward = {
  id: string;
  memberId?: string;
  title: string;
  type: string;
  description: string;
  location: string;
  value: string;
  expiresAtLabel: string;
  isAvailable: boolean;
  isOneTimeUse: boolean;
  redeemedAt?: string;
};

export type RewardRedemptionResult = {
  rewardId: string;
  memberId?: string;
  redeemedAt: string;
};
