import React, { useState, useRef } from "react"
import Die from "./Die"
import { nanoid } from "nanoid"
import Confetti from "react-confetti"
import "./App.css"
import { ethers } from "ethers"


export default function App() {
    const [start, setStart] = useState(false)
    const [data, setdata] = useState({
        address: "",
        Balance: null,
    });
    const [token, setToken] = useState(0)

    const [dice, setDice] = useState(allNewDice())
    const [tenzies, setTenzies] = useState(false)
    const [rolls, setRolls] = useState(0)
    const [best, setBest] = useState(JSON.parse(localStorage.getItem('best')) || 0)
    const [bestTime, setBestTime] = useState(JSON.parse(localStorage.getItem('time')) || 0)

    const [startTime, setStartTime] = useState(null)
    const [now, setNow] = useState(null)

    const intervalRef = useRef(null)

    function handleStart() {
        setStartTime(Date.now())
        setNow(Date.now())

        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            setNow(Date.now())
        }, 10)
    }

    function handleStop() {
        clearInterval(intervalRef.current)
        if (secondsPassed < bestTime || bestTime === 0) {
            localStorage.setItem('time', secondsPassed)
            setBestTime(secondsPassed)
        }
    }

    let secondsPassed = 0;
    if (startTime != null && now != null) {
        secondsPassed = (now - startTime) / 1000;
    }


    React.useEffect(() => {
        const allHeld = dice.every(die => die.isHeld)
        const firstValue = dice[0].value
        const allSameValue = dice.every(die => die.value === firstValue)
        if (allHeld && allSameValue) {
            setTenzies(true)
            handleStop()
            if ((rolls < best) || best === 0) {
                localStorage.setItem('best', rolls)
                setBest(rolls)
            }
        }
    }, [dice])


    function generateNewDie() {
        return {
            value: Math.ceil(Math.random() * 6),
            isHeld: false,
            id: nanoid()
        }
    }

    function allNewDice() {
        const newDice = []
        for (let i = 0; i < 10; i++) {
            newDice.push(generateNewDie())
        }
        return newDice
    }


    function rollDice() {
        if (start) {
            if (!tenzies) {
                setDice(oldDice => oldDice.map(die => {
                    return die.isHeld ?
                        die :
                        generateNewDie()
                }))
                setRolls(rolls + 1)
            } else {
                handleStart()
                setRolls(0)
                setTenzies(false)
                setDice(allNewDice())
            }
        } else {
            setRolls(1)
            setStart(true)
            handleStart()
        }

    }

    function holdDice(id) {
        if (start) {
            setDice(oldDice => oldDice.map(die => {
                return die.id === id ?
                    { ...die, isHeld: !die.isHeld } :
                    die
            }))
        }
    }

    const diceElements = dice.map(die => (
        <Die
            {...die}
            started={start}
            holdDice={() => holdDice(die.id)}
        />
    ))


    const btnhandler = () => {
        // Asking if metamask is already present or not
        if (window.ethereum) {
            // res[0] for fetching a first wallet
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then((res) => {
                    const walletAddress = res[0];
                    // Fetch ETH balance
                    getbalance(walletAddress);
                    // Fetch ERC-20 token balance (replace with the actual token address)
                    const tokenContractAddress = process.env.REACT_APP_TOKEN_ADDRESS;
                    getTokenBalance(walletAddress, tokenContractAddress);
                }
                );
        } else {
            alert("install metamask extension!!");
        }
    };

    // a right format with help of ethers
    const getbalance = (address) => {
        // Requesting balance method
        window.ethereum
            .request({
                method: "eth_getBalance",
                params: [address, "latest"],
            })
            .then((balance) => {
                // Setting balance
                setdata({
                    address: address,
                    Balance:
                        ethers.utils.formatEther(balance),
                });

            });
    };
    const getTokenBalance = async (walletAddress, tokenContractAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(tokenContractAddress, ['function balanceOf(address) view returns (uint256)'], provider);
    
            const tokenBalance = await contract.balanceOf(walletAddress);
            const formatEther = ethers.utils.formatUnits(tokenBalance)
            setToken(formatEther)
        } catch (error) {
            console.error('Error fetching token balance:', error);
        }
    };


    return (
        <div>
            <div className="timer">
                {secondsPassed.toFixed(2)}s
            </div>
            <main>
                {tenzies && <Confetti />}
                {bestTime !== 0 &&
                    <div className="bestTime">
                        <span className="best--name">Best Time:</span>
                        <span className="best--time">{bestTime}s</span>
                    </div>
                }
                <button
                    className="roll-dice"
                    onClick={btnhandler}
                >
                    Connect
                </button>
                <span> {token} UDA</span>
                <span> {data.Balance?.substring(0, 6)}</span>
                <span> {data.address?.substring(0, 6)}...{data.address?.substring(data.address.length - 4)}</span>
                <h1 className="title">TENZI!</h1>
                <p className="instructions">Roll until all dice are the same.<br />Click each die to freeze it at its current value between rolls.</p>
                <div className="dice-container">
                    {diceElements}
                </div>
                <button
                    className="roll-dice"
                    onClick={rollDice}
                >
                    {!start ? "Start Game" : tenzies ? "New Game" : "Roll"}
                </button>
                console.log(type)
                <div className="scoreboard">
                    <div className="scores">
                        Rolls: <span>{rolls}</span>
                    </div>
                    {best !== 0 && <div className="scores left">
                        Best: <span>{best}</span>
                    </div>
                    }
                </div>
            </main>
        </div>
    )
}
