'use strict'

const fs = require('fs')

// Responds to /privacy
module.exports = (state) => {
    const {bot, telemetry} = state

    // Help message
    const privacyMessage = fs.readFileSync('./extra/PrivacyText.md', 'utf8')

    bot.command('privacy', (ctx) => {
        telemetry.info({action: 'replied', reply: 'privacy', from: ctx.from.id})

        return ctx.replyWithMarkdown(privacyMessage)
    })
}
