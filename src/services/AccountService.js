import {
  keypairFromAccount,
  revineAddressFromSeed,
} from '@jimber/stellar-crypto/dist/service/cryptoService';
import {
  loadAccount,
  generateAccount,
  addTrustLine,
} from '@jimber/stellar-crypto/dist/service/stellarService';
import { mnemonicToEntropy } from 'bip39';
import store from '../store';

export const mapAccount = async ({
  accountResponse,
  name,
  tags,
  index,
  position,
  seed,
  keyPair,
}) => ({
  name: name,
  tags: tags,
  id: accountResponse.id,
  balances: accountResponse.balances,
  index,
  position,
  seed,
  keyPair,
});

export const fetchAccount = async ({
  seedPhrase,
  index,
  name,
  tags,
  position,
  retry = 0
}) => {
  if (retry > 3) {
    console.error('too many retries');
    throw new Error('too many retries')
  }

  const keyPair = keypairFromAccount(seedPhrase, index);
  let accountResponse;
  try {
    accountResponse = await loadAccount(keyPair);
  } catch (e) {
    if (e.message !== 'Not Found') {
      throw Error('Something went wrong while fetching account');
    }
    accountResponse = await generateAndFetchAccount(keyPair, seedPhrase, index);
  }

  const valid = await validateAndFixAccountResponse(accountResponse, keyPair)

  if (!valid) {
    return await fetchAccount({
      seedPhrase,
      index,
      name,
      tags,
      position,
      retry: retry+1
    })
  }
  
  return mapAccount({
    accountResponse,
    index,
    tags,
    name,
    position,
    seed: Buffer.from(mnemonicToEntropy(seedPhrase), 'hex'),
    keyPair,
  });
};

async function generateAndFetchAccount(keyPair, seedPhrase, index) {
  try {
    const revineAddress = revineAddressFromSeed(seedPhrase, index);
    await generateAccount(keyPair, revineAddress);
  } catch (e) {
    console.error(e)
    throw Error('Something went wrong while generating account');
  }
  console.log('loading account');
  return await loadAcount(keyPair);
}

const validateAndFixAccountResponse = async (accountResponse, keyPair) => {
  if (!(accountResponse.balances.find(b => b.asset_code === 'TFT'))) {
    await addTrustLine(keyPair);
    return false;
  }
  return true;
}