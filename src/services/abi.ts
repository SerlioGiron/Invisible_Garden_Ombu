export const microPostsAbi = [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_semaphoreAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_ombuAdmin",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "addMember",
            "inputs": [
                {
                    "name": "_groupId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_identityCommitment",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "admin",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "createGroup",
            "inputs": [
                {
                    "name": "_name",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "groupCounter",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "groupNames",
            "inputs": [
                {
                    "name": "groupId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "name",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "groupPosts",
            "inputs": [
                {
                    "name": "groupId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "id",
                    "type": "uint64",
                    "internalType": "uint64"
                },
                {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "content",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "timestamp",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "upvotes",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "downvotes",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "postSubPosts",
            "inputs": [
                {
                    "name": "ombuPostId",
                    "type": "uint64",
                    "internalType": "uint64"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "id",
                    "type": "uint64",
                    "internalType": "uint64"
                },
                {
                    "name": "author",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "content",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "timestamp",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "upvotes",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "downvotes",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "removeMember",
            "inputs": [
                {
                    "name": "_groupId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_identityCommitment",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_merkleProofSiblings",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "semaphore",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract ISemaphore"
                }
            ],
            "stateMutability": "view"
        }
    ];
