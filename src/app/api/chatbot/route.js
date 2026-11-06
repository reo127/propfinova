import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectToDatabase from '../../../lib/mongodb';
import Property from '../../../models/Property';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Configuration
const CHATBOT_CONFIG = {
  model: 'gemini-2.5-flash',
  maxProperties: 100, // Limit properties for chatbot context
  maxPropertiesInResponse: 5, // Max properties to return to user
};

/**
 * Chatbot System Prompt - Teaches AI about PropFinova chatbot behavior
 */
const CHATBOT_SYSTEM_PROMPT = `You are PropFinova's intelligent property assistant chatbot. Your role is to help users find properties and answer real estate questions in a friendly, conversational manner.

**Your Personality:**
- Friendly, helpful, and professional
- Conversational but not overly casual
- Patient and understanding
- Enthusiastic about helping users find their perfect property

**Your Capabilities:**
1. **Property Search**: Help users find properties based on their requirements
2. **General Assistance**: Answer questions about buying, renting, locations, pricing
3. **Guidance**: Provide advice on property selection and real estate process
4. **Information**: Share details about PropFinova services

**Key Bangalore Locations You Know:**
- Whitefield (IT hub, tech professionals)
- Indiranagar (Premium, upscale lifestyle)
- Koramangala (Young professionals, startups)
- HSR Layout (Family-friendly, good schools)
- Electronic City (IT professionals, affordable)
- Marathahalli (Middle-class families)
- Hebbal (Airport proximity)
- Sarjapur Road (IT corridor, good value)
- JP Nagar (Family-oriented, South Bangalore)
- Jayanagar (Traditional, established area)

**How to Respond:**

**For Property Search Queries:**
- Understand what the user wants (location, budget, BHK, etc.)
- Recommend 3-5 best matching properties
- For each property, explain WHY it's a good fit
- Include property ID like: [Property: PROPERTY_ID_HERE]
- Be enthusiastic but honest about the matches
- If no exact match, suggest alternatives

**For General Questions:**
- "How to buy/rent": Explain the process briefly and offer to find properties
- "About locations": Share knowledge about Bangalore areas
- "Pricing questions": Give general guidance and offer to show properties in their budget
- "Contact/Help": Provide contact info: info@propfinova.com, +91 (555) 123-4567
- "Greetings": Respond warmly and ask how you can help

**Response Format:**
- Keep responses concise (2-4 sentences for general queries)
- For property recommendations, be detailed but not overwhelming
- Always encourage next steps (viewing, more search, contact agent)
- End with a question or call-to-action

**Property Mention Format:**
When recommending a property, mention it like this:
"I recommend [Property: 507f1f77bcf86cd799439011] because it has excellent schools nearby and fits your budget perfectly."

**Important:**
- Prices are in Indian Rupees (₹)
- BHK = Bedroom-Hall-Kitchen (1bhk, 2bhk, 3bhk, etc.)
- Always be helpful even if you don't have perfect matches
- If query is unclear, ask clarifying questions
- Keep tone conversational and warm

Now, I'll provide you with available properties and user questions to respond to.`;

/**
 * Format property for AI context (simplified for chatbot)
 */
function formatPropertyForAI(property) {
  const price = property.price || 'Price on request';
  const bhk = property.bhk || property.type || 'Property';
  const sqft = property.squareFootage ? `${property.squareFootage} sqft` : '';
  const amenities = property.amenities?.slice(0, 5).join(', ') || 'Standard amenities';

  return `
Property ID: ${property._id}
Name: ${property.title}
Location: ${property.location}
Type: ${bhk} | ${sqft}
Price: ₹${price}
Mode: ${property.mode || 'buy'}
Amenities: ${amenities}
Description: ${property.description?.substring(0, 150)}...
---`;
}

/**
 * Extract property IDs from AI response
 */
function extractPropertyIds(aiResponse) {
  const regex = /\[Property:\s*([a-f0-9]{24})\]/gi;
  const matches = [];
  let match;

  while ((match = regex.exec(aiResponse)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

/**
 * Determine if query is property-related
 */
function isPropertyQuery(message) {
  const propertyKeywords = [
    'property', 'properties', 'house', 'flat', 'apartment', 'bhk',
    'rent', 'buy', 'sell', 'looking for', 'find', 'show', 'search',
    'available', 'budget', 'crore', 'lakh', 'price', 'bedroom',
    'location', 'area', 'near', 'whitefield', 'indiranagar', 'koramangala'
  ];

  const lowerMessage = message.toLowerCase();
  return propertyKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Main POST handler for chatbot
 */
export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate Gemini API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY is not configured');
      return NextResponse.json({
        response: "I'm having technical difficulties at the moment. Please contact our team directly at info@propfinova.com or call +91 (555) 123-4567.",
        type: 'error'
      });
    }

    // Check if it's a property search query
    const needsPropertyData = isPropertyQuery(message);

    let propertiesContext = '';
    let allProperties = [];

    if (needsPropertyData) {
      // Connect to database and fetch properties
      try {
        await connectToDatabase();

        allProperties = await Property.find({
          status: { $in: ['approved', 'active'] }
        })
        .limit(CHATBOT_CONFIG.maxProperties)
        .lean();

        if (allProperties.length > 0) {
          propertiesContext = `\n\n**AVAILABLE PROPERTIES (${allProperties.length} total):**\n` +
            allProperties.map(formatPropertyForAI).join('\n\n');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without property data - AI can still answer general questions
      }
    }

    // Build the prompt for AI
    const fullPrompt = `${CHATBOT_SYSTEM_PROMPT}${propertiesContext}

**USER MESSAGE:**
${message}

**YOUR RESPONSE:**
${needsPropertyData && allProperties.length === 0 ?
  '(Note: No properties are currently available in the database, but provide helpful guidance about what we typically offer)' :
  ''}
Respond in a friendly, conversational way. If recommending properties, include property IDs in [Property: ID] format.`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: CHATBOT_CONFIG.model });
    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    // Extract property IDs mentioned in response
    const mentionedPropertyIds = extractPropertyIds(aiResponse);

    // Get full property objects for mentioned properties
    const mentionedProperties = allProperties
      .filter(p => mentionedPropertyIds.includes(p._id.toString()))
      .slice(0, CHATBOT_CONFIG.maxPropertiesInResponse);

    // Clean up response by removing [Property: ID] markers for display
    const displayResponse = aiResponse.replace(/\[Property:\s*([a-f0-9]{24})\]/gi, '');

    // Determine response type
    let responseType = 'general';
    if (mentionedProperties.length > 0) {
      responseType = 'property_search';
    } else if (needsPropertyData && allProperties.length > 0) {
      responseType = 'property_info';
    }

    return NextResponse.json({
      response: displayResponse.trim(),
      properties: mentionedProperties,
      type: responseType,
      rawResponse: aiResponse // For debugging
    });

  } catch (error) {
    console.error('Chatbot API error:', error);

    // Handle specific API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        response: "I'm having authentication issues. Please contact our team at info@propfinova.com or call +91 (555) 123-4567 for immediate assistance.",
        type: 'error'
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json({
        response: "I'm currently busy helping other customers. Please try again in a moment, or contact us directly at info@propfinova.com.",
        type: 'error'
      });
    }

    return NextResponse.json({
      response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact our team at info@propfinova.com for immediate assistance.",
      type: 'error'
    });
  }
}

/**
 * GET handler - returns chatbot info
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    info: 'PropFinova Chatbot API',
    model: CHATBOT_CONFIG.model,
    version: '2.0.0',
    powered_by: 'Google Gemini AI'
  });
}
