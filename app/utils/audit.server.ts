import { prisma } from "~/utils/prisma.server";
import type { Prisma } from "@prisma/client";

export type AuditAction = "upload" | "download" | "purchase" | "login" | "logout" | "update" | "delete";
export type AuditResource = "exercise" | "book" | "training" | "video" | "user" | "question" | "answer";

interface AuditEventParams {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event for security tracking
 */
export async function logAuditEvent({
  userId,
  action,
  resource,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
}: AuditEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: metadata ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  action: string;
  resource: string;
  createdAt: Date;
}>> {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      createdAt: true,
    },
  });
}

/**
 * Extract client info from request for audit logging
 */
export function getClientInfo(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}
