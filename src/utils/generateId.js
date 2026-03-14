const generateUserId = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `USR${randomStr}`;
};

module.exports = {
    generateUserId
};
