# 🤖 Google Gemini API Integration Setup

## Quick Setup

1. **Get your Gemini API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key" or "Get API Key"
   - Copy your API key (it will be a long string)

2. **Add your API key to the `.env` file**
   - Open `server/.env`
   - Find the line: `GEMINI_API_KEY=your_gemini_api_key_here`
   - Replace `your_gemini_api_key_here` with your actual API key
   - Example: `GEMINI_API_KEY=AIzaSyAbc123xyz...`

3. **Restart the server**
   - Stop the server (Ctrl+C)
   - Start it again: `cd server && npm run dev`

## How to Get a Gemini API Key

### Step-by-Step Instructions:

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account (Gmail account works)

2. **Create API Key**
   - Click the "Create API Key" button
   - Select "Create API key in new project" (or choose an existing project)
   - Your API key will be generated and displayed

3. **Copy the Key**
   - Click "Copy" to copy the API key
   - **Important**: Copy the entire key - it's a long string starting with `AIzaSy`

4. **Paste into .env file**
   - Open `carbonflex/server/.env`
   - Replace `your_gemini_api_key_here` with your copied key
   - Make sure there are no spaces or quotes around the key

## How It Works

The AI integration uses Google's Gemini 1.5 Flash model to generate **personalized suggestions** for tenants based on:
- Their current Eco Score (CPI)
- Energy usage breakdown (HVAC, lighting, water, appliances)
- Unit characteristics (size, occupancy, building type)
- Current performance vs quota

## Features

- **Personalized Recommendations**: Each tenant gets unique suggestions tailored to their usage patterns
- **Impact Estimates**: Shows estimated CO₂e savings for each suggestion
- **Difficulty Levels**: Easy, Medium, or Hard
- **XP Rewards**: Earn XP for completing suggestions
- **Graceful Degradation**: If the API key is missing or invalid, the app continues to work without AI suggestions
- **Free Tier Available**: Gemini API has a generous free tier for development

## API Endpoint

- `GET /api/tenant/:id/ai-suggestions` - Get AI-generated suggestions for a tenant

## Troubleshooting

**No AI suggestions appearing?**
- Check that your API key is correctly set in `server/.env`
- Make sure the server was restarted after adding the key
- Check the server console for any error messages
- Verify your Google Cloud account has API access enabled

**API errors?**
- Ensure your Gemini API key is valid
- Check that you've enabled the Gemini API in Google Cloud Console
- The app will continue to work without AI suggestions if there's an error

**Rate Limits?**
- Gemini API has generous free tier limits
- If you hit rate limits, wait a few minutes and try again

