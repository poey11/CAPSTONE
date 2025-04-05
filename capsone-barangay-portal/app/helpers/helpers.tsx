

// Check if the date is after today
// This function checks if the input date is after the current date
// If the input date is before today, it returns false, otherwise true

const dateHelper = (date: string) => {
    console.log(date);

    const getLocalDateString = (d: Date) =>
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    const today = getLocalDateString(new Date());
    console.log("Today (local):", today);

    const inputDate = getLocalDateString(new Date(date));
    console.log("Input Date (local):", inputDate);

    return inputDate >= today; // true if today or future
}

const timeHelper = (time: string) => {
    console.log("Input time string:", time);

    const now = new Date();
    const nowTime = now.getHours().toString().padStart(2, '0') + ':' +
                    now.getMinutes().toString().padStart(2, '0');

    console.log("Now (local):", nowTime);

    // parse input time
    const [inputHours, inputMinutes] = time.split(':').map(Number);
    const inputTotalMinutes = inputHours * 60 + inputMinutes;

    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    console.log("Input total minutes:", inputTotalMinutes);
    console.log("Now total minutes:", nowTotalMinutes);

    return inputTotalMinutes >= nowTotalMinutes;
}


// const timeHelper = (time: string) => {
//     const now = new Date();
//     const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

//     const [hours, minutes, seconds] = time.split(':').map(Number);
//     const inputSeconds = hours * 3600 + minutes * 60 + (seconds || 0); // default to 0 if seconds not provided

//     console.log("Now (seconds since midnight):", nowSeconds);
//     console.log("Input Time (seconds since midnight):", inputSeconds);

//     return inputSeconds >= nowSeconds;
// }
export { dateHelper,timeHelper };