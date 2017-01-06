module.exports = function(input) {
  var url = 'https://mendy-edri-server.herokuapp.com/geo?input=' + input;
  return fetch(url, {
    method: 'GET',
  })
  .then((response) => response.json())
  .then((json) => {
    return {
      result: json
    }
  })
  .catch((error) => {
    return {
      error: error
    }
  });
}
