// hamsterpocket::chef is acting as an entrypoint for the whole program
module hamsterpocket::chef {
    use aptos_framework::resource_account;
    use aptos_framework::account;
    use aptos_framework::code;

    use std::error;
    use std::string;

    use hamsterpocket::pocket;
    use hamsterpocket::platform;

    const DEPLOYER: address = @deployer;
    const INVALID_ADMIN: u64 = 0x0;

    // initialize module
    fun init_module(sender: &signer) {
        let deployer_signer_cap = resource_account::retrieve_resource_account_cap(
            sender,
            @deployer
        );
        let resource_signer = account::create_signer_with_capability(
            &deployer_signer_cap
        );

        // initialize sub modules
        platform::initialize(
            &resource_signer,
            deployer_signer_cap
        );
        pocket::initialize(&resource_signer);
    }

    // upgrade programatically, only admin can perform upgrade
    public entry fun upgrade(
        sender: &signer,
        metadata_serialized: vector<u8>,
        code: vector<vector<u8>>
    ) {
        assert!(
            platform::is_admin(sender),
            error::permission_denied(INVALID_ADMIN)
        );

        let resource_signer = platform::get_resource_signer();
        code::publish_package_txn(&resource_signer, metadata_serialized, code);
    }

    // update pocket
    public entry fun create_pocket(
        signer: &signer,
        id: vector<u8>,
        base_token_address: address,
        target_token_address: address,
        amm: u64,
        start_at: u64,
        frequency: u64,
        batch_volume: u256,
        open_position_condition_operator: u64,
        open_position_condition_value_x: u256,
        open_position_condition_value_y: u256,
        stop_loss_condition_stopped_with: u64,
        stop_loss_condition_value: u256,
        take_profit_condition_stopped_with: u64,
        take_profit_condition_value: u256,
        auto_close_condition_closed_with: u64,
        auto_close_condition_value: u256
    ) {
        pocket:: create_pocket(
            signer,
            string::utf8(id),
            base_token_address,
            target_token_address,
            amm,
            start_at,
            frequency,
            batch_volume,
            open_position_condition_operator,
            open_position_condition_value_x,
            open_position_condition_value_y,
            stop_loss_condition_stopped_with,
            stop_loss_condition_value,
            take_profit_condition_stopped_with,
            take_profit_condition_value,
            auto_close_condition_closed_with,
            auto_close_condition_value
        )
    }

    // update pocket
    public entry fun update_pocket(
        signer: &signer,
        id: vector<u8>,
        start_at: u64,
        frequency: u64,
        batch_volume: u256,
        open_position_condition_operator: u64,
        open_position_condition_value_x: u256,
        open_position_condition_value_y: u256,
        stop_loss_condition_stopped_with: u64,
        stop_loss_condition_value: u256,
        take_profit_condition_stopped_with: u64,
        take_profit_condition_value: u256,
        auto_close_condition_closed_with: u64,
        auto_close_condition_value: u256
    ) {
        pocket::update_pocket(
            signer,
            string::utf8(id),
            start_at,
            frequency,
            batch_volume,
            open_position_condition_operator,
            open_position_condition_value_x,
            open_position_condition_value_y,
            stop_loss_condition_stopped_with,
            stop_loss_condition_value,
            take_profit_condition_stopped_with,
            take_profit_condition_value,
            auto_close_condition_closed_with,
            auto_close_condition_value
        )
    }

    // get pocket data
    #[view]
    public fun get_pocket(id: vector<u8>): pocket::Pocket {
        return pocket::get_pocket(string::utf8(id))
    }

    // pause pocket
    public(friend) entry fun pause_pocket(signer: &signer, id: vector<u8>) {
        pocket::mark_as_paused(
            string::utf8(id),
            signer
        );
    }

    // restart pocket
    public(friend) entry fun restart_pocket(signer: &signer, id: vector<u8>) {
        pocket::mark_as_active(
            string::utf8(id),
            signer
        );
    }

    // restart pocket
    public(friend) entry fun close_pocket(signer: &signer, id: vector<u8>) {
        pocket::mark_as_closed(
            string::utf8(id),
            signer
        );
    }
}
