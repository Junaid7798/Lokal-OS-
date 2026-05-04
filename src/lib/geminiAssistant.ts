import { GoogleGenAI } from '@google/genai';

// Initialize AI if key is available.
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMessage = async (params: {
  purpose: string;
  tone: string;
  language: string;
  businessName: string;
  serviceName: string;
}) => {
  if (!ai) throw new Error('AI Assistant not configured. No API key found.');

  const prompt = `
        Act as a professional business message assistant for WhatsApp.
        Help rewrite/create a message based on the following:
        
        Purpose: ${params.purpose}
        Tone: ${params.tone}
        Language: ${params.language}
        Business Name: ${params.businessName}
        Service Name: ${params.serviceName}
        
        Constraints:
        - Professional and helpful.
        - Do not generate fake review requests.
        - Do not ask for only 5-star reviews.
        - Do not offer incentives for reviews (no discounts/freebies for reviews).
        - Do not create medical advice.
        - Do not pressure customers.
        - Keep it concise for WhatsApp.
        
        Return only the message text.
    `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || '';
};

export const generateSummary = async (data: Record<string, unknown>) => {
  if (!ai) throw new Error('AI Assistant not configured. No API key found.');

  const prompt = `
        Act as a business coach. Analyze these weekly business numbers and provide a brief, actionable summary:
        
        Numbers: ${JSON.stringify(data)}
        
        Constraints:
        - Plain English.
        - Structure: What went well, What needs attention, Suggested next actions.
        - Do not include personal customer data.
        - Keep it brief.
    `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || '';
};
