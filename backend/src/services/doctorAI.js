const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getAIResponse(userMessage) {
  const prompt = `You are a superspecialized doctor with knowledge across all medical fields. Answer the following user question in a clear, empathetic, and professional manner:\n\nUser: ${userMessage}\nDoctor:`;
  const response = await openai.createCompletion({
    model: 'gpt-4',
    prompt,
    max_tokens: 200,
    temperature: 0.7,
  });
  return response.data.choices[0].text.trim();
}

module.exports = { getAIResponse };