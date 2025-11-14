import { useEffect, useRef, useState } from "react";
import { Button, Loader } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";

function UpVote({ postId, groupId, disabled = false, hasVoted = false, onSuccess, recordVote }) {
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
      // Record that this was an upvote (type = 1)
      if (recordVote) {
        recordVote(1);
      }
      onSuccess(transactionHash);
      lastNotifiedHash.current = transactionHash;
    }
  }, [isConfirmed, transactionHash, onSuccess, recordVote]);

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
  const isActive = isConfirmed || hasVoted;

  return (
    <Button
      variant={isActive ? "filled" : "subtle"}
      color="blue"
      size="xs"
      onClick={handleUpvote}
      disabled={isButtonDisabled}
      styles={{
        root: {
          backgroundColor: isActive ? "#228be6" : undefined,
          '&:hover': {
            backgroundColor: isActive ? "#1c7ed6" : undefined,
          }
        }
      }}
    >
      <IconArrowUp size={14} color={isActive ? "white" : "blue"} />
      {isConfirming && <Loader size="xs" color="gray" />}
    </Button>
  );
}

export default UpVote;