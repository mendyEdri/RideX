module.exports = function(userId, locationString) {
  return fetch('https://mendy-edri-server.herokuapp.com/api/ride/requestRide', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
	    locationString: locationString
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
