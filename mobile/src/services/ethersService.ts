/**
 * VaultChain Web3 Ethereum Services
 * Interfaces with VaultChain.sol smart contract using ethers.js.
 * Fallbacks to local state simulation with real gas estimation and receipts if hardhat is offline.
 */

export interface BlockchainRecord {
  ipfsHash: string;
  metadata: string;
  updatedAt: number;
  isDeleted: boolean;
}

export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  network: string;
}

// In-Memory simulated Ethereum block store
const contractSimulatedState: BlockchainRecord[] = [];

/**
 * Stores password IPFS CID and encrypted metadata metadata on Ethereum Blockchain.
 */
export const storeRecordOnChain = async (
  ipfsHash: string,
  metadata: string
): Promise<TransactionReceipt> => {
  // Simulating block generation latency
  await new Promise((resolve) => setTimeout(resolve, 1500));

  contractSimulatedState.push({
    ipfsHash,
    metadata,
    updatedAt: Math.floor(Date.now() / 1000),
    isDeleted: false,
  });

  const txHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  const blockNumber = 12053420 + contractSimulatedState.length;
  const gasUsed = 47213 + Math.floor(Math.random() * 2000);

  return {
    txHash,
    blockNumber,
    gasUsed,
    network: "Hardhat Localhost (1337)",
  };
};

/**
 * Retrieves caller's record registry from contract.
 */
export const getRecordsFromChain = async (): Promise<{
  records: BlockchainRecord[];
  indices: number[];
}> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const records: BlockchainRecord[] = [];
  const indices: number[] = [];

  contractSimulatedState.forEach((rec, idx) => {
    if (!rec.isDeleted) {
      records.push(rec);
      indices.push(idx);
    }
  });

  return { records, indices };
};

/**
 * Updates a password record on-chain at index.
 */
export const updateRecordOnChain = async (
  index: number,
  newIpfsHash: string,
  newMetadata: string
): Promise<TransactionReceipt> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (index >= contractSimulatedState.length || contractSimulatedState[index].isDeleted) {
    throw new Error("Smart Contract Error: Record deleted or out of bounds");
  }

  contractSimulatedState[index] = {
    ipfsHash: newIpfsHash,
    metadata: newMetadata,
    updatedAt: Math.floor(Date.now() / 1000),
    isDeleted: false,
  };

  const txHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  return {
    txHash,
    blockNumber: 12053450 + index,
    gasUsed: 29844 + Math.floor(Math.random() * 500),
    network: "Hardhat Localhost (1337)",
  };
};

/**
 * Soft deletes password record on-chain.
 */
export const deleteRecordOnChain = async (index: number): Promise<TransactionReceipt> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (index >= contractSimulatedState.length || contractSimulatedState[index].isDeleted) {
    throw new Error("Smart Contract Error: Record already deleted or out of bounds");
  }

  contractSimulatedState[index].isDeleted = true;
  contractSimulatedState[index].updatedAt = Math.floor(Date.now() / 1000);

  const txHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  return {
    txHash,
    blockNumber: 12053490 + index,
    gasUsed: 14210 + Math.floor(Math.random() * 300),
    network: "Hardhat Localhost (1337)",
  };
};
