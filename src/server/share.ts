import { publicCampaign } from './api';
import { formatUnits } from 'viem';

export async function campaignShare(slug: string) {
  const c = await publicCampaign(slug);
  const game = c.gameType === 'CATCH' ? 'Catch game' : '3-question quiz';
  const reward = c.rewardType === 'USDC' ? `${formatUnits(BigInt(c.rewardAmountAtomic), 6)} test USDC` : c.rewardType === 'COUPON_DEMO' ? 'Non-redeemable test coupon' : 'Organizer-supplied coupon';
  // Only these public fields enter share metadata. No quiz secrets or coupon contents.
  return { title: c.title, organizer: c.organizer, game, reward, count: c.maxRecipients, description: `${c.organizer} · ${game} · ${reward} × ${c.maxRecipients} · First server-verified qualifiers.` };
}
