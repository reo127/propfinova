# AI Property Search Assistant - Documentation

## Overview

An intelligent property search assistant powered by Google Gemini AI that helps sales agents find perfect property matches for customers based on natural language queries.

## Features

✅ **Natural Language Search** - Ask in plain English about customer requirements
✅ **Context-Aware Recommendations** - Understands lifestyle factors, family needs, work locations
✅ **Bangalore Expertise** - Deep knowledge of Bangalore localities and neighborhoods
✅ **Conversation History** - Maintains context for follow-up questions
✅ **Property Cards** - Visual display of recommended properties with key details
✅ **Easy LLM Switching** - Modular design to switch between AI providers
✅ **Responsive Design** - Works perfectly on mobile and desktop

---

## Setup Instructions

### 1. Environment Variables

The Google Gemini API key has already been added to your `.env.local` file:

```env
GOOGLE_GEMINI_API_KEY=AIzaSyBSf6xZ3L-56JQsqRk1tX_4TRFeUQFjLCU
```

**⚠️ Security Note:** Never commit `.env.local` to version control. The API key should remain private.

### 2. Install Dependencies

The required package `@google/generative-ai` has been installed automatically.

If you need to reinstall:
```bash
npm install @google/generative-ai
```

### 3. MongoDB Collection Structure

The AI works with your existing `Property` model. It expects these fields:

```javascript
{
  _id: ObjectId,
  title: String,              // Property name
  location: String,           // Location in Bangalore
  bhk: String,                // e.g., "3bhk", "4bhk"
  squareFootage: Number,      // Property size
  price: String,              // Price (can be string or number)
  type: String,               // apartments, villas, etc.
  mode: String,               // buy, rent, sell
  amenities: [String],        // List of amenities
  nearbyAmenities: [String],  // Nearby facilities
  nearbyLocations: [String],  // Nearby landmarks
  description: String,        // Property description
  developer: String,          // Developer name
  furnishingStatus: String,   // furnished, semi-furnished, unfurnished
  possession: String,         // Possession date
  gallery: [String],          // Property images
  status: String              // approved, pending, rejected
}
```

Only properties with `status: 'approved'` or `status: 'active'` are shown to the AI.

---

## Usage

### Option 1: Dedicated AI Assistant Page

Visit the pre-built page at:
```
http://localhost:3000/ai-assistant
```

This is a full-page chat interface ready to use.

### Option 2: Integrate into Existing Pages

Add the chat component to any page:

```jsx
'use client';

import PropertyAIChat from '@/components/PropertyAIChat';

export default function YourPage() {
  const handleScheduleVisit = (property) => {
    // Your custom logic here
    console.log('Schedule visit for:', property);
  };

  return (
    <div className="h-screen p-4">
      <PropertyAIChat onScheduleVisit={handleScheduleVisit} />
    </div>
  );
}
```

### Option 3: Modal/Popup Integration

```jsx
'use client';

import { useState } from 'react';
import PropertyAIChat from '@/components/PropertyAIChat';

export default function YourPage() {
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowAIChat(true)}>
        Open AI Assistant
      </button>

      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl h-[80vh] relative">
            <PropertyAIChat
              onScheduleVisit={(property) => {
                // Handle visit scheduling
              }}
            />
            <button
              onClick={() => setShowAIChat(false)}
              className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Component Props

### `PropertyAIChat`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onScheduleVisit` | `(property) => void` | No | Callback when user clicks "Schedule Site Visit" |
| `className` | `string` | No | Additional CSS classes for the container |

**Example:**
```jsx
<PropertyAIChat
  onScheduleVisit={(property) => {
    router.push(`/properties/${property._id}`);
  }}
  className="shadow-2xl"
/>
```

---

## Example Queries

The AI understands various types of queries:

### Basic Specification Queries
```
"Customer wants 4BHK near Whitefield under 5 Cr"
"Show me 3BHK apartments in Indiranagar"
"Properties under 2 Cr in HSR Layout"
```

### Lifestyle-Based Queries
```
"Family with 2 kids, husband works in Electronic City, need good schools, budget 3 Cr"
"Customer works from home, wants peaceful area with good amenities, 3BHK in 2.5 Cr"
"Young couple, both work in Whitefield, want modern apartment with gym"
```

### Location-Preference Queries
```
"Customer doesn't want traffic, peaceful area, 3BHK"
"Looking for properties near international schools"
"Premium apartments with good nightlife nearby"
```

### Follow-up Questions
```
User: "Customer wants 3BHK near Whitefield"
AI: [Shows 5 properties]
User: "Tell me more about the first property"
AI: [Provides detailed info about first property]
```

---

## Customization

### Switching to Different LLM (Claude, GPT, etc.)

The system is designed for easy LLM switching. Edit `src/app/api/ai/property-search/route.js`:

