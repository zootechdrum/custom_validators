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
    let must_say_hello = redeemer.msg == "redeem_gift_card"
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

test must_start_after_succeed_when_lower_bound_is_after() {
  must_start_after(interval.after(2), 1)
}
 
test must_start_after_succeed_when_lower_bound_is_equal() {
  must_start_after(interval.after(2), 2)
}
 
test must_start_after_fail_when_lower_bound_is_before() {
  !must_start_after(interval.after(2), 3)
}