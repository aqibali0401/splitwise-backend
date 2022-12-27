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



};

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


// ashwani functions
// Capitalize the string
exports.Capitalize = (input) => {  
    var words = input.split(' ');  
    var CapitalizedWords = [];  
    words.forEach(element => {  
        CapitalizedWords.push(element[0].toUpperCase() + element.slice(1, element.length));  
    });  
    return CapitalizedWords.join(' ');  
} ;

// Calculate time difference in minutes
exports.calcTimeDiffMin = (storedDate) => {
    const currentDate = new Date();
    storedDate = new Date(storedDate);
    // console.log("DB:" + storedDate);
    // console.log("Current:" + currentDate);
    // To calculate the time difference of two dates in milliseconds
    var diffMs = currentDate.getTime() - storedDate.getTime();
      
    // To calculate the no. of days between two dates
    // var diffDays = Math.floor(diffMs / (1000 * 3600 * 24));

    let diffMinutes = Math.floor(diffMs / 60000);

    return diffMinutes;
}

// Function to check whether a given value exists in array or not
exports.removeDuplicates = async (array, type) => {

    if(type==="object") {
        array = array.filter((value, index) => {
            const _value = JSON.stringify(value);
            return index === array.findIndex(obj => {
              return JSON.stringify(obj) === _value;
            });
          });
    } else {
        array = [...new Set(array)];
    }
    return array;
};

 