'use strict'

const GDAX = require('gdax')

/**
 * Converts the price from a string to cents (numbers)
 *
 * @param {string} str Price as string
 * @return {number} Price in cents
 */
const priceToCents = (str) => {
    const parts = str.split('.')
    return parseInt(parts[0], 10) * 100 + parseInt(parts[1].substr(0, 2), 10)
}

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
            { channels: ['ticker'] }
        )

        // Update prices in memory every time we get a new ticker message
        this._websocket.on('message', (message) => {
            if(!message || message.type != 'ticker' || !message.product_id) {
                return
            }

            // Save certain fields only
            this._prices[message.product_id] = {
                price: message.price,
                open_24h: message.open_24h,
                volume_24h: message.volume_24h,
                low_24h: message.low_24h,
                high_24h: message.high_24h
            }
        })
    }

    /**
     * @typedef {Object} CoinPrice
     * @property {number} price Current price, in cents
     * @property {number} volume_24h Volume in the last 24 hours, in cents
     * @property {number} change_percent Change with 24 hours ago, a percentage
     * @property {number} low_24h Lowest price in the last 24 hours, in cents
     * @property {number} high_24h Highest price in the last 24 hours, in cents
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
        const currentPrice = priceToCents(this._prices[product].price)
        const openPrice = priceToCents(this._prices[product].open_24h)
        return {
            price: currentPrice,
            volume_24h: parseInt(this._prices[product].volume_24h, 10),
            change_percent: ((currentPrice - openPrice) / openPrice * 100).toFixed(2),
            low_24h: priceToCents(this._prices[product].low_24h),
            high_24h: priceToCents(this._prices[product].high_24h)
        }
    }
}

module.exports = Coins
