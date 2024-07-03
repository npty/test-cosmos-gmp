require("dotenv").config();
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { GasPrice } = require("@cosmjs/stargate");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const mnemonic = process.env.MNEMONIC;

(async () => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "osmo",
  });

  const [{ address }] = await wallet.getAccounts();

  const gasPrice = GasPrice.fromString(`0.4uosmo`);

  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.osmotest5.osmosis.zone",
    wallet,
    { gasPrice }
  );

  const balance = await client.getBalance(address, "uosmo");

  console.log(`Wallet address: ${address}`);
  console.log(`Wallet balance: ${balance.amount} ${balance.denom}`);

  // You can edit the wasmContractAddress to the address of the contract you want to interact with
  const wasmContractAddress =
  "osmo1vautfc99tv2kyz4h80squffhzs05um52yh4zx5saxnv372gkjz3ss0kjdn";


  // Query message from osmosis contract
  // const response = await client.queryContractSmart(wasmContractAddress, {
  //   get_stored_message: {},
  // });
  // console.log("Message from Osmosis contract: ", response.message);

  // Send message to osmosis contract
  const payload = {
    send_message_evm: {
      destination_chain: "Avalanche",
      destination_address: "0xa88B3843E895988D423efFc4Ecc2E982f398a3Ab",
      message: "Hello from Osmosis!",
    },
  };

  const result = await client.execute(
    address,
    wasmContractAddress,
    payload,
    "auto",
    undefined,
    [{ amount: "1000000", denom: "uosmo" }]
  );

  console.log("Sent! ", result.transactionHash);
})();
