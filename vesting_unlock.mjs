import cbor from "cbor";
import {
  resolvePlutusScriptAddress,
  BlockfrostProvider,
  MeshWallet,
  Transaction,
  
} from '@meshsdk/core';

import {
  deserializePlutusData
} from '@meshsdk/core-csl'
import fs from 'node:fs';

const blockchainProvider = new BlockfrostProvider('previewTcK4lCRJfj0OvZSeGjANO5DWe3BNYMCR');


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

// const utxos = await beneficiary_wallet.getUtxos()

const beneficiaryAddress = (await beneficiary_wallet.getUsedAddresses())[0];
const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
 
const script = {
  code: cbor
    .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};


let address = resolvePlutusScriptAddress(script, 0);

const txHashFromDeposit = "95e8cfa40ade79399da420a39223a23d380b2487143e4505353938a83f923a16";

const utxos = await blockchainProvider.fetchUTxOs(txHashFromDeposit) 
const vestingUtxo = utxos[0];

const collateral = await beneficiary_wallet.getCollateral()

const {input: collateralInput, output: collateralOutput} = collateral[0];

const datum = deserializePlutusData(vestingUtxo.output.plutusData);
console.log(datum)
