import { ActionFunctionArgs, LoaderFunctionArgs, data } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { validateEmail, validateRequiredField } from "~/utils/validators.server";

interface ActionData {
  success?: boolean;
  errors?: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    form?: string;
  };
}

interface LoaderData {
  csrfToken: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { token, headers } = await getCSRFToken(request);

  return data<LoaderData>(
    { csrfToken: token },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(request, "contact");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const formData = await request.formData();
  const csrfToken = formData.get("_csrf") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  // Validate CSRF token
  const isValidCsrf = await validateCSRFToken(request, csrfToken);
  if (!isValidCsrf) {
    return data<ActionData>(
      { errors: { form: "Invalid form submission. Please refresh and try again." } },
      { status: 400 }
    );
  }

  // Validate fields
  const errors: ActionData["errors"] = {};

  const nameError = validateRequiredField(name, "Name");
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const subjectError = validateRequiredField(subject, "Subject");
  if (subjectError) errors.subject = subjectError;

  const messageError = validateRequiredField(message, "Message");
  if (messageError) errors.message = messageError;

  if (message && message.length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  if (Object.keys(errors).length > 0) {
    return data<ActionData>({ errors }, { status: 400 });
  }

  // In a real application, you would send an email here
  // For now, we'll just log it and return success
  console.log("Contact form submission:", { name, email, subject, message });

  // Generate new CSRF token for next submission
  const { headers } = await getCSRFToken(request);

  return data<ActionData>(
    { success: true },
    { headers }
  );
};

export default function ContactPage() {
  const { t } = useTranslation();
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('contact.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
        </div>

        {actionData?.success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
            {t('contact.success')}
          </div>
        )}

        {actionData?.errors?.form && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {actionData.errors.form}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="_csrf" value={loaderData.csrfToken} />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('contact.name')}
              </label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder={t('contact.namePlaceholder')}
                className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  actionData?.errors?.name
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {actionData?.errors?.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('contact.email')}
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder={t('contact.emailPlaceholder')}
                className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  actionData?.errors?.email
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {actionData?.errors?.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('contact.subject')}
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                placeholder={t('contact.subjectPlaceholder')}
                className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  actionData?.errors?.subject
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {actionData?.errors?.subject && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.subject}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('contact.message')}
              </label>
              <textarea
                name="message"
                id="message"
                rows={5}
                placeholder={t('contact.messagePlaceholder')}
                className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  actionData?.errors?.message
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {actionData?.errors?.message && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {actionData.errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('contact.sending') : t('contact.send')}
            </button>
          </Form>
        </div>

        {/* Contact info cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">gregkirmaths@gmail.com</p>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Phone</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">+30 6987495775</p>
          </div>
        </div>
      </div>
    </div>
  );
}
