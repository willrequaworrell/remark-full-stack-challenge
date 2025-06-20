// app/api/spotify/playlists/[id]/tracks/route.ts
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Accept params as Promise
) {
  const { id } = await params; // Await the params promise
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "100";
    
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${id}/tracks?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist tracks" },
      { status: 500 }
    );
  }
}
