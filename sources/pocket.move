/**
* @notice define hamsterpocket module
*/
module hamsterpocket::pocket {
    use aptos_std::table_with_length;
    use aptos_framework::timestamp;
    use std::signer;
    use std::signer::address_of;
    use std::error;
    use std::string::{Self, String};

    // use internal modules
    use hamsterpocket::platform;

    // declare friends module
    friend hamsterpocket::chef;

    const HAMSTERPOCKET: address = @hamsterpocket;

    // define Pocket status
    const STATUS_ACTIVE: u64 = 0x0;
    const STATUS_PAUSED: u64 = 0x1;
    const STATUS_CLOSED: u64 = 0x2;
    const STATUS_WITHDRAWN: u64 = 0x3;

    // define AMM type
    const AMM_PCS: u64 = 0x0;

    // define UNSET value
    const UNSET: u64 = 0x0;

    // define value comparision operation
    const OPERATOR_EQ: u64 = 0x1;
    const OPERATOR_NEQ: u64 = 0x2;
    const OPERATOR_GT: u64 = 0x3;
    const OPERATOR_GTE: u64 = 0x4;
    const OPERATOR_LT: u64 = 0x5;
    const OPERATOR_LTE: u64 = 0x6;
    const OPERATOR_BW: u64 = 0x7;
    const OPERATOR_NBW: u64 = 0x8;

    // define trading stop condition
    const STOPPED_WITH_PRICE: u64 = 0x1;
    const STOPPED_WITH_PORTFOLIO_VALUE_DIFF: u64 = 0x2;
    const STOPPED_WITH_PORTFOLIO_PERCENT_DIFF: u64 = 0x3;

    // define conditional auto close pocket
    const CLOSED_WITH_END_TIME: u64 = 0x1;
    const CLOSED_WITH_BATCH_AMOUNT: u64 = 0x2;
    const CLOSED_WITH_SPENT_BASE_AMOUNT: u64 = 0x3;
    const CLOSED_WITH_RECEIVED_TARGET_AMOUNT: u64 = 0x4;

    // define input errors
    const INVALID_TIMESTAMP: u64 = 0x1;
    const ZERO_ADDRESS: u64 = 0x2;
    const EMPTY_ID: u64 = 0x3;
    const INVALID_AMM: u64 = 0x4;
    const ZERO_VALUE: u64 = 0x5;
    const INVALID_VALUE: u64 = 0x6;
    const DUPLICATED_ID: u64 = 0x7;
    const NOT_EXISTED_ID: u64 = 0x8;
    const INVALID_POCKET_STATE: u64 = 0x9;
    const INVALID_SIGNER: u64 = 0x10;
    const INVALID_TARGET: u64 = 0x11;

    // define logic error
    const NOT_ABLE_TO_DEPOSIT: u64 = 0x21;
    const NOT_ABLE_TO_WITHDRAW: u64 = 0x22;
    const NOT_ABLE_TO_UPDATE: u64 = 0x23;
    const NOT_ABLE_TO_PAUSE: u64 = 0x24;
    const NOT_ABLE_TO_CLOSE: u64 = 0x25;
    const NOT_ABLE_TO_RESTART: u64 = 0x26;
    const NOT_READY_TO_SWAP: u64 = 0x27;
    const NOT_READY_TO_CLOSE_POSITION: u64 = 0x28;

    // define value comparison
    struct ValueComparision has copy, store, drop {
        operator: u64,
        value_x: u64,
        value_y: u64,
    }

    // define trading stop condition struct
    struct TradingStopCondition has copy, store, drop {
        stopped_with: u64,
        value: u64,
    }

    // define auto close condition struct
    struct AutoCloseCondition has copy, store, drop {
        closed_with: u64,
        value: u64
    }

    // define pocket struct
    struct Pocket has copy, drop, store {
        // pool identity fields
        id: String,
        status: u64,
        owner: address,

        // trading info fields
        base_token_address: address,
        target_token_address: address,
        amm: u64,

        // investment time period configuration fields
        start_at: u64,
        // second
        frequency: u64,

