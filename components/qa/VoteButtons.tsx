import { useFetcher } from '@remix-run/react';

interface VoteButtonsProps {
  type: 'question' | 'answer';
  targetId: string;
  voteCount: number;
  userVote: number;
  csrfToken: string;
  disabled?: boolean;
}

/**
 * Calculate optimistic vote count based on pending vote action.
 * Pure function for predictable optimistic UI updates.
 */
export function calculateOptimisticCount(
  currentCount: number,
  currentUserVote: number,
  newVoteValue: number
): { count: number; userVote: number } {
  if (currentUserVote === newVoteValue) {
    // Toggle off: clicking the same vote button removes the vote
    return { count: currentCount - newVoteValue, userVote: 0 };
  } else if (currentUserVote === 0) {
    // New vote
    return { count: currentCount + newVoteValue, userVote: newVoteValue };
  } else {
    // Flip vote direction: remove old vote and add new
    return { count: currentCount - currentUserVote + newVoteValue, userVote: newVoteValue };
  }
}

export function VoteButtons({
  type,
  targetId,
  voteCount,
  userVote,
  csrfToken,
  disabled = false,
}: VoteButtonsProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';

  // Derive optimistic state from pending form data
  let displayCount = voteCount;
  let displayUserVote = userVote;

  if (fetcher.formData) {
    const pendingValue = Number(fetcher.formData.get('value'));
    if (pendingValue === 1 || pendingValue === -1) {
      const optimistic = calculateOptimisticCount(voteCount, userVote, pendingValue);
      displayCount = optimistic.count;
      displayUserVote = optimistic.userVote;
    }
  }

  const action = type === 'question' ? 'voteQuestion' : 'voteAnswer';
  const isDisabled = disabled || isSubmitting;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Upvote button */}
      <fetcher.Form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <input type="hidden" name="_action" value={action} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="value" value="1" />
        <button
          type="submit"
          disabled={isDisabled}
          className={`p-1 rounded transition-colors ${
            displayUserVote === 1
              ? 'text-green-600'
              : 'text-gray-400 hover:text-gray-600'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="Upvote"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
        </button>
      </fetcher.Form>

      {/* Vote count */}
      <span
        className={`text-sm font-semibold ${
          displayCount > 0
            ? 'text-green-600'
            : displayCount < 0
              ? 'text-red-600'
              : 'text-gray-500'
        }`}
      >
        {displayCount}
      </span>

      {/* Downvote button */}
      <fetcher.Form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <input type="hidden" name="_action" value={action} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="value" value="-1" />
        <button
          type="submit"
          disabled={isDisabled}
          className={`p-1 rounded transition-colors ${
            displayUserVote === -1
              ? 'text-red-600'
              : 'text-gray-400 hover:text-gray-600'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="Downvote"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
        </button>
      </fetcher.Form>
    </div>
  );
}
