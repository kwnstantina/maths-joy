export const dateFormat = (date: string) => {
  if (!date) {
    return Date.now();
  }
  let formatDate = new Date(date);
  return (
    formatDate.getDate() +
    "/" +
    (formatDate.getMonth() + 1) +
    "/" +
    formatDate.getFullYear()
  );
};

export const dateTimeFormat = (dateTime: string) => {
  let currentdate = new Date(dateTime);
  let hours = currentdate.getHours();
  let minutes = currentdate.getMinutes() as any;
  let ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  let strTime = hours + ":" + minutes + ampm;

  return (
    currentdate.getMonth() +
    1 +
    "/" +
    currentdate.getDate() +
    "/" +
    currentdate.getFullYear() +
    " " +
    strTime
  );
};

export const starterLetters = (firstName: string, lastName: string) => {
  return firstName[0] + "" + lastName[0] ?? "A";
};

export const separateLatterMaths = (str: string) => {
  const myRex = /^[α-ωΑ-Ω\s]/gm;
  const greekWithTonesRegex = /[\u0386-\u03AC\u1F00-\u1FBC]/g;
  const isLetter = greekWithTonesRegex.test(str) || myRex.test(str);
  return isLetter;
};

export const groupBy = (array: Array<any>, keyFunc: CallableFunction) => {
  return array.reduce((result, item) => {
    const key = keyFunc(item);
    if (!result[key]) {
      result[key] = [];
    }
    if (!result[key].some((i: any) => isEqual(i, item))) {
      result[key].push(item);
    }
    return result;
  }, {});
};

export const isEqual = (a: any, b: any) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};


export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const arrayOfColors =()=>{
const colors= ["#ff643e","#fc35a0","#f96e77",'#f5d300','#7777ff','#08f7fe'];
const randomIndex = Math.floor(Math.random() * colors.length);
return colors[randomIndex];
}