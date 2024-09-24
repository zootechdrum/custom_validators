use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use aiken/collection/list
use cardano/transaction.{Transaction, ValidityRange, OutputReference}
use aiken/interval.{Finite, Interval, IntervalBound}
 
pub type Datum {
  // / POSIX time in millisecond, e.g. 1672843961000
  /// Owner's credentials
  lock_until: POSIXTime,

  owner: VerificationKeyHash,
  /// Beneficiary's credentials
  beneficiary: VerificationKeyHash,
}

pub type Redeemer {
  msg: ByteArray,
}
 
type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>
 
type POSIXTime =
  Int

validator vesting {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _utxo: OutputReference,
    self: Transaction
  ) {

    expect Some(Datum {owner, beneficiary, lock_until}) = datum

    let must_be_signed_by_owner = list.has(self.extra_signatories, owner)
    let must_be_signed_by_beneficiary = list.has(self.extra_signatories, beneficiary)
    let must_say_hello = redeemer.msg == "redeem_stock_options"
    let free_to_use = must_start_after(self.validity_range, lock_until)

    // Combine conditions directly
    (must_say_hello && must_be_signed_by_owner) || must_say_hello && must_be_signed_by_beneficiary && free_to_use
  }
}
 
fn must_start_after(range: ValidityRange, lock_expiration_time: POSIXTime) {
  when range.lower_bound.bound_type is {
    Finite(tx_earliest_time) -> lock_expiration_time <= tx_earliest_time
    _ -> False
  }
}

test vesting() {
  let datum =
    Datum { 
            owner: #"00000000000000000000000000000000000000000000000000000000",
            beneficiary: #"00000000000000000000000000000000000000000000000000000000",
            lock_until: 1727203809
            }
 
  let redeemer =
    Redeemer { msg: "redeem_stock_options" }
 
  let placeholder_utxo =
    OutputReference { transaction_id: "", output_index: 0 }
 
  vesting.spend(
    Some(datum),
    redeemer,
    placeholder_utxo,
    Transaction {
    ..transaction.placeholder,
    extra_signatories: [datum.owner]
    }
  )
}