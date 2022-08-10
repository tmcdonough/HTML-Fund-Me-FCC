// nodejs and front-end javascript are a little different.
// cant use require for front-end javascript. will have to use import instead.

import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

console.log("Hello")

// going to wrap this into an async function so that this will only pop up if connect is called.
async function connect() {
    // how to connect to the blockchain in browser:
    // for metamask: window.ethereum in console needs to exist.
    if (typeof window.ethereum !== "undefined") {
        console.log("I see a metamask")
        // this causes metamask to pop up if it exists.
        await window.ethereum.request({ method: "eth_requestAccounts" })
        console.log("Connected!")
        // document.getElementById("connectButton").innerHTML = "Connected!"
        connectButton.innerHTML = "Connected!"
    } else {
        connectButton.innerHTML = "Please install MetaMask"
        // document.getElementById("connectButton").innerHTML =
        //     "Please install metamask"
    }

    //OFTEN this script section gets too large so we put javascript code in own file.
}

// fund function

// GETTING LOCAL HARDHAT BLOCKCHAIN INTO METAMASK FOR TESTING
// we need to add our localnetwork to metamask.
// then we import the account #0 from the node (includes private key)
// you can also add to metamask with an encrypted json key.

// RESETTING LOCAL ACCOUNT
// if you close hardhat node, nonce resets. but metamask doesnt know this so youll get an error re: nonce.
// to reset you go to settings > advanced > reset account

async function fund() {
    // // temporarily hardcoding.
    // const ethAmount = "1"
    const ethAmount = document.getElementById("ethAmount").value // this will grab whatever value the user put in the input box we created

    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        // what we need
        // provider / connection to the blockchain
        // -- will use ethers. before we did const { ethers } = require("ethers") but this doesnt work on frontend.
        // -- PC/ethers docs recommend we copy the entire ethers library into our own server...
        // -- that's ethers-5.6.esm.min.js. (https://docs.ethers.io/v5/getting-started/ web browser section)
        // -- we then import it with 'import {ethers} from "./ethers-5.6.esm.min.js"'
        // -- frameworks like react etc. which we will use later will automatically convert from node, so we wont have to do this in the future.
        const provider = new ethers.providers.Web3Provider(window.ethereum) // this returns the network our metamask is connected to.
        const signer = provider.getSigner() // this returns whichever wallet is connected to metamask
        console.log(signer)
        // now we need our contract
        // typically since contract deployment address wont change, there's a constants.js file that houses the addresses & abis.
        // for abi, need to copy it from the backend repo artifacts folder
        // for the address, since we're doing local deployment, we create a new terminal and cd into the backend repo and run a node, then copy the deployment address into constants.js

        const contract = new ethers.Contract(contractAddress, abi, signer) // need abi and address...
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            // listen for the tx to be mined or listen for an event...
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
    } else {
        document.getElementById("connectButton").innerHTML =
            "Please install metamask"
    }
}

async function getBalance() {
    if (typeof window.ethereum != "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress)
        console.log(ethers.utils.formatEther(balance))
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    // note this isnt an async function.
    console.log(`Mining ${transactionResponse.hash}...`)
    // need to create a listener for the blockchain, and want to tell javascript to wait for this thing to finish looking.
    // () => {} is an empty anonymous function.
    // we're passing an anonymous function as the listener in once

    // once provider.once sees a hash, it will pass the receipt.
    // Promise syntax: return new Promise((resolve,reject) => {}) // promise will be done when listener is finished listening to resolve.
    return new Promise((resolve, reject) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations`
            )
            // this says: once the transaction hash is found, call this console.log... ONCE that's done, send resolve.
            resolve()
        })
    })
}

//withdraw

async function withdraw() {
    if (typeof window.ethereum != "undefined") {
        console.log("Withdrawing")
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
        } catch (error) {
            console.log(error)
        }
    }
}
