const generateUserId = (prefix) => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${randomStr}`;
};

module.exports = {
    generateUserId
};
