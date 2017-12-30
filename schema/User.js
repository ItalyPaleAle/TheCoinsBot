'use strict'

const mongoose = require('mongoose')

// This will set later by a call to a static method
let defaultRegion = null

/* Schema */
const regionDefaultValue = () => {
    if(!defaultRegion) {
        throw new Error('Default region not set')
    }
    return defaultRegion
}
const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true},
    region: { type: String, default: regionDefaultValue},

    createdAt: {type: Date, default: () => new Date()},
    updatedAt: Date
})

/* Indexes */
userSchema.index({ userId: 1 })

/* Static methods */
userSchema.static('findByUserIdOrCreate', function(userId, callback) {
    return this.findOne({userId}).exec().then((document) => {
        return document || this.create({userId})
    })
})
userSchema.static('setDefaultRegion', (region) => {
    defaultRegion = region
})

/* Hooks */
userSchema.pre('save', function(next) {
    this.updatedAt = new Date()
    next()
})

/* Export the model */
const User = mongoose.model('User', userSchema)
module.exports = User
