/**
* @notice define hamsterpocket module
*/
module hamsterpocket::pocket {
    use aptos_std::table_with_length;
    use aptos_framework::timestamp;
    use std::signer;
    use std::signer::address_of;
    use aptos_framework::account;
    use std::error;
    use aptos_framework::account::SignerCapability;
    use std::string::{Self, String};

    // use internal modules
    use hamsterpocket::platform;

    // declare friends module
    friend hamsterpocket::chef;

    const POCKET_ACCOUNT_SEED: vector<u8> = b"HAMSTERPOCKET::ACCOUNT_SEED";

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

    // define errors
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

    // define value comparison
    struct ValueComparision has copy, store, drop {
        operator: u64,
        value_x: u256,
        value_y: u256,
    }

    // define trading stop condition struct
    struct TradingStopCondition has copy, store, drop {
        stopped_with: u64,
        value: u256,
    }

    // define auto close condition struct
    struct AutoCloseCondition has copy, store, drop {
        closed_with: u64,
        value: u256
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
        batch_volume: u256,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,

        // statistic fields are not inserted during pocket creation, but pocket operation
        total_deposited_base_amount: u256,
        total_swapped_base_amount: u256,
        total_received_target_amount: u256,

        total_closed_position_in_target_amount: u256,
        total_received_fund_in_base_amount: u256,

        base_token_balance: u256,
        target_token_balance: u256,

        executed_batch_amount: u256,
        next_scheduled_execution_at: u64
    }

    // define pocket store which stores user accounts
    struct PocketStore has key {
        pockets: table_with_length::TableWithLength<String, Pocket>,
        signer_cap: SignerCapability,
    }

    // define account resource store
    struct ResourceAccountStore has key {
        owner_map: table_with_length::TableWithLength<String, address>,
    }

    // define create pocket params
    struct CreatePocketParams has drop, copy {
        id: String,
        base_token_address: address,
        target_token_address: address,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u256,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,
    }

    // define update pocket params
    struct UpdatePocketParams has drop, copy {
        id: String,
        start_at: u64,
        frequency: u64,
        batch_volume: u256,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,
    }

    // define update status params
    struct UpdateStatusParams has drop, copy {
        id: String,
        actor: address,
        status: u64,
        reason: String
    }

    // define update trading stats params
    struct UpdateTradingStatsParams has drop, copy {
        id: String,
        actor: address,
        swapped_base_token_amount: u256,
        received_target_token_amount: u256,
        reason: String
    }

    // define update close position params
    struct UpdateClosePositionParams has drop, copy {
        id: String,
        actor: address,
        swapped_target_token_amount: u256,
        received_base_token_amount: u256,
        reason: String
    }

    // define update pocket deposit params
    struct UpdateDepositStatsParams has drop, copy {
        id: String,
        actor: address,
        amount: u256,
        token_address: u256,
        reason: String
    }

    // define udpate withdrawal stats params
    struct UpdateWithdrawalStatsParams has drop, copy {
        id: String,
        actor: address,
        amount: u256,
        token_address: u256,
        reason: String
    }

    // initialize
    public(friend) fun initialize(resource_signer: &signer) {
        move_to(
            resource_signer,
            ResourceAccountStore {
                owner_map: table_with_length::new<String, address>(),
            }
        );
    }

