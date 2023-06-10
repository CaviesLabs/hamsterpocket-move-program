// hamsterpocket::chef is acting as an entrypoint for the whole program
module hamsterpocket::chef {
    use aptos_framework::resource_account;
    use aptos_framework::account;

    use hamsterpocket::pocket;
    use hamsterpocket::platform;

    use std::option::{Self, Option};

    const DEPLOYER: address = @deployer;

    // initialize module
    fun init_module(sender: &signer) {
        let deployer_signer_cap = resource_account::retrieve_resource_account_cap(sender, @deployer);
        let resource_signer = account::create_signer_with_capability(&deployer_signer_cap);

        // initialize sub modules
        platform::initialize(
            &resource_signer,
            deployer_signer_cap
        );
        pocket::initialize(&resource_signer);
    }

    // create first entry
    public entry fun create_pocket(
        signer: &signer,
        params: Option<pocket::CreatePocketParams>
    ) {
        pocket::create_pocket(signer, *option::borrow(&params));
    }
}
