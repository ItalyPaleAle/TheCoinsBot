'use strict'

// Answer to questions asking for the price
module.exports = (state) => {
    const {bot, telemetry, config, coins} = state

    // This generates the function that answers messages
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
}
