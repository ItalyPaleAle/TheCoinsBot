'use strict'

const GDAX = require('gdax')
const Big = require('big.js')

/**
* Price of coins from GDAX
* @class
*/
class Coins {
    /**
    * Constructor
    *
    * @param {SMConfig} config Instance of SMConfig object
    * @param {pino} pino Instance of pino logger
    */
    constructor(config, pino) {
        this._config = config
        this._pino = pino

        this._websocket = null
        this._onTicker = {}
        this._prices = {}
    }

    /**
    * Initializes the GDAX client
    */
    init() {
        // Connect to the GDAX Websocket feed
        this._websocket = new GDAX.WebsocketClient(
            this._config.get('products'),
            this._config.get('gdax.wsUri'),
            null,
            { channels: ['ticker', 'heartbeat'] }
        )

        // Update prices in memory every time we get a new ticker message
        this._websocket.on('message', (message) => this._tick(message))

        // Handle situation when websocket closes
        this._websocket.on('close', (data) => this._websocketClosed(data))
    }

    /**
    * Callback executed when there's a new message in the ticker, with a new price for a specified product.
    *
    * @callback TickerCallback
    * @param {string|number} price Last price received, as a float or string representing a float
    * @param {string} time Time of ticker message, as ISO string
    */

    /**
    * Sets a callback for each ticker message.
    *
    * @param {string} product Product name
    * @param {TickerCallback} method Callback to execute
    */
    onTicker(product, method) {
        if(!product || !(~this._config.get('products').indexOf(product))) {
            throw Error('Specified product is invalid or not tracked')
        }

        this._onTicker[product] = method || null
    }

    /**
    * @typedef {Object} CoinPrice
    * @property {number} price Current price, in cents
    * @property {number} volume_24h Volume in the last 24 hours, in cents
    * @property {number} change_percent Change with 24 hours ago, a percentage
    * @property {number} low_24h Lowest price in the last 24 hours, in cents
    * @property {number} high_24h Highest price in the last 24 hours, in cents
    * @property {Date} time Last update time
    */
    /**
    * Return the real-time price of a tracked product
    *
    * @param {string} product Product name, e.g. "BTC-USD"
    * @return {?CoinPrice} Price of product, or null if not yet available
    */
    price(product) {
        if(!product || !(~this._config.get('products').indexOf(product))) {
            throw Error('Specified product is invalid or not tracked')
        }

        // If we haven't received prices yet...
        if(!this._prices[product]) {
            return null
        }

        // Return prices
        const currentPrice = Big(this._prices[product].price)
        const result = {
            price: currentPrice,
            // Time might be missing if this is the "seed" ticker, sent at the beginning of the stream
            time: this._prices[product].time ? new Date(this._prices[product].time) : null,
        }

        if(this._prices[product].open_24h) {
            const openPrice = Big(this._prices[product].open_24h)
            result.volume_24h = Big(this._prices[product].volume_24h)
            result.change_percent = currentPrice.minus(openPrice).div(openPrice).times(100)
            result.low_24h = Big(this._prices[product].low_24h)
            result.high_24h = Big(this._prices[product].high_24h)
        }

        return result
    }

    // Callback executed when a message arrives from GDAX
    _tick(message) {
        // This ignores all heartbeat messages
        if(!message || message.type != 'ticker' || !message.product_id) {
            return
        }

        this._pino.trace({type: 'ticker', message: message})

        // Save certain fields only
        this._prices[message.product_id] = {
            price: message.price,
            open_24h: message.open_24h,
            volume_24h: message.volume_24h,
            low_24h: message.low_24h,
            high_24h: message.high_24h,
            time: message.time // ISO time as string
        }

        // Execute callback, if any
        if(this._onTicker[message.product_id]) {
            this._onTicker[message.product_id](message.price, message.time)
        }
    }

    // Callback executed when the websocket connection is closed/fails
    // Source: https://github.com/coinbase/gdax-node/issues/104#issuecomment-328353970
    _websocketClosed(data) {
        this._pino.warn({
            type: 'coins',
            message: 'Websocket closed unexpectedly',
            data: data
        })

        // Wait 20 seconds before reconnecting
        setTimeout(() => {
            // Try to reconnect the first time
            this._websocket.connect()

            let count = 1
            // Try to reconnect every 30 seconds if it fails
            const interval = setInterval(() => {
                if (!this._websocket.socket) {
                    count++

                    // Log critical error if it keeps failing every 30/2 = 15 minutes
                    if (count % 30 === 0) {
                        const time_since = 30 * count
                        this._pino.fatal({
                            type: 'coins',
                            message: `Attempting to reconnect to websocket for the ${count} time. It has been ${time_since} seconds since we lost connection.`
                        })
                    }
                    this._websocket.connect()
                }
                else {
                    this._pino.info({
                        type: 'coins',
                        message: 'Reconnected to websocket'
                    })
                    clearInterval(interval)
                }
            }, 30000)
        }, 20000)
    }
}

module.exports = Coins
