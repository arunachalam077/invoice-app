import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { User as PrismaUser } from "@prisma/client"

export type User = PrismaUser

export const userStorage = {
  // Find user by email
  findByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
  },

  // Find user by ID
  findById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { id },
    })
  },

  // Create new user
  create: async (email: string, password: string, name: string, studio?: string): Promise<User> => {
    const hashedPassword = await bcrypt.hash(password, 10)
    return prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        studio,
        emailVerified: false,
      },
    })
  },

  // Update user
  update: async (id: string, updates: Partial<User>): Promise<User | null> => {
    try {
      return await prisma.user.update({
        where: { id },
        data: updates,
      })
    } catch (error) {
      return null
    }
  },

  // Verify password
  verifyPassword: async (user: User, password: string): Promise<boolean> => {
    return bcrypt.compare(password, user.password)
  },

  // Generate and store OTP
  generateOTP: async (user: User): Promise<string> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await userStorage.update(user.id, { otp, otpExpires })
    return otp
  },

  // Verify OTP
  verifyOTP: async (user: User, otp: string): Promise<boolean> => {
    if (!user.otp || !user.otpExpires) return false
    if (Date.now() > user.otpExpires.getTime()) return false
    if (user.otp !== otp) return false

    // Clear OTP after verification
    await userStorage.update(user.id, { otp: null, otpExpires: null, emailVerified: true })
    return true
  },
}
