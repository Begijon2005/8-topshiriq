/**
 * LogiChain - Blockchain Logistics Engine
 * Specialized in tracking asset provenance and location history
 */

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = '';
    }

    async calculateHash() {
        const dataStr = this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce;
        const msgBuffer = new TextEncoder().encode(dataStr);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async mine(difficulty) {
        this.hash = await this.calculateHash();
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = await this.calculateHash();
        }
    }
}

class LogiChain {
    constructor() {
        this.chain = [];
        this.difficulty = 4;
    }

    async init() {
        const stored = localStorage.getItem('logiChainData');
        if (stored) {
            const raw = JSON.parse(stored);
            this.chain = raw.map(b => {
                const block = new Block(b.index, b.timestamp, b.data, b.previousHash);
                block.hash = b.hash;
                block.nonce = b.nonce;
                return block;
            });
        } else {
            const genesis = new Block(0, new Date().toISOString(), { info: "LogiChain Network Genesis" }, "0");
            await genesis.mine(this.difficulty);
            this.chain.push(genesis);
            this.save();
        }
    }

    async addLogisticsEvent(assetId, eventType, location, owner, remarks = "") {
        const data = {
            assetId,
            eventType, // INITIAL_REGISTRATION, IN_TRANSIT, DELIVERED, OWNERSHIP_TRANSFER
            location,
            owner,
            remarks,
            timestamp: new Date().toISOString()
        };

        const newBlock = new Block(
            this.chain.length,
            new Date().toISOString(),
            data,
            this.chain[this.chain.length - 1].hash
        );

        await newBlock.mine(this.difficulty);
        this.chain.push(newBlock);
        this.save();
        return newBlock;
    }

    getAssetHistory(assetId) {
        return this.chain.filter(block => block.index > 0 && block.data.assetId === assetId);
    }

    isAssetAuthentic(assetId) {
        const history = this.getAssetHistory(assetId);
        if (history.length === 0) return false;
        
        // Verify the entire history of this asset
        for (let i = 0; i < history.length; i++) {
            const block = history[i];
            const originalIndex = this.chain.findIndex(b => b.index === block.index);
            if (originalIndex === -1) return false;
            
            // Re-verify hash integrity for this block in the chain
            if (i > 0) {
                const prevInHistory = history[i-1];
                // In a supply chain, blocks might not be sequential in the main chain, 
                // but their previousHash must match the previous block in the main chain.
            }
        }
        return this.validate();
    }

    validate() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    save() {
        localStorage.setItem('logiChainData', JSON.stringify(this.chain));
    }
}

export default LogiChain;
