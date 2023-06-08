/**
* @notice define hamsterpocket module
*/
module hamsterpocket::pocket {
    use aptos_std::table_with_length;
    use aptos_framework::timestamp;
    use std::signer;
    use std::string;
    use std::signer::address_of;
    use aptos_framework::account;
    use aptos_framework::resource_account;
    use std::error;
    use aptos_framework::account::SignerCapability;

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
    const OPERATOR_NEQ: u64 = 0x1;
    const OPERATOR_GT: u64 = 0x2;
    const OPERATOR_GTE: u64 = 0x3;
    const OPERATOR_LT: u64 = 0x4;
    const OPERATOR_LTE: u64 = 0x5;
    const OPERATOR_BW: u64 = 0x6;
    const OPERATOR_NBW: u64 = 0x7;

    // define trading stop condition
    const STOPPED_WITH_PRICE: u64 = 0x0;
    const STOPPED_WITH_PORTFOLIO_VALUE_DIFF: u64 = 0x1;
    const STOPPED_WITH_PORTFOLIO_PERCENT_DIFF: u64 = 0x2;

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
        id: vector<u8>,
        status: u64,
        owner: address,
        resource_owner: address,

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

        total_closed_position_in_target_token_amount: u64,
        total_received_fund_in_base_token_amount: u64,

        base_token_balance: u64,
        target_token_balance: u64,

