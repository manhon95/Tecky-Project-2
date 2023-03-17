let date = new Date()
let getYear = date.getYear()+1900
let selectYearDropDown = document.getElementById("selectYearDropDown")
let selectMonthDropDown = document.getElementById("selectMonthDropDown")


for(let y = getYear; y >= 1900; y--){
    let createYear = document.createElement("option")
    createYear.value = y
    createYear.text = y
    selectYearDropDown.appendChild(createYear)
}
for(let y = 1; y <= 12; y++){
    let createMonth = document.createElement("option")
    createMonth.value = y
    createMonth.text = y
    selectMonthDropDown.appendChild(createMonth)
}