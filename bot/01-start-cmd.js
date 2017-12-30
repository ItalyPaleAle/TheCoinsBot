'use strict'

const fs = require('fs')

// Responds to /start
module.exports = (state) => {
    const {bot, telemetry} = state

    // Start message
    const helpMessage = fs.readFileSync('./extra/StartText.md', 'utf8')

    bot.start(async (ctx, next) => {
        telemetry.info({action: 'replied', reply: 'start', from: ctx.from.id})

        await ctx.replyWithMarkdown(helpMessage)

        return next()
    })
}
