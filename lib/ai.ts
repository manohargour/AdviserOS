/**
 * Central AI model configuration.
 *
 * The model slug is resolved through the AI Gateway. Keep it in one place and
 * allow an environment override so the model can be changed without edits.
 */
export const AI_MODEL = process.env.AI_MODEL?.trim() || 'anthropic/claude-sonnet-4'
