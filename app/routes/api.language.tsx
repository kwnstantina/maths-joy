import { ActionFunction, data } from '@remix-run/node';
import { i18nCookie } from 'services/cookies/cookies';

const SUPPORTED_LANGUAGES = ['el', 'en'] as const;

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 });
  }

  const formData = await request.formData();
  const language = formData.get('language') as string;

  if (!language || !SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
    return data({ error: 'Invalid language' }, { status: 400 });
  }

  return data(
    { success: true, language },
    {
      headers: {
        'Set-Cookie': await i18nCookie.serialize(language),
      },
    }
  );
};

// This route only handles actions, no loader needed
export const loader = () => {
  return data({ error: 'Method not allowed' }, { status: 405 });
};
