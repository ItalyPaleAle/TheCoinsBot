'use strict'

module.exports = async () => {
    // Logging
    const pino = require('pino')()

    // Load configuration
    const SMConfig = require('smconfig')
    const config = new SMConfig('config.yaml')

    // Initialize the GDAX client
    const Coins = require('./Coins')
    const coins = new Coins(config, pino)
    coins.init()

    const mongoose = require('mongoose')
    await new Promise((resolve, reject) => {
        mongoose.connect(config.get('mongodbUrl'))
        mongoose.connection.once('open', () => {
            console.log('Connected to MongoDB')
            resolve()
        })
    })

    // Initialize the Telegram bot
    require('./Bot')(config, pino, coins)
}
