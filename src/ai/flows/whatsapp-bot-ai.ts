'use server';
/**
 * @fileOverview AI Flow for parsing WhatsApp messages using Natural Language Understanding.
 * 
 * FINAL FEATURES:
 * 1. Bilingual Parsing (EN/HI): Detects language and extracts intent.
 * 2. Conversational Hinglish: Handles particles like "ka", "ki", "me".
 * 3. Compound Query Recognition: Extracts BOTH City and Category from single sentences.
 * 4. Strict Filler Scrubbing: Filters out non-search terms like "koi", "kon sa", "any".
 * 5. Context Aware: Uses current conversation state to refine extraction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WhatsappBotInputSchema = z.object({
  message: z.string().describe('The raw message text from the WhatsApp user.'),
  systemPrompt: z.string().optional().describe('Custom personality or instructions for the AI.'),
  availableCategories: z.array(z.string()).describe('List of valid job categories in the system.'),
  currentContext: z.string().optional().describe('Context about the current state of the conversation.'),
});

const WhatsappBotOutputSchema = z.object({
  intent: z.enum(['search', 'greeting', 'help', 'handover', 'about', 'unknown']).describe('The user\'s primary goal.'),
  detectedLanguage: z.enum(['en', 'hi']).describe('The language used by the user.'),
  extractedCity: z.string().nullable().describe('The city name if mentioned by the user.'),
  extractedCategory: z.string().nullable().describe('The job category if it matches or is similar to available categories.'),
  isRefiningSearch: z.boolean().describe('True if user is asking for specific jobs in a previously selected city.'),
  confidence: z.number().min(0).max(1).describe('How sure the AI is about this extraction.'),
  replySuggestion: z.string().optional().describe('A friendly AI-generated response for non-search queries.'),
});

export async function whatsappBotAi(input: z.infer<typeof WhatsappBotInputSchema>) {
  return whatsappBotAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'whatsappBotAiPrompt',
  input: { schema: WhatsappBotInputSchema },
  output: { schema: WhatsappBotOutputSchema },
  prompt: `You are a highly skilled Bilingual NLU assistant for Rojgar Matrix India.
Your goal is to parse conversational English and Hinglish messages to extract City and Job Category.

CRITICAL PARSING RULES:

1. LANGUAGE DETECTION:
   - Identify if the user is speaking in 'en' (English) or 'hi' (Hindi/Hinglish).

2. COMPOUND QUERIES (CITY + CATEGORY):
   - If a message contains both a city and a job type, extract BOTH.
   - PATTERN: "[City] me [Category] job" or "[Category] job in [City]".
   - Example: "Raipur me cctv ka job" -> City: 'Raipur', Category: 'cctv'.
   - Example: "Driver job in Bhilai" -> City: 'Bhilai', Category: 'Driver'.

3. CITY EXTRACTION & SWITCHING:
   - Handle particles: "X ka job", "X me job", "X ki naukri" -> X is the City.
   - If user says "aur Raipur me", "ab Bhilai ka dikhao" -> Extract NEW city and set Intent to 'search'.

4. STRICT FILLER SCRUBPING:
   - NEVER return filler phrases as extractedCategory.
   - HINDI FILLERS: "koi", "kuch", "hai", "kon sa", "koun sa", "kaun sa", "naukri", "job", "kaam", "dikhao", "batao", "bataiye", "chaiye", "aur", "ab".
   - ENGLISH FILLERS: "any", "some", "available", "show", "tell", "me", "what", "which", "kind", "of", "jobs", "vacancy", "need", "and", "then".

5. CATEGORY MAPPING:
   - Map to availableCategories if possible: {{{availableCategories}}}
   - If not in list but specific (e.g. "cctv", "security guard", "plumber"), extract as category string.

6. INTENT MAPPING:
   - 'search': Looking for jobs, switching cities, or refining by category.
   - 'greeting': Hi, Hello, Namaste.
   - 'help' / 'about': Instructions or Info.
   - 'handover': Requesting human agent.

Input:
- Message: "{{{message}}}"
- Context: {{{currentContext}}}

Provide response in JSON format.`,
});

const whatsappBotAiFlow = ai.defineFlow(
  {
    name: 'whatsappBotAiFlow',
    inputSchema: WhatsappBotInputSchema,
    outputSchema: WhatsappBotOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (error: any) {
        console.error("whatsappBotAi error:", error);
        attempts++;
        const errorMessage = error.message || '';
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') || 
                           errorMessage.includes('503') || 
                           errorMessage.includes('UNAVAILABLE');
        
        if (attempts >= maxAttempts || !isRetryable) {
          if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('AI service is busy. Please try again later.');
          }
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }
    throw new Error('AI service error.');
  }
);