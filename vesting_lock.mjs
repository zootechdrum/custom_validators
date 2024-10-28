import { mConStr0 } from "@meshsdk/common";
import {
  deserializeAddress,
} from "@meshsdk/core";
import {getTxBuilder, owner_wallet, beneficiary_wallet, scriptAddr } from "./common/common.mjs";

async function depositFundTx(amount, lockUntilTimeStampMs) {
  const utxos = await owner_wallet.getUtxos();
  const { pubKeyHash: ownerPubKeyHash } = deserializeAddress(
    owner_wallet.addresses.baseAddressBech32
  );
  const { pubKeyHash: beneficiaryPubKeyHash } = deserializeAddress(
    beneficiary_wallet.addresses.baseAddressBech32
  );

  const txBuilder = getTxBuilder();
  await txBuilder
    .txOut(scriptAddr, amount)
    .txOutInlineDatumValue(
      mConStr0([lockUntilTimeStampMs, ownerPubKeyHash, beneficiaryPubKeyHash])
    )
    .changeAddress(owner_wallet.addresses.baseAddressBech32)
    .selectUtxosFrom(utxos)
    .complete();
  return txBuilder.txHex;
}
async function main() {
  const assets = [
    {
      unit: "lovelace",
      quantity: "10000000",
    },
  ];

  const lockUntilTimeStamp = new Date();
  lockUntilTimeStamp.setMinutes(lockUntilTimeStamp.getMinutes() + 1);

  const unsignedTx = await depositFundTx(
    assets,
    lockUntilTimeStamp.getTime()
  );

  const signedTx = await owner_wallet.signTx(unsignedTx);
  const txHash = await owner_wallet.submitTx(signedTx);
  console.log("txHash", txHash);
}

main();