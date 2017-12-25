'use strict'

const pkg = require('../package.json')
const fs = require('fs')

// Responds to /start
module.exports = (state) => {
    const {bot, telemetry} = state

    // Help message
    const helpMessage = fs.readFileSync('./extra/HelpText.md', 'utf8').replace('{Version}', pkg.version)

    bot.start((ctx) => {
        telemetry.info({action: 'replied', reply: 'start', from: ctx.from.id})

        return ctx.replyWithMarkdown(helpMessage)
    })
}
