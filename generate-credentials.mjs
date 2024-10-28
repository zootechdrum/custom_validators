import { MeshWallet } from '@meshsdk/core';
import fs from 'node:fs';

// Generate secret keys for both wallets
const owner_secret_key = MeshWallet.brew(true);
const beneficiary_secret_key = MeshWallet.brew(true);

// Initialize the owner wallet with the generated secret key
const owner_wallet = new MeshWallet({
  networkId: 0,
  key: {
    type: 'root',
    bech32: owner_secret_key,
  },
});

// Initialize the beneficiary wallet with its secret key, using the same setup
const beneficiary_wallet = new MeshWallet({
  networkId: 0,
  key: {
    type: 'root',
    bech32: beneficiary_secret_key,
  },
});

// save keys to files
fs.writeFileSync('owner.sk', owner_secret_key);
fs.writeFileSync('beneficiary.sk', beneficiary_secret_key);

// Save unused addresses to files 
fs.writeFileSync('owner.addr', owner_wallet.getUnusedAddresses()[0]);
fs.writeFileSync('beneficiary.addr', beneficiary_wallet.getUnusedAddresses()[0]);