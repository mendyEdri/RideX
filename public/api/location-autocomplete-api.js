module.exports = function(geo) {
  return fetch('/geo?input=' + geo, {
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
      error
    }
  });
}
