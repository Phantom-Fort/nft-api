const Moralis = require('moralis').default;
const { EvmChain } = require('@moralisweb3/common-evm-utils');

module.exports = async function handler(req, res) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    if (req.method === 'GET') {
      return res.status(200).json({ result: { isValid: false }, error: 'Moralis API key not set' });
    } else {
      return res.status(500).json({ error: 'Moralis API key not set' });
    }
  }

  try {
    await Moralis.start({ apiKey });
  } catch (error) {
    if (req.method === 'GET') {
      return res.status(200).json({ result: { isValid: false }, error: 'Failed to initialize Moralis SDK' });
    } else {
      return res.status(500).json({ error: 'Failed to initialize Moralis SDK' });
    }
  }

  let walletAddress;
  if (req.method === 'GET') {
    walletAddress = req.query.address?.toLowerCase();
  } else if (req.method === 'POST') {
    walletAddress = req.body?.accounts?.wallet?.address?.toLowerCase();
  } else {
    if (req.method === 'GET') {
      return res.status(200).json({ result: { isValid: false }, error: 'Method not allowed' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    if (req.method === 'GET') {
      return res.status(200).json({ result: { isValid: false }, error: 'Invalid wallet address' });
    } else {
      return res.status(400).json({ message: 'Invalid wallet address' });
    }
  }

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
    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: walletAddress,
        chain,
        tokenAddresses: [contracts[chainName]],
      });

      if (response.result.length > 0) {
        holdsNft = true;
        break;
      }
    } catch (error) {
      if (req.method === 'GET') {
        return res.status(200).json({ result: { isValid: false }, error: 'Moralis API error' });
      } else {
        return res.status(500).json({ error: 'Moralis API error' });
      }
    }
  }

  if (req.method === 'GET') { // For TaskOn
    return res.status(200).json({ result: { isValid: holdsNft } });
  } else { // For Zealy
    if (holdsNft) {
      return res.status(200).json({ message: 'User holds the Seedpass NFT' });
    } else {
      return res.status(400).json({ message: 'User does not hold the Seedpass NFT' });
    }
  }
};