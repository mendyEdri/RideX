module.exports = function(input) {
  var url = '/geo?input=' + input;
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
