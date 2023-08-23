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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ethers_1 = require("ethers");
const prompts_1 = __importDefault(require("prompts"));
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
const mnemonicToWallet = (mnemonic, path) => {
    try {
        const wallet = ethers_1.ethers.Wallet.fromMnemonic(mnemonic, path);
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
const decryptKeystore = (keystorePath, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = fs_1.default.readFileSync(keystorePath);
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
const textInput = (message, { type = 'text', initial } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = yield prompts_1.default({
            type,
            message,
            initial,
            name: 'value',
            validate: (value) => value.length > 0
        });
        return command;
    }
    catch (err) {
        throw new Error(err);
    }
});
const confirmInput = (message, { initial = true } = {}) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = yield prompts_1.default({
            type: 'confirm',
            message,
            initial,
            name: 'value',
        });
        return command;
    }
    catch (err) {
        throw new Error(err);
    }
});
const getWallet = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let wallet;
        const keyFormat = yield prompts_1.default({
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
        switch (keyFormat.value) {
            case 1: {
                let inputKeystore = { value: '' };
                let errors = 0;
                while (!fs_1.default.existsSync(inputKeystore.value)) {
                    if (errors > 3) {
                        throw Error('Failed to find keystore file');
                    }
                    inputKeystore = yield textInput(`Keystore file: \n ${process.env.PWD}/<keystore_file>`);
                    inputKeystore.value = path_1.default.resolve((_a = process.env.PWD) !== null && _a !== void 0 ? _a : '', inputKeystore.value);
                    if (!fs_1.default.existsSync(inputKeystore.value)) {
                        console.error(`[ERROR] File doesn't exist ${inputKeystore.value}`);
                        errors++;
                    }
                }
                const oldKeystorePass = yield textInput('Password to decrypt keystore: ', { type: 'password' });
                wallet = yield decryptKeystore(inputKeystore.value, oldKeystorePass.value);
                console.log('[INFO] Decrypted wallet: ', wallet.address);
                return wallet;
            }
            case 2: {
                const mnemonic = yield textInput('Paste the mnemonic: ', { type: 'password' });
                const path = yield textInput('Choose the derivation path: ', { initial: "m/44'/60'/0'/0/0" });
                wallet = yield mnemonicToWallet(mnemonic.value, path.value);
                console.log('[INFO] Opened wallet: ', wallet.address);
                return wallet;
            }
            case 3: {
                const privateKey = yield textInput('Paste the private key: ', { type: 'password' });
                wallet = yield privateKeyToWallet(privateKey.value);
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
        const outputFormat = yield prompts_1.default({
            type: 'select',
            name: 'value',
            message: 'What format to output?\n',
            choices: [
                { title: 'keystore', value: 1 },
                { title: 'private key', value: 2 }
            ]
        });
        switch (outputFormat.value) {
            case 1: {
                const defaultKeystoreDir = path_1.default.join(os_1.default.homedir(), '.ethereum', 'keystore');
                const keystoreDir = yield textInput('Keystore directory: ', { initial: defaultKeystoreDir });
                let keystoreDirStat;
                try {
                    keystoreDirStat = fs_1.default.statSync(keystoreDir.value);
                }
                catch (_b) {
                    const confirmCreate = yield confirmInput(`Directory ${keystoreDir.value} doesn't exist. Do you wish to create it?`);
                    if (!confirmCreate.value) {
                        throw new Error('Keystore directory creation aborted');
                    }
                    try {
                        fs_1.default.mkdirSync(keystoreDir.value, { recursive: true });
                        keystoreDirStat = fs_1.default.statSync(keystoreDir.value);
                    }
                    catch (err) {
                        console.error(`[ERROR] ${err}`);
                        throw new Error('Failed to create the keystore directory');
                    }
                }
                if (!keystoreDirStat.isDirectory()) {
                    throw new Error(`Path ${keystoreDir.value} is not a directory`);
                }
                const defaultGethFilename = `UTC--${new Date().toISOString()}--${wallet.address.slice(2).toLowerCase()}.json`;
                const keystoreName = yield textInput('New keystore name: ', { initial: defaultGethFilename });
                let keystorePass = { value: '' };
                let check = { value: '' };
                while (check.value !== keystorePass.value || check.value === '') {
                    keystorePass = yield textInput('New password for keystore: ', { type: 'password' });
                    check = yield textInput('Repeat password for keystore: ', { type: 'password' });
                    if (keystorePass.value !== check.value) {
                        console.error("[ERROR] Passwords don't match!");
                    }
                }
                const output = path_1.default.resolve(keystoreDir.value, keystoreName.value);
                yield saveKeystore(wallet, output, keystorePass.value);
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
