import { redirect, json, createCookieSessionStorage } from "@remix-run/node";
import { prisma } from "./prisma.server";
import { createUser } from "./user.server";
import bcrypt from "bcryptjs";
import type { RegisterForm, LoginForm } from "./types.server";
import { GoogleStrategy } from "remix-auth-google";
import { Authenticator } from "remix-auth";
import supabase from "../../utils/supabase";
import { arrayOfColors } from "utils/utils";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export const storage = createCookieSessionStorage({
  cookie: {
    name: "gregMaths",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

let googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/callback",
  } as any,
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    const user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value },
    });

    if (!user) {
      const newUser = {
        email: profile.emails[0].value,
        password: "",
        firstName: profile.displayName,
        lastName: profile.name.givenName,
        profilePicture:profile["_json"].picture
      };
      let userId = await createUser(newUser);
      const session = await storage.getSession();
      createUserSession(userId.id, "/");
      session.set("userId", userId);
      return newUser;
    }
    const session = await storage.getSession();
    createUserSession(user.id, "/");
    session.set("userId", user.id);
    return user;
  }
);

export async function register(user: RegisterForm) {
  const exists = await prisma.user.count({ where: { email: user.email } });
  if (exists) {
    return json(
      { error: `User already exists with that email` },
      { status: 400 }
    );
  }

  const newUser = await createUser(user);
  if (!newUser) {
    return json(
      {
        error: `Something went wrong trying to create a new user.`,
        fields: { email: user.email, password: user.password },
      },
      { status: 400 }
    );
  }
  return createUserSession(newUser.id, "/");
}

// Validate the user on email & password
export async function login({ email, password }: LoginForm) {
  
  if(email == null){
    throw new Error('Incorrect login')
  };
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return json({ error: `Incorrect login` }, { status: 400 });

  return createUserSession(user.id, "/");
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUserSession(request: Request) {
  return await storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function getUserByGoogleAuth(request: Request) {
  const session = await getUserSession(request);
  session.set("userId", session?.data?.user?.id);
  return session.data.user;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, profile: true, role: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  let user:any = await authenticator.isAuthenticated(request);
   await  updateUserStatus(user.id,false);

  if (user) {
    await authenticator.logout(request, { redirectTo: "/login" });
    return redirect("/", {
      headers: {
        "Set-Cookie": await storage.destroySession(session),
        cookie: await storage.destroySession(session),
      },
    });
  }
}

export async function chatAuthorization(request: Request) {
  let userByExternalAuth = await getUserByGoogleAuth(request);
  let userByStorage = await getUser(request);
  let checkIfUserExists = await supabase.from("users").select().eq("email", userByExternalAuth?.email);
  let checkIfUserStorageExists=await supabase.from("users").select().eq("email",userByStorage?.email);
  
  if (userByExternalAuth && checkIfUserExists.data?.length===0) {
    await supabase.from("users").insert({
      provider_id: userByExternalAuth.id,
      email: userByExternalAuth.email,
      password: userByExternalAuth.password,
      createdAt: userByExternalAuth.createdAt,
      updatedAt: userByExternalAuth.updatedAt,
      role: userByExternalAuth.role,
      firstName: userByExternalAuth.profile.firstName,
      lastName: userByExternalAuth.profile.lastName,
      isActive: true,
      profilePicture:userByExternalAuth.profilePicture,
      color: arrayOfColors(),
    });
  }
  if(userByStorage && checkIfUserStorageExists.data?.length===0){
    await supabase.from("users").insert({
      provider_id: userByStorage?.id,
      email: userByStorage?.email,
      role: userByStorage?.role,
      firstName: userByStorage?.profile.firstName,
      lastName: userByStorage?.profile.lastName,
      isActive: true,
      color: arrayOfColors(),
    });
  }
  await updateUserStatus(userByExternalAuth?.id || userByStorage?.id,true);
  return userByExternalAuth || userByStorage;
}

export const updateUserStatus=async(userId:string,isActive:boolean)=> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ isActive: isActive })
      .eq('provider_id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      return;
    }
    console.log('User status updated successfully');
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

export const authenticator = new Authenticator(storage).use(googleStrategy);
