'use strict'

// Middleware for all messages
module.exports = (state) => {
    const {bot, telemetry} = state

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
}
