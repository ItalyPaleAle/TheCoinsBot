'use strict'

const GDAX = require('gdax')

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

        this._websocket.on('message', (message) => {
            if(!message || message.type != 'ticker' || !message.product_id) {
                return
            }

            // Get the price
            if(message.price) {
                const parts = message.price.split('.')
                const priceInCents = parseInt(parts[0], 10) * 100 + parseInt(parts[1].substr(0, 2), 10)
                this._prices[message.product_id] = priceInCents
            }
        })
    }

    /**
     * Return the real-time price of a tracked product
     *
     * @param {string} product Product name, e.g. "BTC-USD"
     * @return {number} Price of product in cents
     */
    price(product) {
        if(!product || !(~this._config.get('products').indexOf(product))) {
            throw Error('Specified product is invalid or not tracked')
        }

        return this._prices[product]
    }
}

module.exports = Coins
