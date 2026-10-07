import { tournamentSettlementService } from '../services/tournamentSettlementService.js';

let cronTimer: NodeJS.Timeout | null = null;

export function startTournamentSettlementCron(intervalMs: number = 60000) {
  if (cronTimer) return;

  console.log('⏰ [Cron] Tournament settlement scheduler started (interval: 60s)');

  cronTimer = setInterval(async () => {
    try {
      const result = await tournamentSettlementService.executeScheduledSettlement();
      if (result.settledTournaments.length > 0) {
        console.log(`🏆 [Cron] Finalized tournaments: ${result.settledTournaments.join(', ')} | Payouts: ${result.disbursementsCount}`);
      }
    } catch (err) {
      console.error('❌ [Cron Error] Tournament settlement failed:', err);
    }
  }, intervalMs);
}

export function stopTournamentSettlementCron() {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
    console.log('🛑 [Cron] Tournament settlement scheduler stopped');
  }
}
