// src/services/contract.js
export const CONTRACT_CONFIG = {
    address: "0xB4E6E678Bc83875891671EC70337aD08E1dD66d7",
    abi: [
        {inputs: [{internalType: "address", name: "_semaphoreAddress", type: "address"}], stateMutability: "nonpayable", type: "constructor"},
        {anonymous: false, inputs: [{indexed: false, internalType: "address", name: "_newAdmin", type: "address"}], name: "change_Admin", type: "event"},
        {inputs: [{internalType: "uint256", name: "_groupId", type: "uint256"}], name: "acceptGroupAdmin", outputs: [], stateMutability: "nonpayable", type: "function"},
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "addMember",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {inputs: [], name: "admin", outputs: [{internalType: "address", name: "", type: "address"}], stateMutability: "view", type: "function"},
        {inputs: [{internalType: "address", name: "_newAdmin", type: "address"}], name: "changeAdmin", outputs: [], stateMutability: "nonpayable", type: "function"},
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "address", name: "_newAdmin", type: "address"},
            ],
            name: "changeGroupAdmin",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {inputs: [{internalType: "string", name: "_name", type: "string"}], name: "createGroup", outputs: [{internalType: "uint256", name: "", type: "uint256"}], stateMutability: "nonpayable", type: "function"},
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_merkleTreeDepth", type: "uint256"},
                {internalType: "uint256", name: "_merkleTreeRoot", type: "uint256"},
                {internalType: "uint256", name: "_nullifier", type: "uint256"},
                {internalType: "uint256", name: "_feedback", type: "uint256"},
                {internalType: "string", name: "_content", type: "string"},
                {internalType: "uint256[8]", name: "_points", type: "uint256[8]"},
            ],
            name: "createMainPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_mainPostId", type: "uint256"},
                {internalType: "uint256", name: "_merkleTreeDepth", type: "uint256"},
                {internalType: "uint256", name: "_merkleTreeRoot", type: "uint256"},
                {internalType: "uint256", name: "_nullifier", type: "uint256"},
                {internalType: "uint256", name: "_feedback", type: "uint256"},
                {internalType: "string", name: "_content", type: "string"},
                {internalType: "uint256[8]", name: "_points", type: "uint256[8]"},
            ],
            name: "createSubPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_postId", type: "uint256"},
                {internalType: "bool", name: "_isUpvote", type: "bool"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "deleteVoteOnPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_postId", type: "uint256"},
                {internalType: "uint256", name: "_subPostId", type: "uint256"},
                {internalType: "bool", name: "_isUpvote", type: "bool"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "deleteVoteOnSubPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {inputs: [], name: "groupCounter", outputs: [{internalType: "uint256", name: "", type: "uint256"}], stateMutability: "view", type: "function"},
        {inputs: [{internalType: "uint256", name: "groupId", type: "uint256"}], name: "groupNames", outputs: [{internalType: "string", name: "name", type: "string"}], stateMutability: "view", type: "function"},
        {inputs: [{internalType: "uint256", name: "groupId", type: "uint256"}], name: "groupPostCounters", outputs: [{internalType: "uint256", name: "postIDCounter", type: "uint256"}], stateMutability: "view", type: "function"},
        {
            inputs: [
                {internalType: "uint256", name: "groupId", type: "uint256"},
                {internalType: "uint256", name: "ombuPostId", type: "uint256"},
            ],
            name: "groupPosts",
            outputs: [
                {internalType: "string", name: "content", type: "string"},
                {internalType: "uint32", name: "timestamp", type: "uint32"},
                {internalType: "uint32", name: "upvotes", type: "uint32"},
                {internalType: "uint32", name: "downvotes", type: "uint32"},
            ],
            stateMutability: "view",
            type: "function",
        },
        {inputs: [{internalType: "uint256", name: "", type: "uint256"}], name: "groups", outputs: [{internalType: "uint256", name: "", type: "uint256"}], stateMutability: "view", type: "function"},
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "isGroupMember",
            outputs: [{internalType: "bool", name: "", type: "bool"}],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "groupId", type: "uint256"},
                {internalType: "uint256", name: "ombuPostId", type: "uint256"},
                {internalType: "uint256", name: "subPostId", type: "uint256"},
            ],
            name: "postSubPosts",
            outputs: [
                {internalType: "string", name: "content", type: "string"},
                {internalType: "uint32", name: "timestamp", type: "uint32"},
                {internalType: "uint32", name: "upvotes", type: "uint32"},
                {internalType: "uint32", name: "downvotes", type: "uint32"},
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
                {internalType: "uint256[]", name: "_merkleProofSiblings", type: "uint256[]"},
            ],
            name: "removeMember",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {inputs: [], name: "semaphore", outputs: [{internalType: "contract ISemaphore", name: "", type: "address"}], stateMutability: "view", type: "function"},
        {
            inputs: [
                {internalType: "address", name: "user", type: "address"},
                {internalType: "uint256", name: "groupId", type: "uint256"},
                {internalType: "uint256", name: "postId", type: "uint256"},
            ],
            name: "userPostVotes",
            outputs: [{internalType: "bool", name: "hasVoted", type: "bool"}],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                {internalType: "address", name: "user", type: "address"},
                {internalType: "uint256", name: "groupId", type: "uint256"},
                {internalType: "uint256", name: "postId", type: "uint256"},
                {internalType: "uint256", name: "subPostId", type: "uint256"},
            ],
            name: "userSubPostVotes",
            outputs: [{internalType: "bool", name: "hasVoted", type: "bool"}],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_postId", type: "uint256"},
                {internalType: "bool", name: "_isUpvote", type: "bool"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "voteOnPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [
                {internalType: "uint256", name: "_groupId", type: "uint256"},
                {internalType: "uint256", name: "_postId", type: "uint256"},
                {internalType: "uint256", name: "_subPostId", type: "uint256"},
                {internalType: "bool", name: "_isUpvote", type: "bool"},
                {internalType: "uint256", name: "_identityCommitment", type: "uint256"},
            ],
            name: "voteOnSubPost",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
    ],
};

// Mapeo de categorías del contrato a nuestro sistema
export const CATEGORY_MAPPING = {
    0: "queja",
    1: "opinion",
    2: "sugerencia",
    3: "vida-universitaria",
};

export const REVERSE_CATEGORY_MAPPING = {
    queja: 0,
    opinion: 1,
    sugerencia: 2,
    "vida-universitaria": 3,
};

export const categories = [
    {value: "all", label: "Todas las categorías", color: "gray"},
    {value: "queja", label: "Queja", color: "red"},
    {value: "opinion", label: "Opinión", color: "blue"},
    {value: "sugerencia", label: "Sugerencia", color: "green"},
    {value: "vida-universitaria", label: "Vida Universitaria", color: "violet"},
];

export const DEFAULT_GROUP_ID = 0;
