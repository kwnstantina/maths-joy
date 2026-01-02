import { LoaderFunction, ActionFunction, json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useActionData, Link } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import i18next from '~/i18next.server';
import { getUser } from '~/utils/auth.prisma';
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
} from '~/utils/qa.server';
import { useState } from 'react';

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
}

interface LoaderData {
  question: Question;
  answers: Answer[];
  locale: string;
  user: { id: string; email: string; profile: { firstName: string; lastName: string } } | null;
  userVotes: { questionVote: number; answerVotes: Record<string, number> };
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
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const { questionId } = params;
  if (!questionId) {
    return json<ActionData>({ error: 'Question ID required' }, { status: 400 });
  }

  const user = await getUser(request);
  if (!user) {
    return json<ActionData>({ error: 'You must be logged in' }, { status: 401 });
  }

  const formData = await request.formData();
  const action = formData.get('_action');

  try {
    switch (action) {
      case 'answer': {
        const body = formData.get('body') as string;
        if (!body || body.trim().length < 10) {
          return json<ActionData>({ error: 'Answer must be at least 10 characters' }, { status: 400 });
        }
        await createAnswer({
          questionId,
          body: body.trim(),
          authorId: user.id,
          authorName: `${user.profile.firstName} ${user.profile.lastName}`,
        });
        return json<ActionData>({ success: true });
      }

      case 'voteQuestion': {
        const value = parseInt(formData.get('value') as string, 10) as 1 | -1;
        await voteQuestion(questionId, user.id, value);
        return json<ActionData>({ success: true });
      }

      case 'voteAnswer': {
        const answerId = formData.get('answerId') as string;
        const value = parseInt(formData.get('value') as string, 10) as 1 | -1;
        await voteAnswer(answerId, user.id, value);
        return json<ActionData>({ success: true });
      }

      case 'acceptAnswer': {
        const answerId = formData.get('answerId') as string;
        const question = await getQuestionById(questionId);
        if (question?.authorId !== user.id) {
          return json<ActionData>({ error: 'Only question author can accept answers' }, { status: 403 });
        }
        await acceptAnswer(answerId, questionId);
        return json<ActionData>({ success: true });
      }

      case 'deleteQuestion': {
        const question = await getQuestionById(questionId);
        if (question?.authorId !== user.id) {
          return json<ActionData>({ error: 'Only question author can delete' }, { status: 403 });
        }
        await deleteQuestion(questionId);
        return redirect('/qa');
      }

      case 'deleteAnswer': {
        const answerId = formData.get('answerId') as string;
        const answers = await getAnswersByQuestionId(questionId);
        const answer = answers.find(a => a.id === answerId);
        if (answer?.authorId !== user.id) {
          return json<ActionData>({ error: 'Only answer author can delete' }, { status: 403 });
        }
        await deleteAnswer(answerId, questionId);
        return json<ActionData>({ success: true });
      }

      default:
        return json<ActionData>({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Action error:', error);
    return json<ActionData>({ error: 'An error occurred' }, { status: 500 });
  }
};

function VoteButtons({
  voteCount,
  userVote,
  onVote,
  disabled,
}: {
  voteCount: number;
  userVote: number;
  onVote: (value: 1 | -1) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          userVote === 1
            ? 'bg-orange-500 text-white'
            : disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
        }`}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <span className={`text-xl font-bold ${voteCount > 0 ? 'text-green-600' : voteCount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
        {voteCount}
      </span>
      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          userVote === -1
            ? 'bg-orange-500 text-white'
            : disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
        }`}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function QuestionDetail() {
  const { question, answers, locale, user, userVotes } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();
  const [answerBody, setAnswerBody] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'el' ? 'el-GR' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
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
          <Form method="post" className="flex-shrink-0">
            <input type="hidden" name="_action" value="voteQuestion" />
            <VoteButtons
              voteCount={question.voteCount}
              userVote={userVotes.questionVote}
              onVote={(value) => {
                const form = document.createElement('form');
                form.method = 'post';
                form.innerHTML = `
                  <input type="hidden" name="_action" value="voteQuestion" />
                  <input type="hidden" name="value" value="${value}" />
                `;
                document.body.appendChild(form);
                form.submit();
              }}
              disabled={!user}
            />
          </Form>

          {/* Content */}
          <div className="flex-grow">
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

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
              <div>
                {t('qa.askedBy')} <span className="font-medium">{question.authorName}</span> - {formatDate(question.createdAt)}
              </div>
              <div className="flex gap-4">
                <span>{question.viewCount} {t('qa.views')}</span>
                {isQuestionAuthor && (
                  <Form method="post" onSubmit={(e) => {
                    if (!confirm(t('qa.confirmDeleteQuestion'))) {
                      e.preventDefault();
                    }
                  }}>
                    <input type="hidden" name="_action" value="deleteQuestion" />
                    <button type="submit" className="text-red-500 hover:text-red-700">
                      {t('qa.delete')}
                    </button>
                  </Form>
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

        {answers.map((answer) => (
          <div
            key={answer.id}
            className={`bg-white rounded-lg shadow-md p-6 mb-4 ${
              answer.isAccepted ? 'border-2 border-green-500' : ''
            }`}
          >
            <div className="flex gap-6">
              {/* Vote Column */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <VoteButtons
                  voteCount={answer.voteCount}
                  userVote={userVotes.answerVotes[answer.id] || 0}
                  onVote={(value) => {
                    const form = document.createElement('form');
                    form.method = 'post';
                    form.innerHTML = `
                      <input type="hidden" name="_action" value="voteAnswer" />
                      <input type="hidden" name="answerId" value="${answer.id}" />
                      <input type="hidden" name="value" value="${value}" />
                    `;
                    document.body.appendChild(form);
                    form.submit();
                  }}
                  disabled={!user}
                />
                {answer.isAccepted && (
                  <div className="text-green-500" title={t('qa.acceptedAnswer')}>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {isQuestionAuthor && !answer.isAccepted && (
                  <Form method="post">
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
                  </Form>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="prose max-w-none mb-4 text-gray-700 whitespace-pre-wrap">
                  {answer.body}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <div>
                    {t('qa.answeredBy')} <span className="font-medium">{answer.authorName}</span> - {formatDate(answer.createdAt)}
                  </div>
                  {user?.id === answer.authorId && (
                    <Form method="post" onSubmit={(e) => {
                      if (!confirm(t('qa.confirmDeleteAnswer'))) {
                        e.preventDefault();
                      }
                    }}>
                      <input type="hidden" name="_action" value="deleteAnswer" />
                      <input type="hidden" name="answerId" value={answer.id} />
                      <button type="submit" className="text-red-500 hover:text-red-700">
                        {t('qa.delete')}
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('qa.yourAnswer')}</h3>
          {actionData?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {actionData.error}
            </div>
          )}
          <Form method="post">
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
    </div>
  );
}
