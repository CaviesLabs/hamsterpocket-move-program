module hamsterpocket::platform {
    use aptos_framework::account;
    use aptos_std::table_with_length;
    use aptos_framework::account::SignerCapability;
    use std::signer::address_of;
    use std::error;

    friend hamsterpocket::chef;
    friend hamsterpocket::pocket;

    // Binding deployer
    const HAMSTERPOCKET: address = @hamsterpocket;
    const DEPLOYER: address = @hamsterpocket;

    const INVALID_ADMIN: u64 = 0x1;

    // here we define the platform config
    struct PlatformConfig has key {
        deployer_capibility: account::SignerCapability,
        allowed_interactive_targets: table_with_length::TableWithLength<address, bool>,
        allowed_operators: table_with_length::TableWithLength<address, bool>,
        allowed_admins: table_with_length::TableWithLength<address, bool>,
    }

    // init module will be called automatically whenever the module is published
    public(friend) fun initialize(
        resource_signer: &signer,
        signer_cap: SignerCapability
    ) acquires PlatformConfig {
        move_to(resource_signer, PlatformConfig {
            deployer_capibility: signer_cap,
            allowed_operators: table_with_length::new(),
            allowed_interactive_targets: table_with_length::new(),
            allowed_admins: table_with_length::new<address, bool>(),
        });

        let config = borrow_global_mut<PlatformConfig>(HAMSTERPOCKET);
        table_with_length::add(&mut config.allowed_admins, DEPLOYER, true);
    }

    // check whether the signer is admin
    public(friend) fun is_admin(signer: &signer, raise_error: bool): bool acquires PlatformConfig {
        let config = borrow_global<PlatformConfig>(HAMSTERPOCKET);
        let result = *table_with_length::borrow(
            &config.allowed_admins,
            address_of(signer)
        );

        if (raise_error) {
            assert!(result, error::permission_denied(INVALID_ADMIN));
        };

        return result
    }

    // get resource signer
    public(friend) fun get_resource_signer(): signer acquires PlatformConfig {
        let config = borrow_global<PlatformConfig>(HAMSTERPOCKET);
        let resource_signer = account::create_signer_with_capability(
            &config.deployer_capibility
        );
        return resource_signer
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