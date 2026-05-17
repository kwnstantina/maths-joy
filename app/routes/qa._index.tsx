import { LoaderFunction, json } from '@remix-run/node';
import { useLoaderData, Link, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import i18next from '~/i18next.server';
import { getQuestions, getQuestionCategories, getPopularTags } from '~/utils/qa.server';
import type { QuestionFilters } from '~/utils/qa.server';
import { getUser } from '~/utils/auth.prisma';

export const handle = { i18n: ["common"] };

interface Question {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  authorName: string;
  voteCount: number;
  answerCount: number;
  viewCount: number;
  isResolved: boolean;
  createdAt: string;
}

interface LoaderData {
  questions: Question[];
  total: number;
  page: number;
  totalPages: number;
  categories: { name: string; count: number }[];
  popularTags: { name: string; count: number }[];
  locale: string;
  isLoggedIn: boolean;
  sort: 'newest' | 'votes';
  unanswered: boolean;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const category = url.searchParams.get('category') || undefined;
  const tag = url.searchParams.get('tag') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const unanswered = url.searchParams.get('unanswered') === 'true';

  const sortParam = url.searchParams.get('sort');
  const sort: 'newest' | 'votes' = sortParam === 'votes' ? 'votes' : 'newest';

  const locale = await i18next.getLocale(request);
  const user = await getUser(request);

  const filters: QuestionFilters = { category, tag, search };
  if (unanswered) {
    filters.isResolved = false;
  }

  const [questionsData, categories, popularTags] = await Promise.all([
    getQuestions(filters, page, 20, sort),
    getQuestionCategories(),
    getPopularTags(10),
  ]);

  return json<LoaderData>({
    questions: questionsData.questions as unknown as Question[],
    total: questionsData.total,
    page: questionsData.page,
    totalPages: questionsData.totalPages,
    categories,
    popularTags,
    locale,
    isLoggedIn: !!user,
    sort,
    unanswered,
  });
};

export default function QAIndex() {
  const { questions, total, page, totalPages, categories, popularTags, locale, isLoggedIn, sort } =
    useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentUnanswered = searchParams.get('unanswered') === 'true';
  const hasActiveFilters = !!(currentCategory || currentTag || currentSearch || currentUnanswered);

  const buildSortUrl = (sortValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (sortValue === 'newest') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sortValue);
    }
    newParams.delete('page');
    return `?${newParams.toString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'el' ? 'el-GR' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleCategoryFilter = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === currentCategory) {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleTagFilter = (tag: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tag === currentTag) {
      newParams.delete('tag');
    } else {
      newParams.set('tag', tag);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleUnansweredToggle = () => {
    const newParams = new URLSearchParams(searchParams);
    if (currentUnanswered) {
      newParams.delete('unanswered');
    } else {
      newParams.set('unanswered', 'true');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    const sortVal = searchParams.get('sort');
    if (sortVal) newParams.set('sort', sortVal);
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">{t('qa.title')}</h1>
        {isLoggedIn ? (
          <Link
            to="/qa/ask"
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('qa.askQuestion')}
          </Link>
        ) : (
          <Link
            to="/login?redirectTo=/qa/ask"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('qa.loginToAsk')}
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={currentSearch}
                placeholder={t('qa.searchPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Unanswered Toggle */}
          <button
            onClick={handleUnansweredToggle}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors mb-6 ${
              currentUnanswered
                ? 'bg-orange-100 text-orange-700 font-medium'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('qa.unanswered')}
          </button>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">{t('qa.categories')}</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryFilter(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentCategory === cat.name
                      ? 'bg-orange-100 text-orange-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="float-right text-gray-400">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">{t('qa.popularTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagFilter(tag.name)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentTag === tag.name
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-grow">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-600">
              {t('qa.totalQuestions', { count: total })}
            </span>
            <div className="flex gap-1 ml-auto">
              <Link
                to={buildSortUrl('newest')}
                className={sort === 'newest' ? 'px-3 py-1 rounded bg-blue-100 text-blue-700 font-medium text-sm' : 'px-3 py-1 rounded text-gray-600 hover:bg-gray-100 text-sm'}
              >
                {t('qa.newest')}
              </Link>
              <Link
                to={buildSortUrl('votes')}
                className={sort === 'votes' ? 'px-3 py-1 rounded bg-blue-100 text-blue-700 font-medium text-sm' : 'px-3 py-1 rounded text-gray-600 hover:bg-gray-100 text-sm'}
              >
                {t('qa.mostVoted')}
              </Link>
            </div>
          </div>

          {/* Active Filter Summary Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                  {t('qa.activeSearch', { term: currentSearch })}
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('search');
                      newParams.delete('page');
                      setSearchParams(newParams);
                    }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </span>
              )}
              {currentCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                  {t('qa.activeCategory', { name: currentCategory })}
                  <button
                    onClick={() => handleCategoryFilter(currentCategory)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </span>
              )}
              {currentTag && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                  {t('qa.activeTag', { name: currentTag })}
                  <button
                    onClick={() => handleTagFilter(currentTag)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </span>
              )}
              {currentUnanswered && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                  {t('qa.unanswered')}
                  <button
                    onClick={handleUnansweredToggle}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="ml-auto text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                {t('qa.clearAll')}
              </button>
            </div>
          )}

          {questions.length === 0 && hasActiveFilters ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg mb-2">{t('qa.noMatchingQuestions')}</p>
              <p className="text-gray-400 text-sm mb-4">{t('qa.tryBroadening')}</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {t('qa.clearFilters')}
              </button>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">{t('qa.noQuestions')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Link
                  key={question.id}
                  to={`/qa/${question.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex gap-6">
                    {/* Stats */}
                    <div className="flex flex-col items-center gap-2 text-sm text-gray-500 min-w-[80px]">
                      <div className={`text-center ${question.voteCount > 0 ? 'text-green-600' : question.voteCount < 0 ? 'text-red-600' : ''}`}>
                        <div className="font-bold text-lg">{question.voteCount}</div>
                        <div>{t('qa.votes')}</div>
                      </div>
                      <div className={`text-center ${question.isResolved ? 'text-green-600 bg-green-100 rounded-lg px-2 py-1' : ''}`}>
                        <div className="font-bold text-lg">{question.answerCount}</div>
                        <div>{t('qa.answers')}</div>
                      </div>
                      <div className="text-center text-gray-400">
                        <div>{question.viewCount}</div>
                        <div>{t('qa.views')}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-orange-600">
                        {question.isResolved && (
                          <svg className="w-5 h-5 inline-block mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {question.title}
                      </h2>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {question.body.substring(0, 200)}
                        {question.body.length > 200 ? '...' : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                          {question.category}
                        </span>
                        {question.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        <span className="ml-auto text-sm text-gray-500">
                          {question.authorName} - {formatDate(question.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {page > 1 && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}`}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  {t('qa.previous')}
                </Link>
              )}
              <span className="px-4 py-2 text-gray-600">
                {t('qa.pageOf', { page, totalPages })}
              </span>
              {page < totalPages && (
                <Link
                  to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}`}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  {t('qa.next')}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
