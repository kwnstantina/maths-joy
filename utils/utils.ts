export const dateFormat=(date:string)=>{
    if(!date){
        return Date.now();
    }
    let formatDate = new Date(date);
    return formatDate.getDate() + '/' + (formatDate.getMonth()+1) + '/' +formatDate.getFullYear();
}