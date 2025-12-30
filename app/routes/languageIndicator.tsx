import { json, ActionFunction, redirect } from "@remix-run/node";
import { languageCookie } from "../../utils/cookies";

export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData();
  let language = formData.get("language");

  if (typeof language !== "string") {
    return json({ error: "Invalid language" }, { status: 400 });
  }

  let cookieHeader = await languageCookie.serialize(language);
  return redirect("/", {
    headers: {
      "Set-Cookie": cookieHeader,
    },
  });
};
