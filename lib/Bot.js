'use strict'

const Telegraf = require('telegraf')
const pkg = require('../package.json')
const fs = require('fs')

/**
 *
 * @param {SMConfig} config Instance of SMConfig object
 * @param {pino} pino Instance of pino logger
 * @param {Coins} coins Instance of the Coins library
 */
module.exports = (config, pino, coins) => {
    // Create the bot
    const bot = new Telegraf(config.get('telegram.botToken'))

    let helpMessage = fs.readFileSync('./extra/HelpText.md', 'utf8').replace('{Version}', pkg.version)
    bot.start((ctx) => {
        pino.info('started:', ctx.from.id)
        return ctx.replyWithMarkdown(helpMessage)
    })

    bot.command('help', (ctx) => ctx.replyWithMarkdown(helpMessage))

    // Answer to questions asking for the price; this generates the function to respond
    const sendPriceFunc = (product) => {
        return (ctx) => {
            const products = product ? [product] : config.get('products')
            const responses = products.map((el) => {
                const price = (coins.price(el) / 100).toFixed(2)
                return '*' + el + '*: ' + price
            })
            ctx.replyWithMarkdown(responses.join('\n'))
        }
    }

    // Answer with all products
    bot.hears(/price|quote/i, sendPriceFunc())

    // Answer with specific products
    config.get('products').map((el) => {
        const product = el.toLowerCase()
        const short = product.substr(0, 3)
        const options = [
            product.replace('-', '\-'),
            product.replace('-', ''),
            short
        ]
        bot.hears(new RegExp(options.join('|'), 'i'), sendPriceFunc(el))
    })

    if(config.get('usePolling')) {
        bot.startPolling()
    }
    else {
        // Not yet implemented

        /*
        // TLS options
        const tlsOptions = {
            key:  fs.readFileSync('server-key.pem'),
            cert: fs.readFileSync('server-cert.pem'),
            ca: [
                // This is necessary only if the client uses the self-signed certificate.
                fs.readFileSync('client-cert.pem')
            ]
        }

        // Set telegram webhook
        bot.telegram.setWebhook('https://server.tld:8443/secret-path', {
            source: fs.readFileSync('server-cert.pem')
        })

        // Start https webhook
        bot.startWebhook('/secret-path', tlsOptions, 8443)

        // Http webhook, for nginx/heroku users.
        bot.startWebhook('/secret-path', null, 5000)
        */
    }

    return bot
}
