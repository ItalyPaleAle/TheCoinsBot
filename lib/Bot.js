'use strict'

const Telegraf = require('telegraf')

/**
 *
 * @param {SMConfig} config Instance of SMConfig object
 * @param {pino} pino Instance of pino logger
 * @param {Coins} coins Instance of the Coins library
 */
module.exports = (config, pino, coins) => {
    // Child logger for telemetry
    const telemetry = pino.child({type: 'telemetry'})

    // Create the bot
    const bot = new Telegraf(config.get('telegram.botToken'))

    // Include all bot actions
    const state = {
        bot,
        telemetry,
        config,
        coins
    }
    require('../bot')(state)

    // Listen to incoming messages
    if(config.get('webhook.polling')) {
        bot.startPolling()
    }
    else {
        // Set telegram webhook
        bot.telegram.setWebhook(config.get('webhook.url'))

        if(config.get('webhook.ssl.enabled')) {
            // TLS options
            const tlsOptions = {
                key:  fs.readFileSync('server-key.pem'),
                cert: fs.readFileSync('server-cert.pem'),
                ca: [
                    // This is necessary only if the client uses the self-signed certificate.
                    fs.readFileSync('client-cert.pem')
                ]
            }

            // Webhook with HTTPS
            bot.startWebhook(config.get('webhook.path'), tlsOptions, config.get('webhook.port'))
        }
        else {
            // Without HTTPS for usage behind a proxy
            bot.startWebhook(config.get('webhook.path'), null, config.get('webhook.port'))
        }
    }

    return bot
}