    // create pocket
    public(friend) fun create_pocket(
        signer: &signer,
        params: CreatePocketParams
    ) acquires PocketStore, ResourceAccountStore {
        let owner_map = &mut borrow_global_mut<ResourceAccountStore>(@hamsterpocket).owner_map;

        // if pocket store does not exists, we create one
        if (!exists<PocketStore>(address_of(signer))) {
            // create resource account for user
            let (_, signer_cap) = account::create_resource_account(
                signer,
                POCKET_ACCOUNT_SEED,
            );

            move_to(
                signer,
                PocketStore {
                    pockets: table_with_length::new<String, Pocket>(),
                    signer_cap
                }
            );
        };

        // now we map signer for better query
        table_with_length::add(owner_map, params.id, address_of(signer));

        let store = borrow_global_mut<PocketStore>(address_of(signer));
        let pockets = &mut store.pockets;

        // we prevent duplicated id to be added to the table
        assert!(
            !table_with_length::contains(
                pockets,
                params.id
            ),
            DUPLICATED_ID
        );

        // now we assign pocket data from params
        let pocket = &mut create_empty(address_of(signer));
        pocket.id = params.id;
        pocket.base_token_address = params.base_token_address;
        pocket.target_token_address = params.target_token_address;
        pocket.amm = params.amm;
        pocket.start_at = params.start_at;
        pocket.frequency = params.frequency;
        pocket.batch_volume = params.batch_volume;
        pocket.open_position_condition = params.open_position_condition;
        pocket.stop_loss_condition = params.stop_loss_condition;
        pocket.take_profit_condition = params.take_profit_condition;
        pocket.auto_close_condition = params.auto_close_condition;

        // compute other state
        pocket.next_scheduled_execution_at = params.start_at;

        // validate pocket
        validate_pocket(pocket);

        // now we add to store
        table_with_length::add(pockets, params.id, *pocket);
    }

    // create pocket
    public(friend) fun update_pocket(
        signer: &signer,
        params: UpdatePocketParams
    ) acquires PocketStore, ResourceAccountStore {
        // now we extract pocket
        let pocket = &mut get_pocket(params.id);

        // make sure the pocket is able to udpate
        assert!(is_able_to_update(params.id, signer), error::invalid_state(INVALID_POCKET_STATE));

        // now we assign pocket data from params
        pocket.frequency = params.frequency;
        pocket.batch_volume = params.batch_volume;
        pocket.open_position_condition = params.open_position_condition;
        pocket.stop_loss_condition = params.stop_loss_condition;
        pocket.take_profit_condition = params.take_profit_condition;
        pocket.auto_close_condition = params.auto_close_condition;

        // compute other state
        if (pocket.next_scheduled_execution_at == pocket.start_at) {
            pocket.start_at = params.start_at;
            pocket.next_scheduled_execution_at = params.start_at;
        } else {
            pocket.start_at = params.start_at;
        };

        // validate pocket
        validate_pocket(pocket);
    }

    // update withdrawal stats
    public(friend) fun update_withdrawal_statss(
        params: UpdateDepositStatsParams
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(params.id);

        pocket.base_token_balance = 0;
        pocket.target_token_balance = 0;
        pocket.status = STATUS_WITHDRAWN;
    }

    // update deposit stats
    public(friend) fun update_deposit_stats(
        params: UpdateDepositStatsParams
    ) acquires PocketStore, ResourceAccountStore {
        let pocket = &mut get_pocket(params.id);

        pocket.total_deposited_base_amount = params.amount;
        pocket.base_token_balance = pocket.base_token_balance + params.amount
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
    }

    // close pocket on behalf of owner
    public(friend) fun mark_as_closed(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to close
        assert!(is_able_to_close(pocket_id, signer), error::invalid_state(INVALID_POCKET_STATE));

        pocket.status = STATUS_CLOSED;
    }

    // restart pocket on behalf of owner
    public(friend) fun mark_as_active(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to restart
        assert!(is_able_to_restart(pocket_id, signer), error::invalid_state(INVALID_POCKET_STATE));

        pocket.status = STATUS_ACTIVE;
    }

    // pause pocket on behalf of owner
    public(friend) fun mark_as_paused(pocket_id: String, signer: &signer) acquires PocketStore, ResourceAccountStore {
        // extract pocket
        let pocket = &mut get_pocket(pocket_id);

        // make sure the pocket is able to pause
        assert!(is_able_to_pause(pocket_id, signer), error::invalid_state(INVALID_POCKET_STATE));

        pocket.status = STATUS_PAUSED;
    }

