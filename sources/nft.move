#[allow(lint(self_transfer))]
module walscribe::nft;

    // use sui::transfer;
    use sui::url;
    use std::string;
    use sui::event;


    public struct NFT has key, store {
        id: UID,
        name: string::String,
        description: string::String,
        url: url::Url
    }

    public struct NFTMint has copy, drop {
        object_id: ID,
        creator: address,
        name: string::String
    }

    public fun nft_names(nft: &NFT): &string::String{
        &nft.name
    }

    public fun nft_description(nft: &NFT): &string::String{
        &nft.description
    }

    public fun nft_url(nft: &NFT): &url::Url{
        &nft.url
    }

    public fun mint_to_sender(
        name: vector<u8>,
        description: vector<u8>,
        _url: vector<u8>,
        ctx: &mut TxContext
    ){
        let sender = ctx.sender();

        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(_url)
        };

        event::emit(NFTMint{
            object_id: object::id(&nft),
            creator: sender,
            name: nft.name
        });

        transfer::public_transfer(nft, sender)
    }    


    public fun burn_nfts(nft: NFT, _: &mut TxContext){
        let NFT { id, name:_, description:_ , url:_} = nft;

        object::delete(id);
    }

    public fun transfer_nfts(nft: NFT, recipient: address, _: &mut TxContext){
        transfer::public_transfer(nft, recipient);
    }
