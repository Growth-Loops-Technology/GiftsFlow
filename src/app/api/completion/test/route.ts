import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const { message } = body;

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: message,
    });
    return Response.json({ message: result.text });
  } catch (err: any) {
    console.error('API ERROR:', err);
    if (err?.status === 429) {
      return new Response(
        JSON.stringify({ error: 'OpenAI quota exceeded' }),
        { status: 429 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}