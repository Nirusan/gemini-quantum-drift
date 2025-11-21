import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return NextResponse.json(
      { error: 'API key or Channel ID missing' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API Error:', response.status, errorText);
      throw new Error(`YouTube API request failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    console.log('YouTube API Data:', JSON.stringify(data, null, 2)); // Debug log

    const subscriberCount = data.items?.[0]?.statistics?.subscriberCount

    if (!subscriberCount) {
      console.error('No items found for channel ID:', channelId);
      throw new Error('No subscriber count found - check Channel ID')
    }

    // Format number (e.g. "1200" -> "1.2k" or just return raw)
    // Let's return raw for frontend formatting or simple formatting here
    return NextResponse.json({ subscriberCount })
    
  } catch (error) {
    console.error('Error fetching YouTube stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