        // trading conditional fields
        batch_volume: u64,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,

        // statistic fields are not inserted during pocket creation, but pocket operation
        total_deposited_base_amount: u64,
        total_swapped_base_amount: u64,
        total_received_target_amount: u64,

        total_closed_position_in_target_amount: u64,
        total_received_fund_in_base_amount: u64,

        base_token_balance: u64,
        target_token_balance: u64,

        executed_batch_amount: u64,
        next_scheduled_execution_at: u64
    }

    // define pocket store which stores user accounts
    struct PocketStore has key {
        pockets: table_with_length::TableWithLength<String, Pocket>
    }

    // define account resource store
    struct ResourceAccountStore has key {
        owner_map: table_with_length::TableWithLength<String, address>,
    }

    // define update trading stats params
    struct UpdateTradingStatsParams has drop, copy {
        id: String,
        actor: address,
        swapped_base_token_amount: u64,
        received_target_token_amount: u64,
        reason: String
    }

    // define update close position params
    struct UpdateClosePositionParams has drop, copy {
        id: String,
        actor: address,
        swapped_target_token_amount: u64,
        received_base_token_amount: u64,
        reason: String
    }

    // define update pocket deposit params
    struct UpdateDepositStatsParams has drop, copy {
        id: String,
        actor: address,
        amount: u64,
        token_address: u64,
        reason: String
    }

    // define udpate withdrawal stats params
    struct UpdateWithdrawalStatsParams has drop, copy {
        id: String,
        actor: address,
        amount: u64,
        token_address: u64,
        reason: String
    }

    // initialize
    public(friend) fun initialize(hamsterpocket_signer: &signer) {
        assert!(address_of(hamsterpocket_signer) == HAMSTERPOCKET, INVALID_SIGNER);

        move_to(
            hamsterpocket_signer,
            ResourceAccountStore {
                owner_map: table_with_length::new<String, address>(),
            }
        );
    }

    // create pocket
    public(friend) fun create_pocket(
        signer: &signer,
        id: String,
        base_token_address: address,
        target_token_address: address,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition_operator: u64,
        open_position_condition_value_x: u64,
        open_position_condition_value_y: u64,
        stop_loss_condition_stopped_with: u64,
        stop_loss_condition_value: u64,
        take_profit_condition_stopped_with: u64,
        take_profit_condition_value: u64,
        auto_close_condition_closed_with: u64,
        auto_close_condition_value: u64
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut Pocket {
            id,
            owner: address_of(signer),
            base_token_address,
            target_token_address,
            amm, // currently we only support PCS as default
            start_at,
            next_scheduled_execution_at: start_at,
            frequency, // second
            batch_volume,
            open_position_condition: ValueComparision {
                operator: open_position_condition_operator,
                value_x: open_position_condition_value_x,
                value_y: open_position_condition_value_y
            },
            stop_loss_condition: TradingStopCondition {
                stopped_with: stop_loss_condition_stopped_with,
                value: stop_loss_condition_value
            },
            take_profit_condition: TradingStopCondition {
                stopped_with: take_profit_condition_stopped_with,
                value: take_profit_condition_value
            },
            auto_close_condition: AutoCloseCondition {
                closed_with: auto_close_condition_closed_with,
                value: auto_close_condition_value
            },
            // statistic fields won't validate at initialization
            status: STATUS_ACTIVE,
            total_deposited_base_amount: 0,
            total_swapped_base_amount: 0,
            total_received_target_amount: 0,
            total_closed_position_in_target_amount: 0,
            total_received_fund_in_base_amount: 0,
            base_token_balance: 0,
            target_token_balance: 0,
            executed_batch_amount: 0,
        };

        // validate pocket first
        validate_pocket(pocket);

        let owner_map = &mut borrow_global_mut<ResourceAccountStore>(
            HAMSTERPOCKET
        ).owner_map;

        // if pocket store does not exists, we create one
        if (!exists<PocketStore>(address_of(signer))) {
            move_to(
                signer,
                PocketStore {
                    pockets: table_with_length::new<String, Pocket>(),
                }
            );
        };

        // now we map signer for better query, also avoid duplicated key
        assert!(
            !table_with_length::contains(owner_map, id),
            error::invalid_state(DUPLICATED_ID)
        );
        table_with_length::add(owner_map, pocket.id, address_of(signer));
        assert!(
            table_with_length::contains(owner_map, id),
            error::not_found(NOT_EXISTED_ID)
        );

        let store = borrow_global_mut<PocketStore>(address_of(signer));
        let pockets = &mut store.pockets;

        // we prevent duplicated id to be added to the table
        assert!(
            !table_with_length::contains(
                pockets,
                pocket.id
            ),
            error::invalid_state(DUPLICATED_ID)
        );
        table_with_length::add(pockets, pocket.id, *pocket);
        assert!(
            table_with_length::contains(pockets, id),
            error::not_found(NOT_EXISTED_ID)
        );
    }

