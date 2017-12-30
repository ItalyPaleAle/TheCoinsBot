'use strict'

// Middleware for all messages
module.exports = (state) => {
    const {bot, pino, telemetry} = state

    bot.use(async (ctx, next) => {
        try {
            if(!ctx ||
                !ctx.from ||
                !ctx.from.id ||
                ctx.from.is_bot // Ignore messages coming from bots
            ) {
                // Do nothing beside logging
                telemetry.info({action: 'ignored', from: ctx.from.id, text: (ctx.message) ? ctx.message.text : null})
            }
            else {
                // Continue responding
                telemetry.info({action: 'message', from: ctx.from.id, text: (ctx.message) ? ctx.message.text : null})
                await next()
            }
        } catch(err) {
            pino.fatal({type: 'exception', message: err.message, stack: err.stack})
            ctx.replyWithMarkdown('**Ouch!** An internal error occurred and we cannot reply to you… Please try again!\nPS: one of our admin has been notified')
        }
    })
}
