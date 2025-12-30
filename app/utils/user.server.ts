import bcrypt from "bcryptjs";
import type { RegisterForm } from "./types.server";
import { prisma } from "./prisma.server";

export const createUser = async (user: RegisterForm) => {
  try {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        password: passwordHash,
        isActive: true,
        profile: {
          create: {
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
          },
        },
      },
    });
    return { id: newUser.id, email: user.email };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

export const getOtherUsers = async (userId: string) => {
  return await prisma.user.findMany({
    where: {
      id: { not: userId },
    },
    include: {
      profile: true,
    },
    orderBy: {
      profile: {
        firstName: "asc",
      },
    },
  });
};

export const getUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      profile: true,
      userBookPurchases: {
        include: {
          book: true,
        },
      },
      userExerciseAccess: {
        include: {
          exercise: true,
        },
      },
    },
  });
};

export const updateUser = async (userId: string, profile: Partial<any>) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile: {
        update: profile,
      },
    },
  });
};

export const deleteUser = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};
