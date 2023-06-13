module hamsterpocket::event {
    use std::string::String;

    // define update trading stats event
    struct UpdateTradingStatsEvent has drop, copy {
        id: String,
        actor: address,
        swapped_base_token_amount: u64,
        received_target_token_amount: u64,
        reason: String
    }

    // define update close position event
    struct UpdateClosePositionEvent has drop, copy {
        id: String,
        actor: address,
        swapped_target_token_amount: u64,
        received_base_token_amount: u64,
        reason: String
    }

    // define update pocket deposit event
    struct UpdateDepositStatsEvent has drop, copy {
        id: String,
        actor: address,
        amount: u64,
        token_address: u64,
        reason: String
    }

    // define udpate withdrawal stats event
    struct UpdateWithdrawalStatsEvent has drop, copy {
        id: String,
        actor: address,
        amount: u64,
        token_address: u64,
        reason: String
    }
}