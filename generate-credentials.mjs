import { MeshWallet } from '@meshsdk/core';
import fs from 'node:fs';
 
const owner_secret_key = MeshWallet.brew(true);
const beneficiary_secret_key = MeshWallet.brew(true);
 
fs.writeFileSync('owner.sk', owner_secret_key);
fs.writeFileSync('beneficiary.sk', beneficiary_secret_key);
 
const owner_wallet = new MeshWallet({
  networkId: 0,
  key: {
    type: 'root',
    bech32: owner_secret_key,
  },
});

const beneficiary_wallet = new MeshWallet({
  networkId: 0,
  key: {
    type: 'root',
    bech32: beneficiary_secret_key,
  },
});

 
fs.writeFileSync('owner.addr', owner_wallet.getUnusedAddresses()[0]);
fs.writeFileSync('beneficiary.addr', beneficiary_wallet.getUnusedAddresses()[0]);