// hamsterpocket::chef is acting as an entrypoint for the whole program
module hamsterpocket::chef {
    use aptos_framework::resource_account;
    use aptos_framework::account;
    use aptos_framework::code;

    use std::option::{Self, Option};
    use std::error;

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

    // create first entry
    public entry fun create_pocket(
        signer: &signer,
        params: Option<pocket::CreatePocketParams>
    ) {
        pocket::create_pocket(signer, *option::borrow(&params));
    }
}
