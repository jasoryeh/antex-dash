// schedule caching

const scheduleCache = require('./util')(ANTEXDASH, 'cache_schedules_');

/**
 * @param {Date} dateObj 
 * @returns Cache key in `yyyy-mm`
 */
function dateToCacheKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
}

// a manually updated version in case any of our data change
const SHIFTBOARD_DATA_VERSION = 1;
const DASH_DATA_VERSION = 1;

/**
 * @param {String} key Shifts cache key in yyyy-mm
 * @returns 
 */
async function getShifts(key) {
    let shifts = await scheduleCache.get(key);
    if (!shifts) {
        await scheduleCache.set(key, {});
    }
    return await scheduleCache.get(key);
}

async function setShifts(key, value) {
    return await scheduleCache.set(key, value);
}

module.exports = {
    dateToCacheKey,
    getShifts,
    setShifts,
    SHIFTBOARD_DATA_VERSION,
    DASH_DATA_VERSION,
}