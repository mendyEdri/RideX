module.exports = function(geo) {
  return fetch('https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' + geo + '&types=geocode&key=AIzaSyDMV69WkmHWjQM9KZ7Ugo293B0mZ_4UrhA', {
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
