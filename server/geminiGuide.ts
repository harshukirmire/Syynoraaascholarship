import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

interface GuideHistoryMessage {
  role: 'user' | 'model';
  text: string;
}

interface GuideRequestBody {
  message?: string;
  history?: GuideHistoryMessage[];
  scholarshipContext?: unknown;
  studentContext?: unknown;
}

function getFirebaseApiKey(): string | null {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return typeof parsed.apiKey === 'string' ? parsed.apiKey : null;
  } catch {
    return null;
  }
}

export async function verifyFirebaseBearerToken(authHeader: string | undefined): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken || idToken.length > 4096) {
    return null;
  }

  const firebaseApiKey = getFirebaseApiKey();
  if (!firebaseApiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) {
      return null;
    }

    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

export async function handleGuideRequest(
  authHeader: string | undefined,
  body: GuideRequestBody
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const verifiedUser = await verifyFirebaseBearerToken(authHeader);
  if (!verifiedUser) {
    return {
      status: 401,
      payload: { error: 'Authentication required to access Synora Guide AI.' },
    };
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) {
    return {
      status: 400,
      payload: { error: 'Please provide a question between 1 and 2000 characters.' },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      payload: {
        error: 'Synora Guide AI service is not configured yet. Please ensure GEMINI_API_KEY is set in server secrets.',
      },
    };
  }

  const safeHistory = Array.isArray(body.history)
    ? body.history
        .filter(
          (item): item is GuideHistoryMessage =>
            Boolean(item) &&
            (item.role === 'user' || item.role === 'model') &&
            typeof item.text === 'string' &&
            item.text.trim().length > 0
        )
        .slice(-10)
    : [];

  const contextLines: string[] = [];
  if (body.scholarshipContext) {
    contextLines.push(`Verified Scholarship Context (from SYNORA catalog):\n${JSON.stringify(body.scholarshipContext).slice(0, 12000)}`);
  }
  if (body.studentContext) {
    contextLines.push(`Authenticated Student Profile & Tracker Summary (UID: ${verifiedUser.uid}):\n${JSON.stringify(body.studentContext).slice(0, 6000)}`);
  }

  const systemInstruction = `You are Synora Guide AI, the academic scholarship guidance assistant inside SYNORA.

STRICT ACCURACY & ANTI-FABRICATION RULES:
1. NEVER fabricate, guess, or invent scholarship names, deadlines, exam requirements, minimum test scores, required documents, application steps, or official URLs.
2. Rely strictly on the Verified Scholarship Context and Student Context provided below.
3. If the user asks about a specific requirement, deadline, score, document, or URL that is NOT explicitly present in the provided verified context or is marked "Not verified" / "Depends on university/program", you MUST respond clearly with:
   "I don't have verified information for that requirement."
   and suggest checking the scholarship's official website if available in the context.
4. Clearly distinguish between:
   - Scholarship-specific examinations (e.g., MEXT written examination)
   - University admission examinations (e.g., GRE, GMAT, SAT)
   - Language proficiency tests (e.g., IELTS, TOEFL, HSK, JLPT, TOPIK)
   - Course-specific examinations (e.g., GATE, NEET)
   - No separate scholarship examination required
   Never label IELTS or another language test as a scholarship-specific examination.
5. Never guarantee scholarship eligibility; state clearly that eligibility depends on official review by the scholarship provider.
6. Keep responses clear, structured, concise, and helpful for students in India and worldwide.

${contextLines.join('\n\n')}`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents = [
      ...safeHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 2000) }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return {
        status: 502,
        payload: { error: 'Synora Guide AI returned an empty response. Please try again.' },
      };
    }

    return {
      status: 200,
      payload: { reply },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to reach Gemini AI service.';
    const lower = errMsg.toLowerCase();
    if (lower.includes('403') || lower.includes('permission') || lower.includes('api_key')) {
      return {
        status: 403,
        payload: { error: 'Gemini API key permission error. Please verify GEMINI_API_KEY in Settings > Secrets.' },
      };
    }
    if (lower.includes('429') || lower.includes('resource_exhausted')) {
      return {
        status: 429,
        payload: { error: 'AI request quota temporarily reached. Please wait a moment and try again.' },
      };
    }
    return {
      status: 500,
      payload: { error: 'Unable to generate guidance right now. Please try again shortly.' },
    };
  }
}
