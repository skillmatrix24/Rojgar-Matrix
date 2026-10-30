'use server';
/**
 * @fileOverview AI Flow for analyzing job posting quality.
 *
 * - aiJobQualityCheck - Analyzes job details for spam, clarity, and salary realism.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const JobQualityInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  salaryAmount: z.number(),
  salaryType: z.enum(['lpa', 'monthly']),
  location: z.string(),
  companyName: z.string(),
});

const JobQualityOutputSchema = z.object({
  qualityScore: z.number().min(0).max(100).describe('Overall quality score from 0-100.'),
  isApproved: z.boolean().describe('Whether the job meets minimum quality standards.'),
  spamConfidence: z.number().min(0).max(1).describe('Probability that the listing is spam or a scam.'),
  suggestions: z.array(z.string()).describe('Actionable items to improve the listing.'),
  salaryAnalysis: z.string().describe('Short feedback on whether the salary is realistic for the role/location.'),
});

export async function aiJobQualityCheck(input: z.infer<typeof JobQualityInputSchema>) {
  return aiJobQualityCheckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiJobQualityCheckPrompt',
  input: { schema: JobQualityInputSchema },
  output: { schema: JobQualityOutputSchema },
  prompt: `You are an expert Job Marketplace Moderator for Rojgar Matrix.
Your task is to analyze the following job posting and provide a quality assessment.

Job Title: {{{title}}}
Company: {{{companyName}}}
Location: {{{location}}}
Salary: {{{salaryAmount}}} {{{salaryType}}}
Description: {{{description}}}

CRITERIA:
1. Spam Check: Is the title or description full of gibberish, too short, or containing suspicious links?
2. Professionalism: Is the description detailed and well-written?
3. Salary Realism: Based on Indian market standards, is the salary realistic for this role and location?
4. Completeness: Does it explain roles and requirements clearly?

Respond in the specified JSON format with a quality score, approval status, suggestions for improvement, and a brief salary analysis. Use Hinglish for the suggestions and analysis.`,
});

const aiJobQualityCheckFlow = ai.defineFlow(
  {
    name: 'aiJobQualityCheckFlow',
    inputSchema: JobQualityInputSchema,
    outputSchema: JobQualityOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (error: any) {
        console.error("aiJobQualityCheck error:", error);
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