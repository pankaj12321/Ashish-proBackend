const generateResponse = (success, message, user, token = null) => {
    const userInfo = user ? {
        id: user._id,
        userId: user.userId,
        userName: user.name,
        mobile: user.mobileNo,
        role: user.role
    } : null;

    const response = {
        success,
        message,
    };

    if (userInfo) response.userInfo = userInfo;
    if (token) response.token = token;

    return response;
};

module.exports = {
    generateResponse
};
