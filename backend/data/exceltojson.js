const xlsx = require('xlsx');
const fs = require('fs');

// Read your Excel file
const workbook = xlsx.readFile('LakeData.xlsx');
const sheet_name = workbook.SheetNames[0]; // Assuming the data is in the first sheet
const sheet = workbook.Sheets[sheet_name];

// Convert the sheet into JSON
const jsonData = xlsx.utils.sheet_to_json(sheet);

// Save the JSON data to a file
fs.writeFileSync('lakes_data.json', JSON.stringify(jsonData, null, 2));

console.log(jsonData);
