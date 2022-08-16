"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const prompts = require('prompts');
const privateKeyToWallet = (privKey) => {
    try {
        const wallet = new ethers_1.ethers.Wallet(privKey);
        return wallet;
    }
    catch (err) {
        throw Error(err);
    }
};
const newPrivateKey = (extraEntropy) => {
    try {
        const wallet = ethers_1.ethers.Wallet.createRandom(extraEntropy);
        return wallet;
    }
    catch (err) {
        throw Error(err);
    }
};
const mnemonicToWallet = (mnemonic) => {
    try {
        const wallet = ethers_1.ethers.Wallet.fromMnemonic(mnemonic);
        console.log(wallet.path);
        return wallet;
    }
    catch (err) {
        throw Error(err);
    }
};
const saveKeystore = (wallet, src, pass) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let encryptedKeystore = JSON.parse(yield wallet.encrypt(pass));
        encryptedKeystore.crypto = encryptedKeystore.Crypto;
        writeFile(src, JSON.stringify(encryptedKeystore));
        console.log('[INFO] Saved keystore to ', src);
    }
    catch (err) {
        throw Error(err);
    }
});
const decryptKeystore = (keystore_path, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = fs_1.default.readFileSync(keystore_path);
        const keystore = JSON.parse(file.toString());
        const wallet = yield ethers_1.ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password);
        return wallet;
    }
    catch (err) {
        throw Error(err);
    }
});
const writeFile = (path, data) => {
    try {
        fs_1.default.writeFileSync(path, data);
        return path;
    }
    catch (err) {
        throw Error(err);
    }
};
const textInput = (message, type = 'text') => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = yield prompts({
            type: type,
            name: 'value',
            message: message,
            validate: (value) => value.length > 0
        });
        return command;
    }
    catch (err) {
        throw Error(err);
    }
});
const getWallet = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let wallet;
        const key_format = yield prompts({
            type: 'select',
            name: 'value',
            message: 'What format is the private key in?\n',
            choices: [
                { title: 'keystore', value: 1 },
                { title: 'mnemonic', value: 2 },
                { title: 'private key', value: 3 },
                { title: 'new', value: 4 }
            ]
        });
        switch (key_format.value) {
            case 1: {
                let input_keystore = { value: '' };
                let errors = 0;
                while (!fs_1.default.existsSync(input_keystore.value)) {
                    if (errors > 3)
                        throw Error('Failed to find keystore file');
                    input_keystore = yield textInput(`Keystore file: \n ${process.env.PWD}/<keystore_file>`);
                    // TODO: check for absolute paths
                    input_keystore.value = process.env.PWD + '/' + input_keystore.value;
                    if (!fs_1.default.existsSync(input_keystore.value)) {
                        console.log(`File doesn't exist ${input_keystore.value}`);
                        errors++;
                    }
                }
                const old_keystore_pass = yield textInput('Password to decrypt keystore: ', 'password');
                wallet = yield decryptKeystore(input_keystore.value, old_keystore_pass.value);
                console.log('[INFO] Decrypted wallet: ', wallet.address);
                return wallet;
            }
            case 2: {
                const mnemonic = yield textInput('Paste the mnemonic: ', 'password');
                wallet = yield mnemonicToWallet(mnemonic.value);
                console.log('[INFO] Opened wallet: ', wallet.address);
                return wallet;
            }
            case 3: {
                const private_key = yield textInput('Paste the private key: ', 'password');
                wallet = yield privateKeyToWallet(private_key.value);
                console.log('[INFO] Opened wallet: ', wallet.address);
                return wallet;
            }
            case 4: {
                wallet = newPrivateKey('');
                console.log('[INFO] Opened wallet: ', wallet.address);
                return wallet;
            }
            default: {
                throw Error('Couldnt read input');
            }
        }
    }
    catch (err) {
        throw Error(err);
    }
});
const output = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const current_dir = process.env.PWD;
        const output_format = yield prompts({
            type: 'select',
            name: 'value',
            message: 'What format to output?\n',
            choices: [
                { title: 'keystore', value: 1 },
                { title: 'private key', value: 2 }
            ]
        });
        switch (output_format.value) {
            case 1: {
                const keystore_name = yield textInput('New keystore name: ');
                let keystore_pass = { value: '' };
                let check = { value: '' };
                while (check.value !== keystore_pass.value || check.value === '') {
                    keystore_pass = yield textInput('New password for keystore: ', 'password');
                    check = yield textInput('Repeat password for keystore: ', 'password');
                    if (keystore_pass.value !== check.value) {
                        console.log('Passwords dont match!');
                    }
                }
                const output = `${current_dir}/${keystore_name.value}`;
                yield saveKeystore(wallet, output, keystore_pass.value);
                return;
            }
            case 2: {
                console.log(wallet.privateKey);
                return;
            }
        }
    }
    catch (err) {
        throw Error(err);
    }
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallet = yield getWallet();
        if (!wallet)
            throw Error('Failed to parse wallet');
        output(wallet);
    }
    catch (err) {
        console.log(err);
    }
});
main();
