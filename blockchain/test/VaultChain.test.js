const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultChain Smart Contract", function () {
  let vaultChain;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const VaultChainFactory = await ethers.getContractFactory("VaultChain");
    vaultChain = await VaultChainFactory.deploy();
  });

  describe("Storing and Retrieving Password References", function () {
    it("should allow a user to store a password reference and retrieve it", async function () {
      const ipfsHash = "QmXoypizjW3WknFixtdKLw51xx5v25deY25Ep6VAov65xx";
      const metadata = "Encrypted Website Title & Username";

      await expect(vaultChain.storePasswordHash(ipfsHash, metadata))
        .to.emit(vaultChain, "PasswordStored")
        .withArgs(owner.address, 0, ipfsHash, anyValue => true);

      const [records, indices] = await vaultChain.getPasswordHashes();
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal(ipfsHash);
      expect(records[0].metadata).to.equal(metadata);
      expect(records[0].isDeleted).to.equal(false);
      expect(indices[0]).to.equal(0);
    });

    it("should partition records between different users", async function () {
      const ipfsHash1 = "QmUser1Hash";
      const ipfsHash2 = "QmUser2Hash";

      await vaultChain.storePasswordHash(ipfsHash1, "User1Meta");
      await vaultChain.connect(addr1).storePasswordHash(ipfsHash2, "User2Meta");

      const [recordsOwner] = await vaultChain.getPasswordHashes();
      expect(recordsOwner.length).to.equal(1);
      expect(recordsOwner[0].ipfsHash).to.equal(ipfsHash1);

      const [recordsAddr1] = await vaultChain.connect(addr1).getPasswordHashes();
      expect(recordsAddr1.length).to.equal(1);
      expect(recordsAddr1[0].ipfsHash).to.equal(ipfsHash2);
    });
  });

  describe("Updating Records", function () {
    it("should allow a user to update their stored password reference", async function () {
      const ipfsHash = "QmInitialHash";
      const newIpfsHash = "QmUpdatedHash";
      const newMetadata = "Updated Metadata";

      await vaultChain.storePasswordHash(ipfsHash, "InitialMeta");

      await expect(vaultChain.updatePassword(0, newIpfsHash, newMetadata))
        .to.emit(vaultChain, "PasswordUpdated")
        .withArgs(owner.address, 0, newIpfsHash, anyValue => true);

      const [records] = await vaultChain.getPasswordHashes();
      expect(records[0].ipfsHash).to.equal(newIpfsHash);
      expect(records[0].metadata).to.equal(newMetadata);
    });

    it("should revert if index is out of bounds", async function () {
      await expect(vaultChain.updatePassword(0, "hash", "meta"))
        .to.be.revertedWith("VaultChain: Index out of bounds");
    });
  });

  describe("Deleting Records", function () {
    it("should allow soft deleting a password record", async function () {
      await vaultChain.storePasswordHash("QmHash1", "Meta1");
      await vaultChain.storePasswordHash("QmHash2", "Meta2");

      await expect(vaultChain.deletePassword(0))
        .to.emit(vaultChain, "PasswordDeleted")
        .withArgs(owner.address, 0, anyValue => true);

      const [records, indices] = await vaultChain.getPasswordHashes();
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal("QmHash2");
      expect(indices[0]).to.equal(1);
    });

    it("should fail if trying to double delete a record", async function () {
      await vaultChain.storePasswordHash("QmHash1", "Meta1");
      await vaultChain.deletePassword(0);

      await expect(vaultChain.deletePassword(0))
        .to.be.revertedWith("VaultChain: Record already deleted");
    });
  });
});
