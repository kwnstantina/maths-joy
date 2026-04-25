import { LoaderFunction, ActionFunction, json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useActionData, Link, useFetcher } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../components/qa/ConfirmModal';
import { VoteButtons } from '../../components/qa/VoteButtons';
import i18next from '~/i18next.server';
import { logAuditEvent, getClientInfo } from '~/utils/audit.server';
import { getUser } from '~/utils/auth.prisma';
import { getCSRFToken, requireCSRFToken } from '~/utils/csrf.server';
import {
  getQuestionById,
  getAnswersByQuestionId,
  createAnswer,
  voteQuestion,
  voteAnswer,
  acceptAnswer,
  getUserVotes,
  deleteQuestion,
  deleteAnswer,
  updateQuestion,
  updateAnswer,
} from '~/utils/qa.server';
import { applyRateLimit } from '~/utils/ratelimit.server';
import { useState, useEffect } from 'react';

export const handle = { i18n: ["common"] };

interface Question {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  voteCount: number;
  answerCount: number;
  viewCount: number;
  isResolved: boolean;
  acceptedAnswerId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Answer {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  voteCount: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoaderData {
  question: Question;
  answers: Answer[];
  locale: string;
  user: { id: string; email: string; profile: { firstName: string; lastName: string } } | null;
  userVotes: { questionVote: number; answerVotes: Record<string, number> };
  csrfToken: string;
}

interface ActionData {
  error?: string;
  success?: boolean;
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const { questionId } = params;
  if (!questionId) {
    throw new Response('Question ID required', { status: 400 });
  }

  const question = await getQuestionById(questionId);
  if (!question) {
    throw new Response('Question not found', { status: 404 });
  }

  const locale = await i18next.getLocale(request);
  const { token, headers } = await getCSRFToken(request);
  const user = await getUser(request);
  const answers = await getAnswersByQuestionId(questionId);
  const userVotes = user
    ? await getUserVotes(user.id, questionId)
    : { questionVote: 0, answerVotes: {} };

  return json<LoaderData>({
    question: question as unknown as Question,
    answers: answers as unknown as Answer[],
    locale,
    user: user as LoaderData['user'],
    userVotes,
    csrfToken: token,
  }, { headers });
};

export const action: ActionFunction = async ({ request, params }) => {
  const { questionId } = params;
  if (!questionId) {
    return json<ActionData>({ error: 'qa.errors.questionIdRequired' }, { status: 400 });
  }

  // CSRF validation (must be before formData consumption)
  const csrfError = await requireCSRFToken(request);
  if (csrfError) return csrfError;

  const user = await getUser(request);
  if (!user) {
    return json<ActionData>({ error: 'qa.errors.mustBeLoggedIn' }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get('_action');

  try {
    switch (actionType) {
      case 'answer': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const body = formData.get('body') as string;
        if (!body || body.trim().length < 10) {
          return json<ActionData>({ error: 'qa.errors.answerTooShort' }, { status: 400 });
        }
        await createAnswer({
          questionId,
          body: body.trim(),
          authorId: user.id,
          authorName: `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim() || user.email,
        });
        return json<ActionData>({ success: true });
      }

      case 'voteQuestion': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const value = parseInt(formData.get('value') as string, 10) as 1 | -1;
        try {
          await voteQuestion(questionId, user.id, value);
        } catch (err) {
          if (err instanceof Error && err.message.includes('own')) {
            return json<ActionData>({ error: 'qa.errors.cannotVoteOwn' }, { status: 403 });
          }
          throw err;
        }
        return json<ActionData>({ success: true });
      }

      case 'voteAnswer': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const answerId = (formData.get('answerId') || formData.get('targetId')) as string;
        const value = parseInt(formData.get('value') as string, 10) as 1 | -1;
        try {
          await voteAnswer(answerId, user.id, value);
        } catch (err) {
          if (err instanceof Error && err.message.includes('own')) {
            return json<ActionData>({ error: 'qa.errors.cannotVoteOwn' }, { status: 403 });
          }
          throw err;
        }
        return json<ActionData>({ success: true });
      }

      case 'acceptAnswer': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const answerId = formData.get('answerId') as string;
        const question = await getQuestionById(questionId);
        if (question?.authorId !== user.id) {
          return json<ActionData>({ error: 'qa.errors.onlyAuthorCanAccept' }, { status: 403 });
        }
        await acceptAnswer(answerId, questionId);
        return json<ActionData>({ success: true });
      }

      case 'deleteQuestion': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const question = await getQuestionById(questionId);
        if (question?.authorId !== user.id) {
          return json<ActionData>({ error: 'qa.errors.onlyAuthorCanDeleteQuestion' }, { status: 403 });
        }
        await deleteQuestion(questionId);

        // Audit log for destructive action
        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId: user.id,
          action: 'delete',
          resource: 'question',
          resourceId: questionId,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return redirect('/qa');
      }

      case 'deleteAnswer': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const answerId = formData.get('answerId') as string;
        const answers = await getAnswersByQuestionId(questionId);
        const answer = answers.find(a => a.id === answerId);
        if (answer?.authorId !== user.id) {
          return json<ActionData>({ error: 'qa.errors.onlyAuthorCanDeleteAnswer' }, { status: 403 });
        }
        await deleteAnswer(answerId, questionId);

        // Audit log for destructive action
        const { ipAddress, userAgent } = getClientInfo(request);
        await logAuditEvent({
          userId: user.id,
          action: 'delete',
          resource: 'answer',
          resourceId: answerId,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });

        return json<ActionData>({ success: true });
      }

      case 'editQuestion': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const question = await getQuestionById(questionId);
        if (question?.authorId !== user.id) {
          return json<ActionData>({ error: 'qa.errors.onlyAuthorCanEditQuestion' }, { status: 403 });
        }

        const title = (formData.get('title') as string)?.trim();
        const body = (formData.get('body') as string)?.trim();
        const category = formData.get('category') as string;
        const tagsRaw = (formData.get('tags') as string)?.trim();
        const tags = tagsRaw
          ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : [];

        if (!title || title.length < 10) {
          return json<ActionData>({ error: 'qa.errors.titleTooShort' }, { status: 400 });
        }
        if (!body || body.length < 10) {
          return json<ActionData>({ error: 'qa.errors.editBodyTooShort' }, { status: 400 });
        }

        await updateQuestion(questionId, { title, body, category, tags });
        return json<ActionData>({ success: true });
      }

      case 'editAnswer': {
        const rateLimitResponse = applyRateLimit(request, 'api', user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const answerId = formData.get('answerId') as string;
        const answerBody = (formData.get('body') as string)?.trim();

        if (!answerBody || answerBody.length < 10) {
          return json<ActionData>({ error: 'qa.errors.answerTooShort' }, { status: 400 });
        }

        const answers = await getAnswersByQuestionId(questionId);
        const answer = answers.find(a => a.id === answerId);
        if (answer?.authorId !== user.id) {
          return json<ActionData>({ error: 'qa.errors.onlyAuthorCanEditAnswer' }, { status: 403 });
        }

        await updateAnswer(answerId, answerBody);
        return json<ActionData>({ success: true });
      }

      default:
        return json<ActionData>({ error: 'qa.errors.unknownAction' }, { status: 400 });
    }
  } catch (error) {
    console.error('Action error:', error);
    return json<ActionData>({ error: 'qa.errors.generic' }, { status: 500 });
  }
};

export default function QuestionDetail() {
  const { question, answers, locale, user, userVotes, csrfToken } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t, i18n } = useTranslation();
  const [answerBody, setAnswerBody] = useState('');

  // Delete question modal state
  const [deleteQuestionOpen, setDeleteQuestionOpen] = useState(false);
  const deleteQuestionFetcher = useFetcher();

  // Delete answer modal state (tracks which answer)
  const [deleteAnswerId, setDeleteAnswerId] = useState<string | null>(null);
  const deleteAnswerFetcher = useFetcher();

  // Accept answer fetcher
  const acceptFetcher = useFetcher();

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState(false);
  const editQuestionFetcher = useFetcher<ActionData>();

  // Edit answer state
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const editAnswerFetcher = useFetcher<ActionData>();

  // Exit edit mode on success
  useEffect(() => {
    if (editQuestionFetcher.data?.success) setEditingQuestion(false);
  }, [editQuestionFetcher.data]);

  useEffect(() => {
    if (editAnswerFetcher.data?.success) setEditingAnswerId(null);
  }, [editAnswerFetcher.data]);

  // Default categories for the edit form
  const defaultCategories = ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Number Theory', 'Other'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'el' ? 'el-GR' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const formatRelativeTime = (dateString: string) => {
    const lang = i18n.language?.startsWith('en') ? 'en' : 'el';
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) return rtf.format(-diffDay, 'day');
    if (diffHr > 0) return rtf.format(-diffHr, 'hour');
    if (diffMin > 0) return rtf.format(-diffMin, 'minute');
    return rtf.format(-diffSec, 'second');
  };

  const wasEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
  };

  const isQuestionAuthor = user?.id === question.authorId;

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link to="/qa" className="text-orange-500 hover:text-orange-600">
          {t('qa.backToQuestions')}
        </Link>
      </nav>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex gap-6">
          {/* Vote Column */}
          <div className="flex-shrink-0">
            <VoteButtons
              type="question"
              targetId={question.id}
              voteCount={question.voteCount}
              userVote={userVotes.questionVote}
              csrfToken={csrfToken}
              disabled={!user || question.authorId === user.id}
            />
          </div>

          {/* Content */}
          <div className="flex-grow">
            {editingQuestion ? (
              <editQuestionFetcher.Form method="post" className="space-y-4">
                <input type="hidden" name="_csrf" value={csrfToken} />
                <input type="hidden" name="_action" value="editQuestion" />
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('qa.questionTitle')}
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    name="title"
                    defaultValue={question.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    minLength={10}
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-body" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('qa.questionBody')}
                  </label>
                  <textarea
                    id="edit-body"
                    name="body"
                    defaultValue={question.body}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                    minLength={10}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('qa.category')}
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    defaultValue={question.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {!defaultCategories.includes(question.category) && (
                      <option value={question.category}>{question.category}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('qa.tags')}
                  </label>
                  <input
                    id="edit-tags"
                    type="text"
                    name="tags"
                    defaultValue={question.tags.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('qa.tagsPlaceholder')}
                  />
                </div>
                {editQuestionFetcher.data?.error && (
                  <p className="text-sm text-red-600">{t(editQuestionFetcher.data.error)}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    disabled={editQuestionFetcher.state !== 'idle'}
                  >
                    {t('qa.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    {t('qa.cancel')}
                  </button>
                </div>
              </editQuestionFetcher.Form>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                  {question.isResolved && (
                    <svg className="w-6 h-6 inline-block mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {question.title}
                </h1>

                <div className="prose max-w-none mb-4 text-gray-700 whitespace-pre-wrap">
                  {question.body}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded">
                    {question.category}
                  </span>
                  {question.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
              <div>
                {t('qa.askedBy')} <span className="font-medium">{question.authorName}</span> - {formatDate(question.createdAt)}
                {wasEdited(question.createdAt, question.updatedAt) && (
                  <span className="text-gray-400 text-xs italic ml-2">
                    ({t('qa.edited')} {formatRelativeTime(question.updatedAt)})
                  </span>
                )}
              </div>
              <div className="flex gap-4">
                <span>{question.viewCount} {t('qa.views')}</span>
                {isQuestionAuthor && !editingQuestion && (
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(true)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {t('qa.edit')}
                  </button>
                )}
                {isQuestionAuthor && (
                  <button
                    type="button"
                    onClick={() => setDeleteQuestionOpen(true)}
                    className="text-red-500 hover:text-red-700"
                  >
                    {t('qa.delete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {answers.length} {answers.length === 1 ? t('qa.answer') : t('qa.answers')}
        </h2>

        {answers.map((answer) => {
          // Optimistic accepted state from acceptFetcher
          const isPendingAccept =
            acceptFetcher.formData?.get('answerId') === answer.id &&
            acceptFetcher.state !== 'idle';
          const isAccepted = answer.isAccepted || isPendingAccept;

          return (
            <div
              key={answer.id}
              className={`bg-white rounded-lg shadow-md p-6 mb-4 ${
                isAccepted ? 'border-2 border-green-500' : ''
              }`}
            >
              <div className="flex gap-6">
                {/* Vote Column */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <VoteButtons
                    type="answer"
                    targetId={answer.id}
                    voteCount={answer.voteCount}
                    userVote={userVotes.answerVotes[answer.id] || 0}
                    csrfToken={csrfToken}
                    disabled={!user || answer.authorId === user.id}
                  />
                  {isAccepted && (
                    <div className="text-green-500" title={t('qa.acceptedAnswer')}>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {isQuestionAuthor && !isAccepted && (
                    <acceptFetcher.Form method="post">
                      <input type="hidden" name="_csrf" value={csrfToken} />
                      <input type="hidden" name="_action" value="acceptAnswer" />
                      <input type="hidden" name="answerId" value={answer.id} />
                      <button
                        type="submit"
                        className="text-gray-400 hover:text-green-500"
                        title={t('qa.acceptThisAnswer')}
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </acceptFetcher.Form>
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  {editingAnswerId === answer.id ? (
                    <editAnswerFetcher.Form method="post" className="space-y-4">
                      <input type="hidden" name="_csrf" value={csrfToken} />
                      <input type="hidden" name="_action" value="editAnswer" />
                      <input type="hidden" name="answerId" value={answer.id} />
                      <textarea
                        name="body"
                        defaultValue={answer.body}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                        minLength={10}
                        required
                      />
                      {editAnswerFetcher.data?.error && (
                        <p className="text-sm text-red-600">{t(editAnswerFetcher.data.error)}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                          disabled={editAnswerFetcher.state !== 'idle'}
                        >
                          {t('qa.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAnswerId(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          {t('qa.cancel')}
                        </button>
                      </div>
                    </editAnswerFetcher.Form>
                  ) : (
                    <div className="prose max-w-none mb-4 text-gray-700 whitespace-pre-wrap">
                      {answer.body}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div>
                      {t('qa.answeredBy')} <span className="font-medium">{answer.authorName}</span> - {formatDate(answer.createdAt)}
                      {wasEdited(answer.createdAt, answer.updatedAt) && (
                        <span className="text-gray-400 text-xs italic ml-2">
                          ({t('qa.edited')} {formatRelativeTime(answer.updatedAt)})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      {user?.id === answer.authorId && editingAnswerId !== answer.id && (
                        <button
                          type="button"
                          onClick={() => setEditingAnswerId(answer.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          {t('qa.edit')}
                        </button>
                      )}
                      {user?.id === answer.authorId && (
                        <button
                          type="button"
                          onClick={() => setDeleteAnswerId(answer.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          {t('qa.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('qa.yourAnswer')}</h3>
          {actionData?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {t(actionData.error)}
            </div>
          )}
          <Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="answer" />
            <textarea
              name="body"
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
              placeholder={t('qa.answerPlaceholder')}
              required
              minLength={10}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {t('qa.postAnswer')}
              </button>
            </div>
          </Form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">{t('qa.loginToAnswer')}</p>
          <Link
            to={`/login?redirectTo=/qa/${question.id}`}
            className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {t('qa.login')}
          </Link>
        </div>
      )}

      {/* Delete Question Confirm Modal */}
      <ConfirmModal
        isOpen={deleteQuestionOpen}
        onClose={() => setDeleteQuestionOpen(false)}
        onConfirm={() => {
          deleteQuestionFetcher.submit(
            { _action: 'deleteQuestion', _csrf: csrfToken },
            { method: 'post' }
          );
          setDeleteQuestionOpen(false);
        }}
        title={t('qa.deleteQuestionTitle')}
        message={t('qa.deleteQuestionMessage')}
        isLoading={deleteQuestionFetcher.state !== 'idle'}
      />

      {/* Delete Answer Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteAnswerId}
        onClose={() => setDeleteAnswerId(null)}
        onConfirm={() => {
          if (deleteAnswerId) {
            deleteAnswerFetcher.submit(
              { _action: 'deleteAnswer', answerId: deleteAnswerId, _csrf: csrfToken },
              { method: 'post' }
            );
          }
          setDeleteAnswerId(null);
        }}
        title={t('qa.deleteAnswerTitle')}
        message={t('qa.deleteAnswerMessage')}
        isLoading={deleteAnswerFetcher.state !== 'idle'}
      />
    </div>
  );
}
