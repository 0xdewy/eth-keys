# eth-keys
A command line wrapper around [ethersjs](https://github.com/ethers-io/ethers.js/) to generate and convert ethereum private key types.
  
    mnemonic
    private key (import/new)
    keystore file
    new

## How to use
Install eth-keys with npm 
```
npm install eth-keys -g
```

 then run eth-keys
```
>> eth-keys 

=========================1==========================
? What format is the private key in?
   keystore
   mnemonic
❯  private key
   new

=========================2==========================
✔ What format is the private key in?
 › private key

? Paste the private key:  **************************

=========================3==========================
[INFO] Opened wallet:  0xe3ED76846C75478E7043e23B6C95404EEbdeCd5E

? What format to output?
❯   keystore
    private key

=========================4==========================
✔ What format to output?
 › keystore
✔ New keystore name:  … test.json
✔ New password for keystore:  … ********
✔ Repeat password for keystore:  … *********

[INFO] Saved keystore to  <current-dir>/test.json

```


## Build from source

```
git clone https://github.com/kyledewy/eth-keys
&&
npm install
&&
npm start

```

## Warning 
```
This code has not been audited.
```