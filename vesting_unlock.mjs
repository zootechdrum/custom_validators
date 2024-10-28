import {
  deserializeAddress,
  deserializeDatum,
  unixTimeToEnclosingSlot,
  SLOT_CONFIG_NETWORK,
} from "@meshsdk/core";
import fs from "node:fs";

import {getTxBuilder, beneficiary_wallet, scriptAddr, scriptCbor,blockchainProvider } from "./common/common.mjs";


async function withdrawFundTx(vestingUtxo) {
  const utxos = await beneficiary_wallet.getUtxos();
  const beneficiaryAddress = beneficiary_wallet.addresses.baseAddressBech32;
  const collateral  = await beneficiary_wallet.getCollateral();
  const collateralInput = collateral[0].input;
  const collateralOutput = collateral[0].output;

  const { pubKeyHash: beneficiaryPubKeyHash } = deserializeAddress(
    beneficiary_wallet.addresses.baseAddressBech32
  );

  const datum = deserializeDatum(vestingUtxo.output.plutusData);

  const invalidBefore =
    unixTimeToEnclosingSlot(
      Math.min(datum.fields[0].int, Date.now() - 19000),
      SLOT_CONFIG_NETWORK.preview
    ) + 1;

  const txBuilder = getTxBuilder();
  await txBuilder
    .spendingPlutusScript("V3")
    .txIn(
      vestingUtxo.input.txHash,
      vestingUtxo.input.outputIndex,
      vestingUtxo.output.amount,
      scriptAddr
    )
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .txInScript(scriptCbor)
    .txOut(beneficiaryAddress, [])
    .txInCollateral(
      collateralInput.txHash,
      collateralInput.outputIndex,
      collateralOutput.amount,
      collateralOutput.address
    )
    .invalidBefore(invalidBefore)
    .requiredSignerHash(beneficiaryPubKeyHash)
    .changeAddress(beneficiaryAddress)
    .selectUtxosFrom(utxos)
    .complete();
  return txBuilder.txHex;
}

async function main() {
  const txHashFromDesposit =
  //This is the hash of the tx that we want to unlock
    "ed7559c7aa5a8bfcba9ec8d75fb2ee1902da8b909722ca4726261d35e8250645";

  const utxo = await getUtxoByTxHash(txHashFromDesposit);

  if (utxo === undefined) throw new Error("UTxO not found");

  const unsignedTx = await withdrawFundTx(utxo);

  const signedTx = await beneficiary_wallet.signTx(unsignedTx);

  const txHash = await beneficiary_wallet.submitTx(signedTx);
  console.log("txHash", txHash);
}

async function getUtxoByTxHash(txHash) {
  const utxos = await blockchainProvider.fetchUTxOs(txHash);
  if (utxos.length === 0) {
    throw new Error("UTxO not found");
  }
  return utxos[0];
}

main();
