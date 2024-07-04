require("dotenv").config();
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { GasPrice } = require("@cosmjs/stargate");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { AxelarQueryAPI } = require("@axelar-network/axelarjs-sdk");
const mnemonic = process.env.MNEMONIC;

(async () => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "osmo",
  });

  const [{ address }] = await wallet.getAccounts();

  const aUSDC =
    "ibc/1587E7B54FC9EFDA2350DC690EC2F9B9ECEB6FC31CF11884F9C0C5207ABE3921";
  const gasPrice = GasPrice.fromString(`0.4uosmo`);

  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.osmotest5.osmosis.zone",
    wallet,
    { gasPrice }
  );

  const balanceUsdc = await client.getBalance(address, aUSDC);
  const balanceOsmo = await client.getBalance(address, "uosmo");

  console.log("----- Wallet info -----");
  console.log(`Wallet address: ${address}`);
  console.log(`aUSDC balance: ${balanceUsdc.amount / 1e6} aUSDC`);
  console.log(`Osmo balance: ${balanceOsmo.amount / 1e6} OSMO\n`);
  const api = new AxelarQueryAPI({ environment: "testnet" });
  const gasAmount = await api.estimateGasFee(
    "osmosis-7",
    "Avalanche",
    500000,
    "auto",
    "aUSDC"
  );
  console.log(`Estimated gas fee: ${parseInt(gasAmount) / 1e6} aUSDC`);

  if (balanceUsdc.amount < gasAmount) {
    console.log("Insufficient aUSDC balance to pay for gas fee");
    return process.exit(0);
  }

  if (balanceOsmo.amount < 1e6) {
    console.log("Insufficient OSMO balance to pay for gas fee");
    return process.exit(0);
  }

  // You can edit the wasmContractAddress to the address of the contract you want to interact with
  const wasmContractAddress =
    "osmo1xv78lz3d06303g28ly0jfn26l7d0ap9tetesff3uum86wasg7tdq24xcnm";

  // Query message from osmosis contract
  const response = await client.queryContractSmart(wasmContractAddress, {
    get_stored_message: {},
  });
  console.log("Message from Osmosis contract:", response.message);

  // Send message to osmosis contract
  const payload = {
    send_message_evm: {
      destination_chain: "Avalanche",
      destination_address: "0xa88B3843E895988D423efFc4Ecc2E982f398a3Ab",
      message: "Hello from Osmosis!",
    },
  };

  const fee = {
    amount: gasAmount,
    denom: aUSDC,
  };

  console.log("Sending message to Osmosis contract...");

  const result = await client.execute(
    address,
    wasmContractAddress,
    payload,
    "auto",
    undefined,
    [fee]
  );

  console.log("Sent:", result.transactionHash);
})();
