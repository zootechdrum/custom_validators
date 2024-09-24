import cbor from 'cbor';
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
} from '@meshsdk/core';
import fs from 'node:fs';
   
const blockchainProvider = new BlockfrostProvider("previewLt92UHMcVeEcdEZCQvfo0xlbQyFsuQKm");

const owner_wallet = new MeshWallet({
  networkId: 0,
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: fs.readFileSync('owner.sk').toString(),
  },
});

const beneficiary_wallet = new MeshWallet({
  networkId: 0,
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'root',
    bech32: fs.readFileSync('beneficiary.sk').toString(),
  },
});

const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
 
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};

const owner = resolvePaymentKeyHash((await owner_wallet.getUsedAddresses())[0]);
const beneficiary = resolvePaymentKeyHash((await beneficiary_wallet.getUsedAddresses())[0]);

const datum = {
  value :{
    alternative: 0,
    fields: [owner, beneficiary, `${1672843961000n}`]
  },
  redeemer: {
    data: {
      alternative: 0,
     fields: ['redeem_stock_options'],
    },
  }
}

const txLock = await new Transaction({ initiator: owner_wallet }).sendLovelace(
    {
      address: resolvePlutusScriptAddress(script, 0),
      datum,
    },
    "1000000"
  ).build();
 
const signedTx = await owner_wallet.signTx(txLock);
 
const txHash = await owner_wallet.submitTx(signedTx);
 
console.log(`1 tADA locked into the contract at:
  Tx ID: ${txHash}
  Datum: ${JSON.stringify(datum)}
`);