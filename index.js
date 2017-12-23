'use strict'

// Logging
const pino = require('pino')()

// Load configuration
const SMConfig = require('smconfig')
const config = new SMConfig('config.yaml')

// Initialize the GDAX client
const Coins = require('./lib/Coins')
const coins = new Coins(config, pino)
coins.init()

// Initialize the Telegram bot
const bot = require('./lib/Bot')(config, pino, coins)
