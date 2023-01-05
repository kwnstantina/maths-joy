import React, { useState } from "react";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "~/utils/validators.server";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { register, getUser } from "~/utils/auth.prisma";
import Alerts from "components/alerts/alerts";
export const loader: LoaderFunction = async ({ request }) => {
  // If there's already a user in the session, redirect to the home page
  return (await getUser(request)) ? redirect("/") : null;
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action = form.get("_action");
  const email = form.get("email");
  const password = form.get("password");
  let firstName = form.get("firstName");
  let lastName = form.get("lastName");

  // If not all data was passed, error
  if (
    typeof action !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof firstName !== "string" || typeof lastName !== "string"

  ) {
    return json({ error: `Invalid Form Data`, form: action }, { status: 400 });
  }
  // Validate email & password
  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
    firstName: validateName((firstName as string) || ""),
    lastName: validateName((lastName as string) || ""),
  };

  //  If there were any errors, return them
  if (Object.values(errors).some(Boolean))
    return json(
      {
        errors,
        fields: { email, password, firstName, lastName },
        form: action,
      },
      { status: 400 }
    );

    return await register({ email, password, firstName, lastName });
};
export default function LoginPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    firstName:"",
    lastName:""
  });
  const onChangeHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((form) => ({
      ...form,
      [evt.target.name]: evt.target.value,
    }));
  };
  console.log("actionData", actionData);
  return (
    <div className="mt-5 flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                value={loginData.email}
                id="email"
                required
                autoFocus={true}
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                onChange={(evt) => onChangeHandler(evt)}
              />
              {actionData?.error?.email && (
                <div className="pt-1 text-red-700" id="email-error">
                  {actionData.errors.email}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                value={loginData.password}
                id="password"
                onChange={(evt) => onChangeHandler(evt)}
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.error?.password && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <div className="mt-1">
              <input
                value={loginData.firstName}
                id="firstName"
                onChange={(evt) => onChangeHandler(evt)}
                name="firstName"
                type="text"
                aria-invalid={actionData?.errors?.firstName ? true : undefined}           
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.firstName && (
                <div className="pt-1 text-red-700" id="firstName-error">
                  {actionData.errors.firstName}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <div className="mt-1">
              <input
                value={loginData.lastName}
                id="lastName"
                onChange={(evt) => onChangeHandler(evt)}
                name="lastName"
                type="text"
                aria-invalid={actionData?.errors?.lastName ? true : undefined}
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.lastName && (
                <div className="pt-1 text-red-700" id="lastName-error">
                  {actionData.errors.lastName}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            value="register"
            name="_action"
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Sign up
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
          </div>
        </Form>
        {actionData?.error && (
          <Alerts.ErrorAlert error={actionData.error}/>
        )}
      </div>
    </div>
  );
}