    // update pocket
    public(friend) fun update_pocket(
        signer: &signer,
        id: String,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition_operator: u64,
        open_position_condition_value_x: u64,
        open_position_condition_value_y: u64,
        stop_loss_condition_stopped_with: u64,
        stop_loss_condition_value: u64,
        take_profit_condition_stopped_with: u64,
        take_profit_condition_value: u64,
        auto_close_condition_closed_with: u64,
        auto_close_condition_value: u64
    ) acquires PocketStore, ResourceAccountStore {
        // now we extract pocket
        let pocket = &mut get_pocket(id);

        // make sure the pocket is able to udpate
        is_able_to_update(signer, pocket.id,true);

        // now we assign pocket data from params
        pocket.frequency = frequency;
        pocket.batch_volume = batch_volume;
        pocket.open_position_condition = ValueComparision {
            operator: open_position_condition_operator,
            value_x: open_position_condition_value_x,
            value_y: open_position_condition_value_y
        };
        pocket.stop_loss_condition = TradingStopCondition {
            stopped_with: stop_loss_condition_stopped_with,
            value: stop_loss_condition_value
        };
        pocket.take_profit_condition = TradingStopCondition {
            stopped_with: take_profit_condition_stopped_with,
            value: take_profit_condition_value
        };
        pocket.auto_close_condition = AutoCloseCondition {
            closed_with: auto_close_condition_closed_with,
            value: auto_close_condition_value
        };

        // compute other state
        if (pocket.next_scheduled_execution_at == pocket.start_at) {
            pocket.start_at = start_at;
            pocket.next_scheduled_execution_at = start_at;
        } else {
            pocket.start_at = start_at;
        };

        // validate pocket
        validate_pocket(pocket);

        // commit data changes
        commit_pocket_data(id, *pocket);
    }

    // update withdrawal stats
    public(friend) fun update_withdrawal_stats(
        id: String
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(id);

        pocket.base_token_balance = 0;
        pocket.target_token_balance = 0;
        pocket.status = STATUS_WITHDRAWN;

        // commit data changes
        commit_pocket_data(id, *pocket);
    }

    // update deposit stats
    public(friend) fun update_deposit_stats(
        id: String,
        amount: u64,
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(id);

        pocket.total_deposited_base_amount = amount;
        pocket.base_token_balance = pocket.base_token_balance + amount;

        // commit data changes
        commit_pocket_data(id, *pocket);
    }

    // update close position stats
    public(friend) fun update_close_position_stats(
        params: UpdateClosePositionParams
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(params.id);

        // update stats
        pocket.total_closed_position_in_target_amount = pocket.total_closed_position_in_target_amount + params.swapped_target_token_amount;
        pocket.total_received_fund_in_base_amount = pocket.total_received_fund_in_base_amount + params.received_base_token_amount;

        // update balance
        pocket.base_token_balance = pocket.base_token_balance + params.received_base_token_amount;
        pocket.target_token_balance = pocket.target_token_balance - params.swapped_target_token_amount;

        // commit data changes
        commit_pocket_data(params.id, *pocket);
    }

