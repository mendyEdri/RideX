module.exports = function(geo) {
  return fetch('https://mendy-edri-server.herokuapp.com/api/arrivalTime', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
	    location: geo
    })
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
