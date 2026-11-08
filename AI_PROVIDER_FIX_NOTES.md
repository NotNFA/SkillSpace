SkillSpace AI provider compatibility update
============================================

- Groq's default model is now openai/gpt-oss-120b.
- If GROQ_MODEL is still set to the previous llama-3.3-70b-versatile value, the application automatically substitutes openai/gpt-oss-120b and logs a non-secret warning.
- OpenAI-compatible responses accept either a text string or structured text content parts.
- OpenRouter requests ask reasoning-capable models to exclude reasoning from the user-facing output, and empty responses include finish_reason diagnostics.
- Provider calls request a bounded output budget and Groq GPT-OSS uses low reasoning effort with hidden reasoning.

No API credentials are included. Existing .env files are not changed by this ZIP update. Update GROQ_MODEL locally to openai/gpt-oss-120b for clarity. Gemini remains the primary provider and still depends on Google's availability/quota.
