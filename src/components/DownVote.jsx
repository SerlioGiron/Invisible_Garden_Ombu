import { useEffect, useRef, useState } from "react";
import { Button, Loader } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useContract } from "../hooks/useContract";

function DownVote({ postId, groupId, disabled = false, hasVoted = false, onSuccess, recordVote }) {
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
      // Record that this was a downvote (type = -1)
      if (recordVote) {
        recordVote(-1);
      }
      onSuccess(transactionHash);
      lastNotifiedHash.current = transactionHash;
    }
  }, [isConfirmed, transactionHash, onSuccess, recordVote]);

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
  const isActive = isConfirmed || hasVoted;

  return (
    <Button
      variant={isActive ? "filled" : "subtle"}
      color="red"
      size="xs"
      onClick={handleDownvote}
      disabled={isButtonDisabled}
      styles={{
        root: {
          backgroundColor: isActive ? "#fa5252" : undefined,
          '&:hover': {
            backgroundColor: isActive ? "#f03e3e" : undefined,
          }
        }
      }}
    >
      <IconArrowDown size={14} color={isActive ? "white" : "red"} />
      {isConfirming && <Loader size="xs" color="gray" />}
    </Button>
  );
}

export default DownVote;