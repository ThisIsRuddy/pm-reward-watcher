const axios = require('axios');
const beep = require('beepbeep');
const dialog = require('node-native-dialog');

const API_URI = 'https://api.snowtrace.io/api';
const CONTRACT_ADDR = '0x490bf3ABcAb1fB5c88533d850F2a8d6D38298465';
const WALLET_ADDR = '0xc8f1baa85f4e3fc8cbc71c12706ec5c64640f0e6';
const API_KEY = 'ENTER_SNOWTRACE_API_KEY_HERE';
const DIVISOR = 1000000000000000000;

if (!process.argv[2])
  throw new Error("You must supply a threshold.");

const THRESHOLD = process.argv[2];
const ALERT = process.argv[3] ? process.argv[3] : 'both';

if (ALERT === 'silent')
  console.info(`[${new Date().toLocaleString()}] Running in silent mode! SSSSHHHHHHH.`);

if (ALERT === 'both' || ALERT === 'dialog')
  console.info(`[${new Date().toLocaleString()}] Dialog alerts are enabled!`);

if (ALERT === 'both' || ALERT === 'beep') {
  console.info(`[${new Date().toLocaleString()}] Beeps enabled! Beep test, BEEP, BEEP, BEEP!`);
  beep(3);
}

console.info(`[${new Date().toLocaleString()}] Waiting for balance to reach ${THRESHOLD}...`);

const getTokenBalance = async () => {

  const {data: {result}} = await axios.get(API_URI, {
    params: {
      module: 'account',
      action: 'tokenbalance',
      tag: 'latest',
      contractaddress: CONTRACT_ADDR,
      address: WALLET_ADDR,
      apikey: API_KEY
    }
  });

  const balance = result / DIVISOR;
  return balance;
}

const runAlerts = async (balance) => {

  if (ALERT === 'both' || ALERT === 'dialog')
    await dialog.show({
      msg: `Balance: ${balance.toFixed(2)}
  Go claim/compound!`,
      title: 'Address Balance',
      icon: dialog.INFO,
      buttons: dialog.OK,
      defaultButton: dialog.RIGHT,
    })

  if (ALERT === 'both' || ALERT === 'beep')
    beep(3);
}

let previousBalance = 0;
let canClaim = false;
const execute = async () => {

  try {
    const balance = await getTokenBalance();

    if (previousBalance === balance)
      return setTimeout(execute, 2000);

    if (balance >= THRESHOLD) {
      canClaim = true;
      console.info(`[${new Date().toLocaleString()}] Desired balance reached: ${balance.toFixed(2)}`);

      if (ALERT !== 'silent')
        await runAlerts(balance);

    } else if (canClaim) {
      console.warn(`[${new Date().toLocaleString()}] Balance is now depleted: ${balance.toFixed(2)}`);
      canClaim = false;
    } else
      console.info(`[${new Date().toLocaleString()}] Balance has updated: ${balance.toFixed(2)}`);

    previousBalance = balance;
  } catch (e) {
    console.error(`[${new Date().toLocaleString()}] Failed to retrieve token balance.`);
    console.error(e.message);
  }

  return setTimeout(execute, 2000);
}

execute()
  .catch(err => console.error(err.message));
