export const dateFormat = (date:string)=> {
    if(!date){
        return Date.now();
    }
    let formatDate = new Date(date);
    return formatDate.getDate() + '/' + (formatDate.getMonth()+1) + '/' +formatDate.getFullYear();
}


export const dateTimeFormat = (dateTime:string) => {
let  currentdate = new Date(dateTime); 
let hours = currentdate.getHours();
let minutes = currentdate.getMinutes() as any;
let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
let strTime = hours + ':' + minutes  + ampm;

return currentdate.getMonth()+1 + "/" + currentdate.getDate() + "/" + currentdate.getFullYear() + " " + strTime;
}