import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  console.log('🔥 ROUTE HIT');
  console.log('API KEY EXISTS:', !!process.env.OPENAI_API_KEY);

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Say hello!',
    });

    return Response.json({ message: result.text });
  } catch (err: any) {
  console.error('API ERROR:', err);

  if (err?.statusCode === 429) {
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
