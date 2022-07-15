import { ethers } from "ethers";

export const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const NFT_MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
export const NFT_MINTER_ROLE_MANAGER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE_MANAGER"));
export const VAULT_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VAULT_MANAGER_ROLE"));
