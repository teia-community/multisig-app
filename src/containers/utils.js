import axios from 'axios';
import { NETWORK, IPFS_UPLOAD_PROXY } from '../constants';


// Returns the user address
export async function getUserAddress(wallet) {
    const activeAccount = await wallet.client.getActiveAccount()
        .catch(error => console.log('Error while accessing the active account:', error));

    return activeAccount?.address;
}

// Returns the contract reference
export async function getContract(tezos, contractAddress) {
    return await tezos.wallet.at(contractAddress)
        .catch(error => console.log('Error while accessing the contract:', error));
}

// Returns the addresses of similar contracts
export async function getSimilarContractAddresses(contractAddress, network = NETWORK) {
    const parameters = {
        select: 'address'
    };
    const response = await axios.get(`https://api.${network}.tzkt.io/v1/contracts/${contractAddress}/same`, { params: parameters })
        .catch(error => console.log('Error while querying similar contract addresses:', error));

    return response?.data.reverse();
}

// Returns the contract storage
export async function getContractStorage(contractAddress, network = NETWORK) {
    const response = await axios.get(`https://api.${network}.tzkt.io/v1/contracts/${contractAddress}/storage`)
        .catch(error => console.log('Error while querying the contract storage:', error));

    return response?.data;
}

// Returns the account balance in mutez
export async function getBalance(account, network = NETWORK) {
    const response = await axios.get(`https://api.${network}.tzkt.io/v1/accounts/${account}/balance`)
        .catch(error => console.log('Error while querying the account balance:', error));

    return response?.data;
}

// Returns some bigmap keys
export async function getBigmapKeys(bigmap, extraParameters = {}, network = NETWORK) {
    const parameters = Object.assign(
        {
            limit: 10000,
            active: true,
            select: 'key,value',
        },
        extraParameters);
    const response = await axios.get(`https://api.${network}.tzkt.io/v1/bigmaps/${bigmap}/keys`, { params: parameters })
        .catch(error => console.log('Error while querying the bigmap keys:', error));

    return response?.data.reverse();
}

// Returns the user votes
export async function getUserVotes(userAddress, tokenVotesBigmap, network = NETWORK) {
    // Download the user votes from the token votes bigmap
    const extraParameters = { 'key.address': userAddress };
    const votes = await getBigmapKeys(tokenVotesBigmap, extraParameters, network);

    // Rearange the user votes information in a dictionary
    const userVotes = votes ? {} : undefined;
    votes?.forEach(vote => userVotes[vote.key.nat] = vote.value);

    return userVotes;
}

// Returns the H=N user aliases
export async function getUserAliases(users) {
    // Prepare the list of user addresses for the query
    let userAddresses = users.join(',');

    // The list needs at least two wallets
    if (users.length === 1) {
        userAddresses += ',' + userAddresses;
    }

    // Get the user aliases from the H=N registries bigmap
    const extraParameters = { 'key.in': userAddresses };
    const aliases = await getBigmapKeys('3919', extraParameters, 'mainnet');

    // Rearange the user aliases information in a dictionary
    const userAliases = aliases ? {} : undefined;
    aliases?.forEach(alias => userAliases[alias.key] = hexToString(alias.value));

    return userAliases;
}

// Uploads a file to the ipfs proxy
export async function uploadFileToIPFSProxy(file) {
    const form_data = new FormData();
    form_data.append('asset', file);
    return await axios.post(IPFS_UPLOAD_PROXY + '/single', form_data, { headers: { 'Content-Type': 'multipart/form-data' } });
}

// Transforms a string to hex bytes
export function stringToHex(str) {
    return Array.from(str).reduce((hex, c) => hex += c.charCodeAt(0).toString(16).padStart(2, '0'), '');
}

// Transforms some hex bytes to a string
export function hexToString(hex) {
    return hex.match(/.{1,2}/g).reduce((acc, char) => acc + String.fromCharCode(parseInt(char, 16)), '');
}
