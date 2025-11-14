// src/services/contract.js
import { CONTRACT_CONFIG as IMPORTED_CONTRACT_CONFIG, DEFAULT_GROUP_ID } from '../config/constants.js';
import OmbuArtifact from '../contracts/Ombu.json';
// Re-export DEFAULT_GROUP_ID from constants
export { DEFAULT_GROUP_ID };

export const CONTRACT_CONFIG = {
    address: IMPORTED_CONTRACT_CONFIG.address,
    abi: OmbuArtifact.abi,
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

