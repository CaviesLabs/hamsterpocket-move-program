// hamsterpocket::chef is acting as an entrypoint for the whole program
module hamsterpocket::chef {
    use aptos_framework::resource_account;
    use aptos_framework::account;
    use aptos_framework::code;
    use aptos_std::from_bcs::{to_address};
    use aptos_std::type_info;

    use std::string;
    use std::signer::address_of;

    use hamsterpocket::pocket;
    use hamsterpocket::platform;
    use hamsterpocket::vault;
    use hamsterpocket::event;
    use std::error;

    const DEPLOYER: address = @deployer;
    const HAMSTERPOCKET: address = @hamsterpocket;

    const INVALID_ADMIN: u64 = 0x0;
    const INVALID_TOKEN_TYPE: u64 = 0x1;

    // initialize module
    fun init_module(sender: &signer) {
        let deployer_signer_cap = resource_account::retrieve_resource_account_cap(
            sender,
            @deployer
        );
        let resource_signer = account::create_signer_with_capability(
            &deployer_signer_cap
        );

        assert!(address_of(sender) == address_of(&resource_signer), INVALID_ADMIN);
        assert!(address_of(sender) == HAMSTERPOCKET, INVALID_ADMIN);

        // initialize sub modules
        platform::initialize(
            &resource_signer,
            deployer_signer_cap
        );
        pocket::initialize(&resource_signer);
        vault::initialize(&resource_signer);
        event::initialize(&resource_signer);
    }

    // upgrade programatically, only admin can perform upgrade
    public entry fun upgrade(
        sender: &signer,
        metadata_serialized: vector<u8>,
        code: vector<vector<u8>>
    ) {
        platform::is_admin(address_of(sender), true);

        let resource_signer = platform::get_resource_signer();
        code::publish_package_txn(&resource_signer, metadata_serialized, code);
    }

    public entry fun create_and_deposit_to_pocket<BaseToken>(
        signer: &signer,
        id: vector<u8>,
        base_token_address: vector<u8>,
        target_token_address: vector<u8>,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition: vector<u64>,
        take_profit_condition: vector<u64>,
        stop_loss_condition: vector<u64>,
        auto_closed_conditions: vector<u64>,
        deposit_amount: u64,
    ) {
        create_pocket(
            signer,
            id,
            base_token_address,
            target_token_address,
            amm,
            start_at,
            frequency,
            batch_volume,
            open_position_condition,
            take_profit_condition,
            stop_loss_condition,
            auto_closed_conditions,
        );

        deposit<BaseToken>(signer, id, deposit_amount)
    }

    // update pocket
    public entry fun create_pocket(
        signer: &signer,
        id: vector<u8>,
        base_token_address: vector<u8>,
        target_token_address: vector<u8>,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition: vector<u64>,
        take_profit_condition: vector<u64>,
        stop_loss_condition: vector<u64>,
        auto_closed_conditions: vector<u64>,
    ) {
        let pocket_id = string::utf8(id);

        // create pocket
        pocket::create_pocket(
            signer,
            pocket_id,
            to_address(base_token_address),
            to_address(target_token_address),
            amm,
            start_at,
            frequency,
            batch_volume,
            open_position_condition,
            take_profit_condition,
            stop_loss_condition,
            auto_closed_conditions,
        );

        // emit event
        event::emit_create_pocket_event(
            pocket_id,
            address_of(signer),
            pocket::get_pocket(pocket_id),
            string::utf8(b"USER_CREATED_POCKET")
        );
    }

    // update pocket
    public entry fun update_pocket(
        signer: &signer,
        id: vector<u8>,
        start_at: u64,
        frequency: u64,
        batch_volume: u64,
        open_position_condition: vector<u64>,
        take_profit_condition: vector<u64>,
        stop_loss_condition: vector<u64>,
        auto_closed_conditions: vector<u64>,
    ) {
        let pocket_id = string::utf8(id);

        pocket::update_pocket(
            signer,
            pocket_id,
            start_at,
            frequency,
            batch_volume,
            open_position_condition,
            take_profit_condition,
            stop_loss_condition,
            auto_closed_conditions,
        );

        // emit event
        event::emit_update_pocket_event(
            pocket_id,
            address_of(signer),
            pocket::get_pocket(pocket_id),
            string::utf8(b"USER_UPDATED_POCKET")
        );
    }

    // deposit
    public entry fun deposit<TokenType>(signer: &signer, id: vector<u8>, amount: u64) {
        let type_info = type_info::type_of<TokenType>();
        let token_address = type_info::account_address(&type_info);

        // must be allowed target
        platform::is_allowed_target(
            token_address,
            true
        );

        let pocket_id = string::utf8(id);

        // make sure the pocket is able to deposit
        pocket::is_able_to_deposit(signer, pocket_id, true);

        // deposit to vault
        vault::deposit<TokenType>(
            signer,
            amount
        );

        // update deposit stats
        pocket::update_deposit_stats(pocket_id, amount);

        // emit event
        event::emit_update_deposit_stats_event(
            pocket_id,
            address_of(signer),
            amount,
            token_address,
            string::utf8(b"USER_DEPOSITED_ASSET")
        );
    }

