const Moralis = require('moralis').default;
const { EvmChain } = require('@moralisweb3/common-evm-utils');

module.exports = async function handler(req, res) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Moralis API key not set' });
  }

  await Moralis.start({ apiKey });

  let walletAddress;
  if (req.method === 'GET') {
    walletAddress = req.query.address?.toLowerCase();
  } else if (req.method === 'POST') {
    walletAddress = req.body?.accounts?.wallet?.address?.toLowerCase();
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    if (req.method === 'GET') {
      return res.status(200).json({ result: { point: 0 } });
    } else {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }
  }

  // Replace these placeholders with the actual Seedpass NFT contract addresses per chain
  const contracts = {
    polygon: '0x492a86EdEEa01158FcD3C8f2348A4c0431b8A24d', // Actual Polygon address here
    bsc: '0xFF362C39eB0eDecA946A5528d30D9c9E9285f3fc', // Actual BSC address here
    arbitrum: '0x90b9E1C8645bC731be19537A4932B26Fc218e464', // Actual Arbitrum address here
  };

  const chains = [EvmChain.POLYGON, EvmChain.BSC, EvmChain.ARBITRUM];
  let holdsNft = false;

  for (let i = 0; i < chains.length; i++) {
    const chain = chains[i];
    const chainName = Object.keys(contracts)[i];
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address: walletAddress,
      chain,
      tokenAddresses: [contracts[chainName]],
    });

    if (response.result.length > 0) {
      holdsNft = true;
      break;
    }
  }

  if (req.method === 'GET') { // For TaskOn
    return res.status(200).json({ result: { point: holdsNft ? 1 : 0 } });
  } else { // For Zealy
    if (holdsNft) {
      return res.status(200).json({ message: 'User holds the Seedpass NFT' });
    } else {
      return res.status(400).json({ message: 'User does not hold the Seedpass NFT' });
    }
  }
};