const checkMembersPresentInDatabase = (membersList) => {
    const foundMembers = [];
    const notFoundMembers = [];

    for (let i = 0; i < membersList.length; i++) {
        const currEmail = membersList[i];
        const foundMail = User.findOne(currEmail)
        if (foundMail) {
            foundMembers.push(currEmail);
        } else {
            notFoundMembers.push(currEmail)
        }
    }

    // membersList.forEach((currEmail) => {
    //     const foundMail = User.findOne(currEmail)
    //     if (foundMail) {
    //         foundMembers.push(currEmail);
    //     } else {
    //         notFoundMembers.push(currEmail)
    //     }
    // });



}

exports.checkValueInArray = (value, array) => {
    let flag = false;
    for (let i = 0; i < array.length; i++) {
        const valueType = typeof (value);
        if (valueType === 'object') {
            if (array[i].equals(value)) {
                flag = true;
                break;
            }
        } else {
            if (array[i] === value) {
                flag = true;
                break;
            }
        }
    }

    if(!flag) {
        array.push(value);
    }

    return array;
}