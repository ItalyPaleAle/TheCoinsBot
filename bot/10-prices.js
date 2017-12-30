'use strict'

const moment = require('moment')

// Answer to questions asking for the price
module.exports = (state) => {
    const {bot, telemetry, config, coins} = state

    const allProducts = config.get('products')

    // This generates the function that answers messages
    const currencySymbols = config.get('currencySymbols')
    const formatNumber = (numString) => {
        numString += ''
        const parts = numString.split('.')
        return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '')
    }
    const sendPriceFunc = (product) => {
        return async (ctx) => {
            telemetry.info({action: 'replied', reply: 'price', from: ctx.from.id, query: ctx.message.text})

            // What products do we need?
            let products
            if(product) {
                // Check if we have a full product name (e.g. "BTC-USD" or part of it only, without the destination currency)
                if(product.length == 7) {
                    products = [product]
                }
                else {
                    // Get the user, so we can know their region
                    const user = await ctx.user(ctx)
                    let fiat = config.get('regions.' + user.region + '.fiat')

                    // We might have multiple options for fiat currencies
                    fiat = (Array.isArray(fiat)) ? fiat : [fiat]
                    products = []
                    fiat.forEach((el) => {
                        const prod = product + '-' + el
                        // Does the product exist?
                        if(~allProducts.indexOf(prod)) {
                            products.push(prod)
                        }
                    })
                }
            }
            else {
                // Get the user, so we can know their region
                const user = await ctx.user(ctx)

                products = config.get('regions.' + user.region + '.products')
            }

            // Send prices
            const allResponses = []
            products.forEach((el) => {
                const [source, dest] = el.split('-')
                let response = '*' + el + '*\n'
                const price = coins.price(el)
                if(!price) {
                    // Price might not be available if we haven't received a ticker for that coin yet
                    response += 'Price not yet available. Please try again in a few moments.'
                }
                else {
                    const updateMoment = moment(price.time)
                    const nowMoment = moment()

                    // If difference is less than 5 seconds, display "just now" for last update
                    let lastUpdate = (nowMoment.diff(updateMoment) < 5000) ? 'just now' : updateMoment.fromNow()

                    response += 'Price: ' + currencySymbols[dest] + formatNumber((price.price / 100).toFixed(2)) + '\n'
                    response += '24hr Change: ' + price.change_percent + '%\n'
                    response += '24hr Volume: ' + currencySymbols[source] + formatNumber(price.volume_24h) + '\n'
                    response += '24hr Low: ' + currencySymbols[dest] + formatNumber((price.low_24h / 100).toFixed(2)) + '\n'
                    response += '24hr High: ' + currencySymbols[dest] + formatNumber((price.high_24h / 100).toFixed(2)) + '\n'
                    response += 'Last update: ' + lastUpdate
                }
                allResponses.push(response)
            })

            if(allResponses.length) {
                ctx.replyWithMarkdown(allResponses.join('\n\n'))
            }
        }
    }

    // Answer with specific products, full name
    allProducts.forEach((product) => {
        // Match coin symbol, with and without the dash
        const alternatives = [
            product.replace('-', '\\-'),
            product.replace('-', '')
        ]

        // Create trigger (case-insensitive)
        bot.hears(new RegExp('^\\s*(' + alternatives.join('|')  + ')\\s*$', 'i'), sendPriceFunc(product))
    })

    // Anser with specific products, but without specifying destination currency
    // First, get the list of coins (without destination currency)
    allProducts.map((val) => {
        // Return coin name, first 3 chars
        return val.substr(0, 3)
    }).filter((value, index, self) => {
        // Filter out duplicates
        return self.indexOf(value) === index
    }).forEach((coin) => {
        // Create a trigger for each coin
        const alternatives = [coin]

        // Match aliases
        const aliases = config.get('aliases.' + coin)
        if(aliases) {
            aliases.forEach((alias) => {
                alternatives.push(alias)
            })
        }

        // Create trigger (case-insensitive)
        bot.hears(new RegExp('^\\s*(' + alternatives.join('|')  + ')\\s*$', 'i'), sendPriceFunc(coin))
    })


    // Answer with all products
    bot.hears(/price|quote|all|coins/i, sendPriceFunc())
}
