import { LoaderFunction, ActionFunction, json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useActionData, Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import i18next from '~/i18next.server';
import { getUser } from '~/utils/auth.prisma';
import { getCSRFToken, requireCSRFToken } from '~/utils/csrf.server';
import { createQuestion, getQuestionCategories, getPopularTags } from '~/utils/qa.server';
import { applyRateLimit } from '~/utils/ratelimit.server';
import { useState } from 'react';

export const handle = { i18n: ["common"] };

interface LoaderData {
  locale: string;
  categories: { name: string; count: number }[];
  popularTags: { name: string; count: number }[];
  user: { id: string; profile: { firstName: string; lastName: string } };
  csrfToken: string;
}

interface ActionData {
  error?: string;
  fieldErrors?: {
    title?: string;
    body?: string;
    category?: string;
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    return redirect('/login?redirectTo=/qa/ask');
  }

  const locale = await i18next.getLocale(request);
  const { token, headers } = await getCSRFToken(request);
  const [categories, popularTags] = await Promise.all([
    getQuestionCategories(),
    getPopularTags(20),
  ]);

  // Add default categories if none exist
  const defaultCategories = [
    { name: 'Algebra', count: 0 },
    { name: 'Geometry', count: 0 },
    { name: 'Calculus', count: 0 },
    { name: 'Statistics', count: 0 },
    { name: 'Number Theory', count: 0 },
    { name: 'Other', count: 0 },
  ];

  const mergedCategories = categories.length > 0 ? categories : defaultCategories;

  return json<LoaderData>({
    locale,
    categories: mergedCategories,
    popularTags,
    user: { id: user.id, profile: user.profile ?? { firstName: '', lastName: '' } },
    csrfToken: token,
  }, { headers });
};

export const action: ActionFunction = async ({ request }) => {
  // CSRF validation (must be before formData consumption)
  const csrfError = await requireCSRFToken(request);
  if (csrfError) return csrfError;

  const user = await getUser(request);

  if (!user) {
    return redirect('/login?redirectTo=/qa/ask');
  }

  // Rate limiting: 3 questions per hour
  const rateLimitResponse = applyRateLimit(request, 'contact', user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const formData = await request.formData();
  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();
  const category = formData.get('category') as string;
  const tagsRaw = (formData.get('tags') as string)?.trim();

  const fieldErrors: ActionData['fieldErrors'] = {};

  if (!title || title.length < 10) {
    fieldErrors.title = 'qa.errors.titleTooShort';
  }
  if (title && title.length > 200) {
    fieldErrors.title = 'qa.errors.titleTooLong';
  }

  if (!body || body.length < 30) {
    fieldErrors.body = 'qa.errors.bodyTooShort';
  }

  if (!category) {
    fieldErrors.category = 'qa.errors.selectCategory';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400 });
  }

  // Parse tags
  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  try {
    const question = await createQuestion({
      title,
      body,
      category,
      tags,
      authorId: user.id,
      authorName: `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim() || user.email,
    });

    return redirect(`/qa/${question.id}`);
  } catch (error) {
    console.error('Create question error:', error);
    return json<ActionData>({ error: 'qa.errors.createFailed' }, { status: 500 });
  }
};

export default function AskQuestion() {
  const { categories, popularTags, csrfToken } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleCustomTagAdd = () => {
    if (customTag.trim()) {
      addTag(customTag.trim());
      setCustomTag('');
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link to="/qa" className="text-orange-500 hover:text-orange-600">
          {t('qa.backToQuestions')}
        </Link>
      </nav>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('qa.askNewQuestion')}</h1>
      <p className="text-gray-600 mb-8">{t('qa.askDescription')}</p>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t(actionData.error)}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <input type="hidden" name="_csrf" value={csrfToken} />
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            {t('qa.questionTitle')} *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              actionData?.fieldErrors?.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('qa.titlePlaceholder')}
            minLength={10}
            maxLength={200}
            required
          />
          {actionData?.fieldErrors?.title && (
            <p className="mt-1 text-sm text-red-600">{t(actionData.fieldErrors.title)}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">{t('qa.titleHint')}</p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            {t('qa.questionBody')} *
          </label>
          <textarea
            id="body"
            name="body"
            rows={10}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical ${
              actionData?.fieldErrors?.body ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('qa.bodyPlaceholder')}
            minLength={30}
            required
          />
          {actionData?.fieldErrors?.body && (
            <p className="mt-1 text-sm text-red-600">{t(actionData.fieldErrors.body)}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">{t('qa.bodyHint')}</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            {t('qa.category')} *
          </label>
          <select
            id="category"
            name="category"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              actionData?.fieldErrors?.category ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">{t('qa.selectCategory')}</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          {actionData?.fieldErrors?.category && (
            <p className="mt-1 text-sm text-red-600">{t(actionData.fieldErrors.category)}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('qa.tags')} ({t('qa.optional')})
          </label>
          <input type="hidden" name="tags" value={selectedTags.join(',')} />

          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-orange-500 hover:text-orange-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {/* Custom Tag Input */}
          {selectedTags.length < 5 && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomTagAdd();
                  }
                }}
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={t('qa.addCustomTag')}
              />
              <button
                type="button"
                onClick={handleCustomTagAdd}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t('qa.addTag')}
              </button>
            </div>
          )}

          {/* Popular Tags */}
          {popularTags.length > 0 && selectedTags.length < 5 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('qa.suggestedTags')}:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags
                  .filter(t => !selectedTags.includes(t.name))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                    >
                      + {tag.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">{t('qa.tagsHint')}</p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <Link
            to="/qa"
            className="px-6 py-3 text-gray-600 hover:text-gray-800"
          >
            {t('qa.cancel')}
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            {t('qa.postQuestion')}
          </button>
        </div>
      </Form>
    </div>
  );
}
