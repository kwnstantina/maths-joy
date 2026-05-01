import React, { useState } from "react";
import { Form, Link, useActionData, useSearchParams, useNavigation } from "@remix-run/react";
import { validateEmail, validatePassword } from "~/utils/validators.server";
import { ActionFunction, data } from "@remix-run/node";
import { login } from "~/utils/auth.prisma";
import { useTranslation } from "react-i18next";

export const handle = { i18n: ["common"] };

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
  error?: string;
  fields?: {
    email: string;
    password: string;
    firstName: FormDataEntryValue | null;
    lastName: FormDataEntryValue | null;
  };
  form?: string;
}

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
    typeof password !== "string"
  ) {
    return data({ error: `Invalid Form Data`, form: action }, { status: 400 });
  }

  // Validate email & password
  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };

  //  If there were any errors, return them
  if (Object.values(errors).some(Boolean))
    return data(
      {
        errors,
        fields: { email, password, firstName, lastName },
        form: action,
      },
      { status: 400 }
    );

  return await login({ email, password });
};
export default function LoginPage(): JSX.Element {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === "submitting";
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const onChangeHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData((form) => ({
      ...form,
      [evt.target.name]: evt.target.value,
    }));
  };


  return (
    <section className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              {t("auth.signInTitle")}
            </h1>

            {/* User-friendly error message */}
            {actionData?.error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200" role="alert">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {t(actionData.error)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {t("auth.tryAgainHint")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Form method="post" className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("auth.emailLabel")}
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
                  {actionData?.errors?.email && (
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
                  {t("auth.passwordLabel")}
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
                  {actionData?.errors?.password && (
                    <div className="pt-1 text-red-700" id="password-error">
                      {actionData.errors.password}
                    </div>
                  )}
                </div>
              </div>

              <input type="hidden" name="redirectTo" value={redirectTo} />
              <button
                value="login"
                name="_action"
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  t("auth.loginButton")
                )}
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
                    {t("auth.rememberMe")}
                  </label>
                </div>
                <div className="text-center text-sm text-gray-500">
                  {t("auth.noAccount")}{" "}
                  <Link className="text-blue-500 underline" to="/signup">
                    {t("auth.signUpLink")}
                  </Link>
                </div>
              </div>
            </Form>
            <Form action="/auth/google" method="post">
              <h3 className="flex items-center my-8">
                <span
                  aria-hidden="true"
                  className="flex-grow bg-gray-200 rounded h-0.5"
                />
                <span className="mx-3 text-sm">{t("auth.or")}</span>
                <span
                  aria-hidden="true"
                  className="flex-grow bg-gray-200 rounded h-0.5"
                />
              </h3>
              <button
                className="text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
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
                {t("auth.googleLogin")}
              </button>
            </Form>         
          </div>
        </div>
      </div>
    </section>
  );
}
