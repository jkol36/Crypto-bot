import Web3 from 'web3'

import fetch from 'node-fetch'
import ethUtils from 'ethereumjs-util'

const ERC20_ABI = [{
    "constant": false,
    "inputs": [{
        "name": "spender",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "from",
        "type": "address"
    }, {
        "name": "to",
        "type": "address"
    }, {
        "name": "value",p
        "type": "uint256"
    }],
    "name": "transferFrom",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "who",
        "type": "address"
    }],
    "name": "balanceOf",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "to",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }],
    "name": "transfer",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": false,
    "inputs": [{
        "name": "spender",
        "type": "address"
    }, {
        "name": "value",
        "type": "uint256"
    }, {
        "name": "extraData",
        "type": "bytes"
    }],
    "name": "approveAndCall",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "type": "function"
}, {
    "constant": true,
    "inputs": [{
        "name": "owner",
        "type": "address"
    }, {
        "name": "spender",
        "type": "address"
    }],
    "name": "allowance",
    "outputs": [{
        "name": "",
        "type": "uint256"
    }],
    "payable": false,
    "type": "function"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "owner",
        "type": "address"
    }, {
        "indexed": true,
        "name": "spender",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Approval",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "name": "from",
        "type": "address"
    }, {
        "indexed": true,
        "name": "to",
        "type": "address"
    }, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
    }],
    "name": "Transfer",
    "type": "event"
}]
const config = {
    "FROM_PRIV_KEY": "0x442a08ec0d7c4a5879cbb86cb2fba936b0ab1450949ec44780d949ab576285dc", //0x442a08ec0d7c4a5879cbb86cb2fba936b0ab1450949ec44780d949ab576285dc
    "TO": "0x4F9BD3FE319947B9Fe3DD841ea581dFA0E6F2D40", //0xdecaf9cd2367cdbb726e904cd6397edfcae6068d,
    "GAS_PRICE": 5000000000, //5GWei
    "RPC_HOST": "https://api.myetherapi.com/eth",
    "TOKEN_PATH": "https://raw.githubusercontent.com/kvhnuke/etherwallet/mercury/app/scripts/tokens/ethTokens.json"
}
const FROM_PRIVKEY = config.FROM_PRIV_KEY
const TO = config.TO
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(config.RPC_HOST))
async function run() {
    const response = await fetch(config.TOKEN_PATH)
    const tokens = await response.json()
    migrate(tokens);
}
async function isValidTokenContract(addr) {
    let _t = new web3.eth.Contract(ERC20_ABI, addr)
    try {
        await _t.methods.totalSupply().call()
        return true
    } catch (e) {
        return false
    }
}
async function migrate(tokens) {
    console.log(ethUtils)
    const FROM = '0x' + ethUtils.privateToAddress(FROM_PRIVKEY).toString('hex')
    let txCount = await web3.eth.getTransactionCount(FROM)
    for (let i = 0; i < tokens.length; i++) {
        const _token = tokens[i]
        const isValid = await isValidTokenContract(_token.address)
        if (isValid) {
            let _t = new web3.eth.Contract(ERC20_ABI, _token.address)
            let balance = await _t.methods.balanceOf(FROM).call()
            console.log('got balance', balance)
            if (balance > 0) {
                await (async() => {
                    return _t.methods.transfer(TO, balance).estimateGas({
                        gas: 500000,
                        from: FROM
                    }).then((gasAmount) => {
                        return web3.eth.accounts.signTransaction({
                            to: _token.address,
                            value: 0,
                            gas: gasAmount,
                            nonce: txCount,
                            gasPrice: config.GAS_PRICE,
                            data: _t.methods.transfer(TO, balance).encodeABI()
                        }, FROM_PRIVKEY).then((signed) => {
                            return new Promise((resolve, reject) => {
                                web3.eth.sendSignedTransaction(signed.rawTransaction)
                                    .on('transactionHash', (hash) => {
                                        console.log("Token", hash)
                                        txCount++
                                        resolve()
                                    }).catch((e) => {
                                        console.log(e.message)
                                        resolve()
                                    })
                            })
                        })
                    }).catch((e) => {
                        console.log(e.message)
                    })
                })()
            }
        }
    }
    web3.eth.getBalance(FROM, 'pending').then((balance) => {
        web3.eth.accounts.signTransaction({
            to: TO,
            value: (balance - (21000 * config.GAS_PRICE)),
            gas: 21000,
            gasPrice: config.GAS_PRICE,
            nonce: txCount
        }, FROM_PRIVKEY).then((signed) => {
            web3.eth.sendSignedTransaction(signed.rawTransaction)
                .on('transactionHash', (hash) => {
                    console.log("Final", hash)
                }).catch((e) => {
                    console.log("Final", e.message)
                })
        })
    })
}

run()