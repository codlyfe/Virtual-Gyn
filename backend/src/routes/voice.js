import { serve } from 'std/server';
import axios from 'npm:axios';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { text } = await req.json();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Text required' }), { status: 400 });
  }

  try {
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID'); // Store your voice ID in env

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text },
      {
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    return new Response(response.data, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Voice synthesis error' }), { status: 500 });
  }
});

async function playVoice(text) {
  const res = await fetch('https://<your-project-ref>.functions.supabase.co/doctor-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}