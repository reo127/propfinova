import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

// Initialize Gemini AI
// This can be easily switched to other LLMs by changing this initialization
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Model configuration - easily switchable
const AI_CONFIG = {
  model: 'gemini-2.5-flash', // Latest stable model with excellent performance
  // Alternative: 'gemini-2.5-pro' for highest quality (but slower and uses more quota)
  // Alternative: 'gemini-2.0-flash-exp' for experimental features (limited quota)
  maxProperties: 150, // Limit properties sent to AI
};

/**
 * System prompt that teaches AI about Bangalore real estate and customer matching
 * Edit this prompt to customize AI behavior
 */
const SYSTEM_PROMPT = `You are an expert real estate assistant for PropFinova in Bangalore, India. Your role is to help sales agents find the perfect properties for their customers.

**Your Expertise:**
- Deep knowledge of Bangalore localities, neighborhoods, and their characteristics
- Understanding of lifestyle factors and family needs
- Ability to match nuanced customer requirements to properties
- Knowledge of Bangalore geography and IT hubs

**Key Bangalore Areas You Know:**
- Whitefield: IT hub, tech professionals, good schools, busy but well-connected
- Indiranagar: Premium, upscale, lifestyle-focused, restaurants and nightlife
- Koramangala: Young professionals, startups, vibrant social scene
- HSR Layout: Family-friendly, good schools, parks, peaceful
- Electronic City: IT professionals, affordable, schools nearby
- Sarjapur Road: Upcoming, good value, IT corridor
- Hebbal: North Bangalore, good connectivity, airport proximity
- Marathahalli: IT professionals, middle-class families, affordable
- Jayanagar: Traditional, established, mature trees, family-oriented
- JP Nagar: South Bangalore, family-friendly, good schools

**How You Should Respond:**
1. **Understand Nuanced Needs:**
   - "Has kids" → prioritize schools, parks, safe neighborhoods
   - "Works from home" → prioritize peaceful areas, good amenities
   - "Works in Electronic City" → suggest nearby areas or good connectivity
   - "Budget conscious" → focus on value, upcoming areas
   - "Premium lifestyle" → highlight upscale areas, luxury amenities

2. **Recommend 3-5 Best Matches:**
   - Explain WHY each property suits the customer
   - Consider location, lifestyle, budget, and family situation
   - Don't just match specs - think about the customer's life

3. **Be Honest About Trade-offs:**
   - If budget is tight, suggest slightly farther locations with better value
   - If no perfect match, explain the closest options and trade-offs

4. **Property Mentions:**
   - When mentioning a property, include its ID in format: [Property: ID_HERE]
   - Example: "I recommend the property [Property: 507f1f77bcf86cd799439011] because..."

5. **Always Encourage Site Visits:**
   - End recommendations with encouraging the customer to visit
   - Mention that our agents can arrange visits

6. **Format Your Response:**
   - Start with a brief understanding of their needs
   - List 3-5 properties with clear reasoning
   - Include key details: location, BHK, price, why it's perfect for them
   - End with encouragement for site visits

**Important:**
- Prices are in Indian Rupees (₹)
- Property types: apartments, independent-house, villas, gated-communities, plots, etc.
- BHK means Bedroom-Hall-Kitchen (1bhk, 2bhk, 3bhk, 4bhk, etc.)
- Always consider traffic and commute times in Bangalore
- Be conversational and helpful, not robotic

Now, I'll provide you with all available properties, and you'll help find the best matches for customer requirements.`;

/**
 * Format property data for AI context
 * This creates a rich text description of each property
 */
function formatPropertyForAI(property) {
  const priceFormatted = property.price || 'Price on request';
  const bhk = property.bhk || 'N/A';
  const sqft = property.squareFootage ? `${property.squareFootage} sqft` : 'N/A';
  const amenities = property.amenities?.join(', ') || 'None listed';
  const nearbyAmenities = property.nearbyAmenities?.join(', ') || 'None listed';
  const nearbyLocations = property.nearbyLocations?.join(', ') || 'None listed';
  const type = property.type || 'N/A';
  const mode = property.mode || 'buy';

  return `
Property ID: ${property._id}
Name: ${property.title}
Location: ${property.location}, Bangalore
Type: ${type} | ${bhk} | ${sqft}
Price: ₹${priceFormatted}
For: ${mode}
Amenities: ${amenities}
Nearby Amenities: ${nearbyAmenities}
Nearby Locations: ${nearbyLocations}
Developer: ${property.developer || 'N/A'}
Description: ${property.description}
Furnishing: ${property.furnishingStatus || 'N/A'}
Possession: ${property.possession || property.possessionDate || 'N/A'}
---`;
}

/**
 * Extract property IDs mentioned in AI response
 * Looks for pattern: [Property: ID]
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
 * Main POST handler for AI property search
 */
export async function POST(request) {
  try {
    // Parse request body
    const { message, conversationHistory = [] } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please provide a search query' },
        { status: 400 }
      );
    }

    // Validate Gemini API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { success: false, message: 'AI service is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Connect to database and fetch active properties
    await connectToDatabase();

    // Fetch approved properties only, limit to maxProperties
    const properties = await Property.find({
      status: { $in: ['approved', 'active'] }
    })
    .limit(AI_CONFIG.maxProperties)
    .lean(); // Use lean() for better performance

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        {
          success: true,
          aiResponse: "I'm sorry, but we don't have any active properties in our database at the moment. Please check back later or contact our office directly.",
          properties: []
        },
        { status: 200 }
      );
    }

    // Format all properties for AI context
    const propertiesContext = properties
      .map(formatPropertyForAI)
      .join('\n\n');

    // Build conversation context from history (last 5 messages)
    const recentHistory = conversationHistory.slice(-5);
    const historyContext = recentHistory
      .map(msg => `${msg.role === 'user' ? 'Customer Query' : 'Your Response'}: ${msg.content}`)
      .join('\n\n');

    // Construct the full prompt for AI
    const fullPrompt = `${SYSTEM_PROMPT}

**AVAILABLE PROPERTIES (${properties.length} total):**
${propertiesContext}

${historyContext ? `**CONVERSATION HISTORY:**\n${historyContext}\n` : ''}

**CURRENT CUSTOMER QUERY:**
${message}

**YOUR RESPONSE:**
Please analyze the customer's needs and recommend the best matching properties. Remember to:
1. Include property IDs in format [Property: ID] when mentioning them
2. Explain WHY each property suits their needs
3. Consider lifestyle factors, not just specifications
4. Be conversational and encouraging about site visits`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    // Extract property IDs mentioned in response
    const mentionedPropertyIds = extractPropertyIds(aiResponse);

    // Fetch full property objects for mentioned properties
    const mentionedProperties = properties.filter(p =>
      mentionedPropertyIds.includes(p._id.toString())
    );

    // Clean up AI response by removing the [Property: ID] markers for display
    // But keep them in the original response for reference
    const displayResponse = aiResponse.replace(/\[Property:\s*([a-f0-9]{24})\]/gi, '');

    return NextResponse.json(
      {
        success: true,
        aiResponse: displayResponse.trim(),
        properties: mentionedProperties,
        rawResponse: aiResponse, // Keep original for debugging
        totalPropertiesSearched: properties.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('AI Property Search Error:', error);

    // Handle specific API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { success: false, message: 'AI service authentication failed. Please contact administrator.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { success: false, message: 'AI service is temporarily busy. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns API configuration info
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    info: 'AI Property Search API',
    model: AI_CONFIG.model,
    maxProperties: AI_CONFIG.maxProperties,
    version: '1.0.0'
  });
}
