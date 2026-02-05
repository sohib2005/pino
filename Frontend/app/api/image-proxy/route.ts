import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ message: 'Missing url' }, { status: 400 });
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch image (${response.status})` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ message: 'Failed to fetch image' }, { status: 500 });
  }
}
