import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface TokenPayload {
  userId: string
  email: string
}

export const jwtUtils = {
  // Generate JWT token
  sign: (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
  },

  // Verify JWT token
  verify: (token: string): TokenPayload | null => {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
      return null
    }
  },
}
