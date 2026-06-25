import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { roles, sessions, userRoles, users } from "../db/schema.js";
import { createId } from "../utils/id.js";
import { logAudit } from "./audit.js";

export type RoleName = "admin" | "engineer" | "reviewer" | "release_manager" | "viewer";

export type Permission =
  | "prompt:write"
  | "dataset:write"
  | "evaluation:run"
  | "security:run"
  | "review:submit"
  | "review:decide"
  | "release:write"
  | "settings:write"
  | "user:manage"
  | "audit:read";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  roles: RoleName[];
}

const DEFAULT_ROLES: Array<{ name: RoleName; description: string }> = [
  { name: "admin", description: "Full system administrator" },
  { name: "engineer", description: "Create prompts, datasets, evaluations, and review requests" },
  { name: "reviewer", description: "Approve or reject review requests" },
  { name: "release_manager", description: "Run gray releases and rollbacks" },
  { name: "viewer", description: "Read-only user" },
];

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: [
    "prompt:write",
    "dataset:write",
    "evaluation:run",
    "security:run",
    "review:submit",
    "review:decide",
    "release:write",
    "settings:write",
    "user:manage",
    "audit:read",
  ],
  engineer: ["prompt:write", "dataset:write", "evaluation:run", "security:run", "review:submit"],
  reviewer: ["review:decide", "audit:read"],
  release_manager: ["release:write", "audit:read"],
  viewer: ["audit:read"],
};

const DEFAULT_ADMIN_USERNAME = process.env.PROMPTGUARD_ADMIN_USER ?? "admin";
const DEFAULT_ADMIN_PASSWORD = process.env.PROMPTGUARD_ADMIN_PASSWORD ?? "promptguard123";
const SESSION_DAYS = 7;
const MAX_FAILED_LOGINS = 5;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterations, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date.toISOString();
}

export async function ensureAuthBootstrap() {
  const db = getDb();

  for (const role of DEFAULT_ROLES) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, role.name));
    if (!existing) {
      await db.insert(roles).values({
        id: createId("role"),
        name: role.name,
        description: role.description,
      });
    }
  }

  const [admin] = await db.select().from(users).where(eq(users.username, DEFAULT_ADMIN_USERNAME));
  if (!admin) {
    const user = await createUser({
      username: DEFAULT_ADMIN_USERNAME,
      password: DEFAULT_ADMIN_PASSWORD,
      displayName: "Administrator",
      roles: ["admin"],
      actor: "system",
    });
    await logAudit({
      action: "auth_bootstrap",
      entityType: "user",
      entityId: user.id,
      actor: "system",
      detail: `Created default admin user "${DEFAULT_ADMIN_USERNAME}"`,
    });
  }
}

export async function createUser(input: {
  username: string;
  password: string;
  displayName?: string;
  roles?: RoleName[];
  actor?: string;
}) {
  const normalized = input.username.trim().toLowerCase();
  if (!normalized) throw new Error("Username is required");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters");

  await ensureRolesExist(input.roles ?? ["viewer"]);

  const db = getDb();
  const id = createId("user");
  await db.insert(users).values({
    id,
    username: normalized,
    passwordHash: hashPassword(input.password),
    displayName: input.displayName?.trim() || normalized,
  });

  await assignRoles(id, input.roles ?? ["viewer"]);
  await logAudit({
    action: "user_create",
    entityType: "user",
    entityId: id,
    actor: input.actor ?? "system",
    detail: `${normalized} roles=${(input.roles ?? ["viewer"]).join(",")}`,
  });

  return getUserById(id) as Promise<AuthUser>;
}

async function ensureRolesExist(roleNames: RoleName[]) {
  await ensureAuthBootstrapRolesOnly();
  const db = getDb();
  const existing = await db.select().from(roles).where(inArray(roles.name, roleNames));
  if (existing.length !== roleNames.length) throw new Error("Unknown role");
}

async function ensureAuthBootstrapRolesOnly() {
  const db = getDb();
  for (const role of DEFAULT_ROLES) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, role.name));
    if (!existing) {
      await db.insert(roles).values({
        id: createId("role"),
        name: role.name,
        description: role.description,
      });
    }
  }
}

async function assignRoles(userId: string, roleNames: RoleName[]) {
  const db = getDb();
  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  const roleRows = await db.select().from(roles).where(inArray(roles.name, roleNames));
  for (const role of roleRows) {
    await db.insert(userRoles).values({ userId, roleId: role.id });
  }
}

export async function login(input: { username: string; password: string }) {
  await ensureAuthBootstrap();
  const db = getDb();
  const username = input.username.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.username, username));

  if (!user || user.status !== "active" || !verifyPassword(input.password, user.passwordHash)) {
    if (user) {
      const failedLoginCount = user.failedLoginCount + 1;
      await db
        .update(users)
        .set({
          failedLoginCount,
          status: failedLoginCount >= MAX_FAILED_LOGINS ? "locked" : user.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));
    }
    await logAudit({ action: "auth_login_failed", entityType: "user", entityId: username, actor: username });
    throw new Error("Invalid username or password");
  }

  await db
    .update(users)
    .set({ failedLoginCount: 0, updatedAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  const token = randomBytes(32).toString("base64url");
  const sessionId = createId("sess");
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: sessionExpiry(),
  });

  await logAudit({ action: "auth_login", entityType: "session", entityId: sessionId, actor: username });
  return { token, user: await getUserById(user.id) };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  if (!session || session.revokedAt) return;
  await db.update(sessions).set({ revokedAt: new Date().toISOString() }).where(eq(sessions.id, session.id));
  await logAudit({ action: "auth_logout", entityType: "session", entityId: session.id });
}

export async function getUserById(id: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return null;

  const roleRows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, id));

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: roleRows.map((role) => role.name as RoleName),
  };
}

export async function getUserBySessionToken(token: string | undefined) {
  if (!token) return null;
  await ensureAuthBootstrap();
  const db = getDb();
  const now = new Date().toISOString();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt)));
  if (!session || session.expiresAt <= now) return null;
  return getUserById(session.userId);
}

export async function listUsers() {
  await ensureAuthBootstrap();
  const db = getDb();
  const allUsers = await db.select().from(users);
  const result: AuthUser[] = [];
  for (const user of allUsers) {
    const withRoles = await getUserById(user.id);
    if (withRoles) result.push(withRoles);
  }
  return result;
}

export function hasPermission(user: AuthUser, permission: Permission) {
  return user.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export async function requirePermission(token: string | undefined, permission: Permission) {
  const user = await getUserBySessionToken(token);
  if (!user) throw new Error("Authentication required");
  if (!hasPermission(user, permission)) {
    await logAudit({
      action: "auth_forbidden",
      entityType: "permission",
      entityId: permission,
      actor: user.username,
      detail: `roles=${user.roles.join(",")}`,
    });
    throw new Error("Permission denied");
  }
  return user;
}