        executed_batch_amount: u64,
        next_scheduled_execution_at: u64
    }

    // define pocket store which stores user accounts
    struct PocketStore has key {
        pockets: table_with_length::TableWithLength<string::String, Pocket>,
        signer_cap: SignerCapability
    }

    // define account resource store
    struct ResourceAccountStore has key {
        signer_map: table_with_length::TableWithLength<vector<u8>, address>,
        deployer_signer_cap: account::SignerCapability
    }

    struct CreatePocketParams has drop, copy {
        id: vector<u8>,
        base_token_address: address,
        target_token_address: address,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,
    }

    struct UpdatePocketParams has drop, copy {
        id: vector<u8>,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition: ValueComparision,
        stop_loss_condition: TradingStopCondition,
        take_profit_condition: TradingStopCondition,
        auto_close_condition: AutoCloseCondition,
    }

    // create resource signer during module initialization
    fun init_module(deployer: &signer) {
        let deployer_signer_cap = resource_account::retrieve_resource_account_cap(deployer, @hamsterpocket);
        let resource_signer = account::create_signer_with_capability(&deployer_signer_cap);

        move_to(
            &resource_signer,
            ResourceAccountStore {
                signer_map: table_with_length::new<vector<u8>, address>(),
                deployer_signer_cap
            }
        );
    }

    // create pocket
    public(friend) fun create_pocket(
        signer: &signer,
        params: CreatePocketParams
    ) acquires PocketStore, ResourceAccountStore {
        let signer_map = &mut borrow_global_mut<ResourceAccountStore>(@hamsterpocket).signer_map;
        let signer_cap = resource_account::retrieve_resource_account_cap(signer, address_of(signer));
        let resource_signer = account::create_signer_with_capability(&signer_cap); // this is the same with signer

        // if pocket store does not exists, we create one
        if (!exists<PocketStore>(address_of(signer))) {
            move_to(
                &resource_signer,
                PocketStore {
                    pockets: table_with_length::new<string::String, Pocket>(),
                    signer_cap
                }
            );

            table_with_length::add(signer_map, params.id, address_of(signer));
        };

        let store = borrow_global_mut<PocketStore>(address_of(signer));
        let pockets = &mut store.pockets;

        // we prevent duplicated id to be added to the table
        assert!(
            !table_with_length::contains<string::String, Pocket>(
                pockets,
                string::utf8(params.id)
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
        pocket.resource_owner = address_of(&resource_signer);
        pocket.next_scheduled_execution_at = params.start_at;

        // validate pocket
        validate_pocket(pocket);

        // now we add to store
        table_with_length::add(pockets, string::utf8(params.id), *pocket);
    }

    // create pocket
    public(friend) fun update_pocket(
        signer: &signer,
        params: UpdatePocketParams
    ) acquires PocketStore, ResourceAccountStore {
        // now we extract pocket
        let pocket = &mut get_pocket(params.id);

        // make sure the pocket is able to udpate
        assert!(is_able_to_update(pocket, signer), error::invalid_state(INVALID_POCKET_STATE));

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

    // check whether the pocket is able to deposit
    public(friend) fun is_able_to_deposit(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_update(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_close(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status != STATUS_CLOSED &&
            pocket.status != STATUS_WITHDRAWN
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_pause(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_ACTIVE
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_restart(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_PAUSED
    }

    // check whether the pocket is able to update
    public(friend) fun is_able_to_withdraw(pocket: &Pocket, signer: &signer): bool {
        return is_owner_of(pocket, signer) &&
            pocket.status == STATUS_CLOSED
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_swap(pocket: &Pocket): bool {
        return pocket.status == STATUS_ACTIVE &&
            pocket.base_token_balance >= pocket.batch_volume &&
            pocket.start_at <= timestamp::now_seconds() &&
            pocket.next_scheduled_execution_at <= timestamp::now_seconds()
    }

    // check whether the pocket is able to update
    public(friend) fun is_ready_to_close_position(pocket: &Pocket): bool {
        return pocket.status != STATUS_WITHDRAWN &&
            pocket.target_token_balance > 0 &&
            pocket.start_at <= timestamp::now_seconds()
    }

    // get pocket
    fun get_pocket(pocket_id: vector<u8>): Pocket acquires PocketStore, ResourceAccountStore {
        // let's find the resource signer of the pocket
        let resource_signer = &get_pocket_resource_signer(pocket_id);

        // now we query the pocket
        let store = borrow_global_mut<PocketStore>(address_of(resource_signer));
        let pockets = &mut store.pockets;

        // we check if the pocket id existed
        assert!(
            table_with_length::contains<string::String, Pocket>(
                pockets,
                string::utf8(pocket_id)
            ),
            NOT_EXISTED_ID
        );

        // extract pocket
        *table_with_length::borrow_mut(pockets, string::utf8(pocket_id))
    }

    // get pocket resource signer
    fun get_pocket_resource_signer(pocket_id: vector<u8>): signer acquires PocketStore, ResourceAccountStore {
        let signer_map = &borrow_global<ResourceAccountStore>(@hamsterpocket).signer_map;

        // make sure the system must be knowing the signer of the pocket
        assert!(
            table_with_length::contains(
                signer_map,
                pocket_id
            ),
            error::not_found(INVALID_VALUE)
        );

        // extract signer cap
        let signer_cap = &borrow_global<PocketStore>(
            *table_with_length::borrow(signer_map, pocket_id)
        ).signer_cap;

        // now we convert to signer
        let resource_signer = account::create_signer_with_capability(signer_cap);

        return resource_signer
    }

    // init an empty pocket
    fun create_empty(owner: address): Pocket {
        Pocket {
            id: b"",
            status: STATUS_ACTIVE,
            owner,
            resource_owner: @0x0,
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
            total_closed_position_in_target_token_amount: 0,
            total_received_fund_in_base_token_amount: 0,
            base_token_balance: 0,
            target_token_balance: 0,
            executed_batch_amount: 0,
            next_scheduled_execution_at: 0
        }
    }

    // check whether the pocket is valid
    fun validate_pocket(pocket: &Pocket) {
        assert!(pocket.id != b"", EMPTY_ID);

        assert!(pocket.owner != @0x0, ZERO_ADDRESS);
        assert!(pocket.resource_owner != @0x0, ZERO_ADDRESS);
        assert!(pocket.base_token_address != @0x0, ZERO_ADDRESS);
        assert!(pocket.target_token_address != @0x0, ZERO_ADDRESS);

        assert!(pocket.amm == AMM_PCS, INVALID_AMM);
        assert!(pocket.start_at > 0, ZERO_VALUE);
        assert!(pocket.frequency > 0, ZERO_VALUE);
        assert!(pocket.batch_volume > 0, ZERO_VALUE);

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
        // valid operator must be less than 0x7
        assert!(comparison.operator <= 0x7, INVALID_VALUE);

        // won't check if user unset the condition
        if (comparison.operator == UNSET) return;

        if (comparison.operator == OPERATOR_BW || comparison.operator == OPERATOR_NBW) {
            assert!(comparison.value_x >= comparison.value_y, INVALID_VALUE);
            assert!(comparison.value_y > 0, ZERO_VALUE);
            return
        };

        assert!(comparison.value_x > 0, ZERO_VALUE);
    }

    // check whether the open position condition is valid
    fun validate_trading_stop_condition(stop_condition: &TradingStopCondition) {
        // valid operator must be less than 0x2
        assert!(stop_condition.stopped_with <= 0x2, INVALID_VALUE);

        // validate
        if (stop_condition.stopped_with == UNSET) return;
        assert!(stop_condition.value > 0, ZERO_VALUE);
    }

    // check whether the open position condition is valid
    fun validate_auto_close_condition(condition: &AutoCloseCondition) {
        // valid operator must be less than 0x3
        assert!(condition.closed_with <= 0x4, INVALID_VALUE);

        // validate
        if (condition.closed_with == UNSET) return;
        assert!(condition.value > 0, ZERO_VALUE);
    }
}