**Current (Gemini):**
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
```

**To Switch to OpenAI GPT:**
```javascript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In POST function, replace Gemini call with:
const result = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: fullPrompt }
  ]
});
const aiResponse = result.choices[0].message.content;
```

**To Switch to Anthropic Claude:**
```javascript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In POST function:
const result = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  messages: [
    { role: "user", content: fullPrompt }
  ],
  system: SYSTEM_PROMPT
});
const aiResponse = result.content[0].text;
```

### Adjusting Number of Properties Sent to AI

In `src/app/api/ai/property-search/route.js`, line 16:

```javascript
const AI_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  maxProperties: 150, // Change this number
};
```

### Modifying the System Prompt

Edit the `SYSTEM_PROMPT` variable in `src/app/api/ai/property-search/route.js` (lines 19-76).

This prompt teaches the AI about:
- Bangalore localities and characteristics
- How to match customer requirements
- Response format and style
- When to suggest alternatives

### Adding More Property Fields to AI Context

Edit the `formatPropertyForAI` function in `src/app/api/ai/property-search/route.js` (lines 78-100):

```javascript
function formatPropertyForAI(property) {
  // Add any new fields here
  return `
Property ID: ${property._id}
Name: ${property.title}
Location: ${property.location}
// ... existing fields ...
NEW_FIELD: ${property.newField}
---`;
}
```

---

## API Reference

### POST `/api/ai/property-search`

**Request Body:**
```json
{
  "message": "Customer wants 3BHK near Whitefield under 2 Cr",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "aiResponse": "Based on your requirements, here are the best matches...",
  "properties": [
    {
      "_id": "...",
      "title": "Premium Apartment",
      "location": "Whitefield",
      // ... full property object
    }
  ],
  "totalPropertiesSearched": 150
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### GET `/api/ai/property-search`

Returns API configuration info:
```json
{
  "success": true,
  "info": "AI Property Search API",
  "model": "gemini-2.0-flash-exp",
  "maxProperties": 150,
  "version": "1.0.0"
}
```

---

## Error Handling

The system handles various errors gracefully:

- **Missing API Key**: Shows "AI service not configured" message
- **MongoDB Connection Error**: Returns server error with retry suggestion
- **AI API Rate Limit**: Shows "service temporarily busy" message
- **No Properties Found**: Informs user and suggests checking back later
- **Invalid Input**: Validates message before processing

All errors are logged to console in development mode for debugging.

---

## Testing

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Visit AI Assistant Page**
   ```
   http://localhost:3000/ai-assistant
   ```

3. **Test Basic Query**
   - Type: "Customer wants 3BHK near Whitefield under 2 Cr"
   - Verify AI responds with property recommendations
   - Check that property cards display correctly

4. **Test Follow-up Questions**
   - Ask: "Tell me more about the first property"
   - Verify AI maintains context

5. **Test Edge Cases**
   - Very specific requirements
   - Budget constraints
   - Location preferences
   - Lifestyle factors

### API Testing with cURL

```bash
curl -X POST http://localhost:3000/api/ai/property-search \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Customer wants 3BHK near Whitefield under 2 Cr"
  }'
```

---

## Performance Optimization

### Current Optimizations

1. **Lean Queries**: Uses `.lean()` for faster MongoDB queries
2. **Limited Properties**: Only sends up to 150 properties to AI
3. **Conversation History Limit**: Only last 10 messages sent to AI
4. **Caching**: MongoDB connection is cached globally

### Future Optimizations

- Add Redis caching for frequently searched queries
- Implement property indexing for faster searches
- Add pagination for very large property lists
- Implement request debouncing on frontend

---

## Troubleshooting

### AI Returns No Results

**Problem**: AI says "no properties found" but database has properties

**Solution**: Check that properties have `status: 'approved'` or `status: 'active'`

```javascript
// In MongoDB, update properties:
db.properties.updateMany(
  { status: { $exists: false } },
  { $set: { status: 'approved' } }
)
```

### API Key Error

**Problem**: "AI service authentication failed"

**Solution**: Verify `.env.local` has correct API key and restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Chat UI Not Loading

**Problem**: Component shows blank or errors

**Solution**: Check browser console for errors. Ensure:
- Component is used in a `'use client'` page
- All required Lucide React icons are available

### Property Cards Show Placeholder Images

**Problem**: Property images not displaying

**Solution**: Ensure `gallery` field in MongoDB has valid image URLs

---

## Security Considerations

### API Key Security

- ✅ API key is in `.env.local` (not committed to Git)
- ✅ API calls are server-side only
- ✅ No API key exposed to client

### Input Validation

- User messages are validated before processing
- Conversation history is limited to prevent payload bloat
- MongoDB queries use Mongoose for injection protection

### Rate Limiting

Consider adding rate limiting for production:

```javascript
// In route.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 requests per IP
});
```

---

## Production Deployment

### Environment Variables Checklist

Ensure these are set in production:

```env
MONGODB_URI=your_production_mongodb_uri
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Monitoring

Monitor these metrics in production:
- AI API call success rate
- Average response time
- Error rates
- User engagement (messages per session)

---

## Future Enhancements

### Suggested Features

1. **Export Chat History** - Download conversation as PDF
2. **Property Comparison** - Compare multiple properties side-by-side
3. **Customer Profiles** - Save customer preferences for future searches
4. **Smart Filters** - Quick filter buttons based on common requirements
5. **Voice Input** - Speak queries instead of typing
6. **Multi-language Support** - Support for Kannada, Hindi, Tamil
7. **Property Shortlist** - Mark properties as favorites during chat
8. **Analytics Dashboard** - Track most searched criteria, popular areas

---

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console for errors
3. Check server logs for API errors
4. Test with simple queries first

---

## File Structure

```
/Users/rohanmalo/rohan/propfinova/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── property-search/
│   │   │           └── route.js          # AI API endpoint
│   │   └── ai-assistant/
│   │       └── page.jsx                  # Example usage page
│   ├── components/
│   │   └── PropertyAIChat.jsx            # Main chat component
│   ├── models/
│   │   └── Property.js                   # Property Mongoose model
│   └── lib/
│       └── mongodb.js                    # MongoDB connection
├── .env.local                            # Environment variables
└── AI_PROPERTY_SEARCH.md                 # This documentation
```

---

## Version History

**v1.0.0** (Current)
- Initial release
- Google Gemini integration
- Natural language property search
- Conversation history support
- Property card display
- Mobile responsive design

---

## License

This implementation is part of the PropFinova application.

---

**Happy Property Hunting! 🏡**
