module.exports = function(origin, destination) {
  return fetch('https://mendy-edri-server.herokuapp.com/api/arrivalTime', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
	    origin: origin,
      destination: destination
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
