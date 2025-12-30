import { createCookie } from "@remix-run/node";

export const languageCookie = createCookie("language", {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  //httpOnly:  process.env.NODE_ENV === "production",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  encode: (value) => Buffer.from(value).toString("base64"),
  decode: (value) => Buffer.from(value, "base64").toString("utf-8"),
});
