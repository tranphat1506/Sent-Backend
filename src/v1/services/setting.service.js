// This rule is check other user can add user to room
const isAllowAddToRoom = (userSettings, relationshipOfOther, byPass = false) => {
    if (byPass) return true;
    if (!userSettings || !relationshipOfOther) return false;
    const rule = userSettings['allow_add_to_room'];
    if (rule === 'everyone') return true;
    else if (rule === 'friend' && relationshipOfOther === rule) return true;
    else return false;
};

// This rule is check if user need to accept other request add to join the room
const isNeedToAcceptToJoinRoom = (userSettings, relationshipOfOther, byPass = false) => {
    if (byPass) return false;
    if (!userSettings || !relationshipOfOther) return false;
    const rule = userSettings['need_accept_request_join_room'];
    // Logic of this rule is only use for stranger and everyone
    if (rule === 'everyone') return true;
    else if (rule === 'stranger' && relationshipOfOther === rule) return true;
    else return false;
};

const isMyFriend = (isInFriendList = false, cvt2String = true) => {
    if (isInFriendList) return cvt2String ? 'friend' : true;
    return cvt2String ? 'stranger' : false;
};

// This rule is check other user can add user to room
const isAllowAddFriend = (userSettings) => {
    if (!userSettings) return false;
    const rule = userSettings['allow_add_friend'];
    return rule;
};

module.exports = {
    isAllowAddToRoom,
    isMyFriend,
    isNeedToAcceptToJoinRoom,
    isAllowAddFriend,
};
