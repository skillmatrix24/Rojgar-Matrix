'use server';
/**
 * @fileOverview An AI-powered tool for job seekers to enhance their applications.
 *
 * - aiApplicationOptimization - A function that provides suggestions for improving resume summaries and drafting targeted cover letter content.
 * - AiApplicationOptimizationInput - The input type for the aiApplicationOptimization function.
 * - AiApplicationOptimizationOutput - The return type for the aiApplicationOptimization function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiApplicationOptimizationInputSchema = z.object({
  resumeSummary: z
    .string()
    .describe("The job seeker's current resume summary."),
  jobDescription: z.string().describe('The detailed description of the job posting.'),
  coverLetterDraft: z
    .string()
    .optional()
    .describe('An optional existing draft of a cover letter to refine.'),
});
export type AiApplicationOptimizationInput = z.infer<typeof AiApplicationOptimizationInputSchema>;

const AiApplicationOptimizationOutputSchema = z.object({
  improvedResumeSummary: z
    .string()
    .describe('Suggestions for improving the resume summary to better match the job description.'),
  targetedCoverLetter: z
    .string()
    .describe('A draft of a targeted cover letter, tailored to the job description.'),
});
export type AiApplicationOptimizationOutput = z.infer<typeof AiApplicationOptimizationOutputSchema>;

export async function aiApplicationOptimization(
  input: AiApplicationOptimizationInput
): Promise<AiApplicationOptimizationOutput> {
  return aiApplicationOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiApplicationOptimizationPrompt',
  input: { schema: AiApplicationOptimizationInputSchema },
  output: { schema: AiApplicationOptimizationOutputSchema },
  prompt: `You are an AI-powered application enhancement tool. Your goal is to help job seekers create more compelling and professional job applications.

Given the job seeker's current resume summary and the job description, provide suggestions to improve the resume summary to better align with the job requirements and keywords.

Additionally, draft a targeted cover letter based on the provided job description and the job seeker's resume summary.

If an optional 'coverLetterDraft' is provided, use it as a basis to refine and enhance the cover letter to be more targeted and professional, ensuring it addresses key aspects of the job description.

Job Seeker's Current Resume Summary: {{{resumeSummary}}}

Job Description: {{{jobDescription}}}

{{#if coverLetterDraft}}
Existing Cover Letter Draft: {{{coverLetterDraft}}}
{{/if}}

Provide the improved resume summary suggestions and the targeted cover letter draft in the specified JSON format.`,
});

const aiApplicationOptimizationFlow = ai.defineFlow(
  {
    name: 'aiApplicationOptimizationFlow',
    inputSchema: AiApplicationOptimizationInputSchema,
    outputSchema: AiApplicationOptimizationOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (error: any) {
        console.error("aiApplicationOptimization error:", error);
        attempts++;
        const errorMessage = error.message || '';
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') || 
                           errorMessage.includes('503') || 
                           errorMessage.includes('UNAVAILABLE');
        
        if (attempts >= maxAttempts || !isRetryable) {
          if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('AI service quota exceeded or credits depleted. Kripya thodi der baad try karein.');
          }
          throw new Error('AI service is currently busy. Please try again.');
        }
        
        // Wait with exponential backoff (1s, 2s) before retry
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }
    throw new Error('AI service error.');
  }
);