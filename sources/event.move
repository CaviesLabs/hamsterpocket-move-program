module hamsterpocket::event {
    use std::string::String;
    use aptos_framework::event;
    use hamsterpocket::pocket::Pocket;

    // define update trading stats event
    struct UpdatePocketStatus has store, drop, copy {
        id: String,
        actor: address,
        status: u64,
        reason: String
    }

    // define update trading stats event
    struct UpdatePocketEvent has store, drop, copy {
        id: String,
        actor: address,
        pocket: Pocket,
        reason: String
    }

    // define update trading stats event
    struct UpdateTradingStatsEvent has store, drop, copy {
        id: String,
        actor: address,
        swapped_base_token_amount: u64,
        base_token_address: address,
        received_target_token_amount: u64,
        target_token_address: address,
        reason: String
    }

    // define update close position event
    struct UpdateClosePositionEvent has store, drop, copy {
        id: String,
        actor: address,
        swapped_target_token_amount: u64,
        target_token_address: address,
        received_base_token_amount: u64,
        base_token_address: address,
        reason: String
    }

    // define update pocket deposit event
    struct UpdateDepositStatsEvent has store, drop, copy {
        id: String,
        actor: address,
        amount: u64,
        token_address: u64,
        reason: String
    }

    // define udpate withdrawal stats event
    struct UpdateWithdrawalStatsEvent has store, drop, copy {
        id: String,
        actor: address,
        base_token_amount: u64,
        base_token_address: address,
        target_token_amount: u64,
        target_token_address: address,
        reason: String
    }

    struct EventManager has key {
        create_pocket: event::EventHandle<UpdatePocketEvent>,
        update_pocket: event::EventHandle<UpdatePocketEvent>,
        update_pocket_status: event::EventHandle<UpdatePocketStatus>,
        update_trading_stats: event::EventHandle<UpdateTradingStatsEvent>,
        update_close_position: event::EventHandle<UpdateClosePositionEvent>,
        update_deposit_stats: event::EventHandle<UpdateDepositStatsEvent>,
        update_withdrawal_stats: event::EventHandle<UpdateWithdrawalStatsEvent>
    }
}