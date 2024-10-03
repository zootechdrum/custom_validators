

// import cbor from 'cbor';
// import {
//   resolvePaymentKeyHash,
//   BlockfrostProvider,
//   MeshWallet,
//   MeshTxBuilder,
//   deserializeDatum,
//   resolvePlutusScriptAddress,
//   scriptAddress
// } from '@meshsdk/core';
// import fs from 'node:fs';
// import { MeshVestingContract } from '@meshsdk/contract';
// import { TxBuilderConstants } from '@emurgo/cardano-serialization-lib-nodejs';
   
// const blockchainProvider = new BlockfrostProvider('previewTcK4lCRJfj0OvZSeGjANO5DWe3BNYMCR');

// const owner_wallet = new MeshWallet({
//   networkId: 0,
//   fetcher: blockchainProvider,
//   submitter: blockchainProvider,
//   key: {
//     type: 'root',
//     bech32: fs.readFileSync('owner.sk').toString(),
//   },
// });

// // const utxos = await owner_wallet.getUtxos()

// const beneficiary_wallet = new MeshWallet({
//   networkId: 0,
//   fetcher: blockchainProvider,
//   submitter: blockchainProvider,
//   key: {
//     type: 'root',
//     bech32: fs.readFileSync('beneficiary.sk').toString(),
//   },
// });

// const blueprint = JSON.parse(fs.readFileSync('./plutus.json'));
 
// const script = {
//   code: cbor
//     .encode(Buffer.from(blueprint.validators[0].compiledCode, "hex"))
//     .toString("hex"),
//   version: "V3",
// };

// // const ownerAddress = (await owner_wallet.getUsedAddresses())[0];
// const beneficiaryAddress = (await beneficiary_wallet.getUsedAddresses())[0];

// const txBuilder = new MeshTxBuilder({
//   fetcher: blockchainProvider,
//   submitter: blockchainProvider,
// });

// let address = resolvePlutusScriptAddress(script, 0);

// const datum = {
//     alternative: 0,
//     fields: [ownerAddress,beneficiaryAddress, 1672843961000],
// };



// await txBuilder
//   .txOut(
    
//       resolvePlutusScriptAddress(script, 0),
//       [{ unit: "lovelace", quantity: "2000000" }],
    
//   )
//   .txOutInlineDatumValue([datum])
//   .changeAddress('addr_test1qzd4xtlqnwmu7kg8zgs06ztt4y4w6hgs2akf00kz77k6c3fsdeha0anqqa473v4z8sg5tvu8ygchzv8vwf9d60m2087q6q0jtp')
//   .selectUtxosFrom(utxos)
//   .complete();
 
// const unsignedTx = txBuilder.txHex;
// const signedTx = await owner_wallet.signTx(unsignedTx);
// const txHash = await owner_wallet.submitTx(signedTx);
//-----------------------------------------------------------------------------withdraw
import cbor from 'cbor';
import {
  resolvePaymentKeyHash,
  BlockfrostProvider,
  MeshWallet,
  MeshTxBuilder,
  deserializeDatum,
  resolvePlutusScriptAddress,
  scriptAddress
} from '@meshsdk/core';
import fs from 'node:fs';
import { MeshVestingContract } from '@meshsdk/contract';
import { TxBuilderConstants } from '@emurgo/cardano-serialization-lib-nodejs';
   
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

// const utxos = await owner_wallet.getUtxos()

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

// const ownerAddress = (await owner_wallet.getUsedAddresses())[0];
const beneficiaryAddress = (await beneficiary_wallet.getUsedAddresses())[0];

const txBuilder = new MeshTxBuilder({
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
});

let address = resolvePlutusScriptAddress(script, 0);


const withdrawalUtxos = await blockchainProvider.fetchUTxOs('8dc36ee6cdaff23078587715d574c10c665c15df106faf191612a461e155d4c2');
const redeemerValue = {
  msg: "redeem_stock_options"
};
const vestingUtxo = withdrawalUtxos[0]; 

const datum = deserializeDatum(vestingUtxo.output.plutusData);
const collateral = await beneficiary_wallet.getCollateral();
const beneficiary_utxo = await beneficiary_wallet.getUtxos();
const { input: collateralInput, output: collateralOutput } = collateral[0];

const y = txBuilder 
.spendingPlutusScript('V3')
  .txIn(
    vestingUtxo.input.txHash,
    vestingUtxo.input.outputIndex,
    vestingUtxo.output.amount,
    address
  )
  .spendingReferenceTxInInlineDatumPresent()
  .spendingReferenceTxInRedeemerValue(redeemerValue,"JSON")  
  .txInScript(script)
  .txOut(beneficiaryAddress,[])
  .txInCollateral(
    collateralInput.txHash,
    collateralInput.outputIndex,
    collateralOutput.amount,
    collateralOutput.address,
  )
  .invalidBefore(1672843961001)
  .changeAddress(beneficiaryAddress)
  .selectUtxosFrom(beneficiary_utxo)
  .complete();