'use strict'

// Base middleware for the bots

module.exports = (state, logExtra) => {
    const {telemetry, pino} = state

    return async (ctx, next) => {
        try {
            const logData = Object.assign({
                from: (ctx && ctx.from && ctx.from.id) ? ctx.from.id : null,
                text: (ctx && ctx.message) ? ctx.message.text : null
            }, logExtra || {})

            if(!ctx ||
                !ctx.from ||
                !ctx.from.id ||
                ctx.from.is_bot // Ignore messages coming from bots
            ) {
                // Do nothing beside logging
                telemetry.info(Object.assign({}, logData, {action: 'ignored'}))
            }
            else {
                // Continue responding
                telemetry.info(Object.assign({}, logData, {action: 'mesage'}))
                await next()
            }
        } catch(err) {
            pino.fatal({type: 'exception', message: err.message, stack: err.stack})
            ctx.replyWithMarkdown('😢 An internal error occurred and we cannot reply to you… Please try again!\n_PS: one of our admins has been notified_')
        }
    }
}
