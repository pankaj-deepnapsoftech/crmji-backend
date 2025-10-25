const getDateDifference = (date1, date2)=>{
    if(date1 > date2){
        [date1, date2] = [date2, date1];
    }

    const difference = date2 - date1;

    return Math.ceil(difference / (1000*60*60*24));
}

module.exports = getDateDifference;