'use strict'

const FormatNumber = (numString) => {
    numString += ''
    const parts = numString.split('.')
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '')
}

module.exports = FormatNumber
