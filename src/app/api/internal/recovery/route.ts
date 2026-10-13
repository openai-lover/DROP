import { authorizedCron, cronSecretConfigured, recoverDaily, workerMode } from '@/server/request-recovery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer' };

export async function GET(request: Request) {
  if (!authorizedCron(request)) return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401, headers });
  if (!cronSecretConfigured() || workerMode() !== 'request') return Response.json({ error: { code: 'RECOVERY_DISABLED', message: 'Recovery is not configured.' } }, { status: 503, headers });
  try { return Response.json({ data: await recoverDaily() }, { headers }); }
  catch { return Response.json({ error: { code: 'RECOVERY_PENDING', message: 'Persistent recovery will be retried.' } }, { status: 503, headers }); }
}
