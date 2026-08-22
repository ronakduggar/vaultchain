// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultChain
 * @dev Decentralized secure registry mapping wallet addresses to encrypted IPFS CIDs.
 * This contract enforces that only the caller (owner of the keys) can view and modify their entries.
 */
contract VaultChain {
    
    struct Record {
        string ipfsHash;    // IPFS CID of the encrypted credentials payload
        string metadata;    // Encrypted label/domain identifier (optional)
        uint256 updatedAt;  // Unix timestamp of the operation
        bool isDeleted;     // Soft-delete flag for sync and integrity
    }

    // Mapping from wallet address to the list of user records
    mapping(address => Record[]) private userRecords;

    // Events for dashboard and audit logs
    event PasswordStored(address indexed user, uint256 indexed index, string ipfsHash, uint256 timestamp);
    event PasswordUpdated(address indexed user, uint256 indexed index, string newIpfsHash, uint256 timestamp);
    event PasswordDeleted(address indexed user, uint256 indexed index, uint256 timestamp);

    /**
     * @notice Store a new password record reference on-chain
     * @param _ipfsHash The IPFS CID containing the encrypted password object
     * @param _metadata Encrypted metadata (like website name or index helper)
     */
    function storePasswordHash(string calldata _ipfsHash, string calldata _metadata) external {
        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            metadata: _metadata,
            updatedAt: block.timestamp,
            isDeleted: false
        });
        
        userRecords[msg.sender].push(newRecord);
        uint256 index = userRecords[msg.sender].length - 1;
        
        emit PasswordStored(msg.sender, index, _ipfsHash, block.timestamp);
    }

    /**
     * @notice Get all active (non-deleted) password records for the caller
     * @return records The array of active Records
     * @return indices The original indices of these records in the user's array
     */
    function getPasswordHashes() external view returns (Record[] memory records, uint256[] memory indices) {
        Record[] storage allRecords = userRecords[msg.sender];
        uint256 count = 0;
        
        // Count active records
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (!allRecords[i].isDeleted) {
                count++;
            }
        }
        
        Record[] memory activeRecords = new Record[](count);
        uint256[] memory activeIndices = new uint256[](count);
        uint256 indexCounter = 0;
        
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (!allRecords[i].isDeleted) {
                activeRecords[indexCounter] = allRecords[i];
                activeIndices[indexCounter] = i;
                indexCounter++;
            }
        }
        
        return (activeRecords, activeIndices);
    }

    /**
     * @notice Update an existing password record
     * @param _index The index of the record in the caller's array
     * @param _newIpfsHash The new IPFS CID containing the updated encrypted password object
     * @param _newMetadata Updated encrypted metadata
     */
    function updatePassword(uint256 _index, string calldata _newIpfsHash, string calldata _newMetadata) external {
        require(_index < userRecords[msg.sender].length, "VaultChain: Index out of bounds");
        require(!userRecords[msg.sender][_index].isDeleted, "VaultChain: Record is deleted");

        Record storage record = userRecords[msg.sender][_index];
        record.ipfsHash = _newIpfsHash;
        record.metadata = _newMetadata;
        record.updatedAt = block.timestamp;

        emit PasswordUpdated(msg.sender, _index, _newIpfsHash, block.timestamp);
    }

    /**
     * @notice Soft-delete a password record to maintain sync indexes
     * @param _index The index of the record in the caller's array
     */
    function deletePassword(uint256 _index) external {
        require(_index < userRecords[msg.sender].length, "VaultChain: Index out of bounds");
        require(!userRecords[msg.sender][_index].isDeleted, "VaultChain: Record already deleted");

        userRecords[msg.sender][_index].isDeleted = true;
        userRecords[msg.sender][_index].updatedAt = block.timestamp;

        emit PasswordDeleted(msg.sender, _index, block.timestamp);
    }

    /**
     * @notice Get a single record by index
     * @param _index The index of the record
     */
    function getPasswordByIndex(uint256 _index) external view returns (Record memory) {
        require(_index < userRecords[msg.sender].length, "VaultChain: Index out of bounds");
        return userRecords[msg.sender][_index];
    }
}
