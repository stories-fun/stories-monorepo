// POST API for creating stories
// This can be used with Express.js, Next.js API routes, or similar frameworks

import { createClient }  from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/stories
 * Creates a new story submission
 */
async function createStory(req: any, res: any) {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST requests are accepted'
      });
    }

    // Extract data from request body
    const { title, content, price_tokens } = req.body;

    // Validate required fields
    if (!title || !content || price_tokens === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'title, content, and price_tokens are required',
        required_fields: ['title', 'content', 'price_tokens']
      });
    }

    // Validate data types and constraints
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid title',
        message: 'Title must be a non-empty string'
      });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid content',
        message: 'Content must be a non-empty string'
      });
    }

    if (typeof price_tokens !== 'number' || price_tokens < 0) {
      return res.status(400).json({
        error: 'Invalid price_tokens',
        message: 'price_tokens must be a non-negative number'
      });
    }

    // Get user ID from authentication
    // This assumes you have authentication middleware that sets req.user
    const author_id = req.user?.id;
    
    if (!author_id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('id', author_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The authenticated user does not exist'
      });
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        author_id,
        title: title.trim(),
        content: content.trim(),
        price_tokens,
        status: 'pending' // Default status for new submissions
      })
      .select()
      .single();

    if (storyError) {
      console.error('Database error creating story:', storyError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create story',
        details: storyError.message
      });
    }

    // Create corresponding story submission entry
    const { data: submission, error: submissionError } = await supabase
      .from('story_submissions')
      .insert({
        user_id: author_id,
        story_id: story.id,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Database error creating submission:', submissionError);
      // Note: In a production app, you might want to rollback the story creation
      // or handle this as a background process
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: {
        story: {
          id: story.id,
          title: story.title,
          content: story.content,
          price_tokens: story.price_tokens,
          status: story.status,
          created_at: story.created_at,
          author_id: story.author_id
        },
        submission: submission ? {
          submission_id: submission.submission_id,
          status: submission.status,
          submitted_at: submission.submitted_at
        } : null
      }
    });

  } catch (error) {
    console.error('Unexpected error in createStory:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
}

// Example usage with Express.js
/*
const express = require('express');
const app = express();

app.use(express.json());

// Add authentication middleware here
app.use('/api/stories', authenticateUser);

app.post('/api/stories', createStory);
*/

// Example usage with Next.js API routes
/*
// pages/api/stories.js or app/api/stories/route.js
export default async function handler(req, res) {
  return await createStory(req, res);
}
*/

module.exports = { createStory };

// Example request body:
/*
POST /api/stories
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "title": "My Amazing Story",
  "content": "This is the content of my story...",
  "price_tokens": 5.5
}
*/

// Example success response:
/*
{
  "success": true,
  "message": "Story created successfully",
  "data": {
    "story": {
      "id": 123,
      "title": "My Amazing Story",
      "content": "This is the content of my story...",
      "price_tokens": 5.5,
      "status": "pending",
      "created_at": "2025-06-27T10:30:00.000Z",
      "author_id": 456
    },
    "submission": {
      "submission_id": 789,
      "status": "pending",
      "submitted_at": "2025-06-27T10:30:00.000Z"
    }
  }
}
*/