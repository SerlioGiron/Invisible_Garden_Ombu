import { useEffect, useRef, useState } from "react";
import { Button, Loader } from "@mantine/core";
import { IconArrowDown, IconCheck } from "@tabler/icons-react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";

function DownVote({ postId, groupId, disabled = false, hasVoted = false, onSuccess }) {
  const { downvotePost } = useContract();
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

  const handleDownvote = async () => {
    if (!postId || isConfirming || disabled || hasVoted) {
      return;
    }

    lastNotifiedHash.current = null;

    const hash = await downvotePost(postId, { groupId });
    if (hash) {
      setTransactionHash(hash);
    }
  };

  const isButtonDisabled = !postId || isConfirming || disabled || hasVoted;
  const iconColor = "red";

  return (
    <Button
      variant="subtle"
      color="red"
      size="xs"
      onClick={handleDownvote}
      disabled={isButtonDisabled}
    >
      <IconArrowDown size={14} color={iconColor} />
      {isConfirming && <Loader size="xs" color="gray" />}
      {isConfirmed && <IconCheck size={14} color="red" />}
    </Button>
  );
}

export default DownVote;