    // update trading stats
    public(friend) fun update_trading_stats(
        params: UpdateTradingStatsParams
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(params.id);

        // update trading epoch stats
        pocket.next_scheduled_execution_at = timestamp::now_seconds() + pocket.frequency;
        pocket.executed_batch_amount = pocket.executed_batch_amount + 1;

        // compute trading status
        pocket.total_swapped_base_amount = pocket.total_swapped_base_amount + params.swapped_base_token_amount;
        pocket.total_received_target_amount = pocket.total_received_target_amount + params.received_target_token_amount;
        pocket.base_token_balance = pocket.base_token_balance - params.swapped_base_token_amount;
        pocket.target_token_balance = pocket.target_token_balance + params.received_target_token_amount;

        // commit changes
        commit_pocket_data(params.id, *pocket);
    }

    // close pocket on behalf of owner
    public(friend) fun mark_as_closed(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to close
        is_able_to_close(signer, pocket_id, true);

        // update data
        pocket.status = STATUS_CLOSED;

        // commit
        commit_pocket_data(pocket_id, *pocket);
    }

    // restart pocket on behalf of owner
    public(friend) fun mark_as_active(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to restart
        is_able_to_restart(signer, pocket_id, true);

        // modify data
        pocket.status = STATUS_ACTIVE;

        commit_pocket_data(pocket_id, *pocket);
    }

    // pause pocket on behalf of owner
    public(friend) fun mark_as_paused(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to pause
        is_able_to_pause(signer, pocket_id, true);

        // modify data
        pocket.status = STATUS_PAUSED;

        commit_pocket_data(pocket_id, *pocket);
    }

