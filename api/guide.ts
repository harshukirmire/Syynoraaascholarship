import { handleGuideRequest } from '../server/geminiGuide.ts';

export default async function handler(req: { method?: string; headers?: { authorization?: string }; body?: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = await handleGuideRequest(
    req.headers?.authorization,
    (req.body as Record<string, unknown>) ?? {}
  );
  res.status(result.status).json(result.payload);
}
