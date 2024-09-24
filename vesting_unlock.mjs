import cbor from "cbor";
import {
  resolvePaymentKeyHash,
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  resolveDataHash,
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

async function fetchUtxo(addr) {
  const utxos = await blockchainProvider.fetchAddressUTxOs(addr);
  return utxos.find((utxo) => {
    return utxo.input.txHash == 'c9520ed52c4674192fa42c046d5300ac7d44494471803c5724ef9dd6018c344a';
  });
}

const utxo = await fetchUtxo(resolvePlutusScriptAddress(script, 0))

const b_address = (await beneficiary_wallet.getUsedAddresses())[0];

const o_address = (await owner_wallet.getUsedAddresses())[0];

const beneficiary = resolvePaymentKeyHash(b_address)
const owner = resolvePaymentKeyHash(o_address)

const currentTime = new Date().getTime();
const laterTime = new Date(currentTime + 2 * 60 * 60 * 1000).getTime();
const datum = {
  alternative: 0,
  fields: [owner, beneficiary, laterTime]
};

const redeemer = {
  data: {
    alternative: 0,
   fields: ['redeem_stock_options'],
  },
}


// fetch input UTXO
  
  const unsignedTx = await new Transaction({ initiator: beneficiary_wallet })
  .redeemValue({
    value: utxo,
    script: script,
    datum: datum,
    redeemer: redeemer
  }).sendValue(b_address, utxo)
  .setRequiredSigners([b_address])
  .build();

  const signedTx = await beneficiary_wallet.signTx(unsignedTx, true);
  try {
    const txHash = await beneficiary_wallet.submitTx(signedTx);
    console.log(`1 tADA unlocked from the contract at:
      Tx ID: ${txHash}
  `);
  } catch (error) {
    console.log(error);
  }
   