    // withdraw
    public entry fun withdraw<BaseToken, TargetToken>(signer: &signer, id: vector<u8>) {
        let pocket_id = string::utf8(id);

        let type_info_x = type_info::type_of<BaseToken>();
        let computed_base_token_address = type_info::account_address(&type_info_x);

        let type_info_y = type_info::type_of<TargetToken>();
        let computed_target_token_address = type_info::account_address(&type_info_y);

        // make sure the pocket is able to withdraw
        pocket::is_able_to_withdraw(signer, pocket_id, true);

        // extract trading info
        let (
            _,
            base_token_address,
            target_token_address,
            _,
            base_token_balance,
            target_token_balance,
            _
        ) = pocket::get_trading_info(pocket_id);

        // security check
        assert!(
            computed_base_token_address == base_token_address,
            error::invalid_state(INVALID_TOKEN_TYPE)
        );
        assert!(
            computed_target_token_address == target_token_address,
            error::invalid_state(INVALID_TOKEN_TYPE)
        );

        // withdraw from vault
        vault::withdraw<BaseToken>(
            signer,
            base_token_balance
        );

        // withdraw from vault
        vault::withdraw<TargetToken>(
            signer,
            target_token_balance
        );

        // update deposit stats
        pocket::update_withdrawal_stats(pocket_id);

        // emit event
        event::emit_update_withdrawal_stats_event(
            pocket_id,
            address_of(signer),
            base_token_balance,
            base_token_address,
            target_token_balance,
            target_token_address,
            string::utf8(b"USER_WITHDREW_ASSETS")
        );
    }

    // pause pocket
    public entry fun pause_pocket(signer: &signer, id: vector<u8>) {
        let pocket_id = string::utf8(id);

        pocket::mark_as_paused(
            pocket_id,
            signer
        );

        let (
            _,
            _,
            _,
            _,
            _,
            _,
            status
        ) = pocket::get_trading_info(pocket_id);

        // emit event
        event::emit_update_pocket_status_event(
            pocket_id,
            address_of(signer),
            status,
            string::utf8(b"USER_PAUSED_POCKET")
        );
    }

    // restart pocket
    public entry fun restart_pocket(signer: &signer, id: vector<u8>) {
        let pocket_id = string::utf8(id);

        pocket::mark_as_active(
            pocket_id,
            signer
        );

        let (
            _,
            _,
            _,
            _,
            _,
            _,
            status
        ) = pocket::get_trading_info(pocket_id);

        // emit event
        event::emit_update_pocket_status_event(
            pocket_id,
            address_of(signer),
            status,
            string::utf8(b"USER_RESTARTED_POCKET")
        );
    }

    // restart pocket
    public entry fun close_pocket(signer: &signer, id: vector<u8>) {
        let pocket_id = string::utf8(id);

        pocket::mark_as_closed(
            pocket_id,
            signer
        );

        let (
            _,
            _,
            _,
            _,
            _,
            _,
            status
        ) = pocket::get_trading_info(pocket_id);

        // emit event
        event::emit_update_pocket_status_event(
            pocket_id,
            address_of(signer),
            status,
            string::utf8(b"USER_CLOSED_POCKET")
        );
    }

    // set operator, only available for admin
    public entry fun set_operator(signer: &signer, address: vector<u8>, value: bool) {
        platform::is_admin(address_of(signer), true);
        platform::set_operator(
            to_address(address),
            value
        );

        // emit event
        event::emit_update_allowed_operator_event(
            address_of(signer),
            to_address(address),
            value
        );
    }

    // set interactive target, only available for admin
    public entry fun set_interactive_target(signer: &signer, address: vector<u8>, value: bool) {
        platform::is_admin(address_of(signer), true);
        platform::set_interactive_target(
            to_address(address),
            value
        );

        // emit event
        event::emit_update_allowed_target_event(
            address_of(signer),
            to_address(address),
            value
        );
    }

    // get pocket data
    #[view]
    public fun get_pocket(id: vector<u8>): pocket::Pocket {
        return pocket::get_pocket(
            string::utf8(id)
        )
    }

    // get pocket data
    #[view]
    public fun get_delegated_vault_address(address: vector<u8>): address {
        return address_of(
            &vault::get_resource_signer(
                to_address(address)
            )
        )
    }

    // check for allowed target
    #[view]
    public fun is_allowed_target(address: vector<u8>): bool {
        return platform::is_allowed_target(
            to_address(address),
            false
        )
    }

    // check for allowed operator
    #[view]
    public fun is_operator(address: vector<u8>): bool {
        return platform::is_operator(
            to_address(address),
            false
        )
    }

    // check for allowed admin
    #[view]
    public fun is_admin(address: vector<u8>): bool {
        return platform::is_admin(
            to_address(address),
            false
        )
    }
}
