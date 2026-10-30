'use server';
/**
 * @fileOverview An AI Interview Coach for job seekers.
 *
 * - aiInterviewCoach - A function that handles the interview chat and feedback.
 * - AiInterviewInput - The input type for the coach.
 * - AiInterviewOutput - The return type for the coach.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiInterviewInputSchema = z.object({
  jobTitle: z.string().describe('The job role the user is interviewing for.'),
  userProfile: z.object({
    skills: z.array(z.string()),
    experience: z.string(),
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).describe('Previous messages in the chat.'),
  isFinishing: z.boolean().optional().describe('Set to true if the user wants feedback.'),
});

const AiInterviewOutputSchema = z.object({
  nextMessage: z.string().describe('The next question or response from the AI coach.'),
  isFinished: z.boolean().describe('Whether the interview session is complete.'),
  feedback: z.object({
    score: z.number().min(0).max(100).optional(),
    strengths: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    overallSummary: z.string().optional(),
  }).optional(),
});

export async function aiInterviewCoach(input: z.infer<typeof AiInterviewInputSchema>) {
  return aiInterviewCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewCoachPrompt',
  input: { schema: AiInterviewInputSchema },
  output: { schema: AiInterviewOutputSchema },
  prompt: `You are an expert HR Interviewer for Rojgar Matrix. Your goal is to help a candidate practice for their dream job.

Job Title: {{{jobTitle}}}
Candidate Skills: {{{userProfile.skills}}}
Candidate Experience: {{{userProfile.experience}}}

CONVERSATION GUIDELINES:
1. Speak in a mix of Hindi and English (Hinglish) to be more accessible.
2. Ask one professional and relevant question at a time.
3. If this is the start (empty history), introduce yourself briefly and ask the first question.
4. If isFinishing is true, do NOT ask a new question. Instead, analyze the history and provide structured feedback.

HISTORY:
{{#each history}}
- {{role}}: {{text}}
{{/each}}

{{#if isFinishing}}
Provide the feedback section and set isFinished to true.
{{else}}
Provide the nextMessage and set isFinished to false.
{{/if}}`,
});

const aiInterviewCoachFlow = ai.defineFlow(
  {
    name: 'aiInterviewCoachFlow',
    inputSchema: AiInterviewInputSchema,
    outputSchema: AiInterviewOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (error: any) {
        console.error("aiInterviewCoach error:", error);
        attempts++;
        const errorMessage = error.message || '';
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') || 
                           errorMessage.includes('503') || 
                           errorMessage.includes('UNAVAILABLE');
        
        if (attempts >= maxAttempts || !isRetryable) {
          if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('AI service is currently busy or credits are exhausted. Kripya thodi der baad try karein.');
          }
          throw error;
        }
        
        // Wait with exponential backoff (1s, 2s) before retry
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }
    throw new Error('AI service error.');
  }
);