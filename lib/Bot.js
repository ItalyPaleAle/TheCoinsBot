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
    // Child logger for telemetry
    const telemetry = pino.child({type: 'telemetry'})

    // Create the bot
    const bot = new Telegraf(config.get('telegram.botToken'))

    let helpMessage = fs.readFileSync('./extra/HelpText.md', 'utf8').replace('{Version}', pkg.version)

    // Middleware for all messages
    bot.use((ctx, next) => {
        if(!ctx ||
            !ctx.from ||
            !ctx.from.id ||
            ctx.from.is_bot // Ignore messages coming from bots
        ) {
            // Do nothing
            telemetry.info({action: 'ignored', from: ctx.from.id, text: (ctx.message) ? ctx.message.text : null})
            return
        }
        else {
            // Continue responding
            telemetry.info({action: 'message', from: ctx.from.id, text: (ctx.message) ? ctx.message.text : null})
            return next()
        }
    })

    // Responds to /start
    bot.start((ctx) => {
        telemetry.info({action: 'replied', reply: 'start', from: ctx.from.id})

        return ctx.replyWithMarkdown(helpMessage)
    })

    // Responds to /help and to "help" messages
    const sendHelp = (ctx) => {
        telemetry.info({action: 'replied', reply: 'help', from: ctx.from.id})

        return ctx.replyWithMarkdown(helpMessage)
    }
    bot.command('help', sendHelp)
    bot.hears('help', sendHelp)

    // Answer to questions asking for the price; this generates the function to respond
    const sendPriceFunc = (product) => {
        return (ctx) => {
            telemetry.info({action: 'replied', reply: 'price', from: ctx.from.id, query: ctx.message.text})

            const products = product ? [product] : config.get('products')
            const responses = products.map((el) => {
                const price = (coins.price(el) / 100).toFixed(2)
                return '*' + el + '*: ' + price
            })
            ctx.replyWithMarkdown(responses.join('\n'))
        }
    }

    // Answer with specific products
    config.get('products').forEach((coin) => {
        // Match coin symbol and first 3 characters only
        const product = coin.toLowerCase()
        const short = product.substr(0, 3)
        const options = [
            product.replace('-', '\-'),
            product.replace('-', ''),
            short
        ]

        // Match aliases
        const aliases = config.get('aliases.' + coin)
        if(aliases) {
            aliases.forEach((alias) => {
                options.push(alias)
            })
        }

        // Create trigger
        bot.hears(new RegExp(options.join('|'), 'i'), sendPriceFunc(coin))
    })

    // Answer with all products
    bot.hears(/price|quote|all|coins/i, sendPriceFunc())

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
