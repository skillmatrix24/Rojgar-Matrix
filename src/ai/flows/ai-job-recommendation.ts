'use server';
/**
 * @fileOverview An AI agent that provides job recommendations and entrepreneurship advice to seekers.
 *
 * - aiJobRecommendation - A function that handles the AI-powered opportunity matching process.
 * - AiJobRecommendationInput - The input type for the aiJobRecommendation function.
 * - AiJobRecommendationOutput - The return type for the aiJobRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiJobRecommendationInputSchema = z.object({
  jobSeekerProfile: z.object({
    skills: z
      .array(z.string())
      .describe("A list of the job seeker's key skills."),
    experience: z
      .string()
      .nullable()
      .transform((val) => val ?? "")
      .describe('A detailed description of professional experience.'),
    previousApplications: z
      .array(z.string())
      .describe('Previous job titles applied for.'),
    preferredJobTitles: z
      .array(z.string())
      .describe('Preferred job titles.'),
    preferredLocations: z
      .array(z.string())
      .describe('Preferred locations.'),
    resumeSummary: z
      .string()
      .nullable()
      .transform((val) => val ?? "")
      .describe('Resume summary.'),
  }),
  availableJobs: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        company: z.string(),
        location: z.string(),
        description: z.string(),
      })
    ),
});
export type AiJobRecommendationInput = z.infer<typeof AiJobRecommendationInputSchema>;

const AiJobRecommendationOutputSchema = z.object({
  recommendedJobs: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        company: z.string(),
        location: z.string(),
        shortDescription: z.string(),
        relevanceScore: z.number().min(0).max(100).describe('Selection probability percentage.'),
        reasoning: z.string().describe('Detailed personalized advice in Hinglish explaining why this job matches or what skills are missing (Gap Analysis).'),
      })
    ),
  businessOpportunities: z
    .array(
      z.object({
        title: z.string().describe('Title of the business or self-employment idea.'),
        description: z.string().describe('Practical description in Hinglish.'),
        investmentLevel: z.enum(['Zero', 'Low', 'Medium']).describe('Estimated investment required.'),
        firstStep: z.string().describe('The very first actionable step to start this.'),
        potentialMonthlyIncome: z.string().describe('Estimated monthly earnings (e.g., 20k-40k).'),
      })
    ).describe('Practical business or freelancing ideas based on user skills.'),
});
export type AiJobRecommendationOutput = z.infer<typeof AiJobRecommendationOutputSchema>;

export async function aiJobRecommendation(
  input: AiJobRecommendationInput
): Promise<AiJobRecommendationOutput> {
  return aiJobRecommendationFlow(input);
}

const aiJobRecommendationPrompt = ai.definePrompt({
  name: 'aiJobRecommendationPrompt',
  input: {schema: AiJobRecommendationInputSchema},
  output: {schema: AiJobRecommendationOutputSchema},
  prompt: `You are an expert AI Opportunity Consultant for Rojgar Matrix India.
Your task is to analyze a user's profile and recommend BOTH high-matching jobs and practical business/entrepreneurship ideas.

ADVICE GUIDELINES:
1. JOB MATCHING: Recommend 3-5 best matching jobs. Provide a "Selection Probability" (0-100%) and reasoning in friendly Hinglish.
2. ENTREPRENEURSHIP: Suggest 2-3 practical business, freelancing, or self-employment ideas specifically tailored to their skills.
3. TONE: Be motivational and practical. Use Hinglish (e.g., "Aap apna service center khol sakte hain").
4. CONTEXT: Focus on their location ({{{jobSeekerProfile.preferredLocations}}}) and skills ({{{jobSeekerProfile.skills}}}).

User Profile:
- Skills: {{{jobSeekerProfile.skills}}}
- Experience: {{{jobSeekerProfile.experience}}}
- Summary: {{{jobSeekerProfile.resumeSummary}}}

Available Jobs to analyze:
{{#each availableJobs}}
--- Job ID: {{{this.id}}}
Title: {{{this.title}}}
Company: {{{this.company}}}
Location: {{{this.location}}}
Description: {{{this.description}}}
---
{{/each}}`,
});

const aiJobRecommendationFlow = ai.defineFlow(
  {
    name: 'aiJobRecommendationFlow',
    inputSchema: AiJobRecommendationInputSchema,
    outputSchema: AiJobRecommendationOutputSchema,
  },
  async input => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const {output} = await aiJobRecommendationPrompt(input);
        return output!;
      } catch (error: any) {
        console.error("aiJobRecommendation error:", error);
        attempts++;
        const errorMessage = error.message || '';
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') || 
                           errorMessage.includes('503') || 
                           errorMessage.includes('UNAVAILABLE');
        
        if (attempts >= maxAttempts || !isRetryable) {
          if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('AI service is currently busy or credits are depleted. Please try again after some time.');
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