# Remark Full Stack Challenge: AI Playlist Assistant

## Overview  
The AI Playlist Assistant is a full-stack web application enabling users to authenticate with Spotify, browse playlists, and receive AI-powered next-track recommendations based on BPM and harmonic mixing guidelines 

## Features  
- **Spotify Authentication** via NextAuth for secure user login   
- **Playlist Browsing** and track selection using the Spotify Web API   
- **Audio Playback Controls** implemented with the Spotify Web Playback SDK   
- **AI-Driven Recommendations** that analyze tempo (±5 BPM) and Camelot key adjacency for smooth transitions  
- **Conversational Interface** powered by OpenAI’s Chat API and custom tool integrations   

## Installation  
1. Clone the repository:
2. cd into the folder
3. Install dependencies:  
  `npm install`
4. Create a `.env.local` file with the following variables:  
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
```
5. Start the development server:  
`npm run dev`

## Usage  
1. Open your browser to `http://localhost:3000` after running the dev server [8].  
2. Click **Sign in with Spotify** and authorize the application [2].  
3. Select a playlist and use the playback controls to listen and receive next-track suggestions [5].  

## Tech Stack  
| Component          | Technology                                                          |
|--------------------|---------------------------------------------------------------------|
| Framework          | Next.js for server-side rendering and API routes                    |
| Styling            | Tailwind CSS for utility-first, responsive styling                  |
| Authentication     | NextAuth.js for Spotify OAuth                                       |
| Music Data & SDK   | Spotify Web API & Playback SDK                                      |
| AI & Chat          | Vercel AI SDK & OpenAI Chat API                                     |
| Icons              | React Icons for consistent iconography                              |


