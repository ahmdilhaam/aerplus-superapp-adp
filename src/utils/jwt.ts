// Decode JWT token without verification (for client-side use only)
export const decodeToken = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    // Decode payload
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

// Extract user info from decoded token
export const getUserFromToken = (token: string) => {
  const decoded = decodeToken(token)
  if (!decoded) return null

  return {
    id: decoded.sub || '',
    username: decoded.username || 'User',
    email: decoded.email || '',
    name: decoded.name || 'User',
    role: decoded.role || 'User',
  }
}