    // check whether the pocket is able to deposit
    public(friend) fun is_able_to_deposit(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_update(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_close(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_pause(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_ACTIVE
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_restart(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_PAUSED
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_withdraw(
        pocket_id: String,
        signer: &signer
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_CLOSED
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_swap(
        pocket_id: String
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return pocket.status == STATUS_ACTIVE &&
            pocket.base_token_balance >= pocket.batch_volume &&
            pocket.start_at <= timestamp::now_seconds() &&
            pocket.next_scheduled_execution_at <= timestamp::now_seconds()
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_close_position(
        pocket_id: String
    ): bool acquires PocketStore, ResourceAccountStore {
        let pocket = &get_pocket(pocket_id);

        return pocket.status != STATUS_WITHDRAWN &&
            pocket.target_token_balance > 0 &&
            pocket.start_at <= timestamp::now_seconds()
    }

    // get pocket
    public(friend) fun get_pocket(pocket_id: String): Pocket acquires PocketStore, ResourceAccountStore {
        // let's find the resource signer of the pocket
        let (_, owner_address) = get_pocket_signer_resource(pocket_id);

        // now we query the pocket
        let store = borrow_global_mut<PocketStore>(owner_address);
        let pockets = &mut store.pockets;

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


    // get pocket resource signer
    fun get_pocket_signer_resource(pocket_id: String): (signer, address) acquires PocketStore, ResourceAccountStore {
        let owner_map = &borrow_global<ResourceAccountStore>(@hamsterpocket).owner_map;

        // make sure the system must be knowing the signer of the pocket
        assert!(
            table_with_length::contains(
                owner_map,
                pocket_id
            ),
            error::not_found(INVALID_VALUE)
        );

        // extract signer cap
        let owner = table_with_length::borrow(owner_map, pocket_id);

        let signer_cap = &borrow_global<PocketStore>(
            *(copy owner)
        ).signer_cap;

        // now we convert to signer
        let resource_signer = account::create_signer_with_capability(signer_cap);

        // return address
        return (resource_signer, *owner)
    }

    // init an empty pocket
    fun create_empty(owner: address): Pocket {
        Pocket {
            id: string::utf8(b""),
            status: STATUS_ACTIVE,
            owner,
            base_token_address: @0x0,
            target_token_address: @0x0,
            amm: AMM_PCS, // currently we only support PCS as default
            start_at: 0,
            frequency: 0, // second
            batch_volume: 0,
            open_position_condition: ValueComparision { operator: UNSET, value_x: 0, value_y: 0 },
            stop_loss_condition: TradingStopCondition { stopped_with: UNSET, value: 0 },
            take_profit_condition: TradingStopCondition { stopped_with: UNSET, value: 0 },
            auto_close_condition: AutoCloseCondition { closed_with: UNSET, value: 0 },
            // statistic fields won't validate at initialization
            total_deposited_base_amount: 0,
            total_swapped_base_amount: 0,
            total_received_target_amount: 0,
            total_closed_position_in_target_amount: 0,
            total_received_fund_in_base_amount: 0,
            base_token_balance: 0,
            target_token_balance: 0,
            executed_batch_amount: 0,
            next_scheduled_execution_at: 0
        }
    }

    // check whether the pocket is valid
    fun validate_pocket(pocket: &Pocket) {
        assert!(pocket.id != string::utf8(b""), error::invalid_state(EMPTY_ID));

        assert!(pocket.owner != @0x0, error::invalid_state(ZERO_ADDRESS));

        assert!(pocket.base_token_address != @0x0, error::invalid_state(ZERO_ADDRESS));
        assert!(
            platform::is_allowed_target(pocket.base_token_address),
            error::permission_denied(INVALID_TARGET)
        );

        assert!(pocket.target_token_address != @0x0, error::invalid_state(ZERO_ADDRESS));
        assert!(
            platform::is_allowed_target(pocket.target_token_address),
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

