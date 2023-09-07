import fs from 'fs'
import path from 'path'
import os from 'os'
import { ethers } from 'ethers'
import prompts from 'prompts'

const privateKeyToWallet = (privKey: string) => {
  try {
    const wallet = new ethers.Wallet(privKey)
    return wallet
  } catch (err) {
    throw Error(err)
  }
}

const newPrivateKey = (extraEntropy: string) => {
  try {
    const wallet = ethers.Wallet.createRandom(extraEntropy)
    return wallet
  } catch (err) {
    throw Error(err)
  }
}

const mnemonicToWallet = (mnemonic: string, path?: string) => {
  try {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
    return wallet
  } catch (err) {
    throw Error(err)
  }
}

const saveKeystore = async (wallet: any, src: string, pass: string) => {
  try {
    let encryptedKeystore = JSON.parse(await wallet.encrypt(pass))
    encryptedKeystore.crypto = encryptedKeystore.Crypto
    writeFile(src, JSON.stringify(encryptedKeystore))
    console.log('[INFO] Saved keystore to ', src)
  } catch (err) {
    throw Error(err)
  }
}

const decryptKeystore = async (keystorePath: string, password: string) => {
  try {
    const file: Buffer = fs.readFileSync(keystorePath)
    const keystore = JSON.parse(file.toString())
    const wallet = await ethers.Wallet.fromEncryptedJson(
      JSON.stringify(keystore),
      password
    )
    return wallet
  } catch (err) {
    throw Error(err)
  }
}

const writeFile = (path: string, data: any) => {
  try {
    fs.writeFileSync(path, data)
    return path
  } catch (err) {
    throw Error(err)
  }
}

interface TextInputOpts {
  type?: "text" | "password";
  initial?: string | number
}

const textInput = async (message: string, { type = 'text', initial }: TextInputOpts = {}) => {
  try {
    const command = await prompts({
      type,
      message,
      initial,
      name: 'value',
      validate: (value: string) => value.length > 0
    })
    return command
  } catch (err) {
    throw new Error(err)
  }
}

interface ConfirmInputOpts {
  initial?: boolean
}

const confirmInput = async (message: string, { initial = true }: ConfirmInputOpts = {}) => {
  try {
    const command = await prompts({
      type: 'confirm',
      message,
      initial,
      name: 'value',
    })
    return command
  } catch (err) {
    throw new Error(err)
  }
}

const getWallet = async () => {
  try {
    let wallet
    const keyFormat = await prompts({
      type: 'select',
      name: 'value',
      message: 'What format is the private key in?\n',
      choices: [
        { title: 'keystore', value: 1 },
        { title: 'mnemonic', value: 2 },
        { title: 'private key', value: 3 },
        { title: 'new', value: 4 }
      ]
    })
    switch (keyFormat.value) {
      case 1: {
        let inputKeystore = { value: '' }
        let errors = 0
        while (!fs.existsSync(inputKeystore.value)) {
          if (errors > 3) {
            throw Error('Failed to find keystore file')
          }

          inputKeystore = await textInput(
            `Keystore file: \n ${process.env.PWD}/<keystore_file>`
          )
          inputKeystore.value = path.resolve(process.env.PWD ?? '', inputKeystore.value)
          if (!fs.existsSync(inputKeystore.value)) {
            console.error(`[ERROR] File doesn't exist ${inputKeystore.value}`)
            errors++
          }
        }
        const oldKeystorePass = await textInput(
          'Password to decrypt keystore: ',
          { type: 'password' }
        )
        wallet = await decryptKeystore(
          inputKeystore.value,
          oldKeystorePass.value
        )
        console.log('[INFO] Decrypted wallet: ', wallet.address)
        return wallet
      }
      case 2: {
        const mnemonic = await textInput('Paste the mnemonic: ', { type: 'password' })
        const path = await textInput('Choose the derivation path: ', { initial: "m/44'/60'/0'/0/0" })
        wallet = mnemonicToWallet(mnemonic.value, path.value)
        console.log('[INFO] Opened wallet: ', wallet.address)
        return wallet
      }
      case 3: {
        const privateKey = await textInput(
          'Paste the private key: ',
          { type: 'password' }
        )
        wallet = privateKeyToWallet(privateKey.value)
        console.log('[INFO] Opened wallet: ', wallet.address)
        return wallet
      }
      case 4: {
        wallet = newPrivateKey('')
        console.log('[INFO] Opened wallet: ', wallet.address)
        return wallet
      }
      default: {
        throw Error('Couldnt read input')
      }
    }
  } catch (err) {
    throw Error(err)
  }
}

const output = async (wallet: any) => {
  try {
    const outputFormat = await prompts({
      type: 'select',
      name: 'value',
      message: 'What format to output?\n',
      choices: [
        { title: 'keystore', value: 1 },
        { title: 'private key', value: 2 }
      ]
    })
    switch (outputFormat.value) {
      case 1: {
        const defaultKeystoreDir = path.join(os.homedir(), '.ethereum', 'keystore')
        const keystoreDir = await textInput('Keystore directory: ', { initial: defaultKeystoreDir })

        let keystoreDirStat;
        try {
          keystoreDirStat = fs.statSync(keystoreDir.value);
        } catch {
          const confirmCreate = await confirmInput(`Directory ${keystoreDir.value} doesn't exist. Do you wish to create it?`)

          if (!confirmCreate.value) {
            throw new Error('Keystore directory creation aborted')
          }

          try {
            fs.mkdirSync(keystoreDir.value, { recursive: true })
            keystoreDirStat = fs.statSync(keystoreDir.value);
          } catch(err) {
            console.error(`[ERROR] ${err}`)
            throw new Error('Failed to create the keystore directory')
          }
        }

        if (!keystoreDirStat.isDirectory()) {
            throw new Error(`Path ${keystoreDir.value} is not a directory`)
        }

        const defaultGethFilename = `UTC--${new Date().toISOString()}--${wallet.address.slice(2).toLowerCase()}.json`
        const keystoreName = await textInput('New keystore name: ', { initial: defaultGethFilename })

        let keystorePass = { value: '' }
        let check = { value: '' }

        while (check.value !== keystorePass.value || check.value === '') {
          keystorePass = await textInput(
            'New password for keystore: ',
            { type: 'password' }
          )
          check = await textInput('Repeat password for keystore: ', { type: 'password' })
          if (keystorePass.value !== check.value) {
            console.error("[ERROR] Passwords don't match!")
          }
        }
        const output = path.resolve(keystoreDir.value, keystoreName.value)
        await saveKeystore(wallet, output, keystorePass.value)
        return

      }
      case 2: {
        console.log(wallet.privateKey)
        return
      }
    }
  } catch (err) {
    throw Error(err)
  }
}

const main = async () => {
  try {
    const wallet = await getWallet()
    if (!wallet) throw Error('Failed to parse wallet')
    output(wallet)
  } catch (err) {
    console.error(err)
  }
}

main()
