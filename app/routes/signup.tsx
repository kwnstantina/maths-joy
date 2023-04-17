import React, { useState } from "react";
import { Form, useActionData, useSearchParams, Link } from "@remix-run/react";
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
import { register } from "~/utils/auth.prisma";
import Alerts from "components/alerts/alerts";

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
    typeof firstName !== "string" ||
    typeof lastName !== "string"
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
    firstName: "",
    lastName: "",
  });
  const onChangeHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((form) => ({
      ...form,
      [evt.target.name]: evt.target.value,
    }));
  };
  return (
    <section className="bg-gray-50 ">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Sign up to your account
            </h1>
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
                    aria-invalid={
                      actionData?.errors?.password ? true : undefined
                    }
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
                    aria-invalid={
                      actionData?.errors?.firstName ? true : undefined
                    }
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
                    aria-invalid={
                      actionData?.errors?.lastName ? true : undefined
                    }
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
                <Alerts.ErrorAlert error={actionData.error} />
              )}

              <Form action="/auth/google" method="post">
                <h3 className="flex items-center my-8">
                  <span
                    aria-hidden="true"
                    className="flex-grow bg-gray-200 rounded h-0.5"
                  />
                  <span className="mx-3 text-sm">or</span>
                  <span
                    aria-hidden="true"
                    className="flex-grow bg-gray-200 rounded h-0.5"
                  />
                </h3>

                <button
                  className="text-white bg-red-500 hover:bg-red/90 focus:ring-4 focus:outline-none focus:ring-red/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center mr-2 mb-2"
                >
                  <svg
                    className="w-4 h-4 mr-2 -ml-1"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                  Google
                </button>
              </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