    // check whether the pocket is able to deposit
    public(friend) fun is_able_to_deposit(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_DEPOSIT));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_update(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_UPDATE));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_close(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_CLOSE));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_pause(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status == STATUS_ACTIVE;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_PAUSE));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_restart(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status == STATUS_PAUSED;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_RESTART));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_withdraw(
        signer: &signer,
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = is_owner_of(pocket, signer) &&
            pocket.status == STATUS_CLOSED;

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_ABLE_TO_WITHDRAW));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_swap(
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = pocket.status == STATUS_ACTIVE &&
            pocket.base_token_balance >= pocket.batch_volume &&
            pocket.start_at <= timestamp::now_seconds() &&
            pocket.next_scheduled_execution_at <= timestamp::now_seconds();

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_READY_TO_SWAP));
        };

        return result
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_close_position(
        pocket_id: String,
        raise_error: bool
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        let result = pocket.status != STATUS_WITHDRAWN &&
            pocket.target_token_balance > 0 &&
            pocket.start_at <= timestamp::now_seconds();

        if (raise_error) {
            assert!(result, error::invalid_state(NOT_READY_TO_CLOSE_POSITION));
        };

        return result
    }

    public(friend) fun get_trading_info(
        pocket_id: String
    ): (address, u64, u64, u64) acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);
        return (
            pocket.owner,
            pocket.batch_volume,
            pocket.base_token_balance,
            pocket.target_token_balance
        )
    }

    // get pocket
    public(friend) fun get_pocket(
        pocket_id: String
    ): Pocket acquires PocketStore, ResourceAccountStore {
        // let's find the resource signer of the pocket
        let owner_address = get_pocket_signer_resource(pocket_id);

        // now we query the pocket
        let store = borrow_global<PocketStore>(owner_address);
        let pockets = &store.pockets;

        // we check if the pocket id existed
        assert!(
            table_with_length::contains(
                pockets,
                pocket_id
            ),
            error::not_found(NOT_EXISTED_ID)
        );

        // extract pocket
        let pocket = table_with_length::borrow(pockets, pocket_id);

        // we check if owner matches with signer
        assert!(
            pocket.owner == owner_address,
            error::permission_denied(INVALID_SIGNER)
        );

        // return pocket
        return *pocket
    }

    // get pocket mut
    fun commit_pocket_data(
        pocket_id: String,
        updated_pocket: Pocket
    ) acquires PocketStore, ResourceAccountStore {
        // let's find the resource signer of the pocket
        let owner_address = get_pocket_signer_resource(pocket_id);

        // now we query the pocket
        let store = borrow_global_mut<PocketStore>(owner_address);
        let pockets = &mut store.pockets;

        // return pocket
        table_with_length::upsert(pockets, pocket_id, updated_pocket)
    }

    // get pocket resource signer
    fun get_pocket_signer_resource(pocket_id: String): address acquires ResourceAccountStore {
        let owner_map = &borrow_global<ResourceAccountStore>(HAMSTERPOCKET).owner_map;

        // make sure the system must be knowing the signer of the pocket
        assert!(
            table_with_length::contains<String, address>(
                owner_map,
                pocket_id
            ),
            error::not_found(NOT_EXISTED_ID)
        );

        // extract signer cap
        return *table_with_length::borrow(owner_map, pocket_id)
    }

    // check whether the pocket is valid
    fun validate_pocket(pocket: &Pocket) {
        assert!(pocket.id != string::utf8(b""), error::invalid_state(EMPTY_ID));

        assert!(pocket.owner != @0x0, error::invalid_state(ZERO_ADDRESS));

        assert!(pocket.base_token_address != @0x0, error::invalid_state(ZERO_ADDRESS));
        assert!(
            platform::is_allowed_target(pocket.base_token_address, false),
            error::permission_denied(INVALID_TARGET)
        );

        assert!(pocket.target_token_address != @0x0, error::invalid_state(ZERO_ADDRESS));
        assert!(
            platform::is_allowed_target(pocket.target_token_address, false),
            error::permission_denied(INVALID_TARGET)
        );

        assert!(pocket.amm == AMM_PCS, error::invalid_state(INVALID_AMM));
        assert!(pocket.start_at > 0, error::invalid_state(ZERO_VALUE));
        assert!(pocket.frequency > 0, error::invalid_state(ZERO_VALUE));
        assert!(pocket.batch_volume > 0, error::invalid_state(ZERO_VALUE));

        validate_open_position_condition(&pocket.open_position_condition);
        validate_trading_stop_condition(&pocket.stop_loss_condition);
        validate_trading_stop_condition(&pocket.take_profit_condition);
        validate_auto_close_condition(&pocket.auto_close_condition);
    }

    // check whether the pocket is able to deposit
    fun is_owner_of(pocket: &Pocket, signer: &signer): bool {
        return signer::address_of(signer) == pocket.owner
    }

    // check whether the open position condition is valid
    fun validate_open_position_condition(comparison: &ValueComparision) {
        // valid operator must be less than 0x8
        assert!(comparison.operator <= 0x8, error::invalid_state(INVALID_VALUE));

        // won't check if user unset the condition
        if (comparison.operator == UNSET) return;

        if (comparison.operator == OPERATOR_BW || comparison.operator == OPERATOR_NBW) {
            assert!(comparison.value_x >= comparison.value_y, error::invalid_state(INVALID_VALUE));
            assert!(comparison.value_y > 0, error::invalid_state(ZERO_VALUE));
            return
        };

        assert!(comparison.value_x > 0, error::invalid_state(ZERO_VALUE));
    }

    // check whether the open position condition is valid
    fun validate_trading_stop_condition(stop_condition: &TradingStopCondition) {
        // valid operator must be less than 0x3
        assert!(stop_condition.stopped_with <= 0x3, error::invalid_state(INVALID_VALUE));

        // validate
        if (stop_condition.stopped_with == UNSET) return;
        assert!(stop_condition.value > 0, error::invalid_state(error::invalid_state(INVALID_VALUE)));
    }

    // check whether the open position condition is valid
    fun validate_auto_close_condition(condition: &AutoCloseCondition) {
        // valid operator must be less than 0x4
        assert!(condition.closed_with <= 0x4, error::invalid_state(INVALID_VALUE));

        // validate
        if (condition.closed_with == UNSET) return;
        assert!(condition.value > 0, error::invalid_state(ZERO_VALUE));
    }
}

