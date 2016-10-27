var fetch = require('node-fetch');

module.exports = function(email, password) {
  return fetch('http://localhost:4000/api/login', {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json'
   },
   body: JSON.stringify({email: 'mendy@talenttribe.com', password: '102030'})
 })
 .then((response) => response.json())
 .then((json) => {
   return {
     result: json
   };
 })
 .catch((error) => {
   return {
     error
   }
 });
}
