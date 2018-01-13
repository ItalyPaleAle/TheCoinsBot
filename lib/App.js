'use strict'

const Big = require('big.js')
const SMConfig = require('smconfig')
const Pino = require('pino')
const Coins = require('./Coins')
const mongoose = require('mongoose')

const exp = {}
exp.Start = async () => {
    // Set precision for big.js
    Big.DP = 10 // Max 10 decimal points
    Big.RM = 1 // Round to nearest neighbour, with 5+ rounding up
    Big.NE = -9 // Use exponential notation from e^-9 and below
    Big.PE = 21 // Use exponential notation from e^+21 and above

    // Load configuration
    const config = new SMConfig('config.yaml')

    // Logging
    const pino = Pino({
        level: config.get('log.level')
    })
    exp.pino = pino

    // Initialize the GDAX client
    const coins = new Coins(config, pino)
    coins.init()

    await new Promise((resolve, reject) => {
        mongoose.connect(config.get('mongodbUrl'))
        mongoose.connection.once('open', () => {
            pino.info('Connected to MongoDB')
            resolve()
        })
    })

    // Initialize the Telegram bot
    require('./Bot')(config, pino, coins)
}

module.exports = exp
