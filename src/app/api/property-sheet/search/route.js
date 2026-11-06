import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PropertySheet from '@/models/PropertySheet';

// GET - Search and filter properties
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Build query object
    const query = {};

    // Text search (searches across builder, project, location, etc.)
    const searchText = searchParams.get('search');
    if (searchText) {
      query.$text = { $search: searchText };
    }

    // Builder filter
    const builder = searchParams.get('builder');
    if (builder) {
      query.builderName = new RegExp(builder, 'i');
    }

    // Project filter
    const project = searchParams.get('project');
    if (project) {
      query.projectName = new RegExp(project, 'i');
    }

    // Location filter
    const location = searchParams.get('location');
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    // Market filter
    const market = searchParams.get('market');
    if (market) {
      query.market = new RegExp(market, 'i');
    }

    // Configuration filter (BHK)
    const configuration = searchParams.get('configuration');
    if (configuration) {
      query.configuration = new RegExp(configuration, 'i');
    }

    // Price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      query.$or = [];

      if (minPrice && maxPrice) {
        // Properties where price range overlaps with search range
        query.$or.push({
          $and: [
            { priceMin: { $lte: parseFloat(maxPrice) } },
            { priceMax: { $gte: parseFloat(minPrice) } }
          ]
        });
      } else if (minPrice) {
        query.$or.push({ priceMax: { $gte: parseFloat(minPrice) } });
      } else if (maxPrice) {
        query.$or.push({ priceMin: { $lte: parseFloat(maxPrice) } });
      }
    }

    // Possession date filter
    const possessionDate = searchParams.get('possessionDate');
    if (possessionDate) {
      query.possessionDate = new RegExp(possessionDate, 'i');
    }

    // Launch date filter
    const launchDate = searchParams.get('launchDate');
    if (launchDate) {
      query.launchDate = new RegExp(launchDate, 'i');
    }

    // Property type filter (from project details)
    const propertyType = searchParams.get('propertyType');
    if (propertyType) {
      query.projectDetails = new RegExp(propertyType, 'i');
    }

    // Amenities filter
    const amenities = searchParams.get('amenities');
    if (amenities) {
      query.amenities = new RegExp(amenities, 'i');
    }

    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Execute query - fetch all results first for relevance sorting
    const [allProperties, total] = await Promise.all([
      PropertySheet.find(query).lean(),
      PropertySheet.countDocuments(query)
    ]);

    // Helper function to normalize strings for comparison
    const normalize = (str) => {
      return str ? str.trim().toLowerCase() : '';
    };

    // Debug logging
    if (project) {
      console.log('=== SEARCH DEBUG ===');
      console.log('Project filter:', project);
      console.log('Total properties found:', allProperties.length);
      console.log('First 3 property names:', allProperties.slice(0, 3).map(p => p.projectName));
    }

    // Sort by relevance - exact matches first
    const sortedProperties = allProperties.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Project name scoring (HIGHEST PRIORITY)
      if (project) {
        const projectSearch = normalize(project);
        const projectNameA = normalize(a.projectName);
        const projectNameB = normalize(b.projectName);

        // Exact match = 10000 points
        if (projectNameA === projectSearch) {
          scoreA += 10000;
        } else if (projectNameA.includes(projectSearch)) {
          scoreA += 100;
        }

        if (projectNameB === projectSearch) {
          scoreB += 10000;
        } else if (projectNameB.includes(projectSearch)) {
          scoreB += 100;
        }
      }

      // Builder name scoring
      if (builder) {
        const builderSearch = normalize(builder);
        const builderNameA = normalize(a.builderName);
        const builderNameB = normalize(b.builderName);

        if (builderNameA === builderSearch) {
          scoreA += 5000;
        } else if (builderNameA.includes(builderSearch)) {
          scoreA += 50;
        }

        if (builderNameB === builderSearch) {
          scoreB += 5000;
        } else if (builderNameB.includes(builderSearch)) {
          scoreB += 50;
        }
      }

      // Location scoring
      if (location) {
        const locationSearch = normalize(location);
        const locationA = normalize(a.location);
        const locationB = normalize(b.location);

        if (locationA === locationSearch) {
          scoreA += 4000;
        } else if (locationA.includes(locationSearch)) {
          scoreA += 40;
        }

        if (locationB === locationSearch) {
          scoreB += 4000;
        } else if (locationB.includes(locationSearch)) {
          scoreB += 40;
        }
      }

      // General search text scoring (if using quick search)
      if (searchText) {
        const searchTerms = normalize(searchText);
        const projectNameA = normalize(a.projectName);
        const projectNameB = normalize(b.projectName);
        const builderNameA = normalize(a.builderName);
        const builderNameB = normalize(b.builderName);

        // Exact project name match in search text
        if (projectNameA === searchTerms) {
          scoreA += 10000;
        } else if (projectNameA.includes(searchTerms)) {
          scoreA += 200;
        }

        if (projectNameB === searchTerms) {
          scoreB += 10000;
        } else if (projectNameB.includes(searchTerms)) {
          scoreB += 200;
        }

        // Builder name match in search text
        if (builderNameA === searchTerms) {
          scoreA += 5000;
        } else if (builderNameA.includes(searchTerms)) {
          scoreA += 100;
        }

        if (builderNameB === searchTerms) {
          scoreB += 5000;
        } else if (builderNameB.includes(searchTerms)) {
          scoreB += 100;
        }
      }

      // Sort by score descending (highest score first)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // If scores are equal, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Debug: Show sorted results
    if (project) {
      console.log('After sorting - Top 5 results:');
      sortedProperties.slice(0, 5).forEach((prop, idx) => {
        console.log(`${idx + 1}. ${prop.projectName} (Builder: ${prop.builderName})`);
      });
      console.log('===================');
    }

    // Apply pagination after sorting
    const paginatedProperties = sortedProperties.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedProperties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Property sheet search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// POST - Get unique filter values for dropdowns
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { field } = data;

    let values = [];

    if (field === 'builders') {
      values = await PropertySheet.distinct('builderName');
    } else if (field === 'projects') {
      values = await PropertySheet.distinct('projectName');
    } else if (field === 'locations') {
      values = await PropertySheet.distinct('location');
    } else if (field === 'markets') {
      values = await PropertySheet.distinct('market');
    } else if (field === 'configurations') {
      values = await PropertySheet.distinct('configuration');
    }

    // Filter out empty values and sort
    values = values.filter(v => v && v.trim()).sort();

    return NextResponse.json(
      {
        success: true,
        data: values
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get filter values error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
