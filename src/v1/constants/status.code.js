/**
 * @returns Return item status
 */
const ITEM_STATUS = {
    ITEM__REMOVED_OR_MODIFIER: {
        httpCode: 400,
        id: 'IS:::ITEM_ROM:::00000',
        message: 'Item was removed or modifier.',
    },
    ITEM__UPDATED_OK: {
        httpCode: 200,
        id: 'IS:::ITEM_UO:::00001',
        message: 'Item updated OK.',
    },
    ITEM__ADD_OK: {
        httpCode: 200,
        id: 'IS:::ITEM_GO:::00002',
        message: 'Item add OK.',
    },
    ITEM__DELETE_OK: {
        httpCode: 200,
        id: 'IS:::ITEM_DO:::00003',
        message: 'Item delete OK.',
    },
    ITEM__DELETE_ERROR_MIN: {
        httpCode: 400,
        id: 'IS:::ITEM_DEM:::00004',
        message: 'Item delete error.',
    },
    ITEM__DELETE_ERROR_MAX: {
        httpCode: 400,
        id: 'IS:::ITEM_DEM:::00005',
        message: 'Item delete error.',
    },
    ITEM__NOT_EXIST: {
        httpCode: 404,
        id: 'IS:::ITEM_NE:::00006',
        message: 'Item delete OK.',
    },
};
/**
 * @returns Return user status
 */
const USER_STATUS = {
    USER__UNDEFINED: {
        httpCode: 400,
        id: 'US:::USER_ROB:::00000',
        message: 'This user was removed or banned.',
    },
    USER__TEMP_BANNED: {
        httpCode: 400,
        id: 'US:::USER_ROB:::00001',
        message: 'This user was removed or banned.',
    },
    USER__FOREVER_BANNED: {
        httpCode: 400,
        id: 'US:::USER_ROB:::00002',
        message: 'This user was removed or banned.',
    },
    USER__REMOVED: {
        httpCode: 400,
        id: 'US:::USER_ROB:::00003',
        message: 'This user was removed or banned.',
    },
    USER__GET_OK: {
        httpCode: 200,
        id: 'US:::USER_GO:::00004',
        message: 'Success.',
    },
    USER__UNAUTHORIZED: {
        httpCode: 401,
        id: 'US:::USER_UA:::00005',
        message: 'Unauthorized!',
    },
};
/**
 * @returns Return server status
 */
const SERVER_STATUS = {
    SERVER__DEFAULT_ERROR: {
        httpCode: 500,
        id: 'SS:::SERVER_SERVER_BUSY:::00000',
        message:
            'Server is busy! Please wait a minute to try again or you can report this to help center. Thank you <3',
    },
    SERVER__DIFF_VERSION: {
        httpCode: 400,
        id: 'SS:::REQUEST_DIFF_VER:::00001',
        message: 'Version is old, use the new version api.',
    },
};
module.exports = {
    ITEM_STATUS,
    USER_STATUS,
    SERVER_STATUS,
};
