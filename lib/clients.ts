import { prisma } from "./prisma"
import type { Client } from "@prisma/client"

export const clientStorage = {
  // Get all clients for a user
  getAllByUserId: async (userId: string): Promise<Client[]> => {
    return prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  // Get client by ID
  getById: async (id: string): Promise<Client | null> => {
    return prisma.client.findUnique({
      where: { id },
      include: {
        bookings: true,
        invoices: true,
      },
    })
  },

  // Get client by email
  getByEmail: async (userId: string, email: string): Promise<Client | null> => {
    return prisma.client.findFirst({
      where: {
        userId,
        email,
      },
    })
  },

  // Create client
  create: async (userId: string, data: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Client> => {
    return prisma.client.create({
      data: {
        ...data,
        userId,
      },
    })
  },

  // Update client
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    return prisma.client.update({
      where: { id },
      data,
    })
  },

  // Delete client
  delete: async (id: string): Promise<Client> => {
    return prisma.client.delete({
      where: { id },
    })
  },

  // Search clients
  search: async (userId: string, query: string): Promise<Client[]> => {
    return prisma.client.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    })
  },
}
