module hamsterpocket::platform {
    use aptos_framework::resource_account;
    use aptos_framework::account;
    use aptos_std::table_with_length;

    friend hamsterpocket::pocket;

    // Binding deployer
    const DEPLOYER: address = @deployer;
    const HAMSTERPOCKET: address = @hamsterpocket;

    // here we define the platform config
    struct PlatformConfig has key {
        deployer_capibility: account::SignerCapability,
        allowed_interactive_targets: table_with_length::TableWithLength<address, bool>,
        allowed_operators: table_with_length::TableWithLength<address, bool>,
    }

    // init module will be called automatically whenever the module is published
    fun init_module(signer: &signer) {
        let signer_cap = resource_account::retrieve_resource_account_cap(signer, DEPLOYER);
        let resource_signer = account::create_signer_with_capability(&signer_cap);

        move_to(&resource_signer, PlatformConfig {
            deployer_capibility: signer_cap,
            allowed_operators: table_with_length::new(),
            allowed_interactive_targets: table_with_length::new(),
        });
    }

    // enable interactive target
    public(friend) fun set_interactive_target(target: address, enabled: bool) acquires PlatformConfig {
        let config = borrow_global_mut<PlatformConfig>(HAMSTERPOCKET);
        let allowed_interactive_targets = &mut config.allowed_interactive_targets;

        table_with_length::add<address, bool>(allowed_interactive_targets, target, enabled);
    }

    // enable operators
    public(friend) fun set_operator(operator: address, enabled: bool) acquires PlatformConfig {
        let config = borrow_global_mut<PlatformConfig>(HAMSTERPOCKET);
        let allowed_operators = &mut config.allowed_operators;

        table_with_length::add<address, bool>(allowed_operators, operator, enabled);
    }

    // check whether an address is operator
    public(friend) fun is_operator(operator: address): bool acquires PlatformConfig {
        let config = borrow_global<PlatformConfig>(HAMSTERPOCKET);

        return *table_with_length::borrow<address, bool>(&config.allowed_operators, operator)
    }

    // check whether an address is allowed to be interacted
    public(friend) fun is_allowed_target(target: address): bool acquires PlatformConfig {
        let config = borrow_global<PlatformConfig>(HAMSTERPOCKET);

        return *table_with_length::borrow<address, bool>(&config.allowed_interactive_targets, target)
    }
}