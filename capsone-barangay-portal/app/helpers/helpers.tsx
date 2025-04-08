
const getLocalDateString = (d: Date) =>{
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}


const isPastDate = (date: string) => {
    const getLocalDateString = (d: Date) =>
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    const today = getLocalDateString(new Date());
    const inputDate = getLocalDateString(new Date(date));

    return inputDate < today; // true if date is in the past
};

const isFutureDate = (date: string) => {
    const getLocalDateString = (d: Date) =>
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    const today = getLocalDateString(new Date());
    const inputDate = getLocalDateString(new Date(date));

    return inputDate < today; // true if date is in the past
};


const isToday = (date: string) => {
    const input = new Date(date);
    const now = new Date();

    return (
        input.getFullYear() === now.getFullYear() &&
        input.getMonth() === now.getMonth() &&
        input.getDate() === now.getDate()
    );
};

const isPastOrCurrentTime = (time: string) => {
    const now = new Date();
    const [inputHours, inputMinutes] = time.split(':').map(Number);

    const inputTotalMinutes = inputHours * 60 + inputMinutes;
    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return inputTotalMinutes <= nowTotalMinutes;
};




export {isPastDate,isToday,isPastOrCurrentTime,isFutureDate,getLocalDateString }