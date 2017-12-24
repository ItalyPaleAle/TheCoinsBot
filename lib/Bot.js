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

    // Help and privacy messages
    const helpMessage = fs.readFileSync('./extra/HelpText.md', 'utf8').replace('{Version}', pkg.version)
    const privacyMessage = fs.readFileSync('./extra/PrivacyText.md', 'utf8')

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
    const currencySymbols = config.get('currencySymbols')
    const formatNumber = (numString) => {
        numString += ''
        const parts = numString.split('.')
        return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '')
    }
    const sendPriceFunc = (product) => {
        return (ctx) => {
            telemetry.info({action: 'replied', reply: 'price', from: ctx.from.id, query: ctx.message.text})

            const products = product ? [product] : config.get('products')
            const allResponses = []
            products.forEach((el) => {
                const [source, dest] = el.split('-')
                let response = '*' + el + '*\n'
                const price = coins.price(el)
                if(!price) {
                    response += 'Price not yet available. Please try again in a few moments.'
                }
                else {
                    response += 'Price: ' + currencySymbols[dest] + formatNumber((price.price / 100).toFixed(2)) + '\n'
                    response += '24hr Change: ' + price.change_percent + '%\n'
                    response += '24hr Volume: ' + currencySymbols[source] + formatNumber(price.volume_24h) + '\n'
                    response += '24hr Low: ' + currencySymbols[dest] + formatNumber((price.low_24h / 100).toFixed(2)) + '\n'
                    response += '24hr High: ' + currencySymbols[dest] + formatNumber((price.high_24h / 100).toFixed(2))
                }
                allResponses.push(response)
            })

            ctx.replyWithMarkdown(allResponses.join('\n\n'))
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

    // Answer to the /privacy command
    bot.command('privacy', (ctx) => {
        telemetry.info({action: 'replied', reply: 'privacy', from: ctx.from.id})

        return ctx.replyWithMarkdown(privacyMessage)
    })

    // Listen to incoming messages
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
