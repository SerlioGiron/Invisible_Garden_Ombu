import { useEffect, useRef, useState } from "react";
import { Button, Loader } from "@mantine/core";
import { IconArrowUp, IconCheck } from "@tabler/icons-react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";

function UpVote({ postId, groupId, disabled = false, hasVoted = false, onSuccess }) {
  const { upvotePost } = useContract();
  const [transactionHash, setTransactionHash] = useState(null);
  const lastNotifiedHash = useRef(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: transactionHash,
    });

  useEffect(() => {
    if (
      isConfirmed &&
      transactionHash &&
      onSuccess &&
      lastNotifiedHash.current !== transactionHash
    ) {
      onSuccess(transactionHash);
      lastNotifiedHash.current = transactionHash;
    }
  }, [isConfirmed, transactionHash, onSuccess]);

  const handleUpvote = async () => {
    if (!postId || isConfirming || disabled || hasVoted) {
      return;
    }

    lastNotifiedHash.current = null;

    const hash = await upvotePost(postId, { groupId });
    if (hash) {
      setTransactionHash(hash);
    }
  };

  const isButtonDisabled = !postId || isConfirming || disabled || hasVoted;
  const iconColor = isConfirmed || hasVoted ? "green" : "blue";

  return (
    <Button
      variant="subtle"
      color="blue"
      size="xs"
      onClick={handleUpvote}
      disabled={isButtonDisabled}
    >
      <IconArrowUp size={14} color={iconColor} />
      {isConfirming && <Loader size="xs" color="gray" />}
      {isConfirmed && <IconCheck size={14} color="green" />}
    </Button>
  );
}

export default UpVote;