import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent',
  })
}

// In-memory token store (persists while server is running)
let storedTokens: { access_token?: string | null; refresh_token?: string | null } | null = null

export function saveTokens(tokens: { access_token?: string | null; refresh_token?: string | null }) {
  storedTokens = tokens
}

export function getTokens() {
  return storedTokens
}

export function hasTokens() {
  return !!storedTokens?.access_token
}
