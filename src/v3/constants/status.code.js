const ROOM_ACTION_STATUS = {
    ROOM_COMMON__INVALID_PARAMS: {
        httpCode: 400,
        name: 'RAS-00000',
        message: 'Get messages rooms with invalid params or missing params.',
    },
    GET_ROOM__SUCCESS: {
        httpCode: 200,
        name: 'RAS-00001',
        message: 'Successfully get rooms.',
    },
    ADD_TO_ROOM__USER_NOT_FOUND: {
        httpCode: 404,
        name: 'RAS-00002',
        message: 'Cannot add the undefined user to message room.',
    },
    ADD_TO_ROOM__USER_NOT_ALLOW: {
        httpCode: 400,
        name: 'RAS-00003',
        message: 'This user not allow you to add to the message room.',
    },
    ADD_TO_ROOM__USER_ALREADY_JOIN: {
        httpCode: 400,
        name: 'RAS-00004',
        message: 'This user already joined room.',
    },
    ADD_TO_ROOM__ALREADY_INVITE: {
        httpCode: 400,
        name: 'RAS-00005',
        message: 'This user already invited to join room.',
    },
    ADD_TO_ROOM__SUCCESS_SENT_INVITE: {
        httpCode: 200,
        name: 'RAS-00006',
        message: 'Successful to invite this user to join this message room.',
    },
    ADD_TO_ROOM__SUCCESS_JOIN_ROOM: {
        httpCode: 200,
        name: 'RAS-00007',
        message: 'Successful joining this message room.',
    },
    ADD_TO_ROOM__INVITE_USERS: {
        httpCode: 200,
        name: 'RAS-00008',
        message: 'The progress inviting users successfully.',
    },
    CREATE_ROOM__CREATE_SUCCESS: {
        httpCode: 200,
        name: 'RAS-00009',
        message: `Create room success at ${Date.now()}!`,
    },
    GET_ROOM__FAILED: {
        httpCode: 400,
        name: 'RAS-00010',
        message: 'Room not found!',
    },
    ADD_TO_ROOM__CANNOT_ADD_TO_ONE_ONE_ROOM: {
        httpCode: 400,
        name: 'RAS-00011',
        message: 'This room is a 1-1 room! You cannot add more than one people.',
    },
};
const FRIEND_ACTION_STATUS = {
    ADD_FRIEND__INVALID_PARAMS: {
        httpCode: 400,
        name: 'FAS-00000',
        message: 'Add friend with invalid params or missing params.',
    },
    ADD_FRIEND__NOT_ALLOW: {
        httpCode: 405,
        name: 'FAS-00001',
        message: 'This user not allow sent friend request.',
    },
    ADD_FRIEND__MISSING_PARAMS: {
        httpCode: 400,
        name: 'FAS-00002',
        message: 'Add friend with invalid params or missing params.',
    },
    ADD_FRIEND__SELF_ADD_FRIEND: {
        httpCode: 400,
        name: 'FAS-00003',
        message: 'You cannot add friend yourself.',
    },
    ADD_FRIEND__ALREADY_FRIEND: {
        httpCode: 400,
        name: 'FAS-00004',
        message: 'You cannot send add friend to other who is already friends.',
    },
    ADD_FRIEND__ALREADY_REQUEST: {
        httpCode: 400,
        name: 'FAS-00005',
        message: 'You already sent request for this user.',
    },
    ADD_FRIEND__ACCEPT_REQUEST_SUCCESS: {
        httpCode: 200,
        name: 'FAS-00006',
        message: 'Successfully accepted friend request from other.',
    },
    ADD_FRIEND__CREATE_REQUEST_SUCCESS: {
        httpCode: 200,
        name: 'FAS-00007',
        message: 'Successfully sent a friend request to other.',
    },
    GET_FRIEND__GET_FRIEND_LIST_SUCCESS: {
        httpCode: 200,
        name: 'FAS-00008',
        message: 'Successfully get friend list.',
    },
    GET_FRIEND__INVALID_PARAMS: {
        httpCode: 400,
        name: 'FAS-00009',
        message: 'Get friend list with invalid params or missing params.',
    },
};
/**
 * @returns Return user status
 */
const USER_STATUS = {
    USER__UNDEFINED: {
        httpCode: 404,
        name: 'US-00000',
        message: 'This user was removed or banned.',
    },
    USER__TEMP_BANNED: {
        httpCode: 404,
        name: 'US-00001',
        message: 'This user was removed or banned.',
    },
    USER__FOREVER_BANNED: {
        httpCode: 404,
        name: 'US-00002',
        message: 'This user was removed or banned.',
    },
    USER__REMOVED: {
        httpCode: 404,
        name: 'US-00003',
        message: 'This user was removed or banned.',
    },
    USER__GET_OK: {
        httpCode: 200,
        name: 'US-00004',
        message: 'Success.',
    },
    USER__UNAUTHORIZED: {
        httpCode: 401,
        name: 'US-00005',
        message: 'Unauthorized!',
    },
};
/**
 * @returns Return server status
 */
const SERVER_STATUS = {
    SERVER__DEFAULT_ERROR: {
        httpCode: 500,
        name: 'SYS-:00000',
        message:
            'Server is busy! Please wait a minute to try again or you can report this to help center. Thank you <3',
    },
    SERVER__DIFF_VERSION: {
        httpCode: 400,
        name: 'SYS-00001',
        message: 'Version is old, use the new version api.',
    },
};
module.exports = {
    USER_STATUS,
    SERVER_STATUS,
    FRIEND_ACTION_STATUS,
    ROOM_ACTION_STATUS,
};
