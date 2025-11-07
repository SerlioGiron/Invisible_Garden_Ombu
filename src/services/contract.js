// src/services/contract.js
export const CONTRACT_CONFIG = {
    address: "0xB4E6E678Bc83875891671EC70337aD08E1dD66d7",
    abi: [
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